// Production Configuration Example
// Copy this to config.js and update with your values

module.exports = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  dbPath: process.env.DB_PATH || './data/taskmanager.db',
  
  // Frontend URL for CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Security
  sessionSecret: process.env.SESSION_SECRET || 'your-super-secret-session-key-here',
  
  // Rate Limiting
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // requests per window
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};
