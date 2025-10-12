# server/routers/user_routes.py (CORRECTED)
from fastapi import APIRouter, Depends, status, HTTPException, File, UploadFile
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from uuid import UUID
from gotrue import User
from utils.dependency import get_current_user
from services import users as user_service

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# --- Pydantic Models for Profile Data ---

class UserProfileCreate(BaseModel):
    """Required fields for creating a new user profile."""
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    photo_url: Optional[str] = None
    # UPDATED: Accept any string keys
    game_ids: Optional[Dict[str, str]] = {}
    social_links: Optional[Dict[str, str]] = {}

class UserProfileUpdate(BaseModel):
    """Optional fields for updating a user profile."""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    photo_url: Optional[str] = None
    # UPDATED: Accept any string keys
    game_ids: Optional[Dict[str, str]] = None
    social_links: Optional[Dict[str, str]] = None

class UserProfileResponse(BaseModel):
    """Full schema of the user profile stored in the database."""
    id: UUID
    username: str
    full_name: Optional[str]
    email: Optional[str]
    photo_url: Optional[str]
    game_ids: Dict[str, Any]
    social_links: Dict[str, Any]
    created_at: str 
    updated_at: str

# --- API Endpoints ---

@router.get("/me", response_model=Dict[str, Any])
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Fetches the profile of the currently authenticated user, combining
    auth data and the public.users profile data.
    """
    try:
        profile_data = user_service.get_user_profile(current_user.id)
        # Merge Supabase Auth data and public.users profile data
        return {
            "auth_user": current_user.dict(),
            "profile": profile_data
        }
    except HTTPException as e:
        # If profile not found (404), return only auth data and a flag for the frontend
        if e.status_code == status.HTTP_404_NOT_FOUND:
             return {
                "auth_user": current_user.dict(),
                "profile": None,
                "message": "User profile not created. Please complete your profile registration."
            }
        raise e # Re-raise other exceptions


@router.post("/profile", status_code=status.HTTP_201_CREATED, response_model=UserProfileResponse)
def create_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_user)
):
    """
    [CREATE] Creates the user's profile in the public.users table.
    This should be called only once after signup/login.
    """
    # Pydantic's .dict() performs recursive conversion, so manual nested calls are removed.
    data_to_create = profile_data.dict()

    return user_service.create_user_profile(
        user_id=current_user.id,
        profile_data=data_to_create
    )


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """
    [READ] Retrieves the complete user profile from the public.users table.
    """
    return user_service.get_user_profile(current_user.id)

@router.get("/profile/{username}", response_model=UserProfileResponse)
def get_public_profile(username: str):
    """
    [READ PUBLIC] Retrieves a user profile by their username.
    This endpoint does not require authentication.
    """
    return user_service.get_user_profile_by_username(username=username)

@router.post("/profile/avatar", response_model=Dict[str, str])
def upload_user_avatar(
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...)
):
    """
    [NEW LOGIC] Uploads an avatar to storage and returns the public URL.
    It does NOT save the URL to the database.
    """
    try:
        # 1. Upload the avatar file to Supabase Storage
        avatar_url = user_service.upload_avatar(user_id=current_user.id, file=file)

        if not avatar_url:
            raise HTTPException(status_code=500, detail="Could not retrieve public URL for avatar.")

        # 2. Simply return the URL to the frontend
        return {"message": "Avatar uploaded successfully", "photo_url": avatar_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected server error occurred during avatar processing.")


@router.put("/profile", response_model=UserProfileResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    [UPDATE] Updates the user's profile data in the public.users table.
    """
    # Use exclude_unset=True to only include fields provided by the user.
    # Pydantic's .dict(exclude_unset=True) handles recursive conversion.
    data_to_update = profile_data.dict(exclude_unset=True)
        
    return user_service.update_user_profile(
        user_id=current_user.id,
        update_data=data_to_update
    )


@router.delete("/profile", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(current_user: User = Depends(get_current_user)):
    """
    [DELETE] Deletes the user's profile from the public.users table (does NOT delete the auth user).
    """
    user_service.delete_user_profile(current_user.id)
    return