import { useEffect, useState } from "react"
import { Typography } from "@/components/ui/typography"
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper"

interface MovieListProps {
  movie_ids: number[]
}

export default function MovieList({ movie_ids }: MovieListProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!movie_ids || movie_ids.length === 0) return

    const ctrl = new AbortController()
    setLoading(true)
    setErr(null)

    Promise.all(
      movie_ids.map((id) => fetchMovieDetails(id, ctrl.signal))
    )
      .then(setMovies)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e)
        if (!(e as Error & { name?: string }).name?.includes("AbortError")) {
          setErr(msg || "Failed to load movies")
        }
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [movie_ids])

  if (!movie_ids || movie_ids.length === 0) {
    return <Typography>No favourites yet!</Typography>
  }

  if (loading) {
    return <Typography>Loading movies...</Typography>
  }

  if (err) {
    return <Typography className="text-red-500">{err}</Typography>
  }

    return (
    <ul className="grid grid-cols-3 gap-4">
        {movies.map((movie) => (
            <li key={movie.id} className="flex justify-center">
                <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-auto rounded"
                />
            </li>
        ))}
    </ul>
    )
}