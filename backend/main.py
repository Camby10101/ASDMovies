import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import httpx
from dotenv import load_dotenv

load_dotenv()
TMDB_TOKEN = os.getenv("TMDB_TOKEN")
TMDB_BASE = "https://api.themoviedb.org/3"

if not TMDB_TOKEN:
    raise RuntimeError("Missing TMDB_TOKEN env var")

app = FastAPI()

async def tmdb_get(path: str, params: dict | None = None) -> JSONResponse:
    headers = {"Authorization": f"Bearer {TMDB_TOKEN}", "Accept": "application/json"}
    url = f"{TMDB_BASE}{path}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, headers=headers, params=params)
    try:
        data = r.json()
    except Exception:
        data = {"error": "Bad TMDb response"}
    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail=data)
    return JSONResponse(status_code=r.status_code, content=data)

@app.get("/api/health")
async def health():
    return {"ok": True}

@app.get("/api/tmdb/trending")
async def trending(window: str = "day"):
    return await tmdb_get(f"/trending/movie/{window}", {})

@app.get("/api/tmdb/search")
async def search(query: str, page: int = 1, region: str = "AU", language: str = "en-AU"):
    return await tmdb_get("/search/movie", {
        "query": query,
        "page": page,
        "region": region,
        "language": language
    })

@app.get("/api/tmdb/movie/{movie_id}")
async def movie(movie_id: int):
    return await tmdb_get(f"/movie/{movie_id}", {"append_to_response": "credits,images"})
