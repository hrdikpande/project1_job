const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

/**
 * Database class for SQLite operations with connection pooling and error handling
 */
class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'taskmanager.db');
  }

  /**
   * Initialize database connection and create tables
   */
  async init() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      await fs.mkdir(dataDir, { recursive: true });

      // Create database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          throw new Error(`Database connection failed: ${err.message}`);
        }
      });

      // Enable foreign keys and WAL mode for better performance
      await this.run('PRAGMA foreign_keys = ON');
      await this.run('PRAGMA journal_mode = WAL');
      await this.run('PRAGMA synchronous = NORMAL');

      // Create tables
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      // Ensure database is closed on error
      if (this.db) {
        await this.close();
      }
      throw error;
    }
  }

  /**
   * Create all required tables with proper indexes
   */
  async createTables() {
    const tables = [
      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(name) >= 3),
        creator TEXT NOT NULL CHECK(length(creator) >= 2),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        approver TEXT,
        timer TEXT,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Articles table
      `CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        headline TEXT NOT NULL CHECK(length(headline) >= 5),
        link TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Checklists table
      `CREATE TABLE IF NOT EXISTS checklists (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL CHECK(length(title) >= 3),
        description TEXT DEFAULT '',
        theme TEXT DEFAULT 'blue',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Checklist tasks table
      `CREATE TABLE IF NOT EXISTS checklist_tasks (
        id TEXT PRIMARY KEY,
        checklist_id TEXT NOT NULL,
        title TEXT NOT NULL,
        priority TEXT DEFAULT 'Medium' CHECK(priority IN ('High', 'Medium', 'Low')),
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
      )`,

      // Subtasks table
      `CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL CHECK(length(title) >= 2),
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES checklist_tasks(id) ON DELETE CASCADE
      )`,

      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(name) >= 3),
        description TEXT DEFAULT '',
        start_date DATE,
        end_date DATE,
        status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        manager TEXT,
        budget REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Project tasks table (linking tasks to projects)
      `CREATE TABLE IF NOT EXISTS project_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        UNIQUE(project_id, task_id)
      )`,

      // Project milestones table
      `CREATE TABLE IF NOT EXISTS project_milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL CHECK(length(title) >= 3),
        description TEXT DEFAULT '',
        due_date DATE,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`,

      // Resource allocation table
      `CREATE TABLE IF NOT EXISTS resource_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        resource_name TEXT NOT NULL CHECK(length(resource_name) >= 2),
        role TEXT NOT NULL,
        hours_per_week REAL DEFAULT 40,
        start_date DATE,
        end_date DATE,
        hourly_rate REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`,

      // Daily tasks table
      `CREATE TABLE IF NOT EXISTS daily_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(title) >= 3),
        description TEXT DEFAULT '',
        assigned_to TEXT NOT NULL CHECK(length(assigned_to) >= 2),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed', 'blocked')),
        due_date DATE NOT NULL,
        estimated_hours REAL DEFAULT 0,
        actual_hours REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Daily progress reports table
      `CREATE TABLE IF NOT EXISTS daily_progress_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_name TEXT NOT NULL CHECK(length(reporter_name) >= 2),
        report_date DATE NOT NULL,
        tasks_completed TEXT DEFAULT '',
        tasks_in_progress TEXT DEFAULT '',
        tasks_blocked TEXT DEFAULT '',
        hours_worked REAL DEFAULT 0,
        challenges TEXT DEFAULT '',
        next_day_plan TEXT DEFAULT '',
        mood_rating INTEGER DEFAULT 3 CHECK(mood_rating >= 1 AND mood_rating <= 5),
        productivity_score INTEGER DEFAULT 3 CHECK(productivity_score >= 1 AND productivity_score <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Daily task progress tracking table
      `CREATE TABLE IF NOT EXISTS daily_task_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        daily_task_id INTEGER NOT NULL,
        progress_date DATE NOT NULL,
        hours_spent REAL DEFAULT 0,
        progress_percentage INTEGER DEFAULT 0 CHECK(progress_percentage >= 0 AND progress_percentage <= 100),
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (daily_task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE
      )`
    ];

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
      'CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_checklist_tasks_checklist ON checklist_tasks(checklist_id)',
      'CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id)',
      'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority)',
      'CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_project_tasks_task ON project_tasks(task_id)',
      'CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_resource_allocations_project ON resource_allocations(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_daily_tasks_assigned_to ON daily_tasks(assigned_to)',
      'CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON daily_tasks(status)',
      'CREATE INDEX IF NOT EXISTS idx_daily_tasks_due_date ON daily_tasks(due_date)',
      'CREATE INDEX IF NOT EXISTS idx_daily_progress_reports_reporter ON daily_progress_reports(reporter_name)',
      'CREATE INDEX IF NOT EXISTS idx_daily_progress_reports_date ON daily_progress_reports(report_date)',
      'CREATE INDEX IF NOT EXISTS idx_daily_task_progress_task ON daily_task_progress(daily_task_id)',
      'CREATE INDEX IF NOT EXISTS idx_daily_task_progress_date ON daily_task_progress(progress_date)'
    ];

    // Execute table creation
    for (const table of tables) {
      await this.run(table);
    }

    // Create indexes
    for (const index of indexes) {
      await this.run(index);
    }

    // Create triggers for updated_at
    await this.run(`
      CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
      AFTER UPDATE ON tasks 
      BEGIN 
        UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    await this.run(`
      CREATE TRIGGER IF NOT EXISTS update_checklists_timestamp 
      AFTER UPDATE ON checklists 
      BEGIN 
        UPDATE checklists SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    await this.run(`
      CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
      AFTER UPDATE ON projects 
      BEGIN 
        UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    await this.run(`
      CREATE TRIGGER IF NOT EXISTS update_daily_tasks_timestamp 
      AFTER UPDATE ON daily_tasks 
      BEGIN 
        UPDATE daily_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);
  }

  /**
   * Execute a SQL query that doesn't return data
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Execute a SQL query that returns a single row
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Execute a SQL query that returns multiple rows
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Execute multiple SQL statements in a transaction
   * @param {Function} callback - Function containing database operations
   */
  async transaction(callback) {
    await this.run('BEGIN TRANSACTION');
    try {
      await callback();
      await this.run('COMMIT');
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }
}

module.exports = new Database();
