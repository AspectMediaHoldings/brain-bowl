import { supabase } from '../lib/supabase';

export async function logTossupEvent({ sessionId, userId, tossup, buzzWordIndex, isPower, correct, pts }) {
  if (!userId || !sessionId) return;
  try {
    await supabase.from('session_events').insert({
      session_id: sessionId,
      user_id: userId,
      question_id: String(tossup._id ?? tossup.id ?? ''),
      category: tossup.category ?? null,
      subcategory: tossup.subcategory ?? null,
      difficulty: tossup.difficulty ?? null,
      event_type: 'tossup',
      buzz_word_index: buzzWordIndex,
      is_power: isPower,
      bonus_part: null,
      correct,
      pts,
    });
  } catch { /* fail silently — table provisioned separately */ }
}

export async function logBonusPartEvent({ sessionId, userId, bonus, partIdx, correct, pts }) {
  if (!userId || !sessionId) return;
  try {
    await supabase.from('session_events').insert({
      session_id: sessionId,
      user_id: userId,
      question_id: String(bonus._id ?? bonus.id ?? ''),
      category: bonus.category ?? null,
      subcategory: bonus.subcategory ?? null,
      difficulty: bonus.difficulty ?? null,
      event_type: 'bonus_part',
      buzz_word_index: null,
      is_power: null,
      bonus_part: partIdx + 1,
      correct,
      pts,
    });
  } catch { /* fail silently */ }
}
