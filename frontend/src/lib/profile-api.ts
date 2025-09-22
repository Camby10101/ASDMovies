import type { Profile } from "@/types/profile";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// --------
// GET
// --------
export async function fetchProfile(id: string): Promise<Profile> {
	const res = await fetch(`${API_BASE}/api/profile/${id}`);

	if (!res.ok) throw new Error("Failed to fetch user");

	return (await res.json()) as Profile;
}

// --------
// POST
// --------
export async function updateBio(userId: string, bio: string) {
	const res = await fetch(`/api/profile/${userId}/bio`, {
		method: "POST", // or PATCH
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ bio }),
	});

	if (!res.ok) throw new Error("Failed to update bio");

	return await res.json();
}