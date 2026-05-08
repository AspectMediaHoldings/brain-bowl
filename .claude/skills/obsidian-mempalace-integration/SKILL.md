---
name: obsidian-mempalace-integration
description: >
  Use this skill when setting up, troubleshooting, or extending the Claude Code MCP
  integration for Obsidian or MemPalace on Nathan's Windows home desktop. Always load
  before editing claude_desktop_config.json, installing MCP servers, or advising on
  local persistent memory or vault connectivity for Claude Code on Windows.
---

# Obsidian + MemPalace / Claude Code Integration

## Purpose

Nathan uses Claude Code (terminal) on a Windows home desktop. This skill governs the
setup, configuration, and troubleshooting of MCP (Model Context Protocol) server
integrations: MemPalace for local persistent memory and Obsidian for vault access.
MemPalace is the priority — it is fully offline and works immediately. Obsidian
integration is deferred pending work machine security review.

## When to Use

- Setting up MemPalace MCP on the Windows home machine
- Editing claude_desktop_config.json to add or modify MCP servers
- Troubleshooting MCP connection issues in Claude Code
- Advancing Obsidian vault integration once security review is complete
- Advising on local vs. networked memory solutions for Claude Code
- Any Claude Code Windows configuration task

## Inputs

Confirm before starting:
1. Machine scope: home desktop or work machine (default: home desktop only)
2. Task: MemPalace setup, Obsidian setup, config edit, troubleshooting, or security review prep
3. Current state: Claude Code installed and confirmed working, or not yet
4. For Obsidian: vault location path on Windows

Do not proceed with work machine instructions unless Nathan explicitly requests them.
Work machine may have restrictions — always recommend IT verification first.

## Procedure

### Prerequisites Check

Before any MCP configuration:
1. Confirm Claude Code is installed and authenticated. Run: `claude --version` in terminal.
2. Confirm Python 3.10+ is installed (required for MemPalace). Run: `python --version`.
3. Locate the Claude Code config file: `%USERPROFILE%\.claude\claude_desktop_config.json`
   - If the file does not exist, Claude Code has not been configured yet. Create it.

### MemPalace Installation (Home Machine — Priority)

MemPalace stores persistent memory in a local SQLite database. It is fully offline —
no network access required after installation.

1. Install MemPalace via pip:
   ```
   pip install mempalace
   ```
2. Confirm installation:
   ```
   python -m mempalace --version
   ```
3. Note the database path MemPalace uses — it defaults to `%USERPROFILE%\.mempalace\memory.db`.
   Do not move this file after setup.
4. Add MemPalace to claude_desktop_config.json:
   ```json
   {
     "mcpServers": {
       "mempalace": {
         "command": "python",
         "args": ["-m", "mempalace"],
         "env": {}
       }
     }
   }
   ```
5. Restart Claude Code.
6. Verify: start a new Claude Code session and ask Claude to recall something from a previous session. MemPalace is working if it can retrieve stored context.

If MemPalace fails to load: check that Python is in the system PATH (`python --version` works in a fresh terminal). If not, add Python to PATH via Windows environment variables.

### Obsidian Integration (Home Machine — Deferred Pending Review)

Do not set up Obsidian on the work machine without IT confirmation on two points:
1. Can local Python processes run without network access?
2. Are there restrictions on where local databases may be written?

Obsidian stores all data locally. No cloud requirement. This typically passes IT review, but confirm before proceeding.

For home machine setup when ready:
1. Identify MCP server: `obsidian-mcp` (npm package) or `mcp-obsidian` (community).
2. Note vault path (e.g., `C:\Users\Nathan\Documents\ObsidianVault`).
3. Add to claude_desktop_config.json:
   ```json
   "obsidian": {
     "command": "npx",
     "args": ["obsidian-mcp", "--vault", "C:\\Users\\Nathan\\Documents\\ObsidianVault"],
     "env": {}
   }
   ```
4. Restart Claude Code and verify vault access.

### Config File Management

The config file is JSON — syntax errors will silently break MCP loading.
Always validate JSON after editing. Use: https://jsonlint.com or run:
```
python -c "import json; json.load(open(r'%USERPROFILE%\.claude\claude_desktop_config.json'))"
```

Multiple MCP servers go in the same `mcpServers` object — do not create duplicate top-level keys.

### Troubleshooting

| Symptom | Check |
|---|---|
| MCP server not loading | Validate JSON syntax in config file |
| Python command not found | Add Python to Windows PATH |
| MemPalace not recalling context | Confirm database path is unchanged |
| Obsidian vault not accessible | Confirm vault path uses double backslashes in JSON |
| Claude Code not finding config | Confirm file is at `%USERPROFILE%\.claude\claude_desktop_config.json` |

## Output Format

- Setup procedures: numbered steps, code blocks for all commands and JSON.
- Config file snippets: valid JSON, ready to paste.
- Troubleshooting: table format with symptom and resolution columns.
- Security review prep: bullet list of questions to bring to IT.

## Quality Checks

Before delivering any config or setup instructions:
- Confirm JSON is syntactically valid — test it.
- Confirm Windows path separators use double backslashes in JSON strings.
- Confirm MemPalace steps are home machine only unless work machine is explicitly in scope.
- Confirm Python PATH check is included in prerequisites.

Before providing work machine guidance:
- Confirm Nathan explicitly requested work machine steps.
- Confirm IT verification questions are included.

## References

- Machine: Windows home desktop (primary). Work machine deferred.
- MemPalace: local SQLite-based persistent memory, fully offline. pip install mempalace.
- Obsidian: local vault, no cloud requirement. MCP via obsidian-mcp (npm).
- Config location: `%USERPROFILE%\.claude\claude_desktop_config.json`
- NotebookLM: cloud-based, separate tool — not part of this integration. Do not conflate.
