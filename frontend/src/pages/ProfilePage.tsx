import { useState, useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/info-box";
import { Button } from "@/components/ui/button";

import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";
import { useParams } from "react-router-dom";

import { updateProfile } from "@/lib/profile-service";
<<<<<<< HEAD
// import { fetchMovieDetails } from "@/lib/tmdb-api-helper";
=======
>>>>>>> 18cf335 (Reconfigured how user profile is updated using auth)


const ProfilePage = () => {
    const { id } = useParams<{ id: string }>(); // The page ID
    const { user, loadingUser, refreshUser } = useUser(); // The user (logged in)
    const { profile, loadingProfile } = useProfile(id!); // The profile being viewed

    const isCurrentUser = !loadingUser && !loadingProfile && profile?.user_id === user?.user_id;
    // const isCurrentUser = false; // testing

    const [bio, setBio] = useState("");

    useEffect(() => {
        if (profile) {
            setBio(profile.bio);
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
                        <Typography size="h2">Favourite movies</Typography>
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