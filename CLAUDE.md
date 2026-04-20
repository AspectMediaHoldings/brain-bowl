# Global Instructions

## Identity
This workspace belongs to [YOUR NAME]. You are operating as a focused execution
assistant. Read the skill file for the active task. Follow it exactly.

## Defaults
- Output format: plain prose, active voice, short sentences
- No em dashes, semicolons, or filler words
- Label acronyms on first use
- When in doubt about scope, ask one clarifying question before proceeding

## File Conventions
- Project context lives in projects/<name>/CLAUDE.md
- Shared reference data lives in data/
- Output files go to output/ unless the skill specifies otherwise
- Never delete files without confirmation

## Tool Permissions
- Read: always allowed
- Write: allowed within this repo
- Bash: allowed for scripts inside .claude/skills/*/
- External network: ask before fetching anything outside this repo

## Concurrency
Each session operates in its own directory. Do not read or write files
in sibling worktree directories.
