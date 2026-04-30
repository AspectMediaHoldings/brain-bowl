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

  document.getElementById('count-bsa').textContent        = sg('personal', 'BSA / Scouting');
  document.getElementById('count-aspect').textContent     = sg('personal', 'Aspect Media');
  document.getElementById('count-escalation').textContent = sg('personal', 'Escalation');
  document.getElementById('count-comms').textContent      = sg('personal', 'Communications');
  document.getElementById('count-client').textContent     = sg('personal', 'Client Work');
  document.getElementById('count-gstack').textContent     = sg('workflow', 'gstack');
  document.getElementById('count-firecrawl').textContent  = sg('workflow', 'Firecrawl');
  document.getElementById('count-tools').textContent      = sg('workflow', 'Tools');
}

// ── Filter ────────────────────────────────────────────────────────────────────

function getFilteredSkills() {
  let skills = allSkills;

  if (activeFilter === 'favorites') return [];
  if (activeFilter === 'personal')   skills = catalog.personal;
  if (activeFilter === 'workflow')   skills = catalog.workflow;
  if (activeFilter === 'scientific') skills = catalog.scientific;
  if (['BSA / Scouting','Aspect Media','Escalation','Communications','Client Work',
       'gstack','Firecrawl','Tools'].includes(activeFilter)) {
    skills = allSkills.filter(s => s.subgroup === activeFilter);
  }

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

  const bestMatchName = searchQuery ? filtered[0]?.name : null;

  let html = '';

  if (activeFilter === 'all' || activeFilter === 'personal') {
    const personal = filtered.filter(s => s.group === 'personal');
    if (personal.length) {
      const subgroups = [...new Set(personal.map(s => s.subgroup))];
      for (const sg of subgroups) {
        html += sectionHTML(sg, personal.filter(s => s.subgroup === sg), bestMatchName);
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

// ── Ask Claude ────────────────────────────────────────────────────────────────

const recBtn     = document.getElementById('rec-btn');
const recInput   = document.getElementById('rec-input');
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

recInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.ctrlKey) recBtn.click();
});

// ── Start ─────────────────────────────────────────────────────────────────────

init();
