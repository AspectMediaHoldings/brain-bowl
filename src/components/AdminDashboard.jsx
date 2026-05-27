import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ROLES = ['student', 'coach', 'admin'];

const S = {
  wrap: { minHeight: '100vh', background: '#0a0b0f', color: '#e8e6e1', fontFamily: "'Palatino Linotype','Book Antiqua',serif" },
  box: { maxWidth: 960, margin: '0 auto', padding: '24px 20px' },
  card: { background: '#12131a', border: '1px solid #1e2030', borderRadius: 8, padding: 24, marginBottom: 16 },
  tab: (active) => ({
    padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1,
    border: 'none', borderBottom: active ? '2px solid #C9A227' : '2px solid transparent',
    background: 'transparent', color: active ? '#C9A227' : '#4a4d60',
  }),
  btn: (c = '#C9A227', ghost = false) => ({
    padding: '6px 14px', fontSize: 11, fontWeight: 700,
    border: ghost ? `1px solid ${c}` : 'none',
    borderRadius: 4, background: ghost ? 'transparent' : c,
    color: ghost ? c : '#0a0b0f', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1,
  }),
  inp: { padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 6, color: '#e8e6e1', outline: 'none' },
  sel: { padding: '5px 8px', fontSize: 12, background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 4, color: '#e8e6e1', fontFamily: 'inherit' },
  err: { background: '#2e1a1a', border: '1px solid #c0392b', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#e74c3c', marginBottom: 14 },
  ok: { background: '#1a2e1a', border: '1px solid #27ae60', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#27ae60', marginBottom: 14 },
  statusBadge: (active) => ({
    fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
    background: active ? '#1a3a1a' : '#2a2d40', color: active ? '#27ae60' : '#6b7084',
    border: `1px solid ${active ? '#27ae60' : '#3a3d50'}`,
  }),
  th: { textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 },
  td: { padding: '10px 12px' },
};

// ── STUDENT DETAIL MODAL (Phase 2) ──────────────────────────
function StudentModal({ student, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sessions')
        .select('pts, bonus_pts, played, powers, negs, filters, completed_at')
        .eq('user_id', student.id)
        .order('completed_at', { ascending: false });
      setSessions(data ?? []);
      setLoading(false);
    }
    load();
  }, [student.id]);

  const totalPts = sessions.reduce((a, s) => a + (s.pts || 0) + (s.bonus_pts || 0), 0);
  const avgPts = sessions.length ? Math.round(totalPts / sessions.length) : 0;

  const catCounts = {};
  for (const s of sessions) {
    for (const c of s.filters?.categories ?? []) catCounts[c] = (catCounts[c] || 0) + 1;
  }
  const catList = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const maxCat = catList[0]?.[1] ?? 1;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, overflowY: 'auto', padding: '40px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', background: '#12131a', border: '1px solid #1e2030', borderRadius: 10, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#C9A227' }}>{student.display_name ?? '(no name)'}</div>
          <button style={S.btn('#6b7084', true)} onClick={onClose}>Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Sessions', val: sessions.length, color: '#C9A227' },
            { label: 'Total Pts', val: totalPts, color: '#20B2AA' },
            { label: 'Avg Pts', val: avgPts, color: '#e8e6e1' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: '#0d0e16', border: '1px solid #1e2030', borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>

        {catList.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Categories Practiced</div>
            {catList.map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 120, fontSize: 12, color: '#a0a3b0', flexShrink: 0 }}>{cat}</div>
                <div style={{ flex: 1, height: 8, background: '#1e2030', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxCat) * 100}%`, background: '#C9A227', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: '#6b7084', width: 30, textAlign: 'right' }}>{count}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#4a4d60', padding: 20 }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div style={{ color: '#4a4d60', fontSize: 13, textAlign: 'center', padding: 20 }}>No sessions yet.</div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Session History</div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2d40' }}>
                    {['Date', 'Tossup', 'Bonus', 'Total', 'Qs', 'Pow', 'Neg'].map(h => (
                      <th key={h} style={{ ...S.th, padding: '6px 8px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e2030', background: i % 2 === 1 ? '#0f1018' : 'transparent' }}>
                      <td style={{ ...S.td, padding: '7px 8px', color: '#6b7084' }}>{new Date(s.completed_at).toLocaleDateString()}</td>
                      <td style={{ ...S.td, padding: '7px 8px', color: '#C9A227', fontWeight: 700 }}>{s.pts}</td>
                      <td style={{ ...S.td, padding: '7px 8px', color: '#20B2AA' }}>{s.bonus_pts}</td>
                      <td style={{ ...S.td, padding: '7px 8px', fontWeight: 700 }}>{(s.pts || 0) + (s.bonus_pts || 0)}</td>
                      <td style={{ ...S.td, padding: '7px 8px', color: '#6b7084' }}>{s.played}</td>
                      <td style={{ ...S.td, padding: '7px 8px', color: '#f5c518' }}>{s.powers}</td>
                      <td style={{ ...S.td, padding: '7px 8px', color: '#c0392b' }}>{s.negs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── USERS TAB (Phase 1a + 2 + 6) ────────────────────────────
function UsersTab({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('student');
  const [inviting, setInviting] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [{ data: profiles }, { data: assignments }] = await Promise.all([
        supabase.from('profiles').select('id, display_name, role, suspended').order('display_name'),
        supabase.from('coach_students').select('student_id, coach_id').eq('status', 'active'),
      ]);
      const assignMap = Object.fromEntries((assignments ?? []).map(a => [a.student_id, a.coach_id]));
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]));
      setUsers((profiles ?? []).map(p => ({
        ...p,
        coachId: assignMap[p.id] ?? null,
        coachName: assignMap[p.id] ? (profileMap[assignMap[p.id]] ?? '(unknown)') : null,
      })));
      setCoaches((profiles ?? []).filter(p => p.role === 'coach' || p.role === 'admin'));
    } finally { setLoading(false); }
  }

  async function updateRole(userId, newRole) {
    if (userId === currentUserId && newRole !== 'admin') {
      if (!window.confirm('This removes your own admin access. Proceed?')) return;
    }
    setMsg(null);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    loadAll();
  }

  async function assignCoach() {
    if (!selectedCoach || !assignTarget) return;
    const { error } = await supabase.from('coach_students').upsert(
      { coach_id: selectedCoach, student_id: assignTarget.id, assigned_by: currentUserId, status: 'active' },
      { onConflict: 'student_id' }
    );
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setAssignTarget(null); setSelectedCoach(''); loadAll();
  }

  async function removeAssignment(studentId) {
    await supabase.from('coach_students').update({ status: 'removed' }).eq('student_id', studentId);
    loadAll();
  }

  async function toggleSuspend(userId, currentlySuspended) {
    const action = currentlySuspended ? 'unsuspend' : 'suspend';
    if (!window.confirm(action.charAt(0).toUpperCase() + action.slice(1) + ' this user?')) return;
    const { error } = await supabase.from('profiles').update({ suspended: !currentlySuspended }).eq('id', userId);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    try {
      await supabase.from('audit_log').insert({ admin_id: currentUserId, action, target_id: userId });
    } catch { /* audit_log table may not exist */ }
    loadAll();
  }

  async function sendInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) { setMsg({ type: 'err', text: 'Enter a valid email.' }); return; }
    setInviting(true); setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/.netlify/functions/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const result = await res.json();
      if (result.error) setMsg({ type: 'err', text: result.error });
      else { setMsg({ type: 'ok', text: result.note ?? `Invite sent to ${email}` }); setInviteEmail(''); }
    } catch { setMsg({ type: 'err', text: 'Failed to send invite.' }); }
    finally { setInviting(false); }
  }

  const filtered = users.filter(u => {
    const nameMatch = !search || (u.display_name ?? '').toLowerCase().includes(search.toLowerCase());
    const roleMatch = roleFilter === 'all' || u.role === roleFilter;
    return nameMatch && roleMatch;
  });

  if (loading) return <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>;

  return (
    <>
      {msg && <div style={msg.type === 'err' ? S.err : S.ok}>{msg.text}</div>}

      <div style={{ background: '#0d0e16', border: '1px solid #2a2d40', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#C9A227', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Invite User</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...S.inp, flex: '1 1 200px' }} type="email" placeholder="email@school.edu"
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendInvite()} />
          <select style={S.sel} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button style={S.btn()} onClick={sendInvite} disabled={inviting}>{inviting ? 'Sending...' : 'Send Invite'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...S.inp, flex: '1 1 180px' }} placeholder="Search by name..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <select style={S.sel} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{ fontSize: 12, color: '#4a4d60' }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {assignTarget && (
        <div style={{ background: '#0d0e16', border: '1px solid #C9A227', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, marginBottom: 10 }}>Assign <strong>{assignTarget.display_name}</strong> to a coach:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select style={S.sel} value={selectedCoach} onChange={e => setSelectedCoach(e.target.value)}>
              <option value="">Select coach...</option>
              {coaches.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
            </select>
            <button style={S.btn()} onClick={assignCoach} disabled={!selectedCoach}>Assign</button>
            <button style={S.btn('#6b7084', true)} onClick={() => { setAssignTarget(null); setSelectedCoach(''); }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2d40' }}>
              {['Name', 'Role', 'Coach', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #1e2030', background: i % 2 === 1 ? '#0f1018' : 'transparent' }}>
                <td style={{ ...S.td, fontWeight: 600, cursor: 'pointer', color: u.suspended ? '#6b7084' : '#C9A227', textDecoration: 'underline' }}
                  onClick={() => setSelectedStudent(u)}>
                  {u.display_name ?? '(no name)'}
                  {u.suspended && <span style={{ fontSize: 9, marginLeft: 6, padding: '1px 5px', borderRadius: 3, background: '#c0392b22', color: '#c0392b', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block' }}>SUSPENDED</span>}
                </td>
                <td style={S.td}>
                  <select style={S.sel} value={u.role ?? 'student'} onChange={e => updateRole(u.id, e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td style={{ ...S.td, color: '#6b7084' }}>
                  {u.coachName ?? <span style={{ color: '#2a2d40' }}>unassigned</span>}
                </td>
                <td style={S.td}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {u.role === 'student' && (
                      <button style={S.btn('#20B2AA', true)} onClick={() => { setAssignTarget(u); setSelectedCoach(u.coachId ?? ''); }}>
                        {u.coachId ? 'Reassign' : 'Assign Coach'}
                      </button>
                    )}
                    {u.coachId && <button style={S.btn('#c0392b', true)} onClick={() => removeAssignment(u.id)}>Unassign</button>}
                    {u.id !== currentUserId && (
                      <button style={S.btn(u.suspended ? '#27ae60' : '#e67e22', true)} onClick={() => toggleSuspend(u.id, !!u.suspended)}>
                        {u.suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </>
  );
}

// ── ASSIGNMENTS TAB ──────────────────────────────────────────
function AssignmentsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await supabase.from('coach_students').select('id, coach_id, student_id, status, assigned_at').order('assigned_at', { ascending: false });
        const ids = [...new Set([...(data ?? []).map(r => r.coach_id), ...(data ?? []).map(r => r.student_id)])];
        const { data: profiles } = ids.length ? await supabase.from('profiles').select('id, display_name').in('id', ids) : { data: [] };
        const pm = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]));
        setRows((data ?? []).map(r => ({ ...r, coachName: pm[r.coach_id] ?? r.coach_id, studentName: pm[r.student_id] ?? r.student_id })));
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #2a2d40' }}>
          {['Student', 'Coach', 'Status', 'Assigned'].map(h => <th key={h} style={S.th}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={4} style={{ padding: 24, color: '#4a4d60', textAlign: 'center' }}>No assignments yet.</td></tr>}
        {rows.map((r, i) => (
          <tr key={r.id} style={{ borderBottom: '1px solid #1e2030', background: i % 2 === 1 ? '#0f1018' : 'transparent' }}>
            <td style={{ ...S.td, fontWeight: 600 }}>{r.studentName}</td>
            <td style={{ ...S.td, color: '#6b7084' }}>{r.coachName}</td>
            <td style={S.td}><span style={S.statusBadge(r.status === 'active')}>{r.status}</span></td>
            <td style={{ ...S.td, color: '#4a4d60' }}>{new Date(r.assigned_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── SCHOOLS TAB (Phase 8) ─────────────────────────────────────
function SchoolsTab() {
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', city: '', state: '' });
  const [editingId, setEditingId] = useState(null);
  const [editVals, setEditVals] = useState({});
  const [noTable, setNoTable] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const { data: schoolData, error } = await supabase.from('schools').select('*').order('name');
    if (error?.code === '42P01') { setNoTable(true); setLoading(false); return; }
    const { data: profileData } = await supabase.from('profiles').select('id, display_name, role, school_id').order('display_name');
    setSchools(schoolData ?? []);
    setUsers(profileData ?? []);
    setLoading(false);
  }

  async function createSchool() {
    if (!newSchool.name.trim()) return;
    const { error } = await supabase.from('schools').insert({
      name: newSchool.name.trim(),
      city: newSchool.city.trim() || null,
      state: newSchool.state.trim() || null,
    });
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setNewSchool({ name: '', city: '', state: '' });
    setCreating(false);
    setMsg({ type: 'ok', text: 'School created.' });
    loadAll();
  }

  async function saveEdit(id) {
    const { error } = await supabase.from('schools').update({
      name: editVals.name, city: editVals.city || null, state: editVals.state || null,
    }).eq('id', id);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setEditingId(null);
    loadAll();
  }

  async function deleteSchool(id) {
    if (!window.confirm('Delete this school? Users will be unassigned.')) return;
    const { error } = await supabase.from('schools').delete().eq('id', id);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    if (expanded === id) setExpanded(null);
    loadAll();
  }

  async function assignUser(userId, schoolId) {
    const { error } = await supabase.from('profiles').update({ school_id: schoolId || null }).eq('id', userId);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, school_id: schoolId || null } : u));
  }

  if (loading) return <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>;

  if (noTable) return (
    <div>
      <div style={S.err}>Schools table not found. Run this SQL in Supabase first:</div>
      <pre style={{ background: '#0a0b0f', border: '1px solid #2a2d40', borderRadius: 6, padding: 16, fontSize: 12, color: '#a0a3b0', overflowX: 'auto', lineHeight: 1.6 }}>{`CREATE TABLE schools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  city text,
  state text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read" ON schools FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','coach')));
CREATE POLICY "admin write" ON schools FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
ALTER TABLE profiles ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE SET NULL;`}</pre>
    </div>
  );

  const unassigned = users.filter(u => !u.school_id);

  return (
    <div>
      {msg && <div style={msg.type === 'err' ? S.err : S.ok}>{msg.text}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#4a4d60' }}>
          {schools.length} school{schools.length !== 1 ? 's' : ''} · {users.filter(u => u.school_id).length} assigned · {unassigned.length} unassigned
        </div>
        <button style={S.btn()} onClick={() => setCreating(c => !c)}>
          {creating ? 'Cancel' : '+ New School'}
        </button>
      </div>

      {creating && (
        <div style={{ background: '#0d0e16', border: '1px solid #2a2d40', borderRadius: 6, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <input style={{ ...S.inp, flex: 2, minWidth: 160 }} placeholder="School name *" value={newSchool.name} onChange={e => setNewSchool(p => ({ ...p, name: e.target.value }))} />
            <input style={{ ...S.inp, flex: 1, minWidth: 120 }} placeholder="City" value={newSchool.city} onChange={e => setNewSchool(p => ({ ...p, city: e.target.value }))} />
            <input style={{ ...S.inp, flex: 1, minWidth: 70 }} placeholder="State" value={newSchool.state} onChange={e => setNewSchool(p => ({ ...p, state: e.target.value }))} />
          </div>
          <button style={S.btn()} onClick={createSchool} disabled={!newSchool.name.trim()}>Create School</button>
        </div>
      )}

      {schools.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#4a4d60', padding: 32, fontSize: 13 }}>No schools yet. Create one above.</div>
      ) : (
        <div style={{ border: '1px solid #1e2030', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
          {schools.map((school, i) => {
            const members = users.filter(u => u.school_id === school.id);
            const studentCount = members.filter(u => u.role === 'student').length;
            const coachCount = members.filter(u => u.role !== 'student').length;
            const isExpanded = expanded === school.id;
            const isEditing = editingId === school.id;
            return (
              <div key={school.id} style={{ borderBottom: i < schools.length - 1 ? '1px solid #1e2030' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: isExpanded ? '#0f1018' : 'transparent' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                      <input style={{ ...S.inp, flex: 2, minWidth: 140 }} value={editVals.name ?? ''} onChange={e => setEditVals(p => ({ ...p, name: e.target.value }))} />
                      <input style={{ ...S.inp, flex: 1, minWidth: 100 }} placeholder="City" value={editVals.city ?? ''} onChange={e => setEditVals(p => ({ ...p, city: e.target.value }))} />
                      <input style={{ ...S.inp, flex: 1, minWidth: 60 }} placeholder="State" value={editVals.state ?? ''} onChange={e => setEditVals(p => ({ ...p, state: e.target.value }))} />
                      <button style={S.btn()} onClick={() => saveEdit(school.id)}>Save</button>
                      <button style={S.btn('#6b7084', true)} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setExpanded(isExpanded ? null : school.id)}
                        style={{ background: 'none', border: 'none', color: '#C9A227', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', flex: 1, textAlign: 'left' }}>
                        {isExpanded ? '▼' : '▶'} {school.name}
                        {(school.city || school.state) && (
                          <span style={{ color: '#4a4d60', fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                            {[school.city, school.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </button>
                      <span style={{ fontSize: 12, color: '#6b7084', whiteSpace: 'nowrap' }}>
                        {studentCount} student{studentCount !== 1 ? 's' : ''} · {coachCount} coach{coachCount !== 1 ? 'es' : ''}
                      </span>
                      <button style={{ ...S.btn('#4a4d60', true), padding: '4px 10px' }}
                        onClick={() => { setEditingId(school.id); setEditVals({ name: school.name, city: school.city ?? '', state: school.state ?? '' }); }}>
                        Edit
                      </button>
                      <button style={{ ...S.btn('#c0392b', true), padding: '4px 10px' }} onClick={() => deleteSchool(school.id)}>Delete</button>
                    </>
                  )}
                </div>
                {isExpanded && (
                  <div style={{ background: '#0a0b0f', borderTop: '1px solid #1e2030', padding: '14px 16px' }}>
                    {members.length === 0 ? (
                      <div style={{ color: '#4a4d60', fontSize: 12, marginBottom: 8 }}>No members assigned yet.</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 10 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #2a2d40' }}>
                            {['Name', 'Role', 'Move to'].map(h => <th key={h} style={{ ...S.th, padding: '5px 8px' }}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {members.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #1e2030' }}>
                              <td style={{ ...S.td, padding: '7px 8px', fontWeight: 600 }}>{u.display_name ?? '(no name)'}</td>
                              <td style={{ ...S.td, padding: '7px 8px', color: '#6b7084' }}>{u.role}</td>
                              <td style={{ ...S.td, padding: '7px 8px' }}>
                                <select style={S.sel} value={u.school_id ?? ''} onChange={e => assignUser(u.id, e.target.value)}>
                                  <option value="">-- unassign --</option>
                                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {unassigned.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Unassigned Users ({unassigned.length})
          </div>
          <div style={{ border: '1px solid #1e2030', borderRadius: 6, overflow: 'hidden' }}>
            {unassigned.map((u, i) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < unassigned.length - 1 ? '1px solid #1e2030' : 'none', background: i % 2 === 1 ? '#0f1018' : 'transparent' }}>
                <div style={{ flex: 1, fontSize: 13 }}>{u.display_name ?? '(no name)'}</div>
                <div style={{ fontSize: 11, color: '#6b7084', width: 60 }}>{u.role}</div>
                <select style={S.sel} value="" onChange={e => e.target.value && assignUser(u.id, e.target.value)}>
                  <option value="">Assign to school...</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── COACHES TAB (Phase 3) ────────────────────────────────────
function CoachesTab() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: profiles } = await supabase.from('profiles').select('id, display_name, role').in('role', ['coach', 'admin']);
        const coachIds = (profiles ?? []).map(p => p.id);
        if (!coachIds.length) { setCoaches([]); setLoading(false); return; }

        const [{ data: assignments }, { data: allSessions }] = await Promise.all([
          supabase.from('coach_students').select('coach_id, student_id').eq('status', 'active').in('coach_id', coachIds),
          supabase.from('sessions').select('user_id, pts, bonus_pts, completed_at'),
        ]);

        const sessionsByUser = {};
        for (const s of allSessions ?? []) {
          if (!sessionsByUser[s.user_id]) sessionsByUser[s.user_id] = [];
          sessionsByUser[s.user_id].push(s);
        }

        const studentsByCoach = {};
        for (const a of assignments ?? []) {
          if (!studentsByCoach[a.coach_id]) studentsByCoach[a.coach_id] = [];
          studentsByCoach[a.coach_id].push(a.student_id);
        }

        const allStudentIds = (assignments ?? []).map(a => a.student_id);
        const { data: studentProfiles } = allStudentIds.length
          ? await supabase.from('profiles').select('id, display_name').in('id', allStudentIds)
          : { data: [] };
        const profileMap = Object.fromEntries((studentProfiles ?? []).map(p => [p.id, p.display_name]));

        setCoaches((profiles ?? []).map(coach => {
          const studentIds = studentsByCoach[coach.id] ?? [];
          const teamSessions = studentIds.flatMap(sid => sessionsByUser[sid] ?? []);
          const teamPts = teamSessions.reduce((a, s) => a + (s.pts || 0) + (s.bonus_pts || 0), 0);
          const week7 = teamSessions.filter(s => new Date(s.completed_at) > new Date(Date.now() - 7 * 86400000));
          const sorted = [...teamSessions].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
          return {
            ...coach,
            studentCount: studentIds.length,
            teamPts,
            weekSessions: week7.length,
            lastActive: sorted[0]?.completed_at ?? null,
            studentNames: studentIds.map(id => ({ id, name: profileMap[id] ?? '(unknown)' })),
          };
        }));
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>;
  if (!coaches.length) return <div style={{ color: '#4a4d60', fontSize: 13, textAlign: 'center', padding: 24 }}>No coaches yet.</div>;

  return (
    <div>
      {coaches.map(c => (
        <div key={c.id} style={{ borderBottom: '1px solid #1e2030', padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexWrap: 'wrap' }}
            onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
            <span style={{ color: '#4a4d60', fontSize: 11, width: 14 }}>{expanded === c.id ? '▼' : '▶'}</span>
            <span style={{ flex: '1 1 120px', fontWeight: 700, fontSize: 14 }}>{c.display_name ?? '(no name)'}</span>
            <span style={{ fontSize: 12, color: '#6b7084' }}>{c.studentCount} student{c.studentCount !== 1 ? 's' : ''}</span>
            <span style={{ fontSize: 12, color: '#C9A227', fontWeight: 700, minWidth: 70, textAlign: 'right' }}>{c.teamPts} pts</span>
            <span style={{ fontSize: 11, color: '#4a4d60', minWidth: 80, textAlign: 'right' }}>{c.weekSessions} sess/7d</span>
            <span style={{ fontSize: 11, color: '#4a4d60', minWidth: 90, textAlign: 'right' }}>
              {c.lastActive ? new Date(c.lastActive).toLocaleDateString() : 'No activity'}
            </span>
          </div>
          {expanded === c.id && (
            <div style={{ marginTop: 10, marginLeft: 24, background: '#0d0e16', borderRadius: 6, padding: 12 }}>
              {c.studentNames.length === 0
                ? <span style={{ fontSize: 12, color: '#4a4d60' }}>No students assigned.</span>
                : c.studentNames.map(s => (
                  <div key={s.id} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid #1e2030', color: '#c0c3d0' }}>{s.name}</div>
                ))
              }
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── LEADERBOARD TAB (Phase 4) ────────────────────────────────
function LeaderboardTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let query = supabase.from('sessions').select('user_id, pts, bonus_pts, played');
        if (range === '7d') query = query.gte('completed_at', new Date(Date.now() - 7 * 86400000).toISOString());
        if (range === '30d') query = query.gte('completed_at', new Date(Date.now() - 30 * 86400000).toISOString());
        const { data: sessions } = await query;

        const byUser = {};
        for (const s of sessions ?? []) {
          if (!byUser[s.user_id]) byUser[s.user_id] = { pts: 0, sessions: 0, played: 0 };
          byUser[s.user_id].pts += (s.pts || 0) + (s.bonus_pts || 0);
          byUser[s.user_id].sessions++;
          byUser[s.user_id].played += s.played || 0;
        }

        const topIds = Object.keys(byUser).sort((a, b) => byUser[b].pts - byUser[a].pts).slice(0, 25);
        const { data: profiles } = topIds.length ? await supabase.from('profiles').select('id, display_name').in('id', topIds) : { data: [] };
        const pm = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]));
        setRows(topIds.map((id, idx) => ({ rank: idx + 1, name: pm[id] ?? '(unknown)', ...byUser[id] })));
      } finally { setLoading(false); }
    }
    load();
  }, [range]);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['7d', '7 Days'], ['30d', '30 Days'], ['all', 'All Time']].map(([v, label]) => (
          <button key={v} style={S.btn(range === v ? '#C9A227' : '#4a4d60', range !== v)} onClick={() => setRange(v)}>{label}</button>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>
      ) : rows.length === 0 ? (
        <div style={{ color: '#4a4d60', fontSize: 13, textAlign: 'center', padding: 24 }}>No data for this period.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2d40' }}>
              {['Rank', 'Student', 'Points', 'Sessions', 'Questions'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} style={{ borderBottom: '1px solid #1e2030', background: i % 2 === 1 ? '#0f1018' : 'transparent' }}>
                <td style={{ ...S.td, color: i < 3 ? '#C9A227' : '#4a4d60', fontWeight: 700 }}>#{r.rank}</td>
                <td style={{ ...S.td, fontWeight: 600 }}>{r.name}</td>
                <td style={{ ...S.td, color: '#C9A227', fontWeight: 700 }}>{r.pts}</td>
                <td style={{ ...S.td, color: '#6b7084' }}>{r.sessions}</td>
                <td style={{ ...S.td, color: '#6b7084' }}>{r.played}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

// ── ACTIVITY TAB (Phase 1b + 5) ──────────────────────────────
function ActivityTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const since = range === '7d' ? new Date(Date.now() - 7 * 86400000) :
                      range === '30d' ? new Date(Date.now() - 30 * 86400000) :
                      new Date(0);
        const { data: sessions } = await supabase
          .from('sessions')
          .select('user_id, pts, bonus_pts, played, filters, completed_at')
          .gte('completed_at', since.toISOString());

        const byStudent = {};
        const catCounts = {};
        for (const s of sessions ?? []) {
          if (!byStudent[s.user_id]) byStudent[s.user_id] = { sessions: 0, pts: 0 };
          byStudent[s.user_id].sessions++;
          byStudent[s.user_id].pts += (s.pts || 0) + (s.bonus_pts || 0);
          for (const c of s.filters?.categories ?? []) catCounts[c] = (catCounts[c] || 0) + 1;
        }

        const topIds = Object.keys(byStudent).sort((a, b) => byStudent[b].sessions - byStudent[a].sessions).slice(0, 10);
        const { data: profiles } = topIds.length ? await supabase.from('profiles').select('id, display_name').in('id', topIds) : { data: [] };
        const pm = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]));

        setStats({
          totalSessions: sessions?.length ?? 0,
          totalQuestions: sessions?.reduce((a, s) => a + (s.played || 0), 0) ?? 0,
          uniqueStudents: Object.keys(byStudent).length,
          top: topIds.map(id => ({ id, name: pm[id] ?? '(unknown)', ...byStudent[id] })),
          catList: Object.entries(catCounts).sort((a, b) => b[1] - a[1]),
        });
      } finally { setLoading(false); }
    }
    load();
  }, [range]);

  const maxCat = stats?.catList[0]?.[1] ?? 1;

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['7d', '7 Days'], ['30d', '30 Days'], ['all', 'All Time']].map(([v, label]) => (
          <button key={v} style={S.btn(range === v ? '#C9A227' : '#4a4d60', range !== v)} onClick={() => setRange(v)}>{label}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div> : stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Sessions', val: stats.totalSessions, color: '#C9A227' },
              { label: 'Questions', val: stats.totalQuestions, color: '#20B2AA' },
              { label: 'Active Students', val: stats.uniqueStudents, color: '#e8e6e1' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: '#0d0e16', border: '1px solid #1e2030', borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>

          {stats.catList.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Categories Practiced</div>
              {stats.catList.map(([cat, count]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 130, fontSize: 12, color: '#a0a3b0', flexShrink: 0 }}>{cat}</div>
                  <div style={{ flex: 1, height: 10, background: '#1e2030', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxCat) * 100}%`, background: '#C9A227', borderRadius: 5 }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7084', width: 30, textAlign: 'right' }}>{count}</div>
                </div>
              ))}
            </div>
          )}

          {stats.top.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Most Active</div>
              {stats.top.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #1e2030', fontSize: 13 }}>
                  <span style={{ color: '#2a2d40', width: 20, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{s.name}</span>
                  <span style={{ color: '#6b7084' }}>{s.sessions} session{s.sessions !== 1 ? 's' : ''}</span>
                  <span style={{ color: '#C9A227', fontWeight: 700, minWidth: 60, textAlign: 'right' }}>{s.pts} pts</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}

// ── ANALYTICS TAB (Phase 7) ──────────────────────────────────
function AnalyticsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const now = Date.now();
        const [{ data: events7d, error: e1 }, { data: eventsAll }, { data: roles }] = await Promise.all([
          supabase.from('page_events').select('user_id, event_type, country, created_at').gte('created_at', new Date(now - 7 * 86400000).toISOString()),
          supabase.from('page_events').select('user_id, event_type, country, created_at'),
          supabase.from('profiles').select('id, role'),
        ]);

        if (e1?.code === '42P01') { setStats({ error: true }); return; }

        const dau = new Set((eventsAll ?? []).filter(e => new Date(e.created_at) > new Date(now - 86400000)).map(e => e.user_id)).size;
        const wau = new Set((events7d ?? []).map(e => e.user_id)).size;
        const sessions7d = (events7d ?? []).filter(e => e.event_type === 'session_start').length;

        const countryCounts = {};
        for (const e of eventsAll ?? []) {
          if (e.country) countryCounts[e.country] = (countryCounts[e.country] || 0) + 1;
        }

        const roleCounts = { student: 0, coach: 0, admin: 0 };
        for (const p of roles ?? []) if (p.role in roleCounts) roleCounts[p.role]++;

        const days = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now - i * 86400000);
          const label = `${d.getMonth() + 1}/${d.getDate()}`;
          const count = (eventsAll ?? []).filter(e =>
            e.event_type === 'session_start' && new Date(e.created_at).toDateString() === d.toDateString()
          ).length;
          days.push({ label, count });
        }

        setStats({
          dau, wau, sessions7d,
          totalEvents: (eventsAll ?? []).length,
          countryList: Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10),
          roleCounts,
          days,
          maxDay: Math.max(...days.map(d => d.count), 1),
        });
      } catch { setStats({ error: true }); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>;

  if (stats?.error) return (
    <div style={{ background: '#2e1a1a', border: '1px solid #c0392b', borderRadius: 6, padding: 16, fontSize: 13, color: '#e74c3c' }}>
      Run this SQL in Supabase to enable analytics:
      <pre style={{ fontSize: 11, marginTop: 12, color: '#a0a3b0', whiteSpace: 'pre-wrap', background: '#0d0e16', padding: 12, borderRadius: 6 }}>
{`CREATE TABLE page_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  country text, subdivision text, city text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE page_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read" ON page_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));`}
      </pre>
    </div>
  );

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'DAU (today)', val: stats.dau, color: '#C9A227' },
          { label: 'WAU (7 days)', val: stats.wau, color: '#20B2AA' },
          { label: 'Sessions (7d)', val: stats.sessions7d, color: '#e8e6e1' },
          { label: 'Total Events', val: stats.totalEvents, color: '#6b7084' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#0d0e16', border: '1px solid #1e2030', borderRadius: 8, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Users by Role</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(stats.roleCounts).map(([role, count]) => (
            <div key={role} style={{ background: '#0d0e16', border: '1px solid #1e2030', borderRadius: 6, padding: '10px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A227' }}>{count}</div>
              <div style={{ fontSize: 11, color: '#6b7084', textTransform: 'uppercase', letterSpacing: 1 }}>{role}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Sessions — Last 14 Days</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, paddingBottom: 20 }}>
          {stats.days.map(d => (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{
                width: '100%', background: d.count > 0 ? '#C9A227' : '#1e2030',
                borderRadius: '2px 2px 0 0',
                height: `${(d.count / stats.maxDay) * 56}px`,
                minHeight: d.count > 0 ? 3 : 0,
              }} />
              <div style={{ fontSize: 8, color: '#4a4d60', transform: 'rotate(-45deg)', transformOrigin: 'center top', whiteSpace: 'nowrap', marginTop: 2 }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {stats.countryList.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Events by Country</div>
          {stats.countryList.map(([country, count]) => (
            <div key={country} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 100, fontSize: 12, color: '#a0a3b0', flexShrink: 0 }}>{country}</div>
              <div style={{ flex: 1, height: 8, background: '#1e2030', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(count / stats.countryList[0][1]) * 100}%`, background: '#20B2AA', borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: '#6b7084', width: 30, textAlign: 'right' }}>{count}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}


// ── ANNOUNCEMENTS TAB ────────────────────────────────────────
function AnnouncementsTab({ currentUserId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [noTable, setNoTable] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (error?.code === '42P01') { setNoTable(true); setLoading(false); return; }
    setRows(data ?? []);
    setLoading(false);
  }

  async function createAnnouncement() {
    if (!form.title.trim()) return;
    const { error } = await supabase.from('announcements').insert({ title: form.title.trim(), body: form.body.trim() || null, created_by: currentUserId });
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setForm({ title: '', body: '' });
    setCreating(false);
    load();
  }

  async function toggleActive(id, current) {
    const { error } = await supabase.from('announcements').update({ active: !current }).eq('id', id);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    load();
  }

  async function deleteAnn(id) {
    if (!window.confirm('Delete this announcement?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    load();
  }

  if (loading) return <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>;

  if (noTable) return (
    <div>
      <div style={S.err}>Run this SQL in Supabase to enable announcements:</div>
      <pre style={{ background: '#0a0b0f', border: '1px solid #2a2d40', borderRadius: 6, padding: 16, fontSize: 12, color: '#a0a3b0', overflowX: 'auto' }}>{`CREATE TABLE announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text,
  active boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage" ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "anyone read active" ON announcements FOR SELECT USING (active = true);`}</pre>
    </div>
  );

  return (
    <div>
      {msg && <div style={msg.type === 'err' ? S.err : S.ok}>{msg.text}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#4a4d60' }}>{rows.filter(r => r.active).length} active · {rows.length} total</div>
        <button style={S.btn()} onClick={() => setCreating(c => !c)}>{creating ? 'Cancel' : '+ New Announcement'}</button>
      </div>
      {creating && (
        <div style={{ background: '#0d0e16', border: '1px solid #2a2d40', borderRadius: 6, padding: 16, marginBottom: 16 }}>
          <input style={{ ...S.inp, display: 'block', width: '100%', marginBottom: 8 }} placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <input style={{ ...S.inp, display: 'block', width: '100%', marginBottom: 10 }} placeholder="Body text (optional)" value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
          <button style={S.btn()} onClick={createAnnouncement} disabled={!form.title.trim()}>Create</button>
        </div>
      )}
      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#4a4d60', padding: 32 }}>No announcements yet.</div>
      ) : (
        <div style={{ border: '1px solid #1e2030', borderRadius: 6, overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < rows.length - 1 ? '1px solid #1e2030' : 'none', background: r.active ? '#0d160d' : 'transparent' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: r.active ? '#27ae60' : '#e8e6e1' }}>{r.title}</div>
                {r.body && <div style={{ fontSize: 12, color: '#6b7084', marginTop: 2 }}>{r.body}</div>}
                <div style={{ fontSize: 11, color: '#4a4d60', marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <span style={S.statusBadge(r.active)}>{r.active ? 'ACTIVE' : 'INACTIVE'}</span>
              <button style={S.btn(r.active ? '#e67e22' : '#27ae60', true)} onClick={() => toggleActive(r.id, r.active)}>
                {r.active ? 'Deactivate' : 'Activate'}
              </button>
              <button style={{ ...S.btn('#c0392b', true), padding: '6px 10px' }} onClick={() => deleteAnn(r.id)}>Del</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FLAGS TAB ────────────────────────────────────────────────
function FlagsTab() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noTable, setNoTable] = useState(false);
  const [filter, setFilter] = useState('open');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('question_flags').select('*').order('created_at', { ascending: false });
    if (error?.code === '42P01') { setNoTable(true); setLoading(false); return; }
    setFlags(data ?? []);
    setLoading(false);
  }

  async function resolve(id) {
    await supabase.from('question_flags').update({ resolved: true }).eq('id', id);
    load();
  }

  if (loading) return <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>;

  if (noTable) return (
    <div>
      <div style={S.err}>Run this SQL in Supabase to enable question flagging:</div>
      <pre style={{ background: '#0a0b0f', border: '1px solid #2a2d40', borderRadius: 6, padding: 16, fontSize: 12, color: '#a0a3b0', overflowX: 'auto' }}>{`CREATE TABLE question_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  question_id text,
  question_type text DEFAULT 'tossup',
  question_text text,
  answer text,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE question_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users insert" ON question_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin manage" ON question_flags FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));`}</pre>
    </div>
  );

  const visible = flags.filter(f => filter === 'open' ? !f.resolved : filter === 'resolved' ? f.resolved : true);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].map(([v, label]) => (
          <button key={v} style={S.btn(filter === v ? '#C9A227' : '#4a4d60', filter !== v)} onClick={() => setFilter(v)}>{label}</button>
        ))}
        <span style={{ fontSize: 12, color: '#4a4d60' }}>{visible.length} flag{visible.length !== 1 ? 's' : ''}</span>
      </div>
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#4a4d60', padding: 32 }}>No flags in this view.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(f => (
            <div key={f.id} style={{ background: '#0d0e16', border: '1px solid ' + (f.resolved ? '#1e2030' : '#c0392b44'), borderRadius: 6, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#4a4d60', marginBottom: 4 }}>{new Date(f.created_at).toLocaleString()} · {f.question_type}</div>
                  {f.answer && <div style={{ fontSize: 12, color: '#C9A227', marginBottom: 4 }}>Answer: {f.answer}</div>}
                  {f.question_text && <div style={{ fontSize: 12, color: '#8a8d9e', lineHeight: 1.5, maxHeight: 60, overflow: 'hidden' }}>{f.question_text}</div>}
                </div>
                {!f.resolved && <button style={S.btn('#27ae60', true)} onClick={() => resolve(f.id)}>Resolve</button>}
                {f.resolved && <span style={S.statusBadge(false)}>RESOLVED</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AUDIT TAB ────────────────────────────────────────────────
function AuditTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noTable, setNoTable] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100);
      if (error?.code === '42P01') { setNoTable(true); setLoading(false); return; }
      const adminIds = [...new Set((data ?? []).map(r => r.admin_id).filter(Boolean))];
      let nameMap = {};
      if (adminIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', adminIds);
        nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]));
      }
      setRows((data ?? []).map(r => ({ ...r, adminName: nameMap[r.admin_id] ?? r.admin_id ?? '(system)' })));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>;

  if (noTable) return (
    <div>
      <div style={S.err}>Run this SQL in Supabase to enable audit logging:</div>
      <pre style={{ background: '#0a0b0f', border: '1px solid #2a2d40', borderRadius: 6, padding: 16, fontSize: 12, color: '#a0a3b0', overflowX: 'auto' }}>{`CREATE TABLE audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read" ON audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin insert" ON audit_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;`}</pre>
    </div>
  );

  return rows.length === 0 ? (
    <div style={{ textAlign: 'center', color: '#4a4d60', padding: 32 }}>No audit log entries yet.</div>
  ) : (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #2a2d40' }}>
          {['Time', 'Admin', 'Action', 'Target'].map(h => <th key={h} style={S.th}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id} style={{ borderBottom: '1px solid #1e2030', background: i % 2 === 1 ? '#0f1018' : 'transparent' }}>
            <td style={{ ...S.td, color: '#4a4d60', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleString()}</td>
            <td style={{ ...S.td, fontWeight: 600 }}>{r.adminName}</td>
            <td style={{ ...S.td, color: '#C9A227' }}>{r.action}</td>
            <td style={{ ...S.td, color: '#6b7084', fontFamily: 'monospace', fontSize: 11 }}>{r.target_id ? r.target_id.slice(0, 8) + '...' : 'none'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── COACH APPLICATIONS ───────────────────────────────────────
function CoachApplicationsTab() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);

  useEffect(() => { loadApps(); }, []);

  async function loadApps() {
    setLoading(true);
    try {
      const { data } = await supabase.from('coach_applications').select('*').order('created_at', { ascending: false });
      setApps(data ?? []);
    } catch { /* table not yet provisioned */ }
    setLoading(false);
  }

  async function approve(app) {
    setWorking(app.id);
    try {
      await supabase.from('coach_applications').update({ status: 'approved' }).eq('id', app.id);
      await supabase.from('profiles').update({ role: 'coach', coach_status: 'approved' }).eq('id', app.user_id);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
    } catch (e) { alert(e.message); }
    setWorking(null);
  }

  async function deny(app) {
    setWorking(app.id);
    try {
      await supabase.from('coach_applications').update({ status: 'denied' }).eq('id', app.id);
      await supabase.from('profiles').update({ coach_status: 'denied' }).eq('id', app.user_id);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'denied' } : a));
    } catch (e) { alert(e.message); }
    setWorking(null);
  }

  if (loading) return <div style={{ color: '#4a4d60', fontSize: 13 }}>Loading...</div>;
  if (!apps.length) return <div style={{ color: '#4a4d60', fontSize: 13 }}>No applications yet.</div>;

  const pending = apps.filter(a => a.status === 'pending');
  const resolved = apps.filter(a => a.status !== 'pending');

  return (
    <div>
      {pending.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: '#f39c12', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>Pending ({pending.length})</div>
          {pending.map(app => (
            <div key={app.id} style={{ background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 6, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{app.full_name}</div>
                  <div style={{ fontSize: 12, color: '#6b7084', marginBottom: 2 }}>{app.email}{app.phone ? ` · ${app.phone}` : ''}</div>
                  <div style={{ fontSize: 12, color: '#8a8d9e' }}>{app.position} — {app.school_name}, {app.county} County</div>
                  <div style={{ fontSize: 11, color: '#4a4d60', marginTop: 4 }}>{new Date(app.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button disabled={working === app.id} onClick={() => approve(app)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, background: '#27ae60', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Approve</button>
                  <button disabled={working === app.id} onClick={() => deny(app)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, background: 'transparent', border: '1px solid #c0392b', borderRadius: 4, color: '#c0392b', cursor: 'pointer', fontFamily: 'inherit' }}>Deny</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
      {resolved.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: '#4a4d60', letterSpacing: 2, textTransform: 'uppercase', margin: '16px 0 10px', fontWeight: 700 }}>Resolved ({resolved.length})</div>
          {resolved.map(app => (
            <div key={app.id} style={{ background: '#12131a', border: '1px solid #1e2030', borderRadius: 6, padding: '10px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{app.full_name}</span>
                <span style={{ fontSize: 12, color: '#6b7084', marginLeft: 10 }}>{app.school_name}, {app.county} County</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 3, background: app.status === 'approved' ? '#1a2e1a' : '#2e1a1a', color: app.status === 'approved' ? '#27ae60' : '#c0392b', textTransform: 'uppercase', letterSpacing: 1 }}>{app.status}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────
const TABS = ['users', 'assignments', 'coaches', 'applications', 'schools', 'leaderboard', 'activity', 'analytics', 'announcements', 'flags', 'audit'];

export default function AdminDashboard({ user, onBack }) {
  const [tab, setTab] = useState('users');

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A227', letterSpacing: 2, textTransform: 'uppercase' }}>Admin Panel</div>
          <button style={S.btn('#6b7084', true)} onClick={onBack}>Back</button>
        </div>

        <div style={{ borderBottom: '1px solid #1e2030', marginBottom: 20, overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {TABS.map(t => (
            <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div style={S.card}>
          {tab === 'users' && <UsersTab currentUserId={user.id} />}
          {tab === 'assignments' && <AssignmentsTab />}
          {tab === 'coaches' && <CoachesTab />}
          {tab === 'applications' && <CoachApplicationsTab />}
          {tab === 'schools' && <SchoolsTab />}
          {tab === 'leaderboard' && <LeaderboardTab />}
          {tab === 'activity' && <ActivityTab />}
          {tab === 'analytics' && <AnalyticsTab />}
          {tab === 'announcements' && <AnnouncementsTab currentUserId={user.id} />}
          {tab === 'flags' && <FlagsTab />}
          {tab === 'audit' && <AuditTab />}
        </div>
      </div>
    </div>
  );
}
