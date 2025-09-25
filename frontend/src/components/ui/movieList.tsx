import { type Movie } from "@/lib/tmdb-api-helper"
import { Typography } from "@/components/ui/typography"

interface MovieListProps {
  movies: Movie[]
}

export default function MovieList({ movies }: MovieListProps) {
    if (movies.length === 0) return <Typography>Loading...</Typography>

    return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {movies.map((movie) => (
                <li key={movie.id} className="flex justify-center">
                <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-auto"
                />
                </li>
            ))}
        </ul>
    )
}
