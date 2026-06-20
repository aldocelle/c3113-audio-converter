# Railway Deployment — 3-Minute Quick Start

## Before You Start
- [ ] GitHub account connected to this repository
- [ ] Railway account (free at https://railway.app)

## Option A: One-Click Deploy (Easiest)

1. **Go to**: https://railway.app/new
2. **Click**: "Deploy from GitHub"
3. **Select**: This repository
4. **Wait**: 3-5 minutes for build
5. **Done**: Your API is live!

Get your URL from the "Backend" service in the Railway dashboard.

---

## Option B: Railway CLI Deploy (Developer Path)

### 1. Install Railway CLI
```bash
curl -fsSL https://raw.githubusercontent.com/railwayapp/cli/main/install.sh | bash
```

### 2. Authenticate
```bash
railway login
```

### 3. Create Railway Project
```bash
railway init
```

### 4. Deploy
```bash
railway up
```

### 5. Get Your URL
```bash
railway open
```

---

## After Deployment

### Test Your API
```bash
# Replace with your Railway URL
API_URL="https://your-railway-app.railway.app"

# Health check
curl $API_URL/health

# Upload test
curl -F "files=@audio.mp3" $API_URL/upload

# Check status
curl $API_URL/batch/{batch_id}
```

### Update Your Frontend
In frontend `.env`:
```env
VITE_API_URL=https://your-railway-app.railway.app
```

### View Logs
```bash
railway logs
```

### Redeploy After Changes
```bash
git push origin main
# Railway auto-deploys!
```

---

## Free Tier Details

| Resource | Limit | Status |
|----------|-------|--------|
| Monthly Credit | $5 | ✅ Covers this app |
| Memory | 8 GB total | ✅ 1.3 GB needed |
| Storage | 100 GB | ✅ Plenty |
| Bandwidth | Unlimited | ✅ Included |
| Custom Domain | Yes | ✅ Free SSL |

**You won't pay anything** unless you exceed free tier.

---

## Monitoring

### Railway Dashboard
1. Go to https://railway.app/dashboard
2. Click your project
3. View:
   - Service status
   - Memory/CPU usage
   - Live logs
   - Deployment history

### Check Service Health
```bash
curl -s https://your-api/health | json_pp
```

Expected:
```json
{
  "status": "ok",
  "app": "C3113 Audio Converter",
  "environment": "production"
}
```

---

## Troubleshooting

### "Build failed"
Check logs in Railway dashboard → click service → scroll to "Logs"

### "Backend service won't start"
1. Click "Backend" service
2. Check environment variables are set
3. Look for Redis connection errors in logs

### "Worker not processing jobs"
1. Click "Worker" service
2. Click "Restart"
3. Check logs for errors

### "Running out of memory"
1. Reduce worker concurrency (change `--concurrency=2` to `--concurrency=1`)
2. Or upgrade to paid plan ($7+/month)

---

## Next: Connect Your Frontend

Your frontend can now call:
```javascript
const API_URL = "https://your-railway-app.railway.app"

// Upload
const formData = new FormData()
formData.append("files", audioFile)
const upload = await fetch(`${API_URL}/upload`, {
  method: "POST",
  body: formData
})

// Batch
const batch = await fetch(`${API_URL}/batch`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    file_ids: ["..."],
    params: { format: "wav", bitrate: "192k", sample_rate: "44100", channels: "2" }
  })
})
```

---

## Common URLs

| What | URL |
|------|-----|
| Dashboard | https://railway.app/dashboard |
| Docs | https://docs.railway.app |
| Discord | https://discord.gg/railway |
| Your API | https://your-project.railway.app |

---

## Support

If something breaks:
1. Check logs: `railway logs`
2. Restart: `railway service restart backend`
3. Check Railway status: https://status.railway.app
4. Ask in Discord: https://discord.gg/railway

---

**Status**: ✅ Ready to deploy  
**Estimated time**: 5 minutes  
**Cost**: Free (uses $5 monthly credit)
