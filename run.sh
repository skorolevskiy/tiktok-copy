#!/bin/bash

# Wait for DB
python app/backend_pre_start.py

# Always check for schema changes and generate migration if needed
alembic revision --autogenerate -m "Schema update"

# Run migrations
alembic upgrade head

# Start app
uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*' --reload
