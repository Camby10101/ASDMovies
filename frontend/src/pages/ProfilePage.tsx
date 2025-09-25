import { useState, useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/info-box";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent} from "@/components/ui/card";
import MovieList from "@/components/ui/movieList";
// import { type FavouriteMovies } from "@/types/favourite-movies";

import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";
import { useParams } from "react-router-dom";

import { updateProfile } from "@/lib/profile-service";
import { fetchFavouriteMovies } from "@/lib/favourite-movies-service";
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper";


const ProfilePage = () => {
    const { id } = useParams<{ id: string }>(); // The page ID
    const { user, refreshUser } = useUser(); // The user (logged in)
    const { profile, loadingProfile } = useProfile(id!); // The profile being viewed
    

    const isCurrentUser = profile?.user_id === user?.user_id;
    // const isCurrentUser = false; // testing

    const [bio, setBio] = useState("");
    const [movies, setMovies] = useState<Movie[]>([])
    const [loadingMovies, setLoadingMovies] = useState(true)
    const [noFavourites, setNoFavourites] = useState(false)

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
            <hr></hr>
            <Card>
                <CardHeader>
                    <Typography size="h2">Bio</Typography>
                </CardHeader>
                <CardContent>
                    <InfoBox text={bio} onChange={setBio} isEditable={isCurrentUser} maxLength={500}></InfoBox>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Typography size="h2">Favourite movies</Typography>
                </CardHeader>
                <CardContent>
                    {!noFavourites ? (
                        <MovieList movies={movies} />
                    ) : (
                        <Typography>No movies yet!</Typography>
                    )}       
                </CardContent>
            </Card>

            {isCurrentUser && (
                <>
                <hr></hr>
                <Button onClick={handleSave}> Save changes </Button>
                </>
            )}
        </div>
    );
}

export default ProfilePage;