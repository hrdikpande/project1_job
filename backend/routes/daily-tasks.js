const express = require('express');
const database = require('../database');
const { validateDailyTask, validateDailyTaskUpdate, validateId } = require('../middleware/validation');

const router = express.Router();

/**
 * Get all daily tasks
 * GET /api/daily-tasks
 */
router.get('/', async (req, res) => {
  try {
    const { assigned_to, status, due_date } = req.query;
    let query = 'SELECT * FROM daily_tasks';
    let params = [];
    let conditions = [];

    // Add filters
    if (assigned_to) {
      conditions.push('assigned_to = ?');
      params.push(assigned_to);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (due_date) {
      conditions.push('due_date = ?');
      params.push(due_date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY due_date ASC, priority DESC, created_at DESC';

    const tasks = await database.all(query, params);
    
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily tasks'
    });
  }
});

/**
 * Get a single daily task by ID
 * GET /api/daily-tasks/:id
 */
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await database.get('SELECT * FROM daily_tasks WHERE id = ?', [id]);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Daily task not found'
      });
    }

    // Get progress history
    task.progress_history = await database.all(`
      SELECT * FROM daily_task_progress 
      WHERE daily_task_id = ? 
      ORDER BY progress_date DESC
    `, [id]);

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching daily task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily task'
    });
  }
});

/**
 * Create a new daily task
 * POST /api/daily-tasks
 */
router.post('/', validateDailyTask, async (req, res) => {
  try {
    const { 
      title, description, assigned_to, priority, 
      status, due_date, estimated_hours 
    } = req.body;

    const result = await database.run(`
      INSERT INTO daily_tasks (title, description, assigned_to, priority, status, due_date, estimated_hours) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title.trim(), description || '', assigned_to.trim(), priority, status, due_date, estimated_hours || 0]);

    const task = await database.get('SELECT * FROM daily_tasks WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Daily task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Error creating daily task:', error);
    
    if (error.message.includes('CHECK constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid daily task data'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create daily task'
    });
  }
});

/**
 * Update a daily task
 * PUT /api/daily-tasks/:id
 */
router.put('/:id', validateId, validateDailyTaskUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if task exists
    const existingTask = await database.get('SELECT * FROM daily_tasks WHERE id = ?', [id]);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Daily task not found'
      });
    }

    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    await database.run(`
      UPDATE daily_tasks 
      SET ${setClause}
      WHERE id = ?
    `, [...values, id]);

    const updatedTask = await database.get('SELECT * FROM daily_tasks WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Daily task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Error updating daily task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update daily task'
    });
  }
});

/**
 * Delete a daily task
 * DELETE /api/daily-tasks/:id
 */
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    await database.transaction(async () => {
      // Delete progress history first
      await database.run('DELETE FROM daily_task_progress WHERE daily_task_id = ?', [id]);

      // Delete task
      const result = await database.run('DELETE FROM daily_tasks WHERE id = ?', [id]);

      if (result.changes === 0) {
        throw new Error('Daily task not found');
      }
    });

    res.json({
      success: true,
      message: 'Daily task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting daily task:', error);
    
    if (error.message === 'Daily task not found') {
      return res.status(404).json({
        success: false,
        message: 'Daily task not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete daily task'
    });
  }
});

/**
 * Add progress to a daily task
 * POST /api/daily-tasks/:id/progress
 */
router.post('/:id/progress', validateId, async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { progress_date, hours_spent, progress_percentage, notes } = req.body;

    // Check if task exists
    const task = await database.get('SELECT * FROM daily_tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Daily task not found'
      });
    }

    if (!progress_date) {
      return res.status(400).json({
        success: false,
        message: 'Progress date is required'
      });
    }

    const result = await database.run(`
      INSERT INTO daily_task_progress (daily_task_id, progress_date, hours_spent, progress_percentage, notes) 
      VALUES (?, ?, ?, ?, ?)
    `, [taskId, progress_date, hours_spent || 0, progress_percentage || 0, notes || '']);

    // Update task's actual hours
    const totalHours = await database.get(`
      SELECT SUM(hours_spent) as total FROM daily_task_progress WHERE daily_task_id = ?
    `, [taskId]);

    await database.run(`
      UPDATE daily_tasks SET actual_hours = ? WHERE id = ?
    `, [totalHours.total || 0, taskId]);

    const progress = await database.get('SELECT * FROM daily_task_progress WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Progress added successfully',
      data: progress
    });
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add progress'
    });
  }
});

/**
 * Get daily task statistics
 * GET /api/daily-tasks/stats/summary
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { assigned_to, start_date, end_date } = req.query;
    let whereClause = '';
    let params = [];

    if (assigned_to) {
      whereClause = 'WHERE assigned_to = ?';
      params.push(assigned_to);
    }

    if (start_date && end_date) {
      whereClause = whereClause ? whereClause + ' AND' : 'WHERE';
      whereClause += ' due_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const stats = await database.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
        SUM(estimated_hours) as total_estimated_hours,
        SUM(actual_hours) as total_actual_hours
      FROM daily_tasks
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching daily task stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily task statistics'
    });
  }
});

module.exports = router;
