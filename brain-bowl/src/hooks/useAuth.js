import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [aal, setAal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  async function loadAal() {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAal(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([loadProfile(session.user.id), loadAal()]);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await Promise.all([loadProfile(session.user.id), loadAal()]);
        } else {
          setProfile(null);
          setAal(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();
  const continueAsGuest = () => setGuest(true);

  const isCoach = profile?.role === 'coach';
  const needsMFA = isCoach && aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2';
  const needsMFASetup = isCoach && aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal1';

  return { user, profile, aal, loading, guest, isCoach, needsMFA, needsMFASetup, signOut, continueAsGuest };
}
