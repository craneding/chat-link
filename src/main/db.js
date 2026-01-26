import Database from 'better-sqlite3'
import { join } from 'path'
import { accessSync, constants } from 'fs'

import { homedir } from 'os'

export class ChatDB {
  constructor(path) {
    let finalPath = path
    const home = homedir()
    if (finalPath && typeof finalPath === 'string' && finalPath.startsWith('~/')) {
      finalPath = join(home, finalPath.slice(2))
    }
    this.path = finalPath || join(home, 'Library/Messages/chat.db')
    console.log('DB Path resolved to:', this.path)
    this.db = null
  }

  connect() {
    try {
      // Check read permission
      accessSync(this.path, constants.R_OK)

      this.db = new Database(this.path, { readonly: true, fileMustExist: true })
      console.log('Connected to chat.db at', this.path)
      return true
    } catch (err) {
      console.error('Failed to connect to chat.db:', err.message)
      return false
    }
  }

  checkPermission() {
    try {
      // First check if file exists and is readable
      accessSync(this.path, constants.R_OK)

      // Try to actually open the database to verify Full Disk Access
      // On macOS, accessSync may pass but SQLite open may fail without FDA
      const testDb = new Database(this.path, { readonly: true, fileMustExist: true })

      // Basic check query
      try {
        const row = testDb.prepare('SELECT MAX(ROWID) as maxId FROM message').get()
        console.log(`Permission check passed. Max Message ID in DB: ${row ? row.maxId : 'null'}`)
      } catch (err) {
        console.warn('Could not query max ID during permission check:', err.message)
      }

      testDb.close()
      return true
    } catch (e) {
      console.log('Permission check failed:', e.message)
      return false
    }
  }

  getRecentMessages(limit = 20) {
    if (!this.db && !this.connect()) return []

    try {
      // Fetch incoming messages only (is_from_me = 0)
      const query = `
        SELECT 
          message.ROWID as id,
          message.guid,
          message.text,
          message.date,
          handle.id as sender_id,
          message.is_from_me
        FROM message
        LEFT JOIN handle ON message.handle_id = handle.ROWID
        WHERE message.text IS NOT NULL AND message.is_from_me = 0
        ORDER BY message.date DESC
        LIMIT ?
      `

      const stmt = this.db.prepare(query)
      return stmt.all(limit).map(this.processMessage)
    } catch (err) {
      console.error('Error querying messages:', err)
      return []
    }
  }

  getNewMessages(lastRowId) {
    if (!this.db && !this.connect()) return []

    // If no lastRowId, don't fetch anything (first run just waiting for new)
    // OR fetch the very latest one to initialize.
    if (!lastRowId) {
      console.log('[DB] getNewMessages skipped because lastRowId is 0/null')
      return []
    }

    try {
      const query = `
            SELECT 
              message.ROWID as id,
              message.guid,
              message.text,
              message.date,
              handle.id as sender_id,
              message.is_from_me
            FROM message
            LEFT JOIN handle ON message.handle_id = handle.ROWID
            WHERE message.ROWID > ? AND message.text IS NOT NULL AND message.is_from_me = 0
            ORDER BY message.ROWID ASC
        `
      const stmt = this.db.prepare(query)
      const results = stmt.all(lastRowId)
      console.log(`[DB] getNewMessages: lastRowId=${lastRowId}, found=${results.length}`)
      if (results.length > 0) {
        console.log('[DB] First Msg:', results[0])
      }
      return results.map(this.processMessage)
    } catch (err) {
      console.error(`Error fetching new messages (lastRowId=${lastRowId}):`, err.message)
      return []
    }
  }

  getMaxMessageId() {
    if (!this.db && !this.connect()) return 0
    try {
      const row = this.db.prepare('SELECT MAX(ROWID) as maxId FROM message').get()
      return row && row.maxId ? row.maxId : 0
    } catch (e) {
      console.error('Error getting max ID:', e)
      return 0
    }
  }

  processMessage(msg) {
    // Convert Mac CoreData timestamp (nanoseconds since 2001) to Unix ms
    // 978307200 seconds is difference between 1970 and 2001
    const macEpochOffset = 978307200000
    // Check if date is likely seconds or nanoseconds. Modern macOS is nanoseconds.
    // If > 100000000000000 it's likely nanoseconds.
    let dateVal = msg.date
    if (dateVal > 100000000000000) {
      dateVal = dateVal / 1000000
    } else {
      // Older macOS might use seconds, but let's assume nanoseconds for now or seconds * 1000
      // safe fallback if it looks small
      if (dateVal < 10000000000) dateVal = dateVal * 1000
    }

    return {
      ...msg,
      timestamp: dateVal + macEpochOffset,
      sender: msg.sender_id || 'Unknown'
    }
  }
}
