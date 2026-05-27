import { useState } from 'react';

const FONT = "'Palatino Linotype','Book Antiqua',serif";
const GOLD = '#C9A227';
const TEAL = '#20B2AA';
const BG = '#0a0b0f';
const SURFACE = '#12131a';
const BORDER = '#1e2030';
const TEXT = '#e8e6e1';
const MUTED = '#8a8d9e';
const DIM = '#4a4d60';

const CATEGORIES = ['Science', 'History', 'Literature', 'Fine Arts', 'Geography', 'Philosophy', 'Mathematics', 'Religion'];

const FEATURES = [
  { icon: '⚡', title: 'Tossup Practice', desc: 'Pyramidal tossups read word by word at your chosen speed. Buzz in at any point — just like a real match.', color: GOLD },
  { icon: '⊕', title: 'Bonus Practice', desc: 'Three-part bonuses drawn from the same category as your tossup. Full leadin, three parts, timed.', color: TEAL },
  { icon: '▤', title: 'Flashcard Builder', desc: 'Save any question as a flashcard while you practice. Review by category or difficulty on your own schedule.', color: '#9b59b6' },
  { icon: '◎', title: 'Coach Dashboard', desc: 'Assign practice sets, track weekly session counts, and flag students who have gone inactive.', color: TEAL },
  { icon: '◈', title: 'Question Database', desc: 'Search by answer, category, or set name across thousands of NAQT-format questions. Filter by difficulty.', color: GOLD },
  { icon: '↗', title: 'Stats Tracking', desc: 'Points per session, power rate, neg rate, and session history — automatically saved when you sign in.', color: '#7b9fff' },
];

const COACH_BULLETS = [
  'Assign practice sets to individual students',
  'Track session counts and points per student each week',
  'Get alerted when students go inactive for 7+ days',
  'Manage your roster by email — auto-assigns on signup',
  'Flag bad or outdated questions for review',
  'Post announcements visible to all signed-in users',
];

const HOW_IT_WORKS = [
  { n: '1', heading: 'Choose your settings', body: 'Pick categories, difficulty, and reading speed. Defaults work fine for first-time users.' },
  { n: '2', heading: 'Read the tossup', body: 'Words appear one at a time. Click Buzz when you know the answer — just like a live match.' },
  { n: '3', heading: 'Answer the bonus', body: 'Correct on a tossup? Three bonus parts follow from the same category automatically.' },
  { n: '4', heading: 'Review your stats', body: 'Sign in to save progress. Points, powers, and negs tracked automatically every session.' },
];

const ABOUT_SECTIONS = [
  {
    label: 'Mission',
    text: 'Competitive quiz bowl prep should not require expensive subscriptions or school budget approvals. This platform is free for every student, forever. Coaches get a dashboard at no cost. The only requirement is a device and an internet connection.',
  },
  {
    label: 'Data and Privacy',
    text: 'Questions are fetched in real time from qbreader.org — we do not store question content. Signed-in accounts store only your session stats (points, powers, negs) and display name. Guest sessions are never saved. Email addresses are used only for login and coach-assigned notifications.',
  },
];

function AboutModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: SURFACE, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: '36px 32px',
          maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>About</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 22, padding: '0 2px', lineHeight: 1, fontFamily: FONT }}
          >
            ×
          </button>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: TEXT, margin: '0 0 16px' }}>Brain Bowl Practice</h2>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.75, margin: '0 0 4px' }}>
          Brain Bowl Practice is a free study tool built for middle school and high school quiz bowl teams.
          It pulls live pyramidal questions from the qbreader.org API — the same NAQT-format packets used in
          real tournaments — so students always practice with current, correctly formatted material.
        </p>

        {ABOUT_SECTIONS.map(({ label, text }) => (
          <div key={label} style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20, marginTop: 20 }}>
            <div style={{ fontSize: 11, color: DIM, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.75, margin: 0 }}>{text}</p>
          </div>
        ))}

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20, marginTop: 20 }}>
          <div style={{ fontSize: 11, color: DIM, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Contact</div>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.75, margin: 0 }}>
            Feedback or bug reports:{' '}
            <a href="mailto:nspells@gmail.com" style={{ color: GOLD, textDecoration: 'none' }}>nspells@gmail.com</a>
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 24, padding: '10px 24px', fontSize: 12, fontWeight: 700,
            background: 'transparent', border: `1px solid ${DIM}`, borderRadius: 6,
            color: MUTED, cursor: 'pointer', fontFamily: FONT, letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function LandingPage({ onSignIn, onGuest }) {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: FONT }}>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {/* ── Top Nav ──────────────────────────────────────── */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 28px' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', height: 56,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, letterSpacing: 2, textTransform: 'uppercase' }}>
            Brain Bowl Practice
          </div>
          <button
            onClick={onSignIn}
            style={{
              padding: '7px 18px', fontSize: 12, fontWeight: 700,
              border: `1px solid ${DIM}`, borderRadius: 6,
              background: 'transparent', color: MUTED, cursor: 'pointer',
              fontFamily: FONT, letterSpacing: 1,
            }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        maxWidth: 760, margin: '0 auto', padding: '80px 28px 56px', textAlign: 'center',
      }}>
        {/* Dot-grid texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `radial-gradient(circle, ${BORDER} 1px, transparent 1px)`,
          backgroundSize: '28px 28px', opacity: 0.55,
        }} />
        {/* Gold ambient glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 480, height: 240,
          background: `radial-gradient(ellipse, ${GOLD}1a 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-block', position: 'relative',
          padding: '4px 14px', border: `1px solid ${TEAL}44`,
          borderRadius: 20, fontSize: 11, color: TEAL,
          letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 28,
        }}>
          Free · Florida MS &amp; HS Brain Bowl · Powered by qbreader
        </div>

        <h1 style={{
          fontSize: 'clamp(38px, 7vw, 68px)', fontWeight: 700, color: TEXT,
          margin: '0 0 6px', lineHeight: 1.08, letterSpacing: '-0.5px', position: 'relative',
        }}>
          Practice{' '}
          <span style={{
            background: `linear-gradient(135deg, #e8c04a 0%, ${GOLD} 45%, #b8891f 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Brain Bowl.
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)', color: MUTED,
          margin: '20px auto 40px', lineHeight: 1.55, maxWidth: 540, position: 'relative',
        }}>
          Free pyramidal tossup and bonus practice for Florida middle school
          and high school brain bowl teams. No app, no subscription, no catch.
        </p>

        <div className="bb-hero-btns" style={{
          display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', position: 'relative',
        }}>
          <button
            onClick={onGuest}
            style={{
              padding: '15px 36px', fontSize: 14, fontWeight: 700,
              background: GOLD, border: 'none', borderRadius: 8,
              color: BG, cursor: 'pointer', fontFamily: FONT,
              letterSpacing: 1.5, textTransform: 'uppercase',
              boxShadow: `0 0 36px ${GOLD}44`,
            }}
          >
            I'm a Student — Practice Now
          </button>
          <button
            onClick={onSignIn}
            style={{
              padding: '15px 36px', fontSize: 14, fontWeight: 700,
              background: 'transparent', border: `1px solid ${TEAL}`,
              borderRadius: 8, color: TEAL, cursor: 'pointer',
              fontFamily: FONT, letterSpacing: 1.5, textTransform: 'uppercase',
            }}
          >
            I'm a Coach — Sign In
          </button>
        </div>

        <p style={{ marginTop: 22, fontSize: 12, color: DIM, letterSpacing: 0.5, position: 'relative' }}>
          No account required to start. Stats saved automatically when you sign in.
        </p>

        {/* Category badge strip */}
        <div className="bb-cat-badges" style={{
          marginTop: 36, display: 'flex', gap: 8,
          justifyContent: 'center', flexWrap: 'wrap', position: 'relative',
        }}>
          {CATEGORIES.map((cat, i) => (
            <span
              key={cat}
              style={{
                padding: '4px 12px', fontSize: 11,
                border: `1px solid ${i % 3 === 0 ? GOLD + '55' : BORDER}`,
                borderRadius: 20,
                color: i % 3 === 0 ? GOLD + 'cc' : DIM,
                letterSpacing: 1,
                background: SURFACE,
                fontWeight: i % 3 === 0 ? 700 : 400,
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────── */}
      <div style={{
        maxWidth: 1100, margin: '0 auto 64px', height: 1,
        background: `linear-gradient(to right, transparent, ${BORDER}, transparent)`,
      }} />

      {/* ── Features Grid ────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: 11, color: DIM, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            Everything you need
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: TEXT, margin: 0 }}>
            Built for competitive practice.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ icon, title, desc, color }) => (
            <div
              key={title}
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 10, padding: '24px 22px',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 10, color }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 8, letterSpacing: 0.3 }}>{title}</div>
              <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For Coaches Card ─────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px 80px' }}>
        <div style={{
          background: SURFACE, border: `1px solid ${TEAL}`,
          borderRadius: 12, padding: '40px',
          display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start',
        }}>
          <div style={{ flex: '1 1 260px' }}>
            <div style={{ fontSize: 11, color: TEAL, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>
              For Coaches
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 700, color: TEXT, margin: '0 0 14px', lineHeight: 1.2 }}>
              Built for coaches.
            </h2>
            <p style={{ fontSize: 14, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
              A dedicated dashboard lets you manage your roster and keep your team on track between tournaments.
            </p>
            <button
              onClick={onSignIn}
              style={{
                padding: '12px 28px', fontSize: 13, fontWeight: 700,
                background: TEAL, border: 'none', borderRadius: 7,
                color: BG, cursor: 'pointer', fontFamily: FONT,
                letterSpacing: 1, textTransform: 'uppercase',
              }}
            >
              Sign in to get started
            </button>
          </div>
          <div style={{ flex: '1 1 260px' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {COACH_BULLETS.map((item) => (
                <li key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                  <span style={{ color: TEAL, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Coach Outreach Banner ────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px 56px' }}>
        <div style={{
          background: `linear-gradient(135deg, ${SURFACE} 0%, #0f1520 100%)`,
          border: `1px solid ${GOLD}44`,
          borderRadius: 10, padding: '28px 36px',
          display: 'flex', flexWrap: 'wrap', gap: 20,
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
              Coach at a Florida brain bowl school?
            </div>
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, maxWidth: 480 }}>
              Apply for a free coach account. You'll get a roster dashboard, practice assignments,
              and per-subject performance data for every student on your team.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={onSignIn}
              style={{
                padding: '11px 24px', fontSize: 12, fontWeight: 700,
                background: GOLD, border: 'none', borderRadius: 7,
                color: BG, cursor: 'pointer', fontFamily: FONT,
                letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}
            >
              Apply as Coach
            </button>
            <a
              href="mailto:nspells@gmail.com?subject=Brain Bowl Practice — Coach Account Request"
              style={{
                padding: '11px 20px', fontSize: 12, fontWeight: 700,
                background: 'transparent', border: `1px solid ${DIM}`,
                borderRadius: 7, color: MUTED, cursor: 'pointer',
                fontFamily: FONT, letterSpacing: 1, textTransform: 'uppercase',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              Email Us
            </a>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section style={{
        background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
        padding: '56px 28px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ fontSize: 11, color: DIM, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
              How it works
            </div>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: TEXT, margin: 0 }}>
              Start practicing in 30 seconds.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 4 }}>
            {HOW_IT_WORKS.map(({ n, heading, body }) => (
              <div key={n} style={{ padding: '20px 18px' }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: BORDER, lineHeight: 1, marginBottom: 10, fontFamily: FONT }}>{n}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{heading}</div>
                <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section style={{ maxWidth: 620, margin: '0 auto', padding: '72px 28px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: TEXT, margin: '0 0 16px', lineHeight: 1.2 }}>
          Ready to improve your game?
        </h2>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 32px', lineHeight: 1.6 }}>
          No signup required. Jump into practice right now, or create an account to save your progress
          and join the leaderboard.
        </p>
        <div className="bb-hero-btns" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onGuest}
            style={{
              padding: '14px 32px', fontSize: 14, fontWeight: 700,
              background: GOLD, border: 'none', borderRadius: 8,
              color: BG, cursor: 'pointer', fontFamily: FONT,
              letterSpacing: 1.5, textTransform: 'uppercase',
              boxShadow: `0 0 28px ${GOLD}38`,
            }}
          >
            Start Practicing Free
          </button>
          <button
            onClick={onSignIn}
            style={{
              padding: '14px 32px', fontSize: 14, fontWeight: 700,
              background: 'transparent', border: `1px solid ${DIM}`,
              borderRadius: 8, color: MUTED, cursor: 'pointer',
              fontFamily: FONT, letterSpacing: 1.5, textTransform: 'uppercase',
            }}
          >
            Sign In
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '32px 28px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: DIM, margin: 0, letterSpacing: 1 }}>
          Brain Bowl Practice — Free forever for Florida students and coaches.
        </p>
        <p style={{ fontSize: 11, color: '#2a2d40', margin: '6px 0 0' }}>
          Questions sourced from{' '}
          <a href="https://www.qbreader.org" target="_blank" rel="noopener noreferrer" style={{ color: DIM, textDecoration: 'none' }}>qbreader.org</a>
          {' '}· NAQT format · MS and HS difficulty
        </p>
        <p style={{ fontSize: 11, color: '#2a2d40', margin: '8px 0 0' }}>
          Questions or feedback:{' '}
          <a href="mailto:nspells@gmail.com" style={{ color: MUTED, textDecoration: 'none' }}>nspells@gmail.com</a>
          {' '}·{' '}
          <button
            onClick={() => setShowAbout(true)}
            style={{
              background: 'none', border: 'none', color: MUTED,
              cursor: 'pointer', fontSize: 11, letterSpacing: 0,
              fontFamily: FONT, textDecoration: 'underline', padding: 0,
            }}
          >
            About
          </button>
        </p>
      </footer>
    </div>
  );
}
