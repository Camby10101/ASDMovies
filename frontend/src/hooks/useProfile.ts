import { useState, useEffect } from "react";
import type { Profile } from "@/types/profile";
import { fetchProfile } from "@/lib/profile-service";

export const useProfile = (user_id: string) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loadingProfile, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                const data = await fetchProfile(user_id);
                setProfile(data);
            } catch (err) {
                console.error(err);
			    setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user_id]);

    return { profile, loadingProfile };
};
