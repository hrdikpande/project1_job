# 🚀 Railway Deployment Guide

## Quick Start (5 minutes)

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Deploy on Railway:**
   - Go to [Railway.app](https://railway.app)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect and deploy

3. **Set Environment Variables:**
   - Go to your project dashboard
   - Click "Variables" tab
   - Add these variables:
     ```
     NODE_ENV=production
     PORT=3000
     DB_PATH=/tmp/taskmanager.db
     JWT_SECRET=your-super-secret-key-here
     FRONTEND_URL=https://your-app-name.railway.app
     ```

### Option 2: Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   railway variables set DB_PATH=/tmp/taskmanager.db
   railway variables set JWT_SECRET=your-secret-key
   ```

## 🔧 Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port |
| `DB_PATH` | `/tmp/taskmanager.db` | SQLite database path |
| `JWT_SECRET` | `your-secret-key` | JWT signing secret |
| `FRONTEND_URL` | `https://your-app.railway.app` | Your app URL |

## 📊 Monitoring

- **Logs:** View in Railway dashboard
- **Health Check:** `https://your-app.railway.app/api/health`
- **Metrics:** Available in Railway dashboard

## 🆘 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check Railway logs
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **App Won't Start:**
   - Check environment variables
   - Verify PORT is set correctly
   - Check database path permissions

3. **Database Issues:**
   - SQLite file is in `/tmp/` (resets on restart)
   - Consider upgrading to PostgreSQL for production

### Useful Commands:

```bash
# View logs
railway logs

# Check status
railway status

# Restart deployment
railway up

# View variables
railway variables
```

## 🎯 Next Steps

1. **Custom Domain:** Upgrade to paid plan for custom domains
2. **Database:** Consider PostgreSQL for persistent data
3. **Monitoring:** Add application monitoring
4. **Backup:** Set up regular backups
5. **SSL:** Railway provides automatic SSL certificates

## 📞 Support

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [GitHub Issues](https://github.com/railwayapp/railway/issues)

---

**Your app will be live at:** `https://your-app-name.railway.app`
