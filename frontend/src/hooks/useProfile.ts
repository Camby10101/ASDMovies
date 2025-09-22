import { useState, useEffect } from "react";
import type { Profile } from "@/types/profile";
import { fetchProfile } from "@/lib/fetch-profile-info";

export const useProfile = (id: string) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                const data = await fetchProfile(id);
                setProfile(data);
            } catch (err) {
                console.error(err);
			    setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [id]);

  return { profile, profileLoading };
};
