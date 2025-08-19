const express = require('express');
const database = require('../database');
const { 
  validateChecklist, 
  validateChecklistTask, 
  validateSubtask, 
  validateId 
} = require('../middleware/validation');

const router = express.Router();

/**
 * Generate unique ID for checklists
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get all checklists with their tasks and subtasks
 * GET /api/checklists
 */
router.get('/', async (req, res) => {
  try {
    // Get all checklists
    const checklists = await database.all(`
      SELECT * FROM checklists 
      ORDER BY created_at DESC
    `);

    // Get tasks and subtasks for each checklist
    for (const checklist of checklists) {
      checklist.tasks = await database.all(`
        SELECT * FROM checklist_tasks 
        WHERE checklist_id = ? 
        ORDER BY created_at ASC
      `, [checklist.id]);

      // Get subtasks for each task
      for (const task of checklist.tasks) {
        task.subtasks = await database.all(`
          SELECT * FROM subtasks 
          WHERE task_id = ? 
          ORDER BY created_at ASC
        `, [task.id]);
      }
    }

    res.json({
      success: true,
      data: checklists
    });
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch checklists'
    });
  }
});

/**
 * Get a single checklist with tasks and subtasks
 * GET /api/checklists/:id
 */
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    const checklist = await database.get('SELECT * FROM checklists WHERE id = ?', [id]);
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist not found'
      });
    }

    // Get tasks
    checklist.tasks = await database.all(`
      SELECT * FROM checklist_tasks 
      WHERE checklist_id = ? 
      ORDER BY created_at ASC
    `, [checklist.id]);

    // Get subtasks for each task
    for (const task of checklist.tasks) {
      task.subtasks = await database.all(`
        SELECT * FROM subtasks 
        WHERE task_id = ? 
        ORDER BY created_at ASC
      `, [task.id]);
    }

    res.json({
      success: true,
      data: checklist
    });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch checklist'
    });
  }
});

/**
 * Create a new checklist
 * POST /api/checklists
 */
router.post('/', validateChecklist, async (req, res) => {
  try {
    const { title, description, theme } = req.body;
    const id = generateId();

    await database.run(`
      INSERT INTO checklists (id, title, description, theme) 
      VALUES (?, ?, ?, ?)
    `, [id, title.trim(), description || '', theme]);

    const checklist = await database.get('SELECT * FROM checklists WHERE id = ?', [id]);
    checklist.tasks = [];

    res.status(201).json({
      success: true,
      message: 'Checklist created successfully',
      data: checklist
    });
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checklist'
    });
  }
});

/**
 * Update a checklist
 * PUT /api/checklists/:id
 */
router.put('/:id', validateId, validateChecklist, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, theme } = req.body;

    const existingChecklist = await database.get('SELECT * FROM checklists WHERE id = ?', [id]);
    if (!existingChecklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist not found'
      });
    }

    await database.run(`
      UPDATE checklists 
      SET title = ?, description = ?, theme = ?
      WHERE id = ?
    `, [title.trim(), description || '', theme, id]);

    const updatedChecklist = await database.get('SELECT * FROM checklists WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Checklist updated successfully',
      data: updatedChecklist
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update checklist'
    });
  }
});

/**
 * Delete a checklist
 * DELETE /api/checklists/:id
 */
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    await database.transaction(async () => {
      // Delete subtasks first
      await database.run(`
        DELETE FROM subtasks 
        WHERE task_id IN (
          SELECT id FROM checklist_tasks WHERE checklist_id = ?
        )
      `, [id]);

      // Delete tasks
      await database.run('DELETE FROM checklist_tasks WHERE checklist_id = ?', [id]);

      // Delete checklist
      const result = await database.run('DELETE FROM checklists WHERE id = ?', [id]);

      if (result.changes === 0) {
        throw new Error('Checklist not found');
      }
    });

    res.json({
      success: true,
      message: 'Checklist deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    
    if (error.message === 'Checklist not found') {
      return res.status(404).json({
        success: false,
        message: 'Checklist not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete checklist'
    });
  }
});

/**
 * Add a task to checklist
 * POST /api/checklists/:id/tasks
 */
router.post('/:id/tasks', validateId, validateChecklistTask, async (req, res) => {
  try {
    const { id: checklistId } = req.params;
    const { title, priority } = req.body;

    // Check if checklist exists
    const checklist = await database.get('SELECT * FROM checklists WHERE id = ?', [checklistId]);
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist not found'
      });
    }

    const taskId = generateId();
    await database.run(`
      INSERT INTO checklist_tasks (id, checklist_id, title, priority) 
      VALUES (?, ?, ?, ?)
    `, [taskId, checklistId, title.trim(), priority]);

    const task = await database.get('SELECT * FROM checklist_tasks WHERE id = ?', [taskId]);
    task.subtasks = [];

    res.status(201).json({
      success: true,
      message: 'Task added successfully',
      data: task
    });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add task'
    });
  }
});

