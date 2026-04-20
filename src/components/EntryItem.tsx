"use client";

import { useState, useTransition } from "react";
import {
  cancelEntryAction,
  deleteEntryAction,
  editEntryAction,
  migrateEntryAction,
  scheduleIntoMonthAction,
  setPriorityRankAction,
  toggleDoneAction,
} from "@/app/(app)/actions";
import type { Entry } from "@/lib/entries";
import { shiftDate, shiftMonth, today, thisMonth } from "@/lib/dates";

function symbolFor(e: Entry): string {
  if (e.type === "event") return "○";
  if (e.type === "note") return "—";
  if (e.type === "mood") return "=";
  // task
  if (e.status === "done") return "X";
  if (e.status === "migrated") return ">";
  if (e.status === "scheduled") return "<";
  if (e.status === "cancelled") return "~";
  return "•";
}

export function EntryItem({
  entry,
  context,
  hideRank,
}: {
  entry: Entry;
  context:
    | { kind: "day"; date: string }
    | { kind: "month"; month: string }
    | { kind: "future"; month: string };
  hideRank?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.content);
  const [isPending, startTransition] = useTransition();

  const isTask = entry.type === "task";
  const isDone = entry.status === "done";
  const isCancelled = entry.status === "cancelled";
  const isMigrated = entry.status === "migrated";
  const rank = entry.priority_rank;

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
    });
  }

  function commitEdit() {
    const c = draft.trim();
    if (!c || c === entry.content) {
      setEditing(false);
      setDraft(entry.content);
      return;
    }
    run(async () => {
      await editEntryAction({ id: entry.id, content: c });
      setEditing(false);
    });
  }

  return (
    <li className="group flex items-start gap-2 border-b border-ink-100 py-2">
      <div className="flex shrink-0 items-start">
        {!hideRank && rank ? (
          <span
            className="mt-0.5 mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 font-mono text-[11px] font-semibold text-white"
            aria-label={`Priority ${rank}`}
          >
            {rank}
          </span>
        ) : null}
        <button
          type="button"
          disabled={!isTask || isPending}
          onClick={() => run(() => toggleDoneAction(entry.id))}
          className={
            "mt-0.5 w-5 text-center font-mono text-base leading-6 " +
            (isTask ? "cursor-pointer text-ink-900" : "text-ink-400")
          }
          title={isTask ? (isDone ? "Mark open" : "Mark done") : undefined}
          aria-label={
            isTask ? (isDone ? "Mark open" : "Mark done") : "Signifier"
          }
        >
          {symbolFor(entry)}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitEdit();
              }
              if (e.key === "Escape") {
                setEditing(false);
                setDraft(entry.content);
              }
            }}
            className="w-full rounded border border-ink-200 bg-white px-2 py-1 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="block w-full text-left"
          >
            <span
              className={
                "text-sm leading-5 " +
                (isDone || isCancelled
                  ? "text-ink-400 line-through"
                  : isMigrated
                    ? "text-ink-400"
                    : entry.type === "mood"
                      ? "italic text-ink-700"
                      : "text-ink-800")
              }
            >
              {entry.content}
            </span>
          </button>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded px-2 py-0.5 text-sm text-ink-400 hover:text-ink-900"
          aria-label="Actions"
        >
          ⋯
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-md border border-ink-200 bg-white text-sm shadow-soft"
            onMouseLeave={() => setMenuOpen(false)}
          >
            {isTask && context.kind === "day" && (
              <div className="flex border-b border-ink-100">
                {[1, 2, 3].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      run(() =>
                        setPriorityRankAction(entry.id, rank === r ? null : r),
                      );
                    }}
                    className={
                      "flex-1 py-2 text-xs font-medium " +
                      (rank === r
                        ? "bg-ink-900 text-white"
                        : "text-ink-700 hover:bg-ink-50")
                    }
                    title={`Set as top ${r}`}
                  >
                    Top {r}
                  </button>
                ))}
              </div>
            )}
            <MenuItem
              label="Edit"
              onClick={() => {
                setMenuOpen(false);
                setEditing(true);
              }}
            />
            {isTask && context.kind === "day" && (
              <>
                <MenuItem
                  label="Migrate → tomorrow"
                  onClick={() => {
                    setMenuOpen(false);
                    run(() =>
                      migrateEntryAction({
                        id: entry.id,
                        log_date: shiftDate(context.date, 1),
                      }),
                    );
                  }}
                />
                <MenuItem
                  label="Schedule → next month"
                  onClick={() => {
                    setMenuOpen(false);
                    run(() =>
                      migrateEntryAction({
                        id: entry.id,
                        log_date: null,
                        log_month: shiftMonth(context.date.slice(0, 7), 1),
                      }),
                    );
                  }}
                />
              </>
            )}
            {isTask && context.kind === "month" && (
              <MenuItem
                label="Schedule → today"
                onClick={() => {
                  setMenuOpen(false);
                  run(() =>
                    scheduleIntoMonthAction({
                      id: entry.id,
                      log_date: today(),
                    }),
                  );
                }}
              />
            )}
            {isTask && context.kind === "future" && (
              <MenuItem
                label="Pull → this month"
                onClick={() => {
                  setMenuOpen(false);
                  run(() =>
                    migrateEntryAction({
                      id: entry.id,
                      log_date: null,
                      log_month: thisMonth(),
                    }),
                  );
                }}
              />
            )}
            {isTask && !isCancelled && (
              <MenuItem
                label="Cancel"
                onClick={() => {
                  setMenuOpen(false);
                  run(() => cancelEntryAction(entry.id));
                }}
              />
            )}
            <MenuItem
              label="Delete"
              danger
              onClick={() => {
                setMenuOpen(false);
                run(() => deleteEntryAction(entry.id));
              }}
            />
          </div>
        )}
      </div>
    </li>
  );
}

function MenuItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "block w-full px-3 py-2 text-left hover:bg-ink-50 " +
        (danger ? "text-red-600" : "text-ink-800")
      }
    >
      {label}
    </button>
  );
}
