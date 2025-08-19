const express = require('express');
const database = require('../database');
const { validateArticle, validateId } = require('../middleware/validation');

const router = express.Router();

/**
 * Get all articles
 * GET /api/articles
 */
router.get('/', async (req, res) => {
  try {
    const articles = await database.all(`
      SELECT * FROM articles 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles'
    });
  }
});

/**
 * Get a single article by ID
 * GET /api/articles/:id
 */
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const article = await database.get('SELECT * FROM articles WHERE id = ?', [id]);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article'
    });
  }
});

/**
 * Create a new article
 * POST /api/articles
 */
router.post('/', validateArticle, async (req, res) => {
  try {
    const { headline, link } = req.body;
    
    // Check for duplicate links
    const existingArticle = await database.get('SELECT id FROM articles WHERE link = ?', [link]);
    if (existingArticle) {
      return res.status(409).json({
        success: false,
        message: 'Article with this link already exists'
      });
    }

    const result = await database.run(`
      INSERT INTO articles (headline, link) 
      VALUES (?, ?)
    `, [headline.trim(), link.trim()]);

    const article = await database.get('SELECT * FROM articles WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  } catch (error) {
    console.error('Error creating article:', error);
    
    if (error.message.includes('CHECK constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid article data'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create article'
    });
  }
});

/**
 * Update an article
 * PUT /api/articles/:id
 */
router.put('/:id', validateId, validateArticle, async (req, res) => {
  try {
    const { id } = req.params;
    const { headline, link } = req.body;

    // Check if article exists
    const existingArticle = await database.get('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Check for duplicate links (excluding current article)
    const duplicateLink = await database.get(
      'SELECT id FROM articles WHERE link = ? AND id != ?', 
      [link, id]
    );
    if (duplicateLink) {
      return res.status(409).json({
        success: false,
        message: 'Article with this link already exists'
      });
    }

    await database.run(`
      UPDATE articles 
      SET headline = ?, link = ?
      WHERE id = ?
    `, [headline.trim(), link.trim(), id]);

    const updatedArticle = await database.get('SELECT * FROM articles WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: updatedArticle
    });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article'
    });
  }
});

/**
 * Delete an article
 * DELETE /api/articles/:id
 */
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await database.run('DELETE FROM articles WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete article'
    });
  }
});

module.exports = router;
