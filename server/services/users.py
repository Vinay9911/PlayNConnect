# server/services/users.py
import logging
import os
from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID

from fastapi import HTTPException, status, UploadFile
from utils.supabase import supabase_client

# Set up a logger for this module
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- CRUD Operations ---

def create_user_profile(user_id: UUID, profile_data: Dict[str, Any]) -> dict:
    """Inserts a new user profile into the public.users table."""
    logger.info(f"Attempting to create profile for user_id: {user_id}")
    
    insert_data = {
        "id": str(user_id),
        "username": profile_data["username"],
        "full_name": profile_data.get("full_name"),
        "photo_url": profile_data.get("photo_url"),
        "game_ids": profile_data.get("game_ids", {}),
        "social_links": profile_data.get("social_links", {}),
    }

    try:
        response = supabase_client.table('users').insert(insert_data).execute()
        
        if not response.data:
            logger.warning(f"Profile creation failed for user_id: {user_id}. No data returned from Supabase.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create user profile."
            )
            
        logger.info(f"Successfully created profile for user_id: {user_id}")
        return response.data[0]
        
    except Exception as e:
        logger.exception(f"Error creating profile for user_id: {user_id}. Details: {e}")
        if "duplicate key value violates unique constraint" in str(e):
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during profile creation."
        )


def get_user_profile(user_id: UUID) -> dict:
    """Retrieves a user's profile from the public.users table by their ID."""
    logger.info(f"Attempting to get profile for user_id: {user_id}")
    try:
        response = supabase_client.table('users').select("*").eq('id', str(user_id)).execute()
        
        if not response.data:
            logger.warning(f"Profile not found for user_id: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found."
            )
        
        logger.info(f"Successfully found profile for user_id: {user_id}")
        return response.data[0]
        
    except HTTPException as e:
        raise e # Re-raise known HTTP exceptions
    except Exception as e:
        logger.exception(f"Error getting profile for user_id: {user_id}. Details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching the profile."
        )

def get_user_profile_by_username(username: str) -> dict:
    """Retrieves a user's profile by their unique username."""
    logger.info(f"Attempting to get profile for username: {username}")
    try:
        response = supabase_client.table('users').select("*").eq('username', username).execute()
        
        if not response.data:
            logger.warning(f"Profile not found for username: {username}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found."
            )
        
        logger.info(f"Successfully found profile for username: {username}")
        return response.data[0]
        
    except Exception as e:
        logger.exception(f"Error getting profile for username: {username}. Details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching the profile."
        )
        
def search_users_by_username(query: str, current_user_id: UUID) -> List[dict]:
    """Searches for users by username using full-text search."""
    logger.info(f"Searching for users with username matching: {query}")
    try:
        # Use 'plfts' for plain text search which is safer
        # The ':*' tells postgres to do a prefix search (e.g., 'Team' matches 'TeamMate')
        response = supabase_client.table('users').select("id, username, photo_url") \
            .neq('id', str(current_user_id)) \
            .limit(10) \
            .text_search('username', f"{query}:*") \
            .execute()
        
        if not response.data:
            return []
            
        return response.data
        
    except Exception as e:
        logger.exception(f"Error searching for users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while searching for users."
        )

def update_user_profile(user_id: UUID, update_data: Dict[str, Any]) -> dict:
    """Updates a user's profile in the public.users table."""
    logger.info(f"Attempting to update profile for user_id: {user_id} with data: {update_data}")
    
    update_data['updated_at'] = datetime.utcnow().isoformat()

    try:
        response = supabase_client.table('users').update(update_data).eq('id', str(user_id)).execute()
            
        if not response.data:
            logger.warning(f"Profile update for user_id {user_id} returned no data. Profile may not exist or data was unchanged.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found or no data was changed."
            )
            
        logger.info(f"Successfully updated profile for user_id: {user_id}")
        return response.data[0]
        
    except Exception as e:
        logger.exception(f"Error updating profile for user_id: {user_id}. Details: {e}")
        if "duplicate key value violates unique constraint" in str(e):
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during profile update."
        )

def upload_avatar(user_id: UUID, file: UploadFile) -> str:
    """Uploads an avatar to storage and returns the public URL."""
    logger.info(f"Attempting to upload avatar for user_id: {user_id}")
    try:
        file_ext = os.path.splitext(file.filename)[1]
        path = f"public/{user_id}{file_ext}"
        file_content = file.file.read()

        logger.info(f"Uploading file to storage path: {path}")
        supabase_client.storage.from_('avatars').upload(
            path=path,
            file=file_content,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
        logger.info("File uploaded successfully to storage.")

        logger.info("Getting public URL for the uploaded avatar.")
        response = supabase_client.storage.from_('avatars').get_public_url(path)
        logger.info(f"Successfully retrieved public URL: {response}")
        
        return response

    except Exception as e:
        logger.exception(f"Error uploading avatar for user_id: {user_id}. Details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
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