import { net } from 'electron'
import crypto from 'crypto'

export class ForwardingService {
  constructor(db, store) {
    this.db = db
    this.store = store
    this.timer = null
    // Initialize lastProcessedId from store to avoid re-forwarding on restart
    this.lastMessageId = this.store.get('lastMessageId', 0)

    // If it's 0 (fresh install), let's try to set it to the latest message ID so we don't dump all history
    if (this.lastMessageId === 0 && this.db.checkPermission()) {
      const maxId = this.db.getMaxMessageId()
      if (maxId > 0) {
        this.lastMessageId = maxId
        this.store.set('lastMessageId', this.lastMessageId)
        console.log('Initialized lastMessageId to Max ID:', this.lastMessageId)
      } else {
        console.warn('Failed to initialize lastMessageId: Max ID is 0')
      }
    }

    this.permissionWarned = false
  }

  start() {
    this.stop()
    const rawInterval = this.store.get('scanInterval', 5)
    // Ensure minimum 1 second interval
    const interval = Math.max(1, Number(rawInterval) || 5) * 1000

    console.log(`Starting forwarding service, interval: ${interval}ms`)
    this.timer = setInterval(() => this.scan(), interval)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      console.log('Stopped forwarding service')
    }
  }

  scan() {
    // console.log('Scanning...') // Verbose
    if (!this.store.get('forwarding', true)) {
      // console.log('Forwarding disabled in config') // Verbose
      return
    }

    console.log(`[Service] Scan started. lastMessageId=${this.lastMessageId}`)

    // Check permission logic
    const hasPermission = this.db.checkPermission()
    if (!hasPermission) {
      if (!this.permissionWarned) {
        console.warn(
          'Scan skipped: No DB permission. Please grant Full Disk Access and RESTART the app.'
        )
        this.permissionWarned = true
      }
      return
    }

    if (this.permissionWarned) {
      console.log('DB permission granted.')
      this.permissionWarned = false
      // Re-initialize ID if needed
      if (this.lastMessageId === 0) {
        const maxId = this.db.getMaxMessageId()
        if (maxId > 0) {
          this.lastMessageId = maxId
          this.store.set('lastMessageId', this.lastMessageId)
          console.log('Permission granted. Initialized lastMessageId to:', this.lastMessageId)
        }
      }
    }

    try {
      const newMessages = this.db.getNewMessages(this.lastMessageId)

      if (newMessages.length > 0) {
        console.log(`Found ${newMessages.length} new messages. Last ID: ${this.lastMessageId}`)
        for (const msg of newMessages) {
          this.forward(msg)
          // Update ID locally
          if (msg.id > this.lastMessageId) {
            this.lastMessageId = msg.id
          }
        }
        // Save checkpoint
        this.store.set('lastMessageId', this.lastMessageId)
      }
    } catch (e) {
      console.error('Scan error:', e)
    }
  }

  forward(msg) {
    let webhook = this.store.get('webhook')
    const secret = this.store.get('secret')

    // Check filter rules
    const rules = this.store.get('rules', {})

    // Example filter: verification codes only
    // if (rules.verificationOnly && !isVerificationCode(msg.text)) return

    if (!webhook) {
      console.error('Skipping forward: Webhook URL is missing')
      this.saveHistory(msg, 'failed', 'Missing Webhook URL')
      return
    }

    // Add signature if secret is present
    if (secret) {
      const timestamp = Date.now()
      const stringToSign = `${timestamp}\n${secret}`
      const sign = crypto.createHmac('sha256', secret).update(stringToSign).digest('base64')

      const signUrlEncoded = encodeURIComponent(sign)
      // Check if webhook already has query params
      const separator = webhook.includes('?') ? '&' : '?'
      webhook = `${webhook}${separator}timestamp=${timestamp}&sign=${signUrlEncoded}`
    }

    // Format time
    const date = new Date(msg.timestamp).toLocaleString('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const payload = {
      msgtype: 'markdown',
      markdown: {
        title: '收到新短信',
        text:
          `### 📩 新消息 (ChatLink)\n\n` +
          `**发件人**: ${msg.sender}\n\n` +
          `**时间**: ${date}\n\n` +
          `---\n\n` +
          `> ${msg.text}`
      }
    }

    const request = net.request({
      method: 'POST',
      url: webhook,
      headers: { 'Content-Type': 'application/json' }
    })

    request.on('response', (response) => {
      let data = ''
      response.on('data', (chunk) => {
        data += chunk
      })

      response.on('end', () => {
        const success = response.statusCode >= 200 && response.statusCode < 300
        let errorInfo = `Status: ${response.statusCode}`
        let isDingSuccess = success

        try {
          const resBody = JSON.parse(data)
          console.log(`Forward response:`, resBody)

          // Check DingTalk specific error
          if (resBody.errcode && resBody.errcode !== 0) {
            isDingSuccess = false
            errorInfo = `DingTalk Error: ${resBody.errmsg} (${resBody.errcode})`
          }
        } catch (e) {
          // Ignore parse error, use raw status
        }

        console.log(
          `Forward result: ${isDingSuccess ? 'SUCCESS' : 'FAILED'}, Details: ${errorInfo}`
        )
        this.saveHistory(msg, isDingSuccess ? 'success' : 'failed', errorInfo)
      })
    })

    request.on('error', (error) => {
      console.error('Forward request error:', error)
      this.saveHistory(msg, 'failed', error.message)
    })

    request.write(JSON.stringify(payload))
    request.end()
  }

  saveHistory(msg, status, errorInfo = '') {
    const history = this.store.get('history', [])
    const entry = {
      id: msg.id, // Use message ID as key (or generate uuid if needed)
      time: new Date(msg.timestamp).toLocaleString(),
      timestamp: msg.timestamp,
      sender: msg.sender,
      content: msg.text,
      status: status,
      error: errorInfo
    }

    // Add to beginning
    history.unshift(entry)

    // Limit to 500
    if (history.length > 500) {
      history.length = 500
    }

    this.store.set('history', history)
  }

  getHistory() {
    return this.store.get('history', [])
  }

  clearHistory() {
    this.store.set('history', [])
  }

  async testConnection(webhook, secret) {
    return new Promise((resolve, reject) => {
      if (!webhook) {
        return reject(new Error('Webhook URL is required'))
      }

      const payload = {
        msgtype: 'markdown',
        markdown: {
          title: '连接测试',
          text: '### 🚀 ChatLink 连接测试\n\n**状态**: 连接成功\n\n> 这是一条测试消息，由于配置正确，您看到了它。'
        }
      }

      // Add signature if secret is present
      if (secret) {
        const timestamp = Date.now()
        const stringToSign = `${timestamp}\n${secret}`
        const sign = crypto.createHmac('sha256', secret).update(stringToSign).digest('base64')

        const signUrlEncoded = encodeURIComponent(sign)
        const separator = webhook.includes('?') ? '&' : '?'
        webhook = `${webhook}${separator}timestamp=${timestamp}&sign=${signUrlEncoded}`
      }

      try {
        const request = net.request({
          method: 'POST',
          url: webhook,
          headers: { 'Content-Type': 'application/json' }
        })

        request.on('response', (response) => {
          let data = ''
          response.on('data', (chunk) => (data += chunk))
          response.on('end', () => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
              try {
                const resBody = JSON.parse(data)
                if (resBody.errcode && resBody.errcode !== 0) {
                  reject(new Error(`DingTalk Error: ${resBody.errmsg}`))
                } else {
                  resolve({ success: true, status: response.statusCode })
                }
              } catch (e) {
                resolve({ success: true, status: response.statusCode })
              }
            } else {
              reject(new Error(`HTTP Error: ${response.statusCode}`))
            }
          })
        })

        request.on('error', (error) => {
          reject(error)
        })

        request.write(JSON.stringify(payload))
        request.end()
      } catch (e) {
        reject(e)
      }
    })
  }
}
