# server/routers/tournament_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query, Path
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from gotrue import User

# Import the service functions
from services import tournaments as tournament_service
from utils.dependency import get_current_user

router = APIRouter(
    prefix="/tournaments",
    tags=["Tournaments"],
    dependencies=[Depends(get_current_user)]
)

# --- Pydantic Models ---
class Tournament(BaseModel):
    name: str = Field(..., example="Valorant Champions Tour")
    description: Optional[str] = Field(None, example="The official Valorant world championship.")
    game: str = Field(..., example="Valorant")
    elimination_type: str = Field(..., example="Single Elimination")
    start_date: datetime
    max_teams: int = Field(..., gt=1, example=16)
    max_players_per_team: int = Field(..., gt=0, example=5)

class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    game: Optional[str] = None
    elimination_type: Optional[str] = None
    start_date: Optional[datetime] = None
    max_teams: Optional[int] = Field(None, gt=1)
    max_players_per_team: Optional[int] = Field(None, gt=0)


# --- API Endpoints ---
@router.post("/", status_code=201)
def create_tournament(
    tournament: Tournament,
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new tournament.
    """
    new_tournament = tournament_service.create_new_tournament(
        tournament_data=tournament.dict(),
        user_id=current_user.id
    )
    return {"message": "Tournament created successfully!", "data": new_tournament}

@router.get("/", response_model=List[dict])
def get_tournaments(
    game: Optional[str] = Query(None, description="Filter tournaments by game."),
    latest: bool = Query(False, description="Set to true to get tournaments from the last 7 days.")
):
    """
    Retrieves a list of tournaments, with optional filters.
    """
    tournaments = tournament_service.get_all_tournaments(game=game, latest=latest)
    return tournaments


@router.put("/{tournament_id}", status_code=200)
def update_tournament(
    # Move the body parameter to be the first argument
    tournament_update: TournamentUpdate,
    
    # Keep the path and dependency parameters after the body
    tournament_id: UUID = Path(..., description="The ID of the tournament to update."),
    current_user: User = Depends(get_current_user)
):
    """
    Updates a tournament's details.
    """
    updated_tournament = tournament_service.update_existing_tournament(
        tournament_id=tournament_id,
        update_data=tournament_update.dict(exclude_unset=True),
        user_id=current_user.id
    )
    return {"message": "Tournament updated successfully!", "data": updated_tournament}

@router.delete("/{tournament_id}", status_code=204)
def delete_tournament(
    tournament_id: UUID = Path(..., description="The ID of the tournament to delete."),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a tournament.
    """
    tournament_service.delete_existing_tournament(
        tournament_id=tournament_id,
        user_id=current_user.id
    )
    return