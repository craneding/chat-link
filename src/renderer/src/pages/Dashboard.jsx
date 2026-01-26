import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const navigate = useNavigate()
  const [isRunning, setIsRunning] = useState(true)
  const [stats, setStats] = useState({ total: 0, rate: '100%' })
  const [recentActivity, setRecentActivity] = useState([])

  const loadData = async () => {
    try {
      const config = await window.api.getConfig('forwarding')
      setIsRunning(!!config)

      const s = await window.api.getStats()
      setStats(s)

      const history = await window.api.getHistory()
      setRecentActivity(history.slice(0, 5)) // Top 5
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    }
  }

  React.useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 5000) // Refresh every 5s
    return () => clearInterval(timer)
  }, [])

  const handleToggle = async () => {
    const newState = !isRunning
    setIsRunning(newState)
    await window.api.toggleService(newState)
  }

  return (
    <>
      <header className="h-[52px] border-b border-white/5 bg-macos-bg/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <h1 className="font-bold text-base text-white tracking-tight">概览</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-success animate-pulse' : 'bg-danger'}`}
            ></div>
            <span className="text-[11px] font-medium text-secondary-text">
              {isRunning ? '已连接' : '已停止'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Service Status Card */}
          <div className="bg-macos-card rounded-xl border border-white/10 p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent opacity-50"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(10,132,255,0.3)]">
                  <span className="material-symbols-outlined text-2xl">dataset_linked</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-0.5">服务状态</h2>
                  <p className="text-sm text-secondary-text">
                    正在监控{' '}
                    <code className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono text-gray-300">
                      chat.db
                    </code>{' '}
                    并转发至钉钉机器人
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-medium transition-colors ${isRunning ? 'text-success' : 'text-secondary-text'}`}
                >
                  {isRunning ? '运行中' : '已停止'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isRunning}
                    onChange={handleToggle}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success shadow-inner"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stats Card 1 */}
            <div className="bg-macos-card rounded-xl border border-white/10 p-5 shadow-sm hover:border-white/20 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <span className="material-symbols-outlined">mark_chat_unread</span>
                </div>
                {/* <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded">+12%</span> */}
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-white tracking-tight">{stats.total}</span>
                <span className="text-sm text-secondary-text mt-1">今日处理消息</span>
              </div>
            </div>

            {/* Stats Card 2 */}
            <div className="bg-macos-card rounded-xl border border-white/10 p-5 shadow-sm hover:border-white/20 transition-all flex justify-between items-center relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
              <div className="flex flex-col z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                </div>
                <span className="text-3xl font-bold text-white tracking-tight">{stats.rate}</span>
                <span className="text-sm text-secondary-text mt-1">转发成功率</span>
              </div>
              <div className="relative w-20 h-20 z-10">
                <svg className="transform -rotate-90 w-20 h-20">
                  <circle
                    className="text-white/5"
                    cx="40"
                    cy="40"
                    fill="transparent"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="8"
                  ></circle>
                  <circle
                    className="text-primary"
                    cx="40"
                    cy="40"
                    fill="transparent"
                    r="32"
                    stroke="currentColor"
                    strokeDasharray="201.06"
                    strokeDashoffset="2"
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">bolt</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <h3 className="text-base font-semibold text-white">最近活动</h3>
              <button
                onClick={() => navigate('/forwarding-history')}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                查看全部
              </button>
            </div>
            <div className="bg-macos-card rounded-xl border border-white/10 divide-y divide-white/5 shadow-sm overflow-hidden">
              {recentActivity.length === 0 ? (
                <div className="p-6 text-center text-secondary-text text-sm">暂无活动记录</div>
              ) : (
                recentActivity.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-white/[0.02] transition-colors flex items-center gap-4 group"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shadow-md">
                        <span className="material-symbols-outlined text-lg opacity-70">person</span>
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-macos-card ${item.status === 'success' ? 'bg-success' : 'bg-danger'}`}
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-medium text-white truncate">{item.sender}</p>
                        <span className="text-[11px] text-secondary-text font-mono truncate">
                          {item.time.split(' ')[1] || item.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-secondary-text truncate max-w-[300px]">
                          {item.content}
                        </p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${item.status === 'success' ? 'bg-success/20 text-success border-success/20' : 'bg-danger/20 text-danger border-danger/20'}`}
                          >
                            {item.status === 'success' ? '已转发' : '失败'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
