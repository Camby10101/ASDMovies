
// src/pages/movies/MovieDetailsPage.tsx
import * as React from "react"
import { useEffect, useState } from "react"
import { useParams, Link } from "react-router"
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!numericId) { setErr("Invalid movie id"); setLoading(false); return }
    const ctrl = new AbortController()
    setLoading(true); setErr(null)
    fetchMovieDetails(numericId, ctrl.signal)
      .then(setMovie)
      .catch(e => { if (e.name !== "AbortError") setErr(e.message ?? "Failed to load") })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [numericId])

  if (loading) return <div className="p-6">Loading…</div>
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>
  if (!movie) return <div className="p-6">Not found.</div>

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{movie.title} <span className="text-muted-foreground">({movie.year})</span></h1>
        <Button asChild variant="secondary"><Link to="/movies">← Back</Link></Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px,1fr]">
        <div className="flex items-center justify-center">
          <Card className="overflow-hidden w-140 items-center justify-center">
            <img
              src={movie.poster}
              alt={`${movie.title} poster`}
              className="w-120 object-contain rounded-xl shadow-x1/80 ring"
            />
          </Card>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-sm text-muted-foreground">{movie.genre}</div>
            <div className="text-lg">⭐ {movie.rating}</div>
            <p className="text-base leading-relaxed">{movie.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
