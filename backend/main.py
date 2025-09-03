from friends_list import FriendsList
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import FastAPI
from dotenv import load_dotenv

from routes.user_routes import router as user_router

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-Id"],
)

app.include_router(user_router)

@app.get("/")
async def read_root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    print("Starting Uvicorn server on http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

#Friends List System (Temp needs modifing to work with user system and database):

friends_list = FriendsList(owner="Admin")

@app.get("/friends")
def get_friends():
    return {"owner": friends_list.owner, "friends": friends_list.get_friends()}

@app.post("/friends")
def add_friend(friend):
    try:
        friends_list.add_friend(friend.name)
        return {"message": f"{friend.name} added successfully!"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
def remove_friend(name: str):
    if not friends_list.is_friend(name):
        raise HTTPException(status_code=404, detail="Friend not found")
    friends_list.remove_friend(name)
    return {"message": f"{name} removed successfully!"}