/**
 * Update a checklist task
 * PUT /api/checklists/:checklistId/tasks/:taskId
 */
router.put('/:checklistId/tasks/:taskId', async (req, res) => {
  try {
    const { checklistId, taskId } = req.params;
    const updates = req.body;

    const task = await database.get(`
      SELECT * FROM checklist_tasks 
      WHERE id = ? AND checklist_id = ?
    `, [taskId, checklistId]);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Build dynamic update query
    const allowedFields = ['title', 'priority', 'completed'];
    const fields = Object.keys(updates).filter(field => allowedFields.includes(field));
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const values = fields.map(field => updates[field]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    await database.run(`
      UPDATE checklist_tasks 
      SET ${setClause}
      WHERE id = ? AND checklist_id = ?
    `, [...values, taskId, checklistId]);

    const updatedTask = await database.get(`
      SELECT * FROM checklist_tasks 
      WHERE id = ? AND checklist_id = ?
    `, [taskId, checklistId]);

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
 * Delete a checklist task
 * DELETE /api/checklists/:checklistId/tasks/:taskId
 */
router.delete('/:checklistId/tasks/:taskId', async (req, res) => {
  try {
    const { checklistId, taskId } = req.params;

    await database.transaction(async () => {
      // Delete subtasks first
      await database.run('DELETE FROM subtasks WHERE task_id = ?', [taskId]);

      // Delete task
      const result = await database.run(`
        DELETE FROM checklist_tasks 
        WHERE id = ? AND checklist_id = ?
      `, [taskId, checklistId]);

      if (result.changes === 0) {
        throw new Error('Task not found');
      }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    
    if (error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

/**
 * Add a subtask to a checklist task
 * POST /api/checklists/:checklistId/tasks/:taskId/subtasks
 */
router.post('/:checklistId/tasks/:taskId/subtasks', validateSubtask, async (req, res) => {
  try {
    const { checklistId, taskId } = req.params;
    const { title } = req.body;

    // Check if task exists
    const task = await database.get(`
      SELECT * FROM checklist_tasks 
      WHERE id = ? AND checklist_id = ?
    `, [taskId, checklistId]);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtaskId = generateId();
    await database.run(`
      INSERT INTO subtasks (id, task_id, title) 
      VALUES (?, ?, ?)
    `, [subtaskId, taskId, title.trim()]);

    const subtask = await database.get('SELECT * FROM subtasks WHERE id = ?', [subtaskId]);

    res.status(201).json({
      success: true,
      message: 'Subtask added successfully',
      data: subtask
    });
  } catch (error) {
    console.error('Error adding subtask:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add subtask'
    });
  }
});

/**
 * Update a subtask
 * PUT /api/checklists/:checklistId/tasks/:taskId/subtasks/:subtaskId
 */
router.put('/:checklistId/tasks/:taskId/subtasks/:subtaskId', async (req, res) => {
  try {
    const { checklistId, taskId, subtaskId } = req.params;
    const updates = req.body;

    // Verify task exists in checklist
    const task = await database.get(`
      SELECT * FROM checklist_tasks 
      WHERE id = ? AND checklist_id = ?
    `, [taskId, checklistId]);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Build dynamic update query
    const allowedFields = ['title', 'completed'];
    const fields = Object.keys(updates).filter(field => allowedFields.includes(field));
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const values = fields.map(field => updates[field]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const result = await database.run(`
      UPDATE subtasks 
      SET ${setClause}
      WHERE id = ? AND task_id = ?
    `, [...values, subtaskId, taskId]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    const updatedSubtask = await database.get('SELECT * FROM subtasks WHERE id = ?', [subtaskId]);

    res.json({
      success: true,
      message: 'Subtask updated successfully',
      data: updatedSubtask
    });
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subtask'
    });
  }
});

/**
 * Delete a subtask
 * DELETE /api/checklists/:checklistId/tasks/:taskId/subtasks/:subtaskId
 */
router.delete('/:checklistId/tasks/:taskId/subtasks/:subtaskId', async (req, res) => {
  try {
    const { checklistId, taskId, subtaskId } = req.params;

    // Verify task exists in checklist
    const task = await database.get(`
      SELECT * FROM checklist_tasks 
      WHERE id = ? AND checklist_id = ?
    `, [taskId, checklistId]);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const result = await database.run(`
      DELETE FROM subtasks 
      WHERE id = ? AND task_id = ?
    `, [subtaskId, taskId]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    res.json({
      success: true,
      message: 'Subtask deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subtask'
    });
  }
});

module.exports = router;
