import { type Movie } from "@/lib/tmdb-api-helper"
import { Typography } from "@/components/ui/typography"
import { GripVertical } from 'lucide-react';

interface MovieListProps {
  movies: Movie[]
  editMode?: boolean
}

export default function MovieList({ movies, editMode = true }: MovieListProps) {
    if (movies.length === 0) return <Typography>Loading...</Typography>

    return (
        <ul className="w-full">
            {movies.map((movie, index) => (
                <li key={movie.id} className="">
                    <div 
                        className="flex items-center justify-center grid grid-cols-5 my-2 border-2 border-gray-200 rounded-lg"
                        style={{ gridTemplateColumns: "4% 6% 60% 10% 20%"}}
                    >
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            { editMode ? (
                                <GripVertical className="w-full h-full"/>
                            ) : (
                                <p></p>
                            )
                            }
                        </div>
                        <Typography align="center">#{index + 1}</Typography>
                        <Typography>{movie.title}</Typography>
                        <Typography>{movie.year}</Typography>
                        <Typography>{movie.genre}</Typography>
                    </div>
                </li>
            ))}
        </ul>
    )
}
