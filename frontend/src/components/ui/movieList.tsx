import { type Movie } from "@/lib/tmdb-api-helper"
import { Typography } from "@/components/ui/typography"
import SmallMovieCard from "@/components/ui/smallMovieCard"

interface MovieListProps {
  movies: Movie[]
//   editMode?: boolean
}

export default function MovieList({ movies }: MovieListProps) {
    if (movies.length === 0) return <Typography>Loading...</Typography>


    return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {movies.map((movie) => (
                <li key={movie.id} className="flex justify-center">
                <SmallMovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    year={movie.year}
                    poster={movie.poster}
                    genre={movie.genre}
                />
                </li>
            ))}
        </ul>
    )
}
