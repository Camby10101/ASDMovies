import { useEffect, useState } from "react"
import MovieCard from "@/components/ui/movieCard"
import { fetchTrending, type Movie } from "@/lib/tmdb-api-helper"
import { Button } from "@/components/ui/button"

export default function TrendingMoviesPage() {
  const [period, setPeriod] = useState<"day" | "week">("day")
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true); setErr(null)
    fetchTrending(period, ctrl.signal)
      .then(setMovies)
      .catch((e) => { if (e.name !== "AbortError") setErr(e.message ?? "Failed to load") })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [period])

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trending Movies</h1>
        <div className="flex gap-2">
          <Button
            variant={period === "day" ? "default" : "secondary"}
            onClick={() => setPeriod("day")}
          >
            Today
          </Button>
          <Button
            variant={period === "week" ? "default" : "secondary"}
            onClick={() => setPeriod("week")}
          >
            This Week
          </Button>
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {!loading && !err && movies.length > 0 ? (
          movies.map((m) => (
            <MovieCard
              key={m.id}
              id={m.id} 
              title={m.title}
              year={m.year}
              poster={m.poster}
              genre={m.genre}
              rating={m.rating}
              description={m.description}
            />
          ))
        ) : (
            !loading && !err && <p className="text-muted-foreground">No movies found.</p>
          )}
      </div>
    </div>
  )
}
