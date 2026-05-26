// skill-manager/server.mjs
import { createServer } from 'http';
import { readFileSync, readFile, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { classifySkill, parseFrontmatter, buildCatalog } from './utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3333;

// ── Skill directories ─────────────────────────────────────────────────────────

const HOME = process.env.USERPROFILE || process.env.HOME || 'C:/Users/Default';

const SKILL_DIRS = [
  { path: join(HOME, '.claude', 'skills'), source: 'user' },
  { path: join(__dirname, '..', '.claude', 'skills'), source: 'project' },
];

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

// ── Load on startup ───────────────────────────────────────────────────────────

const skills = scanSkills();
const catalog = buildCatalog(skills);
const catalogJson = JSON.stringify(catalog);

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
    res.end(catalogJson);
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
    readFile(staticEntry.file, (err, content) => {
      if (err) {
        if (err.code !== 'ENOENT') console.warn(`[skill-manager] Static read error: ${err.message}`);
        res.writeHead(404); res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': staticEntry.mime });
      res.end(content);
    });
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
