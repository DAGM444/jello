import express from 'express';
import pool from '../config/db.js';

const router = express.Router({ mergeParams: true });

/**
 * Helper to extract card ID from route parameters (:id or :cardId)
 */
const getCardId = (req) => req.params.id || req.params.cardId;

/**
 * Controller: GET /api/cards/:id/comments
 * Fetch all comments for a card
 */
export const getCommentsByCardId = async (req, res, next) => {
  try {
    const cardId = getCardId(req);

    if (!cardId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Card ID parameter is required',
      });
    }

    // Verify card exists using parameterized query
    const [cardRows] = await pool.query('SELECT id FROM cards WHERE id = ?', [cardId]);
    if (cardRows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Card with ID ${cardId} not found`,
      });
    }

    const [comments] = await pool.query(
      'SELECT id, card_id, content, created_at FROM comments WHERE card_id = ? ORDER BY created_at ASC, id ASC',
      [cardId]
    );

    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: POST /api/cards/:id/comments
 * Add a comment to a card
 * Body: { content }
 */
export const createCommentForCard = async (req, res, next) => {
  try {
    const cardId = getCardId(req);
    const { content } = req.body;

    if (!cardId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Card ID parameter is required',
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Comment content cannot be empty',
      });
    }

    // Verify card exists
    const [cardRows] = await pool.query('SELECT id FROM cards WHERE id = ?', [cardId]);
    if (cardRows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Card with ID ${cardId} not found`,
      });
    }

    const [result] = await pool.query(
      'INSERT INTO comments (card_id, content) VALUES (?, ?)',
      [cardId, content.trim()]
    );

    const [newComment] = await pool.query(
      'SELECT id, card_id, content, created_at FROM comments WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newComment[0]);
  } catch (error) {
    next(error);
  }
};

// Route matching /:id/comments when mounted at /api/cards
router.get('/:id/comments', getCommentsByCardId);
router.post('/:id/comments', createCommentForCard);

// Route matching / when mounted as a sub-router like /api/cards/:id/comments
router.get('/', getCommentsByCardId);
router.post('/', createCommentForCard);

export default router;
