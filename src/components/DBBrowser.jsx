import { useState, useEffect } from 'react';
import {
  ALL_CATEGORIES, SUBCATEGORIES, ALT_SUBCATEGORIES,
  DIFFICULTY_LABELS, fetchSetList, searchQuestions,
} from '../utils/qbApi';
import FrequencyList from './FrequencyList';

const ALL_DIFFS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const PAGE_SIZE = 25;

const CAT_COLOR = {
  'Literature': '#C9A227', 'History': '#c0392b', 'Science': '#27ae60',
  'Fine Arts': '#8e44ad', 'Religion': '#f39c12', 'Mythology': '#2980b9',
  'Philosophy': '#1abc9c', 'Social Science': '#e67e22', 'Current Events': '#e84393',
  'Geography': '#16a085', 'Other Academic': '#7f8c8d', 'Pop Culture': '#e91e63',
};

const S = {
  wrap: { minHeight: '100vh', background: '#0a0b0f', color: '#e8e6e1', fontFamily: "'Palatino Linotype','Book Antiqua',serif" },
  box: { maxWidth: 900, margin: '0 auto', padding: '24px 20px' },
  card: { background: '#12131a', border: '1px solid #1e2030', borderRadius: 8, padding: 20, marginBottom: 16 },
  h2: { fontSize: 11, color: '#C9A227', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 12px' },
  inp: { padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 6, color: '#e8e6e1', outline: 'none' },
  btn: (c = '#C9A227', ghost = false) => ({
    padding: '8px 16px', fontSize: 12, fontWeight: 700,
    border: ghost ? `1px solid ${c}` : 'none',
    borderRadius: 6, background: ghost ? 'transparent' : c,
    color: ghost ? c : '#0a0b0f', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1,
  }),
  pill: (active, color = '#C9A227') => ({
    display: 'inline-block', padding: '5px 12px', margin: '3px', fontSize: 12,
    borderRadius: 20, cursor: 'pointer', border: `1px solid ${active ? color : '#3a3d50'}`,
    background: active ? color + '22' : 'transparent', color: active ? color : '#a0a3b0',
    fontFamily: 'inherit', fontWeight: active ? 700 : 400,
  }),
  badge: (color) => ({ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: color + '22', color, border: `1px solid ${color}44`, fontWeight: 700, letterSpacing: 0.5, marginRight: 4, display: 'inline-block' }),
};

function stripHtml(html) {
  return typeof html === 'string' ? html.replace(/<[^>]*>/g, '') : '';
}

function TossupCard({ t }) {
  const [expanded, setExpanded] = useState(false);
  const question = stripHtml(t.question ?? '');
  const answer = stripHtml(t.answer ?? '');
  const preview = !expanded && question.length > 250 ? question.slice(0, 250) + '…' : question;
  return (
    <div style={{ borderBottom: '1px solid #1e2030', padding: '14px 0' }}>
      <div style={{ marginBottom: 8 }}>
        {t.category && <span style={S.badge('#C9A227')}>{t.category}</span>}
        {t.subcategory && t.subcategory !== t.category && <span style={S.badge('#6b7084')}>{t.subcategory}</span>}
        {t.difficulty != null && <span style={S.badge('#3a3d50')}>Diff {t.difficulty}</span>}
        {t.set?.name && <span style={{ fontSize: 11, color: '#4a4d60' }}>{t.set.name}</span>}
      </div>
      <div style={{ fontSize: 13, color: '#c0c3d0', lineHeight: 1.65, marginBottom: 8 }}>
        {preview}
        {question.length > 250 && (
          <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', color: '#C9A227', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', marginLeft: 6 }}>
            {expanded ? 'less' : 'more'}
          </button>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#C9A227', fontWeight: 700 }}>ANSWER: {answer}</div>
    </div>
  );
}

function BonusCard({ b }) {
  const leadin = stripHtml(b.leadin ?? '');
  const parts = (b.parts ?? []).map(p => stripHtml(p));
  const answers = (b.answers ?? []).map(a => stripHtml(a));
  return (
    <div style={{ borderBottom: '1px solid #1e2030', padding: '14px 0' }}>
      <div style={{ marginBottom: 8 }}>
        {b.category && <span style={S.badge('#20B2AA')}>{b.category}</span>}
        {b.subcategory && b.subcategory !== b.category && <span style={S.badge('#6b7084')}>{b.subcategory}</span>}
        {b.difficulty != null && <span style={S.badge('#3a3d50')}>Diff {b.difficulty}</span>}
        {b.set?.name && <span style={{ fontSize: 11, color: '#4a4d60' }}>{b.set.name}</span>}
      </div>
      {leadin && <div style={{ fontSize: 13, color: '#9ca0b0', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>{leadin}</div>}
      {parts.map((p, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#c0c3d0', lineHeight: 1.5 }}>[{i + 1}] {p}</div>
          {answers[i] && <div style={{ fontSize: 11, color: '#20B2AA', marginTop: 3 }}>ANSWER: {answers[i]}</div>}
        </div>
      ))}
    </div>
  );
}

export default function DBBrowser({ onBack, onStart }) {
  const [tab, setTab] = useState('practice');

  // Search
  const [query, setQuery] = useState('');
  const [questionType, setQuestionType] = useState('all');
  const [tossups, setTossups] = useState(null);
  const [bonuses, setBonuses] = useState(null);
  const [tPage, setTPage] = useState(1);
  const [bPage, setBPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Category / subcategory selection
  const [selCats, setSelCats] = useState([]);
  const [selSubs, setSelSubs] = useState([]);

  // Set list
  const [sets, setSets] = useState([]);
  const [setsLoading, setSetsLoading] = useState(true);
  const [setFilter, setSetFilter] = useState('');
  const [selSets, setSelSets] = useState([]);

  useEffect(() => {
    fetchSetList()
      .then(data => { setSets(data); setSetsLoading(false); })
      .catch(() => setSetsLoading(false));
  }, []);

  const filteredSets = setFilter
    ? sets.filter(s => s.toLowerCase().includes(setFilter.toLowerCase()))
    : sets;

  function toggleCat(cat) {
    setSelCats(p => {
      if (p.includes(cat)) {
        const catSubs = [...(SUBCATEGORIES[cat] ?? []), ...(ALT_SUBCATEGORIES[cat] ?? [])];
        setSelSubs(prev => prev.filter(s => !catSubs.includes(s)));
        return p.filter(c => c !== cat);
      }
      return [...p, cat];
    });
  }

  function toggleSub(sub) {
    setSelSubs(p => p.includes(sub) ? p.filter(s => s !== sub) : [...p, sub]);
  }

  function toggleSet(name) {
    setSelSets(p => p.includes(name) ? p.filter(s => s !== name) : [...p, name]);
  }

  async function doSearch(tp = 1, bp = 1) {
    setSearching(true);
    setSearchError(null);
    try {
      const result = await searchQuestions({
        query, categories: selCats, difficulties: [],
        questionType, searchType: 'all',
        maxReturnLength: PAGE_SIZE,
        tossupPagination: tp, bonusPagination: bp,
      });
      setTossups(result.tossups);
      setBonuses(result.bonuses);
      setTPage(tp);
      setBPage(bp);
    } catch (e) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  }

  function handlePractice() {
    if (!onStart) return;
    onStart({
      categories: selCats,
      subcategories: selSubs,
      difficulties: [3, 4, 5],
      num: 20,
      speed: 400,
      setName: selSets.length === 1 ? selSets[0] : undefined,
    });
  }

  const hasSelection = selCats.length > 0 || selSets.length > 0;
  const showTossups = questionType !== 'bonus';
  const showBonuses = questionType !== 'tossup';

  // Subcategory rows for selected cats
  const subRows = selCats.filter(cat =>
    (SUBCATEGORIES[cat]?.length ?? 0) + (ALT_SUBCATEGORIES[cat]?.length ?? 0) > 0
  );

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A227', letterSpacing: 2, textTransform: 'uppercase' }}>Question Database</div>
          <button style={S.btn('#6b7084', true)} onClick={onBack}>Back</button>
        </div>

        {/* TAB BAR */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #1e2030' }}>
          {[
            { id: 'practice', label: 'Practice & Search' },
            { id: 'frequency', label: 'Frequency List' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 20px', fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
                background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #C9A227' : '2px solid transparent',
                color: tab === t.id ? '#C9A227' : '#6b7084', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: 1, marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* FREQUENCY TAB */}
        {tab === 'frequency' && <FrequencyList />}

        {tab === 'practice' && <>

        {/* SEARCH */}
        <div style={S.card}>
          <div style={S.h2}>Search</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              style={{ ...S.inp, flex: 1, minWidth: 200 }}
              placeholder="Search question text or answer..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
            />
            <select style={{ ...S.inp, padding: '8px 10px', fontSize: 12 }} value={questionType} onChange={e => setQuestionType(e.target.value)}>
              <option value="all">All</option>
              <option value="tossup">Tossups</option>
              <option value="bonus">Bonuses</option>
            </select>
            <button style={S.btn()} onClick={() => doSearch()}>Search</button>
          </div>
        </div>

        {/* CATEGORIES */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={S.h2}>Categories <span style={{ color: '#6b7084', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select to filter)</span></div>
            {selCats.length > 0 && (
              <button onClick={() => { setSelCats([]); setSelSubs([]); }} style={{ background: 'none', border: 'none', color: '#4a4d60', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>Clear</button>
            )}
          </div>
          <div>
            {ALL_CATEGORIES.map(cat => {
              const c = CAT_COLOR[cat] ?? '#C9A227';
              return (
                <button key={cat} style={S.pill(selCats.includes(cat), c)} onClick={() => toggleCat(cat)}>
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Subcategories */}
          {subRows.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e2030' }}>
              <div style={{ fontSize: 11, color: '#8a8d9e', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                Subcategories &amp; Topics
              </div>
              {subRows.map(cat => {
                const c = CAT_COLOR[cat] ?? '#C9A227';
                const subs = SUBCATEGORIES[cat] ?? [];
                const alts = ALT_SUBCATEGORIES[cat] ?? [];
                return (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: c + 'aa', marginBottom: 4, fontWeight: 700 }}>{cat}</div>
                    {subs.map(sub => (
                      <button key={sub} style={S.pill(selSubs.includes(sub), c)} onClick={() => toggleSub(sub)}>{sub}</button>
                    ))}
                    {alts.map(sub => (
                      <button key={sub} style={S.pill(selSubs.includes(sub), '#6b7084')} onClick={() => toggleSub(sub)}>{sub}</button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SET LIST */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={S.h2}>Tournament Sets <span style={{ color: '#6b7084', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({selSets.length} selected)</span></div>
            {selSets.length > 0 && (
              <button onClick={() => setSelSets([])} style={{ background: 'none', border: 'none', color: '#4a4d60', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>Clear</button>
            )}
          </div>
          <input
            style={{ ...S.inp, width: '100%', boxSizing: 'border-box', marginBottom: 10 }}
            placeholder="Filter sets by name..."
            value={setFilter}
            onChange={e => setSetFilter(e.target.value)}
          />
          {setsLoading
            ? <div style={{ color: '#4a4d60', fontSize: 13 }}>Loading sets...</div>
            : (
              <div style={{ maxHeight: 240, overflowY: 'auto', background: '#0f1018', borderRadius: 6, border: '1px solid #1e2030' }}>
                {filteredSets.map((name, i) => (
                  <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid #1e2030', cursor: 'pointer', background: selSets.includes(name) ? '#1a2530' : i % 2 === 1 ? '#0a0b0f' : 'transparent' }}>
                    <input
                      type="checkbox"
                      checked={selSets.includes(name)}
                      onChange={() => toggleSet(name)}
                      style={{ accentColor: '#C9A227' }}
                    />
                    <span style={{ fontSize: 13, color: selSets.includes(name) ? '#C9A227' : '#c0c3d0' }}>{name}</span>
                  </label>
                ))}
              </div>
            )
          }
        </div>

        {/* PRACTICE BUTTON */}
        {onStart && (
          <button
            onClick={handlePractice}
            disabled={!hasSelection}
            style={{
              display: 'block', width: '100%', padding: '14px', fontSize: 14, fontWeight: 700,
              background: hasSelection ? '#C9A227' : '#2a2d40',
              color: hasSelection ? '#0a0b0f' : '#4a4d60',
              border: 'none', borderRadius: 8, cursor: hasSelection ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24,
            }}
          >
            {hasSelection ? 'Practice from Selection ▶' : 'Select categories or a set to practice'}
          </button>
        )}

        {/* SEARCH RESULTS */}
        {searchError && <div style={{ background: '#2e1a1a', border: '1px solid #c0392b', borderRadius: 6, padding: '12px 16px', fontSize: 13, color: '#e74c3c', marginBottom: 16 }}>{searchError}</div>}
        {searching && <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Searching...</div>}
        {!searching && tossups !== null && (
          <>
            {showTossups && (
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#C9A227', letterSpacing: 1, textTransform: 'uppercase' }}>
                    Tossups <span style={{ color: '#4a4d60', fontWeight: 400 }}>({tossups.count ?? 0} total)</span>
                  </div>
                  {(tossups.count ?? 0) > PAGE_SIZE && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                      <button disabled={tPage <= 1} onClick={() => doSearch(tPage - 1, bPage)} style={{ ...S.btn('#4a4d60', true), padding: '4px 10px', opacity: tPage <= 1 ? 0.4 : 1 }}>Prev</button>
                      <span style={{ color: '#6b7084' }}>p.{tPage}</span>
                      <button disabled={tPage * PAGE_SIZE >= (tossups.count ?? 0)} onClick={() => doSearch(tPage + 1, bPage)} style={{ ...S.btn('#4a4d60', true), padding: '4px 10px', opacity: tPage * PAGE_SIZE >= (tossups.count ?? 0) ? 0.4 : 1 }}>Next</button>
                    </div>
                  )}
                </div>
                {(tossups.questionArray?.length ?? 0) === 0
                  ? <div style={{ color: '#4a4d60', textAlign: 'center', padding: 16, fontSize: 13 }}>No tossups found.</div>
                  : (tossups.questionArray ?? []).map((t, i) => <TossupCard key={t._id ?? i} t={t} />)
                }
              </div>
            )}
            {showBonuses && (
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#20B2AA', letterSpacing: 1, textTransform: 'uppercase' }}>
                    Bonuses <span style={{ color: '#4a4d60', fontWeight: 400 }}>({bonuses?.count ?? 0} total)</span>
                  </div>
                  {(bonuses?.count ?? 0) > PAGE_SIZE && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                      <button disabled={bPage <= 1} onClick={() => doSearch(tPage, bPage - 1)} style={{ ...S.btn('#4a4d60', true), padding: '4px 10px', opacity: bPage <= 1 ? 0.4 : 1 }}>Prev</button>
                      <span style={{ color: '#6b7084' }}>p.{bPage}</span>
                      <button disabled={bPage * PAGE_SIZE >= (bonuses?.count ?? 0)} onClick={() => doSearch(tPage, bPage + 1)} style={{ ...S.btn('#4a4d60', true), padding: '4px 10px', opacity: bPage * PAGE_SIZE >= (bonuses?.count ?? 0) ? 0.4 : 1 }}>Next</button>
                    </div>
                  )}
                </div>
                {(bonuses?.questionArray?.length ?? 0) === 0
                  ? <div style={{ color: '#4a4d60', textAlign: 'center', padding: 16, fontSize: 13 }}>No bonuses found.</div>
                  : (bonuses?.questionArray ?? []).map((b, i) => <BonusCard key={b._id ?? i} b={b} />)
                }
              </div>
            )}
          </>
        )}

        </>}
      </div>
    </div>
  );
}
