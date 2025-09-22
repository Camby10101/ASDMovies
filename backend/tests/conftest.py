# backend/tests/conftest.py
import uuid
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# ✅ garante que o diretório "backend" esteja no sys.path
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app
from auth import get_current_user
from config import supabase_admin

class DummyUser:
    def __init__(self, id: str, email: str):
        self.id = id
        self.email = email
        self.user_metadata = {}

@pytest.fixture
def test_user_id() -> str:
    return f"test_user_{uuid.uuid4()}"

@pytest.fixture
def client(test_user_id: str):
    async def override_get_current_user():
        return DummyUser(id=test_user_id, email=f"{test_user_id}@example.com")

    app.dependency_overrides[get_current_user] = override_get_current_user
    c = TestClient(app)
    yield c

    # Limpeza (se houver service key)
    try:
        if supabase_admin:
            supabase_admin.table("blocked_users").delete().eq("user_id", test_user_id).execute()
            supabase_admin.table("privacy_settings").delete().eq("user_id", test_user_id).execute()
    except Exception as e:
        print("[tests] cleanup warning:", repr(e))

    app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def client_noauth():
    app.dependency_overrides.pop(get_current_user, None)
    return TestClient(app)
