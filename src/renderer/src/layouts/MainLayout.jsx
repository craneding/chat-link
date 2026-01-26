import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import AppIcon from '../assets/icon.png'

const SidebarItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
        isActive
          ? 'bg-primary text-white shadow-sm'
          : 'text-secondary-text hover:bg-white/5 hover:text-white'
      }`
    }
  >
    <span
      className={`material-symbols-outlined text-[20px] ${icon === 'dashboard' ? 'filled' : ''}`}
    >
      {icon}
    </span>
    <span className="text-[13px] font-medium">{label}</span>
  </NavLink>
)

const MainLayout = () => {
  return (
    <div className="flex h-screen w-screen bg-macos-bg text-white overflow-hidden font-display">
      <aside className="w-[240px] flex-shrink-0 glass-sidebar flex flex-col h-full relative z-20">
        <div className="h-[52px] flex items-center px-4 gap-2 title-bar-drag select-none">
          {/* User requested to remove manual window controls */}
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="mb-4 px-3">
            <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider">
              ChatLink
            </p>
          </div>

          <SidebarItem to="/" icon="dashboard" label="仪表盘" />
          <SidebarItem to="/forwarding-history" icon="description" label="转发日志" />
          <SidebarItem to="/dingtalk-config" icon="send" label="钉钉设置" />
          <SidebarItem to="/logs" icon="terminal" label="应用日志" />
          <SidebarItem to="/settings" icon="settings" label="系统设置" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <img
              src={AppIcon}
              alt="ChatLink"
              className="w-8 h-8 rounded-xl shadow-lg shadow-primary/20"
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">ChatLink</span>
              <span className="text-[10px] text-secondary-text">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full min-w-0 bg-macos-bg relative">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
