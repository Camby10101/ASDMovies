export type Movie = {
  id: number;
  title: string;
  year: string;
  poster: string;
  genre: string;
  rating: string;
  description: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";


export async function fetchMovies(q: string, signal?: AbortSignal): Promise<Movie[]> {
  const url = new URL(`${API_BASE}/search/movies`);
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchTrending(
  period: "day" | "week" = "day",
  signal?: AbortSignal
): Promise<Movie[]> {
  const url = new URL(`${API_BASE}/trending`);
  url.searchParams.set("period", period);
  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchMovieDetails(id: number, signal?: AbortSignal): Promise<Movie> {
  const res = await fetch(`${API_BASE}/movies/${id}`, { signal });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
