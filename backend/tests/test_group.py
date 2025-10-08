from config import supabase_admin

def test_update_group_upsert(client):
    creator_user_id = "f50b8e89-b65e-46b5-afdd-f8bea58e9504" 

    # Create new group
    payload_create = {
        "creator_user_id": creator_user_id,
        "group_colour": "#ff0000",
        "group_name": "Test Group"
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



