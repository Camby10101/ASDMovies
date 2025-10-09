import { useEffect, useState } from "react"
import MovieCard from "@/components/ui/movieCard"
import { fetchMovies, type Movie } from "@/lib/tmdb-api-helper"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function MovieGridPage() {
  const [q, setQ] = useState("")
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    setErr(null)

    fetchMovies(q, currentPage, ctrl.signal)
      .then((response) => {
        setMovies(response.movies)
        setTotalPages(response.total_pages)
        setTotal(response.total)
      })
      .catch((e) => {
        if (e.name !== "AbortError") setErr(e.message ?? "Failed to load")
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [q, currentPage])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSearch = (value: string) => {
    setQ(value)
    setCurrentPage(1) // Reset to first page on new search
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Movies</h1>
        <Input
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search movies…"
          className="w-full max-w-md"
        />
      </header>

      {!loading && !err && total > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          Showing {movies.length} of {total} movies (Page {currentPage} of {totalPages})
        </p>
      )}

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
          !loading && !err && <p className="text-muted-foreground">No movies found</p>
        )}
      </div>

      {!loading && !err && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-10"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

