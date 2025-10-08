
// src/pages/movies/MovieDetailsPage.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/ratings"
import { HeartRating } from "@/components/ui/heart"
import { useUser } from "@/hooks/useUser"

import {
  addFavouriteMovie,
  removeFavouriteMovie, isMovieFavourite,
} from "@/lib/favourite-movies-service"
import {
  getMyRating,
  upsertMyRating,
} from "@/lib/rating-service"

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const tmdbId = Number(id)

  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const { user } = useUser()
  const statusTimerRef = useRef<number | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [isFavourite, setIsFavourite] = useState(false)
  const [hydratingUserState, setHydratingUserState] = useState(true)

  const ratingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<number | null>(null)

  const [statusMessage, setStatusMessage] = useState("");


  // Fetch movie details
  useEffect(() => {
    if (!Number.isFinite(tmdbId)) {
      setErr("Invalid movie id")
      setLoading(false)
      return
    }

    const ctrl = new AbortController()
    setLoading(true)
    setErr(null)

    fetchMovieDetails(tmdbId, ctrl.signal)
      .then(setMovie)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e)
        if (!(e as Error & { name?: string }).name?.includes("AbortError")) {
          setErr(msg || "Failed to load")
        }
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [tmdbId])

  // Hydrate rating + favourite when user and movie are known
  useEffect(() => {
    let cancelled = false
    const hydrate = async () => {
      if (!user || !movie) {
        setHydratingUserState(false)
        return
      }
      try {
        const [myRating, fav] = await Promise.all([
          getMyRating(user.user_id, movie.id),
          isMovieFavourite(user.user_id, movie.id),
        ])
        if (cancelled) return
        setRating(myRating ?? 0)
        lastSavedRef.current = myRating ?? 0
        setIsFavourite(fav)
      } finally {
        if (!cancelled) setHydratingUserState(false)
      }
    }
    setHydratingUserState(true)
    hydrate()
    return () => {
      cancelled = true
    }
  }, [user, movie])

  // Debounced rating save whenever rating changes
  useEffect(() => {
    if (!user || !movie) return
    if (hydratingUserState) return
    if (lastSavedRef.current !== null && lastSavedRef.current === rating) return

    if (ratingTimerRef.current) clearTimeout(ratingTimerRef.current)
    ratingTimerRef.current = setTimeout(async () => {
      try {
        await upsertMyRating(user.user_id, movie.id, rating)
        lastSavedRef.current = rating
        setStatusMessage("Added to your ratings!")
      } catch (e) {
        console.error("Failed to save rating", e)
      }
    }, 500)

    return () => {
      if (ratingTimerRef.current) clearTimeout(ratingTimerRef.current)
    }
  }, [rating, user, movie, hydratingUserState])

  useEffect(() => {
    if (!user || !movie) return

    let cancelled = false

    const fetchFavouriteStatus = async () => {
      try {
        const fav = await isMovieFavourite(user.user_id, movie.id)
        if (!cancelled) setIsFavourite(fav)
      } catch (err) {
        console.error("Failed to fetch favourite status:", err)
      }
    }

    fetchFavouriteStatus()

    return () => {
      cancelled = true
    }
  }, [user, movie])

  useEffect(() => {
    if (!statusMessage) return
    // clear any previous timer
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    // auto-hide after 2.5s
    statusTimerRef.current = window.setTimeout(() => {
      setStatusMessage("")
    }, 2500)

    // cleanup
    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    }
  }, [statusMessage])

  const handleAddToFavourites = async () => {
    if (!user || !movie) return
    setIsFavourite(prev => !prev)
    try {
      if (!isFavourite) {
        await addFavouriteMovie(user.user_id, movie.id)
      } else {
        await removeFavouriteMovie(user.user_id, movie.id)
      }
    } catch (e) {
      console.error("Favourite toggle failed", e)
      setIsFavourite(prev => !prev) // revert
    }
  }

  //const controlsDisabled = !user || loading || hydratingUserState

  if (loading) return <div className="p-6">Loading…</div>
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>
  if (!movie) return <div className="p-6">No movie found.</div>

  return (
    <>
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {movie.title}{" "}
            <span className="text-muted-foreground">({movie.year})</span>
          </h1>
          <Button asChild variant="secondary">
            <Link to="/movies">← Back</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px,1fr]">
          <div className="flex items-center justify-center">
            <Card className="overflow-hidden items-center justify-center">
              <img
                src={movie.poster}
                alt={`${movie.title} poster`}
                className="object-contain rounded-xl shadow-xl ring-1"
              />
            </Card>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-sm text-muted-foreground">{movie.genre}</div>


              <div className="flex items-center justify-between text-lg whitespace-nowrap">
                {/* Left: Rating */}
                <div className="flex items-center gap-2 font-bold">
                  <p>My Rating</p>
                  {user ? (
                    <>
                      <StarRating value={rating} onChange={setRating} />
                      {statusMessage && (
                        <span
                          role="status"
                          aria-live="polite"
                          className="text-sm text-green-600 transition-opacity duration-200"
                        >
                          {statusMessage}
                        </span>
                      )}
                    </>
                  ) : (
                      <span className="text-sm text-muted-foreground">
                        Sign in to rate movies!
                      </span>
                    )}
                </div>

                {/* Right: Favourite */}
                <div className="flex items-center gap-2">
                  <p className="font-bold">Favourite</p>
                  {user ? (
                    isFavourite !== null && (
                      <HeartRating value={isFavourite} onChange={handleAddToFavourites} />
                    )
                  ) : (
                      <span className="text-sm text-muted-foreground">Sign in to save</span>
                    )}
                </div>
              </div>
              <p className="text-base leading-relaxed">{movie.description}</p>
            </CardContent>
          </Card>
        </div>
      </div>

    </>
  )
}

