# server/routers/user_routes.py
from fastapi import APIRouter, Depends
from gotrue import User
from utils.dependency import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me", response_model=dict)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Fetches the profile of the currently authenticated user.
    The `get_current_user` dependency ensures this endpoint is protected.
    """
    # The `current_user` object contains all user data from Supabase
    # We convert it to a dict to make it JSON-serializable.
    return current_user.dict()