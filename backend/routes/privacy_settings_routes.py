from fastapi import APIRouter, Depends, HTTPException
import traceback

# Import dependencies from our modular files
from auth import get_current_user
from config import supabase_admin

router = APIRouter()

@router.get("/api/profile")
async def (current_user=Depends(get_current_user)):
    