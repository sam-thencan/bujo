"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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

// Single-open menu coordination. When one entry's menu opens it dispatches
// a CustomEvent; every other listener closes itself.
const MENU_EVENT = "bujo:entry-menu-open";

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
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or when another menu opens.
  useEffect(() => {
    if (!menuOpen) return;
    function onOtherOpen(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (detail !== entry.id) setMenuOpen(false);
    }
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener(MENU_EVENT, onOtherOpen);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener(MENU_EVENT, onOtherOpen);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [menuOpen, entry.id]);

  function openMenu() {
    setMenuOpen(true);
    document.dispatchEvent(
      new CustomEvent(MENU_EVENT, { detail: entry.id }),
    );
  }

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

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
          className="rounded px-2 py-0.5 text-base leading-none text-ink-500 hover:text-ink-900"
          aria-label="Actions"
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-ink-200 bg-white text-sm shadow-soft">
            {isTask && context.kind === "day" && (
              <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-3 py-2">
                <span className="text-[11px] uppercase tracking-wide text-ink-400">
                  Top 3
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((r) => {
                    const active = rank === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          run(() =>
                            setPriorityRankAction(
                              entry.id,
                              active ? null : r,
                            ),
                          );
                        }}
                        className={
                          "inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs transition " +
                          (active
                            ? "bg-ink-900 text-white"
                            : "border border-ink-200 text-ink-700 hover:border-ink-400")
                        }
                        title={active ? `Clear top ${r}` : `Set as top ${r}`}
                        aria-pressed={active}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-3 py-2">
              <span className="text-[11px] uppercase tracking-wide text-ink-400">
                Type
              </span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { key: "task", sym: "•" },
                    { key: "event", sym: "○" },
                    { key: "note", sym: "—" },
                    { key: "mood", sym: "=" },
                  ] as const
                ).map(({ key, sym }) => {
                  const active = entry.type === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (active) return;
                        setMenuOpen(false);
                        run(() =>
                          editEntryAction({ id: entry.id, content: entry.content, type: key }),
                        );
                      }}
                      className={
                        "inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm transition " +
                        (active
                          ? "bg-ink-900 text-white"
                          : "border border-ink-200 text-ink-700 hover:border-ink-400")
                      }
                      aria-pressed={active}
                      title={key}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>
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
