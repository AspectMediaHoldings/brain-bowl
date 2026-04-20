#!/usr/bin/env bash
# document.sh <type> <slug>
TYPE="$1"
SLUG="$2"
DATE=$(date +%Y-%m-%d)
mkdir -p output
OUTFILE="output/${TYPE}-${SLUG}-${DATE}.md"
echo "# $SLUG" > "$OUTFILE"
echo "_Type: $TYPE | Date: $DATE_" >> "$OUTFILE"
echo "" >> "$OUTFILE"
echo "$OUTFILE"
