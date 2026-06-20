# Railway Setup — the two things that actually matter

This app needs **three** Railway services: Redis, the API (web), and the
Celery worker. The repo's `railway.json` only defines the API. You add Redis
and the worker in the Railway dashboard.

## 1. Redis
Add the Redis template to the project (you already did this). It exposes a
`REDIS_URL` variable that the other services reference.

## 2. API service (the one created from the repo)
Variables → add:

| Variable | Value |
|---|---|
| `CELERY_BROKER_URL` | `${{ Redis.REDIS_URL }}` |
| `CELERY_RESULT_BACKEND` | `${{ Redis.REDIS_URL }}` |
| `REDIS_URL` | `${{ Redis.REDIS_URL }}` |
| `APP_ENV` | `production` |

Do **not** set `PORT` — Railway injects it automatically and the app now reads it.
Start command (already in `railway.json`): `python main.py`

## 3. Worker service (you must create this)
- New Service → Deploy from the same GitHub repo (`aldocelle/c3113-audio-converter`).
- Settings → Build: Dockerfile, root directory `backend` (same as API).
- Settings → Deploy → Start Command:
  ```
  celery -A worker.app worker --loglevel=info --concurrency=2
  ```
- Variables: the same four as the API service.

Without this worker, `POST /batch` returns `queued` but conversions never run —
the jobs pile up in Redis with nothing consuming them.

## Why it was failing
1. **Port mismatch** — the app hardcoded `8000`; Railway routes to `$PORT`.
   Fixed in `app/config.py` (`app_port` now reads `PORT`).
2. **No worker** — only the API was deployed, so queued jobs had no consumer.

## Verify
```
curl https://<your-api>.railway.app/health      # {"status":"ok",...}
```
Then upload + batch, and watch the worker service logs show
`Task convert_audio_task ... succeeded`.
