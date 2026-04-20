#!/usr/bin/env bash
# research.sh <topic>
# Placeholder - Claude uses WebFetch and built-in search by default.
# Add custom API calls or local database queries here if needed.
TOPIC="$1"
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$TOPIC" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -dc 'a-z0-9-')
mkdir -p output
echo "Research initiated: $TOPIC ($DATE)" > "output/research-${SLUG}-${DATE}.md"
echo "Topic: $TOPIC"
echo "Slug: $SLUG"
echo "Date: $DATE"
