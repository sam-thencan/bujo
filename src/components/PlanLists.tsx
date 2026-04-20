"use client";

import { useState, useTransition } from "react";
import {
  createPlanItemAction,
  deletePlanItemAction,
  editPlanItemAction,
  togglePlanItemAction,
} from "@/app/(app)/actions";
import type { PlanCategory, PlanItem } from "@/lib/actionPlan";

const CATEGORIES: Array<{ key: PlanCategory; label: string }> = [
  { key: "personal", label: "Personal" },
  { key: "work", label: "Work" },
];

export function PlanLists({
  month,
  items,
}: {
  month: string;
  items: PlanItem[];
}) {
  return (
    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CATEGORIES.map((c) => (
        <PlanColumn
          key={c.key}
          month={month}
          category={c.key}
          label={c.label}
          items={items.filter((i) => i.category === c.key)}
        />
      ))}
    </div>
  );
}

function PlanColumn({
  month,
  category,
  label,
  items,
}: {
  month: string;
  category: PlanCategory;
  label: string;
  items: PlanItem[];
}) {
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add() {
    const v = draft.trim();
    if (!v) return;
    setError(null);
    startTransition(async () => {
      const res = await createPlanItemAction({ month, category, content: v });
      if (res?.error) setError(res.error);
      else setDraft("");
    });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-ink-100 bg-white">
      <header className="flex items-center justify-between border-b border-ink-100 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-700">
          {label}
        </h3>
        <span className="text-[11px] text-ink-400">{items.length}</span>
      </header>
      <ul>
        {items.map((i) => (
          <PlanRow key={i.id} item={i} />
        ))}
        {items.length === 0 && (
          <li className="px-3 py-3 text-xs text-ink-400">
            No items yet. Capture an intent below.
          </li>
        )}
      </ul>
      <div className="border-t border-ink-100 p-2">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            placeholder={`Add to ${label.toLowerCase()}…`}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            className="flex-1 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm placeholder:text-ink-400"
          />
          <button
            type="button"
            onClick={add}
            disabled={isPending || !draft.trim()}
            className="rounded-md bg-ink-900 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {error && <p className="pt-1 text-[11px] text-red-600">{error}</p>}
      </div>
    </section>
  );
}

function PlanRow({ item }: { item: PlanItem }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);
  const [isPending, startTransition] = useTransition();

  function commit() {
    const v = draft.trim();
    if (!v || v === item.content) {
      setEditing(false);
      setDraft(item.content);
      return;
    }
    startTransition(async () => {
      await editPlanItemAction(item.id, v);
      setEditing(false);
    });
  }

  return (
    <li className="flex items-start gap-2 border-b border-ink-100 px-3 py-2 last:border-b-0">
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await togglePlanItemAction(item.id);
          })
        }
        disabled={isPending}
        className="mt-0.5 w-5 shrink-0 text-center font-mono text-base leading-5 text-ink-900"
        aria-label={item.done ? "Mark open" : "Mark done"}
      >
        {item.done ? "X" : "•"}
      </button>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setEditing(false);
              setDraft(item.content);
            }
          }}
          className="flex-1 rounded border border-ink-200 bg-white px-2 py-0.5 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block flex-1 text-left"
        >
          <span
            className={
              "text-sm leading-5 " +
              (item.done ? "text-ink-400 line-through" : "text-ink-800")
            }
          >
            {item.content}
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await deletePlanItemAction(item.id);
          })
        }
        className="shrink-0 text-xs text-ink-300 hover:text-red-600"
        aria-label="Delete"
      >
        ×
      </button>
    </li>
  );
}
