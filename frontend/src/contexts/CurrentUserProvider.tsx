import { useState, useEffect, type ReactNode } from "react";
import { CurrentUserContext } from "./CurrentUserContext";
import type { User as SupabaseUser } from "@supabase/auth-js";
import { supabase } from "@/lib/supabase";

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
	const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const { data: { user: supUser }, error } = await supabase.auth.getUser();
				if (error) throw error;
				setCurrentUser(supUser ?? null);
			} catch (err) {
				console.error(err);
				setCurrentUser(null);
			} finally {
				setLoading(false);
			}
		};

		fetchCurrentUser();
	}, []);

	return (
		<CurrentUserContext.Provider value={{ currentUser, setCurrentUser, loading }}>
			{children}
		</CurrentUserContext.Provider>
	);
};
