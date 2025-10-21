# groups_routes.py
from fastapi import APIRouter, Depends, HTTPException
import traceback
import logging

# Import dependencies from our modular files
from auth import get_current_user
from config import supabase_admin

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timezone

class CreateGroupRequest(BaseModel):
    group_name: Optional[str] = None
    group_colour: Optional[str] = None

class GroupResponse(BaseModel):
    id: str
    creator_user_id: str
    created_at: str
    group_name: Optional[str] = None
    group_colour: Optional[str] = None

class GroupMemberResponse(BaseModel):
    user_id: str
    group_id: str
    is_admin: bool
    joined_at: str
    user_email: Optional[str] = None

class AddMemberRequest(BaseModel):
    user_id: str

router = APIRouter()

@router.post("/api/groups", response_model=GroupResponse)
async def create_group(
    payload: CreateGroupRequest, 
    current_user=Depends(get_current_user)
):
    """
    Create a new group. The creator is automatically added as an admin member.
    """
    try:
        user_id_str = str(current_user.id)
        print(f"Creating group for user: {user_id_str}")

        # Create the group
        group_data = {
            "creator_user_id": user_id_str,
            "group_name": payload.group_name,
            "group_colour": payload.group_colour
        }
        
        group_result = supabase_admin.table("groups").insert(group_data).execute()
        
        if not group_result.data:
            raise Exception("Failed to create group - no data returned after insert.")
        
        group = group_result.data[0]
        group_id = group["id"]
        
        # Get the creator's email from profiles table
        profile_result = supabase_admin.table("profiles").select("email").eq("user_id", user_id_str).execute()
        user_email = profile_result.data[0]["email"] if profile_result.data else None
        
        # Add the creator as an admin member
        member_data = {
            "user_id": user_id_str,
            "group_id": group_id,
            "is_admin": True,
            "user_email": user_email
        }
        
        member_result = supabase_admin.table("group_members").insert(member_data).execute()
        
        if not member_result.data:
            # If member creation fails, we should clean up the group
            supabase_admin.table("groups").delete().eq("id", group_id).execute()
            raise Exception("Failed to add creator as group member.")
        
        print(f"Group created successfully with ID: {group_id}")
        return GroupResponse(**group)
        
    except Exception as e:
        print(f"Error in create_group: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "message": "An error occurred while creating the group."}
        )

@router.get("/api/groups", response_model=List[GroupResponse])
async def list_groups(current_user=Depends(get_current_user)):
    """
    List all groups that the current user is a member of.
    """
    try:
        user_id_str = str(current_user.id)
        print(f"Listing groups for user: {user_id_str}")

        # Get all groups where the user is a member
        result = supabase_admin.table("group_members").select(
            "group_id, groups(id, creator_user_id, created_at, group_name, group_colour)"
        ).eq("user_id", user_id_str).execute()
        
        if not result.data:
            return []
        
        # Extract group information from the joined data
        groups = []
        for member in result.data:
            group_info = member["groups"]
            if group_info:
                groups.append(GroupResponse(**group_info))
        
        print(f"Found {len(groups)} groups for user")
        return groups
        
    except Exception as e:
        print(f"Error in list_groups: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "message": "An error occurred while listing groups."}
        )

@router.get("/api/groups/{group_id}/members", response_model=List[GroupMemberResponse])
async def get_group_members(
    group_id: str, 
    current_user=Depends(get_current_user)
):
    """
    Get all members of a specific group. Only accessible by group members.
    """
    try:
        user_id_str = str(current_user.id)
        print(f"Getting members for group {group_id} by user {user_id_str}")

        # First verify the user is a member of the group
        membership_check = supabase_admin.table("group_members").select("user_id").eq(
            "group_id", group_id
        ).eq("user_id", user_id_str).execute()
        
        if not membership_check.data:
            raise HTTPException(
                status_code=403, 
                detail="You are not a member of this group."
            )
        
        # Get all members of the group with their email from profiles
        result = supabase_admin.table("group_members").select(
            "user_id, group_id, is_admin, joined_at, user_email, profiles(email)"
        ).eq("group_id", group_id).execute()
        
        if not result.data:
            return []
        
        # Merge email from profiles table if user_email is not set
        members = []
        for member in result.data:
            member_data = {
                "user_id": member["user_id"],
                "group_id": member["group_id"],
                "is_admin": member["is_admin"],
                "joined_at": member["joined_at"],
                "user_email": member.get("user_email") or (member.get("profiles", {}).get("email") if member.get("profiles") else None)
            }
            members.append(GroupMemberResponse(**member_data))
        
        print(f"Found {len(members)} members in group {group_id}")
        return members
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_group_members: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "message": "An error occurred while getting group members."}
        )

