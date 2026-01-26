import React, { useState, useEffect, useRef } from 'react'

const Logs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [filter, setFilter] = useState('all') // all, info, warn, error
  const [searchQuery, setSearchQuery] = useState('')
  const logsContainerRef = useRef(null)

  const loadLogs = async () => {
    try {
      const data = await window.api.getLogs()
      setLogs(data || [])
    } catch (e) {
      console.error('Failed to load logs:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()

    let timer = null
    if (autoRefresh) {
      timer = setInterval(loadLogs, 3000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [autoRefresh])

  const handleClearLogs = async () => {
    if (window.confirm('确定要清除所有日志吗？')) {
      await window.api.clearLogs()
      setLogs([])
    }
  }

  const handleOpenLogFile = async () => {
    await window.api.openLogFile()
  }

  const filteredLogs = logs.filter((log) => {
    // Filter by level
    if (filter !== 'all' && log.level.toLowerCase() !== filter) {
      return false
    }
    // Filter by search query
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const getLevelColor = (level) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'text-red-400 bg-red-500/10'
      case 'WARN':
        return 'text-yellow-400 bg-yellow-500/10'
      case 'INFO':
      default:
        return 'text-blue-400 bg-blue-500/10'
    }
  }

  const getLevelBadge = (level) => {
    const colorClass = getLevelColor(level)
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${colorClass}`}>
        {level}
      </span>
    )
  }

  return (
    <>
      <header className="h-[52px] border-b border-white/5 bg-macos-bg/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <h1 className="font-bold text-base text-white tracking-tight">应用日志</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
                className="w-3.5 h-3.5 accent-primary"
              />
              <span className="text-[11px] text-secondary-text">自动刷新</span>
            </label>
          </div>
          <button
            onClick={loadLogs}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="刷新"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary-text">
              refresh
            </span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col p-6 md:p-8">
        <div className="max-w-5xl w-full mx-auto flex flex-col flex-1 overflow-hidden">
          {/* Filter & Search Bar */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-macos-card border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="all">全部级别</option>
                <option value="info">INFO</option>
                <option value="warn">WARN</option>
                <option value="error">ERROR</option>
              </select>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-secondary-text">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索日志..."
                  className="bg-macos-card border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-secondary-text focus:outline-none focus:border-primary transition-colors w-48"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenLogFile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors border border-white/5"
              >
                <span className="material-symbols-outlined text-[14px]">folder_open</span>
                打开日志文件
              </button>
              <button
                onClick={handleClearLogs}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs font-medium text-red-400 transition-colors border border-red-500/20"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                清除日志
              </button>
            </div>
          </div>

          {/* Logs Container */}
          <div
            ref={logsContainerRef}
            className="flex-1 bg-macos-card rounded-xl border border-white/10 overflow-hidden flex flex-col"
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-secondary-text">
                <span className="material-symbols-outlined animate-spin mr-2">
                  progress_activity
                </span>
                加载中...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-secondary-text">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                  description
                </span>
                <p className="text-sm">暂无日志记录</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-1">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-macos-card z-10">
                    <tr className="border-b border-white/5">
                      <th className="px-3 py-2 text-[10px] font-semibold text-secondary-text uppercase tracking-wider w-[160px]">
                        时间
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-secondary-text uppercase tracking-wider w-[60px]">
                        级别
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-secondary-text uppercase tracking-wider">
                        消息
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px]">
                    {filteredLogs.map((log, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-3 py-2 text-secondary-text whitespace-nowrap">
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })
                            : '-'}
                        </td>
                        <td className="px-3 py-2">{getLevelBadge(log.level)}</td>
                        <td className="px-3 py-2 text-white/80 break-all">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-secondary-text">
            <span>
              共 {filteredLogs.length} 条日志{filter !== 'all' || searchQuery ? ` (已筛选)` : ''}
            </span>
            <span>总计 {logs.length} 条</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default Logs
