from fastapi import APIRouter, HTTPException, status
from services.auth import create_new_user, sign_in_user, UserCredentials

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/signup")
async def signup(credentials: UserCredentials):
    """Endpoint to register a new user with email and password."""
    result = create_new_user(credentials)
    
    if result and result.user:
        # NOTE: By default, Supabase may require email confirmation.
        # The user object will exist, but the session will be None until confirmed.
        return {"message": "Signup successful. Please check your email to confirm.", "user_id": result.user.id}
    
    # The service layer now raises HTTPExceptions, so this is a fallback.
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create user.")


@router.post("/login")
async def login(credentials: UserCredentials):
    """Endpoint to log in a user with email and password."""
    result = sign_in_user(credentials)

    if result and result.session:
        return {
            "message": "Login successful",
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "user_id": result.user.id
        }
        
    # The service layer handles specific exceptions.
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
