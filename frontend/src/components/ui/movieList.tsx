import { type Movie } from "@/lib/tmdb-api-helper"
import { Typography } from "@/components/ui/typography";
import SmallMovieCard from "@/components/ui/smallMovieCard"
// import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface MovieListProps {
  movies: Movie[]
}

export default function MovieList({ movies }: MovieListProps) {
    if (movies.length === 0) return <Typography>Loading...</Typography>

    return (
      <div className = "gap-5 grid grid-cols-5">
          {movies.map((movie) => (
            <div>
                {/* <p>{index+1}</p> */}
                <SmallMovieCard 
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  year={movie.year}
                  poster={movie.poster}
                  genre={movie.genre}
                />
            </div>
          ))}
      </div>
    )
}
