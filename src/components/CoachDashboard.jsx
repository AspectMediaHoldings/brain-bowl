import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ALL_CATEGORIES, DIFFICULTY_LABELS, MS_DIFFICULTIES, HS_DIFFICULTIES } from '../utils/qbApi';

const DIFF_PRESETS = [
  { label: 'MS', val: MS_DIFFICULTIES, color: '#20B2AA' },
  { label: 'HS', val: HS_DIFFICULTIES, color: '#C9A227' },
  { label: 'All', val: [1, 2, 3, 4, 5, 6], color: '#6b7084' },
];

const S = {
  wrap: { minHeight: '100vh', background: '#0a0b0f', color: '#e8e6e1', fontFamily: "'Palatino Linotype','Book Antiqua',serif" },
  box: { maxWidth: 860, margin: '0 auto', padding: '24px 20px' },
  card: { background: '#12131a', border: '1px solid #1e2030', borderRadius: 8, padding: 24, marginBottom: 16 },
  h2: { color: '#C9A227', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 16px', fontWeight: 700 },
  btn: (c = '#C9A227', ghost = false) => ({
    padding: '8px 16px', fontSize: 12, fontWeight: 700,
    border: ghost ? `1px solid ${c}` : 'none',
    borderRadius: 6, background: ghost ? 'transparent' : c,
    color: ghost ? c : '#0a0b0f', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1,
  }),
  pill: (active, color = '#C9A227') => ({
    display: 'inline-block', padding: '4px 10px', margin: '3px', fontSize: 12,
    borderRadius: 20, cursor: 'pointer', border: `1px solid ${active ? color : '#4a4d70'}`,
    background: active ? color + '22' : 'transparent', color: active ? color : '#c0c3d0',
    fontFamily: 'inherit', fontWeight: active ? 700 : 400,
  }),
  inp: { padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 6, color: '#e8e6e1', outline: 'none', width: '100%', boxSizing: 'border-box' },
  sel: { padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', background: '#1a1b25', border: '1px solid #2a2d40', borderRadius: 6, color: '#e8e6e1', outline: 'none' },
  err: { background: '#2e1a1a', border: '1px solid #c0392b', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#e74c3c', marginBottom: 14 },
  ok: { background: '#1a2e1a', border: '1px solid #27ae60', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#27ae60', marginBottom: 14 },
  warn: { background: '#2e2a1a', border: '1px solid #C9A227', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#C9A227', marginBottom: 14 },
  tabBar: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1e2030' },
  tabBtn: (active) => ({
    padding: '10px 20px', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    color: active ? '#C9A227' : '#6b7084',
    borderBottom: active ? '2px solid #C9A227' : '2px solid transparent',
    marginBottom: -1,
  }),
};

async function callSendInvite(email, coachId, accessToken) {
  const res = await fetch('/.netlify/functions/send-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ email, coachId }),
  });
  return res.json();
}

function RosterTab({ user }) {
  const [students, setStudents] = useState([]);
  const [rosterEmails, setRosterEmails] = useState([]);
  const [targets, setTargets] = useState({});
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [inviting, setInviting] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      const [{ data: activeRows }, { data: roster }, { data: targetRows }] = await Promise.all([
        supabase.from('coach_students').select('id, student_id').eq('coach_id', user.id).eq('status', 'active'),
        supabase.from('coach_roster_emails').select('id, email, created_at').eq('coach_id', user.id).order('created_at', { ascending: false }),
        supabase.from('session_targets').select('student_id, weekly_goal').eq('coach_id', user.id),
      ]);

      const activeIds = (activeRows ?? []).map(r => r.student_id);
      setTargets(Object.fromEntries((targetRows ?? []).map(t => [t.student_id, t.weekly_goal])));

      if (!activeIds.length) {
        setStudents([]);
        setRosterEmails(roster ?? []);
        setLoading(false);
        return;
      }

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [profilesRes, sessionsRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name').in('id', activeIds),
        supabase.from('sessions').select('user_id, pts, bonus_pts, played, completed_at').in('user_id', activeIds),
      ]);

      const profileMap = Object.fromEntries((profilesRes.data ?? []).map(p => [p.id, p]));
      const sessionsByStudent = {};
      for (const s of sessionsRes.data ?? []) {
        if (!sessionsByStudent[s.user_id]) sessionsByStudent[s.user_id] = [];
        sessionsByStudent[s.user_id].push(s);
      }

      setStudents((activeRows ?? []).map(r => {
        const ss = sessionsByStudent[r.student_id] ?? [];
        const totalPts = ss.reduce((a, s) => a + (s.pts || 0) + (s.bonus_pts || 0), 0);
        const sorted = [...ss].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
        const lastActive = sorted[0]?.completed_at ?? null;
        const thisWeek = ss.filter(s => new Date(s.completed_at) >= weekAgo).length;
        return {
          assignmentId: r.id,
          studentId: r.student_id,
          displayName: profileMap[r.student_id]?.display_name ?? '(unnamed)',
          sessionCount: ss.length,
          totalPts,
          lastActive,
          thisWeek,
          inactive: lastActive ? new Date(lastActive) < weekAgo : false,
        };
      }));

      setRosterEmails(roster ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function addEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) { setMsg({ type: 'err', text: 'Enter a valid email address.' }); return; }
    setMsg(null);
    const { error } = await supabase.from('coach_roster_emails').insert({ coach_id: user.id, email });
    if (error) {
      setMsg({ type: 'err', text: error.code === '23505' ? 'That email is already on your roster.' : error.message });
      return;
    }
    setNewEmail('');
    load();
  }

  async function removeEmail(id) {
    await supabase.from('coach_roster_emails').delete().eq('id', id);
    load();
  }

  async function removeStudent(assignmentId) {
    await supabase.from('coach_students').update({ status: 'removed' }).eq('id', assignmentId);
    load();
  }

  async function handleSendInvite(email) {
    setInviting(email);
    setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const result = await callSendInvite(email, user.id, session.access_token);
      if (result.error) setMsg({ type: 'err', text: result.error });
      else setMsg({ type: 'ok', text: result.note ?? `Invite sent to ${email}` });
    } catch {
      setMsg({ type: 'err', text: 'Failed to send invite. Try again.' });
    } finally {
      setInviting(null);
    }
  }

  async function setGoal(studentId, goal) {
    setTargets(t => ({ ...t, [studentId]: goal }));
    await supabase.from('session_targets').upsert(
      { coach_id: user.id, student_id: studentId, weekly_goal: goal, updated_at: new Date().toISOString() },
      { onConflict: 'student_id' }
    );
  }

  const inactive = students.filter(s => s.inactive);

  return (
    <>
      {inactive.length > 0 && (
        <div style={S.warn}>
          {inactive.length === 1
            ? `${inactive[0].displayName} hasn't practiced in over 7 days.`
            : `${inactive.length} students haven't practiced in over 7 days: ${inactive.map(s => s.displayName).join(', ')}.`}
        </div>
      )}

      {msg && <div style={msg.type === 'err' ? S.err : S.ok}>{msg.text}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#4a4d60', padding: 40 }}>Loading...</div>
      ) : (
        <>
          <div style={S.card}>
            <div style={S.h2}>Active Students ({students.length})</div>
            {students.length === 0 ? (
              <p style={{ color: '#6b7084', margin: 0, fontSize: 13 }}>
                No active students yet. Add emails below — students are auto-assigned when they sign up with a matching address.
              </p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 80px 80px 100px 90px', gap: 0, padding: '8px 0', borderBottom: '1px solid #2a2d40' }}>
                  {['Student', 'Total', 'This Wk', 'Pts', 'Wkly Goal', ''].map(h => (
                    <div key={h} style={{ fontSize: 11, color: '#4a4d60', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                  ))}
                </div>
                {students.map((s, i) => (
                  <div key={s.assignmentId} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 80px 80px 100px 90px', gap: 0, padding: '12px 0', borderBottom: '1px solid #1e2030', alignItems: 'center', fontSize: 13, background: i % 2 === 1 ? '#0f1018' : 'transparent' }}>
                    <span style={{ fontWeight: 600 }}>
                      {s.displayName}
                      {s.inactive && <span style={{ fontSize: 10, background: '#c0392b33', color: '#c0392b', borderRadius: 3, padding: '1px 5px', marginLeft: 6, letterSpacing: 1 }}>INACTIVE</span>}
                    </span>
                    <span style={{ color: '#6b7084' }}>{s.sessionCount}</span>
                    <span style={{ color: s.thisWeek > 0 ? '#27ae60' : '#c0392b', fontWeight: 700 }}>{s.thisWeek}</span>
                    <span style={{ color: '#C9A227', fontWeight: 700 }}>{s.totalPts}</span>
                    <select
                      style={{ ...S.sel, padding: '4px 8px', fontSize: 12, width: 90 }}
                      value={targets[s.studentId] ?? 3}
                      onChange={e => setGoal(s.studentId, Number(e.target.value))}
                    >
                      {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}/week</option>)}
                    </select>
                    <button style={S.btn('#c0392b', true)} onClick={() => removeStudent(s.assignmentId)}>Remove</button>
                  </div>
                ))}
              </>
            )}
          </div>

          <div style={S.card}>
            <div style={S.h2}>Roster Emails</div>
            <p style={{ color: '#6b7084', fontSize: 12, margin: '0 0 16px' }}>
              Students who sign up with these addresses are automatically assigned to you.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                style={{ ...S.inp, flex: 1, width: 'auto' }}
                type="email"
                placeholder="student@school.edu"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEmail()}
              />
              <button style={S.btn()} onClick={addEmail}>Add to Roster</button>
            </div>
            {rosterEmails.length === 0 ? (
              <p style={{ color: '#4a4d60', fontSize: 13, margin: 0 }}>No emails on roster yet.</p>
            ) : (
              rosterEmails.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e2030', fontSize: 13 }}>
                  <span>{r.email}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={S.btn('#20B2AA', true)} onClick={() => handleSendInvite(r.email)} disabled={inviting === r.email}>
                      {inviting === r.email ? 'Sending...' : 'Send Invite'}
                    </button>
                    <button style={S.btn('#c0392b', true)} onClick={() => removeEmail(r.id)}>Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}

function AssignmentsTab({ user }) {
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sqlError, setSqlError] = useState(false);
  const [msg, setMsg] = useState(null);
  const [formStudent, setFormStudent] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCats, setFormCats] = useState([]);
  const [formDiffs, setFormDiffs] = useState([...HS_DIFFICULTIES]);
  const [formNum, setFormNum] = useState(20);
  const [formDue, setFormDue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      const [{ data: activeRows }, { data: assigns, error: assignErr }] = await Promise.all([
        supabase.from('coach_students').select('id, student_id').eq('coach_id', user.id).eq('status', 'active'),
        supabase.from('practice_assignments').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (assignErr?.code === '42P01') { setSqlError(true); setLoading(false); return; }

      const activeIds = (activeRows ?? []).map(r => r.student_id);
      if (activeIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', activeIds);
        setStudents(profiles ?? []);
      }

      setAssignments(assigns ?? []);
    } finally {
      setLoading(false);
    }
  }

  const studentName = (id) => students.find(s => s.id === id)?.display_name ?? id;

  async function createAssignment() {
    if (!formStudent || !formTitle.trim() || !formDiffs.length) {
      setMsg({ type: 'err', text: 'Student, title, and at least one difficulty are required.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from('practice_assignments').insert({
      coach_id: user.id,
      student_id: formStudent,
      title: formTitle.trim(),
      categories: formCats,
      difficulties: formDiffs,
      num_questions: formNum,
      due_date: formDue || null,
    });
    setSaving(false);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setFormTitle(''); setFormCats([]); setFormDiffs([...HS_DIFFICULTIES]); setFormNum(20); setFormDue(''); setFormStudent('');
    setMsg({ type: 'ok', text: 'Assignment created.' });
    load();
  }

  async function deleteAssignment(id) {
    await supabase.from('practice_assignments').delete().eq('id', id);
    load();
  }

  async function completeAssignment(id) {
    await supabase.from('practice_assignments').update({ completed_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  const toggleCat = (cat) => setFormCats(p => p.includes(cat) ? p.filter(c => c !== cat) : [...p, cat]);
  const toggleDiff = (d) => setFormDiffs(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d].sort((a, b) => a - b));

  if (sqlError) {
    return (
      <div style={S.card}>
        <div style={S.h2}>Practice Assignments</div>
        <div style={S.err}>
          The <code>practice_assignments</code> table does not exist yet. Run the SQL from the Admin Panel setup instructions.
        </div>
      </div>
    );
  }

  return (
    <>
      {msg && <div style={msg.type === 'err' ? S.err : S.ok}>{msg.text}</div>}
      <div style={S.card}>
        <div style={S.h2}>Create Assignment</div>
        {loading ? <div style={{ color: '#4a4d60', fontSize: 13 }}>Loading...</div> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b7084', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Student</div>
                <select style={{ ...S.sel, width: '100%' }} value={formStudent} onChange={e => setFormStudent(e.target.value)}>
                  <option value="">— select student —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7084', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Title</div>
                <input style={S.inp} value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Science review — week 3" />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#6b7084', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                Categories <span style={{ color: '#4a4d60', textTransform: 'none', letterSpacing: 0 }}>(all if none selected)</span>
              </div>
              {ALL_CATEGORIES.map(cat => (
                <button key={cat} style={S.pill(formCats.includes(cat))} onClick={() => toggleCat(cat)}>{cat}</button>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#6b7084', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Difficulty</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {DIFF_PRESETS.map(p => (
                  <button key={p.label} onClick={() => setFormDiffs(p.val)} style={{ padding: '3px 10px', fontSize: 11, fontWeight: 700, border: `1px solid ${p.color}`, borderRadius: 4, background: 'transparent', color: p.color, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {[1,2,3,4,5,6].map(d => (
                <button key={d} style={S.pill(formDiffs.includes(d), d <= 2 ? '#20B2AA' : '#C9A227')} onClick={() => toggleDiff(d)}>{DIFFICULTY_LABELS[d]}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b7084', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Questions: {formNum}</div>
                <input type="range" min={5} max={40} step={5} value={formNum} onChange={e => setFormNum(Number(e.target.value))} style={{ width: '100%', accentColor: '#C9A227' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7084', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Due Date</div>
                <input type="date" style={S.inp} value={formDue} onChange={e => setFormDue(e.target.value)} />
              </div>
            </div>

            <button style={S.btn()} onClick={createAssignment} disabled={saving}>{saving ? 'Saving...' : 'Create Assignment'}</button>
          </>
        )}
      </div>

      <div style={S.card}>
        <div style={S.h2}>Assignments ({assignments.length})</div>
        {assignments.length === 0 ? (
          <p style={{ color: '#6b7084', fontSize: 13, margin: 0 }}>No assignments yet.</p>
        ) : (
          assignments.map((a, i) => (
            <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid #1e2030', background: i % 2 === 1 ? '#0f1018' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e6e1', marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7084' }}>
                    {studentName(a.student_id)} · {a.num_questions} questions
                    {a.categories?.length ? ` · ${a.categories.join(', ')}` : ''}
                    {a.due_date ? ` · Due ${new Date(a.due_date).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 3, background: a.completed_at ? '#1a2e1a' : '#2e2a1a', color: a.completed_at ? '#27ae60' : '#C9A227', fontWeight: 700 }}>
                    {a.completed_at ? 'Done' : 'Pending'}
                  </span>
                  {!a.completed_at && <button style={S.btn('#27ae60', true)} onClick={() => completeAssignment(a.id)}>Mark Done</button>}
                  <button style={S.btn('#c0392b', true)} onClick={() => deleteAssignment(a.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function NotesTab({ user }) {
  const [students, setStudents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sqlError, setSqlError] = useState(false);
  const [filterStudent, setFilterStudent] = useState('');
  const [noteStudent, setNoteStudent] = useState('');
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      const [{ data: activeRows }, { data: noteRows, error: noteErr }] = await Promise.all([
        supabase.from('coach_students').select('id, student_id').eq('coach_id', user.id).eq('status', 'active'),
        supabase.from('coach_notes').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (noteErr?.code === '42P01') { setSqlError(true); setLoading(false); return; }

      const activeIds = (activeRows ?? []).map(r => r.student_id);
      if (activeIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', activeIds);
        setStudents(profiles ?? []);
      }

      setNotes(noteRows ?? []);
    } finally {
      setLoading(false);
    }
  }

  const studentName = (id) => students.find(s => s.id === id)?.display_name ?? id;

  async function addNote() {
    if (!noteStudent || !noteText.trim()) { setMsg({ type: 'err', text: 'Select a student and enter a note.' }); return; }
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from('coach_notes').insert({
      coach_id: user.id,
      student_id: noteStudent,
      note: noteText.trim(),
    });
    setSaving(false);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setNoteText('');
    load();
  }

  async function deleteNote(id) {
    await supabase.from('coach_notes').delete().eq('id', id);
    load();
  }

  if (sqlError) {
    return (
      <div style={S.card}>
        <div style={S.h2}>Coach Notes</div>
        <div style={S.err}>The <code>coach_notes</code> table does not exist yet. Run the SQL from the Admin Panel setup instructions.</div>
      </div>
    );
  }

  const visibleNotes = filterStudent ? notes.filter(n => n.student_id === filterStudent) : notes;

  return (
    <>
      {msg && <div style={msg.type === 'err' ? S.err : S.ok}>{msg.text}</div>}
      <div style={S.card}>
        <div style={S.h2}>Add Note</div>
        {loading ? <div style={{ color: '#4a4d60', fontSize: 13 }}>Loading...</div> : (
          <>
            <select style={{ ...S.sel, width: '100%', marginBottom: 10 }} value={noteStudent} onChange={e => setNoteStudent(e.target.value)}>
              <option value="">— select student —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
            </select>
            <textarea
              style={{ ...S.inp, height: 80, resize: 'vertical', marginBottom: 10 }}
              placeholder="Enter note..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
            <button style={S.btn()} onClick={addNote} disabled={saving}>{saving ? 'Saving...' : 'Add Note'}</button>
          </>
        )}
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={S.h2}>Notes ({visibleNotes.length})</div>
          {students.length > 0 && (
            <select style={{ ...S.sel, fontSize: 12, padding: '5px 10px' }} value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
              <option value="">All students</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
            </select>
          )}
        </div>
        {visibleNotes.length === 0 ? (
          <p style={{ color: '#6b7084', fontSize: 13, margin: 0 }}>No notes yet.</p>
        ) : (
          visibleNotes.map((n, i) => (
            <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid #1e2030', background: i % 2 === 1 ? '#0f1018' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#C9A227', marginBottom: 4 }}>
                    {studentName(n.student_id)} · {new Date(n.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: 13, color: '#e8e6e1', whiteSpace: 'pre-wrap' }}>{n.note}</div>
                </div>
                <button style={{ ...S.btn('#c0392b', true), marginLeft: 12 }} onClick={() => deleteNote(n.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default function CoachDashboard({ user, onBack }) {
  const [tab, setTab] = useState('roster');

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A227', letterSpacing: 2, textTransform: 'uppercase' }}>Coach Dashboard</div>
          <button style={S.btn('#6b7084', true)} onClick={onBack}>Back</button>
        </div>

        <div style={S.tabBar}>
          {[['roster', 'My Roster'], ['assignments', 'Assignments'], ['notes', 'Notes']].map(([key, label]) => (
            <button key={key} style={S.tabBtn(tab === key)} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {tab === 'roster' && <RosterTab user={user} />}
        {tab === 'assignments' && <AssignmentsTab user={user} />}
        {tab === 'notes' && <NotesTab user={user} />}
      </div>
    </div>
  );
}
