# routes/recommendations_routes.py  (or groups_routes.py where you list members)
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from auth import get_current_user
from config import supabase_admin

router = APIRouter()

@router.get("/api/groups/{group_id}/members-debug")
def debug_group_members(group_id: str, current_user=Depends(get_current_user)):
    # ensure caller belongs to the group
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

    # fetch members
    members_res = (
        supabase_admin.table("group_members")
        .select("user_id,user_email,is_admin")
        .eq("group_id", group_id)
        .execute()
    )
    members = members_res.data or []

    # enrich emails from profiles where missing
    user_ids = [m["user_id"] for m in members]
    profiles_map: Dict[str, str] = {}
    if user_ids:
        prof_res = (
            supabase_admin.table("profiles")
            .select("user_id,email")
            .in_("user_id", user_ids)
            .execute()
        )
        for row in (prof_res.data or []):
            profiles_map[row["user_id"]] = row.get("email") or ""

    for m in members:
        if not m.get("user_email"):
            m["user_email"] = profiles_map.get(m["user_id"], "")

    # print
    print(f"[recommendations] Group {group_id} members ({len(members)}):")
    for m in members:
        email = m.get("user_email") or "(no email)"
        print(f" - {email} [{m['user_id']}] {'(admin)' if m.get('is_admin') else ''}")

    return {"group_id": group_id, "count": len(members), "members": members}
