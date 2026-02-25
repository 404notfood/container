#!/bin/bash
# build.sh — Assemble HTML partials into index.html (no Node required)
# Usage: bash build.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/src/html/index.template.html"
OUTPUT="$SCRIPT_DIR/index.html"
PARTIALS_DIR="$SCRIPT_DIR/src/html"

while IFS= read -r line; do
    if echo "$line" | grep -q '@include'; then
        filename=$(echo "$line" | sed 's/.*@include \(.*\.html\).*/\1/' | tr -d ' ')
        indent=$(echo "$line" | sed 's/\([[:space:]]*\).*/\1/')
        if [ -f "$PARTIALS_DIR/$filename" ]; then
            while IFS= read -r partial_line; do
                echo "${indent}${partial_line}"
            done < "$PARTIALS_DIR/$filename"
        else
            echo "[ERROR] Partial not found: $filename" >&2
            exit 1
        fi
    else
        echo "$line"
    fi
done < "$TEMPLATE" > "$OUTPUT"

lines=$(wc -l < "$OUTPUT")
echo "✓ index.html generated ($lines lines)"
