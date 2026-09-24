import React, { useEffect, useState, useCallback } from 'react';
import TopNav from '@/components/kanban/TopNav';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import CardDetailDrawer from '@/components/kanban/CardDetailDrawer';
import api from '@/services/api';
import { AlertCircle, RefreshCw, Plus } from 'lucide-react';

const ACCENT_COLORS = [
  'bg-indigo-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-purple-500',
];

export default function Home() {
  const [theme, setTheme] = useState('light');
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Drag and drop state
  const [dragging, setDragging] = useState(null); // { cardId, fromListId }
  const [dropTarget, setDropTarget] = useState(null); // { listId, index }
  const [draggingListIndex, setDraggingListIndex] = useState(null);

  // Card detail drawer state
  const [activeCard, setActiveCard] = useState(null);
  const [activeListTitle, setActiveListTitle] = useState('');

  // Handle theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  /**
   * Fetch board data with deeply nested lists, cards, labels, and comments from the Express backend
   */
  const loadBoardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let boardData = null;
      try {
        // Attempt to fetch board with ID 1
        boardData = await api.boards.getById(1);
      } catch (err) {
        // If board 1 is not found, check if other boards exist
        const allBoards = await api.boards.getAll().catch(() => []);
        if (allBoards && allBoards.length > 0) {
          boardData = await api.boards.getById(allBoards[0].id);
        } else {
          // Initialize default board and seed starter lists
          const createdBoard = await api.boards.create({
            title: 'Sprint Roadmap',
            background_theme: 'default',
          });

          const defaultColumns = ['To Do', 'In Progress', 'Done'];
          const createdLists = [];

          for (let i = 0; i < defaultColumns.length; i++) {
            const list = await api.lists.create({
              board_id: createdBoard.id,
              title: defaultColumns[i],
              position: i,
            });
            createdLists.push({ ...list, cards: [] });
          }

          boardData = { ...createdBoard, lists: createdLists };
        }
      }

      setBoard(boardData);
      setLists(boardData?.lists || []);
    } catch (err) {
      console.error('Error fetching board from backend:', err);
      setError(err.message || 'Failed to connect to backend server at http://localhost:5000/api');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch board on mount
  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  /**
   * Persist Card Creation to the server
   */
  const handleAddCard = async (listId, title) => {
    try {
      setIsSyncing(true);
      const list = lists.find((l) => l.id === listId);
      const nextPosition = list?.cards ? list.cards.length : 0;

      const createdCard = await api.cards.create({
        list_id: listId,
        title,
        position: nextPosition,
      });

      // Update local state with newly created card
      setLists((prevLists) =>
        prevLists.map((l) => {
          if (l.id === listId) {
            return {
              ...l,
              cards: [...(l.cards || []), { ...createdCard, labels: [], comments: [] }],
            };
          }
          return l;
        })
      );
    } catch (err) {
      console.error('Failed to create card:', err);
      alert('Could not save card to server: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Persist Card Move (drag & drop) across lists or within same list
   */
  const handleDrop = async (e, targetListId) => {
    e.preventDefault();
    if (!dragging) return;

    const { cardId, fromListId } = dragging;
    let targetIndex = dropTarget?.listId === targetListId ? dropTarget.index : undefined;

    // Snapshot previous state for rollback on error
    const previousLists = lists;

    // Find card to move
    const sourceList = lists.find((l) => l.id === fromListId);
    const cardToMove = sourceList?.cards.find((c) => c.id === cardId);
    if (!cardToMove) {
      setDragging(null);
      setDropTarget(null);
      return;
    }

    // Optimistically update local lists
    let newCalculatedPosition = 0;
    const nextLists = lists.map((l) => {
      // Reordering within the same list
      if (l.id === fromListId && l.id === targetListId) {
        const withoutCard = l.cards.filter((c) => c.id !== cardId);
        const insertAt =
          targetIndex === undefined
            ? withoutCard.length
            : Math.min(targetIndex, withoutCard.length);
        const updated = [...withoutCard];
        updated.splice(insertAt, 0, cardToMove);
        newCalculatedPosition = insertAt;
        return { ...l, cards: updated };
      }

      // Removing card from source list
      if (l.id === fromListId) {
        return { ...l, cards: l.cards.filter((c) => c.id !== cardId) };
      }

      // Adding card to destination list
      if (l.id === targetListId) {
        const withoutCard = (l.cards || []).filter((c) => c.id !== cardId);
        const insertAt =
          targetIndex === undefined
            ? withoutCard.length
            : Math.min(targetIndex, withoutCard.length);
        const updated = [...withoutCard];
        updated.splice(insertAt, 0, { ...cardToMove, list_id: targetListId });
        newCalculatedPosition = insertAt;
        return { ...l, cards: updated };
      }

      return l;
    });

    setLists(nextLists);
    setDragging(null);
    setDropTarget(null);

    // Persist card move to server
    try {
      setIsSyncing(true);
      await api.cards.move(cardId, {
        list_id: targetListId,
        position: newCalculatedPosition,
      });
    } catch (err) {
      console.error('Failed to persist card move:', err);
      // Rollback to previous state
      setLists(previousLists);
      alert('Failed to save card move to server: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Persist List Reordering to the server
   */
  const handleReorderList = async (listId, newPosition) => {
    const previousLists = lists;
    const fromIndex = lists.findIndex((l) => l.id === listId);
    if (fromIndex === -1 || newPosition < 0 || newPosition >= lists.length) return;

    // Optimistically reorder lists locally
    const reordered = [...lists];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(newPosition, 0, moved);
    setLists(reordered);

    try {
      setIsSyncing(true);
      await api.lists.reorder(listId, newPosition);
    } catch (err) {
      console.error('Failed to persist list reorder:', err);
      setLists(previousLists);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Add a new list and persist to server
   */
  const handleAddList = async () => {
    const title = prompt('Enter list title:');
    if (!title || !title.trim() || !board?.id) return;

    try {
      setIsSyncing(true);
      const nextPos = lists.length;
      const newList = await api.lists.create({
        board_id: board.id,
        title: title.trim(),
        position: nextPos,
      });

      setLists((prev) => [
        ...prev,
        {
          ...newList,
          accent: ACCENT_COLORS[prev.length % ACCENT_COLORS.length],
          cards: [],
        },
      ]);
    } catch (err) {
      console.error('Failed to create list:', err);
      alert('Could not save list: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Delete a list and persist to server
   */
  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list and all its cards?')) return;

    const previousLists = lists;
    setLists((prev) => prev.filter((l) => l.id !== listId));

    try {
      setIsSyncing(true);
      await api.lists.delete(listId);
    } catch (err) {
      console.error('Failed to delete list:', err);
      setLists(previousLists);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Delete a card and persist to server
   */
  const handleDeleteCard = async (cardId) => {
    const previousLists = lists;
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        cards: l.cards.filter((c) => c.id !== cardId),
      }))
    );

    try {
      setIsSyncing(true);
      await api.cards.delete(cardId);
      if (activeCard?.id === cardId) {
        setActiveCard(null);
      }
    } catch (err) {
      console.error('Failed to delete card:', err);
      setLists(previousLists);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Add a comment to a card and persist to server
   */
  const handleAddComment = async (cardId, content) => {
    try {
      setIsSyncing(true);
      const newComment = await api.comments.create(cardId, content);

      // Update card in drawer
      setActiveCard((prev) =>
        prev && prev.id === cardId
          ? {
              ...prev,
              comments: [...(prev.comments || []), newComment],
            }
          : prev
      );

      // Update card in lists
      setLists((prevLists) =>
        prevLists.map((list) => ({
          ...list,
          cards: list.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  comments: [...(c.comments || []), newComment],
                }
              : c
          ),
        }))
      );
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to post comment: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const openCard = (card, listTitle) => {
    setActiveCard(card);
    setActiveListTitle(listTitle);
  };

  // Drag handlers
  const handleDragStart = (e, card, listId) => {
    setDragging({ cardId: card.id, fromListId: listId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(card.id));
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDropTarget(null);
  };

  const handleDragOverCard = (e, listId, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    setDropTarget({ listId, index: after ? index + 1 : index });
  };

  const handleDragOverColumn = (e, listId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget((t) => (t?.listId === listId ? t : { listId, index: Infinity }));
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50/70 via-background to-fuchsia-50/70 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 text-foreground transition-colors overflow-hidden">
      <TopNav
        theme={theme}
        onToggleTheme={toggleTheme}
        onAddList={handleAddList}
        boardTitle={board?.title || 'Jello Sprint Board'}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm text-muted-foreground font-medium">
              Loading board from server...
            </p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Server Connection Issue</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={loadBoardData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : (
          <div className="h-full overflow-x-auto overflow-y-hidden px-4 sm:px-6 py-5">
            <div className="flex gap-4 h-full items-stretch min-w-min">
              {lists.map((list, listIndex) => (
                <KanbanColumn
                  key={list.id}
                  title={list.title}
                  cards={list.cards || []}
                  accent={list.accent || ACCENT_COLORS[listIndex % ACCENT_COLORS.length]}
                  listId={list.id}
                  dragging={dragging}
                  dropTarget={dropTarget}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOverCard={handleDragOverCard}
                  onDragOverColumn={handleDragOverColumn}
                  onDrop={handleDrop}
                  onOpenCard={openCard}
                  onDelete={() => handleDeleteList(list.id)}
                  onAddCard={handleAddCard}
                  onDeleteCard={handleDeleteCard}
                />
              ))}

              {/* Add List Button */}
              <button
                onClick={handleAddList}
                className="w-72 sm:w-80 shrink-0 rounded-2xl border-2 border-dashed border-border/60 hover:border-indigo-500/60 text-muted-foreground hover:text-foreground hover:bg-card/40 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px] cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Add another list</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Card Detail Drawer / Modal */}
      <CardDetailDrawer
        card={activeCard}
        listTitle={activeListTitle}
        onClose={() => setActiveCard(null)}
        onAddComment={handleAddComment}
        onDeleteCard={handleDeleteCard}
      />
    </div>
  );
}