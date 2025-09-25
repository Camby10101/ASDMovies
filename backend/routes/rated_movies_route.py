
# routes/rated_movies_route.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from config import supabase_admin
import traceback

router = APIRouter(prefix="/api/ratings", tags=["user_movie_ratings"])

class RatingPayload(BaseModel):
    rating: int = Field(..., ge=1, le=5)

@router.get("/{user_id}")
async def get_ratings_by_user_id(user_id: str):
    """
    Return ratings list (possibly empty) sorted by most recent create time.
    """
    try:
        res = (
            supabase_admin
            .table("user_movie_ratings")
            .select("tmdb_id, rating, created_at")   # ⬅️ use created_at
            .eq("user_id", user_id)
            .order("created_at", desc=True)          # ⬅️ order by created_at
            .execute()
        )
        return {"user_id": user_id, "ratings": res.data or []}
    except Exception as e:
        print("Error in get_ratings_by_user_id:", e)
        print(traceback.format_exc())
        # This is a server error, not a 404 route miss
        raise HTTPException(status_code=500, detail={"error": str(e), "message": "Failed to fetch user ratings."})

@router.get("/{user_id}/{tmdb_id}")
async def get_rating_for_movie(user_id: str, tmdb_id: int):
    """
    Return rating or null if not rated; never 404 for "not found".
    """
    try:
        row = (
            supabase_admin
            .table("user_movie_ratings")
            .select("rating")
            .eq("user_id", user_id)
            .eq("tmdb_id", tmdb_id)
            .maybe_single()
            .execute()
        )
        rating = row.data["rating"] if (row.data and "rating" in row.data) else None
        return {"user_id": user_id, "tmdb_id": tmdb_id, "rating": rating}
    except Exception as e:
        print("Error in get_rating_for_movie:", e)
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": str(e), "message": "Failed to fetch rating."})

@router.post("/{user_id}/{tmdb_id}")
async def upsert_rating(user_id: str, tmdb_id: int, payload: RatingPayload):
    """
    Upsert rating (requires a UNIQUE (user_id, tmdb_id) in DB).
    """
    try:
        res = (
            supabase_admin
            .table("user_movie_ratings")
            .upsert(
                {"user_id": user_id, "tmdb_id": tmdb_id, "rating": payload.rating},
                on_conflict="user_id,tmdb_id"
            )
            .execute()
        )
        return {"message": "Rating upserted", "user_id": user_id, "tmdb_id": tmdb_id, "rating": payload.rating, "data": res.data or []}
    except Exception as e:
        print("Error in upsert_rating:", e)
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": str(e), "message": "Failed to upsert rating."})

@router.delete("/{user_id}/{tmdb_id}")
async def delete_rating(user_id: str, tmdb_id: int):
    try:
        res = (
            supabase_admin
            .table("user_movie_ratings")
            .delete()
            .eq("user_id", user_id)
            .eq("tmdb_id", tmdb_id)
            .execute()
        )
        msg = "Rating removed" if res.data else "No rating found (nothing deleted)"
        return {"message": msg, "user_id": user_id, "tmdb_id": tmdb_id}
    except Exception as e:
        print("Error in delete_rating:", e)
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": str(e), "message": "Failed to delete rating."})
