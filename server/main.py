from fastapi import FastAPI
from routers import user_routes, auth_routes, tournament_routes, teams_routes
from fastapi.middleware.cors import CORSMiddleware
from config.config import settings

app = FastAPI(
    title="PlayNConnct Server",
    description="A FastAPI backend on PlayNConnect"
)

# Define the list of allowed origins from your settings
origins = [
    settings.FRONTEND_URL,
]

# Add the CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Allows specified origins
    allow_credentials=True,    # Allows cookies/authorization headers
    allow_methods=["*"],         # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],         # Allows all headers
)

# Include your routers
app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(tournament_routes.router)
app.include_router(teams_routes.router)

@app.get("/", tags=["Root"])
def read_root():
    """A simple root endpoint to confirm the server is running."""
    return {"message": "Welcome to the authentication server!"}
