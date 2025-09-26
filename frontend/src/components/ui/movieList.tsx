import { type Movie } from "@/lib/tmdb-api-helper"
import { Typography } from "@/components/ui/typography"
import { GripVertical } from 'lucide-react';
// import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface MovieListProps {
  movies: Movie[]
  editMode?: boolean
}

export default function MovieList({ movies, editMode = false }: MovieListProps) {
    if (movies.length === 0) return <Typography>Loading...</Typography>

    return (
          <ul className="w-full">
            {movies.map((movie, index) => (
            <li key={movie.id}>
                <div
                className="h-12 flex items-center justify-center grid grid-cols-4 my-2 border-2 border-gray-500 rounded-[12px]"
                style={{ gridTemplateColumns: "4% 6% 80% 10%" }}
                >
                    <div className="w-full h-full bg-gray-500 flex items-center justify-center rounded-l-[6px]">
                        {editMode && <GripVertical className="w-full h-full text-gray-100" />}
                    </div>
                    <Typography align="center" className="font-semibold">
                        #{index + 1}
                    </Typography>
                    <Typography>
                        {movie.title}
                    </Typography>
                    <Typography align="center">
                        {movie.year}
                    </Typography>
                </div>
            </li>
            ))}
        </ul>
    )
}
