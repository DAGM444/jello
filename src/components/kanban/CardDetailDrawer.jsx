import React, { useState } from 'react';
import { X, Calendar, MessageSquare, Send, Tag, Trash2, AlignLeft, Clock } from 'lucide-react';

export default function CardDetailDrawer({
  card,
  listTitle,
  onClose,
  onAddComment,
  onDeleteCard,
}) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!card) return null;

  const handleCommentSubmit = async (e) => {
    e?.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (onAddComment) {
        await onAddComment(card.id, commentText.trim());
      }
      setCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const comments = Array.isArray(card.comments) ? card.comments : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] z-10">
        {/* Header */}
        <div className="p-5 border-b border-border/60 flex items-start justify-between gap-4 bg-muted/20">
          <div>
            <h2 className="text-lg font-bold text-foreground leading-snug">{card.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              in list <span className="font-semibold text-foreground underline">{listTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {onDeleteCard && (
              <button
                onClick={() => {
                  onDeleteCard(card.id);
                  onClose();
                }}
                title="Delete Card"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Labels & Dates */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {card.labels && card.labels.length > 0 && (
              <div>
                <span className="text-[11px] font-medium text-muted-foreground block mb-1.5 uppercase tracking-wider">
                  Labels
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {card.labels.map((label, idx) => {
                    const name = typeof label === 'string' ? label : label.name;
                    const color = typeof label === 'object' && label.color ? label.color : '#6366f1';
                    return (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: `${color}20`,
                          color,
                          borderColor: `${color}40`,
                        }}
                        className="font-semibold px-2.5 py-1 rounded-md border text-xs"
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {(card.due || card.due_date) && (
              <div>
                <span className="text-[11px] font-medium text-muted-foreground block mb-1.5 uppercase tracking-wider">
                  Due Date
                </span>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {card.due || new Date(card.due_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-foreground font-semibold text-sm">
              <AlignLeft className="w-4 h-4 text-muted-foreground" />
              <h3>Description</h3>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {card.description || 'No description provided for this card.'}
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-2 border-t border-border/40">
            <div className="flex items-center gap-2 mb-4 text-foreground font-semibold text-sm">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h3>Activity & Comments</h3>
              <span className="text-xs font-normal text-muted-foreground">({comments.length})</span>
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleCommentSubmit} className="mb-4">
              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleCommentSubmit();
                    }
                  }}
                  className="w-full p-3 pr-12 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                  title="Send Comment (Ctrl+Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Press Ctrl+Enter to send</p>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No comments yet.</p>
              ) : (
                comments.map((comment, index) => (
                  <div
                    key={comment.id || index}
                    className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs sm:text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Member</span>
                      {comment.created_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground leading-snug">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
