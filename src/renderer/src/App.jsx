import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import DingTalkConfig from './pages/DingTalkConfig'
import ForwardingHistory from './pages/ForwardingHistory'
import Settings from './pages/Settings'
import Logs from './pages/Logs'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="forwarding-history" element={<ForwardingHistory />} />
          <Route path="dingtalk-config" element={<DingTalkConfig />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
