import { useState, useEffect, useCallback } from 'react';
import {
  ALL_CATEGORIES, SUBCATEGORIES, ALT_SUBCATEGORIES,
  DIFFICULTY_LABELS, fetchFrequencyList,
} from '../utils/qbApi';

const LIMITS = [25, 50, 100, 200, 500, 1000];
const ALL_DIFFS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const CAT_COLOR = {
  'Literature': '#C9A227', 'History': '#c0392b', 'Science': '#27ae60',
  'Fine Arts': '#8e44ad', 'Religion': '#f39c12', 'Mythology': '#2980b9',
  'Philosophy': '#1abc9c', 'Social Science': '#e67e22', 'Current Events': '#e84393',
  'Geography': '#16a085', 'Other Academic': '#7f8c8d', 'Pop Culture': '#e91e63',
};

const S = {
  lbl: { fontSize: 11, color: '#6b7084', marginBottom: 6 },
  h2: { fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 700 },
  btn: (c = '#C9A227', ghost = false) => ({
    padding: '7px 14px', fontSize: 11, fontWeight: 700,
    border: ghost ? `1px solid ${c}` : 'none',
    borderRadius: 5, background: ghost ? 'transparent' : c,
    color: ghost ? c : '#0a0b0f', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1,
  }),
  chip: (color, dashed = false) => ({
    display: 'inline-block', padding: '5px 12px', margin: '3px',
    borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
    border: `1px ${dashed ? 'dashed' : 'solid'} ${color}`,
    background: 'transparent', color: color, letterSpacing: 0.3,
  }),
  sel: { padding: '6px 10px', fontSize: 12, background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 4, color: '#e8e6e1', fontFamily: 'inherit' },
  card: { background: '#12131a', border: '1px solid #1e2030', borderRadius: 8, padding: 20, marginBottom: 16 },
};

function DifficultySelect({ difficulties, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ALL_DIFFS.map(d => (
        <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: difficulties.includes(d) ? '#C9A227' : '#6b7084' }}>
          <input
            type="checkbox"
            checked={difficulties.includes(d)}
            onChange={() => onChange(
              difficulties.includes(d)
                ? difficulties.filter(x => x !== d)
                : [...difficulties, d].sort((a, b) => a - b)
            )}
          />
          {DIFFICULTY_LABELS[d]}
        </label>
      ))}
    </div>
  );
}

