# routes/debug_routes.py
from fastapi import APIRouter, Request, Depends
from auth import get_current_user

router = APIRouter()

@router.get("/api/_echo_auth")
async def echo_auth(req: Request):
    auth = req.headers.get("authorization")
    masked = (auth[:24] + "…") if auth else None
    return {"authorization": masked}

@router.get("/api/_whoami")
async def whoami(user = Depends(get_current_user)):
    return {"id": user.id, "email": user.email}
