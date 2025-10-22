import { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { fetchFavouriteMovies } from "@/lib/favourite-movies-service";
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper";
import Spinner from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { removeFavouriteMovie } from "@/lib/favourite-movies-service";
import { reorderFavouriteMovies } from "@/lib/favourite-movies-service";

import { Trash2 } from "lucide-react";
import { ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";


const Rankings = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [rankings, setRankings] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleRemoveFromFavourites = async (movieId: number, index: number) => {
    if (!user) return;

    try {
      setRankings(prev => {
        const newList = [...prev];
        newList.splice(index, 1);
        // if (newList.length === 0) setIsMovieListEmpty(true);
        return newList;
      });

      await removeFavouriteMovie(user.user_id, movieId);
    } catch (e) {
      console.error("Favourite toggle failed", e);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadFavourites = async () => {
      try {
        const movieIds = await fetchFavouriteMovies(user.user_id);
        if (!movieIds || movieIds.length === 0 || movieIds[0] === -1) {
          setRankings([]);
          return;
        }

        const movies = await Promise.all(
          movieIds.map((mid) => fetchMovieDetails(mid))
        );
        setRankings(movies);
      } catch (err) {
        console.error("Failed to load favourite movies", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavourites();
  }, [user]);

  if (!user || id !== user.user_id) return <Navigate to="/" replace />;
  if (isLoading) return <Spinner />;

  const updateBackendOrder = async (newRankings: Movie[]) => {
    try {
      await reorderFavouriteMovies(
        user.user_id,
        newRankings.map((m) => m.id)
      );
    } catch (err) {
      console.error("Failed to update rankings", err);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setRankings((prev) => {
      const newList = [...prev];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      updateBackendOrder(newList);
      return newList;
    });
  };

  const moveDown = (index: number) => {
    if (index === rankings.length - 1) return;
    setRankings((prev) => {
      const newList = [...prev];
      [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
      updateBackendOrder(newList);
      return newList;
    });
  };

  if (rankings.length === 0) {
    return (
      <div className="min-h-fullbg-gray-50 flex justify-center items-start py-10">
        <div className="w-[100%] max-w-2xl">
          <div className="flex items-center justify-between mx-auto mb-8 w-full max-w-4xl">
            <Link
              to={`/profile/${user.user_id}`}
              className="inline-block rounded-xl bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-700 hover:shadow-lg transition-all duration-200"
            >
              <ArrowLeft/>
            </Link>

            <Typography size="h2" align="center" className="text-gray-800 absolute left-1/2 transform -translate-x-1/2">
              My Favourites
            </Typography>
          </div>
          <div className="flex justify-center items-center">
            <p>No favourites yet!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-fullbg-gray-50 flex justify-center items-start py-10">
      <div className="w-[100%] max-w-2xl">
        <div className="flex items-center justify-between mx-auto mb-8 w-full max-w-4xl">
          <Link
            to={`/profile/${user.user_id}`}
            className="inline-block rounded-xl bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-700 hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft/>
          </Link>

          <Typography size="h2" align="center" className="text-gray-800 absolute left-1/2 transform -translate-x-1/2">
            My Favourites
          </Typography>
        </div>
        <div className="space-y-4">
          {rankings.map((movie, index) => (
            <div
              key={movie.id}
              className="flex items-center bg-white p-4 shadow-lg rounded-xl gap-4"
            >
              {/* Rank Badge */}
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-full text-lg shadow-md">
                {index + 1}
              </div>

              {/* Poster */}
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-16 h-24 object-cover rounded-lg shadow-sm"
              />

              {/* Movie Title */}
              <Typography size="h2" className="flex-1 text-gray-700 font-semibold text-lg">
                {movie.title} ({movie.year})
              </Typography>

              {/* Up/Down Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="px-3 py-1 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-white transition cursor-pointer"
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === rankings.length - 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-white transition cursor-pointer"
                >
                  <ArrowDown size={18} />
                </button>
                <button
                  onClick={() => {handleRemoveFromFavourites(movie.id, index)}}
                  className="px-3 py-1 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rankings;
