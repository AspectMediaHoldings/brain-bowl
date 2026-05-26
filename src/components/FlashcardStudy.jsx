import { useState, useEffect, useCallback } from 'react';

const S = {
  wrap: { minHeight: '100vh', background: '#0a0b0f', color: '#e8e6e1', fontFamily: "'Palatino Linotype','Book Antiqua',serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: (flipped) => ({
    width: '100%', maxWidth: 600, minHeight: 240,
    background: '#12131a', border: '1px solid ' + (flipped ? '#20B2AA' : '#1e2030'), borderRadius: 12, padding: 40,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', userSelect: 'none', textAlign: 'center', transition: 'border-color 0.2s',
  }),
};

export default function FlashcardStudy({ cards: initialCards, setTitle, onClose }) {
  const [queue, setQueue] = useState(() => [...initialCards]);
  const [reviewAgain, setReviewAgain] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [mastered, setMastered] = useState(0);

  const current = queue[idx];

  const flip = useCallback(() => setFlipped(f => !f), []);

  const advance = useCallback((gotIt) => {
    const nextReview = gotIt ? [...reviewAgain] : [...reviewAgain, current];
    const nextMastered = gotIt ? mastered + 1 : mastered;
    const nextIdx = idx + 1;

    if (nextIdx >= queue.length) {
      if (nextReview.length === 0) {
        setMastered(nextMastered);
        setDone(true);
      } else {
        setQueue(nextReview);
        setReviewAgain([]);
        setIdx(0);
        setFlipped(false);
        setMastered(nextMastered);
      }
    } else {
      if (!gotIt) setReviewAgain(nextReview);
      else setMastered(nextMastered);
      setIdx(nextIdx);
      setFlipped(false);
    }
  }, [idx, queue, current, reviewAgain, mastered]);

  useEffect(() => {
    function handleKey(e) {
      if (e.code === 'Space') { e.preventDefault(); flip(); }
      if (e.code === 'ArrowRight' && flipped) advance(true);
      if (e.code === 'ArrowLeft' && flipped) advance(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flip, advance, flipped]);

  function restart() {
    setQueue([...initialCards]);
    setIdx(0);
    setFlipped(false);
    setMastered(0);
    setReviewAgain([]);
    setDone(false);
  }

  if (done) {
    return (
      <div style={S.wrap}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, color: '#C9A227', marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A227', marginBottom: 8 }}>Set Complete</div>
          <div style={{ color: '#6b7084', fontSize: 14, marginBottom: 24 }}>
            {mastered} card{mastered !== 1 ? 's' : ''} mastered
          </div>
          <button onClick={restart} style={{ padding: '12px 28px', fontSize: 14, fontWeight: 700, background: '#C9A227', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1, color: '#0a0b0f' }}>
            Study Again
          </button>
          <button onClick={onClose} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: '1px solid #4a4d60', borderRadius: 6, color: '#6b7084', padding: '8px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
            Back to Editor
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div style={S.wrap}>
      <div style={{ width: '100%', maxWidth: 600, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#6b7084', fontWeight: 700 }}>{setTitle}</span>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #2a2d40', borderRadius: 5, color: '#6b7084', padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Exit</button>
        </div>
        <div style={{ height: 4, background: '#1e2030', borderRadius: 2, marginBottom: 4 }}>
          <div style={{ height: '100%', background: '#C9A227', borderRadius: 2, width: (idx / queue.length * 100) + '%', transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 11, color: '#4a4d60', textAlign: 'right' }}>{idx + 1} / {queue.length}</div>
      </div>

      <div style={S.card(flipped)} onClick={flip}>
        {!flipped ? (
          <>
            <div style={{ fontSize: 11, color: '#4a4d60', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Front</div>
            <div style={{ fontSize: 18, color: '#e8e6e1', lineHeight: 1.5 }}>{current.front}</div>
            <div style={{ fontSize: 11, color: '#4a4d60', marginTop: 20 }}>Click or press Space to reveal</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: '#20B2AA', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Answer</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e8e6e1', lineHeight: 1.4 }}>{current.back}</div>
          </>
        )}
      </div>

      {flipped && (
        <>
          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            <button onClick={() => advance(false)} style={{ padding: '12px 28px', fontSize: 14, fontWeight: 700, background: 'transparent', border: '2px solid #c0392b', borderRadius: 8, color: '#c0392b', cursor: 'pointer', fontFamily: 'inherit' }}>
              Review Again ←
            </button>
            <button onClick={() => advance(true)} style={{ padding: '12px 28px', fontSize: 14, fontWeight: 700, background: '#27ae60', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              Got It →
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#4a4d60', marginTop: 12 }}>← Review Again &nbsp;|&nbsp; Got It →</div>
        </>
      )}
    </div>
  );
}
