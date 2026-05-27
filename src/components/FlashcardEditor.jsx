import { useState, useEffect } from 'react';
import { ALL_CATEGORIES } from '../utils/qbApi';
import { loadSets, saveSet, deleteSet, newSet, newCard, downloadCSV, downloadAnki, printCards } from '../utils/flashcards';
import FlashcardStudy from './FlashcardStudy';

const S = {
  wrap: { minHeight: '100vh', background: '#0a0b0f', color: '#e8e6e1', fontFamily: "'Palatino Linotype','Book Antiqua',serif" },
  box: { maxWidth: 960, margin: '0 auto', padding: '24px 20px' },
  card: { background: '#12131a', border: '1px solid #1e2030', borderRadius: 8, padding: 20, marginBottom: 12 },
  h2: { color: '#C9A227', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 12px', fontWeight: 700 },
  inp: { padding: '8px 11px', fontSize: 13, fontFamily: 'inherit', background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 5, color: '#e8e6e1', outline: 'none', width: '100%', boxSizing: 'border-box' },
  err: { background: '#2e1a1a', border: '1px solid #c0392b', borderRadius: 5, padding: '10px 14px', fontSize: 13, color: '#e74c3c', marginBottom: 12 },
  ok: { background: '#1a2e1a', border: '1px solid #27ae60', borderRadius: 5, padding: '10px 14px', fontSize: 13, color: '#27ae60', marginBottom: 12 },
};

function btn(c, ghost) {
  c = c || '#C9A227'; ghost = ghost === true;
  return { padding: '7px 14px', fontSize: 12, fontWeight: 700, border: ghost ? ('1px solid ' + c) : 'none', borderRadius: 5, background: ghost ? 'transparent' : c, color: ghost ? c : '#0a0b0f', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1 };
}

export default function FlashcardEditor({ user, onBack }) {
  const [sets, setSets] = useState([]);
  const [activeSetId, setActiveSetId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [studyCards, setStudyCards] = useState(null);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, [user]);

  async function loadAll() {
    try {
      const loaded = await loadSets(user);
      setSets(loaded);
      if (loaded.length > 0 && !activeSetId) selectSet(loaded[0]);
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
  }

  function selectSet(set) {
    setActiveSetId(set.id);
    setEditing({ ...set, cards: [...(set.cards ?? [])] });
    setCardFront(''); setCardBack(''); setEditingCard(null); setMsg(null);
  }

  function createNewSet() {
    const s = newSet('New Set');
    setSets(prev => [s, ...prev]);
    selectSet(s);
  }

  async function save() {
    if (!editing?.title?.trim()) { setMsg({ type: 'err', text: 'Set needs a title.' }); return; }
    setSaving(true); setMsg(null);
    try {
      const saved = await saveSet(user, editing);
      setSets(prev => {
        const idx = prev.findIndex(s => s.id === saved.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [saved, ...prev];
      });
      setEditing(saved);
      setMsg({ type: 'ok', text: 'Saved.' });
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    finally { setSaving(false); }
  }

  async function removeSet(id) {
    if (!window.confirm('Delete this set?')) return;
    try {
      await deleteSet(user, id);
      const next = sets.filter(s => s.id !== id);
      setSets(next);
      if (activeSetId === id) {
        if (next.length > 0) selectSet(next[0]);
        else { setActiveSetId(null); setEditing(null); }
      }
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
  }

  function addCard() {
    if (!cardFront.trim() || !cardBack.trim()) { setMsg({ type: 'err', text: 'Both sides required.' }); return; }
    setEditing(e => ({ ...e, cards: [...e.cards, newCard(cardFront.trim(), cardBack.trim())] }));
    setCardFront(''); setCardBack(''); setMsg(null);
  }

  function removeCard(id) { setEditing(e => ({ ...e, cards: e.cards.filter(c => c.id !== id) })); }
  function startEditCard(card) { setEditingCard(card.id); setCardFront(card.front); setCardBack(card.back); }
  function saveCardEdit() {
    if (!cardFront.trim() || !cardBack.trim()) return;
    setEditing(e => ({ ...e, cards: e.cards.map(c => c.id === editingCard ? { ...c, front: cardFront.trim(), back: cardBack.trim() } : c) }));
    setEditingCard(null); setCardFront(''); setCardBack('');
  }

  if (studyCards) {
    return <FlashcardStudy cards={studyCards} setTitle={editing?.title ?? ''} onClose={() => setStudyCards(null)} />;
  }

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A227', letterSpacing: 2, textTransform: 'uppercase' }}>Flashcards</div>
          <button style={btn('#6b7084', true)} onClick={onBack}>Back</button>
        </div>

        {!user && (
          <div style={{ background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#8a8d9e', marginBottom: 14 }}>
            Guest mode — sets saved in this browser only. Sign in to sync across devices.
          </div>
        )}

        {msg && <div style={msg.type === 'err' ? S.err : S.ok}>{msg.text}</div>}

        <div className="bb-fc-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>
          <div>
            <button style={{ ...btn(), width: '100%', marginBottom: 10 }} onClick={createNewSet}>+ New Set</button>
            {sets.length === 0
              ? <div style={{ fontSize: 12, color: '#4a4d60', padding: '10px 0' }}>No sets yet.</div>
              : sets.map(s => (
                <div key={s.id} onClick={() => selectSet(s)} style={{ padding: '10px 12px', borderRadius: 6, marginBottom: 4, cursor: 'pointer', fontSize: 13, background: activeSetId === s.id ? '#1e2030' : 'transparent', border: '1px solid ' + (activeSetId === s.id ? '#C9A227' : '#1e2030') }}>
                  <div style={{ fontWeight: 600, marginBottom: 2, color: activeSetId === s.id ? '#C9A227' : '#8a8d9e' }}>{s.title || '(untitled)'}</div>
                  <div style={{ fontSize: 11, color: '#4a4d60' }}>{(s.cards?.length ?? 0)} cards{s.category ? ' · ' + s.category : ''}</div>
                </div>
              ))}
          </div>

          {editing ? (
            <div>
              <div style={S.card}>
                <div style={S.h2}>Set Details</div>
                <div className="bb-fc-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7084', marginBottom: 5, letterSpacing: 1, textTransform: 'uppercase' }}>Title</div>
                    <input style={S.inp} value={editing.title} onChange={e => setEditing(ed => ({ ...ed, title: e.target.value }))} placeholder="Set title" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7084', marginBottom: 5, letterSpacing: 1, textTransform: 'uppercase' }}>Category</div>
                    <select style={{ ...S.inp, padding: '8px 11px' }} value={editing.category ?? ''} onChange={e => setEditing(ed => ({ ...ed, category: e.target.value }))}>
                      <option value="">All categories</option>
                      {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button style={btn()} onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Set'}</button>
                  {editing.cards.length > 0 && <button style={btn('#20B2AA', true)} onClick={() => setStudyCards(editing.cards)}>Study ({editing.cards.length})</button>}
                  {editing.cards.length > 0 && <>
                    <button style={btn('#6b7084', true)} onClick={() => downloadCSV(editing)}>CSV</button>
                    <button style={btn('#6b7084', true)} onClick={() => downloadAnki(editing)}>Anki</button>
                    <button style={btn('#6b7084', true)} onClick={() => printCards(editing)}>Print</button>
                  </>}
                  <button style={{ ...btn('#c0392b', true), marginLeft: 'auto' }} onClick={() => removeSet(editing.id)}>Delete Set</button>
                </div>
              </div>

              <div style={S.card}>
                <div style={S.h2}>{editingCard ? 'Edit Card' : 'Add Card'}</div>
                <div className="bb-fc-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7084', marginBottom: 5, letterSpacing: 1, textTransform: 'uppercase' }}>Front</div>
                    <textarea style={{ ...S.inp, height: 70, resize: 'vertical' }} value={cardFront} onChange={e => setCardFront(e.target.value)} placeholder="Clue or term" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7084', marginBottom: 5, letterSpacing: 1, textTransform: 'uppercase' }}>Back (answer)</div>
                    <textarea style={{ ...S.inp, height: 70, resize: 'vertical' }} value={cardBack} onChange={e => setCardBack(e.target.value)} placeholder="Answer" />
                  </div>
                </div>
                {editingCard ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={btn()} onClick={saveCardEdit}>Save Edit</button>
                    <button style={btn('#6b7084', true)} onClick={() => { setEditingCard(null); setCardFront(''); setCardBack(''); }}>Cancel</button>
                  </div>
                ) : (
                  <button style={btn()} onClick={addCard}>Add Card</button>
                )}
              </div>

              {editing.cards.length > 0 && (
                <div style={S.card}>
                  <div style={S.h2}>Cards ({editing.cards.length})</div>
                  {editing.cards.map(c => (
                    <div key={c.id} className="bb-fc-card-row" style={{ padding: '10px 0', borderBottom: '1px solid #1e2030', display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12, alignItems: 'start', fontSize: 13 }}>
                      <div style={{ color: '#e8e6e1' }}>{c.front}</div>
                      <div style={{ color: '#8a8d9e' }}>{c.back}</div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button style={{ ...btn('#20B2AA', true), padding: '4px 8px', fontSize: 11 }} onClick={() => startEditCard(c)}>Edit</button>
                        <button style={{ ...btn('#c0392b', true), padding: '4px 8px', fontSize: 11 }} onClick={() => removeCard(c.id)}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#4a4d60', padding: '40px 0', textAlign: 'center', fontSize: 13 }}>Select a set or create one.</div>
          )}
        </div>
      </div>
    </div>
  );
}
