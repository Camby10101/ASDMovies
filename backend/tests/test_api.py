# A testing file to try and ping supabase endpoints, may need to adjust some stuff
import pytest
from httpx import AsyncClient
from main import app
from config import supabase_admin
from fastapi import Depends

#Not actual users just needed to ping
TEST_USER_ID = "test-user-123"
TEST_FRIEND_ID = "friend-user-456"
TEST_GROUP_ID = None

# Creates a mock user and then attempts to ping the database
class MockUser:
    def __init__(self, id: str):
        self.id = id

async def override_get_current_user():
    return MockUser(TEST_USER_ID)

app.dependency_overrides = {}
from auth import get_current_user
app.dependency_overrides[get_current_user] = override_get_current_user


@pytest.fixture(scope="module", autouse=True)
def seed_test_data():
    """Seed database with profiles, friendlist, and group, then cleanup."""
    supabase_admin.table("profiles").upsert(
        {"user_id": TEST_USER_ID, "email": "test@example.com"}
    ).execute()
    supabase_admin.table("profiles").upsert(
        {"user_id": TEST_FRIEND_ID, "email": "friend@example.com"}
    ).execute()

    fl = supabase_admin.table("friendlists").upsert(
        {"owner_user_id": TEST_USER_ID}
    ).execute()
    friendlist_id = fl.data[0]["id"]

    supabase_admin.table("friendlist_members").upsert(
        {"friend_list_id": friendlist_id, "member_user_id": TEST_FRIEND_ID}
    ).execute()

    g = supabase_admin.table("groups").insert(
        {"creator_user_id": TEST_USER_ID, "group_colour": "#123456"}
    ).execute()
    group_id = g.data[0]["id"]

    supabase_admin.table("group_members").insert(
        {"user_id": TEST_USER_ID, "group_id": group_id, "is_admin": True}
    ).execute()
    supabase_admin.table("group_members").insert(
        {"user_id": TEST_FRIEND_ID, "group_id": group_id, "is_admin": False}
    ).execute()

    global TEST_GROUP_ID
    TEST_GROUP_ID = group_id

    yield

    supabase_admin.table("group_members").delete().eq("group_id", group_id).execute()
    supabase_admin.table("groups").delete().eq("id", group_id).execute()
    supabase_admin.table("friendlist_members").delete().eq("friend_list_id", friendlist_id).execute()
    supabase_admin.table("friendlists").delete().eq("id", friendlist_id).execute()
    supabase_admin.table("profiles").delete().eq("user_id", TEST_USER_ID).execute()
    supabase_admin.table("profiles").delete().eq("user_id", TEST_FRIEND_ID).execute()


@pytest.mark.asyncio
async def test_friends_endpoint_success():
    """Ensure /api/friends returns 200 and includes friend."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/friends")
        assert response.status_code == 200
        body = response.json()
        assert "friends" in body
        assert any(f["user_id"] == TEST_FRIEND_ID for f in body["friends"])


@pytest.mark.asyncio
async def test_group_members_endpoint_success():
    """Ensure /api/groups/{id}/members returns 200 and includes both members."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get(f"/api/groups/{TEST_GROUP_ID}/members")
        assert response.status_code == 200
        members = response.json()
        assert any(m["user_id"] == TEST_USER_ID for m in members)
        assert any(m["user_id"] == TEST_FRIEND_ID for m in members)
