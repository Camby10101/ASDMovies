import { useState, useEffect, useCallback, type ReactNode } from "react";
import { UserContext } from "@/contexts/userContext";
import type { Profile } from "@/types/profile";
import { supabase } from "@/lib/supabase";
import { fetchUser } from "@/lib/profile-service";


interface Props {
  	children: ReactNode;
}

export const UserProvider = ({ children }: Props) => {
	const [user, setUser] = useState<Profile | null>(null);
	const [loadingUser, setUserLoading] = useState(true);
	

	const refreshUser = useCallback(async () => {
		setUserLoading(true);

		try {
			const data = await fetchUser();
			setUser(data);
		} catch (err) {
			console.error(err);
			setUser(null);
		} finally {
			setUserLoading(false);
		}
	}, []);

	useEffect(() => {
		let mounted = true;

		const init = async () => {
			const { data: { session } } = await supabase.auth.getSession();
			if (!mounted) return;
			if (session) refreshUser();
			else setUser(null);
		};

		init();

		const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
			if (!mounted) return;
			if (session) refreshUser();
			else setUser(null);
		});

		return () => {
			mounted = false;
			listener.subscription.unsubscribe();
		};
	}, [refreshUser]);

	return (
		<UserContext value={{ user, loadingUser, refreshUser }}>
		{children}
		</UserContext>
	);
};