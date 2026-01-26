import { app } from 'electron'
import { join } from 'path'
import { appendFileSync, readFileSync, existsSync, writeFileSync, statSync } from 'fs'

class Logger {
  constructor() {
    const userDataPath = app.getPath('userData')
    this.logPath = join(userDataPath, 'app.log')
    this.maxSize = 5 * 1024 * 1024 // 5MB max log size
    this.maxLines = 1000 // Max lines to return when reading

    // Rotate log if too large
    this.rotateIfNeeded()

    // Override console methods to capture all logs
    this.overrideConsole()
  }

  rotateIfNeeded() {
    try {
      if (existsSync(this.logPath)) {
        const stats = statSync(this.logPath)
        if (stats.size > this.maxSize) {
          // Keep last half of the file
          const content = readFileSync(this.logPath, 'utf-8')
          const lines = content.split('\n')
          const halfLines = lines.slice(Math.floor(lines.length / 2))
          writeFileSync(this.logPath, halfLines.join('\n'))
        }
      }
    } catch (e) {
      // Ignore rotation errors
    }
  }

  overrideConsole() {
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalInfo = console.info

    console.log = (...args) => {
      this.write('INFO', args)
      originalLog.apply(console, args)
    }

    console.error = (...args) => {
      this.write('ERROR', args)
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      this.write('WARN', args)
      originalWarn.apply(console, args)
    }

    console.info = (...args) => {
      this.write('INFO', args)
      originalInfo.apply(console, args)
    }
  }

  formatMessage(args) {
    return args
      .map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      })
      .join(' ')
  }

  write(level, args) {
    try {
      const timestamp = new Date().toISOString()
      const message = this.formatMessage(args)
      const logLine = `[${timestamp}] [${level}] ${message}\n`
      appendFileSync(this.logPath, logLine)
    } catch (e) {
      // Silently fail if we can't write logs
    }
  }

  getLogs(lineCount = 200) {
    try {
      if (!existsSync(this.logPath)) {
        return []
      }

      const content = readFileSync(this.logPath, 'utf-8')
      const lines = content.split('\n').filter((line) => line.trim())

      // Return last N lines, newest first
      const result = lines.slice(-Math.min(lineCount, this.maxLines)).reverse()

      return result.map((line) => {
        // Parse log line: [timestamp] [level] message
        const match = line.match(/^\[([^\]]+)\] \[([^\]]+)\] (.*)$/)
        if (match) {
          return {
            timestamp: match[1],
            level: match[2],
            message: match[3]
          }
        }
        return {
          timestamp: '',
          level: 'INFO',
          message: line
        }
      })
    } catch (e) {
      return [
        {
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: `Failed to read logs: ${e.message}`
        }
      ]
    }
  }

  clearLogs() {
    try {
      writeFileSync(this.logPath, '')
      return true
    } catch (e) {
      return false
    }
  }

  getLogPath() {
    return this.logPath
  }
}

let loggerInstance = null

export function initLogger() {
  if (!loggerInstance) {
    loggerInstance = new Logger()
  }
  return loggerInstance
}

export function getLogger() {
  return loggerInstance
}
