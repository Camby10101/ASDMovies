
# routes/rated_movies_route.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, conint
from config import supabase_admin
import traceback

router = APIRouter(prefix="/api/ratings", tags=["user_movie_ratings"])

class RatingPayload(BaseModel):
    # keep your 1..5 range (or switch to conint if you prefer)
    rating: conint(ge=1, le=5)  # same as Field(..., ge=1, le=5)

@router.get("/{user_id}")
async def get_ratings_by_user_id(user_id: str):
    """
    Return ratings list (possibly empty) sorted by most recent create time.
    """
    try:
        res = (
            supabase_admin
            .table("user_movie_ratings")
            .select("tmdb_id, rating, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        # supabase-py returns a PostgrestResponse; .data may be list or None
        return {"user_id": user_id, "ratings": (res.data or [])}
    except Exception as e:
        print("Error in get_ratings_by_user_id:", e)
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": str(e), "message": "Failed to fetch user ratings."})

@router.get("/{user_id}/{tmdb_id}")
async def get_rating_for_movie(user_id: str, tmdb_id: int):
    """
    Return rating or null if not rated; never 404 for "not found".
    """
    try:
        resp = (
            supabase_admin
            .table("user_movie_ratings")
            .select("rating")
            .eq("user_id", user_id)
            .eq("tmdb_id", tmdb_id)
            .maybe_single()
            .execute()
        )
        # .data can be dict (row) or None — handle both
        data = getattr(resp, "data", None)
        rating = data.get("rating") if isinstance(data, dict) else None
        return {"user_id": user_id, "tmdb_id": tmdb_id, "rating": rating}
    except Exception as e:
        print("Error in get_rating_for_movie:", e)
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": str(e), "message": "Failed to fetch rating."})

@router.post("/{user_id}/{tmdb_id}")
async def upsert_rating(user_id: str, tmdb_id: int, payload: RatingPayload):
    """
    Upsert rating (requires UNIQUE (user_id, tmdb_id) in DB).
    """
    try:
        resp = (
            supabase_admin
            .table("user_movie_ratings")
            .upsert(
                {"user_id": user_id, "tmdb_id": tmdb_id, "rating": payload.rating},
                on_conflict="user_id,tmdb_id"   # must match your DB unique constraint
            )
            .execute()
        )
        # return the new/updated row(s) if your table has triggers/timestamps
        return {"message": "Rating upserted", "user_id": user_id, "tmdb_id": tmdb_id, "rating": payload.rating, "data": (resp.data or [])}
    except Exception as e:
        print("Error in upsert_rating:", e)
        print(traceback.format_exc())
        # If you ever still see 23505 here, your DB unique constraint likely isn't (user_id, tmdb_id)
        raise HTTPException(status_code=500, detail={"error": str(e), "message": "Failed to upsert rating."})

