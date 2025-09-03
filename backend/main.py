import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Hello World"}

#Friends List System (Temp needs modifing to work with user system and database):

friends_list = FriendsList(owner="Admin")

@app.get("/friends")
def get_friends():
    return {"owner": friends_list.owner, "friends": friends_list.get_friends()}

@app.post("/friends")
def add_friend(friend: Friend):
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
