# main.py
import uvicorn
from dotenv import load_dotenv

# Carrega .env ANTES de importar rotas/config
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


# Rotas
from routes.user_routes import router as user_router
from routes.friend_list_routes import router as friend_router
from routes.debug_routes import router as debug_router
from routes.tmdb_routes import router as tmdb_router
from routes.favourite_movies_routes import router as favourite_movies_router
from routes.rated_movies_route import router as user_ratings_router
from routes.groups_routes import router as groups_router

app = FastAPI(title="Advanced SW Dev API")

# CORS (aceita qualquer porta local: 5173, 5174, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-Id"],
)

# Rotas principais
app.include_router(user_router)
app.include_router(friend_router)
app.include_router(debug_router)
app.include_router(tmdb_router)
app.include_router(favourite_movies_router)
app.include_router(user_ratings_router)
app.include_router(groups_router)

from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.get("/")
async def read_root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    print("Starting Uvicorn server on http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

## Removed old demo friends endpoints in favor of routes.friend_list_routes
@app.get("/healthz")
async def healthz():
    return {"ok": True}
