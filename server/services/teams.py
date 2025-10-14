# server/services/teams.py
import logging
from uuid import UUID
from fastapi import HTTPException, status
from utils.supabase import supabase_client

logger = logging.getLogger(__name__)



def create_team_for_tournament(tournament_id: UUID, team_name: str, leader_id: UUID) -> dict:
    """Creates a new team for a tournament and sets the creator as the leader."""
    logger.info(f"User {leader_id} creating team '{team_name}' for tournament {tournament_id}")
    try:
        # Check if a team with the same name already exists in the tournament
        existing_team = supabase_client.table('teams').select('id', count='exact').eq('tournament_id', str(tournament_id)).eq('name', team_name).execute()
        if existing_team.count > 0:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A team with this name already exists in the tournament.")

        # Create the new team
        team_data = {
            "name": team_name,
            "tournament_id": str(tournament_id),
            "leader_id": str(leader_id)
        }
        response = supabase_client.table('teams').insert(team_data).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create team.")
        
        new_team = response.data[0]
        
        # Add the leader as the first member of the team
        # NOTE: It's better to add the member in the same function to ensure it happens
        member_data = {"team_id": new_team['id'], "user_id": str(leader_id)}
        supabase_client.table('team_members').insert(member_data).execute()
        
        return new_team
    
    # FIX: Add this block to let specific HTTP errors pass through
    except HTTPException as http_exc:
        raise http_exc
        
    except Exception as e:
        logger.exception(f"Error creating team: {e}")
        # This will now only catch unexpected errors
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during team creation.")

# server/services/teams.py

# ... (imports and other functions remain the same)
# server/services/teams.py

# ... (imports and other functions remain the same)

def add_member_to_team(team_id: UUID, user_id: UUID, requester_id: UUID) -> dict:
    """Adds a user to a team, checking for leader's permission."""
    logger.info(f"User {requester_id} attempting to add user {user_id} to team {team_id}")
    try:
        # 1. Check if the requester is the team leader
        team_response = supabase_client.table('teams').select('leader_id').eq('id', str(team_id)).single().execute()
        if not team_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

        leader_id_from_db = team_response.data['leader_id']

        # FINAL FIX: Compare the plain string values of the IDs
        if str(leader_id_from_db) != str(requester_id):
            # This check will now be 100% accurate based on the text value
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the team leader can add members.")

        # 2. Check if the user profile for the member-to-be-added exists
        member_profile = supabase_client.table('users').select('id', count='exact').eq('id', str(user_id)).execute()
        if member_profile.count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User profile for user ID {user_id} not found.")

        # 3. Add the new member
        member_data = { "team_id": str(team_id), "user_id": str(user_id) }
        response = supabase_client.table('team_members').insert(member_data).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Could not add member. They may already be on the team.")
        return response.data[0]
    
    except HTTPException as http_exc:
        raise http_exc
        
    except Exception as e:
        logger.exception(f"Error adding member to team: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

def get_user_teams(user_id: UUID) -> list:
    """Retrieves all teams a user is a member of."""
    logger.info(f"Fetching all teams for user {user_id}")
    try:
        # This query first finds all team_ids for the user, then fetches the details of those teams.
        response = supabase_client.table('team_members').select('teams(*)').eq('user_id', str(user_id)).execute()
        return [item['teams'] for item in response.data]
    except Exception as e:
        logger.exception(f"Error fetching teams for user {user_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not fetch user's teams.")