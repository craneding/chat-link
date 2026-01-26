#!/bin/bash
DB_PATH="/Users/dinghz/Desktop/chat.db"
TIMESTAMP=$(date +%s)
# Convert to Mac Absolute Time (seconds since 2001-01-01)
MAC_TIME=$((TIMESTAMP - 978307200))
MAC_TIME_NANO="${MAC_TIME}000000000"

GUID="TEST-$(date +%s)"
TEXT="测试短信 $(date '+%H:%M:%S')"
SENDER="+8613800138000"

# 1. Insert handle (if not exists)
sqlite3 "$DB_PATH" "INSERT OR IGNORE INTO handle (id, country, service, uncanonicalized_id) VALUES ('$SENDER', 'CN', 'SMS', '$SENDER');"

# 2. Get handle ID
HANDLE_ID=$(sqlite3 "$DB_PATH" "SELECT ROWID FROM handle WHERE id = '$SENDER';")
echo "Handle ID: $HANDLE_ID"

if [ -z "$HANDLE_ID" ]; then
    echo "Error: Could not retrieve Handle ID"
    exit 1
fi

# 3. Insert Message
# Using basic fields compatible with the schema
SQL="INSERT INTO message (guid, text, service, account, date, handle_id, is_from_me, is_finished, is_sent) VALUES ('$GUID', '$TEXT', 'SMS', '$SENDER', $MAC_TIME_NANO, $HANDLE_ID, 0, 1, 0);"

sqlite3 "$DB_PATH" "$SQL"

echo "Inserted message: $TEXT"
echo "ID: $(sqlite3 "$DB_PATH" "SELECT last_insert_rowid();")"
