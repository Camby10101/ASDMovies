export type Movie = {
  id: number;
  title: string;
  year: string;
  poster: string;
  genre: string;
  rating: string;
  description: string;
};

export type PaginatedMoviesResponse = {
  movies: Movie[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

// const API_BASE = import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = "https://movielily.azurewebsites.net";

export async function fetchMovies(
  q: string,
  page: number = 1,
  signal?: AbortSignal
): Promise<PaginatedMoviesResponse> {
  const url = new URL(`${API_BASE}/search/movies`);
  if (q) url.searchParams.set("q", q);
  url.searchParams.set("page", page.toString());
  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchTrending(
  period: "day" | "week" = "day",
  page: number = 1,
  signal?: AbortSignal
): Promise<PaginatedMoviesResponse> {
  const url = new URL(`${API_BASE}/trending`);
  url.searchParams.set("period", period);
  url.searchParams.set("page", page.toString());
  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchMovieDetails(
  id: number,
  signal?: AbortSignal
): Promise<Movie> {
  const res = await fetch(`${API_BASE}/movies/${id}`, { signal });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