@router.get("/api/groups/{group_id}")
async def get_group_details(
    group_id: str, 
    current_user=Depends(get_current_user)
):
    """
    Get details of a specific group. Only accessible by group members.
    """
    try:
        user_id_str = str(current_user.id)
        print(f"Getting details for group {group_id} by user {user_id_str}")

        # First verify the user is a member of the group
        membership_check = supabase_admin.table("group_members").select("user_id").eq(
            "group_id", group_id
        ).eq("user_id", user_id_str).execute()
        
        if not membership_check.data:
            raise HTTPException(
                status_code=403, 
                detail="You are not a member of this group."
            )
        
        # Get group details
        result = supabase_admin.table("groups").select("*").eq("id", group_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Group not found.")
        
        group = result.data[0]
        print(f"Retrieved group details for {group_id}")
        return GroupResponse(**group)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_group_details: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "message": "An error occurred while getting group details."}
        )

@router.post("/api/groups/{group_id}/members")
async def add_group_member(
    group_id: str,
    payload: AddMemberRequest,
    current_user=Depends(get_current_user)
):
    """
    Add a member to a group. Only accessible by group admins.
    """
    try:
        user_id_str = str(current_user.id)
        print(f"Adding member {payload.user_id} to group {group_id} by user {user_id_str}")

        # First verify the user is an admin of the group
        admin_check = supabase_admin.table("group_members").select("is_admin").eq(
            "group_id", group_id
        ).eq("user_id", user_id_str).execute()
        
        if not admin_check.data or not admin_check.data[0].get("is_admin", False):
            raise HTTPException(
                status_code=403, 
                detail="You must be an admin to add members to this group."
            )
        
        # Get the user's email from profiles table
        profile_result = supabase_admin.table("profiles").select("email").eq("user_id", payload.user_id).execute()
        user_email = profile_result.data[0]["email"] if profile_result.data else None
        
        # Add the new member
        member_data = {
            "user_id": payload.user_id,
            "group_id": group_id,
            "is_admin": False,
            "user_email": user_email
        }
        
        result = supabase_admin.table("group_members").insert(member_data).execute()
        
        if not result.data:
            raise Exception("Failed to add member to group.")
        
        print(f"Successfully added member {payload.user_id} to group {group_id}")
        return {"message": "Member added successfully", "member": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in add_group_member: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "message": "An error occurred while adding member to group."}
        )
    
#For Updating groups once they have been created *Insert down arrow here* lol
class UpdateGroupRequest(BaseModel):
    group_name: Optional[str] = None
    group_colour: Optional[str] = None

@router.put("/api/groups/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: str,
    payload: UpdateGroupRequest,
    current_user=Depends(get_current_user)
):
    """
    Update group name or colour. Only accessible by group admins.
    """
    try:
        user_id_str = str(current_user.id)
        print(f"Updating group {group_id} by user {user_id_str}")

        # Verify user is an admin of the group
        admin_check = supabase_admin.table("group_members").select("is_admin").eq(
            "group_id", group_id
        ).eq("user_id", user_id_str).execute()

        if not admin_check.data or not admin_check.data[0].get("is_admin", False):
            raise HTTPException(
                status_code=403,
                detail="You must be an admin to update this group."
            )

        # Build update data
        update_data = {}
        if payload.group_name is not None:
            update_data["group_name"] = payload.group_name
        if payload.group_colour is not None:
            update_data["group_colour"] = payload.group_colour

        if not update_data:
            raise HTTPException(status_code=400, detail="No update fields provided.")

        # Update group
        result = supabase_admin.table("groups").update(update_data).eq("id", group_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Group not found.")

        updated_group = result.data[0]
        print(f"Group {group_id} updated successfully.")
        return GroupResponse(**updated_group)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_group: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "message": "An error occurred while updating the group."}
        )

