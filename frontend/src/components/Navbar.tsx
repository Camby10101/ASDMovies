// src/components/Navbar.tsx
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useNavigate, Link, NavLink, useLocation } from "react-router-dom";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { api } from "@/lib/api"
import { useUser } from "@/hooks/useUser"
import Spinner from "./ui/spinner";
import { Typography } from "./ui/typography";

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const isSyncingProfileRef = useRef(false)

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    }
  }, []);

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
  const navigate = useNavigate();
  const { user } = useUser();
  const location = useLocation();

  const pathToLabel: Record<string, string> = {
    "/profile": "Profile",
    "/friend": "Friends",
    "/groups": "Groups",
    "/privacy": "Privacy",
  };

  const accountLabel = Object.entries(pathToLabel).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? "Account";

  return (
    <header className="flex justify-center items-center h-18 sticky top-0 z-50 w-[100%] bg-background/95 backdrop-blur">
      <div className="grid grid-cols-[20%_60%_20%] items-center w-[40%] h-[100%] mx-auto border-l border-r supports-[backdrop-filter]:bg-background/60">
        <div className="ml-5">
          <Link to="/">
            <h1 className="text-2xl font-extrabold tracking-tight text-primary drop-shadow-sm">
              MovieLily
            </h1>
          </Link>
        </div>
        
        <div className="flex justify-center items-center gap-10 text-base font-semibold tracking-wide whitespace-nowrap">
          <nav className="flex items-center gap-10 text-base font-semibold tracking-wide">
            {[
              { name: "Trending", path: "/trendingMovies" },
              { name: "Movies", path: "/movies" },
              // { name: "Friends", path: "/friend" },
              // { name: "Groups", path: "/groups" },
              // { name: "Privacy & Controls", path: "/privacy" },
              { name: "About Us", path: "/about" },
            ].map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {setOpen(false)}}
                className={({ isActive }) =>
                  `relative transition-all duration-300 ${
                    isActive
                      ? "text-black after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-full after:h-[2px] after:bg-black after:rounded-full"
                      : "text-gray-500 hover:text-black after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-black after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-full"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex justify-end items-center mr-5 gap-2">
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="transition-colors"
          >
            {isDarkMode ? "Dark" : "Light"}
          </Button>

          {isAuthenticated ? (
            user ? (
              <div className="relative inline-block">
                {/* Account Button */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOpen(prev => !prev)}
                >
                  <Typography align="center">{accountLabel} ▾</Typography>
                </Button>

                {/* Dropdown Menu */}
                {open && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        navigate(`/profile/${user.user_id}`);
                        setOpen(false);
                      }}
                    >
                      <Typography align="center">Profile</Typography>
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={async () => {
                        navigate(`/friend`);
                        setOpen(false);
                      }}
                    >
                      <Typography align="center">Friends</Typography>
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={async () => {
                        navigate(`/groups`);
                        setOpen(false);
                      }}
                    >
                      <Typography align="center">Groups</Typography>
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={async () => {
                        navigate(`/privacy`);
                        setOpen(false);
                      }}
                    >
                      <Typography align="center">Privacy</Typography>
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={async () => {
                        await handleSignOut();
                        setOpen(false);
                      }}
                    >
                      <Typography align="center">Sign Out</Typography>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Spinner />
            )) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm"><Typography align="center">Sign In</Typography></Button>
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
                  {statusMessage && <p className="text-sm text-muted-foreground">{statusMessage}</p>}
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Sending…" : "Send Magic Link"}
                    </Button>
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
