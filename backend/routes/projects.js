const express = require('express');
const database = require('../database');
const { validateProject, validateProjectUpdate, validateId } = require('../middleware/validation');

const router = express.Router();

/**
 * Get all projects with their tasks, milestones, and resources
 * GET /api/projects
 */
router.get('/', async (req, res) => {
  try {
    const projects = await database.all(`
      SELECT * FROM projects 
      ORDER BY created_at DESC
    `);

    // Get tasks, milestones, and resources for each project
    for (const project of projects) {
      // Get tasks
      project.tasks = await database.all(`
        SELECT t.* FROM tasks t
        INNER JOIN project_tasks pt ON t.id = pt.task_id
        WHERE pt.project_id = ?
        ORDER BY t.created_at ASC
      `, [project.id]);

      // Get milestones
      project.milestones = await database.all(`
        SELECT * FROM project_milestones 
        WHERE project_id = ? 
        ORDER BY due_date ASC
      `, [project.id]);

      // Get resource allocations
      project.resources = await database.all(`
        SELECT * FROM resource_allocations 
        WHERE project_id = ? 
        ORDER BY created_at ASC
      `, [project.id]);
    }

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
});

/**
 * Get a single project by ID
 * GET /api/projects/:id
 */
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await database.get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get tasks
    project.tasks = await database.all(`
      SELECT t.* FROM tasks t
      INNER JOIN project_tasks pt ON t.id = pt.task_id
      WHERE pt.project_id = ?
      ORDER BY t.created_at ASC
    `, [project.id]);

    // Get milestones
    project.milestones = await database.all(`
      SELECT * FROM project_milestones 
      WHERE project_id = ? 
      ORDER BY due_date ASC
    `, [project.id]);

    // Get resource allocations
    project.resources = await database.all(`
      SELECT * FROM resource_allocations 
      WHERE project_id = ? 
      ORDER BY created_at ASC
    `, [project.id]);

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project'
    });
  }
});

/**
 * Create a new project
 * POST /api/projects
 */
router.post('/', validateProject, async (req, res) => {
  try {
    const { 
      name, description, start_date, end_date, 
      status, priority, manager, budget 
    } = req.body;

    const result = await database.run(`
      INSERT INTO projects (name, description, start_date, end_date, status, priority, manager, budget) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name.trim(), description || '', start_date, end_date, status, priority, manager, budget]);

    const project = await database.get('SELECT * FROM projects WHERE id = ?', [result.lastID]);
    project.tasks = [];
    project.milestones = [];
    project.resources = [];

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    
    if (error.message.includes('CHECK constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project data'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
});

/**
 * Update a project
 * PUT /api/projects/:id
 */
router.put('/:id', validateId, validateProjectUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if project exists
    const existingProject = await database.get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    await database.run(`
      UPDATE projects 
      SET ${setClause}
      WHERE id = ?
    `, [...values, id]);

    const updatedProject = await database.get('SELECT * FROM projects WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
});

/**
 * Delete a project
 * DELETE /api/projects/:id
 */
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    await database.transaction(async () => {
      // Delete resource allocations
      await database.run('DELETE FROM resource_allocations WHERE project_id = ?', [id]);

      // Delete milestones
      await database.run('DELETE FROM project_milestones WHERE project_id = ?', [id]);

      // Delete project tasks
      await database.run('DELETE FROM project_tasks WHERE project_id = ?', [id]);

      // Delete project
      const result = await database.run('DELETE FROM projects WHERE id = ?', [id]);

      if (result.changes === 0) {
        throw new Error('Project not found');
      }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    
    if (error.message === 'Project not found') {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
});

/**
 * Add a task to a project
 * POST /api/projects/:id/tasks
 */
router.post('/:id/tasks', validateId, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { taskId } = req.body;

    // Check if project exists
    const project = await database.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if task exists
    const task = await database.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if task is already assigned to this project
    const existingAssignment = await database.get(
      'SELECT * FROM project_tasks WHERE project_id = ? AND task_id = ?', 
      [projectId, taskId]
    );
    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message: 'Task is already assigned to this project'
      });
    }

    await database.run(`
      INSERT INTO project_tasks (project_id, task_id) 
      VALUES (?, ?)
    `, [projectId, taskId]);

    res.status(201).json({
      success: true,
      message: 'Task added to project successfully'
    });
  } catch (error) {
    console.error('Error adding task to project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add task to project'
    });
  }
});

/**
 * Remove a task from a project
 * DELETE /api/projects/:id/tasks/:taskId
 */
router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    const { id: projectId, taskId } = req.params;

    const result = await database.run(`
      DELETE FROM project_tasks 
      WHERE project_id = ? AND task_id = ?
    `, [projectId, taskId]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in project'
      });
    }

    res.json({
      success: true,
      message: 'Task removed from project successfully'
    });
  } catch (error) {
    console.error('Error removing task from project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove task from project'
    });
  }
});

/**
 * Add a milestone to a project
 * POST /api/projects/:id/milestones
 */
router.post('/:id/milestones', validateId, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { title, description, due_date } = req.body;

    // Check if project exists
    const project = await database.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Milestone title must be at least 3 characters long'
      });
    }

    const result = await database.run(`
      INSERT INTO project_milestones (project_id, title, description, due_date) 
      VALUES (?, ?, ?, ?)
    `, [projectId, title.trim(), description || '', due_date]);

    const milestone = await database.get('SELECT * FROM project_milestones WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Milestone added successfully',
      data: milestone
    });
  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add milestone'
    });
  }
});

/**
 * Update a milestone
 * PUT /api/projects/:id/milestones/:milestoneId
 */
router.put('/:id/milestones/:milestoneId', async (req, res) => {
  try {
    const { id: projectId, milestoneId } = req.params;
    const updates = req.body;

    // Verify milestone exists in project
    const milestone = await database.get(`
      SELECT * FROM project_milestones 
      WHERE id = ? AND project_id = ?
    `, [milestoneId, projectId]);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Build dynamic update query
    const allowedFields = ['title', 'description', 'due_date', 'completed'];
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
      UPDATE project_milestones 
      SET ${setClause}
      WHERE id = ? AND project_id = ?
    `, [...values, milestoneId, projectId]);

    const updatedMilestone = await database.get('SELECT * FROM project_milestones WHERE id = ?', [milestoneId]);

    res.json({
      success: true,
      message: 'Milestone updated successfully',
      data: updatedMilestone
    });
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update milestone'
    });
  }
});

