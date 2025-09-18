# main.py
import uvicorn
from dotenv import load_dotenv

# Carrega .env ANTES de importar rotas/config
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Rotas
from routes.user_routes import router as user_router
from routes.friend_list_routes import router as friend_router
from routes.debug_routes import router as debug_router

# Demo FriendsList
from friends_list import FriendsList

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

# -------------------------------
# Friends List (temporário / demo)
# -------------------------------
friends_list = FriendsList(owner="Admin")

class FriendIn(BaseModel):
    name: str

@app.get("/friends")
async def get_friends():
    return {"owner": friends_list.owner, "friends": friends_list.get_friends()}

@app.post("/friends")
async def add_friend(friend: FriendIn):
    try:
        friends_list.add_friend(friend.name)
        return {"message": f"{friend.name} added successfully!"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/friends/{name}")
async def remove_friend(name: str):
    if not friends_list.is_friend(name):
        raise HTTPException(status_code=404, detail="Friend not found")
    friends_list.remove_friend(name)
    return {"message": f"{name} removed successfully!"}

if __name__ == "__main__":
    print("Starting Uvicorn server on http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
