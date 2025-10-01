from config import supabase_admin
def test_update_group_upsert(client):
    #Create a new group
    payload_create = {
        "group_colour": "#ff0000"
    }

    r_create = client.post("/api/groups", json=payload_create)
    assert r_create.status_code == 200
    created_group = r_create.json()
    group_id = created_group["id"]

    assert created_group["group_colour"] == payload_create["group_colour"]
    assert created_group["creator_user_id"] is not None
    assert created_group["id"] == group_id

    payload_update = {
        "group_name": "Test Group Updated",
        "group_colour": "#00ff00"
    }

    r_update = client.put(f"/api/groups/{group_id}", json=payload_update)
    assert r_update.status_code == 200
    updated_group = r_update.json()
    assert updated_group["group_name"] == payload_update["group_name"]
    assert updated_group["group_colour"] == payload_update["group_colour"]
    assert updated_group["id"] == group_id

    r_list = client.get("/api/groups")
    assert r_list.status_code == 200
    groups = r_list.json()
    group_ids = [g["id"] for g in groups]
    assert group_id in group_ids

    # Optional cleanup: delete directly via supabase_admin if you want
    supabase_admin.table("groups").delete().eq("id", group_id).execute()
    supabase_admin.table("group_members").delete().eq("group_id", group_id).execute()

    # Step 4: Verify group is gone
    r_list_after_delete = client.get("/api/groups")
    assert r_list_after_delete.status_code == 200
    groups_after_delete = r_list_after_delete.json()
    group_ids_after_delete = [g["id"] for g in groups_after_delete]
    assert group_id not in group_ids_after_delete


