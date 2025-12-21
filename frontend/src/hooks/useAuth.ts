import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, signOut as supabaseSignOut } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { setAuthToken, removeAuthToken } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        setAuthToken(session.access_token);
      } else {
        removeAuthToken();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabaseSignOut();
    removeAuthToken();
    router.push('/login');
  };

  return { user, loading, signOut };
}
