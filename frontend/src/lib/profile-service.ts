import type { Profile } from "@/types/profile";
import { supabase } from "@/lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const { data: { session } } = await supabase.auth.getSession();

// --------
// GET
// --------

export async function fetchUser(): Promise<Profile> {
	if (!session) {
		throw new Error("No active session. User must be logged in.");
	}

	const res = await fetch(`${API_BASE}/api/profile`, {
		method: "GET",
		headers: {
		"Authorization": `Bearer ${session.access_token}`,
		"Content-Type": "application/json",
		},
	});

	if (!res.ok) throw new Error("Failed to fetch profile");

	return await res.json();
}


export async function fetchProfile(user_id: string): Promise<Profile> {
	const res = await fetch(`${API_BASE}/api/profile/${user_id}`, {
		method: "GET"
	});

	if (!res.ok) throw new Error("Failed to fetch user");

	return (await res.json()) as Profile;
}

// --------
// PATCH
// --------

export async function updateProfile(updates: { bio?: string, display_name?: string }) {
	if (!session) {
		throw new Error("No active session. User must be logged in.");
	}

	const res = await fetch(`${API_BASE}/api/profile/`, {
		method: "PATCH",
		headers: { 
			"Authorization": `Bearer ${session.access_token}`,
			"Content-Type": "application/json" 
		},
		body: JSON.stringify(updates),
		
	});

	if (!res.ok) throw new Error(`Failed to update profile. Updates: ${JSON.stringify(updates)}`);

	return await res.json();
}