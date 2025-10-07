# server/utils/supabase.py
from supabase import create_client, Client
from config.config import settings

# Initialize the Supabase client
print(f'supabase url: {settings.SUPABASE_URL}')
print(f'supabase key: {settings.SUPABASE_KEY}')
supabase_client: Client = create_client(
    supabase_url=settings.SUPABASE_URL,
    supabase_key=settings.SUPABASE_KEY
)
print("Supabase client initialized with URL:", settings.SUPABASE_URL)