
// src/pages/users/UserFavouriteMovies.tsx
import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { Typography } from "@/components/ui/typography"
import SmallMovieCard from "@/components/ui/smallMovieCard"

import { useUser } from "@/hooks/useUser"
import { useProfile } from "@/hooks/useProfile"

import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper"
import { fetchUserRatings } from "@/lib/rating-service"
import type { UserMovieRating } from "@/types/user-movie-ratings"

type RatedMovie = { movie: Movie; userRating: number; ratedAt?: string }

const isAbortError = (e: unknown) =>
  e instanceof DOMException && e.name === "AbortError"

type SortMode =
  | "newest"
  | "oldest"
  | "ratingDesc"
  | "ratingAsc"
  | "titleAsc"
  | "titleDesc"
  | "yearDesc"
  | "yearAsc"

const UserFavouriteMovies = () => {
  const { id } = useParams<{ id: string }>() // handle or user_id (must match useProfile)
  const { user, loadingUser } = useUser()
  const { profile, loadingProfile } = useProfile(id!)

  const isCurrentUser =
    !loadingUser && !loadingProfile && profile?.user_id === user?.user_id

  const [ratedMovies, setRatedMovies] = useState<RatedMovie[]>([])
  const [loadingRated, setLoadingRated] = useState(true)
  const [errRated, setErrRated] = useState<string | null>(null)

  // NEW: sort state
  const [sortMode, setSortMode] = useState<SortMode>("newest")

  useEffect(() => {
    if (!profile) return

    const ctrl = new AbortController()
    const { signal } = ctrl

    const loadAllRated = async () => {
      setLoadingRated(true)
      setErrRated(null)

      try {
        const ratings: UserMovieRating[] = await fetchUserRatings(profile.user_id)

        // newest → oldest; tolerate null created_at
        const sorted = ratings
          .slice()
          .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))

        // de-dupe by tmdb_id (keep newest)
        const deduped = Array.from(new Map(sorted.map(r => [r.tmdb_id, r])).values())

        // throttle in chunks to avoid API rate limits
        const concurrency = 6
        const results: PromiseSettledResult<RatedMovie>[] = []
        for (let i = 0; i < deduped.length; i += concurrency) {
          if (signal.aborted) return
          const chunk = deduped.slice(i, i + concurrency)
          const chunkResults = await Promise.allSettled(
            chunk.map(async (r) => {
              const m = await fetchMovieDetails(r.tmdb_id, signal)
              return { movie: m, userRating: r.rating, ratedAt: r.created_at ?? undefined }
            })
          )
          results.push(...chunkResults)
        }

        if (signal.aborted) return

        const ok = results
          .filter((r): r is PromiseFulfilledResult<RatedMovie> => r.status === "fulfilled")
          .map((r) => r.value)

        const failures = results
          .filter((r): r is PromiseRejectedResult => r.status === "rejected")
          .map((r) => r.reason)
          .filter((e) => !isAbortError(e))

        if (ok.length === 0 && failures.length > 0) {
          setErrRated("Failed to load rated movies.")
          return
        }

        setRatedMovies(ok)
      } catch (err) {
        if (!isAbortError(err)) {
          console.error("loadAllRated error:", err)
          setErrRated("Failed to load rated movies.")
        }
      } finally {
        if (!signal.aborted) setLoadingRated(false)
      }
    }

    loadAllRated()
    return () => ctrl.abort()
  }, [profile])

  // helpers to read fields safely
  const getTitle = (m: Movie) =>
    (m as any).title ?? (m as any).name ?? ""

  const getYear = (m: Movie) =>
    (m as any).year ?? (m as any).release_year ?? (() => {
      // try parse from release_date "YYYY-MM-DD"
      const d = (m as any).release_date as string | undefined
      return d?.slice(0, 4) ?? ""
    })()

  // NEW: memoized sorted list
  const sortedRated = useMemo(() => {
    const arr = ratedMovies.slice()

    const compareTitle = (a: RatedMovie, b: RatedMovie) =>
      getTitle(a.movie).localeCompare(getTitle(b.movie), undefined, { sensitivity: "base" })

    const compareYear = (a: RatedMovie, b: RatedMovie) => {
      const ya = Number(getYear(a.movie)) || -Infinity
      const yb = Number(getYear(b.movie)) || -Infinity
      return ya - yb
    }

    const compareDate = (a: RatedMovie, b: RatedMovie) =>
      (a.ratedAt ?? "").localeCompare(b.ratedAt ?? "")

    switch (sortMode) {
      case "newest":
        return arr.sort((a, b) => (b.ratedAt ?? "").localeCompare(a.ratedAt ?? ""))
      case "oldest":
        return arr.sort(compareDate)
      case "ratingDesc":
        return arr.sort((a, b) => (b.userRating ?? 0) - (a.userRating ?? 0))
      case "ratingAsc":
        return arr.sort((a, b) => (a.userRating ?? 0) - (b.userRating ?? 0))
      case "titleAsc":
        return arr.sort(compareTitle)
      case "titleDesc":
        return arr.sort((a, b) => compareTitle(b, a))
      case "yearDesc":
        return arr.sort((a, b) => compareYear(b, a))
      case "yearAsc":
        return arr.sort(compareYear)
      default:
        return arr
    }
  }, [ratedMovies, sortMode])

  if (loadingProfile || loadingRated) return <p>Loading...</p>
  if (!profile) return <p>Profile does not exist</p>
  if (errRated) return <p className="text-red-600">{errRated}</p>

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <Typography size="h1"><span className="text-blue-500">@{profile.handle}'s</span> Movie Ratings</Typography>

        {/* Sort controls */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground" htmlFor="sort">
            Sort
          </label>
          <select
            id="sort"
            className="rounded-md border px-2 py-1 text-sm"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="newest">Newest (rated)</option>
            <option value="oldest">Oldest (rated)</option>
            <option value="ratingDesc">Rating: High → Low</option>
            <option value="ratingAsc">Rating: Low → High</option>
            <option value="titleAsc">Title A → Z</option>
            <option value="titleDesc">Title Z → A</option>
            <option value="yearDesc">Year: New → Old</option>
            <option value="yearAsc">Year: Old → New</option>
          </select>
        </div>
      </div>

      {sortedRated.length === 0 ? (
        <p>{isCurrentUser ? "You haven’t rated any movies yet." : "No rated movies yet."}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedRated.map(({ movie, userRating }) => (
            <SmallMovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              year={getYear(movie)}
              poster={(movie as any).poster ?? (movie as any).poster_path ?? ""}
              genre={(movie as any).genre ?? ""}
              rating={userRating}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default UserFavouriteMovies

