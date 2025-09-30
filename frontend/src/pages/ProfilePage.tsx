import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Typography } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/info-box";
import { InfoLine} from "@/components/ui/info-line";
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
// import { isUint8ClampedArray } from "util/types";

const ProfilePage = () => {
    const { id } = useParams<{ id: string }>()                       // profile page id (handle or user_id depending on your hook)
    const { user, loadingUser, refreshUser } = useUser()
    const { profile, loadingProfile } = useProfile(id!)               // profile being viewed

    
    const isCurrentUser = // True if logged in user is viewing their own profile
      !loadingUser && !loadingProfile && profile?.user_id === user?.user_id

    // Profile
    const [bio, setBio] = useState("")
    const [display_name, setDisplayName] = useState("")

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
          const firstTen = sorted.slice(0, 5)
          const moviesWithRatings = await Promise.all(
            firstTen.map(async (r) => {
              const m = await fetchMovieDetails(r.tmdb_id)
              return { movie: m, userRating: r.rating }
            })
          )
          setRatedMovies(moviesWithRatings)
        } catch (err) {
          console.log(err)
        } finally {
          setLoadingRated(false)
        }
      }
      loadRatedMovies()
    }, [profile])

    useEffect(() => {
        if (!profile) return

        setBio(profile.bio);
        setDisplayName(profile.display_name);
        
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
            await updateProfile({ bio, display_name }); // Updates the databases
            await refreshUser();
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    }

    if (loadingProfile || (loadingMovies) ) return <p>Loading...</p>
    if (!profile) return <p>Profile does not exist</p>

return (
  <div className="flex flex-col p-6 space-y-4">
    <div className="flex items-center gap-2">
      <InfoLine
          text={display_name}
          onChange={setDisplayName}
          isEditable={isCurrentUser}  
          maxLength={20}
        />
      <Typography size="h1" color="gray">{"@" + profile.handle}</Typography>
    </div>

    <hr/>

    <div className="flex flex-1 gap-2">
      {/* Left column */}
      <div className="w-[40%] flex flex-col gap-2">
        {/* Bio */}
        <InfoBox
          header={"Bio"}
          text={bio}
          onChange={setBio}
          isEditable={isCurrentUser}
          maxLength={250}
        />
        {/* Newest Ratings */}
        <Card>
          <CardHeader>
            <Typography size="h2">Newest Ratings</Typography>
          </CardHeader>
            <CardContent>
              {loadingRated && <p>Loading…</p>}
              {errRated && <p className="text-red-600">Error: {errRated}</p>}
              {!loadingRated && !errRated && ratedMovies.length > 0 ? (
                <div className="flex overflow-x-auto gap-3 pb-2">
                  {ratedMovies.map(({ movie, userRating }) => (
                    <div
                      key={movie.id}
                      className={"flex-shrink-0 w-[23.5%]"}
                    >
                      <SmallMovieCard
                        id={movie.id}
                        title={movie.title}
                        year={movie.year}
                        poster={movie.poster}
                        genre={movie.genre}
                        rating={userRating}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                !loadingRated &&
                !errRated && <p className="text-muted-foreground">No rated movies yet.</p>
              )}
            </CardContent>

        </Card>
      </div>
      
      {/* Right column */}
      <div className="w-[60%] flex flex-col">
        <Card className="flex flex-col flex-1">
          <CardHeader>
            <Typography size="h2">Favourites</Typography>
          </CardHeader>
          <CardContent>
            {!noFavourites ? (
                <div className="h-[60vh] flex-1 overflow-y-auto">
                  <MovieList movies={movies} />
                </div>
            ) : (
              <Typography>No favourites yet!</Typography>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    {isCurrentUser && (         
      <div className="flex justify-end -mt-1">
          <Button onClick={handleSave}>Save changes</Button>
      </div>
    )}
  </div>
)}

export default ProfilePage
