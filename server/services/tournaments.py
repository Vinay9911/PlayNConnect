import logging
from uuid import UUID
from datetime import datetime
import re
import random

from fastapi import HTTPException, status, UploadFile
from datetime import timedelta
import os
from utils.supabase import supabase_client

logger = logging.getLogger(__name__)

def _generate_slug(name: str) -> str:
    """Generates a URL-friendly slug from a string."""
    s = name.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    s = re.sub(r'^-+|-+$', '', s)
    # Add a random number to ensure uniqueness, in case two tournaments have the same name
    random_suffix = random.randint(100, 999)
    return f"{s}-{random_suffix}"

def _check_permission(tournament_id: UUID, user_id: UUID, allowed_roles: list = ['owner', 'admin']):
    """Checks if a user has the required role for a tournament."""
    try:
        response = supabase_client.table('tournament_organizers').select('role').eq('tournament_id', str(tournament_id)).eq('user_id', str(user_id)).single().execute()
        if response.data and response.data['role'] in allowed_roles:
            return True
        return False
    except Exception:
        return False

def create_new_tournament(tournament_data: dict, user_id: UUID) -> dict:
    """Inserts a new tournament and creates the owner relationship."""
    logger.info(f"Creating tournament for user_id: {user_id}")
    slug = _generate_slug(tournament_data['name'])
    tournament_data['slug'] = slug
    tournament_data.pop('organizers', None)

    try:
        response = supabase_client.table('tournaments').insert(tournament_data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Could not create tournament.")
        
        new_tournament = response.data[0]
        tournament_id = new_tournament['id']
        logger.info(f"Successfully created tournament with id: {tournament_id}")

        organizer_data = {
            "tournament_id": tournament_id,
            "user_id": str(user_id),
            "role": "owner"
        }
        organizer_response = supabase_client.table('tournament_organizers').insert(organizer_data).execute()
        if not organizer_response.data:
            logger.error(f"Failed to create organizer link for tournament_id: {tournament_id}")
            raise HTTPException(status_code=500, detail="Tournament created, but failed to assign owner.")

        logger.info(f"Successfully assigned owner for tournament_id: {tournament_id}")
        return new_tournament
    except Exception as e:
        logger.exception(f"Error during tournament creation: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

def get_tournament_by_slug(slug: str) -> dict:
    """Retrieves a tournament and its organizers by its public slug."""
    logger.info(f"Fetching tournament by slug: {slug}")
    try:
        # Use a relational query to get the tournament and its organizers in one call
        response = supabase_client.table('tournaments').select('*, tournament_organizers(user_id, role)').eq('slug', slug).single().execute()
        if not response.data:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found.")
        return response.data
    except Exception:
        logger.warning(f"Tournament with slug '{slug}' not found.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found.")



def get_my_tournaments(user_id: UUID) -> list:
    """Retrieves all tournaments a user is an organizer for."""
    logger.info(f"Fetching tournaments for user_id: {user_id}")
    try:
        # Query the junction table to get tournament IDs, then fetch tournament details
        response = supabase_client.table('tournament_organizers').select('tournaments(*)').eq('user_id', str(user_id)).execute()
        # The result is a list of objects, each with a 'tournaments' key. We extract the value.
        return [item['tournaments'] for item in response.data]
    except Exception as e:
        logger.exception(f"Error fetching 'My Tournaments' for user_id: {user_id}. Details: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch user's tournaments.")

def get_all_tournaments(game: str | None, latest: bool):
    """
    Retrieves tournament records from the database with optional filters.
    """
    query = supabase_client.table('tournaments').select("*")

    if game:
        query = query.eq('game', game)
    
    if latest:
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        query = query.gte('created_at', seven_days_ago.isoformat())

    response = query.order('created_at', desc=True).execute()

    return response.data or []

def update_existing_tournament(tournament_id: UUID, update_data: dict, user_id: UUID) -> dict:
    """Updates a tournament's details after checking for permission."""
    logger.info(f"User {user_id} attempting to update tournament {tournament_id}")
    if not _check_permission(tournament_id, user_id):
        logger.warning(f"Permission denied for user {user_id} to update tournament {tournament_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit this tournament.")

    update_data['updated_at'] = datetime.utcnow().isoformat()
    try:
        response = supabase_client.table('tournaments').update(update_data).eq('id', str(tournament_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Tournament not found or no data was changed.")
        logger.info(f"Tournament {tournament_id} updated successfully by user {user_id}")
        return response.data[0]
    except Exception as e:
        logger.exception(f"Error updating tournament {tournament_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not update tournament.")

def delete_existing_tournament(tournament_id: UUID, user_id: UUID):
    """Deletes a tournament after checking for 'owner' permission."""
    logger.info(f"User {user_id} attempting to delete tournament {tournament_id}")
    # Only owners can delete
    if not _check_permission(tournament_id, user_id, allowed_roles=['owner']):
        logger.warning(f"Permission denied for user {user_id} to delete tournament {tournament_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the tournament owner can delete this tournament.")

    try:
        response = supabase_client.table('tournaments').delete().eq('id', str(tournament_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Tournament not found.")
        logger.info(f"Tournament {tournament_id} deleted successfully by user {user_id}")
        return
    except Exception as e:
        logger.exception(f"Error deleting tournament {tournament_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not delete tournament.")
    
def upload_tournament_image(tournament_id: UUID, user_id: UUID, file: UploadFile) -> str:
    """Uploads a banner image for a tournament after checking permissions."""
    logger.info(f"User {user_id} attempting to upload image for tournament {tournament_id}")
    if not _check_permission(tournament_id, user_id):
        logger.warning(f"Permission denied for user {user_id} to upload image for tournament {tournament_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this tournament.")
    
    try:
        file_ext = os.path.splitext(file.filename)[1]
        path = f"public/{tournament_id}{file_ext}"
        file_content = file.file.read()

        supabase_client.storage.from_('tournaments').upload(
            path=path,
            file=file_content,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
        
        public_url = supabase_client.storage.from_('tournaments').get_public_url(path)
        logger.info(f"Image uploaded for tournament {tournament_id}. URL: {public_url}")
        return public_url

    except Exception as e:
        logger.exception(f"Error uploading image for tournament {tournament_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload tournament image.")
