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
from typing import Dict, Any, Set


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

@router.get("/api/groups/{group_id}/members-with-favorites")
async def members_with_favorites(group_id: str, current_user=Depends(get_current_user)):
    """
    Returns all members of a group with their favorite movie IDs (and rank if present).
    Only accessible by group members.

    Response example:
    [
      {
        "user_id": "...",
        "user_email": "a@b.com",
        "favorites": [603, 680, 13],
        "favorites_with_rank": [{"movie_id": 603, "rank": 1}, ...]
      },
      ...
    ]
    """
    # 1) Caller must belong to the group
    mem_check = supabase_admin.table("group_members") \
        .select("user_id") \
        .eq("group_id", group_id) \
        .eq("user_id", str(current_user.id)) \
        .limit(1) \
        .execute()
    if not mem_check.data:
        raise HTTPException(status_code=403, detail="You are not a member of this group.")

    # 2) Fetch members (prefer stored user_email; fallback to profiles.email if present)
    members_res = supabase_admin.table("group_members") \
        .select("user_id,user_email,profiles(email)") \
        .eq("group_id", group_id) \
        .execute()
    members = members_res.data or []
    if not members:
        return []

    # normalize email and build user list
    user_rows: Dict[str, Dict[str, Any]] = {}
    user_ids = []
    for m in members:
        uid = m["user_id"]
        email = m.get("user_email") or (m.get("profiles") or {}).get("email")
        user_rows[uid] = {
            "user_id": uid,
            "user_email": email,
            "favorites": [],
            "favorites_with_rank": [],
        }
        user_ids.append(uid)

    # 3) Fetch all favorites for those users (order by rank if your table has it)
    favs_res = supabase_admin.table("favourite_movies") \
        .select("user_id,movie_id,rank") \
        .in_("user_id", user_ids) \
        .order("rank", desc=False) \
        .execute()
    favorites = favs_res.data or []

    # 4) Group favorites by user
    for row in favorites:
        uid = row["user_id"]
        if uid in user_rows:
            user_rows[uid]["favorites"].append(row["movie_id"])
            user_rows[uid]["favorites_with_rank"].append({
                "movie_id": row["movie_id"],
                "rank": row.get("rank"),
            })

    # 5) stable sort by email then id (optional)
    out = list(user_rows.values())
    out.sort(key=lambda r: ((r["user_email"] or "").lower(), r["user_id"]))
    return out


@router.get("/api/groups/{group_id}/members-genres")
def members_genres(group_id: str, current_user=Depends(get_current_user)):
    """
    Return, for each group member: user_id and the unique set of genres
    from their favourite movies.

    Response:
    [
      {"user_id": "uuid-1", "genres": ["Horror", "Action"]},
      {"user_id": "uuid-2", "genres": []},
      ...
    ]
    """

    # 1) Guard: requester must be in the group
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

    # 2) Get all members
    members_res = (
        supabase_admin.table("group_members")
        .select("user_id")
        .eq("group_id", group_id)
        .execute()
    )
    members = members_res.data or []
    if not members:
        return []

    user_ids = [m["user_id"] for m in members]

    # 3) Get favourites for those members
    favs_res = (
        supabase_admin.table("favourite_movies")
        .select("user_id,movie_id,rank")
        .in_("user_id", user_ids)
        .order("rank", desc=False)   # ✅ ascending = desc=False
        .execute()
    )
    favs = favs_res.data or []
    if not favs:
        # no favourites yet: everyone has empty genres
        return [{"user_id": uid, "genres": []} for uid in user_ids]

    # 4) Look up genres for the favourite movie_ids
    tmdb_ids = sorted({row["movie_id"] for row in favs})
    genres_by_tmdb: Dict[int, str] = {}
    if tmdb_ids:
        movies_res = (
            supabase_admin.table("movies")
            .select("tmdb_id,genre")
            .in_("tmdb_id", tmdb_ids)
            .execute()
        )
        for mv in (movies_res.data or []):
            genres_by_tmdb[mv["tmdb_id"]] = mv.get("genre")

    # 5) Build user -> unique genres
    user_genres: Dict[str, Set[str]] = {uid: set() for uid in user_ids}
    for row in favs:
        uid = row["user_id"]
        mid = row["movie_id"]
        g = genres_by_tmdb.get(mid)
        if g:  # ignore null/empty
            user_genres[uid].add(g)

    # 6) Shape response
    out: List[Dict[str, Any]] = [
        {"user_id": uid, "genres": sorted(list(gen_set))}
        for uid, gen_set in user_genres.items()
    ]
    # Optional: consistent order by user_id
    out.sort(key=lambda r: r["user_id"])
    return out

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

