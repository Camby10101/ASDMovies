
// src/lib/rating-service.ts
import type { UserMovieRating } from "@/types/user-movie-ratings"
export type { UserMovieRating }

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000"

// --------
// GET
// --------

// fetch all ratings for a user
export async function fetchUserRatings(user_id: string): Promise<UserMovieRating[]> {
  const res = await fetch(`${API_BASE}/api/ratings/${user_id}`, { method: "GET" })

  if (!res.ok) throw new Error("Failed to fetch user ratings")

  const json = await res.json()
  return json.ratings as UserMovieRating[]
}


// fetch a user’s rating for a single movie
export async function getMyRating(user_id: string, tmdb_id: number): Promise<number | null> {
  const res = await fetch(`${API_BASE}/api/ratings/${user_id}/${tmdb_id}`, { method: "GET" })

  if (!res.ok) throw new Error("Failed to fetch rating for this movie")

  const json = await res.json()
  return json.rating ?? null
}

// --------
// POST (upsert)
// --------

export async function upsertMyRating(user_id: string, tmdb_id: number, rating: number) {
  const res = await fetch(`${API_BASE}/api/ratings/${user_id}/${tmdb_id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating }),
  })

  if (!res.ok) throw new Error("Failed to upsert rating")

  return await res.json()
}

// --------
// DELETE
// --------

export async function deleteMyRating(user_id: string, tmdb_id: number) {
  const res = await fetch(`${API_BASE}/api/ratings/${user_id}/${tmdb_id}`, { method: "DELETE" })

  if (!res.ok) throw new Error("Failed to delete rating")

  return await res.json()
}

