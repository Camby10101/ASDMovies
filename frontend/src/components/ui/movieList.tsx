import { useState, useEffect } from "react";
import { type Movie } from "@/lib/tmdb-api-helper"
import { Typography } from "@/components/ui/typography";
import SmallMovieCard from "@/components/ui/smallMovieCard";

interface MovieListProps {
  movies: Movie[]
}

export default function MovieList({ movies }: MovieListProps) {
  const [movieList, setMovieList] = useState<Movie[]>(movies);

  useEffect(() => {
    setMovieList(movies);
  }, [movies]);

  if (movieList.length === 0) return <Typography>No favourites yet!</Typography>;

  return (
    <div className="gap-[0.5vw] grid grid-cols-4">
      {movieList.map((movie, index) => (
        <div key={movie.id} className="relative">
          <div>
            <div className="w-[17.5%] aspect-square absolute left-1.5 top-7.5 flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-full text-lg shadow-md z-10">
              {index + 1}
            </div>
            <SmallMovieCard 
              id={movie.id}
              title={movie.title}
              year={movie.year}
              poster={movie.poster}
              genre={movie.genre}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
