#!/usr/bin/env bash
# status.sh
# Lists recent output files and project directories for context.
echo "=== Recent output files (last 7 days) ==="
find output/ -type f -mtime -7 2>/dev/null | sort -r | head -20 || echo "(no output directory yet)"

echo ""
echo "=== Project directories ==="
find projects/ -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sort || echo "(no projects directory yet)"
