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

// ── Placeholder HTTP server ───────────────────────────────────────────────────

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[skill-manager] Listening on http://localhost:${PORT}`);
});
