import React, { useState } from 'react'

const DingTalkConfig = () => {
  const [webhook, setWebhook] = useState('')
  const [secret, setSecret] = useState('')
  const [isForwarding, setIsForwarding] = useState(true)
  const [isSilent, setIsSilent] = useState(false)
  const [rule, setRule] = useState('all')
  const [loading, setLoading] = useState(false) // For save/test actions
  const [message, setMessage] = useState({ type: '', text: '' })

  React.useEffect(() => {
    const loadConfig = async () => {
      const configWebhook = await window.api.getConfig('webhook')
      const configSecret = await window.api.getConfig('secret')
      const configRules = (await window.api.getConfig('rules')) || {}

      setWebhook(configWebhook || '')
      setSecret(configSecret || '')
      // Default forwarding state
      const forwarding = await window.api.getConfig('forwarding')
      setIsForwarding(forwarding === undefined ? true : forwarding)

      setIsSilent(configRules.silent || false)
      setRule(configRules.type || 'all')
    }
    loadConfig()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      await window.api.setConfig('webhook', webhook)
      await window.api.setConfig('secret', secret)
      await window.api.setConfig('forwarding', isForwarding)
      await window.api.setConfig('rules', {
        silent: isSilent,
        type: rule
      })
      // Update service status if forwarding changed
      await window.api.toggleService(isForwarding)

      setMessage({ type: 'success', text: '设置已保存' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: '保存失败: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    if (!webhook) {
      setMessage({ type: 'error', text: '请输入 Webhook 地址' })
      return
    }
    setLoading(true)
    setMessage({ type: 'info', text: '正在测试连接...' })
    try {
      const result = await window.api.testWebhook({ webhook, secret })
      if (result.success) {
        setMessage({ type: 'success', text: '连接测试成功！' })
      } else {
        setMessage({ type: 'error', text: '测试失败: ' + (result.error || 'Unknown error') })
      }
    } catch (err) {
      setMessage({ type: 'error', text: '测试异常: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="h-[52px] border-b border-white/5 bg-macos-bg/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <h1 className="font-bold text-base text-white tracking-tight">钉钉设置</h1>
        <div className="flex items-center gap-2">
          {message.text && (
            <div
              className={`text-[11px] px-2 py-0.5 rounded border ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : message.type === 'error' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-primary/10 border-primary/20 text-primary'}`}
            >
              {message.text}
            </div>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-lg">robot_2</span>
                <h3 className="text-sm font-semibold text-white">Webhook 配置</h3>
              </div>
              <div className="space-y-4 bg-macos-card/50 p-6 rounded-2xl border border-white/5">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-secondary-text ml-1">
                    Webhook 地址
                  </label>
                  <input
                    className="w-full bg-black/40 border-white/10 rounded-lg py-2 px-3 text-[13px] text-white placeholder:text-white/20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                    type="text"
                    value={webhook}
                    onChange={(e) => setWebhook(e.target.value)}
                  />
                  <p className="text-[11px] text-secondary-text/60 ml-1">
                    在钉钉群设置中添加“自定义机器人”获取该链接
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-secondary-text ml-1">
                    安全密钥 (Optional)
                  </label>
                  <input
                    className="w-full bg-black/40 border-white/10 rounded-lg py-2 px-3 text-[13px] text-white placeholder:text-white/20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="SEC..."
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                  />
                  <p className="text-[11px] text-secondary-text/60 ml-1">
                    机器人安全设置中勾选“加签”并复制密钥 (暂未启用签名校验，仅作为配置保存)
                  </p>
                </div>
              </div>
            </section>
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-lg">tune</span>
                <h3 className="text-sm font-semibold text-white">转发规则</h3>
              </div>
              <div className="bg-macos-card/50 p-1 rounded-2xl border border-white/5 divide-y divide-white/5">
                <div className="flex items-center justify-between p-4 px-5">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-white">启用转发</span>
                    <span className="text-[11px] text-secondary-text">
                      开启后 iMessage 将自动同步至钉钉
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isForwarding}
                      onChange={() => setIsForwarding(!isForwarding)}
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success shadow-inner"></div>
                  </label>
                </div>
              </div>
            </section>
          </div>
          <div className="mt-12 flex items-center justify-between gap-4 pt-6 border-t border-white/5">
            <button
              onClick={handleTest}
              disabled={loading || !webhook}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-white ${loading || !webhook ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-lg">{loading ? 'sync' : 'bolt'}</span>
              {loading ? 'Testing...' : '测试连接'}
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex items-center gap-2 px-10 py-2.5 rounded-xl bg-primary hover:bg-primary/90 transition-all text-sm font-bold text-white shadow-lg shadow-primary/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Saving...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default DingTalkConfig
