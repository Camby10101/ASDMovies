# main.py
import os
import uvicorn
from dotenv import load_dotenv

# Carrega .env ANTES de importar rotas/config
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


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
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "https://movielily.azurewebsites.net",
    ],
    # allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
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

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Serve static file if it exists
    file_path = os.path.join(STATIC_DIR, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    # Otherwise serve index.html for React Router
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    return {"detail": "Frontend build not found"}

if __name__ == "__main__":
    print("Starting Uvicorn server on http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

## Removed old demo friends endpoints in favor of routes.friend_list_routes
@app.get("/healthz")
async def healthz():
    return {"ok": True}
