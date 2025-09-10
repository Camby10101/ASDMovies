import { Link } from 'react-router';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase.ts';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isSyncingProfileRef = useRef(false);

  const syncProfile = async (session: Session | null) => {
    if (!session) return;
    if (isSyncingProfileRef.current) return;
    isSyncingProfileRef.current = true;
    try {
      const token = session.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      await fetch(`${apiBase}/api/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Non-blocking: log to console but do not surface to UI here
      console.error('Failed to sync/get profile', error);
    } finally {
      isSyncingProfileRef.current = false;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });
      if (error) {
        setStatusMessage(`Error: ${error.message}`);
      } else {
        setStatusMessage('Check your email for a magic link to sign in.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setStatusMessage(`Error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!isMounted) return;
      setIsAuthenticated(Boolean(data.session));
      if (data.session) {
        // Ensure profile exists/created on initial load if already authenticated
        syncProfile(data.session);
      }
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((
      _event: AuthChangeEvent,
      session: Session | null
    ) => {
      setIsAuthenticated(Boolean(session));
      if (session) {
        // Ensure profile exists/created after sign-in/sign-up
        syncProfile(session);
      }
    });
    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="pl-4 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-6 flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold inline-block">
              ASD Movies
            </span>
          </Link>
        </div>

        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            to="/"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Home
          </Link>
          <Link
            to="/movies"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Movies
          </Link>          
          <Link
            to="/trendingMovies"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Trending Movies 
          </Link>
          <Link
            to="/about"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            About
          </Link>
          <Link
            to="/friend"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            TEMP FRIENDS
          </Link>
          <Link
            to="/profile"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            My Profile
          </Link>
          <Link
            to="/account"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Account
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Privacy & Controls
          </Link>
        </nav>

        <div className="ml-auto flex items-center">
          {isAuthenticated ? (
            <Button size="sm" variant="secondary" onClick={handleSignOut}>Sign Out</Button>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Sign In</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sign in</DialogTitle>
                  <DialogDescription>Enter your email to continue.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-2">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  {statusMessage && (
                    <p className="text-sm text-muted-foreground">{statusMessage}</p>
                  )}
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending…' : 'Send Magic Link'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
