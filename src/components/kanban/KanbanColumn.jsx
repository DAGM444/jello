import React, { useState } from 'react';
import { Plus, X, Trash2, Calendar, MessageSquare, AlignLeft, GripVertical } from 'lucide-react';

export default function KanbanColumn({
  title,
  cards = [],
  accent = 'bg-indigo-500',
  listId,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onDragOverColumn,
  onDrop,
  onOpenCard,
  onDelete,
  onAddCard,
  onDeleteCard,
}) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCard = async (e) => {
    e?.preventDefault();
    if (!newCardTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (onAddCard) {
        await onAddCard(listId, newCardTitle.trim());
      }
      setNewCardTitle('');
      setIsAddingCard(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isColumnDropTarget = dropTarget?.listId === listId;

  return (
    <div
      onDragOver={(e) => onDragOverColumn(e, listId)}
      onDrop={(e) => onDrop(e, listId)}
      className={`w-72 sm:w-80 shrink-0 flex flex-col max-h-full rounded-2xl bg-card/60 backdrop-blur-md border transition-all duration-200 shadow-sm ${
        isColumnDropTarget ? 'border-indigo-500/80 bg-indigo-50/20 dark:bg-indigo-950/20' : 'border-border/60'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 pb-2 flex items-center justify-between gap-2 border-b border-border/40 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full ${accent} shrink-0`} />
          <h2 className="font-semibold text-sm text-foreground truncate">{title}</h2>
          <span className="text-xs font-medium text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full">
            {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete list"
              className="p-1 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[50px]">
        {cards.map((card, index) => {
          const isDragging = dragging?.cardId === card.id;
          const isTarget = isColumnDropTarget && dropTarget?.index === index;
          const commentsCount = Array.isArray(card.comments)
            ? card.comments.length
            : typeof card.comments === 'number'
            ? card.comments
            : 0;

          return (
            <div key={card.id}>
              {isTarget && (
                <div className="h-1.5 bg-indigo-500 rounded-full my-1.5 transition-all animate-pulse" />
              )}
              <div
                draggable
                onDragStart={(e) => onDragStart(e, card, listId)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => onDragOverCard(e, listId, index)}
                onClick={() => onOpenCard && onOpenCard(card, title)}
                className={`group relative bg-background rounded-xl p-3 border border-border/60 hover:border-border hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                  isDragging ? 'opacity-40 border-dashed border-indigo-400 scale-95' : 'opacity-100'
                }`}
              >
                {/* Optional Cover Image */}
                {card.cover && (
                  <img
                    src={card.cover}
                    alt={card.title}
                    className="w-full h-28 object-cover rounded-lg mb-2.5 pointer-events-none"
                  />
                )}

                {/* Labels */}
                {card.labels && card.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {card.labels.map((label, lIdx) => {
                      const labelName = typeof label === 'string' ? label : label.name;
                      const labelColor =
                        typeof label === 'object' && label.color
                          ? label.color
                          : '#6366f1';
                      return (
                        <span
                          key={lIdx}
                          style={{
                            backgroundColor: `${labelColor}20`,
                            color: labelColor,
                            borderColor: `${labelColor}40`,
                          }}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                        >
                          {labelName}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Card Title */}
                <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 mb-2 leading-snug">
                  {card.title}
                </h3>

                {/* Card Meta / Footer */}
                <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1">
                  <div className="flex items-center gap-3">
                    {card.description && (
                      <span title="Has description" className="flex items-center gap-1">
                        <AlignLeft className="w-3 h-3" />
                      </span>
                    )}
                    {(card.due || card.due_date) && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {card.due || new Date(card.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </span>
                    )}
                    {commentsCount > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{commentsCount}</span>
                      </span>
                    )}
                  </div>

                  {onDeleteCard && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCard(card.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-all"
                      title="Delete card"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isColumnDropTarget && dropTarget?.index >= cards.length && (
          <div className="h-1.5 bg-indigo-500 rounded-full my-1.5 transition-all animate-pulse" />
        )}
      </div>

      {/* Add Card Footer */}
      <div className="p-2.5 pt-1 border-t border-border/30">
        {isAddingCard ? (
          <form onSubmit={handleCreateCard} className="space-y-2">
            <textarea
              autoFocus
              rows={2}
              placeholder="Enter card title..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateCard();
                }
                if (e.key === 'Escape') {
                  setIsAddingCard(false);
                }
              }}
              className="w-full text-xs sm:text-sm p-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="submit"
                disabled={isSubmitting || !newCardTitle.trim()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {isSubmitting ? 'Adding...' : 'Add card'}
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full flex items-center gap-1.5 py-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add a card</span>
          </button>
        )}
      </div>
    </div>
  );
}
