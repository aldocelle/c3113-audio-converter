# C3113 Audio Converter — Deployment Guide

## Quick Start (Development)

```bash
docker-compose up -d
curl http://localhost:8000/health
```

All services start automatically with proper ordering and health checks.

## Production Deployment

### 1. Configuration

Copy `.env.production` to `.env` or set environment variables:

```bash
cp backend/.env.production backend/.env
```

Key production settings:
- `APP_ENV=production` — Disables debug mode
- `LOG_FORMAT=json` — Structured JSON logging
- `LOG_LEVEL=INFO` — Reduced verbosity

### 2. External Services

**Redis:**
- Use managed Redis (AWS ElastiCache, Azure Cache, etc.) or self-hosted Redis cluster
- Configure `REDIS_URL` and `CELERY_BROKER_URL` to point to your Redis endpoint
- Enable persistence (RDB or AOF)
- Use password authentication in production

**Environment Variables for External Redis:**

```env
REDIS_URL=redis://:password@redis.example.com:6379/0
CELERY_BROKER_URL=redis://:password@redis.example.com:6379/0
CELERY_RESULT_BACKEND=redis://:password@redis.example.com:6379/1
```

### 3. Starting Services

**Development (local Redis):**
```bash
docker-compose up -d
```

**Production (external Redis):**
```bash
# Set external Redis endpoints
export REDIS_URL=redis://:password@prod-redis:6379/0
export CELERY_BROKER_URL=$REDIS_URL
export CELERY_RESULT_BACKEND=redis://:password@prod-redis:6379/1

docker-compose up -d
```

### 4. Health Checks

**API Health:**
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "app": "C3113 Audio Converter",
  "environment": "production",
  "version": "0.1.0"
}
```

**Readiness:**
```bash
curl http://localhost:8000/ready
```

**Container Status:**
```bash
docker-compose ps
```

All containers should show `Up` status. Backend should pass healthcheck.

### 5. Monitoring

**View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f worker
docker-compose logs -f redis
```

**Logs are structured JSON in production**, enabling easy parsing and aggregation:
```json
{
  "timestamp": "2026-06-20T18:26:22.928Z",
  "level": "INFO",
  "logger": "app.services.job_store",
  "message": "Job created: eea521b8-d9d2-4f66-9dc1-b516ce3c988e",
  "module": "job_store",
  "function": "create_job",
  "line": 42
}
```

**Integration with centralized logging** (ELK, Datadog, CloudWatch, etc.):
- JSON logs automatically parse into fields
- Use `request_id` to trace request through system
- Filter by `error_code` for error analysis

### 6. Scaling

**Increase worker concurrency:**
```bash
# In docker-compose.yml, adjust worker command:
command: celery -A worker.app worker --loglevel=info --concurrency=8
```

**Multiple worker instances:**
```bash
docker-compose up -d --scale worker=3
```

### 7. Maintenance

**Clean up old data (automatic every hour):**
- Temp files >24 hours old
- Job records >7 days old
- Batch records >7 days old

**Manual cleanup:**
```bash
# Remove all temp files
docker exec c3113-backend python -c "from app.core.cleanup import cleanup_temp_files; cleanup_temp_files()"

# Check storage usage
docker exec c3113-backend du -sh /app/uploads /app/temp
```

### 8. Rate Limiting

Default limits (per client IP):
- Upload: 30 requests/minute
- Batch creation: 20 requests/minute

Adjust in `backend/app/core/rate_limit.py` if needed.

### 9. API Endpoints

**Upload files:**
```bash
curl -X POST -F "files=@audio.mp3" http://localhost:8000/upload
```

**Queue batch conversion:**
```bash
curl -X POST http://localhost:8000/batch \
  -H "Content-Type: application/json" \
  -d '{
    "file_ids": ["uuid-1", "uuid-2"],
    "params": {
      "format": "wav",
      "bitrate": "192k",
      "sample_rate": "44100",
      "channels": "2"
    }
  }'
```

**Check batch status:**
```bash
curl http://localhost:8000/batch/batch-uuid
```

**Download converted file:**
```bash
curl http://localhost:8000/download/job-uuid -o output.wav
```

### 10. Error Handling

All errors include structured error codes:

```json
{
  "error_code": "FILE_TOO_LARGE",
  "message": "File exceeds 500 MB limit",
  "details": {
    "max": 500,
    "provided": 600
  },
  "request_id": "12345-abc-67890"
}
```

Common error codes:
- `INVALID_INPUT` — Bad request parameters (400)
- `FILE_TOO_LARGE` — File exceeds size limit (400)
- `UNSUPPORTED_FORMAT` — Invalid audio format (400)
- `RATE_LIMIT_EXCEEDED` — Too many requests (429)
- `FILE_NOT_FOUND` — File doesn't exist (404)
- `JOB_NOT_FOUND` — Job doesn't exist (404)
- `CONVERSION_FAILED` — FFmpeg error (500)
- `SERVICE_UNAVAILABLE` — Redis down or worker offline (503)
- `INTERNAL_ERROR` — Unhandled error (500)

### 11. Backup & Recovery

**Backup uploaded files:**
```bash
docker cp c3113-backend:/app/uploads ./backup-uploads-$(date +%s)
```

**Restore from backup:**
```bash
docker cp ./backup-uploads /path/to/volume/uploads
```

**Database (Redis) persistence:**
- Automatic RDB snapshots
- AOF logs for point-in-time recovery
- Backup Redis dump.rdb regularly

### 12. Stopping Services

```bash
# Graceful shutdown
docker-compose down

# Preserve volumes (keep data)
docker-compose down -v

# Full cleanup including images
docker-compose down -v --remove-image-images
```

## Troubleshooting

### Backend won't start
```bash
docker-compose logs backend
# Check Redis connection: CELERY_BROKER_URL, REDIS_URL
```

### Worker not processing jobs
```bash
docker-compose logs worker
# Verify Redis is reachable
docker exec c3113-redis redis-cli ping
```

### Conversion failures
```bash
# Check FFmpeg is installed
docker exec c3113-worker which ffmpeg

# Check logs for specific job
docker-compose logs worker | grep "job-id"
```

### Out of disk space
```bash
# Check usage
df -h

# Clean old files
docker exec c3113-backend python -c "from app.core.cleanup import run_cleanup; run_cleanup()"
```

## Performance Tuning

| Setting | Default | Notes |
|---------|---------|-------|
| Worker concurrency | 4 | Increase for CPU-bound tasks |
| FFmpeg timeout | 300s | Adjust for very large files |
| Max file size | 500 MB | Balance storage vs. throughput |
| Batch size | 100 files | Limit memory usage |
| Request timeout | 30s | Frontend polling |

## Security

- ✓ File validation (extension + magic bytes)
- ✓ Path traversal protection (filename sanitization)
- ✓ Rate limiting per IP
- ✓ No debug output in production
- ✓ Structured errors (no stack traces to client)
- ✓ Request ID tracking for auditing

## Version

Application: v0.1.0  
Docker: v20.10+  
Python: 3.11  
FFmpeg: 7.0+  
Redis: 7.0+