@router.get("/api/groups/{group_id}/top-genre")
def group_top_genre(group_id: str, current_user=Depends(get_current_user)):
    """
    Compute the most 'liked' genre for a group.

    Rules:
      1) Count how many favourites each genre has across the group.
      2) Tiebreaker: lower average 'rank' wins (1 is best).
      3) Final tiebreaker: alphabetical by genre.

    Response example:
    {
      "group_id": "...",
      "top_genre": "Animation",
      "reason": {"count": 7, "avg_rank": 1.86},
      "breakdown": [
        {"genre": "Animation", "count": 7, "avg_rank": 1.86},
        {"genre": "Action",     "count": 5, "avg_rank": 2.40},
        ...
      ]
    }
    """
    # 0) must be a member
    mem_check = (
        supabase_admin.table("group_members")
        .select("user_id")
        .eq("group_id", group_id)
        .eq("user_id", str(current_user.id))
        .limit(1)
        .execute()
    )
    if not mem_check.data:
        raise HTTPException(status_code=403, detail="You are not a member of this group.")

    # 1) all member user_ids
    members_res = (
        supabase_admin.table("group_members")
        .select("user_id")
        .eq("group_id", group_id)
        .execute()
    )
    user_ids = [m["user_id"] for m in (members_res.data or [])]
    if not user_ids:
        return {"group_id": group_id, "top_genre": None, "reason": None, "breakdown": []}

    # 2) all favourites for those users (NOTE: table name is 'favourite_movies')
    favs_res = (
        supabase_admin.table("favourite_movies")
        .select("user_id,movie_id,rank")
        .in_("user_id", user_ids)
        .order("rank", desc=False)  # lowest rank is best
        .execute()
    )
    favs = favs_res.data or []
    if not favs:
        return {"group_id": group_id, "top_genre": None, "reason": None, "breakdown": []}

    # 3) movie metadata for those tmdb ids
    tmdb_ids = sorted({row["movie_id"] for row in favs})
    movies_res = (
        supabase_admin.table("movies")
        .select("tmdb_id,genre")
        .in_("tmdb_id", tmdb_ids)
        .execute()
    )
    movies = {m["tmdb_id"]: (m.get("genre") or "").strip() for m in (movies_res.data or [])}

    # 4) aggregate per-genre
    stats: Dict[str, Dict[str, Any]] = {}
    for row in favs:
        mid = row["movie_id"]
        genre = movies.get(mid, "")
        if not genre:
            continue
        if genre not in stats:
            stats[genre] = {"count": 0, "ranks": []}
        stats[genre]["count"] += 1
        # rank may be null; only include numeric ranks
        rnk = row.get("rank")
        if isinstance(rnk, (int, float)):
            stats[genre]["ranks"].append(float(rnk))

    if not stats:
        return {"group_id": group_id, "top_genre": None, "reason": None, "breakdown": []}

    # 5) compute avg_rank and choose winner
    breakdown: List[Dict[str, Any]] = []
    for g, s in stats.items():
        ranks = s["ranks"]
        avg_rank: Optional[float] = sum(ranks) / len(ranks) if ranks else None
        breakdown.append({"genre": g, "count": s["count"], "avg_rank": avg_rank})

    # sort: highest count desc, then lowest avg_rank asc (None treated as large), then genre asc
    def sort_key(item: Dict[str, Any]):
        avg = item["avg_rank"]
        avg_key = avg if avg is not None else 1e9
        return (-item["count"], avg_key, item["genre"] or "")

    breakdown.sort(key=sort_key)
    top = breakdown[0]
    return {
        "group_id": group_id,
        "top_genre": top["genre"],
        "reason": {"count": top["count"], "avg_rank": top["avg_rank"]},
        "breakdown": breakdown,
    }