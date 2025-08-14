const API_BASE = ""; // empty means same-origin. Vite proxy handles dev.

async function api(path, params) {
  const url = new URL(path, window.location.origin);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export const getHealth = () => api("/api/health");
export const getTrending = (win = "day") => api("/api/tmdb/trending", { window: win });
export const searchMovies = (q, page = 1) =>
  api("/api/tmdb/search", { query: q, page });
export const getMovie = (id) => api(`/api/tmdb/movie/${id}`);