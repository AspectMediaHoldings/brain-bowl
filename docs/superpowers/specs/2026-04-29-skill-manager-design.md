# Skill Manager — Design Spec

**Date:** 2026-04-29
**Status:** Approved

---

## Overview

A local web application that helps Nathan choose the right skill for any task. Serves a searchable, filterable skill catalog with an "Ask Claude" recommendation panel. All 167 skills across both skill directories are indexed and grouped by role.

---

## Architecture

Three files, each with one job:

- `skill-manager/server.mjs` — Node.js HTTP server. Scans skill directories, parses SKILL.md frontmatter, groups skills into buckets, serves the catalog API, and proxies "Ask Claude" queries to the Anthropic API.
- `skill-manager/index.html` — Single-page frontend shell.
- `skill-manager/app.js` — Client-side JS. Loads catalog once on startup, runs all search/filter locally, calls server for Claude recommendations.

No build step. No bundler. Start with `node skill-manager/server.mjs`, open `http://localhost:3333`.

---

## Skill Directories

Two sources scanned on startup:

- `~/.claude/skills/` — user-level skills (firecrawl, gstack)
- `C:/claude-workspace/.claude/skills/` — project skills (personal, workflow, scientific)

Each `SKILL.md` frontmatter supplies: `name`, `description`, and optionally `triggers`.

---

## Skill Grouping

Skills are auto-grouped into three buckets:

**Personal** — role-specific skills for Nathan's work roles:
- BSA / Scouting: `bsa-shooting-sports`, `bsa-troop-operations`, `scouting`
- Aspect Media: `aspect-media-*`, `family-matching-shirts`, `state-bird-emblem-prompts`, `ai-video-platform-evaluation`
- Escalation: `escalation-incident-management`, `smart-brevity-comms`
- Communications: `brief`, `document`, `status`
- Client Work: `client-consulting`, `ccpm`

**Workflow** — tool and process skills:
- gstack (28 skills)
- Firecrawl (13 skills)
- Project management, writing, dev tools

**Scientific** — bioinformatics and research skills (~98 skills). Collapsed by default in the UI.

Grouping logic: match skill name prefix/pattern against known lists. Anything unmatched defaults to Scientific.

---

## UI Layout

**Top bar:** App title, total skill count badge, search input, "Ask Claude" button.

**Left sidebar:** Category navigation with skill counts. Clicking a category filters the main grid. Categories: All Skills, Favorites (visible but shows empty state in v1 — non-functional placeholder), then Personal subcategories, then Workflow subcategories, then Scientific.

**Main grid:** Skill cards displayed in a responsive grid (auto-fill, min 260px). Each card shows: skill name, category tag (color-coded), and a two-line description. The best keyword match is highlighted with a "Best match" badge and blue border.

**Right panel:** "Ask Claude" panel with a textarea for describing what you're trying to do, a submit button, and a ranked results list. Each result shows: rank, skill name, one-sentence reasoning, and the `/invoke` command.

Dark theme throughout. Color coding: Personal = green, Workflow = blue, Scientific = purple.

---

## API Endpoints

### GET /api/skills

Returns the full grouped catalog as JSON.

```json
{
  "personal": [...],
  "workflow": [...],
  "scientific": [...]
}
```

Each skill object:
```json
{
  "name": "escalation-incident-management",
  "description": "Use for all escalation and incident management work...",
  "group": "personal",
  "subgroup": "Escalation",
  "source": "project"
}
```

### POST /api/recommend

Request body: `{ "query": "string" }`

Calls Claude (claude-haiku-4-5-20251001) with the full skill catalog (name + description) and the user's query. Returns a ranked list of up to five skills, streamed.

Response (streamed JSON lines):
```json
{ "rank": 1, "name": "escalation-incident-management", "reason": "Directly covers post-incident reviews...", "invoke": "/escalation-incident-management" }
```

API key sourced from `ANTHROPIC_API_KEY` environment variable.

---

## Data Flow

1. Server start: scan both skill directories, parse frontmatter, group into buckets, log counts and any parse failures.
2. Browser opens `http://localhost:3333` — loads `index.html` + `app.js`.
3. `app.js` calls `GET /api/skills` once, stores catalog in memory.
4. User types in search box — client-side filter runs against name and description fields, updates card grid instantly.
5. User clicks sidebar category — client-side filter by group/subgroup.
6. User types in "Ask Claude" textarea and clicks submit — `POST /api/recommend` with query string. Streamed response populates the right panel as results arrive.

---

## Error Handling

| Failure | Behavior |
|---|---|
| SKILL.md parse failure | Log path + skip, rest of catalog loads normally |
| Skill directory not found | Log warning, continue with available directories |
| Anthropic API unreachable | Right panel shows error message, rest of UI unaffected |
| ANTHROPIC_API_KEY missing | Right panel shows "Check your ANTHROPIC_API_KEY", rest of UI unaffected |

No retries. Search and browse always work regardless of API state.

---

## Testing

Manual only. Three checks after each change:

1. **Startup smoke test** — confirm logged skill count matches expected total.
2. **Search test** — type a known skill name, confirm it appears; type "etsy", confirm Aspect Media skills surface.
3. **Recommendation test** — send "I need to write a post-incident review", confirm `escalation-incident-management` ranks first.

---

## File Locations

```
C:/claude-workspace/
  skill-manager/
    server.mjs
    index.html
    app.js
```

Run from: `C:/claude-workspace/skill-manager/`
Start command: `node server.mjs`
Default port: 3333

---

## Out of Scope

- Authentication (local tool only)
- Persistent favorites (deferred)
- Skill editing or creation from the UI
- Automated tests
- Deployment outside localhost
