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
      )`
    ];

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
      'CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_checklist_tasks_checklist ON checklist_tasks(checklist_id)',
      'CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id)'
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
