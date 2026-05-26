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

export function classifySkill(name) {
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

export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { name: '', description: '' };
  const fm = match[1];

  const name = (fm.match(/^name:\s*(.+)$/m)?.[1] ?? '').trim();

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

  // Inline description: description: some text
  // We match everything after description: unless it's just > or |
  const inlineMatch = fm.match(/^description:\s*(.+)$/m);
  if (inlineMatch) {
    const inline = inlineMatch[1].trim();
    if (inline !== '>' && inline !== '|') {
      return { name, description: inline };
    }
  }

  return { name, description: '' };
}

// ── Group catalog ─────────────────────────────────────────────────────────────

export function buildCatalog(skills) {
  return {
    personal:   skills.filter(s => s.group === 'personal'),
    workflow:   skills.filter(s => s.group === 'workflow'),
    scientific: skills.filter(s => s.group === 'scientific'),
  };
}
