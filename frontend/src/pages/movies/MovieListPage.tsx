
// src/pages/MovieGridPage.tsx
import MovieCard from "@/components/ui/movieCard"

interface Movie {
  title: string
  year: string
  poster: string
  genre: string
  rating: string | number
  description: string
}

const movies: Movie[] = [
  {
    title: "Inception",
    year: "2010",
    poster:
      "https://image.tmdb.org/t/p/w500/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg",
    genre: "Sci-Fi, Thriller",
    rating: "8.8",
    description:
      "A thief who steals corporate secrets through dream-sharing technology.",
  },
  {
    title: "The Matrix",
    year: "1999",
    poster:
      "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    genre: "Action, Sci-Fi",
    rating: "8.7",
    description:
      "A hacker learns the shocking truth about his reality.",
  },
  // add more movies as needed…
]

export default function MovieGridPage() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Movies</h1>
      <div className="grid gap-30 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {movies.map((m) => (
          <MovieCard
            key={m.title}
            title={m.title}
            year={m.year}
            poster={m.poster}
            genre={m.genre}
            rating={m.rating}
            description={m.description}
          />
        ))}
      </div>
    </div>
  )
}
