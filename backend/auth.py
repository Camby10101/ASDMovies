# auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import supabase  # client já inicializado/validado

security = HTTPBearer()  # retorna 403 se não houver Authorization

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Valida o JWT (Authorization: Bearer <token>) no Supabase e retorna o usuário.
    """
    try:
        token = credentials.credentials
        print(f"Validating token: {token[:20]}...")

        resp = supabase.auth.get_user(token)  # UserResponse
        user = getattr(resp, "user", None)

        if user is None:
            err = getattr(resp, "error", None)
            print("Auth failed. SDK response:", err or resp)
            raise HTTPException(status_code=401, detail="Invalid token")

        print(f"User authenticated: {user.id}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        print("Auth error:", repr(e))
        raise HTTPException(status_code=401, detail="Invalid token")
