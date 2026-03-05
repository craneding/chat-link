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

    const title = this.generateTitle(msg.sender, msg.text)

    const payload = {
      msgtype: 'markdown',
      markdown: {
        title,
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

  /**
   * Generate a smart title based on SMS content for push notification.
   * Extracts key info (verification codes, amounts, etc.) so users can
   * quickly see what matters in the notification bar.
   */
  generateTitle(sender, text) {
    if (!text) return `💬 ${sender}: 新消息`

    // 1. Verification code - highest priority
    const codeMatch =
      text.match(/(?:验证码|校验码|确认码|动态码|安全码|短信码)[^\d]*(\d{4,8})/i) ||
      text.match(/(?:code|verify|verification)[^\d]*(\d{4,8})/i) ||
      text.match(/(\d{4,8})[^\d]*(?:验证码|校验码|确认码|动态码|安全码|短信码)/i)
    if (codeMatch) {
      return `🔑 验证码: ${codeMatch[1]}`
    }

    // 2. Express / delivery
    if (
      /快递|快件|包裹|签收|取件|驿站|菜鸟|丰巢|中通|圆通|韵达|申通|顺丰|京东物流|极兔/.test(text)
    ) {
      const summary = text
        .replace(/【[^】]*】/g, '')
        .trim()
        .slice(0, 15)
      return `📦 快递: ${summary}`
    }

    // 3. Payment / bank transaction (extract amount)
    const amountMatch = text.match(
      /(?:支出|消费|扣款|付款|交易|刷卡|转出)[^\d]*(\d+[.,]?\d*)\s*元/i
    )
    if (amountMatch) {
      return `💰 支出: ${amountMatch[1]}元`
    }
    const incomeMatch = text.match(/(?:收入|到账|入账|转入|收款)[^\d]*(\d+[.,]?\d*)\s*元/i)
    if (incomeMatch) {
      return `💰 到账: ${incomeMatch[1]}元`
    }

    // 4. Repayment / bill reminder
    if (/还款|账单|逾期|信用卡|花呗|借呗|白条/.test(text)) {
      const billAmount = text.match(/(\d+[.,]?\d*)\s*元/)
      return billAmount ? `📋 账单: ${billAmount[1]}元` : `📋 账单提醒`
    }

    // 5. Recharge
    if (/充值|缴费|续费/.test(text)) {
      return `🔋 充值通知`
    }

    // 6. Overdue / arrears
    if (/欠费|余额不足|停机/.test(text)) {
      return `⚠️ 欠费提醒`
    }

    // 7. Travel notifications
    if (/航班|机票|登机|值机/.test(text)) {
      const flightMatch = text.match(/([A-Z\d]{2}\d{3,4})/)
      return flightMatch ? `✈️ 航班: ${flightMatch[1]}` : `✈️ 航班通知`
    }
    if (/火车|高铁|列车|车票|12306/.test(text)) {
      return `🚄 火车票通知`
    }
    if (/打车|出行|滴滴|网约车|行程/.test(text)) {
      return `🚗 出行通知`
    }

    // 8. Fallback: sender + content summary
    const cleanText = text
      .replace(/【[^】]*】/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    const summary = cleanText.length > 15 ? cleanText.slice(0, 15) + '…' : cleanText
    return `💬 ${sender}: ${summary}`
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
