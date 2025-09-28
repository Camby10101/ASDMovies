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
SUPABASE_SERVICE_ROLE_KEY= ASK TEAM LEAD
---

## Activate and run
# TO RUN Frontend

cd frontend
npm run dev

# TO RUN Backend

cd backend/tmdb-api
(source .venv/bin/activate) OR (PowerShell: .venv\Scripts\Activate.ps1) OR (bash (windows): .venv/Scripts/activate)
python -m uvicorn main:app --reload --port 8000
