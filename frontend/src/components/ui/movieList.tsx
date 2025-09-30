import { useState, useEffect } from "react";
import { type Movie } from "@/lib/tmdb-api-helper"
import { Typography } from "@/components/ui/typography";
import SmallMovieCard from "@/components/ui/smallMovieCard";
import { removeFavouriteMovie } from "@/lib/favourite-movies-service";
import { useUser } from "@/hooks/useUser"
import { HeartRating } from "@/components/ui/heart"

interface MovieListProps {
  movies: Movie[]
}

export default function MovieList({ movies }: MovieListProps) {
  const { user } = useUser();
  const [movieList, setMovieList] = useState<Movie[]>(movies);
  const [isMovieListEmpty, setIsMovieListEmpty] = useState(false);

  const handleRemoveFromFavourites = async (movieId: number, index: number) => {
    if (!user) return;

    try {
      setMovieList(prev => {
        const newList = [...prev];
        newList.splice(index, 1);
        if (newList.length === 0) setIsMovieListEmpty(true);
        return newList;
      });

      await removeFavouriteMovie(user.user_id, movieId);
    } catch (e) {
      console.error("Favourite toggle failed", e);
    }
  };

  useEffect(() => {
    setMovieList(movies);
  }, [movies]);

  if (movieList.length === 0 && isMovieListEmpty) return <Typography>No favourites yet!</Typography>;
  if (movieList.length === 0) return <Typography>Loading...</Typography>;

  return (
    <div className="gap-5 grid grid-cols-5">
      {movieList.map((movie, index) => (
        <div key={movie.id} className="relative">
          <div>
            <div className="w-1/6 absolute left-1.5 top-7.5 flex items-center justify-center bg-white rounded-md px-1 py-1 z-10">
              <HeartRating
                value={true}
                onChange={() => handleRemoveFromFavourites(movie.id, index)}
              />
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
