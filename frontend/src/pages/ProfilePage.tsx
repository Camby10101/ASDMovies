import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // <-- missing
import { Typography } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/info-box";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent} from "@/components/ui/card";
import MovieList from "@/components/ui/movieList";
import SmallMovieCard from "@/components/ui/smallMovieCard"

import { useUser } from "@/hooks/useUser"
import { useProfile } from "@/hooks/useProfile"

import { updateProfile } from "@/lib/profile-service";
import { fetchFavouriteMovies } from "@/lib/favourite-movies-service";
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper";
import { fetchUserRatings } from "@/lib/rating-service"
import type { UserMovieRating } from "@/types/user-movie-ratings"

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>()                       // profile page id (handle or user_id depending on your hook)
  const { user, loadingUser, refreshUser } = useUser()
  const { profile, loadingProfile } = useProfile(id!)               // profile being viewed

  // is this the logged-in user's own profile?
  const isCurrentUser =
    !loadingUser && !loadingProfile && profile?.user_id === user?.user_id

  // Bio
  const [bio, setBio] = useState("")


  // Recently rated
    const [ratedMovies, setRatedMovies] = useState<
        Array<{ movie: Movie; userRating: number }>
    >([])
    const [loadingRated, setLoadingRated] = useState(false)
    const [errRated, setErrRated] = useState<string | null>(null)

    const [movies, setMovies] = useState<Movie[]>([])
    const [loadingMovies, setLoadingMovies] = useState(true)
    const [noFavourites, setNoFavourites] = useState(false)

  // Load "Recently Rated Movies"
  useEffect(() => {
    const loadRatedMovies = async () => {
      if (!profile) return
      setLoadingRated(true)
      setErrRated(null)
      try {
        const ratings: UserMovieRating[] = await fetchUserRatings(profile.user_id) 
        // Sort newest first; fallback to empty string if created_at missing
        const sorted = ratings
          .slice()
          .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))

        // Take top 10 and fetch each movie’s details
        const firstTen = sorted.slice(0, 10)
        const moviesWithRatings = await Promise.all(
          firstTen.map(async (r) => {
            const m = await fetchMovieDetails(r.tmdb_id)
            return { movie: m, userRating: r.rating }
          })
        )
        setRatedMovies(moviesWithRatings)
      } catch (e: any) {
        console.error("Failed to load user ratings:", e)
        setErrRated(e?.message ?? "Failed to load ratings")
      } finally {
        setLoadingRated(false)
      }
    }
    loadRatedMovies()
  }, [profile])



    useEffect(() => {
        if (!profile) return

        setBio(profile.bio);
        
        const ctrl = new AbortController()

        const loadMovies = async () => {
            setLoadingMovies(true)

            try {
                const movie_ids = await fetchFavouriteMovies(profile.user_id)

                if (movie_ids.length === 1 && movie_ids[0] === -1) {
                    setNoFavourites(true)
                    return
                }

                const data = await Promise.all(
                    movie_ids.map((id) => fetchMovieDetails(id, ctrl.signal))
                )
                setMovies(data)
                
            } catch (err) {
                console.log("Error loading movies:", err)
            } finally {
                setLoadingMovies(false)
            }
        }

        loadMovies()

        return () => ctrl.abort()
    }, [profile])

    const handleSave = async () => {
        try {
            await updateProfile({ bio }); // Updates the database
            await refreshUser();
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    }

    if (loadingProfile || (loadingMovies) ) return <p>Loading...</p>
    if (!profile) return <p>Profile does not exist</p>

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <Typography size="h1">{"@" + profile.handle}</Typography>
      <hr />

      {/* Bio */}
      <Card>
        <CardHeader>
          <Typography size="h2">Bio</Typography>
        </CardHeader>
        <CardContent>
          <InfoBox
            text={bio}
            onChange={setBio}
            isEditable={isCurrentUser}
            maxLength={500}
          />
        </CardContent>
      </Card>

      {/* Favourite Movies */}
      <Card>
        <CardHeader>
          <Typography size="h2">Favourite Movies</Typography>
        </CardHeader>
        <CardContent>
            {!noFavourites ? (
                <MovieList movies={movies} />
            ) : (
                <Typography>No movies yet!</Typography>
            )}       
        </CardContent>
      </Card>

      {/* Recently Rated Movies */}
      <Card>
        <CardHeader>
          <Typography size="h2">Recently Rated Movies</Typography>
        </CardHeader>
        
        <CardContent>
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
                  rating={userRating} // show the user's rating (read-only)
                />
              ))}
            </div>
          ) : (
            !loadingRated &&
            !errRated && <p className="text-muted-foreground">No rated movies yet.</p>
          )}
        </CardContent>
      </Card>

      {isCurrentUser && (
        <>
          <hr />
          <Button onClick={handleSave}>Save changes</Button>
        </>
      )}
    </div>
  )
}

export default ProfilePage
