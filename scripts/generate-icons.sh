#!/bin/bash
ICON_SRC="resources/icon.png"
ICON_DST_DIR="build/icon.iconset"

mkdir -p "$ICON_DST_DIR"

sips -z 16 16     "$ICON_SRC" --out "$ICON_DST_DIR/icon_16x16.png"
sips -z 32 32     "$ICON_SRC" --out "$ICON_DST_DIR/icon_16x16@2x.png"
sips -z 32 32     "$ICON_SRC" --out "$ICON_DST_DIR/icon_32x32.png"
sips -z 64 64     "$ICON_SRC" --out "$ICON_DST_DIR/icon_32x32@2x.png"
sips -z 128 128   "$ICON_SRC" --out "$ICON_DST_DIR/icon_128x128.png"
sips -z 256 256   "$ICON_SRC" --out "$ICON_DST_DIR/icon_128x128@2x.png"
sips -z 256 256   "$ICON_SRC" --out "$ICON_DST_DIR/icon_256x256.png"
sips -z 512 512   "$ICON_SRC" --out "$ICON_DST_DIR/icon_256x256@2x.png"
sips -z 512 512   "$ICON_SRC" --out "$ICON_DST_DIR/icon_512x512.png"
sips -z 1024 1024 "$ICON_SRC" --out "$ICON_DST_DIR/icon_512x512@2x.png"

iconutil -c icns "$ICON_DST_DIR" -o build/icon.icns
rm -rf "$ICON_DST_DIR"
echo "icns generated"
