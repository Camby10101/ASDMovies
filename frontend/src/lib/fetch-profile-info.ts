import type { Profile } from "@/types/profile";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function fetchProfile(id: string): Promise<Profile> {
	const res = await fetch(`${API_BASE}/api/profile/${id}`);

	if (!res.ok) throw new Error("Failed to fetch user");

	return (await res.json()) as Profile;
}
