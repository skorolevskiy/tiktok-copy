#!/bin/bash

# Wait for DB
python app/backend_pre_start.py

# Check if migrations exist, if not create them (For demo purposes only)
# In production, migrations should be committed to the repo
if [ ! "$(ls -A alembic/versions)" ]; then
    echo "No migrations found. Generating initial migration..."
    alembic revision --autogenerate -m "Initial migration"
fi

# Run migrations
alembic upgrade head

# Start app
uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*'
