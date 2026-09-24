import React from 'react';
import { Sun, Moon, Plus, Layout, RefreshCw } from 'lucide-react';

export default function TopNav({
  theme = 'light',
  onToggleTheme,
  onAddList,
  boardTitle = 'Sprint Board',
  isSyncing = false,
}) {
  return (
    <header className="h-14 border-b border-border/60 bg-background/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
          <Layout className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Jello
          </span>
          <span className="text-muted-foreground/50 text-sm">/</span>
          <h1 className="font-semibold text-sm sm:text-base text-foreground truncate max-w-[200px] sm:max-w-md">
            {boardTitle}
          </h1>
        </div>

        {isSyncing && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse ml-2 px-2 py-0.5 rounded-full bg-muted">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Syncing...
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onAddList}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm shadow-indigo-500/25 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add List</span>
        </button>

        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
