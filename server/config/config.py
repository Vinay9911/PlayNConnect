# server/config/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Loads and validates environment variables from the .env file.
    """
    SUPABASE_URL: str
    SUPABASE_KEY: str
    FRONTEND_URL: str

    model_config = SettingsConfigDict(env_file=".env")

# Create a single instance of the settings to be used throughout the application
settings = Settings()