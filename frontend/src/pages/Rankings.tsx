import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { fetchFavouriteMovies } from "@/lib/favourite-movies-service";
import { fetchMovieDetails, type Movie } from "@/lib/tmdb-api-helper";
import Spinner from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { reorderFavouriteMovies } from "@/lib/favourite-movies-service"; // <-- Import the function

const Rankings = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [rankings, setRankings] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-10">
      <div className="w-full max-w-2xl">
        <Typography size="h1" align="center" className="mb-8 text-gray-800">
          My Rankings
        </Typography>

        <div className="space-y-4">
          {rankings.map((movie, index) => (
            <div
              key={movie.id}
              className="flex items-center bg-white p-4 shadow-lg rounded-xl gap-4 transition-transform transform hover:scale-[1.02]"
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
                {movie.title}
              </Typography>

              {/* Up/Down Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="px-3 py-1 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === rankings.length - 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ↓
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
