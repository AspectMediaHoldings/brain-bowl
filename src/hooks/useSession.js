import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSession(user) {
  const saveSession = useCallback(async (sessionId, score, filters) => {
    if (!user) return;
    await supabase.from('sessions').insert({
      id: sessionId,
      user_id: user.id,
      pts: score.pts,
      bonus_pts: score.bonusPts,
      powers: score.powers,
      negs: score.negs,
      played: score.played,
      filters,
      completed_at: new Date().toISOString(),
    });
  }, [user]);

  return { saveSession };
}
