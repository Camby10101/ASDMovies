
// Manage component state and lifecycle
import { useEffect, useMemo, useState } from "react"

// Router hook to extract URL parameters 
import { useParams } from "react-router-dom"

// UI Components
import { Typography } from "@/components/ui/typography"
import SmallMovieCard from "@/components/ui/smallMovieCard"

// Customer hooks for user auth and profile data
import { useUser } from "@/hooks/useUser"
import { useProfile } from "@/hooks/useProfile"

// API helper functions and type definitions
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper"
import { fetchUserRatings } from "@/lib/rating-service"
import type { UserMovieRating } from "@/types/user-movie-ratings"

// Type definition: combines movie data with user rating
type RatedMovie = { 
  movie: Movie;  // Movie details from TMDB
  userRating: number;  // User's numeric rating
  ratedAt?: string }  // Optional timestamp (used for rating)

// Used to distinguish between intentional cancellations and real errors
const isAbortError = (e: unknown) =>
  e instanceof DOMException && e.name === "AbortError"


// Union type that defines all possible sorting modes
// Provides type safety for the sort drop down
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
  
  // Extract user identifier from useProfile
  // Can either be the handle or userID since both are unique
  const { id } = useParams<{ id: string }>() // handle or user_id (must match useProfile)

  // Gets the currently Authed User
  const { user, loadingUser } = useUser()

  // Fetch profile data for the user being viewed (may differ from authenticated user)
  const { profile, loadingProfile } = useProfile(id!)

  // Check if we are on our own profile vs someone else's
  // Future change: can use for changing UI messages: "You havn't rated..." vs "No rated movies"
  const isCurrentUser =
    !loadingUser && !loadingProfile && profile?.user_id === user?.user_id

  // STATE MANAGEMENT

  // Array of movies with user ratings - core data
  const [ratedMovies, setRatedMovies] = useState<RatedMovie[]>([])

  // Load state for async movie fetching
  const [loadingRated, setLoadingRated] = useState(true)

  // Error message if movie fetching fails
  const [errRated, setErrRated] = useState<string | null>(null)

  // The current sort mode of the application 
  const [sortMode, setSortMode] = useState<SortMode>("newest")

  // SORTING FUNCTIONALITY
  useEffect(() => {
    // Guard: don't run if profile hasn't loaded
    if (!profile) return


  // Allows canceling of mid progress requests 
    // Critical for cleanup when component or profile changes
    const ctrl = new AbortController()
    const { signal } = ctrl

    // 1. Fetch user;s ratings from backend
    // 2. Sort and deduplicate
    // 3. Fetch full movie details from TMDB (throrrled)
    // 4. Handle partial failures gracefully
    const loadAllRated = async () => {
      setLoadingRated(true)
      setErrRated(null)

      try {
        // 1. Get all ratings for this user 
        const ratings: UserMovieRating[] = await fetchUserRatings(profile.user_id)

        // 2. Sort by creation date (newest first)
        // Use localeCompare for string/date comparison
        // Handle null created_at by treating as empty string
        const sorted = ratings
        .slice() // create a copy to avoid mutation
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))

        // 3. Remove duplicates (keep newest rating if user rated same movie twice)
        // Map creates a temporary map with tmbd_id as key, automatically deduping
        const deduped = Array.from(new Map(sorted.map(r => [r.tmdb_id, r])).values())

        // 4. Fetch movie details w/ throttling
        // Process in chunks to avoid rate limits

        const concurrency = 6 // can only have 6 simultaneous requests
        const results: PromiseSettledResult<RatedMovie>[] = []

        // Loop through ratings in chunks
        for (let i = 0; i < deduped.length; i += concurrency) {
          // Check if user navigated away (abort signal triggered)
          if (signal.aborted) return

          // Get next chunk (up to 6 ratings) 
          const chunk = deduped.slice(i, i + concurrency)

          // Fetch movie details for this chunk
          // Promise.allSettled waits for all to finish (success or failure)
          const chunkResults = await Promise.allSettled(
            chunk.map(async (r) => {
              const m = await fetchMovieDetails(r.tmdb_id, signal)
              return { movie: m, userRating: r.rating, ratedAt: r.created_at ?? undefined }
            })
          )
          results.push(...chunkResults)
        }

        // Final abort check 
        if (signal.aborted) return

      // 5. Separate successful fetches from failures
        // extract successful results
        const ok = results
        .filter((r): r is PromiseFulfilledResult<RatedMovie> => r.status === "fulfilled")
        .map((r) => r.value)

        // Extract failures (excluding intentional aborts)
        const failures = results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map((r) => r.reason)
        .filter((e) => !isAbortError(e))

        // If we have nothing then show an error
        if (ok.length === 0 && failures.length > 0) {
          setErrRated("Failed to load rated movies.")
          return
        }

        // Update state with successfully fetched movies
        setRatedMovies(ok)
      } catch (err) {
        // Handle unexpected errors (network issues etc.)
        if (!isAbortError(err)) {
          console.error("loadAllRated error:", err)
          setErrRated("Failed to load rated movies.")
        }
      } finally {
        // turn off loading spinner
        if (!signal.aborted) setLoadingRated(false)
      }
    }

    loadAllRated()


    // Cleanup function: cancel pending requests when component unmounts
    // or when profile changes (prevents memory leaks and stale updates)
    return () => ctrl.abort()
  }, [profile]) // Re-run when profile changes


  // HELPER FUNCTIONS

  // Extracts the title
  const getTitle = (m: Movie) =>
    (m as any).title ?? (m as any).name ?? ""

  // Extracts the year
  const getYear = (m: Movie) =>
    (m as any).year ?? (m as any).release_year ?? (() => {
      const d = (m as any).release_date as string | undefined
      return d?.slice(0, 4) ?? ""
    })()

  // SORTING LOGIC
  // useMemo prevents re-sorting on every render
  // Only re-computes when ratedMovies or sortMode changes
  const sortedRated = useMemo(() => {
    // create copy to avoid mutating original array
    const arr = ratedMovies.slice()

    // Reusable comparison functions

    // Case-insensitive alphabetical order
    const compareTitle = (a: RatedMovie, b: RatedMovie) =>
      getTitle(a.movie).localeCompare(
        getTitle(b.movie), undefined,
        { sensitivity: "base" }) // case-insensitive alphabetical comparison

    // Numeric year comparison (treat missing years as -Inf)
    const compareYear = (a: RatedMovie, b: RatedMovie) => {
      const ya = Number(getYear(a.movie)) || -Infinity
      const yb = Number(getYear(b.movie)) || -Infinity
      return ya - yb
    }

    // Date string comparison 
    const compareDate = (a: RatedMovie, b: RatedMovie) =>
      (a.ratedAt ?? "").localeCompare(b.ratedAt ?? "")

    // Apply sorting based on current mode
    switch (sortMode) {
      case "newest":
        // Reverse chronological
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
  }, [ratedMovies, sortMode]) // Dependencies (re-sort when these change)

  // Show loading state when fetching data
  if (loadingProfile || loadingRated) return <p text-blue-500>Loading...</p>

  // Error if profile does not exist
  if (!profile) return <p>Profile does not exist</p>

  // Error if fetching failed
  if (errRated) return <p className="text-red-600">{errRated}</p>

  // MAIN UI
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <Typography size="h1"><span className="text-blue-500">@{profile.handle}'s</span> Movie Ratings</Typography>

        {/* Sort controls */}
        <div className="flex items-center gap-3">
          <label className="text-lg text-muted-foreground font-bold" htmlFor="sort">
            Sort
          </label>
          <select
            id="sort"
            className="rounded-md border px-2 py-1 text-md"
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

      {/* conditional rendering: empty vs movie grid */}
      {sortedRated.length === 0 ? (
        // Empty state (personalized message with call-to-action)
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-4 text-2xl font-semibold text-gray-700">
            {isCurrentUser 
              ? "You haven't rated any movies yet." 
              : "No rated movies yet."}
          </p>
          {isCurrentUser && (
            <a 
              href="/movies" 
              className="rounded-md bg-blue-500 px-6 py-3 text-lg font-medium text-white transition hover:bg-blue-600"
            >
              Browse Movies
            </a>
          )}
        </div>
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

