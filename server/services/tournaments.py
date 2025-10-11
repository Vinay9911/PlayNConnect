# server/services/tournaments.py
from fastapi import HTTPException
from uuid import UUID
from datetime import datetime, timedelta

from utils.supabase import supabase_client

def create_new_tournament(tournament_data: dict, user_id: UUID):
    """
    Inserts a new tournament record into the database.
    """
    # FIX: Convert the datetime object to an ISO 8601 formatted string
    if 'start_date' in tournament_data and isinstance(tournament_data['start_date'], datetime):
        tournament_data['start_date'] = tournament_data['start_date'].isoformat()
    
    tournament_data['created_by'] = str(user_id)
    
    response = supabase_client.table('tournaments').insert(tournament_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Could not create tournament.")
        
    return response.data[0]

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

def update_existing_tournament(tournament_id: UUID, update_data: dict, user_id: UUID):
    """
    Updates a specific tournament record owned by the user.
    """
    # First, verify the user owns the tournament
    verify_response = supabase_client.table('tournaments') \
        .select("id") \
        .eq('id', str(tournament_id)) \
        .eq('created_by', str(user_id)) \
        .execute()

    if not verify_response.data:
        raise HTTPException(status_code=403, detail="You do not have permission to update this tournament.")

    # FIX: Also convert the start_date here if it's being updated
    if 'start_date' in update_data and isinstance(update_data['start_date'], datetime):
        update_data['start_date'] = update_data['start_date'].isoformat()

    # Proceed with the update
    update_data['updated_at'] = datetime.utcnow().isoformat()
    
    response = supabase_client.table('tournaments') \
        .update(update_data) \
        .eq('id', str(tournament_id)) \
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Could not update tournament.")
        
    return response.data[0]

def delete_existing_tournament(tournament_id: UUID, user_id: UUID):
    """
    Deletes a specific tournament record owned by the user.
    """
    # Verify the user owns the tournament
    verify_response = supabase_client.table('tournaments') \
        .select("id") \
        .eq('id', str(tournament_id)) \
        .eq('created_by', str(user_id)) \
        .execute()

    if not verify_response.data:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this tournament.")

    # Proceed with the deletion
    response = supabase_client.table('tournaments') \
        .delete() \
        .eq('id', str(tournament_id)) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Tournament not found.")
    
    return True