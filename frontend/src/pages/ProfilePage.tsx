
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/info-box";
import { InfoLine } from "@/components/ui/info-line";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import MovieList from "@/components/ui/movieList";
import SmallMovieCard from "@/components/ui/smallMovieCard";

import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";

import { updateProfile } from "@/lib/profile-service";
import { fetchFavouriteMovies } from "@/lib/favourite-movies-service";
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper";
import { fetchUserRatings } from "@/lib/rating-service";
import type { UserMovieRating } from "@/types/user-movie-ratings";

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>(); 
  const { user, loadingUser, refreshUser } = useUser();
  const { profile, loadingProfile } = useProfile(id!); // profile being viewed
  // True if logged-in user is viewing their own profile
  const isCurrentUser =
    !loadingUser && !loadingProfile && profile?.user_id === user?.user_id;

  // Profile
  const [bio, setBio] = useState("");
  const [display_name, setDisplayName] = useState("");

  // Will store recently rated moviesx
  const [ratedMovies, setRatedMovies] = useState<
  Array<{ movie: Movie; userRating: number }>
>([]);

  // Loading state for the movie fetch operation
  const [loadingRated, setLoadingRated] = useState(false);
  // Error state for rated movies
  const [errRated, setErrRated] = useState<string | null>(null);

  // Favourites
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [noFavourites, setNoFavourites] = useState(false);

  const [initialBio, setInitialBio] = useState("");
  const [initialDisplayName, setInitialDisplayName] = useState("");

  const [saving, setSaving] = useState(false);

  const hasChanges = bio !== initialBio || display_name !== initialDisplayName;

  // Load "Recently Rated Movies" (top 10)
  // Fetches user's 10 most recent movies whenever profile changes
  useEffect(() => {
    const loadRatedMovies = async () => {
      // Don't bother if the profile data isn't available
      if (!profile) return;

      setLoadingRated(true); // begin loading
      setErrRated(null); // no error yet

      try {
        // Fetches ALL ratings for the user
        const ratings: UserMovieRating[] = await fetchUserRatings(profile.user_id);
      
        // Sort ratings by creation date
        const sorted = ratings
        .slice() // slice (means we work on a new array)
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")); // compares two strings lexagraphically

        // We take only the 10 most recent movies
        const firstTen = sorted.slice(0, 10);

        // For each rating, fetch the full movie details from TMDB 
        // Return an array of objects containing both movie data and user ratings
        const moviesWithRatings = await Promise.all(
          firstTen.map(async (r) => {
            const m = await fetchMovieDetails(r.tmdb_id);
            return { movie: m, userRating: r.rating };
          })
        );
        setRatedMovies(moviesWithRatings);
      } catch (err) {
        console.log(err);
        setErrRated("Error");
      } finally {
        // Finished loading
        setLoadingRated(false);
      }
    };
    loadRatedMovies();
  }, [profile]); // Re-run whenever the profile changes

  // Load favourites + set profile fields
  useEffect(() => {
    if (!profile) return;

    setBio(profile.bio);
    setDisplayName(profile.display_name);

    setInitialBio(profile.bio);
    setInitialDisplayName(profile.display_name);

    

    const ctrl = new AbortController();
    const { signal } = ctrl;

    const loadMovies = async () => {
      setLoadingMovies(true);

      try {
        const movie_ids = await fetchFavouriteMovies(profile.user_id);

        if (movie_ids.length === 1 && movie_ids[0] === -1) {
          setNoFavourites(true);
          setMovies([]);
          return;
        }

        const data = await Promise.all(
          movie_ids.map((mid) => fetchMovieDetails(mid, signal))
        );
        setMovies(data);
      } catch (err) {
        console.log("Error loading movies:", err);
      } finally {
        if (!signal.aborted) setLoadingMovies(false);
      }
    };

    loadMovies();
    return () => ctrl.abort();
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ bio, display_name }); // Updates the database
      setInitialBio(bio);
      setInitialDisplayName(display_name);
      await refreshUser();
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile || loadingMovies) return <Spinner />;
  if (!profile) return <p>Profile does not exist</p>;

  return (
    <div className="flex flex-col p-6 space-y-4 h-[90%]">
      <div className="flex items-center gap-2">
        <InfoLine
          text={display_name}
          onChange={setDisplayName}
          isEditable={isCurrentUser}
          maxLength={20}
        />
        <Typography size="h1" color="gray">
          {"@" + profile.handle}
        </Typography>
      </div>

      <div className="flex flex-1 gap-2">
        {/* Left column */}
        <div className="w-[50%] flex flex-col gap-2">
          {/* Bio */}
          <InfoBox
            header={"Bio"}
            text={bio}
            onChange={setBio}
            isEditable={isCurrentUser}
            maxLength={230}
          />

          {/* Newest Ratings */} 
          <Card className="flex flex-col flex-1">
            <CardHeader className="flex items-center justify-between">
              <Typography size="h2">Recently Rated</Typography>
              {/* link to the full list of a users rated movies */}
              <Link
                to={`/userFavouriteMovies/${profile.user_id}`}
                className="inline-block rounded-xl bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-700 hover:shadow-lg transition-all duration-200"
              >
                See All →
              </Link>
            </CardHeader>
            {/* Show loading message while fetching movies */}
            <CardContent>
              {loadingRated && <p>Loading…</p>}
              {/* Display error if failed */}
              {errRated && <p className="text-red-600">Error: {errRated}</p>}

              {/* Displaying movies in a horizontal scrollable container */}
              {!loadingRated && !errRated && ratedMovies.length > 0 ? (
                <div className="flex flex-1 overflow-x-auto gap-3">
                  { /* Map through each rated movie and display as a small card */}
                  {ratedMovies.map(({ movie, userRating }) => (
                    <div key={movie.id} className={"flex-shrink-0 w-[22.5%]"}>
                      {/* Subset of a movie card just displaying minimal information */}
                      <SmallMovieCard
                        id={movie.id}
                        title={movie.title}
                        year={movie.year}
                        poster={movie.poster}
                        genre={movie.genre}
                        rating={userRating} // the users rating
                      />
                    </div>
                  ))}
                </div>
              ) : (
                  // Show a message if the user hasn't rated any movies yet
                  !loadingRated &&
                    !errRated && (
                      <p className="text-muted-foreground">No rated movies yet!</p>
                    )
                )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="w-[50%] flex flex-col">
          <Card className="flex flex-col flex-1">
            <CardHeader className="flex items-center justify-between">
              <Typography size="h2">Favourites</Typography>
              {isCurrentUser && (
              <Link to={`/Rankings/${profile.user_id}`}
                className="inline-block rounded-xl bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-700 hover:shadow-lg transition-all duration-200"
              >
                Edit Rankings →
              </Link>
              )}
            </CardHeader>
            <CardContent>
              {!noFavourites ? (
                <div className="h-[65vh] flex-1 overflow-y-auto">
                  <MovieList movies={movies} editMode={isCurrentUser} />
                </div>
              ) : (
                  <Typography>No favourites yet!</Typography>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isCurrentUser && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

