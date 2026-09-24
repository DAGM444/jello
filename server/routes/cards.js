import express from 'express';
import pool from '../config/db.js';
import commentsRouter from './comments.js';

const router = express.Router();

/**
 * Controller: POST /api/cards
 * Create a new card
 * Body: { list_id, title, description, due_date, position }
 */
export const createCard = async (req, res, next) => {
  try {
    const { list_id, title, description = null, due_date = null, position } = req.body;

    if (!list_id || !title || !title.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'list_id and title are required fields',
      });
    }

    // Verify list exists using parameterized query
    const [listRows] = await pool.query('SELECT id FROM lists WHERE id = ?', [list_id]);
    if (listRows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `List with ID ${list_id} not found`,
      });
    }

    // Calculate position if not provided
    let cardPosition = position;
    if (cardPosition === undefined || cardPosition === null) {
      const [posRows] = await pool.query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS nextPos FROM cards WHERE list_id = ?',
        [list_id]
      );
      cardPosition = posRows[0].nextPos;
    }

    const [result] = await pool.query(
      'INSERT INTO cards (list_id, title, description, due_date, position) VALUES (?, ?, ?, ?, ?)',
      [list_id, title.trim(), description, due_date, Number(cardPosition)]
    );

    const [newCard] = await pool.query(
      'SELECT id, list_id, title, description, due_date, position FROM cards WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      ...newCard[0],
      labels: [],
      comments: [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: PATCH /api/cards/:id/move
 * Move card to a new list and/or new position for drag-and-drop
 * Body: { list_id, position }
 */
export const moveCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { list_id, position } = req.body;

    if (list_id === undefined && position === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'At least one of list_id or position must be provided to move a card',
      });
    }

    // Check if card exists
    const [cardRows] = await pool.query(
      'SELECT id, list_id, position FROM cards WHERE id = ?',
      [id]
    );

    if (cardRows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Card with ID ${id} not found`,
      });
    }

    const currentCard = cardRows[0];
    let targetListId = currentCard.list_id;
    let targetPosition = currentCard.position;

    if (list_id !== undefined) {
      // Check if target list exists
      const [targetListRows] = await pool.query('SELECT id FROM lists WHERE id = ?', [list_id]);
      if (targetListRows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Target list with ID ${list_id} not found`,
        });
      }
      targetListId = Number(list_id);
    }

    if (position !== undefined) {
      if (isNaN(Number(position))) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Position must be a valid number',
        });
      }
      targetPosition = Number(position);
    }

    // Update list_id and position using parameterized query
    await pool.query(
      'UPDATE cards SET list_id = ?, position = ? WHERE id = ?',
      [targetListId, targetPosition, id]
    );

    const [updatedCard] = await pool.query(
      'SELECT id, list_id, title, description, due_date, position FROM cards WHERE id = ?',
      [id]
    );

    res.status(200).json(updatedCard[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: DELETE /api/cards/:id
 * Delete a card (foreign keys will cascade delete associated labels and comments)
 */
export const deleteCard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [cardRows] = await pool.query('SELECT id FROM cards WHERE id = ?', [id]);
    if (cardRows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Card with ID ${id} not found`,
      });
    }

    await pool.query('DELETE FROM cards WHERE id = ?', [id]);

    res.status(200).json({
      message: 'Card deleted successfully',
      id: Number(id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: GET /api/cards/:id (convenience route)
 */
export const getCardById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [cardRows] = await pool.query(
      'SELECT id, list_id, title, description, due_date, position FROM cards WHERE id = ?',
      [id]
    );

    if (cardRows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Card with ID ${id} not found`,
      });
    }

    const [labels] = await pool.query('SELECT id, card_id, name, color FROM labels WHERE card_id = ?', [id]);
    const [comments] = await pool.query(
      'SELECT id, card_id, content, created_at FROM comments WHERE card_id = ? ORDER BY created_at ASC',
      [id]
    );

    res.status(200).json({
      ...cardRows[0],
      labels,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// Sub-router for card comments
router.use('/:id/comments', commentsRouter);

// Route definitions
router.post('/', createCard);
router.patch('/:id/move', moveCard);
router.delete('/:id', deleteCard);
router.get('/:id', getCardById);

export default router;
