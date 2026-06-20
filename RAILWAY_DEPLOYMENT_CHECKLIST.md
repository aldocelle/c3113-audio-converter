# Railway Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment Checklist

- [ ] GitHub account created
- [ ] Repository with code pushed to GitHub
- [ ] Railway account created (https://railway.app)
- [ ] All deployment files in repo:
  - [ ] railway.json
  - [ ] railway.docker-compose.yml
  - [ ] .railwayignore
  - [ ] backend/Dockerfile
  - [ ] backend/.env.production
  - [ ] docker-compose.yml

## Deployment Process

### Step 1: Connect GitHub to Railway
- [ ] Visit https://railway.app
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub"
- [ ] Authorize Railway to access GitHub
- [ ] Select your repository
- [ ] Click "Deploy Now"

### Step 2: Wait for Build
- [ ] Backend builds (~2-3 minutes)
- [ ] Worker builds (~2-3 minutes)
- [ ] Redis starts automatically
- [ ] All services show "running" status

### Step 3: Configure Environment Variables
- [ ] Click "Backend" service
- [ ] Go to "Variables"
- [ ] Add:
  - [ ] `APP_ENV=production`
  - [ ] `APP_DEBUG=false`
  - [ ] `LOG_FORMAT=json`
  - [ ] `FFMPEG_TIMEOUT_SECONDS=300`
  - [ ] `MAX_FILE_SIZE_MB=500`

### Step 4: Verify Deployment
- [ ] Click "Backend" service
- [ ] Copy "Public URL"
- [ ] Test in terminal: `curl https://your-url/health`
- [ ] Expected response: `{"status":"ok",...}`

## Post-Deployment Checklist

### Get Information
- [ ] API URL: `https://___________________________`
- [ ] Backend Service ID: `_____________________`
- [ ] Worker Service ID: `_____________________`
- [ ] Redis Service ID: `_____________________`

### Test API
- [ ] Health endpoint: `curl https://[API_URL]/health`
- [ ] Ready endpoint: `curl https://[API_URL]/ready`
- [ ] Upload endpoint: `curl -F "files=@test.mp3" https://[API_URL]/upload`

### Monitor Services
- [ ] View Backend logs in Railway
- [ ] View Worker logs in Railway
- [ ] Check memory usage (should be <2 GB)
- [ ] Check CPU usage (should be low at idle)

### Configure Frontend
- [ ] Update `frontend/.env`:
  ```
  VITE_API_URL=https://[API_URL]
  ```
- [ ] Rebuild frontend
- [ ] Redeploy frontend

### Configure DNS (Optional)
- [ ] Decide on custom domain (optional)
- [ ] Add domain in Railway → Settings → Networking
- [ ] Update DNS records at registrar
- [ ] Wait for SSL cert (automatic)

## Operational Checklist

### Daily Monitoring
- [ ] Check Railway dashboard for errors
- [ ] Monitor logs for exceptions
- [ ] Verify health endpoints respond
- [ ] Check credit usage (estimate $0.10/day)

### Weekly Maintenance
- [ ] Review error logs
- [ ] Check worker performance
- [ ] Verify conversions completing
- [ ] Monitor storage usage

### Monthly Checklist
- [ ] Review monthly credit usage
- [ ] Adjust worker concurrency if needed
- [ ] Check for available updates
- [ ] Plan scaling if needed

## Troubleshooting Checklist

If something breaks, work through this:

### Backend Won't Start
- [ ] Check "Logs" tab in Backend service
- [ ] Look for "Connection refused" (Redis issue)
- [ ] Restart Backend service
- [ ] Check environment variables are set
- [ ] Verify redis://redis:6379/0 URL is correct

### Worker Not Processing Jobs
- [ ] Check "Logs" tab in Worker service
- [ ] Look for error messages
- [ ] Restart Worker service
- [ ] Verify Redis connection
- [ ] Check task is appearing in logs

### API Returns 500 Error
- [ ] Check Backend logs for exceptions
- [ ] Look for "Internal error" messages
- [ ] Restart Backend service
- [ ] Check file system permissions
- [ ] Verify FFmpeg is available

### Out of Memory
- [ ] Check memory usage in service
- [ ] Reduce worker concurrency (edit command)
- [ ] Redeploy worker
- [ ] Monitor memory over time

### Slow Conversions
- [ ] Check worker concurrency (might be too low)
- [ ] Check CPU usage (might be CPU-bound)
- [ ] Increase worker concurrency (max 4 for free tier)
- [ ] Monitor job queue depth

## Rollback Checklist

If you need to go back to a previous version:

- [ ] Navigate to "Deployments" in Railway
- [ ] Find last working deployment
- [ ] Click "Redeploy"
- [ ] Verify all services start
- [ ] Test API endpoints
- [ ] Monitor logs for errors

## Cost Monitoring Checklist

Railway provides $5 free credit/month:

- [ ] Check credit remaining in account
- [ ] Monitor daily usage
- [ ] Estimate: ~$2-3 for this app
- [ ] Alert me when credit drops below $1
- [ ] Plan upgrade to paid if exceeding limits

---

## Support Resources

| Issue | Resource |
|-------|----------|
| Railway Docs | https://docs.railway.app |
| Railway Discord | https://discord.gg/railway |
| This Project Docs | See RAILWAY_DEPLOY.md |
| API Documentation | https://[API_URL]/docs (when running) |

---

## Deployment Record

**Date Deployed**: _______________  
**API URL**: https://___________________________  
**Deployer Name**: ___________________________  
**Deployment Status**: ✅ Success / ❌ Failed  
**Notes**: ________________________________________________  

---

✅ Deployment checklist complete when all items checked!
