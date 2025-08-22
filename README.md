# Task & Checklist Manager

A comprehensive task and project management system with daily progress tracking, built with Node.js, Express, SQLite, and vanilla JavaScript.

## 🌟 Features

- **Task Management**: Create, update, and track tasks with approval workflows
- **Project Management**: Organize tasks into projects with milestones and resource allocation
- **Daily Task Management**: Track daily tasks with progress reports and time logging
- **Checklist System**: Create themed checklists with tasks and subtasks
- **Article Management**: Store and manage article links and headlines
- **Progress Reports**: Submit daily progress reports with mood and productivity tracking
- **Global Search**: Search across all content types
- **Real-time Clocks**: Indian and Thailand time zones
- **Responsive Design**: Mobile-friendly interface

## 🚀 Quick Deploy to Railway

### Option 1: Deploy with Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize and Deploy:**
   ```bash
   railway init
   railway up
   ```

### Option 2: Deploy via GitHub

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Railway:**
   - Go to [Railway.app](https://railway.app)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect the Node.js app and deploy it

## 🔧 Environment Variables

Set these environment variables in Railway dashboard:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app-name.railway.app
DB_PATH=/tmp/taskmanager.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 📁 Project Structure

```
project/
├── backend/
│   ├── data/              # SQLite database files
│   ├── middleware/        # Validation middleware
│   ├── routes/           # API routes
│   ├── tests/            # Test files
│   ├── database.js       # Database configuration
│   ├── server.js         # Express server
│   └── package.json      # Backend dependencies
├── frontend/
│   ├── index.html        # Main HTML file
│   ├── script.js         # Main JavaScript
│   ├── projects.js       # Project management
│   ├── daily-tasks.js    # Daily task management
│   ├── checklist.js      # Checklist functionality
│   └── styles.css        # Custom styles
├── railway.json          # Railway configuration
├── nixpacks.toml         # Build configuration
└── README.md             # This file
```

## 🛠️ Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd project
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your local settings
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📊 API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Daily Tasks
- `GET /api/daily-tasks` - Get all daily tasks
- `POST /api/daily-tasks` - Create a new daily task
- `PUT /api/daily-tasks/:id` - Update a daily task
- `DELETE /api/daily-tasks/:id` - Delete a daily task

### Progress Reports
- `GET /api/progress-reports` - Get all progress reports
- `POST /api/progress-reports` - Create a new progress report
- `PUT /api/progress-reports/:id` - Update a progress report
- `DELETE /api/progress-reports/:id` - Delete a progress report

### Articles
- `GET /api/articles` - Get all articles
- `POST /api/articles` - Create a new article
- `PUT /api/articles/:id` - Update an article
- `DELETE /api/articles/:id` - Delete an article

### Checklists
- `GET /api/checklists` - Get all checklists
- `POST /api/checklists` - Create a new checklist
- `PUT /api/checklists/:id` - Update a checklist
- `DELETE /api/checklists/:id` - Delete a checklist

## 🧪 Testing

Run the test suite:

```bash
cd backend
npm test
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: HTML escaping

## 📱 Features Overview

### Dashboard
- Real-time Indian and Thailand clocks
- Statistics overview
- Quick access to all sections

### Task Management
- Create tasks with approval workflow
- Set timers and track completion
- Assign approvers and track status

### Project Management
- Create projects with timelines
- Add milestones and resource allocation
- Track project progress

### Daily Tasks
- Create daily tasks with time tracking
- Submit progress reports
- Track mood and productivity

### Checklists
- Create themed checklists
- Add tasks and subtasks
- Track completion progress

### Global Search
- Search across all content types
- Filter results by category
- Quick navigation to items

## 🚀 Deployment Notes

### Railway Free Tier Limits
- **Monthly Usage**: $5 credit
- **Concurrent Deployments**: 1
- **Custom Domains**: Not available on free tier
- **Database**: SQLite (file-based, resets on restart)

### Production Considerations
1. **Database**: Consider upgrading to PostgreSQL for production
2. **File Storage**: Use cloud storage for file uploads
3. **Caching**: Implement Redis for better performance
4. **Monitoring**: Add logging and monitoring
5. **Backup**: Set up regular database backups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the Railway logs in the dashboard
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Check the API health endpoint: `/api/health`

## 🔗 Useful Links

- [Railway Documentation](https://docs.railway.app/)
- [Express.js Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
