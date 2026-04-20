---
name: status
description: Generate a project status summary. Use when the user asks for a status update, progress report, or project summary.
allowed-tools: Read, Bash
---

# Status Skill

## Usage
/status [project-name]

If project-name is provided, read projects/<project-name>/CLAUDE.md for context.
If no project-name is given, scan all subdirectories in projects/ and summarize each.

## Steps

1. Run status.sh to list recent output files.
2. Read relevant project CLAUDE.md files.
3. Scan output/ for files related to the project (last 7 days by default).
4. Produce status report:

## Status Report Format

### [Project Name]
**Status:** [On track | At risk | Blocked | Complete]
**Last activity:** [Date and what was done]
**Open items:**
- [Item 1]
- [Item 2]
**Next action:** [One clear next step with owner if known]

---

Keep each project block under 10 lines. Flag blockers first.
