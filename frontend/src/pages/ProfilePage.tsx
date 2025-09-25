import { useState, useEffect } from "react"
import { Typography } from "@/components/ui/typography"
import { InfoBox } from "@/components/ui/info-box"
import { Button } from "@/components/ui/button"
import { useUser } from "@/hooks/useUser"
import { useProfile } from "@/hooks/useProfile"
import { useParams } from "react-router-dom"

import { updateProfile } from "@/lib/profile-service"
import { fetchUserRatings } from "@/lib/rating-service"
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper"
import SmallMovieCard from "@/components/ui/smallMovieCard"
import type { UserMovieRating } from "@/types/user-movie-ratings"

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const { user, loadingUser, refreshUser } = useUser()
  const { profile, loadingProfile } = useProfile(id!)

  const isCurrentUser =
    !loadingUser && !loadingProfile && profile?.user_id === user?.user_id

  const [bio, setBio] = useState("")
  const [loadingRated, setLoadingRated] = useState(false)
  const [errRated, setErrRated] = useState<string | null>(null)

  const [ratedMovies, setRatedMovies] = useState<Array<{ movie: Movie; userRating: number }>>([])

  // Load "recently rated"
  useEffect(() => {
    const loadRatedMovies = async () => {
      if (!profile) return
      setLoadingRated(true)
      setErrRated(null)
      try {
        const ratings = await fetchUserRatings(profile.user_id) // [{ tmdb_id, rating, created_at }]
        // Sort newest first; fallback to empty string when created_at missing
        const sorted = ratings.slice().sort((a: UserMovieRating, b: UserMovieRating) =>
          (b.created_at ?? "").localeCompare(a.created_at ?? "")
        )

        // Take top 10 and fetch each movie’s details
        const firstTen = sorted.slice(0, 10)
        const movies = await Promise.all(
          firstTen.map(async (r) => {
            const m = await fetchMovieDetails(r.tmdb_id)
            return { movie: m, userRating: r.rating }
          })
        )

        setRatedMovies(movies)
      } catch (e: any) {
        setErrRated(e.message ?? "Failed to load ratings")
      } finally {
        setLoadingRated(false)
      }
    }
    loadRatedMovies()
  }, [profile])

  useEffect(() => {
    if (profile) setBio(profile.bio)
  }, [profile])

  const handleSave = async () => {
    try {
      await updateProfile({ bio })
      await refreshUser()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      {!loadingUser && !loadingProfile ? (
        profile ? (
          <>
            <Typography size="h1">{"@" + profile.handle}</Typography>
            <hr></hr>
            <section className="rounded-2xl border p-4 space-y-4">
              <Typography size="h2">Bio</Typography>
              <InfoBox text={bio} onChange={setBio} isEditable={isCurrentUser} maxLength={500}></InfoBox>
            </section>

            <section className="rounded-2xl border p-4 space-y-4">
              <Typography size="h2">Favourite Movies</Typography>
            </section>

            <section className="rounded-2xl border p-4 space-y-4">
              <Typography size="h2">Recently Rated Movies</Typography>
              {loadingRated && <p>Loading…</p>}
              {errRated && <p className="text-red-600">Error: {errRated}</p>}
              {!loadingRated && !errRated && ratedMovies.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {ratedMovies.map(({ movie, userRating }) => (
                    <SmallMovieCard
                      key={movie.id}
                      id={movie.id}
                      title={movie.title}
                      year={movie.year}
                      poster={movie.poster}
                      genre={movie.genre}
                      rating={userRating}   
                    />
                  ))}
                </div>
              ) : (
                  !loadingRated && !errRated && (
                    <p className="text-muted-foreground">No rated movies yet.</p>
                  )
                )}
            </section>
            {isCurrentUser && (
              <>
                <hr></hr>
                <Button
                  onClick={handleSave}
                >
                  Save changes
                </Button>
              </>
            )}
          </>
        ) : (
            <p>Error: profile does not exist</p>
          )
      ) : (
          <p>Loading...</p>
        )}
    </div>
  );
}

export default ProfilePage;
