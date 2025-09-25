import { useState, useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/info-box";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent} from "@/components/ui/card";
import MovieList from "@/components/ui/movieList";
import { type FavouriteMovies } from "@/types/favourite-movies";

import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";
import { useParams } from "react-router-dom";

import { updateProfile } from "@/lib/profile-service";
import { fetchFavouriteMovies } from "@/lib/favourite-movies-service";
// import { fetchMovieDetails } from "@/lib/tmdb-api-helper";


const ProfilePage = () => {
    const { id } = useParams<{ id: string }>(); // The page ID
    const { user, refreshUser } = useUser(); // The user (logged in)
    const { profile, loadingProfile } = useProfile(id!); // The profile being viewed
    

    const isCurrentUser = profile?.user_id === user?.user_id;
    // const isCurrentUser = false; // testing

    const [bio, setBio] = useState("");
    const [movie_ids, setMovie_ids] = useState<FavouriteMovies>([]);
    const [loadingMovies, setLoadingMovies] = useState(true);

    useEffect(() => { 
        if (profile) {
            // Pull and update profile
            setBio(profile.bio);
            // Fetch favourite movies
            try {
                fetchFavouriteMovies(profile.user_id)
                .then(setMovie_ids)
                .finally(() => setLoadingMovies(false))
            } catch (err) {
                console.error(err);
            }
        }
    }, [profile]);

    const handleSave = async () => {
        try {
            await updateProfile({ bio }); // Updates the database
            await refreshUser();
        } catch (err) {
            console.error(err);
        }
    }

    if (loadingProfile || loadingMovies) return <p>Loading...</p>
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
                    <MovieList movie_ids={movie_ids}/>
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