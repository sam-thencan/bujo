"use client";

import { useState, useTransition } from "react";
import {
  createEntryAction,
  deleteEntryAction,
  editEntryAction,
  migrateEntryAction,
  toggleDoneAction,
} from "@/app/(app)/actions";
import type { Entry } from "@/lib/entries";
import { prettyMonthShort, thisMonth } from "@/lib/dates";

export function FutureStack({
  months,
  entriesByMonth,
}: {
  months: string[];
  entriesByMonth: Map<string, Entry[]>;
}) {
  return (
    <div className="mt-2 space-y-3">
      {months.map((m) => (
        <MonthSection
          key={m}
          month={m}
          entries={entriesByMonth.get(m) ?? []}
        />
      ))}
    </div>
  );
}

function MonthSection({ month, entries }: { month: string; entries: Entry[] }) {
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add() {
    const v = draft.trim();
    if (!v) return;
    setError(null);
    startTransition(async () => {
      const res = await createEntryAction({
        raw: v,
        log_date: null,
        log_month: month,
      });
      if (res?.error) setError(res.error);
      else setDraft("");
    });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-ink-100 bg-white">
      <header className="flex items-center justify-between border-b border-ink-100 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-700">
          {prettyMonthShort(month)}
        </h3>
        <span className="text-[11px] text-ink-400">{entries.length}</span>
      </header>
      <ul>
        {entries.map((e) => (
          <FutureRow key={e.id} entry={e} />
        ))}
        {entries.length === 0 && (
          <li className="px-3 py-3 text-xs text-ink-400">
            Empty. Drop a task or intent below.
          </li>
        )}
      </ul>
      <div className="border-t border-ink-100 p-2">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            placeholder="Add…"
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

function symbolFor(entry: Entry): string {
  if (entry.type === "event") return "○";
  if (entry.type === "note") return "—";
  if (entry.type === "mood") return "=";
  if (entry.status === "done") return "X";
  if (entry.status === "scheduled") return "<";
  if (entry.status === "migrated") return ">";
  if (entry.status === "cancelled") return "~";
  return "•";
}

function FutureRow({ entry }: { entry: Entry }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.content);
  const [isPending, startTransition] = useTransition();
  const isTask = entry.type === "task";
  const isDone = entry.status === "done";
  const isCancelled = entry.status === "cancelled";

  function commit() {
    const v = draft.trim();
    if (!v || v === entry.content) {
      setEditing(false);
      setDraft(entry.content);
      return;
    }
    startTransition(async () => {
      await editEntryAction({ id: entry.id, content: v });
      setEditing(false);
    });
  }

  return (
    <li className="flex items-start gap-2 border-b border-ink-100 px-3 py-2 last:border-b-0">
      <button
        type="button"
        disabled={!isTask || isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleDoneAction(entry.id);
          })
        }
        className={
          "mt-0.5 w-5 shrink-0 text-center font-mono text-base leading-5 " +
          (isTask ? "text-ink-900" : "text-ink-400")
        }
        aria-label={isTask ? (isDone ? "Mark open" : "Mark done") : "Signifier"}
      >
        {symbolFor(entry)}
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
              setDraft(entry.content);
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
              (isDone || isCancelled
                ? "text-ink-400 line-through"
                : entry.type === "mood"
                  ? "italic text-ink-700"
                  : "text-ink-800")
            }
          >
            {entry.content}
          </span>
        </button>
      )}
      {isTask && (
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await migrateEntryAction({
                id: entry.id,
                log_date: null,
                log_month: thisMonth(),
              });
            })
          }
          className="shrink-0 text-[11px] text-ink-400 hover:text-ink-900"
          title="Pull into this month"
        >
          ↑
        </button>
      )}
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await deleteEntryAction(entry.id);
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