export default function FrequencyList() {
  const [view, setView] = useState('categories');
  const [category, setCategory] = useState(null);
  const [selected, setSelected] = useState(null);
  const [difficulties, setDifficulties] = useState([3, 4, 5]);
  const [limit, setLimit] = useState(50);
  const [questionType, setQuestionType] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);

  const doFetch = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const params = { difficulties, limit, questionType };
      if (selected.paramType === 'subcategory') params.subcategory = selected.name;
      else if (selected.paramType === 'alt') params.alternateSubcategory = selected.name;
      else params.category = selected.name;
      const list = await fetchFrequencyList(params);
      setResults(list);
      setFetched(true);
    } catch (e) {
      setError(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selected, difficulties, limit, questionType]);

  useEffect(() => {
    if (view === 'results' && selected && !fetched) {
      doFetch();
    }
  }, [view, selected, fetched, doFetch]);

  function handleCategoryClick(cat) {
    setCategory(cat);
    setFetched(false);
    const hasSubs = (SUBCATEGORIES[cat]?.length ?? 0) + (ALT_SUBCATEGORIES[cat]?.length ?? 0) > 0;
    if (!hasSubs) {
      setSelected({ name: cat, paramType: 'category' });
      setView('results');
    } else {
      setView('subcategories');
    }
  }

  function handleSubClick(name, paramType) {
    setSelected({ name, paramType });
    setFetched(false);
    setView('results');
  }

  const color = category ? (CAT_COLOR[category] ?? '#C9A227') : '#C9A227';

  if (view === 'categories') {
    return (
      <>
        <p style={{ color: '#6b7084', fontSize: 13, margin: '0 0 20px' }}>
          Browse the most frequently asked answers in quizbowl by category.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {ALL_CATEGORIES.map(cat => {
            const c = CAT_COLOR[cat] ?? '#C9A227';
            const subCount = (SUBCATEGORIES[cat]?.length ?? 0) + (ALT_SUBCATEGORIES[cat]?.length ?? 0);
            return (
              <div
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                style={{ background: '#12131a', border: `1px solid ${c}33`, borderRadius: 8, padding: '14px 12px', cursor: 'pointer', textAlign: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c + '77'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c + '33'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: c, marginBottom: 4 }}>{cat}</div>
                <div style={{ fontSize: 11, color: '#4a4d60' }}>
                  {subCount > 0 ? `${subCount} subcategories` : 'Category level'}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  if (view === 'subcategories') {
    const subs = SUBCATEGORIES[category] ?? [];
    const alts = ALT_SUBCATEGORIES[category] ?? [];
    return (
      <>
        <button
          style={{ background: 'none', border: 'none', color: '#4a4d60', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0, marginBottom: 16 }}
          onClick={() => setView('categories')}
        >
          ← All Categories
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: 1, marginBottom: 20 }}>{category}</div>
        <div style={{ marginBottom: 20 }}>
          <button style={S.chip(color, true)} onClick={() => handleSubClick(category, 'category')}>
            All {category}
          </button>
        </div>
        {subs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={S.h2}>Subcategories</div>
            {subs.map(s => (
              <button key={s} style={S.chip(color)} onClick={() => handleSubClick(s, 'subcategory')}>{s}</button>
            ))}
          </div>
        )}
        {alts.length > 0 && (
          <div>
            <div style={S.h2}>Specific Topics</div>
            {alts.map(s => (
              <button key={s} style={S.chip('#6b7084')} onClick={() => handleSubClick(s, 'alt')}>{s}</button>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        style={{ background: 'none', border: 'none', color: '#4a4d60', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0, marginBottom: 12 }}
        onClick={() => {
          const hasSubs = (SUBCATEGORIES[category]?.length ?? 0) + (ALT_SUBCATEGORIES[category]?.length ?? 0) > 0;
          setView(hasSubs ? 'subcategories' : 'categories');
        }}
      >
        ← {category}
      </button>
      <div style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: 1, marginBottom: 20 }}>{selected?.name}</div>

      <div style={S.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end', marginBottom: 16 }}>
          <div>
            <div style={S.lbl}>Question Type</div>
            <select style={{ ...S.sel, width: '100%' }} value={questionType} onChange={e => setQuestionType(e.target.value)}>
              <option value="all">All Questions</option>
              <option value="tossup">Tossups Only</option>
              <option value="bonus">Bonuses Only</option>
            </select>
          </div>
          <div>
            <div style={S.lbl}>Limit</div>
            <select style={{ ...S.sel, width: '100%' }} value={limit} onChange={e => setLimit(Number(e.target.value))}>
              {LIMITS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <button style={S.btn()} onClick={doFetch}>Refresh</button>
        </div>
        <div>
          <div style={S.lbl}>Difficulties</div>
          <DifficultySelect difficulties={difficulties} onChange={setDifficulties} />
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>}
      {error && <div style={{ background: '#2e1a1a', border: '1px solid #c0392b', borderRadius: 6, padding: '12px 16px', fontSize: 13, color: '#e74c3c', marginBottom: 12 }}>{error}</div>}
      {!loading && fetched && results.length === 0 && (
        <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>No results. Try different filters.</div>
      )}
      {results.length > 0 && (
        <div style={{ background: '#12131a', border: '1px solid #1e2030', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2d40' }}>
                {['Rank', 'Answer', 'Count'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Count' ? 'right' : 'left', padding: '10px 14px', fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e2030', background: i % 2 === 1 ? '#0f1018' : 'transparent' }}>
                  <td style={{ padding: '9px 14px', color: '#4a4d60', width: 52 }}>{i + 1}</td>
                  <td style={{ padding: '9px 14px', fontWeight: 600 }}>{row.answer}</td>
                  <td style={{ padding: '9px 14px', color, fontWeight: 700, textAlign: 'right' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
