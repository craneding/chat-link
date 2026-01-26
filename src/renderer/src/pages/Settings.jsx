import React, { useState } from 'react'

const Settings = () => {
  const [scanInterval, setScanInterval] = useState(5)
  const [autoStart, setAutoStart] = useState(true)
  const [hideMenuIcon, setHideMenuIcon] = useState(false)
  const [dbPath, setDbPath] = useState('')
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const path = await window.api.getConfig('dbPath')
      const interval = await window.api.getConfig('scanInterval')
      const auto = await window.api.getConfig('autoStart')
      // const hideIcon = await window.api.getConfig('hideMenuIcon')

      setDbPath(path || '~/Library/Messages/chat.db')
      setScanInterval(interval || 5)
      setAutoStart(auto === undefined ? true : auto)
      // setHideMenuIcon(!!hideIcon)

      const perm = await window.api.checkPermission()
      setHasPermission(perm)
    } catch (e) {
      console.error('Failed to load settings', e)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      await window.api.setConfig('dbPath', dbPath)
      await window.api.setConfig('scanInterval', Number(scanInterval))
      await window.api.setConfig('autoStart', autoStart)
      // await window.api.setConfig('hideMenuIcon', hideMenuIcon)

      setMessage('设置已保存，部分设置重启后生效')
      setTimeout(() => setMessage(''), 3000)

      // Re-check permission if path changed
      const perm = await window.api.checkPermission()
      setHasPermission(perm)
    } catch (e) {
      setMessage('保存失败: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreDefault = () => {
    setDbPath('~/Library/Messages/chat.db')
    setScanInterval(5)
    setAutoStart(true)
  }

  return (
    <>
      <header className="h-[52px] border-b border-white/5 bg-macos-bg/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <h1 className="font-bold text-base text-white tracking-tight">系统设置</h1>
        {message && (
          <div className="text-[11px] text-success px-2 py-1 bg-success/10 rounded border border-success/20">
            {message}
          </div>
        )}
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Permissions Section */}
          <section>
            <h3 className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-4 px-1">
              权限管理
            </h3>
            <div className="bg-macos-card rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/70">
                    <span className="material-symbols-outlined">database</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">完全磁盘访问权限 (Full Disk Access)</p>
                    <p className="text-xs text-secondary-text">
                      读取 iMessage 数据库 chat.db 需要此权限
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full border ${hasPermission ? 'bg-success/10 border-success/20' : 'bg-warning/10 border-warning/20'}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${hasPermission ? 'bg-success' : 'bg-warning'}`}
                  ></div>
                  <span
                    className={`text-[11px] font-medium ${hasPermission ? 'text-success' : 'text-warning'}`}
                  >
                    {hasPermission ? '已授权' : '未授权 / 请检查'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Path Config Section */}
          <section>
            <h3 className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-4 px-1">
              路径配置
            </h3>
            <div className="bg-macos-card rounded-xl border border-white/10 p-4">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">iMessage 数据库路径</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-secondary-text focus:outline-none focus:border-primary focus:text-white transition-colors"
                    type="text"
                    value={dbPath}
                    onChange={(e) => setDbPath(e.target.value)}
                    placeholder="~/Library/Messages/chat.db"
                  />
                </div>
                <p className="text-[11px] text-secondary-text italic">
                  默认路径通常为 ~/Library/Messages/chat.db
                </p>
              </div>
            </div>
          </section>

          {/* Scan Interval Section */}
          <section>
            <h3 className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-4 px-1">
              运行参数
            </h3>
            <div className="bg-macos-card rounded-xl border border-white/10 p-5 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">扫描间隔 (秒)</label>
                  <span className="text-sm font-mono text-primary font-bold">{scanInterval}s</span>
                </div>
                <input
                  className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  max="60"
                  min="1"
                  type="range"
                  value={scanInterval}
                  onChange={(e) => setScanInterval(e.target.value)}
                />
                <div className="flex justify-between text-[10px] text-secondary-text">
                  <span>1s (极速)</span>
                  <span>30s</span>
                  <span>60s (节能)</span>
                </div>
              </div>
            </div>
          </section>

          {/* General Settings Section */}
          <section>
            <h3 className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-4 px-1">
              通用
            </h3>
            <div className="bg-macos-card rounded-xl border border-white/10 divide-y divide-white/5">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">开机自启动</p>
                  <p className="text-xs text-secondary-text">在 macOS 登录时自动运行 ChatLink</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={autoStart}
                    onChange={() => setAutoStart(!autoStart)}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success shadow-inner"></div>
                </label>
              </div>
              {/* <div className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">隐藏菜单栏图标</p>
                                    <p className="text-xs text-secondary-text">完全在后台运行，不显示顶部菜单栏</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={hideMenuIcon}
                                        onChange={() => setHideMenuIcon(!hideMenuIcon)}
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success shadow-inner"></div>
                                </label>
                            </div> */}
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-4 pb-12">
            <button
              onClick={handleRestoreDefault}
              className="px-6 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-sm font-medium transition-colors border border-white/5"
            >
              恢复默认
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-6 py-1.5 bg-primary hover:bg-primary/90 rounded-md text-sm font-medium transition-colors shadow-lg shadow-primary/20 ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Settings
