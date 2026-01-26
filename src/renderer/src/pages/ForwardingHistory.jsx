import React from 'react'

const ForwardingHistory = () => {
  const [history, setHistory] = React.useState([])
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const data = await window.api.getHistory()
      setHistory(data)
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchHistory()
    // Optional: Auto-refresh or listen for updates
    const timer = setInterval(fetchHistory, 5000)
    return () => clearInterval(timer)
  }, [])

  const filteredHistory = history.filter(
    (item) =>
      item.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleClearHistory = async () => {
    if (confirm('确定要清空所有转发日志吗？此操作无法撤销。')) {
      await window.api.clearHistory()
      fetchHistory()
    }
  }

  return (
    <>
      <header className="h-[52px] border-b border-white/5 bg-macos-bg/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <h1 className="font-bold text-base text-white tracking-tight">转发日志</h1>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary-text text-[18px]">
              search
            </span>
            <input
              className="bg-white/5 border-none rounded-md pl-9 pr-3 py-1 text-[12px] w-48 focus:ring-1 focus:ring-primary/50 text-white placeholder-secondary-text transition-all focus:w-64 focus:outline-none"
              placeholder="搜索发送者或内容..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-secondary-text transition-colors">
                        <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    </button> */}
          <button
            onClick={handleClearHistory}
            className="h-7 px-3 flex items-center justify-center rounded-md hover:bg-danger/20 text-danger text-xs transition-colors border border-transparent hover:border-danger/20"
          >
            清空日志
          </button>
          <button
            onClick={fetchHistory}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-secondary-text transition-colors"
            title="刷新"
          >
            <span className="material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}">
              refresh
            </span>
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-[140px_160px_1fr_100px] gap-4 px-6 py-3 bg-white/[0.02] border-b border-white/5 text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
          <div>时间</div>
          <div>发送者</div>
          <div>消息内容</div>
          <div className="text-right">状态</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-secondary-text">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-30">
                history_toggle_off
              </span>
              <p className="text-sm">暂无日志记录</p>
            </div>
          ) : (
            filteredHistory.map((item, index) => (
              <div
                key={item.id || index}
                className="grid grid-cols-[140px_160px_1fr_100px] gap-4 px-6 py-4 items-center border-b border-white/5 hover:bg-white/[0.03] transition-colors"
              >
                <div className="text-[12px] font-mono text-secondary-text">{item.time}</div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[14px] text-gray-400">
                      person
                    </span>
                  </div>
                  <span className="text-[13px] font-medium text-white truncate" title={item.sender}>
                    {item.sender}
                  </span>
                </div>
                <div
                  className="text-[13px] text-gray-400 truncate flex items-center gap-1.5"
                  title={item.content}
                >
                  {item.content}
                </div>
                <div className="text-right">
                  {item.status === 'success' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success border border-success/20">
                      转发成功
                    </span>
                  ) : (
                    <div className="group relative inline-block">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-danger/10 text-danger border border-danger/20 cursor-help">
                        转发失败
                      </span>
                      {/* Tooltip for error */}
                      {item.error && (
                        <div className="absolute right-0 bottom-full mb-1 w-48 bg-gray-800 border border-white/10 text-white text-[10px] p-2 rounded shadow-xl hidden group-hover:block z-50 break-words">
                          {item.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <footer className="h-10 px-6 border-t border-white/5 flex items-center justify-between shrink-0 bg-macos-bg/80">
          <div className="flex items-center gap-4 text-[11px] text-secondary-text">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span>系统正常</span>
            </div>
            <div className="w-px h-3 bg-white/10"></div>
            <span>共计 {history.length.toLocaleString()} 条记录</span>
          </div>
          {/* <div className="flex items-center gap-1 text-[11px] text-secondary-text">
                        <span>最后同步时间: {new Date().toLocaleTimeString()}</span>
                    </div> */}
        </footer>
      </div>
    </>
  )
}

export default ForwardingHistory
