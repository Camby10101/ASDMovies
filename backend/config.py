# config.py
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv, find_dotenv
from supabase import create_client, Client

# Carrega .env de forma robusta
env_path = find_dotenv(usecwd=True)
if not env_path:
    env_path = str((Path(__file__).resolve().parent / ".env"))
load_dotenv(env_path, override=False)

SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or ""
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""

if not SUPABASE_URL.startswith("https://"):
    raise RuntimeError("SUPABASE_URL ausente ou inválida (ex.: https://xxxx.supabase.co)")
if not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_ANON_KEY ausente.")

def _mask(s: str, keep: int = 6) -> str:
    if not s: return "<empty>"
    return s[:keep] + "…" + s[-2:]

print(f"[config] SUPABASE_URL = {SUPABASE_URL}")
print(f"[config] ANON_KEY = { _mask(SUPABASE_ANON_KEY) }")
print(f"[config] SERVICE_KEY set? { 'yes' if SUPABASE_SERVICE_ROLE_KEY else 'no' }")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

supabase_admin: Optional[Client] = None
if SUPABASE_SERVICE_ROLE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
