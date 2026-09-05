import React, { useEffect, useState } from "react";
import TopNav from "@/components/kanban/TopNav";
import KanbanColumn from "@/components/kanban/KanbanColumn";
import CardDetailDrawer from "@/components/kanban/CardDetailDrawer";

const initialLists = [
  {
    id: "todo",
    title: "To Do",
    accent: "bg-indigo-500",
    cards: [
      {
        id: "t1",
        title: "Design new pricing page hero section",
        labels: ["design", "high"],
        cover:
          "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=80",
        assignees: ["Maya Chen", "Leo Park"],
        due: "Sep 9",
        dueStatus: "soon",
        comments: 5,
        attachments: 2,
        checklist: { done: 2, total: 5 },
      },
      {
        id: "t2",
        title: "Set up CI pipeline for monorepo",
        labels: ["dev"],
        assignees: ["Sam Rivera"],
        comments: 1,
        checklist: { done: 0, total: 4 },
      },
      {
        id: "t3",
        title: "Write migration script for user table",
        labels: ["dev", "research"],
        assignees: ["Priya Nair"],
        due: "Sep 14",
        comments: 3,
      },
      {
        id: "t4",
        title: "Competitor analysis — onboarding flows",
        labels: ["research"],
        assignees: ["Maya Chen"],
        checklist: { done: 1, total: 6 },
      },
    ],
  },
  {
    id: "doing",
    title: "In Progress",
    accent: "bg-amber-500",
    cards: [
      {
        id: "d1",
        title: "Implement dark mode design tokens",
        labels: ["design", "dev"],
        cover:
          "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&q=80",
        assignees: ["Leo Park", "Sam Rivera"],
        due: "Sep 6",
        dueStatus: "soon",
        comments: 8,
        checklist: { done: 4, total: 5 },
      },
      {
        id: "d2",
        title: "Refactor authentication middleware",
        labels: ["dev"],
        assignees: ["Priya Nair"],
        comments: 2,
        checklist: { done: 1, total: 3 },
      },
      {
        id: "d3",
        title: "Fix memory leak in card renderer",
        labels: ["bug", "high"],
        assignees: ["Sam Rivera"],
        due: "Sep 3",
        dueStatus: "overdue",
        comments: 6,
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    accent: "bg-emerald-500",
    cards: [
      {
        id: "dn1",
        title: "Ship onboarding email sequence",
        labels: ["design", "low"],
        cover:
          "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80",
        assignees: ["Maya Chen"],
        comments: 6,
        checklist: { done: 3, total: 3 },
      },
      {
        id: "dn2",
        title: "Fix flaky billing integration test",
        labels: ["bug"],
        assignees: ["Priya Nair"],
        due: "Aug 30",
        comments: 4,
        checklist: { done: 2, total: 2 },
      },
      {
        id: "dn3",
        title: "Audit accessibility on settings page",
        labels: ["design"],
        assignees: ["Leo Park"],
        checklist: { done: 5, total: 5 },
      },
    ],
  },
];

export default function Home() {
  const [theme, setTheme] = useState("light");
  const [lists, setLists] = useState(initialLists);
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [activeListTitle, setActiveListTitle] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  const addList = () => {
    const id = `list-${Date.now()}`;
    setLists((l) => [
      ...l,
      { id, title: "New List", accent: "bg-sky-500", cards: [] },
    ]);
  };

  const deleteList = (id) =>
    setLists((l) => l.filter((list) => list.id !== id));

  const openCard = (card, listTitle) => {
    const checklistItems =
      card.checklistItems ||
      (card.checklist
        ? Array.from({ length: card.checklist.total }, (_, i) => ({
            id: `${card.id}-ck-${i}`,
            text: `Task item ${i + 1}`,
            checked: i < card.checklist.done,
          }))
        : []);
    setActiveCard({
      ...card,
      description:
        card.description ||
        "Outline the scope, key deliverables, and acceptance criteria for this task. Link any related design files and tag the reviewers.",
      checklistItems,
    });
    setActiveListTitle(listTitle);
  };

  const handleDragStart = (e, card, listId) => {
    setDragging({ cardId: card.id, fromListId: listId });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.id);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDropTarget(null);
  };

  const handleDragOverCard = (e, listId, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    setDropTarget({ listId, index: after ? index + 1 : index });
  };

  const handleDragOverColumn = (e, listId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget((t) => (t?.listId === listId ? t : { listId, index: Infinity }));
  };

  const handleDrop = (e, listId) => {
    e.preventDefault();
    if (!dragging) return;
    const cardId = dragging.cardId;
    let targetIndex = dropTarget?.listId === listId ? dropTarget.index : Infinity;
    if (targetIndex === Infinity) targetIndex = undefined;

    setLists((prev) => {
      const fromList = prev.find((l) => l.id === dragging.fromListId);
      const card = fromList?.cards.find((c) => c.id === cardId);
      if (!card) return prev;

      return prev.map((l) => {
        if (l.id === dragging.fromListId && l.id === listId) {
          const filtered = l.cards.filter((c) => c.id !== cardId);
          let insertAt =
            targetIndex === undefined
              ? filtered.length
              : Math.min(targetIndex, filtered.length);
          const adjusted = insertAt > filtered.length ? filtered.length : insertAt;
          const next = [...filtered];
          next.splice(adjusted, 0, card);
          return { ...l, cards: next };
        }
        if (l.id === dragging.fromListId) {
          return { ...l, cards: l.cards.filter((c) => c.id !== cardId) };
        }
        if (l.id === listId) {
          const next = [...l.cards];
          const insertAt =
            targetIndex === undefined ? next.length : Math.min(targetIndex, next.length);
          next.splice(insertAt, 0, card);
          return { ...l, cards: next };
        }
        return l;
      });
    });

    setDragging(null);
    setDropTarget(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-background to-fuchsia-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 text-foreground transition-colors">
      <TopNav theme={theme} onToggleTheme={toggleTheme} onAddList={addList} />

      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-x-auto overflow-y-hidden px-4 sm:px-6 py-5">
          <div className="flex gap-4 h-full items-stretch min-w-min">
            {lists.map((list) => (
              <KanbanColumn
                key={list.id}
                title={list.title}
                cards={list.cards}
                accent={list.accent}
                listId={list.id}
                dragging={dragging}
                dropTarget={dropTarget}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOverCard={handleDragOverCard}
                onDragOverColumn={handleDragOverColumn}
                onDrop={handleDrop}
                onOpenCard={openCard}
                onDelete={() => deleteList(list.id)}
              />
            ))}

            {/* Add list ghost button */}
            <button
              onClick={addList}
              className="w-72 sm:w-80 shrink-0 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-border hover:text-foreground hover:bg-card/40 transition-colors grid place-items-center min-h-[120px]"
            >
              + Add another list
            </button>
          </div>
        </div>
      </main>

      <CardDetailDrawer
        card={activeCard}
        listTitle={activeListTitle}
        onClose={() => setActiveCard(null)}
      />
    </div>
  );
}