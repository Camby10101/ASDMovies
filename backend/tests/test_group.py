def test_group_crud_flow(client):
    payload = {
        "group_colour": "#ff0000"
    }
    r = client.post("/api/groups", json=payload)
    assert r.status_code == 200
    group = r.json()
    assert "id" in group
    group_id = group["id"]
    assert group["group_colour"] == "#ff0000"

    r2 = client.get("/api/groups")
    assert r2.status_code == 200
    groups = r2.json()
    assert any(g["id"] == group_id for g in groups)

    r3 = client.get(f"/api/groups/{group_id}")
    assert r3.status_code == 200
    details = r3.json()
    assert details["id"] == group_id

    r4 = client.get(f"/api/groups/{group_id}/members")
    assert r4.status_code == 200
    members = r4.json()
    assert isinstance(members, list)
    assert any(m["group_id"] == group_id for m in members)

    update_payload = {"group_name": "Test Group Updated"}
    r5 = client.put(f"/api/groups/{group_id}", json=update_payload)
    assert r5.status_code == 200
    updated = r5.json()
    assert updated["group_name"] == "Test Group Updated"

    # --- Delete group (cleanup) ---
    # for now we'll just leave this part out:
    # r6 = client.delete(f"/api/groups/{group_id}")
    # assert r6.status_code == 200
 

def test_requires_auth(client_noauth):
    assert client_noauth.post("/api/groups", json={"group_colour": "#000"}).status_code in (401, 403)
    assert client_noauth.get("/api/groups").status_code in (401, 403)

