const express = require('express');
const database = require('../database');
const { validateProgressReport, validateProgressReportUpdate, validateId } = require('../middleware/validation');

const router = express.Router();

/**
 * Get all progress reports
 * GET /api/progress-reports
 */
router.get('/', async (req, res) => {
  try {
    const { reporter_name, start_date, end_date } = req.query;
    let query = 'SELECT * FROM daily_progress_reports';
    let params = [];
    let conditions = [];

    // Add filters
    if (reporter_name) {
      conditions.push('reporter_name = ?');
      params.push(reporter_name);
    }

    if (start_date && end_date) {
      conditions.push('report_date BETWEEN ? AND ?');
      params.push(start_date, end_date);
    } else if (start_date) {
      conditions.push('report_date >= ?');
      params.push(start_date);
    } else if (end_date) {
      conditions.push('report_date <= ?');
      params.push(end_date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY report_date DESC, created_at DESC';

    const reports = await database.all(query, params);
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching progress reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress reports'
    });
  }
});

/**
 * Get a single progress report by ID
 * GET /api/progress-reports/:id
 */
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await database.get('SELECT * FROM daily_progress_reports WHERE id = ?', [id]);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Progress report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching progress report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress report'
    });
  }
});

/**
 * Create a new progress report
 * POST /api/progress-reports
 */
router.post('/', validateProgressReport, async (req, res) => {
  try {
    const { 
      reporter_name, report_date, tasks_completed, tasks_in_progress, 
      tasks_blocked, hours_worked, challenges, next_day_plan, 
      mood_rating, productivity_score 
    } = req.body;

    // Check if report already exists for this date and reporter
    const existingReport = await database.get(
      'SELECT id FROM daily_progress_reports WHERE reporter_name = ? AND report_date = ?',
      [reporter_name, report_date]
    );

    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: 'Progress report already exists for this date and reporter'
      });
    }

    const result = await database.run(`
      INSERT INTO daily_progress_reports (
        reporter_name, report_date, tasks_completed, tasks_in_progress, 
        tasks_blocked, hours_worked, challenges, next_day_plan, 
        mood_rating, productivity_score
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reporter_name.trim(), report_date, tasks_completed || '', tasks_in_progress || '',
      tasks_blocked || '', hours_worked || 0, challenges || '', next_day_plan || '',
      mood_rating || 3, productivity_score || 3
    ]);

    const report = await database.get('SELECT * FROM daily_progress_reports WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Progress report created successfully',
      data: report
    });
  } catch (error) {
    console.error('Error creating progress report:', error);
    
    if (error.message.includes('CHECK constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid progress report data'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create progress report'
    });
  }
});

/**
 * Update a progress report
 * PUT /api/progress-reports/:id
 */
router.put('/:id', validateId, validateProgressReportUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if report exists
    const existingReport = await database.get('SELECT * FROM daily_progress_reports WHERE id = ?', [id]);
    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: 'Progress report not found'
      });
    }

    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    await database.run(`
      UPDATE daily_progress_reports 
      SET ${setClause}
      WHERE id = ?
    `, [...values, id]);

    const updatedReport = await database.get('SELECT * FROM daily_progress_reports WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Progress report updated successfully',
      data: updatedReport
    });
  } catch (error) {
    console.error('Error updating progress report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress report'
    });
  }
});

/**
 * Delete a progress report
 * DELETE /api/progress-reports/:id
 */
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await database.run('DELETE FROM daily_progress_reports WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Progress report not found'
      });
    }

    res.json({
      success: true,
      message: 'Progress report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting progress report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete progress report'
    });
  }
});

/**
 * Get progress report statistics
 * GET /api/progress-reports/stats/summary
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { reporter_name, start_date, end_date } = req.query;
    let whereClause = '';
    let params = [];

    if (reporter_name) {
      whereClause = 'WHERE reporter_name = ?';
      params.push(reporter_name);
    }

    if (start_date && end_date) {
      whereClause = whereClause ? whereClause + ' AND' : 'WHERE';
      whereClause += ' report_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_reports,
        AVG(hours_worked) as avg_hours_worked,
        AVG(mood_rating) as avg_mood_rating,
        AVG(productivity_score) as avg_productivity_score,
        SUM(hours_worked) as total_hours_worked
      FROM daily_progress_reports
      ${whereClause}
    `, params);

    // Get mood distribution
    const moodDistribution = await database.all(`
      SELECT 
        mood_rating,
        COUNT(*) as count
      FROM daily_progress_reports
      ${whereClause}
      GROUP BY mood_rating
      ORDER BY mood_rating
    `, params);

    // Get productivity distribution
    const productivityDistribution = await database.all(`
      SELECT 
        productivity_score,
        COUNT(*) as count
      FROM daily_progress_reports
      ${whereClause}
      GROUP BY productivity_score
      ORDER BY productivity_score
    `, params);

    res.json({
      success: true,
      data: {
        ...stats,
        mood_distribution: moodDistribution,
        productivity_distribution: productivityDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching progress report stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress report statistics'
    });
  }
});

/**
 * Get recent progress reports for a reporter
 * GET /api/progress-reports/reporter/:name
 */
router.get('/reporter/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { limit = 10 } = req.query;

    const reports = await database.all(`
      SELECT * FROM daily_progress_reports 
      WHERE reporter_name = ? 
      ORDER BY report_date DESC, created_at DESC 
      LIMIT ?
    `, [name, parseInt(limit)]);

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reporter progress reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reporter progress reports'
    });
  }
});

module.exports = router;
