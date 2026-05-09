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
  { path: join(__dirname, '..', '.claude', 'skills'), source: 'project' },
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
  if (Object.hasOwn(PERSONAL_MAP, name)) {
    return { group: 'personal', subgroup: PERSONAL_MAP[name] };
  }
  if (WORKFLOW_PREFIXES.some(p => name.startsWith(p)) || WORKFLOW_NAMES.has(name)) {
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
        model: 'claude-3-5-haiku-20241022',
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

  if (!req.url) { res.writeHead(400); res.end(); return; }
  const url = new URL(req.url, `http://127.0.0.1`);

  // GET /api/skills — return full grouped catalog
  if (url.pathname === '/api/skills' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(catalog));
    return;
  }

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

  // Static files
  const staticEntry = STATIC[url.pathname];
  if (staticEntry) {
    try {
      const content = readFileSync(staticEntry.file);
      res.writeHead(200, { 'Content-Type': staticEntry.mime });
      res.end(content);
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`[skill-manager] Static read error: ${err.message}`);
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.on('error', err => {
  console.error(`[skill-manager] Server error: ${err.message}`);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[skill-manager] Listening on http://localhost:${PORT}`);
});
