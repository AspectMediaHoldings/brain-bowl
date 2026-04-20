#!/usr/bin/env bash
# brief.sh <output-slug>
# Creates output file for brief.
SLUG="$1"
DATE=$(date +%Y-%m-%d)
mkdir -p output
OUTFILE="output/brief-${SLUG}-${DATE}.md"
echo "# Brief: $SLUG" > "$OUTFILE"
echo "Date: $DATE" >> "$OUTFILE"
echo "$OUTFILE"
