#!/bin/sh
# Combined launcher for single-container deploys (e.g. Railway), where the API
# and Celery worker must share the same filesystem (uploads/ + temp/).
# Locally, docker-compose runs them as separate services instead.
set -e

# Start the Celery worker in the background.
celery -A worker.app worker --loglevel=info --concurrency=2 &

# Start the web server in the foreground so the platform tracks the web process
# and routes $PORT to it. If it exits, the container restarts.
exec python main.py
