## Dependencies Setup
# Frontend Setup

cd frontend
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
npm install @supabase/supabase-js
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npx shadcn@latest init
npx shadcn@latest add navigation-menu

# Backend Setup

cd backend
python3 -m venv .venv
(source .venv/bin/activate) OR (PowerShell: .venv\Scripts\Activate.ps1) OR (bash (windows): .venv/Scripts/activate)
pip install supabase
python -m pip install --upgrade pip
python -m pip install fastapi "uvicorn[standard]" httpx python-dotenv

# Movie Comonents Setup

cd backend/tmdb-api
python -m venv .venv

# API Keys Setup
Ask Team lead for key values
create frontend/.env.development
---
VITE_SUPABASE_URL=https://mcpzbvznxmkbvaeajwua.supabase.co
VITE_SUPABASE_ANON_KEY=ASK TEAM LEAD
---
create backend/.env
---
SUPABASE_URL=https://mcpzbvznxmkbvaeajwua.supabase.co
SUPABASE_ANON_KEY=ASK TEAM LEAD
SUPABASE_SERVICE_ROLE_KEY=ASK TEAM LEAD
TMDB_KEY=ASK TEAM LEAD (This is the TMDB Bearer Token, not API Key)
---

## Activate and run
# TO RUN Frontend

cd frontend
npm run dev

# TO RUN Backend

cd backend
(source .venv/bin/activate) OR (PowerShell: .venv\Scripts\Activate.ps1) OR (bash (windows): .venv/Scripts/activate)
python -m uvicorn main:app --reload --port 8000

## Populate the Database with Movies

The batch uploader script fetches popular movies from TMDB and uploads them to your Supabase database.

# Prerequisites
Make sure backend/.env file is configured with:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (Required for batch uploads - bypasses RLS)
- TMDB_KEY (Bearer Token - starts with "eyJ...")

# Install required dependencies (if not already installed)
cd backend
Activate venv (source venv/bin/activate)
pip install requests python-dotenv supabase

# Run the batch uploader
cd backend/tmdb-api
python batch_uploader.py

# By default, this will upload 200 popular movies to your database
# You can modify the number of movies by editing the script's last line:
# uploader.run(total_movies=500)  # Upload 500 movies instead

# Notes:
- The script uses the SERVICE_ROLE_KEY (not ANON_KEY) to bypass Row-Level Security (RLS) policies
- This is an administrative operation - keep your SERVICE_ROLE_KEY secure and never expose it in client-side code
- The script includes rate limiting to respect TMDB API limits (0.25s delay between requests)
- Movies are uploaded in batches of 50 to optimize database performance
- The script uses "upsert" to insert new movies or update existing ones (based on tmdb_id)
- Safe to run multiple times - won't create duplicates
- The script will show progress as it fetches and uploads movies
