# Deploy C3113 Audio Converter to Railway (Free Tier)

Railway offers **$5 free credit/month** — enough for this application.

## Quick Deploy (5 minutes)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Start Free"
3. Sign up with GitHub (easiest)

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub"
3. Authorize Railway to access your GitHub account

### Step 3: Select Repository
1. Find your repository with this code
2. Click "Deploy Now"

### Step 4: Railway Auto-Detects Services
Railway reads `docker-compose.yml` and creates:
- **Redis** service (message broker)
- **Backend** service (FastAPI API)
- **Worker** service (Celery worker)

### Step 5: Wait for Build & Deploy
- First deploy takes ~3-5 minutes
- Watch logs in Railway dashboard
- All 3 services will show "running" when ready

### Step 6: Get Your API URL
1. Click "Backend" service in Railway dashboard
2. Look for "Public URL" → copy it
3. Your API is now live! 🚀

Example: `https://c3113-audio-converter-prod.railway.app`

---

## Using Your Deployed API

### Test Health Endpoint
```bash
curl https://your-railway-url/health
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

### Upload Audio File
```bash
curl -F "files=@audio.mp3" https://your-railway-url/upload
```

### Queue Batch Conversion
```bash
curl -X POST https://your-railway-url/batch \
  -H "Content-Type: application/json" \
  -d '{
    "file_ids": ["uuid-from-upload"],
    "params": {
      "format": "wav",
      "bitrate": "192k",
      "sample_rate": "44100",
      "channels": "2"
    }
  }'
```

### Check Status
```bash
curl https://your-railway-url/batch/batch-uuid
```

### Download Converted File
```bash
curl https://your-railway-url/download/job-uuid -o output.wav
```

---

## Free Tier Limits (Railway $5 credit/month)

| Resource | Limit | Notes |
|----------|-------|-------|
| **Memory** | 8 GB shared | Split across services |
| **CPU** | Shared | Auto-scales |
| **Storage** | 100 GB | Uploads + temp files |
| **Bandwidth** | Unlimited | Outbound included |
| **Credit** | $5/month | Usually covers this app |

### Recommended Memory Allocation
```
Redis:     256 MB
Backend:   512 MB
Worker:    512 MB
Total:     1.3 GB (well under 8 GB limit)
```

---

## Configuration on Railway

### Set Environment Variables
1. Click "Backend" service → "Variables"
2. Add these variables:

```
APP_ENV=production
APP_DEBUG=false
LOG_FORMAT=json
MAX_FILE_SIZE_MB=500
FFMPEG_TIMEOUT_SECONDS=300
LOG_LEVEL=INFO
```

3. Click "Worker" service → "Variables"
4. Add same variables (Railway propagates to both)

### Database Setup (if needed)
Railway auto-creates Redis for you — no setup required!

---

## Monitoring on Railway

### View Logs
1. Click service name in dashboard
2. Scroll to "Logs" section
3. Real-time logs appear here

### View Metrics
- CPU usage
- Memory usage
- Deployment history
- Service status

### Restart Services
If something breaks:
1. Click service
2. Click "Restart"
3. Service redeploys automatically

---

## Custom Domain (Optional)

### Add Your Own Domain
1. Click "Networking" in project settings
2. Add custom domain (e.g., `audio-converter.yoursite.com`)
3. Update DNS records at your registrar

Railway provides free HTTPS/SSL automatically.

---

## Scaling on Free Tier

### Increase Worker Concurrency
If you're seeing slow conversions:

1. Click "Worker" service
2. Click "Deploy" → "Edit Dockerfile" or environment
3. Change worker command:
   ```
   celery -A worker.app worker --loglevel=info --concurrency=4
   ```
4. Redeploy

**Note**: More workers = more memory usage. Monitor in Railway dashboard.

### Horizontal Scaling (Replicas)
Free tier allows 1 replica per service. On paid plan, you can scale to multiple instances.

---

## Backup & Recovery

### Backup Uploaded Files
Railway provides persistent storage automatically. Your uploads survive service restarts.

To manually backup:
```bash
# Railway CLI (optional)
railway service exec backend ls /app/uploads
```

### Backup Redis Data
Railway auto-backs up Redis. No manual action needed.

To trigger manual backup:
```bash
railway service exec redis redis-cli BGSAVE
```

---

## Common Issues & Solutions

### Issue: Backend won't start
**Solution**: Check Redis connection
```bash
# In Railway logs, look for "ConnectionError"
# Verify CELERY_BROKER_URL and REDIS_URL are set correctly
```

### Issue: Worker not processing jobs
**Solution**: Restart worker service
1. Click "Worker" service
2. Click "Restart"
3. Check logs for errors

### Issue: "Out of Memory" errors
**Solution**: Reduce concurrency or split services
1. Lower worker `--concurrency` setting
2. Or upgrade to paid plan ($7+/month)

### Issue: Uploads stored but can't download
**Solution**: Check volume mounts
- Railway persists volumes across restarts
- Files should survive container crashes
- Check `/app/uploads` directory exists

### Issue: SSL/HTTPS errors
**Solution**: Railway provides auto HTTPS
- Use `https://` for your domain
- Railway handles certificate renewal
- No configuration needed

---

## Troubleshooting Commands

```bash
# Check service status
railway status

# View live logs
railway logs

# SSH into container (if enabled)
railway shell

# Deploy latest code
git push origin main
# (Railway auto-deploys on push if connected to GitHub)
```

---

## Cost Breakdown (Free Tier)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Redis 256MB | Free | Included in $5 credit |
| Backend 512MB | Free | Included in $5 credit |
| Worker 512MB | Free | Included in $5 credit |
| Storage 100GB | Free | Included in $5 credit |
| **Total** | **$0** | Uses $5 free credit |

### When You'll Need to Pay
- File conversions exceed 5-10/day
- More than 5 concurrent users
- Need custom domain with email
- Want to scale to multiple workers

---

## Update Your Code

### After Code Changes
```bash
git push origin main
```

Railway automatically:
1. Detects code push
2. Rebuilds Docker images
3. Redeploys all services
4. Updates DNS (if custom domain)
5. Zero downtime during deploy

### Rollback to Previous Version
If deployment breaks:
1. Click project → "Deployments"
2. Find previous working deployment
3. Click "Redeploy"
4. Services revert to previous version

---

## Next Steps

1. **Deploy now**: https://railway.app
2. **Test API**: `curl https://your-url/health`
3. **Upload files**: Use the endpoints above
4. **Monitor**: Watch logs in Railway dashboard
5. **Share**: Send API URL to users/frontend

---

## Frontend Integration

Update your frontend `.env` to point to Railway:

```env
VITE_API_URL=https://your-railway-url
```

Frontend can now communicate with Railway-hosted backend from anywhere!

---

## Support & Docs

- **Railway Docs**: https://docs.railway.app
- **Discord Community**: https://discord.gg/railway
- **This App Docs**: See DEPLOYMENT.md, PRODUCTION_READINESS.md

---

**Status**: ✅ Ready to deploy to Railway  
**Version**: 0.1.0  
**Free Tier**: Sufficient for small-to-medium usage
