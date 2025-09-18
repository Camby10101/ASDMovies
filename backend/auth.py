# auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import supabase, supabase_admin  # client já inicializado/validado

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

        # Ensure a profile exists for this authenticated user (idempotent)
        try:
            if supabase_admin is not None:
                user_id_str = str(user.id)
                found = (
                    supabase_admin
                    .table("profiles")
                    .select("user_id")
                    .eq("user_id", user_id_str)
                    .execute()
                )
                if not found.data:
                    # Create minimal profile record
                    supabase_admin.table("profiles").insert({
                        "user_id": user_id_str,
                        "email": getattr(user, "email", None),
                    }).execute()
            else:
                # Service role is not configured; skip auto-creation but keep auth working
                print("[auth] supabase_admin not configured; skipping profile auto-create.")
        except Exception as create_err:
            # Do not block the request if profile creation fails; just log
            print(f"[auth] Failed to ensure profile exists: {create_err}")

        return user
    except HTTPException:
        raise
    except Exception as e:
        print("Auth error:", repr(e))
        raise HTTPException(status_code=401, detail="Invalid token")
