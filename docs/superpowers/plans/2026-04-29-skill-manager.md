# Skill Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local web app at `http://localhost:3333` that lets Nathan browse 167 skills, search them, filter by category, and get Claude-powered recommendations.

**Architecture:** A Node.js HTTP server (`server.mjs`) scans two skill directories, parses SKILL.md frontmatter, groups skills into Personal/Workflow/Scientific, and serves a JSON API. A plain HTML+JS frontend (`index.html` + `app.js`) loads the catalog once, runs search/filter client-side, and calls `/api/recommend` for Claude-powered results. No npm, no build step, no bundler.

**Tech Stack:** Node.js 18+ (built-in fetch), ES modules (.mjs), vanilla HTML/CSS/JS, Anthropic API (direct fetch, model: claude-haiku-4-5-20251001)

---

## File Map

| File | Responsibility |
|---|---|
| `skill-manager/server.mjs` | HTTP server: scan dirs, parse frontmatter, group skills, serve API + static files |
| `skill-manager/index.html` | HTML shell: layout, styles, DOM structure |
| `skill-manager/app.js` | Client JS: load catalog, search/filter, render cards, Ask Claude |

---

## Task 1: Create server scaffold with skill scanner

**Files:**
- Create: `skill-manager/server.mjs`

- [ ] **Step 1: Create the skill-manager directory and server.mjs**

