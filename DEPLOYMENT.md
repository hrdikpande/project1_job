# 🚀 Deployment Guide

This guide will help you deploy your Task & Checklist Manager to production for free.

## 📋 Prerequisites

1. **GitHub Account** - To host your code
2. **Git** - To manage your code locally
3. **Node.js** - To run the application locally for testing

## 🎯 Quick Deployment Options

### Option 1: Render (Recommended - Easiest)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/task-manager.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com) and sign up
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name:** `task-manager-backend`
     - **Environment:** `Node`
     - **Build Command:** `cd backend && npm install`
     - **Start Command:** `cd backend && npm start`
   - Click "Create Web Service"

3. **Set Environment Variables:**
   - Go to your service dashboard
   - Click "Environment" tab
   - Add these variables:
     ```
     NODE_ENV=production
     PORT=10000
     DB_PATH=./data/taskmanager.db
     SESSION_SECRET=your-secret-key-here
     ```

4. **Your app will be live at:** `https://your-app-name.onrender.com`

### Option 2: Railway

1. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app) and sign up
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect it's a Node.js app
   - Set environment variables in the dashboard

2. **Your app will be live at:** `https://your-app-name.railway.app`

### Option 3: Heroku

1. **Install Heroku CLI:**
   ```bash
   # macOS
   brew install heroku/brew/heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Deploy:**
   ```bash
   heroku login
   heroku create your-app-name
   git push heroku main
   heroku open
   ```

## 🔧 Environment Variables

Set these environment variables in your hosting platform:

```bash
NODE_ENV=production
PORT=3000
DB_PATH=./data/taskmanager.db
SESSION_SECRET=your-super-secret-key-here
FRONTEND_URL=https://your-frontend-domain.com
```

## 📁 Project Structure

```
project/
├── backend/           # Node.js server
│   ├── server.js     # Main server file
│   ├── database.js   # Database configuration
│   ├── routes/       # API routes
│   └── package.json  # Dependencies
├── frontend/         # Frontend files
│   ├── index.html    # Main HTML file
│   ├── script.js     # Main JavaScript
│   ├── projects.js   # Project management
│   ├── daily-tasks.js # Daily tasks
│   └── styles.css    # Styling
├── render.yaml       # Render deployment config
├── Procfile          # Heroku deployment config
└── DEPLOYMENT.md     # This file
```

## 🌐 Custom Domain (Optional)

### Render
1. Go to your service dashboard
2. Click "Settings" → "Custom Domains"
3. Add your domain and follow DNS instructions

### Railway
1. Go to your project dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain

## 🔒 Security Considerations

1. **Environment Variables:** Never commit sensitive data to Git
2. **HTTPS:** All free platforms provide HTTPS automatically
3. **Rate Limiting:** Already configured in the application
4. **Input Validation:** Already implemented with Joi validation

## 📊 Monitoring

### Render
- Built-in logs and metrics
- Automatic restarts on crashes
- Performance monitoring

### Railway
- Real-time logs
- Resource usage monitoring
- Automatic scaling

## 🐛 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check if all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **App Won't Start:**
   - Check environment variables
   - Verify port configuration
   - Check logs for errors

3. **Database Issues:**
   - SQLite database is file-based and will be reset on each deployment
   - Consider using a persistent database for production

### Getting Help:

1. **Check Logs:** Most platforms provide logs in the dashboard
2. **Test Locally:** Run `npm start` locally to test
3. **Check Dependencies:** Ensure all packages are in `package.json`

## 🚀 Next Steps

After deployment:

1. **Test Your App:** Visit your live URL and test all features
2. **Set Up Monitoring:** Configure alerts for downtime
3. **Backup Strategy:** Consider database backups
4. **Performance:** Monitor and optimize as needed

## 📞 Support

- **Render:** [docs.render.com](https://docs.render.com)
- **Railway:** [docs.railway.app](https://docs.railway.app)
- **Heroku:** [devcenter.heroku.com](https://devcenter.heroku.com)

---

**Happy Deploying! 🎉**
