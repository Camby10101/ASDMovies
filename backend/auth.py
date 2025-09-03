from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import supabase # Import the initialized Supabase client

# Simple auth dependency using HTTP Bearer tokens
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the JWT from the Authorization header and returns the Supabase user.
    This function is used as a dependency in protected routes.
    """
    try:
        print(f"Validating token: {credentials.credentials[:20]}...")
        # Use the imported supabase client to validate the token
        user_response = supabase.auth.get_user(credentials.credentials)
        print(f"Auth response: {user_response}")
        
        if user_response.user is None:
            print("No user found in auth response")
            raise HTTPException(status_code=401, detail="Invalid token: User not found.")
        
        print(f"User authenticated: {user_response.user.id}")
        return user_response.user
    except Exception as e:
        # Catch any exception during token validation
        print(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
