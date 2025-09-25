import os
import httpx
import logging
from typing import Any, Optional, List, Literal
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

logger = logging.getLogger(__name__)

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_BEARER = os.getenv("TMDB_BEARER")
POSTER_BASE = "https://image.tmdb.org/t/p"

router = APIRouter(tags=["tmdb"])

class MovieOut(BaseModel):
    id: int
    title: str
    year: str
    poster: str
    genre: str
    rating: str
    description: str

def poster_url(path: Optional[str], size: str = "w500") -> str:
    return f"{POSTER_BASE}/{size}{path}" if path else "https://via.placeholder.com/500x750?text=No+Poster"

async def tmdb_get(path: str, params: Optional[dict[str, Any]] = None):
    if not TMDB_BEARER:
        raise RuntimeError("TMDB_BEARER not set.")
    headers = {"Authorization": f"Bearer {TMDB_BEARER}"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{TMDB_BASE}{path}", headers=headers, params=params)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()


genre_map: dict[int, str] = {}

@router.on_event("startup")
async def warm_genres():
    try:
        data = await tmdb_get("/genre/movie/list", params={"language": "en-US"})
        for g in data.get("genres", []):
            genre_map[g["id"]] = g["name"]
    except Exception as e:
        logger.error(f"Error warming genres: {e}")


def simplify(m: dict) -> MovieOut:
    year = (m.get("release_date") or "")[:4] or "—"
    genre = ", ".join(genre_map.get(gid, "") for gid in m.get("genre_ids", []) if genre_map.get(gid)) or "—"
    return MovieOut(
        id=m["id"],
        title=m.get("title") or m.get("name") or "Untitled",
        year=year,
        poster=poster_url(m.get("poster_path")),
        genre=genre,
        rating=f'{(m.get("vote_average") or 0):.1f}',
        description=m.get("overview") or "",
    )


@router.get("/health")
def health():
    return {"ok": True}


@router.get("/search/movies", response_model=List[MovieOut])
async def search_movies(q: str = Query("", description="Empty => popular")):
    data = (
        await tmdb_get("/search/movie", params={"query": q, "include_adult": "false", "language": "en-US", "page": 1})
        if q.strip()
        else await tmdb_get("/movie/popular", params={"language": "en-US", "page": 1})
    )
    return [simplify(m) for m in data.get("results", [])[:24]]


@router.get("/trending", response_model=List[MovieOut])
async def trending(period: Literal["day", "week"] = "day"):
    data = await tmdb_get(f"/trending/movie/{period}", params={"language": "en-US"})
    return [simplify(m) for m in data.get("results", [])[:24]]


@router.get("/movies/{movie_id}", response_model=MovieOut)
async def movie_details(movie_id: int):
    print("Movie ID:",  movie_id)
    data = await tmdb_get(f"/movie/{movie_id}", params={"language": "en-US"})
    genre = ", ".join([g.get("name", "") for g in data.get("genres", [])]) or "—"
    return MovieOut(
        id=data["id"],
        title=data.get("title", "Untitled"),
        year=(data.get("release_date") or "")[:4] or "—",
        poster=poster_url(data.get("poster_path")),
        genre=genre,
        rating=f'{(data.get("vote_average") or 0):.1f}',
        description=data.get("overview") or "",
    )
