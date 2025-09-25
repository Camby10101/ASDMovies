// src/types/user-movie-ratings.ts
export interface UserMovieRating {
  user_id: string
  tmdb_id: number
  rating: number
  created_at?: string
}

