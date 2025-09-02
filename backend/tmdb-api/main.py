# main.py
import os
from typing import Any, Optional, List, Literal
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_BEARER = (os.environ.get("TMDB_BEARER") or "").strip()
POSTER_BASE = "https://image.tmdb.org/t/p"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class MovieOut(BaseModel):
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
        raise RuntimeError("TMDB_BEARER not set (use v4 Read Access Token).")
    headers = {"Authorization": f"Bearer {TMDB_BEARER}"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{TMDB_BASE}{path}", headers=headers, params=params)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()

# tiny in-memory genre map (optional)
genre_map: dict[int, str] = {}

@app.get("/health")
def health():
    return {"ok": True}

@app.on_event("startup")
async def warm_genres():
    try:
        data = await tmdb_get("/genre/movie/list", params={"language": "en-US"})
        genre_map.update({g["id"]: g["name"] for g in data.get("genres", [])})
    except Exception:
        pass

def simplify(m: dict) -> MovieOut:
    year = (m.get("release_date") or "")[:4] or "—"
    genre = ", ".join(genre_map.get(gid, "") for gid in m.get("genre_ids", []) if genre_map.get(gid)) or "—"
    return MovieOut(
        title=m.get("title") or m.get("name") or "Untitled",
        year=year,
        poster=poster_url(m.get("poster_path")),
        genre=genre,
        rating=f'{(m.get("vote_average") or 0):.1f}',
        description=m.get("overview") or "",
    )

@app.get("/search/movies", response_model=List[MovieOut])
async def search_movies(q: str = Query("", description="Empty => popular")):
    data = (
        await tmdb_get("/search/movie", params={"query": q, "include_adult": "false", "language": "en-US", "page": 1})
        if q.strip()
        else await tmdb_get("/movie/popular", params={"language": "en-US", "page": 1})
    )
    results = data.get("results", [])[:24]
    return [simplify(m) for m in results]

@app.get("/trending", response_model=List[MovieOut])
async def trending(period: Literal["day", "week"] = "day"):
    data = await tmdb_get(f"/trending/movie/{period}", params={"language": "en-US"})
    results = data.get("results", [])[:24]
    return [simplify(m) for m in results]