```javascript
// skill-manager/server.mjs
import { createServer } from 'http';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3333;

// ── Skill directories ─────────────────────────────────────────────────────────

const HOME = process.env.USERPROFILE || process.env.HOME || 'C:/Users/Default';

const SKILL_DIRS = [
  { path: join(HOME, '.claude', 'skills'), source: 'user' },
  { path: 'C:/claude-workspace/.claude/skills', source: 'project' },
];

// ── Grouping tables ───────────────────────────────────────────────────────────

const PERSONAL_MAP = {
  'bsa-shooting-sports':           'BSA / Scouting',
  'bsa-troop-operations':          'BSA / Scouting',
  'scouting':                      'BSA / Scouting',
  'aspect-media-content-video':    'Aspect Media',
  'aspect-media-etsy-policies':    'Aspect Media',
  'aspect-media-ops':              'Aspect Media',
  'family-matching-shirts':        'Aspect Media',
  'state-bird-emblem-prompts':     'Aspect Media',
  'ai-video-platform-evaluation':  'Aspect Media',
  'escalation-incident-management':'Escalation',
  'smart-brevity-comms':           'Escalation',
  'brief':                         'Communications',
  'document':                      'Communications',
  'status':                        'Communications',
  'client-consulting':             'Client Work',
  'ccpm':                          'Client Work',
  'obsidian-mempalace-integration':'Communications',
};

const WORKFLOW_PREFIXES = ['gstack', 'firecrawl'];

const WORKFLOW_NAMES = new Set([
  'skill-creator', 'claude-api', 'update-config', 'keybindings-help',
  'simplify', 'fewer-permission-prompts', 'loop', 'schedule',
  'markdown-mermaid-writing', 'research', 'research-lookup',
  'pdf', 'docx', 'pptx', 'xlsx', 'generate-image', 'infographics',
  'pptx-posters', 'connect-chrome', 'create-command', 'new-project',
  'todo', 'open-gstack-browser',
]);

function classifySkill(name) {
  if (PERSONAL_MAP[name]) {
    return { group: 'personal', subgroup: PERSONAL_MAP[name] };
  }
  if (WORKFLOW_PREFIXES.some(p => name.startsWith(p)) || WORKFLOW_NAMES.has(name)) {
    // subgroup by prefix
    if (name.startsWith('firecrawl')) return { group: 'workflow', subgroup: 'Firecrawl' };
    if (name.startsWith('gstack') || name === 'connect-chrome' || name === 'open-gstack-browser') {
      return { group: 'workflow', subgroup: 'gstack' };
    }
    return { group: 'workflow', subgroup: 'Tools' };
  }
  return { group: 'scientific', subgroup: 'Scientific' };
}

// ── Frontmatter parser ────────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { name: '', description: '' };
  const fm = match[1];

  const name = (fm.match(/^name:\s*(.+)$/m)?.[1] ?? '').trim();

  // Inline description: description: some text
  const inline = fm.match(/^description:\s*(?![>|])(.+)$/m)?.[1]?.trim();
  if (inline) return { name, description: inline };

  // Folded/literal block scalar (> or |) — grab indented continuation lines
  const blockMatch = fm.match(/^description:\s*[>|]\s*\r?\n((?:[ \t]+[^\r\n]*\r?\n?)*)/m);
  if (blockMatch) {
    const desc = blockMatch[1]
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .join(' ');
    return { name, description: desc };
  }

  return { name, description: '' };
}

// ── Skill scanner ─────────────────────────────────────────────────────────────

function scanSkills() {
  const all = [];

  for (const { path: dirPath, source } of SKILL_DIRS) {
    if (!existsSync(dirPath)) {
      console.warn(`[skill-manager] Directory not found, skipping: ${dirPath}`);
      continue;
    }

    let entries;
    try {
      entries = readdirSync(dirPath);
    } catch (err) {
      console.warn(`[skill-manager] Cannot read directory ${dirPath}: ${err.message}`);
      continue;
    }

    for (const entry of entries) {
      const skillDir = join(dirPath, entry);
      try {
        const stat = statSync(skillDir);
        // Follow symlinks — check if it resolves to a directory
        if (!stat.isDirectory()) continue;
      } catch { continue; }

      const skillMdPath = join(skillDir, 'SKILL.md');
      if (!existsSync(skillMdPath)) continue;

      let content;
      try {
        content = readFileSync(skillMdPath, 'utf-8');
      } catch (err) {
        console.warn(`[skill-manager] Cannot read ${skillMdPath}: ${err.message}`);
        continue;
      }

      const { name, description } = parseFrontmatter(content);
      if (!name) {
        console.warn(`[skill-manager] No name in frontmatter: ${skillMdPath}`);
        continue;
      }

      const { group, subgroup } = classifySkill(name);
      all.push({ name, description, group, subgroup, source });
    }
  }

  console.log(`[skill-manager] Loaded ${all.length} skills`);
  console.log(`  personal:   ${all.filter(s => s.group === 'personal').length}`);
  console.log(`  workflow:   ${all.filter(s => s.group === 'workflow').length}`);
  console.log(`  scientific: ${all.filter(s => s.group === 'scientific').length}`);
  return all;
}

// ── Group catalog ─────────────────────────────────────────────────────────────

function buildCatalog(skills) {
  return {
    personal:   skills.filter(s => s.group === 'personal'),
    workflow:   skills.filter(s => s.group === 'workflow'),
    scientific: skills.filter(s => s.group === 'scientific'),
  };
}

// ── Load on startup ───────────────────────────────────────────────────────────

const skills = scanSkills();
const catalog = buildCatalog(skills);

// ── Placeholder HTTP server (to be expanded in Task 2) ────────────────────────

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[skill-manager] Listening on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Verify skill scanning works**

```bash
cd C:/claude-workspace
node skill-manager/server.mjs
```

Expected output (approximate counts):
```
[skill-manager] Loaded 167 skills
  personal:   17
  workflow:   55
  scientific: 95
[skill-manager] Listening on http://localhost:3333
```

If counts look wrong, check the PERSONAL_MAP and WORKFLOW_NAMES sets. Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add skill-manager/server.mjs
git commit -m "feat: add skill scanner with frontmatter parser and grouping"
```

---

## Task 2: Add HTTP server with GET /api/skills and static file serving

**Files:**
- Modify: `skill-manager/server.mjs`

- [ ] **Step 1: Replace the placeholder server with the real request handler**

Replace the `const server = createServer(...)` block at the bottom of `server.mjs` with:

