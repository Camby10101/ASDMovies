# Frontend
# TO RUN

npm run dev

# Dependencies

cd frontend
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
npm install @supabase/supabase-js

npm install react-router

npx shadcn@latest init
npx shadcn@latest add navigation-menu

# Backend
# Setup

cd backend
pip install supabase
python3 -m venv .venv
pip install supabase
(source .venv/bin/activate) OR (PowerShell: .venv\Scripts\Activate.ps1)
python -m pip install --upgrade pip
python -m pip install fastapi "uvicorn[standard]" httpx python-dotenv

# Activate and run

(source .venv/bin/activate) OR (PowerShell: .venv\Scripts\Activate.ps1)
cd tmbd-api
python -m uvicorn main:app --reload --port 8000

# If fastapi/uvicorn imports cannot be resolved
# In terminal...
where python (windows) OR
which python (mac)

# Copy address, e.g.
/Users/User/.../ASDMovies/backend/.venv/bin/python

# In your IDE (e.g. VSCode -> CTRL/CMD + SHIFT + P)
Python: Select Interpreter
Paste address


# API Keys
Ask Team lead for key values
create frontend/.env.development
```
VITE_SUPABASE_URL=https://mcpzbvznxmkbvaeajwua.supabase.co
VITE_SUPABASE_ANON_KEY=ASK TEAM LEAD
```
create backend/.env
```
SUPABASE_URL=https://mcpzbvznxmkbvaeajwua.supabase.co
SUPABASE_ANON_KEY=ASK TEAM LEAD
SUPABASE_SERVICE_ROLE_KEY= ASK TEAM LEAD
```
Add respective keys to this file
