# server/config/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Loads and validates environment variables from the .env file.
    """
    SUPABASE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza3B0c3pveWFvc3lkeWlybXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Mjg4MTMsImV4cCI6MjA3NTQwNDgxM30.ff_FhIns0cpzOvQWpOUAZOeGfV56KFpl9bL22gSNJmI"
    SUPABASE_URL: str = "https://zskptszoyaosydyirmpx.supabase.co"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env")

# Create a single instance of the settings to be used throughout the application
settings = Settings()
