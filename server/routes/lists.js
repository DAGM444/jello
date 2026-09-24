import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

/**
 * Controller: POST /api/lists
 * Create a new list on a board
 * Body: { board_id, title, position }
 */
export const createList = async (req, res, next) => {
  try {
    const { board_id, title, position } = req.body;

    if (!board_id || !title || !title.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'board_id and title are required fields',
      });
    }

    // Verify board exists using parameterized query
    const [boardRows] = await pool.query('SELECT id FROM boards WHERE id = ?', [board_id]);
    if (boardRows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Board with ID ${board_id} not found`,
      });
    }

    // Calculate next position if not explicitly provided
    let listPosition = position;
    if (listPosition === undefined || listPosition === null) {
      const [posRows] = await pool.query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS nextPos FROM lists WHERE board_id = ?',
        [board_id]
      );
      listPosition = posRows[0].nextPos;
    }

    const [result] = await pool.query(
      'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
      [board_id, title.trim(), Number(listPosition)]
    );

    const [newList] = await pool.query(
      'SELECT id, board_id, title, position FROM lists WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      ...newList[0],
      cards: [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: PATCH /api/lists/:id/reorder
 * Reorder a list by updating its position
 * Body: { position }
 */
export const reorderList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (position === undefined || position === null || isNaN(Number(position))) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'A valid numeric position is required',
      });
    }

    // Check if list exists
    const [existingList] = await pool.query('SELECT id, board_id, position FROM lists WHERE id = ?', [id]);
    if (existingList.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `List with ID ${id} not found`,
      });
    }

    const targetPosition = Number(position);

    // Update list position
    await pool.query('UPDATE lists SET position = ? WHERE id = ?', [targetPosition, id]);

    const [updatedList] = await pool.query(
      'SELECT id, board_id, title, position FROM lists WHERE id = ?',
      [id]
    );

    res.status(200).json(updatedList[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: GET /api/lists/:id (convenience route)
 */
export const getListById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, board_id, title, position FROM lists WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `List with ID ${id} not found`,
      });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: DELETE /api/lists/:id (convenience route)
 */
export const deleteList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id FROM lists WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `List with ID ${id} not found`,
      });
    }

    await pool.query('DELETE FROM lists WHERE id = ?', [id]);

    res.status(200).json({
      message: 'List deleted successfully',
      id: Number(id),
    });
  } catch (error) {
    next(error);
  }
};

// Route definitions
router.post('/', createList);
router.patch('/:id/reorder', reorderList);
router.get('/:id', getListById);
router.delete('/:id', deleteList);

export default router;
