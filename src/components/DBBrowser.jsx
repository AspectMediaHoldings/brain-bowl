import { useState } from 'react';
import DBSearch from './DBSearch';
import FrequencyList from './FrequencyList';
import SetList from './SetList';

const S = {
  wrap: { minHeight: '100vh', background: '#0a0b0f', color: '#e8e6e1', fontFamily: "'Palatino Linotype','Book Antiqua',serif" },
  box: { maxWidth: 900, margin: '0 auto', padding: '24px 20px' },
  tab: (active) => ({
    padding: '9px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1,
    border: 'none', borderBottom: active ? '2px solid #C9A227' : '2px solid transparent',
    background: 'transparent', color: active ? '#C9A227' : '#4a4d60',
  }),
  btn: (c = '#C9A227', ghost = false) => ({
    padding: '8px 16px', fontSize: 12, fontWeight: 700,
    border: ghost ? `1px solid ${c}` : 'none',
    borderRadius: 6, background: ghost ? 'transparent' : c,
    color: ghost ? c : '#0a0b0f', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1,
  }),
};

const TABS = [
  ['search', 'Search'],
  ['frequency', 'Frequency List'],
  ['sets', 'Set List'],
];

export default function DBBrowser({ onBack, onSelectSet }) {
  const [tab, setTab] = useState('search');

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A227', letterSpacing: 2, textTransform: 'uppercase' }}>Database</div>
          <button style={S.btn('#6b7084', true)} onClick={onBack}>Back</button>
        </div>
        <div style={{ borderBottom: '1px solid #1e2030', marginBottom: 24 }}>
          {TABS.map(([key, label]) => (
            <button key={key} style={S.tab(tab === key)} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
        {tab === 'search' && <DBSearch />}
        {tab === 'frequency' && <FrequencyList />}
        {tab === 'sets' && <SetList onSelectSet={onSelectSet} />}
      </div>
    </div>
  );
}
