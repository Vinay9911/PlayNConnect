from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr
from gotrue.errors import AuthApiError

from utils.supabase import supabase_client

# Pydantic model for user credentials for email/password auth
class UserCredentials(BaseModel):
    email: EmailStr
    password: str

# REMOVED async from this function definition
def create_new_user(credentials: UserCredentials):
    """Signs up a new user in Supabase using email and password."""
    try:
        # REMOVED await from this call
        session = supabase_client.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password,
        })
        return session
    except AuthApiError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# REMOVED async from this function definition
def sign_in_user(credentials: UserCredentials):
    """Signs in an existing user in Supabase using email and password."""
    try:
        # REMOVED await from this call
        session = supabase_client.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password,
        })
        return session
    except AuthApiError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def verify_user_token(jwt_token: str):
    """
    Verifies any valid Supabase JWT token. This function was already correct.
    """
    try:
        user_data = supabase_client.auth.get_user(jwt=jwt_token)
        return user_data.user
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e.message}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

