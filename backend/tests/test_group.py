def test_update_group_upsert(client):
    payload = {
        "id": "709d7e7b-b709-4fae-902b-5f1932afd8c8",
        "creator_user_id": "f50b8e89-b65e-46b5-afdd-f8bea58e9504",
        "created_at": None,
        "group_colour": "#ff0000",
        "group_name": None,
    }

    # Upload fake group
    r = client.put("/api/groups", json=payload)
    assert r.status_code == 200
    data = r.json()
    for k, v in payload.items():
        assert data[k] == v

    # Verify the group exists
    r2 = client.get("/api/groups")
    assert r2.status_code == 200
    data2 = r2.json()
    # /api/groups returns a list of groups?
    group_ids = [g["id"] for g in data2]
    assert payload["id"] in group_ids

    # Remove the group
    r3 = client.delete(f"/api/groups/{payload['id']}")
    assert r3.status_code == 200

    # Verify the group was removed
    r4 = client.get("/api/groups")
    assert r4.status_code == 200
    data4 = r4.json()
    group_ids_after_delete = [g["id"] for g in data4]
    assert payload["id"] not in group_ids_after_delete

