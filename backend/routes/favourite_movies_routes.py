from fastapi import APIRouter, HTTPException
from config import supabase_admin
import traceback

router = APIRouter(tags=["favourite_movies"])

@router.get("/api/favourite_movies/{user_id}")
async def get_favourite_movies_by_user_id(user_id: str):
    """
    Get a user's favourite movies using their user id
    """
    try:
        result = supabase_admin.table("favourite_movies").select("movie_id").eq("user_id", user_id).execute()
        
        if result.data:
            movie_ids = [item["movie_id"] for item in result.data]
            return movie_ids
        return []
    
    except Exception as e:
        print(f"Error in get_favourite_movies_by_user_id: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=404,
            detail={"error": str(e), "message": "An error occurred while fetching a user's favourite movies."}
        )

@router.get("/api/favourite_movies/{user_id}/{movie_id}")
async def is_movie_favourite(user_id: str, movie_id: int):
    """
    Check if a user has favourited a specific movie
    """
    try:
        result = (
            supabase_admin
            .table("favourite_movies")
            .select("movie_id")
            .eq("user_id", user_id)
            .eq("movie_id", movie_id)
            .execute()
        )

        return bool(result.data and len(result.data) > 0)
    
    except Exception as e:
        print(f"Error in is_movie_favourite: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=404,
            detail={"error": str(e), "message": "An error occurred while fetching a user's favourite movies."}
        )

@router.post("/api/favourite_movies/{user_id}/{movie_id}")
async def add_favourite_movie(user_id: str, movie_id: int):
    """
    Add a new movie to the user's favourite movies list
    """
    try:
        result = supabase_admin.table("favourite_movies").insert({
            "user_id": user_id,
            "movie_id": movie_id
        }).execute()

        if result.data:
            return {"message": "New favourite movie added successfully", "user": user_id, "movie": movie_id}
        
    except Exception as e:
        print(f"Error in add_favourite_movie: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=404,
            detail={"error": str(e), "message": "An error occurred while adding a favourite movie."}
        )

@router.delete("/api/favourite_movies/{user_id}/{movie_id}")
async def remove_favourite_movie(user_id: str, movie_id: int):
    """
    Remove a movie from the user's favourite movies list
    """
    try:
        result = supabase_admin.table("favourite_movies")\
            .delete()\
            .eq("user_id", user_id)\
            .eq("movie_id", movie_id)\
            .execute()

        if result.data:
            return {"message": "Favourite movie removed successfully", "user": user_id, "movie": movie_id}
        
    except Exception as e:
        print(f"Error in remove_favourite_movie: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=404,
            detail={"error": str(e), "message": "An error occurred while removing a favourite movie."}
        )