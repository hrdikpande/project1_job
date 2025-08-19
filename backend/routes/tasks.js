const express = require('express');
const database = require('../database');
const { validateTask, validateTaskUpdate, validateId } = require('../middleware/validation');

const router = express.Router();

/**
 * Get all tasks
 * GET /api/tasks
 */
router.get('/', async (req, res) => {
  try {
    const tasks = await database.all(`
      SELECT * FROM tasks 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

/**
 * Get a single task by ID
 * GET /api/tasks/:id
 */
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await database.get('SELECT * FROM tasks WHERE id = ?', [id]);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
});

/**
 * Create a new task
 * POST /api/tasks
 */
router.post('/', validateTask, async (req, res) => {
  try {
    const { name, creator } = req.body;
    
    const result = await database.run(`
      INSERT INTO tasks (name, creator) 
      VALUES (?, ?)
    `, [name.trim(), creator.trim()]);

    const task = await database.get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error.message.includes('CHECK constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task data'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

/**
 * Update a task
 * PUT /api/tasks/:id
 */
router.put('/:id', validateId, validateTaskUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if task exists
    const existingTask = await database.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    await database.run(`
      UPDATE tasks 
      SET ${setClause}
      WHERE id = ?
    `, [...values, id]);

    const updatedTask = await database.get('SELECT * FROM tasks WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await database.run('DELETE FROM tasks WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

/**
 * Get task statistics
 * GET /api/tasks/stats
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM tasks
    `);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task statistics'
    });
  }
});

module.exports = router;
