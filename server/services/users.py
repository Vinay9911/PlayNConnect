# server/services/users.py
from fastapi import HTTPException, status
from uuid import UUID
from typing import Dict, Any, Optional
from datetime import datetime

from utils.supabase import supabase_client

# Note: Using Dict[str, Any] as a flexible type hint for data structure in service layer
UserProfileData = Dict[str, Any]

# --- CRUD Operations ---

def create_user_profile(user_id: UUID, profile_data: UserProfileData) -> dict:
    """Inserts a new user profile into the public.users table."""
    
    insert_data = {
        "id": str(user_id),
        "username": profile_data["username"],
        "full_name": profile_data.get("full_name"),
        "photo_url": profile_data.get("photo_url"),
        # Ensure game_ids and social_links are properly formatted JSON/Dicts
        "game_ids": profile_data.get("game_ids", {}),
        "social_links": profile_data.get("social_links", {}),
    }

    try:
        response = supabase_client.table('users').insert(insert_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create user profile, check for unique constraint violations (username)."
            )
            
        return response.data[0]
        
    except Exception as e:
        if "duplicate key value violates unique constraint" in str(e):
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}"
        )


def get_user_profile(user_id: UUID) -> dict:
    """Retrieves a user's profile from the public.users table."""
    try:
        # Use single() for retrieving one row by primary key (id)
        response = supabase_client.table('users').select("*").eq('id', str(user_id)).single().execute()
        
        if not response.data:
            # If no rows found, Supabase client will throw an exception
            pass
            
        return response.data
        
    except Exception as e:
        # Check for the specific error indicating no row was found (i.e., new user)
        if "rows returned" in str(e) and "zero" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found. Please complete your profile registration."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}"
        )


def update_user_profile(user_id: UUID, update_data: UserProfileData) -> dict:
    """Updates a user's profile in the public.users table."""
    
    # Set updated_at timestamp
    update_data['updated_at'] = datetime.utcnow().isoformat()

    try:
        response = supabase_client.table('users') \
            .update(update_data) \
            .eq('id', str(user_id)) \
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found or no data was changed."
            )
            
        return response.data[0]
        
    except Exception as e:
        if "duplicate key value violates unique constraint" in str(e):
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}"
        )


def delete_user_profile(user_id: UUID) -> bool:
    """Deletes a user's profile from the public.users table."""
    try:
        response = supabase_client.table('users') \
            .delete() \
            .eq('id', str(user_id)) \
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found."
            )
            
        return True
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}"
        )