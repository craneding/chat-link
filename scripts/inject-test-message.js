const Database = require('better-sqlite3')
const path = require('path')

// Target DB path from user request
const dbPath = '/Users/dinghz/Desktop/chat.db'

console.log(`Open DB: ${dbPath}`)
const db = new Database(dbPath, { verbose: console.log })

try {
  // 1. Get or create a handle (sender)
  // Let's pretend it's from "10086"
  let handleId = 0
  const getHandle = db.prepare('SELECT ROWID FROM handle WHERE id = ?')
  const insertHandle = db.prepare(
    'INSERT INTO handle (id, service, uncannonicalized_id) VALUES (?, ?, ?)'
  )

  const senderId = '+8613800138000'
  const existing = getHandle.get(senderId)

  if (existing) {
    handleId = existing.ROWID
    console.log(`Using existing handle id: ${handleId}`)
  } else {
    // service can be 'iMessage' or 'SMS'
    const info = insertHandle.run(senderId, 'SMS', senderId)
    handleId = info.lastInsertRowid
    console.log(`Created new handle id: ${handleId}`)
  }

  // 2. Insert message
  // text: content
  // date: nanoseconds since 2001-01-01
  // is_from_me: 0 (received)
  // handle_id: sender

  const MAC_EPOCH = 978307200000
  const now = Date.now()
  // Ensure we use nanoseconds (18 digits usually) - e.g., 696...
  const macTimestamp = (now - MAC_EPOCH) * 1000000

  console.log(`Current JS Time: ${now}, Mac Timestamp: ${macTimestamp}`)

  const insertMsg = db.prepare(`
    INSERT INTO message (
      guid, 
      text, 
      replace, 
      service, 
      account, 
      date, 
      date_read, 
      date_delivered, 
      is_delivered, 
      is_finished, 
      is_emote, 
      is_from_me, 
      is_empty, 
      is_delayed, 
      is_auto_reply, 
      is_prepared, 
      is_read, 
      is_system_message, 
      is_sent, 
      has_dd_results, 
      is_service_message, 
      is_forward, 
      was_downgraded, 
      is_archive, 
      cache_has_attachments, 
      cache_roomnames, 
      was_data_detected, 
      was_deduplicated, 
      is_audio_message, 
      is_played, 
      date_played, 
      item_type, 
      other_handle, 
      group_title, 
      group_action_type, 
      share_status, 
      share_direction, 
      is_expirable, 
      expire_state, 
      message_action_type, 
      message_source, 
      handle_id
    ) VALUES (
      ?, ?, 0, 'SMS', ?, ?, 0, ?, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, 0, 0, 0, ?
    )
  `)

  const guid = `TEST-${Date.now()}`
  const text = `这是一条测试短信 [${new Date().toLocaleTimeString()}]`

  // Note: Schema might vary slightly by macOS version.
  // We try to fill minimal required fields. If fails, we might need to adjust.

  const info = insertMsg.run(
    guid,
    text,
    senderId, // account
    macTimestamp,
    macTimestamp, // date_delivered
    handleId
  )

  console.log(`Inserted message ID: ${info.lastInsertRowid}`)
  console.log(`Content: ${text}`)
} catch (err) {
  console.error('Failed to insert message:', err)
} finally {
  db.close()
}
