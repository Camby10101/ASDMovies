import { useEffect, useState } from 'react';
import type { /*Session,*/ User, UserIdentity } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserSafe = Pick<User, 'id' | 'email' | 'created_at' | 'aud' | 'app_metadata' | 'user_metadata' | 'phone' | 'role' | 'updated_at' | 'confirmed_at' | 'email_confirmed_at' | 'phone_confirmed_at' | 'last_sign_in_at'> & {
  identities?: UserIdentity[] | null;
};

export default function AccountPage() {
  // const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserSafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setError(error.message);
        }
        //setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      //setSession(newSession);
      setUser(newSession?.user ?? null);
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="container mx-auto p-4">Loading account…</div>;
  if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  if (!user) return <div className="container mx-auto p-4">Not signed in.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Account</h1>
      <div className="grid gap-4">
        <InfoRow label="User ID" value={user.id} />
        <InfoRow label="Email" value={user.email ?? '—'} />
        <InfoRow label="Role" value={user.role ?? '—'} />
        <InfoRow label="Created" value={formatDate(user.created_at)} />
{/* 
        <InfoRow label="Updated" value={formatDate(user.updated_at)} />
        <InfoRow label="Last sign-in" value={formatDate(user.last_sign_in_at)} />
*/}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
      <div className="w-48 text-muted-foreground">{label}</div>
      <div className="font-mono text-sm break-all">{value}</div>
    </div>
  );
}

/*
function Section({ title, json }: { title: string; json: unknown }) {
  return (
    <div>
      <div className="text-muted-foreground mb-1">{title}</div>
      <pre className="bg-muted text-sm p-3 rounded overflow-auto max-w-full">
        {JSON.stringify(json, null, 2)}
      </pre>
    </div>
  );
}
*/

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}


