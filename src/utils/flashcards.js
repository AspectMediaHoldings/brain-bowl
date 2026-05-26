import { supabase } from '../lib/supabase';

const LS_KEY = 'bb_flashcard_sets';

function lsLoad() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
}
function lsSave(sets) { localStorage.setItem(LS_KEY, JSON.stringify(sets)); }

export function newSet(title = '', category = '') {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), title, category, cards: [], created_at: now, updated_at: now };
}
export function newCard(front = '', back = '') {
  return { id: crypto.randomUUID(), front, back };
}

export async function loadSets(user) {
  if (!user) return lsLoad();
  const { data, error } = await supabase.from('flashcard_sets').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveSet(user, set) {
  const now = new Date().toISOString();
  if (!user) {
    const sets = lsLoad();
    const idx = sets.findIndex(s => s.id === set.id);
    const updated = { ...set, updated_at: now };
    if (idx >= 0) sets[idx] = updated;
    else sets.unshift({ ...updated, id: set.id || crypto.randomUUID(), created_at: now });
    lsSave(sets);
    return sets.find(s => s.id === set.id) ?? sets[0];
  }
  const { data, error } = await supabase.from('flashcard_sets')
    .upsert({ ...set, user_id: user.id, updated_at: now })
    .select().single();
  if (error) throw error;
  return data;
}

export async function deleteSet(user, setId) {
  if (!user) { lsSave(lsLoad().filter(s => s.id !== setId)); return; }
  await supabase.from('flashcard_sets').delete().eq('id', setId).eq('user_id', user.id);
}

export async function quickSaveCard(user, front, back) {
  const sets = await loadSets(user);
  let quickSet = sets.find(s => s.title === 'Quick Saves');
  if (!quickSet) quickSet = newSet('Quick Saves');
  quickSet.cards = [...(quickSet.cards ?? []), newCard(front, back)];
  return saveSet(user, quickSet);
}

export function downloadCSV(set) {
  const header = 'front,back\n';
  const rows = set.cards.map(c =>
    '"' + (c.front ?? '').replace(/"/g, '""') + '","' + (c.back ?? '').replace(/"/g, '""') + '"'
  ).join('\n');
  triggerDownload(set.title + '.csv', 'text/csv', header + rows);
}

export function downloadAnki(set) {
  const rows = set.cards.map(c => c.front + '\t' + c.back).join('\n');
  triggerDownload(set.title + '.txt', 'text/plain', rows);
}

export function printCards(set) {
  const cards = set.cards.map(c =>
    '<div class="card"><div class="front"><strong>Front:</strong><br>' + c.front + '</div><div class="back"><strong>Back:</strong><br>' + c.back + '</div></div>'
  ).join('');
  const html = '<!doctype html><html><head><title>' + set.title + '</title><style>body{font-family:serif;margin:0;padding:20px}h1{font-size:18px;margin-bottom:16px}.card{border:1px solid #ccc;border-radius:6px;padding:16px;margin-bottom:12px;page-break-inside:avoid}.front{margin-bottom:10px;font-size:14px}.back{border-top:1px dashed #ccc;padding-top:10px;font-size:14px;color:#555}</style></head><body><h1>' + set.title + '</h1>' + cards + '</body></html>';
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
}

function triggerDownload(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
