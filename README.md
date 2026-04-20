# claude-workspace

A file-based command and context system for Claude Code.

## Structure

```
claude-workspace/
├── CLAUDE.md                    # Global rules loaded every session
├── .claude/
│   └── skills/
│       ├── research/            # /research command
│       ├── brief/               # /brief command
│       ├── document/            # /document command
│       └── status/              # /status command
├── projects/                    # One subdirectory per project
│   └── _template/
│       └── CLAUDE.md
└── data/                        # Shared reference data Claude can read
```

## Quick Start

1. Clone this repo
2. Open the repo root in your terminal
3. Run: `claude`
4. Type `/research <topic>` to test

## Adding a Skill

```
.claude/skills/my-skill/
├── SKILL.md      # Required: instructions + frontmatter
├── run.sh        # Optional: executable script
└── template.md   # Optional: output template
```

## Running Multiple Instances (Parallel)

Use git worktrees to run isolated concurrent sessions:

```bash
git worktree add ../workspace-client-a -b client-a
git worktree add ../workspace-client-b -b client-b
# Open separate terminals, run `claude` in each
```

## Remote Access

Start a Remote Control session (Claude Code):
```bash
claude remote-control --name "My Session"
```
Then open the session URL from any browser or device.
