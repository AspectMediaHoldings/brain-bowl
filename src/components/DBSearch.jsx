import { useState } from 'react';
import {
  ALL_CATEGORIES, DIFFICULTY_LABELS, searchQuestions,
} from '../utils/qbApi';

const ALL_DIFFS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const PAGE_SIZE = 25;

const S = {
  lbl: { fontSize: 11, color: '#6b7084', marginBottom: 6 },
  btn: (c = '#C9A227', ghost = false) => ({
    padding: '8px 16px', fontSize: 12, fontWeight: 700,
    border: ghost ? `1px solid ${c}` : 'none',
    borderRadius: 5, background: ghost ? 'transparent' : c,
    color: ghost ? c : '#0a0b0f', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1,
  }),
  inp: { padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 6, color: '#e8e6e1', outline: 'none' },
  sel: { padding: '8px 10px', fontSize: 12, background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 6, color: '#e8e6e1', fontFamily: 'inherit' },
  card: { background: '#12131a', border: '1px solid #1e2030', borderRadius: 8, padding: 20, marginBottom: 16 },
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

export default function DBSearch() {
  const [query, setQuery] = useState('');
  const [questionType, setQuestionType] = useState('all');
  const [searchType, setSearchType] = useState('all');
  const [selCats, setSelCats] = useState([]);
  const [diffs, setDiffs] = useState([]);
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [tossups, setTossups] = useState(null);
  const [bonuses, setBonuses] = useState(null);
  const [tPage, setTPage] = useState(1);
  const [bPage, setBPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function doSearch(tp = 1, bp = 1) {
    setLoading(true);
    setError(null);
    try {
      const result = await searchQuestions({
        query, categories: selCats, difficulties: diffs,
        questionType, searchType, maxReturnLength: PAGE_SIZE,
        tossupPagination: tp, bonusPagination: bp,
        minYear: minYear || undefined, maxYear: maxYear || undefined,
      });
      setTossups(result.tossups);
      setBonuses(result.bonuses);
      setTPage(tp);
      setBPage(bp);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const showTossups = questionType !== 'bonus';
  const showBonuses = questionType !== 'tossup';

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          style={{ ...S.inp, flex: 1, minWidth: 200 }}
          placeholder="Search questions... (leave empty to browse with filters)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
        />
        <select style={S.sel} value={questionType} onChange={e => setQuestionType(e.target.value)}>
          <option value="all">All</option>
          <option value="tossup">Tossups</option>
          <option value="bonus">Bonuses</option>
        </select>
        <button style={S.btn()} onClick={() => doSearch()}>Search</button>
        <button style={S.btn('#4a4d60', true)} onClick={() => setShowFilters(f => !f)}>
          Filters {showFilters ? '▲' : '▼'}
        </button>
      </div>

      {showFilters && (
        <div style={S.card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={S.lbl}>Search In</div>
              <select style={{ ...S.sel, width: '100%' }} value={searchType} onChange={e => setSearchType(e.target.value)}>
                <option value="all">All Text</option>
                <option value="question">Question Only</option>
                <option value="answer">Answer Only</option>
                <option value="exactAnswer">Exact Answer</option>
              </select>
            </div>
            <div>
              <div style={S.lbl}>Year Range</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" placeholder="Min" value={minYear} onChange={e => setMinYear(e.target.value)}
                  style={{ ...S.inp, padding: '6px 10px', flex: 1, fontSize: 12 }} />
                <input type="number" placeholder="Max" value={maxYear} onChange={e => setMaxYear(e.target.value)}
                  style={{ ...S.inp, padding: '6px 10px', flex: 1, fontSize: 12 }} />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={S.lbl}>Categories</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_CATEGORIES.map(cat => (
                <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: selCats.includes(cat) ? '#C9A227' : '#a0a3b0' }}>
                  <input type="checkbox" checked={selCats.includes(cat)} onChange={() => setSelCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} />
                  {cat}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div style={S.lbl}>Difficulties</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_DIFFS.map(d => (
                <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: diffs.includes(d) ? '#C9A227' : '#a0a3b0' }}>
                  <input type="checkbox" checked={diffs.includes(d)} onChange={() => setDiffs(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b))} />
                  {DIFFICULTY_LABELS[d]}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <div style={{ background: '#2e1a1a', border: '1px solid #c0392b', borderRadius: 6, padding: '12px 16px', fontSize: 13, color: '#e74c3c', marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Searching...</div>}

      {!loading && tossups !== null && (
        <>
          {showTossups && (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#C9A227', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Tossups <span style={{ color: '#4a4d60', fontWeight: 400 }}>({tossups.count ?? 0} total)</span>
                </div>
                {(tossups.count ?? 0) > PAGE_SIZE && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                    <button disabled={tPage <= 1} onClick={() => doSearch(tPage - 1, bPage)}
                      style={{ ...S.btn('#4a4d60', true), padding: '4px 10px', opacity: tPage <= 1 ? 0.4 : 1 }}>Prev</button>
                    <span style={{ color: '#6b7084' }}>p.{tPage}</span>
                    <button disabled={tPage * PAGE_SIZE >= (tossups.count ?? 0)} onClick={() => doSearch(tPage + 1, bPage)}
                      style={{ ...S.btn('#4a4d60', true), padding: '4px 10px', opacity: tPage * PAGE_SIZE >= (tossups.count ?? 0) ? 0.4 : 1 }}>Next</button>
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
                    <button disabled={bPage <= 1} onClick={() => doSearch(tPage, bPage - 1)}
                      style={{ ...S.btn('#4a4d60', true), padding: '4px 10px', opacity: bPage <= 1 ? 0.4 : 1 }}>Prev</button>
                    <span style={{ color: '#6b7084' }}>p.{bPage}</span>
                    <button disabled={bPage * PAGE_SIZE >= (bonuses?.count ?? 0)} onClick={() => doSearch(tPage, bPage + 1)}
                      style={{ ...S.btn('#4a4d60', true), padding: '4px 10px', opacity: bPage * PAGE_SIZE >= (bonuses?.count ?? 0) ? 0.4 : 1 }}>Next</button>
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
    </>
  );
}
