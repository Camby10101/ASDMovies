from fastapi import APIRouter, Depends, HTTPException
import traceback

from auth import get_current_user
from config import supabase_admin

router = APIRouter()

@router.get("/api/friends")
async def list_friend_list(current_user=Depends(get_current_user)):
    try:
        owner_user_id = str(current_user.id)
        friend_list_result = (
            supabase_admin
            .table("friendlists")
            .select("id")
            .eq("owner_user_id", owner_user_id)
            .execute()
        )

        if not friend_list_result.data:
            create_result = (
                supabase_admin
                .table("friendlists")
                .insert({"owner_user_id": owner_user_id})
                .execute()
            )
            friend_list_id = create_result.data[0]["id"]
        else:
            friend_list_id = friend_list_result.data[0]["id"]

        members_result = (
            supabase_admin
            .table("friendlist_members")
            .select("member_user_id")
            .eq("friend_list_id", friend_list_id)
            .execute()
        )

        # Get friend details including email
        friends = []
        for row in (members_result.data or []):
            member_user_id = row["member_user_id"]
            # Get profile information for each friend
            profile_result = (
                supabase_admin
                .table("profiles")
                .select("user_id, email")
                .eq("user_id", member_user_id)
                .execute()
            )
            if profile_result.data:
                friend_data = profile_result.data[0]
                friends.append({
                    "user_id": friend_data["user_id"], 
                    "email": friend_data["email"]
                })
            else:
                # Fallback if profile not found
                friends.append({
                    "user_id": member_user_id, 
                    "email": None
                })

        return {"friend_list_id": friend_list_id, "friends": friends}
    except Exception as e:
        print(f"Error in list_friend_list: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/friends")
async def add_friend(friend_email: str, current_user=Depends(get_current_user)):
    try:
        owner_user_id = str(current_user.id)

        friend_list_result = (
            supabase_admin
            .table("friendlists")
            .select("id")
            .eq("owner_user_id", owner_user_id)
            .execute()
        )

        if not friend_list_result.data:
            create_result = (
                supabase_admin
                .table("friendlists")
                .insert({"owner_user_id": owner_user_id})
                .execute()
            )
            friend_list_id = create_result.data[0]["id"]
        else:
            friend_list_id = friend_list_result.data[0]["id"]

        # Look up user_id from email
        print(f"[friends] add -> owner={owner_user_id} friend_email={friend_email}")
        profile_check = (
            supabase_admin
            .table("profiles")
            .select("user_id, email")
            .eq("email", friend_email)
            .execute()
        )
        print(f"[friends] profile_check rows={len(profile_check.data or [])} data={profile_check.data}")
        if not profile_check.data:
            raise HTTPException(status_code=404, detail="Friend profile not found")
        
        friend_user_id = profile_check.data[0]["user_id"]

        insert_result = (
            supabase_admin
            .table("friendlist_members")
            .insert({
                "friend_list_id": friend_list_id,
                "member_user_id": friend_user_id,
            })
            .execute()
        )

        return {"friend_list_id": friend_list_id, "added": insert_result.data}
    except HTTPException:
        # Preserve intended HTTP status codes like 404
        raise
    except Exception as e:
        print(f"Error in add_friend: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))