
# --- 1) Build frontend ---
FROM node:20-alpine AS webbuild
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# --- 2) Backend runtime ---
FROM python:3.11-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

# System deps (optional but nice)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install -r /app/backend/requirements.txt

# Copy backend
COPY backend /app/backend

# Copy built frontend into image
COPY --from=webbuild /app/frontend/dist /app/frontend/dist

# Expose and run
ENV PORT=8000
WORKDIR /app/backend
CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"]
