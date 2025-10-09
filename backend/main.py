# main.py
import uvicorn
from dotenv import load_dotenv

# Load .env BEFORE importing anything that reads env
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from routes.user_routes import router as user_router
from routes.friend_list_routes import router as friend_router
from routes.debug_routes import router as debug_router
from routes.tmdb_routes import router as tmdb_router
from routes.favourite_movies_routes import router as favourite_movies_router
from routes.rated_movies_route import router as user_ratings_router
from routes.groups_routes import router as groups_router
from routes.recommendations_routes import router as recommendations_router

app = FastAPI(title="Advanced SW Dev API")

# ---- CORS: explicitly allow your frontend origins (fixes browser CORS) ----
FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # add other local ports if you use them:
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,   # explicit whitelist
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-Id"],
)

# ---- Include routers ----
app.include_router(user_router)
app.include_router(friend_router)
app.include_router(debug_router)
app.include_router(tmdb_router)
app.include_router(favourite_movies_router)
app.include_router(user_ratings_router)
app.include_router(groups_router)
app.include_router(recommendations_router)

# ---- Simple health/debug endpoints ----
@app.get("/")
async def read_root():
    return {"message": "Hello World"}

@app.get("/healthz")
async def healthz():
    return {"ok": True}

@app.get("/__ping")
def __ping():
    return {"ok": True}

@app.get("/__routes")
def __routes():
    return sorted(
        [
            (getattr(r, "path", str(r)), sorted(list(getattr(r, "methods", []))))
            for r in app.router.routes
        ],
        key=lambda x: x[0],
    )

if __name__ == "__main__":
    print("Starting Uvicorn server on http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
