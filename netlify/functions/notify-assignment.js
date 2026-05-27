const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  const authHeader = event.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  const jwt = authHeader.slice(7);

  const userClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: coachProfile } = await adminClient.from('profiles').select('role, display_name').eq('id', user.id).maybeSingle();
  if (!coachProfile || !['coach', 'admin'].includes(coachProfile.role)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Must be a coach or admin' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { studentId, title, numQuestions, dueDate } = body;
  if (!studentId || !title) {
    return { statusCode: 400, body: JSON.stringify({ error: 'studentId and title required' }) };
  }

  // Look up student email from auth.users via admin API
  const { data: { user: studentUser }, error: studentErr } = await adminClient.auth.admin.getUserById(studentId);
  if (studentErr || !studentUser?.email) {
    return { statusCode: 200, body: JSON.stringify({ success: true, note: 'Student email not found' }) };
  }

  const studentEmail = studentUser.email;
  const coachName = coachProfile.display_name ?? 'Your coach';
  const siteUrl = process.env.URL || 'https://brainbowlpractice.com';

  if (!resendKey) {
    // Email not configured — log and return success so the UI isn't broken
    console.log(`[notify-assignment] RESEND_API_KEY not set. Would send to ${studentEmail}: "${title}"`);
    return { statusCode: 200, body: JSON.stringify({ success: true, note: 'Email not configured (set RESEND_API_KEY)' }) };
  }

  const dueLine = dueDate ? `\nDue: ${new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : '';
  const html = `
    <div style="font-family:Georgia,serif;background:#0a0b0f;color:#e8e6e1;padding:40px 20px;max-width:500px;margin:0 auto">
      <h1 style="color:#C9A227;font-size:22px;margin:0 0 8px">New Practice Assignment</h1>
      <p style="color:#6b7084;font-size:13px;margin:0 0 24px;letter-spacing:1px;text-transform:uppercase">Brain Bowl Practice</p>
      <div style="background:#12131a;border:1px solid #1e2030;border-radius:8px;padding:24px;margin-bottom:24px">
        <div style="font-size:18px;font-weight:700;color:#e8e6e1;margin-bottom:8px">${title}</div>
        <div style="color:#6b7084;font-size:13px">${numQuestions ?? 20} questions assigned by ${coachName}${dueLine}</div>
      </div>
      <a href="${siteUrl}" style="display:inline-block;background:#C9A227;color:#0a0b0f;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px">Open Brain Bowl Practice</a>
      <p style="color:#4a4d60;font-size:12px;margin-top:32px">Log in to see your assignment and start practicing.</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Brain Bowl Practice <noreply@brainbowlpractice.com>',
      to: [studentEmail],
      subject: `New assignment: ${title}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[notify-assignment] Resend error:', err);
    return { statusCode: 200, body: JSON.stringify({ success: true, note: 'Email delivery failed', detail: err }) };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