/**
 * Delete a milestone
 * DELETE /api/projects/:id/milestones/:milestoneId
 */
router.delete('/:id/milestones/:milestoneId', async (req, res) => {
  try {
    const { id: projectId, milestoneId } = req.params;

    const result = await database.run(`
      DELETE FROM project_milestones 
      WHERE id = ? AND project_id = ?
    `, [milestoneId, projectId]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete milestone'
    });
  }
});

/**
 * Add a resource allocation to a project
 * POST /api/projects/:id/resources
 */
router.post('/:id/resources', validateId, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { resource_name, role, hours_per_week, start_date, end_date, hourly_rate } = req.body;

    // Check if project exists
    const project = await database.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!resource_name || resource_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Resource name must be at least 2 characters long'
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const result = await database.run(`
      INSERT INTO resource_allocations (project_id, resource_name, role, hours_per_week, start_date, end_date, hourly_rate) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [projectId, resource_name.trim(), role, hours_per_week || 40, start_date, end_date, hourly_rate || 0]);

    const resource = await database.get('SELECT * FROM resource_allocations WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Resource allocation added successfully',
      data: resource
    });
  } catch (error) {
    console.error('Error adding resource allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add resource allocation'
    });
  }
});

/**
 * Update a resource allocation
 * PUT /api/projects/:id/resources/:resourceId
 */
router.put('/:id/resources/:resourceId', async (req, res) => {
  try {
    const { id: projectId, resourceId } = req.params;
    const updates = req.body;

    // Verify resource exists in project
    const resource = await database.get(`
      SELECT * FROM resource_allocations 
      WHERE id = ? AND project_id = ?
    `, [resourceId, projectId]);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource allocation not found'
      });
    }

    // Build dynamic update query
    const allowedFields = ['resource_name', 'role', 'hours_per_week', 'start_date', 'end_date', 'hourly_rate'];
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
      UPDATE resource_allocations 
      SET ${setClause}
      WHERE id = ? AND project_id = ?
    `, [...values, resourceId, projectId]);

    const updatedResource = await database.get('SELECT * FROM resource_allocations WHERE id = ?', [resourceId]);

    res.json({
      success: true,
      message: 'Resource allocation updated successfully',
      data: updatedResource
    });
  } catch (error) {
    console.error('Error updating resource allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resource allocation'
    });
  }
});

/**
 * Delete a resource allocation
 * DELETE /api/projects/:id/resources/:resourceId
 */
router.delete('/:id/resources/:resourceId', async (req, res) => {
  try {
    const { id: projectId, resourceId } = req.params;

    const result = await database.run(`
      DELETE FROM resource_allocations 
      WHERE id = ? AND project_id = ?
    `, [resourceId, projectId]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resource allocation not found'
      });
    }

    res.json({
      success: true,
      message: 'Resource allocation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resource allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resource allocation'
    });
  }
});

/**
 * Get project statistics
 * GET /api/projects/stats/summary
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) as planning,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'on-hold' THEN 1 ELSE 0 END) as on_hold,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM projects
    `);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project statistics'
    });
  }
});

module.exports = router;
