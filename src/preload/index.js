import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
// Custom APIs for renderer
const api = {
  getConfig: (key) => ipcRenderer.invoke('config:get', key),
  setConfig: (key, val) => ipcRenderer.invoke('config:set', key, val),
  toggleService: (run) => ipcRenderer.invoke('service:toggle', run),
  getStats: () => ipcRenderer.invoke('stats:get'),
  checkPermission: () => ipcRenderer.invoke('app:check-permission'),
  getHistory: () => ipcRenderer.invoke('history:get'),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  testWebhook: (config) => ipcRenderer.invoke('dingtalk:test', config),
  selectFile: () => ipcRenderer.invoke('dialog:open'),
  // Log APIs
  getLogs: () => ipcRenderer.invoke('logs:get'),
  clearLogs: () => ipcRenderer.invoke('logs:clear'),
  openLogFile: () => ipcRenderer.invoke('logs:open-file')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