@router.get("/api/groups/{group_id}/top-genre")
def group_top_genre(group_id: str, current_user=Depends(get_current_user)):
    """
    Retorna o gênero mais 'querido' pelo grupo.

    Regra:
      1) Contamos quantas vezes cada gênero aparece entre os filmes favoritos dos membros do grupo.
      2) Empate por contagem é decidido pela menor média de rank (rank 1 é melhor que 2, etc.).
      3) Se ainda empatar, ordena alfabeticamente.

    Response:
    {
      "group_id": "...",
      "top_genre": "Animation" | null,
      "reason": {
        "counts": {"Animation": 5, "Horror": 3, ...},
        "avg_rank": {"Animation": 1.6, "Horror": 2.3, ...},
        "total_favourites": 12,
        "members_considered": 3
      }
    }
    """
    # 1) Verifica se o requester é membro do grupo
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

    # 2) Busca todos os membros
    members_res = (
        supabase_admin.table("group_members")
        .select("user_id")
        .eq("group_id", group_id)
        .execute()
    )
    members = members_res.data or []
    if not members:
        return {
            "group_id": group_id,
            "top_genre": None,
            "reason": {"counts": {}, "avg_rank": {}, "total_favourites": 0, "members_considered": 0},
        }

    user_ids = [m["user_id"] for m in members]

    # 3) Favoritos desses membros (usa a tabela "favourite_movies")
    favs_res = (
        supabase_admin.table("favourite_movies")
        .select("user_id,movie_id,rank")
        .in_("user_id", user_ids)
        .order("rank", desc=False)  # ascendente
        .execute()
    )
    favs = favs_res.data or []
    if not favs:
        return {
            "group_id": group_id,
            "top_genre": None,
            "reason": {"counts": {}, "avg_rank": {}, "total_favourites": 0, "members_considered": len(user_ids)},
        }

    # 4) Puxa gêneros dos filmes na tabela `movies` (chave = tmdb_id)
    tmdb_ids = sorted({row["movie_id"] for row in favs})
    genres_by_tmdb: Dict[int, str] = {}
    if tmdb_ids:
        movies_res = (
            supabase_admin.table("movies")
            .select("tmdb_id,genre")
            .in_("tmdb_id", tmdb_ids)
            .execute()
        )
        for mv in (movies_res.data or []):
            genres_by_tmdb[mv["tmdb_id"]] = mv.get("genre")

    # 5) Agrega contagem e estatísticas de rank por gênero
    counts: Dict[str, int] = {}
    rank_sum: Dict[str, float] = {}
    rank_n: Dict[str, int] = {}

    for row in favs:
        g = genres_by_tmdb.get(row["movie_id"])
        if not g:
            continue
        counts[g] = counts.get(g, 0) + 1
        if row.get("rank") is not None:
            rank_sum[g] = rank_sum.get(g, 0.0) + float(row["rank"])
            rank_n[g] = rank_n.get(g, 0) + 1

    if not counts:
        return {
            "group_id": group_id,
            "top_genre": None,
            "reason": {"counts": {}, "avg_rank": {}, "total_favourites": len(favs), "members_considered": len(user_ids)},
        }

    # 6) Calcula média de rank por gênero (se não houver rank para algum gênero, tratamos como +inf na comparação)
    avg_rank = {
        g: (rank_sum[g] / rank_n[g]) if rank_n.get(g) else float("inf")
        for g in counts.keys()
    }

    # 7) Escolhe o campeão: maior contagem, depois menor média de rank, depois ordem alfabética
    top_genre = sorted(counts.keys(), key=lambda g: (-counts[g], avg_rank[g], g))[0]

    return {
        "group_id": group_id,
        "top_genre": top_genre,
        "reason": {
            "counts": counts,
            "avg_rank": {g: (None if avg_rank[g] == float("inf") else avg_rank[g]) for g in avg_rank},
            "total_favourites": len(favs),
            "members_considered": len(user_ids),
        },
    }
    
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
