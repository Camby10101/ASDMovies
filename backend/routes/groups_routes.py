# groups_routes.py
from fastapi import APIRouter, Depends, HTTPException
import traceback
import logging

# Import dependencies from our modular files
from auth import get_current_user
from config import supabase_admin

from typing import List, Optional
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
        
        # Add the creator as an admin member
        member_data = {
            "user_id": user_id_str,
            "group_id": group_id,
            "is_admin": True
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
        
        # Get all members of the group
        result = supabase_admin.table("group_members").select("*").eq("group_id", group_id).execute()
        
        if not result.data:
            return []
        
        members = [GroupMemberResponse(**member) for member in result.data]
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
        
        # Add the new member
        member_data = {
            "user_id": payload.user_id,
            "group_id": group_id,
            "is_admin": False
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
