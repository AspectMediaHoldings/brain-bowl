import { useState, useEffect } from 'react';
import { fetchSetList } from '../utils/qbApi';

export default function SetList({ onSelectSet }) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSetList()
      .then(data => { setSets(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const filtered = filter
    ? sets.filter(s => s.toLowerCase().includes(filter.toLowerCase()))
    : sets;

  return (
    <>
      <p style={{ color: '#a0a3b0', fontSize: 13, margin: '0 0 16px' }}>
        All tournament sets in the qbreader database. Click a set to practice from it.
      </p>
      <input
        style={{ width: '100%', padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 6, color: '#e8e6e1', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
        placeholder="Filter sets by name..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      {loading && <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>}
      {error && <div style={{ background: '#2e1a1a', border: '1px solid #c0392b', borderRadius: 6, padding: '12px 16px', fontSize: 13, color: '#e74c3c' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ background: '#12131a', border: '1px solid #1e2030', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e2030', fontSize: 11, color: '#6b7084' }}>
            {filtered.length} set{filtered.length !== 1 ? 's' : ''} — click to practice
          </div>
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ textAlign: 'center', color: '#4a4d60', padding: 32, fontSize: 13 }}>No sets match.</div>
              : filtered.map((name, i) => (
                <div
                  key={name}
                  onClick={() => onSelectSet && onSelectSet(name)}
                  style={{
                    padding: '10px 14px', borderBottom: '1px solid #1e2030', fontSize: 13,
                    background: i % 2 === 1 ? '#0f1018' : 'transparent',
                    cursor: onSelectSet ? 'pointer' : 'default',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                  onMouseEnter={e => { if (onSelectSet) e.currentTarget.style.background = '#1a2a3a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? '#0f1018' : 'transparent'; }}
                >
                  <span style={{ color: '#c0c3d0' }}>{name}</span>
                  {onSelectSet && <span style={{ fontSize: 11, color: '#C9A227', fontWeight: 700, letterSpacing: 1 }}>PRACTICE ▶</span>}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </>
  );
}
