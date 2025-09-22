import { useState, useEffect, type ReactNode } from "react";
import { UserContext } from "@/contexts/userContext";
import type { Profile } from "@/types/profile";
import { supabase } from "@/lib/supabase";


interface Props {
  	children: ReactNode;
}

export const UserProvider = ({ children }: Props) => {
	const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
	const [user, setUser] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	

	const refreshUser = async () => {
		const { data: { session } } = await supabase.auth.getSession();

		if (!session) {
			console.log("No active session");
			setUser(null);
			return;
		}

		setLoading(true);
		
		try {
			const res = await fetch(`${API_BASE}/api/profile`, {
				method: "GET",
				headers: {
				"Authorization": `Bearer ${session.access_token}`,
				"Content-Type": "application/json",
				},
			});
		if (!res.ok) throw new Error("Failed to fetch user");
			const data = await res.json();
			setUser(data);
		} catch (err) {
			console.error(err);
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refreshUser();
	}, []);

	return (
		<UserContext value={{ user, loading, refreshUser }}>
		{children}
		</UserContext>
	);
};
