# server/routers/user_routes.py (CORRECTED)
from fastapi import APIRouter, Depends, status, HTTPException
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

class GameIDs(BaseModel):
    """Schema for the game_ids jsonb column."""
    codm: Optional[str] = Field(None, example="PlayerTag#12345")
    valorant: Optional[str] = Field(None, example="ProGamer#EUW")
    # ... add more games

class SocialLinks(BaseModel):
    """Schema for the social_links jsonb column."""
    twitter: Optional[str] = Field(None, example="https://twitter.com/myhandle")
    discord: Optional[str] = Field(None, example="myhandle#0001")
    # ... add more social links

class UserProfileCreate(BaseModel):
    """Required fields for creating a new user profile."""
    username: str = Field(..., min_length=3, max_length=50, example="vinay9911")
    full_name: Optional[str] = Field(None, max_length=100, example="Vinay Sharma")
    photo_url: Optional[str] = Field(None, example="http://example.com/photo.jpg")
    game_ids: Optional[GameIDs] = GameIDs()
    social_links: Optional[SocialLinks] = SocialLinks()

class UserProfileUpdate(BaseModel):
    """Optional fields for updating a user profile."""
    username: Optional[str] = Field(None, min_length=3, max_length=50, example="vinay9911_new")
    full_name: Optional[str] = Field(None, max_length=100, example="Vinay Sharma")
    photo_url: Optional[str] = Field(None, example="http://example.com/newphoto.jpg")
    game_ids: Optional[GameIDs] = None
    social_links: Optional[SocialLinks] = None

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