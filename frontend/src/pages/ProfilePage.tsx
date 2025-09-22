import { useState, useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/info-box";
import { Button } from "@/components/ui/button";

import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";
import { useParams } from "react-router-dom";

import { updateBio } from "@/lib/profile-api";

const ProfilePage = () => {
    const { id } = useParams<{ id: string }>(); // The page ID
    const { user, userLoading } = useUser(); // The user (logged in)
    const { profile, profileLoading } = useProfile(id!); // The profile (of user)

    const isCurrentUser = !userLoading && !profileLoading && profile?.user_id === user?.user_id;
    // const isCurrentUser = false; // testing

    const [bio, setBio] = useState("");

    useEffect(() => {
        if (profile) {
            setBio(profile.bio);
        }
    }, [profile]);

    return (
        <div className="mx-auto max-w-3xl p-6 space-y-8">
            {!userLoading && !profileLoading ? (
                profile ? (
                    <>
                    <Typography size="h1">{profile.email}</Typography>
                    <hr></hr>
                    <section className="rounded-2xl border p-4 space-y-4">
                        <Typography size="h2">Bio</Typography>
                        <InfoBox text={bio} onChange={setBio} isEditable={isCurrentUser} maxLength={500}></InfoBox>
                    </section>
                    {isCurrentUser && (
                    <>
                    <hr></hr>
                    <Button
                        onClick={async () => {
                            await updateBio(profile.user_id, bio);
                        }}
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