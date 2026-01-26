import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow
let tray = null

function createTray() {
  const image = nativeImage.createFromPath(icon)
  tray = new Tray(image.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主界面',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
        } else {
          createWindow()
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('ChatLink')
  tray.setContextMenu(contextMenu)

  // Also show window on simple click (common behavior)
  tray.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        if (mainWindow.isFocused()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
          mainWindow.focus()
        }
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    } else {
      createWindow()
    }
  })
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Prevent window from being destroyed on close, just hide it
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      return false
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize Logger first to capture all console output
  const { initLogger } = await import('./logger.js')
  const logger = initLogger()
  console.log('Logger initialized at:', logger.getLogPath())

  // Initialize Modules
  const { ChatDB } = await import('./db.js')
  const store = (await import('./config.js')).default
  const { ForwardingService } = await import('./service.js')

  const chatDB = new ChatDB(store.get('dbPath'))
  const service = new ForwardingService(chatDB, store)

  // IPC Handlers
  ipcMain.handle('config:get', (_, key) => store.get(key))
  ipcMain.handle('config:set', (_, key, value) => {
    store.set(key, value)

    // Update system login item settings
    if (key === 'autoStart' && !is.dev) {
      app.setLoginItemSettings({
        openAtLogin: value,
        openAsHidden: false
      })
    }

    // Restart service if interval changed
    if (key === 'scanInterval' || key === 'dbPath') {
      service.start()
    }
  })

  ipcMain.handle('service:toggle', (_, isRunning) => {
    if (isRunning) service.start()
    else service.stop()
  })

  ipcMain.handle('stats:get', () => {
    const history = service.getHistory()
    const today = new Date().toDateString()
    const todayCount = history.filter((h) => new Date(h.timestamp).toDateString() === today).length
    const successCount = history.filter((h) => h.status === 'success').length
    const totalCount = history.length
    const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : 100

    return {
      total: todayCount,
      rate: `${successRate}%`
    }
  })

  ipcMain.handle('history:get', () => service.getHistory())
  ipcMain.handle('history:clear', () => service.clearHistory())

  ipcMain.handle('dingtalk:test', async (_, { webhook, secret }) => {
    try {
      return await service.testConnection(webhook, secret)
    } catch (e) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('app:check-permission', () => {
    chatDB.connect() // try connect
    return chatDB.checkPermission()
  })

  ipcMain.handle('dialog:open', async () => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }]
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // Log handlers
  ipcMain.handle('logs:get', () => {
    return logger.getLogs()
  })

  ipcMain.handle('logs:clear', () => {
    return logger.clearLogs()
  })

  ipcMain.handle('logs:open-file', async () => {
    const logPath = logger.getLogPath()
    await shell.showItemInFolder(logPath)
  })

  // Start service on launch if configured
  if (store.get('autoStart')) {
    chatDB.connect()
    service.start()
  }

  // Sync Login Item setting on startup (only in production)
  if (!is.dev) {
    app.setLoginItemSettings({
      openAtLogin: store.get('autoStart'),
      openAsHidden: false
    })
  }

  createWindow()
  createTray()

  // Handle dock icon click
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else if (mainWindow) mainWindow.show()
  })

  app.on('before-quit', () => {
    app.isQuitting = true
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
