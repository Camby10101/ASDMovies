import type { FavouriteMovies } from "@/types/favourite-movies";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// --------
// GET
// --------
export async function fetchFavouriteMovies(user_id: string): Promise<FavouriteMovies> {
    const res = await fetch(`${API_BASE}/api/favourite_movies/${user_id}`, {
        method: "GET"
    });

    if (!res.ok) throw new Error("Failed to fetch favourite movies list");

    return (await res.json()) as FavouriteMovies;
}

export async function isMovieFavourite(user_id: string, movie_id: number): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/favourite_movies/${user_id}/${movie_id}`, {
        method: "GET"
    });

    if (!res.ok) throw new Error("Failed to check if movie is favourited");

    return (await res.json());
}

// --------
// POST
// --------
export async function addFavouriteMovie(user_id: string, movie_id: number) {
    const res = await fetch(`${API_BASE}/api/favourite_movies/${user_id}/${movie_id}`, {
        method: "POST"
        
    });

    if (!res.ok) throw new Error("Failed to add movie to favourites");

    return await res.json();
}


// --------
// DELETE
// --------
export async function removeFavouriteMovie(user_id: string, movie_id: number) {
    const res = await fetch(`${API_BASE}/api/favourite_movies/${user_id}/${movie_id}`, {
        method: "DELETE"
    });

    if (!res.ok) throw new Error("Failed to remove movie from favourites");

    return await res.json();
}