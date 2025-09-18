
// src/pages/movies/MovieDetailsPage.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/ratings"
import { Star } from "lucide-react"
import { HeartRating } from "@/components/ui/heart"

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [isFavourite, setIsFavourite] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      setErr("Invalid movie id")
      setLoading(false)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    setErr(null)
    fetchMovieDetails(numericId, ctrl.signal)
      .then(setMovie)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e)
        if (!(e as Error & { name?: string }).name?.includes("AbortError")) {
          setErr(msg || "Failed to load")
        }
      })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [numericId])

  if (loading) return <div className="p-6">Loading…</div>
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>
  if (!movie) return <div className="p-6">No movie found.</div>

  return (
    <>
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {movie.title}{" "}
            <span className="text-muted-foreground">({movie.year})</span>
          </h1>
          <Button asChild variant="secondary">
            <Link to="/movies">← Back</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px,1fr]">
          <div className="flex items-center justify-center">
            <Card className="overflow-hidden items-center justify-center">
              <img
                src={movie.poster}
                alt={`${movie.title} poster`}
                className="object-contain rounded-xl shadow-xl ring-1"
              />
            </Card>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-sm text-muted-foreground">{movie.genre}</div>
              <div className="flex items-center gap-2 text-lg">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <span>{movie.rating} IMBD</span>
              </div>              


              <div className="flex items-center justify-between text-lg">
                {/* Left side */}
                <div className="flex items-center gap-2">
                  <p className="font-bold">My Rating</p>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                {/* Right side */}
                <HeartRating value={isFavourite} onChange={setIsFavourite} />
              </div>
              <p className="text-base leading-relaxed">{movie.description}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-6 mx-auto max-w-5xl">
        <StarRating value={rating} onChange={setRating} />
        <p className="mt-2 text-sm text-muted-foreground">
          You rated: {rating} / 5
        </p>
      </div>
    </>
  )
}

