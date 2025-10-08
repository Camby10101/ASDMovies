# user_routes.py
from fastapi import APIRouter, Depends, HTTPException
import traceback
import logging

# Import dependencies from our modular files
from auth import get_current_user
from config import supabase_admin

from typing import Literal, List, Optional
from pydantic import BaseModel

from datetime import datetime, timezone

class UpdateProfileRequest(BaseModel):
    bio: str
    display_name: str

router = APIRouter()

@router.get("/api/profile")
async def get_profile(current_user=Depends(get_current_user)):
    """
    Get the user's profile from the database. If a profile doesn't exist,
    """
    try:
        user_id_str = str(current_user.id)
        print(f"Getting profile for user: {user_id_str}, email: {current_user.email}")

        # Fetch profile from the 'profiles' table
        result = supabase_admin.table("profiles").select("*").eq("user_id", user_id_str).execute()
        
        if result.data:
            print("Found existing profile.")
            return result.data[0]
        
        # If no profile exists, create one
        print("No profile found, creating a new one.")
        new_profile = {
            "user_id": user_id_str,
            "email": current_user.email,
        }
        insert_result = supabase_admin.table("profiles").insert(new_profile).execute()
        
        if insert_result.data:
            print("Profile created successfully.")
            return insert_result.data[0]
        
        raise Exception("Failed to create profile - no data returned after insert.")
            
    except Exception as e:
        print(f"Error in get_profile: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=404,
            detail={"error": str(e), "message": "An error occurred while fetching or creating the profile."}
        )

@router.patch("/api/profile/")
async def update_profile(payload: UpdateProfileRequest, current_user=Depends(get_current_user)):
    """
    Update the user's profile
    """

    update_data = payload.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    try:
        
        user_id = str(current_user.id)
        print(f"Updating profile for user: {user_id}")

        result = supabase_admin.table("profiles").update(update_data).eq("user_id", user_id).execute()

        if result.data:
            return {"message": "Profile updated successfully", "profile": result.data[0]}
        
        raise Exception("No profile found")
    
    except Exception as e:
        print(f"Error in update_profile: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=403,
            detail={"error": str(e), "message": "You are not allowed to update this profile."}
        )
    
@router.get("/api/profile/{id}")
async def get_profile_by_id(id: str):
    """
    Get the user's profile using a specific id
    """
    try:
        result = supabase_admin.table("profiles").select("*").eq("user_id", id).execute()

        if result.data:
            return result.data[0]
        
        raise Exception("No profile found with given id")
    except Exception as e:
        print(f"Error in get_profile/id: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=404,
            detail={"error": str(e), "message": "An error occurred while fetching a profile."}
        )

@router.get("/api/debug-auth")
async def debug_auth(current_user=Depends(get_current_user)):
    """Debug endpoint to verify authentication and check user data."""
    return {
        "message": "Authentication successful!",
        "user_id": current_user.id,
        "email": current_user.email,
        "user_metadata": current_user.user_metadata,
    }


# ------------------------
# PRIVACY API
# ------------------------

# Tipos aceitos
Visibility = Literal["public", "friends", "private"]
FavsVis = Literal["everyone", "friends", "only_me"]

class PrivacySettings(BaseModel):
    profile_visibility: Visibility = "public"
    allow_friend_requests: bool = True
    show_activity: bool = True
    show_favorites_to: FavsVis = "friends"
    allow_tagging: bool = True

@router.get("/api/privacy")
async def get_privacy(current_user=Depends(get_current_user)):
    """
    Retorna as configurações de privacidade do usuário.
    Se não existir linha, cria com defaults e retorna.
    """
    try:
        user_id_str = str(current_user.id)
        print(f"[privacy] get for user: {user_id_str}")

        res = supabase_admin.table("privacy_settings").select("*").eq("user_id", user_id_str).execute()
        if res.data:
            return res.data[0]

        # cria defaults
        defaults = {
            "user_id": user_id_str,
            "profile_visibility": "public",
            "allow_friend_requests": True,
            "show_activity": True,
            "show_favorites_to": "friends",
            "allow_tagging": True,
        }
        ins = supabase_admin.table("privacy_settings").insert(defaults).execute()
        if ins.data:
            return ins.data[0]
        raise Exception("Failed to create default privacy settings.")

    except Exception as e:
        print(f"Error in get_privacy: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail={"error": str(e)})

@router.put("/api/privacy")
async def update_privacy(payload: PrivacySettings, current_user=Depends(get_current_user)):
    """
    Atualiza (upsert) as configurações de privacidade do usuário.
    """
    try:
        user_id_str = str(current_user.id)
        print(f"[privacy] update for user: {user_id_str} -> {payload}")

        to_save = {
            "user_id": user_id_str,
            **(
                payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
            ),
            "updated_at": datetime.now(timezone.utc).isoformat()  # timestamp válido
        }
        # upsert garante criação/atualização
        upd = supabase_admin.table("privacy_settings").upsert(to_save, on_conflict="user_id").execute()
        if upd.data:
            return upd.data[0]
        raise Exception("Upsert returned no data.")
    except Exception as e:
        print(f"Error in update_privacy: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail={"error": str(e)})

# -------- Blocklist --------

class BlockIn(BaseModel):
    user: str  # id/email/handle do usuário a bloquear

@router.get("/api/privacy/blocklist")
async def get_blocklist(current_user=Depends(get_current_user)):
    """Lista usuários bloqueados do current_user."""
    try:
        user_id_str = str(current_user.id)
        res = supabase_admin.table("blocked_users").select("blocked, created_at").eq("user_id", user_id_str).order("created_at").execute()
        return {"blocked_users": [row["blocked"] for row in res.data or []]}
    except Exception as e:
        print(f"Error in get_blocklist: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail={"error": str(e)})

@router.post("/api/privacy/block")
async def add_block(payload: BlockIn, current_user=Depends(get_current_user)):
    """Adiciona um usuário à blocklist (idempotente)."""
    try:
        user_id_str = str(current_user.id)
        who = (payload.user or "").strip()
        if not who:
            raise HTTPException(status_code=400, detail="Missing 'user'")

        # upsert pela PK (user_id, blocked)
        supabase_admin.table("blocked_users").upsert(
            {"user_id": user_id_str, "blocked": who},
            on_conflict="user_id,blocked"
        ).execute()

        res = supabase_admin.table("blocked_users").select("blocked").eq("user_id", user_id_str).execute()
        return {"ok": True, "blocked_users": [r["blocked"] for r in res.data or []]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in add_block: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail={"error": str(e)})

@router.delete("/api/privacy/block/{who}")
async def remove_block(who: str, current_user=Depends(get_current_user)):
    """Remove um usuário da blocklist."""
    try:
        user_id_str = str(current_user.id)
        supabase_admin.table("blocked_users").delete().eq("user_id", user_id_str).eq("blocked", who).execute()

        res = supabase_admin.table("blocked_users").select("blocked").eq("user_id", user_id_str).execute()
        return {"ok": True, "blocked_users": [r["blocked"] for r in res.data or []]}
    except Exception as e:
        print(f"Error in remove_block: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail={"error": str(e)})
