# server/routers/tournament_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query, Path, status, File, UploadFile
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
    tags=["Tournaments"]
)

# --- Pydantic Models ---
class TournamentCreate(BaseModel):
    name: str = Field(..., example="Valorant Champions Tour")
    description: Optional[str] = Field(None, example="The official Valorant world championship.")
    game: str = Field(..., example="Valorant")
    elimination_type: str = Field(..., example="Single Elimination")
    start_date: datetime
    max_teams: int = Field(..., gt=1, example=16)
    max_players_per_team: int = Field(..., gt=0, example=5)
    image_url: Optional[str] = None
    
class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    game: Optional[str] = None
    elimination_type: Optional[str] = None
    start_date: Optional[datetime] = None
    max_teams: Optional[int] = Field(None, gt=1)
    max_players_per_team: Optional[int] = Field(None, gt=0)

class TournamentSearchResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    game: Optional[str] = None
    image_url: Optional[str] = None

# --- API Endpoints ---
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_tournament(
    tournament: TournamentCreate,
    current_user: User = Depends(get_current_user)
):
    """Creates a new tournament and assigns the current user as the owner."""
    new_tournament = tournament_service.create_new_tournament(
        tournament_data=tournament.dict(),
        user_id=current_user.id
    )
    return {"message": "Tournament created successfully!", "data": new_tournament}

@router.post("/{tournament_id}/image", response_model=dict)
def upload_tournament_banner(
    tournament_id: UUID = Path(..., description="The ID of the tournament to upload the image for."),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...)
):
    """Uploads a banner image for a tournament and updates the record."""
    image_url = tournament_service.upload_tournament_image(
        tournament_id=tournament_id,
        user_id=current_user.id,
        file=file
    )
    
    # Update the tournament record with the new image URL
    updated_tournament = tournament_service.update_existing_tournament(
        tournament_id=tournament_id,
        update_data={"image_url": image_url},
        user_id=current_user.id
    )

    return {"message": "Image uploaded successfully", "data": updated_tournament}



@router.get("/my-tournaments", response_model=List[dict])
def get_user_tournaments(current_user: User = Depends(get_current_user)):
    """Retrieves all tournaments organized by the current user."""
    return tournament_service.get_my_tournaments(user_id=current_user.id)

# This endpoint is NOW PUBLIC, no auth needed.
@router.get("/slug/{slug}", response_model=dict)
def get_tournament_public(slug: str):
    """Retrieves a single tournament's public details by its slug."""
    return tournament_service.get_tournament_by_slug(slug=slug)

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


@router.put("/{tournament_id}", response_model=dict)
def update_tournament(
    tournament_update: TournamentUpdate,
    tournament_id: UUID = Path(..., description="The ID of the tournament to update."),
    current_user: User = Depends(get_current_user)
):
    """Updates a tournament's details. Requires owner/admin permission."""
    updated_tournament = tournament_service.update_existing_tournament(
        tournament_id=tournament_id,
        update_data=tournament_update.dict(exclude_unset=True),
        user_id=current_user.id
    )
    return {"message": "Tournament updated successfully!", "data": updated_tournament}


@router.delete("/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tournament(
    tournament_id: UUID = Path(..., description="The ID of the tournament to delete."),
    current_user: User = Depends(get_current_user)
):
    """Deletes a tournament. Requires owner permission."""
    tournament_service.delete_existing_tournament(
        tournament_id=tournament_id,
        user_id=current_user.id
    )
    return

@router.get("/search/{query}", response_model=List[TournamentSearchResponse])
def search_for_tournaments(query: str):
    """
    [SEARCH] Searches for tournaments by name.
    This endpoint is public.
    """
    if not query or len(query) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 3 characters long."
        )
    return tournament_service.search_tournaments_by_name(query=query)