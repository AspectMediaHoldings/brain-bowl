import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FONT = "'Palatino Linotype','Book Antiqua',serif";

const S = {
  wrap: {
    minHeight: '100vh',
    background: '#0a0b0f',
    color: '#e8e6e1',
    fontFamily: FONT,
  },
  box: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '24px 20px',
  },
  card: {
    background: '#12131a',
    border: '1px solid #1e2030',
    borderRadius: 8,
    padding: 24,
    marginBottom: 16,
  },
  backBtn: {
    padding: '8px 18px',
    fontSize: 12,
    fontWeight: 700,
    border: '1px solid #4a4d60',
    borderRadius: 6,
    background: 'transparent',
    color: '#6b7084',
    cursor: 'pointer',
    fontFamily: FONT,
    letterSpacing: 1,
  },
  rangeBtn: (active) => ({
    padding: '7px 16px',
    fontSize: 12,
    fontWeight: 700,
    border: `1px solid ${active ? '#C9A227' : '#2a2d40'}`,
    borderRadius: 6,
    background: active ? '#C9A22722' : 'transparent',
    color: active ? '#C9A227' : '#6b7084',
    cursor: 'pointer',
    fontFamily: FONT,
    letterSpacing: 1,
  }),
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    fontSize: 11,
    color: '#4a4d60',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 700,
    fontFamily: FONT,
    borderBottom: '1px solid #2a2d40',
  },
  td: {
    padding: '13px 14px',
    fontSize: 14,
  },
};

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardScreen({ onBack, currentUserId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        let query = supabase
          .from('sessions')
          .select('user_id, pts, bonus_pts, played, completed_at');

        if (range === '7d') {
          query = query.gte(
            'completed_at',
            new Date(Date.now() - 7 * 86400000).toISOString()
          );
        } else if (range === '30d') {
          query = query.gte(
            'completed_at',
            new Date(Date.now() - 30 * 86400000).toISOString()
          );
        }

        const { data: sessions } = await query;

        const byUser = {};
        for (const s of sessions ?? []) {
          if (!byUser[s.user_id]) {
            byUser[s.user_id] = { pts: 0, sessions: 0, played: 0 };
          }
          byUser[s.user_id].pts += (s.pts || 0) + (s.bonus_pts || 0);
          byUser[s.user_id].sessions++;
          byUser[s.user_id].played += s.played || 0;
        }

        const topIds = Object.keys(byUser)
          .sort((a, b) => byUser[b].pts - byUser[a].pts)
          .slice(0, 25);

        const { data: profiles } = topIds.length
          ? await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', topIds)
          : { data: [] };

        const pm = Object.fromEntries(
          (profiles ?? []).map(p => [p.id, p.display_name])
        );

        if (!cancelled) {
          setRows(
            topIds.map((id, idx) => ({
              rank: idx + 1,
              userId: id,
              name: pm[id] ?? '(unknown)',
              ...byUser[id],
            }))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [range]);

  return (
    <div style={S.wrap}>
      <div style={S.box}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: '1px solid #1e2030',
        }}>
          <div>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#C9A227',
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}>
              Leaderboard
            </div>
            <div style={{
              fontSize: 11,
              color: '#4a4d60',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginTop: 4,
            }}>
              Top 25 · Brain Bowl Practice
            </div>
          </div>
          <button style={S.backBtn} onClick={onBack}>Back</button>
        </div>

        {/* Range filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['7d', '7 Days'], ['30d', '30 Days'], ['all', 'All Time']].map(([val, label]) => (
            <button
              key={val}
              style={S.rangeBtn(range === val)}
              onClick={() => setRange(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table card */}
        <div style={S.card}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              color: '#4a4d60',
              padding: '48px 0',
              fontSize: 13,
              letterSpacing: 1,
            }}>
              Loading...
            </div>
          ) : rows.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#4a4d60',
              padding: '48px 0',
              fontSize: 13,
            }}>
              No data for this time period.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, width: 56 }}>#</th>
                    <th style={S.th}>Student</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>Points</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>Sessions</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>Questions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const isMe = r.userId === currentUserId;
                    const medal = MEDALS[r.rank];

                    return (
                      <tr
                        key={r.userId}
                        style={{
                          borderBottom: '1px solid #1e2030',
                          background: isMe ? '#1a1500' : 'transparent',
                        }}
                      >
                        {/* Rank */}
                        <td style={{
                          ...S.td,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}>
                          {medal ? (
                            <span style={{ fontSize: 20 }}>{medal}</span>
                          ) : (
                            <span style={{ color: '#4a4d60', fontSize: 13 }}>#{r.rank}</span>
                          )}
                        </td>

                        {/* Student name */}
                        <td style={{
                          ...S.td,
                          fontWeight: isMe ? 700 : 500,
                          color: isMe ? '#C9A227' : '#e8e6e1',
                        }}>
                          {r.name}
                          {isMe && (
                            <span style={{
                              fontSize: 9,
                              marginLeft: 8,
                              padding: '2px 6px',
                              borderRadius: 3,
                              background: '#C9A22730',
                              color: '#C9A227',
                              fontWeight: 700,
                              letterSpacing: 1,
                              textTransform: 'uppercase',
                              verticalAlign: 'middle',
                            }}>
                              You
                            </span>
                          )}
                        </td>

                        {/* Points */}
                        <td style={{
                          ...S.td,
                          textAlign: 'right',
                          color: '#C9A227',
                          fontWeight: 700,
                          fontSize: 15,
                        }}>
                          {r.pts.toLocaleString()}
                        </td>

                        {/* Sessions */}
                        <td style={{
                          ...S.td,
                          textAlign: 'right',
                          color: '#6b7084',
                        }}>
                          {r.sessions}
                        </td>

                        {/* Questions */}
                        <td style={{
                          ...S.td,
                          textAlign: 'right',
                          color: '#6b7084',
                        }}>
                          {r.played.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && rows.length > 0 && (
          <p style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#3a3d50',
            marginTop: 8,
            letterSpacing: 1,
          }}>
            Showing top {rows.length} participants
          </p>
        )}
      </div>
    </div>
  );
}
