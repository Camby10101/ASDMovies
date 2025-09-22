import { supabase } from "@/lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function fetchSession() {
	const { data: { session } } = await supabase.auth.getSession();

	if (!session) {
		console.log("No active session");
		return null;
	}

	const response = await fetch(`${API_BASE}/api/profile`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${session.access_token}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) throw new Error("Failed to fetch user");

	return response.json() as Promise<{ user_id: string }>;
}
