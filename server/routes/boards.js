import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

/**
 * Controller: GET /api/boards
 * Fetch all boards (convenience route)
 */
export const getAllBoards = async (req, res, next) => {
  try {
    const [boards] = await pool.query(
      'SELECT id, title, background_theme, created_at FROM boards ORDER BY created_at DESC'
    );
    res.status(200).json(boards);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: POST /api/boards
 * Create a new board (convenience route)
 */
export const createBoard = async (req, res, next) => {
  try {
    const { title, background_theme = 'default' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Board title is required',
      });
    }

    const [result] = await pool.query(
      'INSERT INTO boards (title, background_theme) VALUES (?, ?)',
      [title.trim(), background_theme]
    );

    const [newBoard] = await pool.query(
      'SELECT id, title, background_theme, created_at FROM boards WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      ...newBoard[0],
      lists: [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: GET /api/boards/:id
 * Fetch a board with deeply nested lists, cards, labels, and comments
 */
export const getBoardById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Fetch board record using parameterized query
    const [boardRows] = await pool.query(
      'SELECT id, title, background_theme, created_at FROM boards WHERE id = ?',
      [id]
    );

    if (boardRows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Board with ID ${id} not found`,
      });
    }

    const board = boardRows[0];

    // 2. Fetch lists associated with this board, ordered by position
    const [listRows] = await pool.query(
      'SELECT id, board_id, title, position FROM lists WHERE board_id = ? ORDER BY position ASC, id ASC',
      [id]
    );

    if (listRows.length === 0) {
      return res.status(200).json({
        ...board,
        lists: [],
      });
    }

    // 3. Fetch cards belonging to all lists in this board
    const listIds = listRows.map((list) => list.id);
    const listPlaceholders = listIds.map(() => '?').join(',');

    const [cardRows] = await pool.query(
      `SELECT id, list_id, title, description, due_date, position 
       FROM cards 
       WHERE list_id IN (${listPlaceholders}) 
       ORDER BY position ASC, id ASC`,
      listIds
    );

    let labelRows = [];
    let commentRows = [];

    // 4. Fetch labels and comments if there are cards
    if (cardRows.length > 0) {
      const cardIds = cardRows.map((card) => card.id);
      const cardPlaceholders = cardIds.map(() => '?').join(',');

      const [labels] = await pool.query(
        `SELECT id, card_id, name, color 
         FROM labels 
         WHERE card_id IN (${cardPlaceholders}) 
         ORDER BY id ASC`,
        cardIds
      );
      labelRows = labels;

      const [comments] = await pool.query(
        `SELECT id, card_id, content, created_at 
         FROM comments 
         WHERE card_id IN (${cardPlaceholders}) 
         ORDER BY created_at ASC, id ASC`,
        cardIds
      );
      commentRows = comments;
    }

    // Group labels by card_id
    const labelsByCardId = {};
    for (const label of labelRows) {
      if (!labelsByCardId[label.card_id]) {
        labelsByCardId[label.card_id] = [];
      }
      labelsByCardId[label.card_id].push(label);
    }

    // Group comments by card_id
    const commentsByCardId = {};
    for (const comment of commentRows) {
      if (!commentsByCardId[comment.card_id]) {
        commentsByCardId[comment.card_id] = [];
      }
      commentsByCardId[comment.card_id].push(comment);
    }

    // Nest labels and comments into each card
    const cardsWithDetails = cardRows.map((card) => ({
      ...card,
      labels: labelsByCardId[card.id] || [],
      comments: commentsByCardId[card.id] || [],
    }));

    // Group cards by list_id
    const cardsByListId = {};
    for (const card of cardsWithDetails) {
      if (!cardsByListId[card.list_id]) {
        cardsByListId[card.list_id] = [];
      }
      cardsByListId[card.list_id].push(card);
    }

    // Nest cards into each list
    const listsWithCards = listRows.map((list) => ({
      ...list,
      cards: cardsByListId[list.id] || [],
    }));

    // Return the complete deeply nested board structure
    res.status(200).json({
      ...board,
      lists: listsWithCards,
    });
  } catch (error) {
    next(error);
  }
};

// Route definitions
router.get('/', getAllBoards);
router.post('/', createBoard);
router.get('/:id', getBoardById);

export default router;
