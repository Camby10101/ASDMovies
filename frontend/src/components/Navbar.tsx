// src/components/Navbar.tsx
import { Link } from "react-router-dom"
import { useEffect, useRef, useState, type FormEvent } from "react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { api } from "@/lib/api"

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const isSyncingProfileRef = useRef(false)

  const syncProfile = async (session: Session | null) => {
    if (!session || isSyncingProfileRef.current) return
    isSyncingProfileRef.current = true
    try {
      const r = await api("/api/profile", { method: "GET" })
      if (!r.ok && r.status !== 404) {
        console.warn("Profile sync returned status:", r.status)
      }
    } catch (error) {
      console.error("Failed to sync/get profile", error)
    } finally {
      isSyncingProfileRef.current = false
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatusMessage(null)
    setIsSubmitting(true)
    try {
      const redirectTo = `${window.location.origin}`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      })
      setStatusMessage(error ? `Error: ${error.message}` : "Check your email for a magic link to sign in.")
    } catch (err) {
      setStatusMessage(`Error: ${(err as Error)?.message ?? "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      const session = data.session
      setIsAuthenticated(Boolean(session))
      if (session) void syncProfile(session)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return
        setIsAuthenticated(Boolean(session))
        if (session) void syncProfile(session)
      }
    )
    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut() }

  return (
    <header className="pl-4 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-6 flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold inline-block">ASD Movies</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link to="/trendingMovies" className="transition-colors hover:text-foreground/80 text-foreground/60">Trending</Link>
          <Link to="/movies" className="transition-colors hover:text-foreground/80 text-foreground/60">Movies</Link>
          <Link to="/friend" className="transition-colors hover:text-foreground/80 text-foreground/60">Friends</Link>
          <Link to="/profile" className="transition-colors hover:text-foreground/80 text-foreground/60">My Profile</Link>
          <Link to="/account" className="transition-colors hover:text-foreground/80 text-foreground/60">Account</Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground/80 text-foreground/60">Privacy &amp; Controls</Link>
          <Link to="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">About</Link>
        </nav>

        <div className="ml-auto flex items-center">
          {isAuthenticated ? (
            <Button size="sm" variant="secondary" onClick={handleSignOut}>Sign Out</Button>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm">Sign In</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sign in</DialogTitle>
                  <DialogDescription>Enter your email to continue.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-2">
                  <Input type="email" placeholder="you@example.com" value={email}
                         onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
                  {statusMessage && <p className="text-sm text-muted-foreground">{statusMessage}</p>}
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send Magic Link"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
