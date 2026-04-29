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

## Skill Library
- Public (domain-agnostic) skills: .claude/skills/
- Team skills (role-specific workflows): skills/team/
- Sandbox (experimental, not yet proven): skills/sandbox/
- When a task matches a team skill, read that skill's SKILL.md before starting

## Tool Permissions
- Read: always allowed
- Write: allowed within this repo
- Bash: allowed for scripts inside .claude/skills/*/
- External network: ask before fetching anything outside this repo

## Concurrency
Each session operates in its own directory. Do not read or write files
in sibling worktree directories.

## gstack

gstack is installed at ~/.claude/skills/gstack. Use it for all web browsing tasks.

For any web browsing, searching, or page reading: use the /browse skill from gstack.
Never use mcp__claude-in-chrome__* tools.

Available gstack skills:

/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship,
/land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa,
/qa-only, /design-review, /setup-browser-cookies, /setup-deploy,
/setup-gbrain, /retro, /investigate, /document-release, /codex, /cso,
/autoplan, /plan-devex-review, /devex-review, /careful, /freeze, /guard,
/unfreeze, /gstack-upgrade, /learn

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
