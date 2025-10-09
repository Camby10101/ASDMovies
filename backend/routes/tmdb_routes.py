import logging
from typing import List, Literal
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from config import supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["tmdb"])

class MovieOut(BaseModel):
    id: int
    title: str
    year: str
    poster: str
    genre: str
    rating: str
    description: str

class PaginatedMoviesResponse(BaseModel):
    movies: List[MovieOut]
    total: int
    page: int
    page_size: int
    total_pages: int


def transform_db_movie(m: dict) -> MovieOut:
    """Transform database movie record to MovieOut format"""
    return MovieOut(
        id=m.get("tmdb_id") or 0,
        title=m.get("title") or "Untitled",
        year=str(m.get("release_year") or "—"),
        poster=m.get("poster") or "https://via.placeholder.com/500x750?text=No+Poster",
        genre=m.get("genre") or "—",
        rating=f'{(m.get("rating") or 0):.1f}',
        description=m.get("description") or "",
    )


@router.get("/health")
def health():
    return {"ok": True}


@router.get("/search/movies", response_model=PaginatedMoviesResponse)
async def search_movies(
    q: str = Query("", description="Empty => popular"),
    page: int = Query(1, ge=1, description="Page number (starting from 1)"),
    page_size: int = Query(24, ge=1, le=100, description="Number of movies per page")
):
    try:
        # Calculate offset for pagination
        offset = (page - 1) * page_size
        
        if q.strip():
            # Search by title (case-insensitive)
            # Get total count
            count_result = supabase_admin.table("movies").select("*", count="exact").ilike("title", f"%{q}%").execute()
            total = count_result.count or 0
            
            # Get paginated results
            result = supabase_admin.table("movies").select("*").ilike("title", f"%{q}%").order("rating", desc=True).range(offset, offset + page_size - 1).execute()
        else:
            # Return popular movies (ordered by rating)
            # Get total count
            count_result = supabase_admin.table("movies").select("*", count="exact").execute()
            total = count_result.count or 0
            
            # Get paginated results
            result = supabase_admin.table("movies").select("*").order("rating", desc=True).range(offset, offset + page_size - 1).execute()
        
        movies = result.data or []
        total_pages = (total + page_size - 1) // page_size  # Ceiling division
        
        return PaginatedMoviesResponse(
            movies=[transform_db_movie(m) for m in movies],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    except Exception as e:
        logger.error(f"Error searching movies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trending", response_model=PaginatedMoviesResponse)
async def trending(
    period: Literal["day", "week"] = "day",
    page: int = Query(1, ge=1, description="Page number (starting from 1)"),
    page_size: int = Query(24, ge=1, le=100, description="Number of movies per page")
):
    # Since we don't have trending data in the database, we'll return top-rated movies
    # This could be enhanced later with a view count or popularity metric
    try:
        # Calculate offset for pagination
        offset = (page - 1) * page_size
        
        # Get total count
        count_result = supabase_admin.table("movies").select("*", count="exact").execute()
        total = count_result.count or 0
        
        # Get paginated results
        result = supabase_admin.table("movies").select("*").order("rating", desc=True).range(offset, offset + page_size - 1).execute()
        movies = result.data or []
        total_pages = (total + page_size - 1) // page_size  # Ceiling division
        
        return PaginatedMoviesResponse(
            movies=[transform_db_movie(m) for m in movies],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    except Exception as e:
        logger.error(f"Error fetching trending movies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/movies/{movie_id}", response_model=MovieOut)
async def movie_details(movie_id: int):
    try:
        # Query by tmdb_id
        result = supabase_admin.table("movies").select("*").eq("tmdb_id", movie_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail=f"Movie with ID {movie_id} not found")
        
        return transform_db_movie(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching movie details: {e}")
        raise HTTPException(status_code=500, detail=str(e))
