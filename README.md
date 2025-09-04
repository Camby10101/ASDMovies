# Frontend
# TO RUN

npm run dev

# Dependencies

cd frontend
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
pip install supabase

npm install react-router

npx shadcn@latest init
npx shadcn@latest add navigation-menu

# Backend
# Setup

cd backend
pip install supabase
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install fastapi "uvicorn[standard]" httpx python-dotenv

# Activate and run

source .venv/bin/activate                                    OR (PowerShell: .venv\Scripts\Activate.ps1)
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
