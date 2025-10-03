from config import supabase_admin
import pytest

def test_create_group(client):
    """
    Test creating a new group via POST /api/groups.
    Verifies that:
    - Group is created successfully with correct data
    - Creator is automatically added as an admin member
    - Response includes all expected fields
    """
    creator_user_id = "f50b8e89-b65e-46b5-afdd-f8bea58e9504"

    # Create new group
    payload_create = {
        "group_name": "Test Group for Create",
        "group_colour": "#ff0000"
    }

    r_create = client.post("/api/groups", json=payload_create)
    assert r_create.status_code == 200, r_create.text
    created_group = r_create.json()
    group_id = created_group["id"]

    # Verify group data
    assert created_group["group_name"] == payload_create["group_name"]
    assert created_group["group_colour"] == payload_create["group_colour"]
    assert created_group["creator_user_id"] == creator_user_id
    assert "created_at" in created_group
    assert created_group["id"] == group_id

    # Verify creator was added as admin member
    members_check = supabase_admin.table("group_members").select("*").eq("group_id", group_id).eq("user_id", creator_user_id).execute()
    assert len(members_check.data) == 1
    assert members_check.data[0]["is_admin"] == True

    # Cleanup
    supabase_admin.table("group_members").delete().eq("group_id", group_id).execute()
    supabase_admin.table("groups").delete().eq("id", group_id).execute()

    # Verify deletion
    deleted_check = supabase_admin.table("groups").select("id").eq("id", group_id).execute()
    assert deleted_check.data == []


def test_create_group_with_minimal_data(client):
    """
    Test creating a group with minimal data (no name or colour).
    """
    creator_user_id = "f50b8e89-b65e-46b5-afdd-f8bea58e9504"

    payload = {}

    r_create = client.post("/api/groups", json=payload)
    assert r_create.status_code == 200, r_create.text
    created_group = r_create.json()
    group_id = created_group["id"]

    # Verify group was created with None values
    assert created_group["group_name"] is None
    assert created_group["group_colour"] is None
    assert created_group["creator_user_id"] == creator_user_id

    # Cleanup
    supabase_admin.table("group_members").delete().eq("group_id", group_id).execute()
    supabase_admin.table("groups").delete().eq("id", group_id).execute()


def test_list_groups_empty(client):
    """
    Test listing groups when user has no groups.
    Should return an empty list.
    """
    creator_user_id = "f50b8e89-b65e-46b5-afdd-f8bea58e9504"

    # Clean up any existing groups first
    existing_members = supabase_admin.table("group_members").select("group_id").eq("user_id", creator_user_id).execute()
    for member in existing_members.data:
        supabase_admin.table("group_members").delete().eq("group_id", member["group_id"]).execute()
        supabase_admin.table("groups").delete().eq("id", member["group_id"]).execute()

    # List groups
    r_list = client.get("/api/groups")
    assert r_list.status_code == 200, r_list.text
    groups = r_list.json()
    assert isinstance(groups, list)
    assert len(groups) == 0


def test_list_groups_with_groups(client):
    """
    Test listing groups when user is a member of multiple groups.
    Verifies that all groups where the user is a member are returned.
    """
    creator_user_id = "f50b8e89-b65e-46b5-afdd-f8bea58e9504"
    
    # Clean up any existing groups first
    existing_members = supabase_admin.table("group_members").select("group_id").eq("user_id", creator_user_id).execute()
    for member in existing_members.data:
        supabase_admin.table("group_members").delete().eq("group_id", member["group_id"]).execute()
        supabase_admin.table("groups").delete().eq("id", member["group_id"]).execute()

    # Create multiple groups
    created_group_ids = []
    for i in range(3):
        payload = {
            "group_name": f"Test Group {i+1}",
            "group_colour": f"#{'0' * (5-i)}{i+1}"
        }
        r_create = client.post("/api/groups", json=payload)
        assert r_create.status_code == 200
        created_group = r_create.json()
        created_group_ids.append(created_group["id"])

    # List groups
    r_list = client.get("/api/groups")
    assert r_list.status_code == 200, r_list.text
    groups = r_list.json()
    
    # Verify response
    assert isinstance(groups, list)
    assert len(groups) == 3
    
    returned_group_ids = [g["id"] for g in groups]
    for group_id in created_group_ids:
        assert group_id in returned_group_ids

    # Verify each group has correct structure
    for group in groups:
        assert "id" in group
        assert "creator_user_id" in group
        assert "created_at" in group
        assert "group_name" in group
        assert "group_colour" in group
        assert group["creator_user_id"] == creator_user_id

    # Cleanup
    for group_id in created_group_ids:
        supabase_admin.table("group_members").delete().eq("group_id", group_id).execute()
        supabase_admin.table("groups").delete().eq("id", group_id).execute()


def test_update_group_upsert(client):
    """
    Legacy test - kept for backward compatibility.
    Tests creating a group and basic verification.
    """
    creator_user_id = "f50b8e89-b65e-46b5-afdd-f8bea58e9504" 

    # Create new group
    payload_create = {
        "group_name": "Test Group",
        "group_colour": "#ff0000"
    }

    r_create = client.post("/api/groups", json=payload_create)
    assert r_create.status_code == 200, r_create.text
    created_group = r_create.json()
    group_id = created_group["id"]

    assert created_group["group_colour"] == payload_create["group_colour"]
    assert created_group["creator_user_id"] == creator_user_id
    assert created_group["id"] == group_id

    # Delete
    supabase_admin.table("group_members").delete().eq("group_id", group_id).execute()
    supabase_admin.table("groups").delete().eq("id", group_id).execute()

    # Verify
    deleted_check = supabase_admin.table("groups").select("id").eq("id", group_id).execute()
    assert deleted_check.data == []



