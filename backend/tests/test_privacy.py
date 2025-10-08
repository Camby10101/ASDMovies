# tests/test_privacy.py

def test_update_privacy_upsert(client):
    payload = {
        "profile_visibility": "friends",
        "allow_friend_requests": False,
        "show_activity": False,
        "show_favorites_to": "only_me",
        "allow_tagging": False,
    }
    r = client.put("/api/privacy", json=payload)
    assert r.status_code == 200
    data = r.json()
    for k, v in payload.items():
        assert data[k] == v

    # fetch again to ensure persistence
    r2 = client.get("/api/privacy")
    assert r2.status_code == 200
    data2 = r2.json()
    for k, v in payload.items():
        assert data2[k] == v


def test_blocklist_flow(client):
    # starts empty (or returns a list)
    r0 = client.get("/api/privacy/blocklist")
    assert r0.status_code == 200
    assert isinstance(r0.json().get("blocked_users", []), list)

    # add
    r1 = client.post("/api/privacy/block", json={"user": "ann@example.com"})
    assert r1.status_code == 200
    assert "ann@example.com" in r1.json()["blocked_users"]

    # idempotent add
    r1b = client.post("/api/privacy/block", json={"user": "ann@example.com"})
    assert r1b.status_code == 200
    assert r1b.json()["blocked_users"].count("ann@example.com") == 1

    # list
    r2 = client.get("/api/privacy/blocklist")
    assert r2.status_code == 200
    assert "ann@example.com" in r2.json()["blocked_users"]

    # remove
    r3 = client.delete("/api/privacy/block/ann@example.com")
    assert r3.status_code == 200
    assert "ann@example.com" not in r3.json()["blocked_users"]


def test_requires_auth(client_noauth):
    assert client_noauth.get("/api/privacy").status_code in (401, 403)
    assert client_noauth.put("/api/privacy", json={}).status_code in (401, 403)
    assert client_noauth.get("/api/privacy/blocklist").status_code in (401, 403)
    assert client_noauth.post("/api/privacy/block", json={"user": "x"}).status_code in (401, 403)
    assert client_noauth.delete("/api/privacy/block/x").status_code in (401, 403)
