# user_routes.py
from fastapi import APIRouter, Depends, HTTPException
import traceback

# Import dependencies from our modular files
from auth import get_current_user
from config import supabase_admin

router = APIRouter()

@router.get("/api/profile")
async def get_profile(current_user=Depends(get_current_user)):
    """
    Get the user's profile from the database. If a profile doesn't exist,
    create one with a default 'inactive' subscription status.
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
            "subscription_status": "inactive"
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
            status_code=500,
            detail={"error": str(e), "message": "An error occurred while fetching or creating the profile."}
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