from datetime import datetime, timezone

def test_update_group_membership(client):
    payload = {
        "user_id": "f50b8e89-b65e-46b5-afdd-f8bea58e9504",
        "group_id": "65510ef0-ecfd-4423-8616-3d2c39d2c4f2",
        "is_admin": True,
        "joined_at": datetime.now(timezone.utc).isoformat(), 
        "user_email": "user@example.com",
    }

    r = client.put("/api/groups/membership", json=payload)
    assert r.status_code == 200
    data = r.json()
    for k, v in payload.items():
        assert data[k] == v

    r2 = client.get(f"/api/groups/{payload['group_id']}/members/{payload['user_id']}")
    assert r2.status_code == 200
    data2 = r2.json()
    for k, v in payload.items():
        assert data2[k] == v


def test_group_member_flow(client):
    group_id = "65510ef0-ecfd-4423-8616-3d2c39d2c4f2"
    user_email = "user@example.com"

    r0 = client.get(f"/api/groups/{group_id}/members")
    assert r0.status_code == 200
    assert isinstance(r0.json().get("members", []), list)

    # r1 = client.post(f"/api/groups/{group_id}/members", json={
    #     "user_email": user_email,
    #     "user_id": "50b807a3-e209-40c7-9651-26521589aa12",
    #     "is_admin": False,
    #     "joined_at": datetime.now(timezone.utc).isoformat()
    # })
    # assert r1.status_code == 200
    # assert user_email in [m["user_email"] for m in r1.json()["members"]]

    # r1b = client.post(f"/api/groups/{group_id}/members", json={
    #     "user_email": user_email,
    #     "user_id": "50b807a3-e209-40c7-9651-26521589aa12",
    #     "is_admin": False,
    #     "joined_at": datetime.now(timezone.utc).isoformat()
    # })
    # assert r1b.status_code == 200
    # members = [m["user_email"] for m in r1b.json()["members"]]
    # assert members.count(user_email) == 1

    r2 = client.get(f"/api/groups/{group_id}/members")
    assert r2.status_code == 200
    assert user_email in [m["user_email"] for m in r2.json()["members"]]

    r3 = client.delete(f"/api/groups/{group_id}/members/{user_email}")
    assert r3.status_code == 200
    assert user_email not in [m["user_email"] for m in r3.json()["members"]]


def test_requires_auth_for_groups(client_noauth):
    group_id = "group123"
    assert client_noauth.get(f"/api/groups/{group_id}/members").status_code in (401, 403)
    assert client_noauth.put("/api/groups/membership", json={}).status_code in (401, 403)
    assert client_noauth.post(f"/api/groups/{group_id}/members", json={"user_email": "x"}).status_code in (401, 403)
    assert client_noauth.delete(f"/api/groups/{group_id}/members/x").status_code in (401, 403)