```javascript
// ── CORS helper ───────────────────────────────────────────────────────────────

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Static file map ───────────────────────────────────────────────────────────

const STATIC = {
  '/':         { file: join(__dirname, 'index.html'), mime: 'text/html' },
  '/app.js':   { file: join(__dirname, 'app.js'),    mime: 'application/javascript' },
};

// ── Request handler ───────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  const url = new URL(req.url, `http://127.0.0.1`);

  // GET /api/skills — return full grouped catalog
  if (url.pathname === '/api/skills' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(catalog));
    return;
  }

  // Static files
  const staticEntry = STATIC[url.pathname];
  if (staticEntry) {
    try {
      const content = readFileSync(staticEntry.file);
      res.writeHead(200, { 'Content-Type': staticEntry.mime });
      res.end(content);
    } catch {
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[skill-manager] Listening on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Verify the API endpoint**

```bash
node skill-manager/server.mjs &
curl -s http://localhost:3333/api/skills | node -e "const d=require('fs').readFileSync('/dev/stdin','utf-8'); const j=JSON.parse(d); console.log('personal:', j.personal.length, 'workflow:', j.workflow.length, 'scientific:', j.scientific.length)"
```

Expected output:
```
personal: 17   workflow: 55   scientific: 95
```

Kill the background server: `kill %1`

- [ ] **Step 3: Commit**

```bash
git add skill-manager/server.mjs
git commit -m "feat: add GET /api/skills endpoint and static file serving"
```

---

## Task 3: Add POST /api/recommend

**Files:**
- Modify: `skill-manager/server.mjs`

- [ ] **Step 1: Add the recommendation function before the request handler**

Insert this block before the `const server = createServer(...)` line:

```javascript
// ── Claude recommendation ─────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function getRecommendation(query) {
  if (!ANTHROPIC_API_KEY) {
    return { error: 'ANTHROPIC_API_KEY not set. Set it in your environment and restart.' };
  }

  const catalog_text = skills
    .map(s => `${s.name}: ${s.description.slice(0, 160)}`)
    .join('\n');

  const system = `You are a skill recommender for Claude Code. Given a user task description and a catalog of available skills, return the top 5 most relevant skills as a JSON array.

Each element must have exactly these fields:
- rank: number (1-5)
- name: skill name from the catalog (exact match)
- reason: one sentence, max 15 words, explaining why this skill fits
- invoke: "/" + name

Return ONLY a valid JSON array. No explanation, no markdown, no code fences.

Skill catalog:
${catalog_text}`;

  let resp;
  try {
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: query }],
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    return { error: `Could not reach Claude API: ${err.message}` };
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return { error: `Anthropic API error ${resp.status}: ${text.slice(0, 200)}` };
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text ?? '';

  try {
    const results = JSON.parse(text);
    return { results };
  } catch {
    return { error: 'Claude returned invalid JSON. Try rephrasing your query.' };
  }
}
```

- [ ] **Step 2: Add the POST /api/recommend route inside the request handler**

Inside the `createServer` callback, add this block after the `/api/skills` block (before the static files block):

```javascript
  // POST /api/recommend — Claude-powered skill recommendation
  if (url.pathname === '/api/recommend' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      let query;
      try {
        query = JSON.parse(body).query;
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }
      if (!query || typeof query !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing query field' }));
        return;
      }
      const result = await getRecommendation(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    });
    return;
  }
```

- [ ] **Step 3: Verify the recommendation endpoint**

```bash
node skill-manager/server.mjs &
curl -s -X POST http://localhost:3333/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query":"I need to write a post-incident review for a major outage"}' \
  | node -e "const d=require('fs').readFileSync('/dev/stdin','utf-8'); const j=JSON.parse(d); j.results.forEach(r => console.log(r.rank, r.name))"
```

Expected: `escalation-incident-management` should appear as rank 1 or 2.

Kill the background server: `kill %1`

- [ ] **Step 4: Commit**

```bash
git add skill-manager/server.mjs
git commit -m "feat: add POST /api/recommend with Claude Haiku integration"
```

---

## Task 4: Build index.html

**Files:**
- Create: `skill-manager/index.html`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Skill Manager</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e1e4e8; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

/* Top bar */
.topbar { background: #161b22; border-bottom: 1px solid #30363d; padding: 10px 16px; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.topbar h1 { font-size: 14px; font-weight: 600; color: #f0f6fc; white-space: nowrap; }
#total-badge { background: #21262d; border: 1px solid #30363d; border-radius: 20px; padding: 2px 9px; font-size: 11px; color: #8b949e; }
.search-wrap { flex: 1; position: relative; }
.search-wrap input { width: 100%; background: #21262d; border: 1px solid #30363d; border-radius: 6px; padding: 6px 10px 6px 30px; font-size: 13px; color: #e1e4e8; outline: none; }
.search-wrap input:focus { border-color: #388bfd; }
.search-wrap input::placeholder { color: #484f58; }
.search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: #484f58; font-size: 13px; pointer-events: none; }

/* Main layout */
.main { display: flex; flex: 1; overflow: hidden; }

/* Left sidebar */
.sidebar { width: 176px; background: #161b22; border-right: 1px solid #30363d; padding: 10px 0; overflow-y: auto; flex-shrink: 0; }
.sidebar-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #484f58; padding: 8px 14px 3px; }
.sidebar-item { display: flex; align-items: center; justify-content: space-between; padding: 5px 14px; font-size: 12px; color: #8b949e; cursor: pointer; }
.sidebar-item:hover { background: #1c2128; color: #e1e4e8; }
.sidebar-item.active { background: #1c2128; color: #e1e4e8; font-weight: 500; border-left: 2px solid #1f6feb; padding-left: 12px; }
.sidebar-count { font-size: 10px; color: #484f58; background: #21262d; border-radius: 10px; padding: 1px 5px; }
.sidebar-divider { border: none; border-top: 1px solid #21262d; margin: 6px 0; }

/* Skill grid */
.content { flex: 1; overflow-y: auto; padding: 14px; }
.section-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; margin-top: 4px; }
.section-title { font-size: 11px; font-weight: 600; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
.section-count { font-size: 10px; color: #484f58; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(255px, 1fr)); gap: 9px; margin-bottom: 20px; }
.card { background: #161b22; border: 1px solid #30363d; border-radius: 7px; padding: 12px; cursor: pointer; }
.card:hover { border-color: #388bfd55; background: #1c2128; }
.card.best-match { border-color: #1f6feb; background: #1c2535; }
.best-badge { font-size: 10px; color: #388bfd; font-weight: 600; margin-bottom: 4px; }
.card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; margin-bottom: 5px; }
.card-name { font-size: 12px; font-weight: 600; color: #f0f6fc; word-break: break-word; }
.card-tag { font-size: 10px; padding: 2px 6px; border-radius: 10px; white-space: nowrap; flex-shrink: 0; }
.tag-personal  { background: #1a3a2a; color: #3fb950; }
.tag-workflow  { background: #1a2a3a; color: #388bfd; }
.tag-scientific { background: #2a1a3a; color: #bc8cff; }
.card-desc { font-size: 11px; color: #8b949e; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.collapsed-row { background: #161b22; border: 1px dashed #30363d; border-radius: 7px; padding: 9px 14px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; cursor: pointer; }
.collapsed-row span { font-size: 11px; color: #484f58; }
.collapsed-row button { font-size: 11px; color: #388bfd; background: none; border: none; cursor: pointer; }
.empty-state { color: #484f58; font-size: 13px; text-align: center; padding: 40px 20px; }

/* Right panel */
.rec-panel { width: 288px; background: #161b22; border-left: 1px solid #30363d; display: flex; flex-direction: column; flex-shrink: 0; }
.rec-panel-header { padding: 12px 14px; border-bottom: 1px solid #30363d; font-size: 11px; font-weight: 600; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
.rec-query { padding: 10px; border-bottom: 1px solid #30363d; }
.rec-query textarea { width: 100%; background: #21262d; border: 1px solid #30363d; border-radius: 5px; padding: 7px 9px; font-size: 12px; color: #e1e4e8; resize: none; outline: none; line-height: 1.5; font-family: inherit; }
.rec-query textarea:focus { border-color: #388bfd; }
.rec-query button { margin-top: 7px; width: 100%; background: #1f6feb; color: #fff; border: none; border-radius: 5px; padding: 6px; font-size: 12px; font-weight: 500; cursor: pointer; }
.rec-query button:disabled { opacity: 0.5; cursor: not-allowed; }
.rec-results { flex: 1; overflow-y: auto; padding: 10px; }
.rec-placeholder { color: #484f58; font-size: 11px; text-align: center; padding: 20px 10px; line-height: 1.6; }
.rec-item { margin-bottom: 10px; padding: 9px; background: #21262d; border-radius: 5px; border: 1px solid #30363d; }
.rec-item-rank { font-size: 10px; color: #388bfd; font-weight: 600; margin-bottom: 3px; }
.rec-item-name { font-size: 12px; font-weight: 600; color: #f0f6fc; margin-bottom: 3px; }
.rec-item-reason { font-size: 11px; color: #8b949e; line-height: 1.4; }
.rec-item-invoke { margin-top: 5px; font-size: 10px; color: #484f58; font-family: monospace; background: #161b22; padding: 2px 6px; border-radius: 3px; display: inline-block; }
.rec-error { color: #f85149; font-size: 11px; padding: 10px; line-height: 1.5; }

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
</style>
</head>
<body>

<div class="topbar">
  <h1>Skill Manager</h1>
  <span id="total-badge">— skills</span>
  <div class="search-wrap">
    <span class="search-icon">⌕</span>
    <input type="text" id="search" placeholder="Search skills by name or keyword...">
  </div>
</div>

<div class="main">

  <nav class="sidebar" id="sidebar">
    <div class="sidebar-label">View</div>
    <div class="sidebar-item active" data-filter="all">All Skills <span class="sidebar-count" id="count-all">—</span></div>
    <div class="sidebar-item" data-filter="favorites">Favorites <span class="sidebar-count">0</span></div>
    <hr class="sidebar-divider">
    <div class="sidebar-label">Personal</div>
    <div class="sidebar-item" data-filter="personal">All Personal <span class="sidebar-count" id="count-personal">—</span></div>
    <div class="sidebar-item" data-filter="BSA / Scouting">BSA / Scouting <span class="sidebar-count" id="count-bsa">—</span></div>
    <div class="sidebar-item" data-filter="Aspect Media">Aspect Media <span class="sidebar-count" id="count-aspect">—</span></div>
    <div class="sidebar-item" data-filter="Escalation">Escalation <span class="sidebar-count" id="count-escalation">—</span></div>
    <div class="sidebar-item" data-filter="Communications">Communications <span class="sidebar-count" id="count-comms">—</span></div>
    <div class="sidebar-item" data-filter="Client Work">Client Work <span class="sidebar-count" id="count-client">—</span></div>
    <hr class="sidebar-divider">
    <div class="sidebar-label">Workflow</div>
    <div class="sidebar-item" data-filter="workflow">All Workflow <span class="sidebar-count" id="count-workflow">—</span></div>
    <div class="sidebar-item" data-filter="gstack">gstack <span class="sidebar-count" id="count-gstack">—</span></div>
    <div class="sidebar-item" data-filter="Firecrawl">Firecrawl <span class="sidebar-count" id="count-firecrawl">—</span></div>
    <div class="sidebar-item" data-filter="Tools">Other Tools <span class="sidebar-count" id="count-tools">—</span></div>
    <hr class="sidebar-divider">
    <div class="sidebar-label">Scientific</div>
    <div class="sidebar-item" data-filter="scientific">All Scientific <span class="sidebar-count" id="count-scientific">—</span></div>
  </nav>

  <div class="content" id="content">
    <div class="empty-state">Loading skills…</div>
  </div>

  <div class="rec-panel">
    <div class="rec-panel-header">✦ Ask Claude</div>
    <div class="rec-query">
      <textarea id="rec-input" rows="4" placeholder="Describe what you're trying to do…&#10;&#10;Example: I need to write a post-incident review and communicate it to stakeholders."></textarea>
      <button id="rec-btn">Get recommendation →</button>
    </div>
    <div class="rec-results" id="rec-results">
      <div class="rec-placeholder">Describe your task above and click "Get recommendation" to find the best skills.</div>
    </div>
  </div>

</div>

<script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add skill-manager/index.html
git commit -m "feat: add skill manager HTML shell with layout and styles"
```

---

## Task 5: Build app.js — catalog loading, card rendering, sidebar counts

**Files:**
- Create: `skill-manager/app.js`

- [ ] **Step 1: Create app.js with catalog load and card rendering**

```javascript
// skill-manager/app.js

let catalog = { personal: [], workflow: [], scientific: [] };
let allSkills = [];
let activeFilter = 'all';
let searchQuery = '';
let scientificExpanded = false;

// ── Boot ──────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const resp = await fetch('/api/skills');
    catalog = await resp.json();
    allSkills = [...catalog.personal, ...catalog.workflow, ...catalog.scientific];
    updateCounts();
    render();
  } catch (err) {
    document.getElementById('content').innerHTML =
      `<div class="empty-state">Could not load skills: ${err.message}</div>`;
  }
}

// ── Counts ────────────────────────────────────────────────────────────────────

function updateCounts() {
  const total = allSkills.length;
  document.getElementById('total-badge').textContent = `${total} skills`;
  document.getElementById('count-all').textContent = total;
  document.getElementById('count-personal').textContent = catalog.personal.length;
  document.getElementById('count-workflow').textContent = catalog.workflow.length;
  document.getElementById('count-scientific').textContent = catalog.scientific.length;

  const sg = (group, subgroup) =>
    catalog[group].filter(s => s.subgroup === subgroup).length;

  document.getElementById('count-bsa').textContent       = sg('personal', 'BSA / Scouting');
  document.getElementById('count-aspect').textContent    = sg('personal', 'Aspect Media');
  document.getElementById('count-escalation').textContent = sg('personal', 'Escalation');
  document.getElementById('count-comms').textContent     = sg('personal', 'Communications');
  document.getElementById('count-client').textContent    = sg('personal', 'Client Work');
  document.getElementById('count-gstack').textContent    = sg('workflow', 'gstack');
  document.getElementById('count-firecrawl').textContent = sg('workflow', 'Firecrawl');
  document.getElementById('count-tools').textContent     = sg('workflow', 'Tools');
}

// ── Filter ────────────────────────────────────────────────────────────────────

function getFilteredSkills() {
  let skills = allSkills;

  // Apply sidebar filter
  if (activeFilter === 'favorites') return [];
  if (activeFilter === 'personal')   skills = catalog.personal;
  if (activeFilter === 'workflow')   skills = catalog.workflow;
  if (activeFilter === 'scientific') skills = catalog.scientific;
  if (['BSA / Scouting','Aspect Media','Escalation','Communications','Client Work',
       'gstack','Firecrawl','Tools'].includes(activeFilter)) {
    skills = allSkills.filter(s => s.subgroup === activeFilter);
  }

  // Apply search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    skills = skills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }

  return skills;
}

// ── Render ────────────────────────────────────────────────────────────────────

function cardHTML(skill, isBestMatch) {
  const tagClass = `tag-${skill.group}`;
  const label = skill.group === 'personal' ? 'Personal'
              : skill.group === 'workflow'  ? 'Workflow'
              : 'Scientific';
  return `
    <div class="card${isBestMatch ? ' best-match' : ''}">
      ${isBestMatch ? '<div class="best-badge">★ Best match</div>' : ''}
      <div class="card-head">
        <span class="card-name">${skill.name}</span>
        <span class="card-tag ${tagClass}">${label}</span>
      </div>
      <div class="card-desc">${skill.description || 'No description.'}</div>
    </div>`;
}

function sectionHTML(title, skills, bestMatchName) {
  if (!skills.length) return '';
  const cards = skills.map((s, i) => cardHTML(s, i === 0 && s.name === bestMatchName)).join('');
  return `
    <div class="section-header">
      <span class="section-title">${title}</span>
      <span class="section-count">${skills.length} skill${skills.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="grid">${cards}</div>`;
}

function render() {
  const filtered = getFilteredSkills();
  const content = document.getElementById('content');

  if (activeFilter === 'favorites') {
    content.innerHTML = '<div class="empty-state">Favorites coming in a future update.</div>';
    return;
  }

  if (!filtered.length) {
    content.innerHTML = `<div class="empty-state">No skills match "${searchQuery}".</div>`;
    return;
  }

  // Best match: first result when searching
  const bestMatchName = searchQuery ? filtered[0]?.name : null;

  let html = '';

  if (activeFilter === 'all' || activeFilter === 'personal') {
    const personal = filtered.filter(s => s.group === 'personal');
    if (personal.length) {
      // Group personal by subgroup
      const subgroups = [...new Set(personal.map(s => s.subgroup))];
      for (const sg of subgroups) {
        const sg_skills = personal.filter(s => s.subgroup === sg);
        html += sectionHTML(sg, sg_skills, bestMatchName);
      }
    }
  }

  if (activeFilter === 'all' || activeFilter === 'workflow') {
    const workflow = filtered.filter(s => s.group === 'workflow');
    if (workflow.length) {
      const subgroups = [...new Set(workflow.map(s => s.subgroup))];
      for (const sg of subgroups) {
        html += sectionHTML(sg, workflow.filter(s => s.subgroup === sg), bestMatchName);
      }
    }
  }

  // Scientific — show subgroup items
  const scientific = filtered.filter(s => s.group === 'scientific');
  if (scientific.length && (activeFilter === 'all' || activeFilter === 'scientific')) {
    if (!scientificExpanded && activeFilter === 'all') {
      html += `
        <div class="collapsed-row" id="sci-toggle">
          <span>⬡ ${scientific.length} scientific / bioinformatics skills — collapsed</span>
          <button>Show all ↓</button>
        </div>`;
    } else {
      html += sectionHTML('Scientific / Bioinformatics', scientific, bestMatchName);
    }
  }

  if (!html) html = `<div class="empty-state">No skills match your filter.</div>`;
  content.innerHTML = html;

  // Attach scientific toggle
  document.getElementById('sci-toggle')?.addEventListener('click', () => {
    scientificExpanded = true;
    render();
  });
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

document.getElementById('sidebar').addEventListener('click', e => {
  const item = e.target.closest('.sidebar-item');
  if (!item) return;
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  item.classList.add('active');
  activeFilter = item.dataset.filter;
  scientificExpanded = (activeFilter === 'scientific');
  render();
});

// ── Search ────────────────────────────────────────────────────────────────────

document.getElementById('search').addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  render();
});

// ── Start ─────────────────────────────────────────────────────────────────────

init();
```

- [ ] **Step 2: Start server and verify in browser**

```bash
node skill-manager/server.mjs
```

Open http://localhost:3333 in the gstack browser. Verify:
- Skills load and cards render
- Sidebar counts fill in correctly
- Clicking "BSA / Scouting" shows only those three skills
- Scientific section shows as a collapsed banner
- Clicking "Show all" expands scientific skills

- [ ] **Step 3: Commit**

```bash
git add skill-manager/app.js
git commit -m "feat: add app.js with catalog load, card rendering, and sidebar filtering"
```

---

## Task 6: Wire up search and "Ask Claude" panel

**Files:**
- Modify: `skill-manager/app.js`

- [ ] **Step 1: Add the Ask Claude panel handler to the bottom of app.js**

Append to the bottom of `skill-manager/app.js` (before the `init()` call at the end, insert before it):

```javascript
// ── Ask Claude ────────────────────────────────────────────────────────────────

const recBtn   = document.getElementById('rec-btn');
const recInput = document.getElementById('rec-input');
const recResults = document.getElementById('rec-results');

recBtn.addEventListener('click', async () => {
  const query = recInput.value.trim();
  if (!query) return;

  recBtn.disabled = true;
  recBtn.textContent = 'Asking Claude…';
  recResults.innerHTML = '<div class="rec-placeholder">Thinking…</div>';

  let data;
  try {
    const resp = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    data = await resp.json();
  } catch (err) {
    recResults.innerHTML = `<div class="rec-error">Network error: ${err.message}</div>`;
    recBtn.disabled = false;
    recBtn.textContent = 'Get recommendation →';
    return;
  }

  recBtn.disabled = false;
  recBtn.textContent = 'Get recommendation →';

  if (data.error) {
    recResults.innerHTML = `<div class="rec-error">${data.error}</div>`;
    return;
  }

  if (!data.results?.length) {
    recResults.innerHTML = '<div class="rec-placeholder">No recommendations returned. Try rephrasing.</div>';
    return;
  }

  recResults.innerHTML = data.results.map(r => `
    <div class="rec-item">
      <div class="rec-item-rank">#${r.rank} ${r.rank === 1 ? '— Best match' : ''}</div>
      <div class="rec-item-name">${r.name}</div>
      <div class="rec-item-reason">${r.reason}</div>
      <span class="rec-item-invoke">${r.invoke}</span>
    </div>
  `).join('');
});

// Allow Ctrl+Enter to submit
recInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.ctrlKey) recBtn.click();
});
```

- [ ] **Step 2: Test Ask Claude end-to-end**

Start the server:
```bash
node skill-manager/server.mjs
```

Open http://localhost:3333. In the right panel, type:

> I need to write a post-incident review for a major outage and notify stakeholders

Click "Get recommendation →". Verify:
- `escalation-incident-management` appears as rank 1
- Each result shows a reason and `/invoke` command
- The loading state ("Asking Claude…") appears briefly

- [ ] **Step 3: Test search highlight**

Type "etsy" in the search box. Verify:
- `aspect-media-etsy-policies` appears first with the "Best match" badge
- Other Aspect Media skills appear below it

- [ ] **Step 4: Commit**

```bash
git add skill-manager/app.js
git commit -m "feat: add Ask Claude recommendation panel with Ctrl+Enter shortcut"
```

---

## Task 7: Final smoke test and polish

**Files:**
- No new files. Minor fixes only if something is broken.

- [ ] **Step 1: Full smoke test checklist**

Start the server fresh:
```bash
node skill-manager/server.mjs
```

Run through all three manual tests:

**Startup test** — confirm terminal output shows expected counts:
```
[skill-manager] Loaded NNN skills
  personal:   17
  workflow:   55
  scientific: 95
```

**Search test** — type "etsy" → `aspect-media-etsy-policies` appears first with Best match badge. Clear search → all skills return.

**Recommendation test** — type "I need to write a post-incident review" → `escalation-incident-management` ranks first with a sensible reason.

- [ ] **Step 2: Final commit**

```bash
git add skill-manager/
git commit -m "feat: skill manager v1 complete — browse, search, and Ask Claude"
```

- [ ] **Step 3: Add a start command to CLAUDE.md**

Add this line to `C:/claude-workspace/CLAUDE.md` under `## Tool Permissions`:

```markdown
## Skill Manager

Start: `node skill-manager/server.mjs` → open http://localhost:3333
```

```bash
git add CLAUDE.md
git commit -m "docs: add skill manager start command to CLAUDE.md"
```

---

## Quick Reference

| Task | What it builds |
|---|---|
| 1 | Skill scanner + frontmatter parser |
| 2 | HTTP server + GET /api/skills |
| 3 | POST /api/recommend (Claude Haiku) |
| 4 | index.html shell + styles |
| 5 | app.js: catalog load + card render + sidebar |
| 6 | app.js: Ask Claude panel |
| 7 | Smoke test + final commit |
