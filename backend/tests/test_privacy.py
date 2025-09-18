# backend/tests/conftest.py
import uuid
import pytest
from fastapi.testclient import TestClient

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
    # user_id exclusivo por teste (evita interferência)
    return f"test_user_{uuid.uuid4()}"

@pytest.fixture
def client(test_user_id: str):
    """
    Client autenticado (override da dependência get_current_user).
    Também garante limpeza dos dados do usuário de teste ao final.
    """
    # override do auth para simular usuário logado
    async def override_get_current_user():
        return DummyUser(id=test_user_id, email=f"{test_user_id}@example.com")

    app.dependency_overrides[get_current_user] = override_get_current_user
    c = TestClient(app)

    yield c

    # --- limpeza dos dados do teste (se houver service role) ---
    try:
        if supabase_admin:
            supabase_admin.table("blocked_users").delete().eq("user_id", test_user_id).execute()
            supabase_admin.table("privacy_settings").delete().eq("user_id", test_user_id).execute()
    except Exception as e:
        # Em ambiente sem service key, ignore a limpeza
        print("[tests] cleanup warning:", repr(e))

    # remove override
    app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def client_noauth():
    """
    Client sem override de auth, para testar 401/403.
    """
    # garante que não há override ativo
    app.dependency_overrides.pop(get_current_user, None)
    c = TestClient(app)
    return c
