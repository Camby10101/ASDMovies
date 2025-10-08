#Campbell -> A Simple Script you can run to start both the frontend and backend servers if you like, you need to have powershell and have installed all dependencies
# Start frontend
Start-Process powershell -ArgumentList "cd frontend; npm run dev"

# Start backend
Start-Process powershell -ArgumentList "cd backend; .venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000"
