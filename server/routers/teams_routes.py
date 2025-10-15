# server/routers/teams_routes.py
from fastapi import APIRouter, Depends, status, Path
from pydantic import BaseModel, Field
from typing import List, Union
from uuid import UUID
from gotrue import User
from utils.dependency import get_current_user
from services import teams as team_service

router = APIRouter(
    prefix="/teams",
    tags=["Teams"],
    dependencies=[Depends(get_current_user)]
)

# --- Pydantic Models ---
class TeamCreate(BaseModel):
    name: str = Field(..., example="The Champions")

class TeamMemberAdd(BaseModel):
    user_ids: Union[UUID, List[UUID]]

# --- API Endpoints ---
@router.post("/tournaments/{tournament_id}/teams", status_code=status.HTTP_201_CREATED)
def register_team_for_tournament(
    team_data: TeamCreate,
    tournament_id: UUID = Path(..., description="The ID of the tournament to join."),
    current_user: User = Depends(get_current_user)
):
    """Registers a new team for a tournament, with the current user as the leader."""
    new_team = team_service.create_team_for_tournament(
        tournament_id=tournament_id,
        team_name=team_data.name,
        leader_id=current_user.id
    )
    return {"message": "Team registered successfully!", "data": new_team}

@router.post("/{team_id}/members", status_code=status.HTTP_201_CREATED)
def add_team_members(
    member_data: TeamMemberAdd,
    team_id: UUID = Path(..., description="The ID of the team to add members to."),
    current_user: User = Depends(get_current_user)
):
    """Adds one or more new members to a team. Only the team leader can perform this action."""
    new_members = team_service.add_members_to_team(
        team_id=team_id,
        user_ids=member_data.user_ids,
        requester_id=current_user.id
    )
    return {"message": "Team members added successfully!", "data": new_members}

@router.get("/tournaments/{tournament_id}", response_model=List[dict])
def get_tournament_teams(
    tournament_id: UUID = Path(..., description="The ID of the tournament.")
):
    """Gets a list of all teams in a tournament."""
    return team_service.get_teams_for_tournament(tournament_id=tournament_id)

@router.get("/user/{user_id}", response_model=List[dict])
def get_teams_for_user(
    user_id: UUID = Path(..., description="The ID of the user.")
):
    """Gets a list of all teams a user is a part of."""
    return team_service.get_user_teams(user_id=user_id)