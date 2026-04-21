"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  saveDaySummaryAction,
  toggleHabitLogAction,
} from "@/app/(app)/actions";
import { today, weekdayLetter } from "@/lib/dates";
import type { Habit } from "@/lib/habits";

export function MonthlyTimeline({
  days,
  summaries,
  habits,
  habitLogs,
}: {
  days: string[];
  summaries: Map<string, string>;
  habits: Habit[];
  habitLogs: Map<string, Map<string, boolean>>;
}) {
  return (
    <ul className="mt-2 overflow-hidden rounded-lg border border-ink-100 bg-white">
      {days.map((d, i) => (
        <TimelineRow
          key={d}
          date={d}
          summary={summaries.get(d) ?? ""}
          habits={habits}
          habitDone={new Map(
            habits.map((h) => [h.id, habitLogs.get(h.id)?.get(d) === true]),
          )}
          last={i === days.length - 1}
        />
      ))}
    </ul>
  );
}

function TimelineRow({
  date,
  summary,
  habits,
  habitDone,
  last,
}: {
  date: string;
  summary: string;
  habits: Habit[];
  habitDone: Map<string, boolean>;
  last: boolean;
}) {
  const [draft, setDraft] = useState(summary);
  const [saving, startSaving] = useTransition();
  const dayNum = Number(date.slice(8, 10));
  const isToday = date === today();
  const letter = weekdayLetter(date);

  function commit() {
    if (draft === summary) return;
    startSaving(async () => {
      await saveDaySummaryAction({ date, summary: draft });
    });
  }

  return (
    <li
      className={
        "flex items-center gap-2 px-2 py-1.5 " +
        (last ? "" : "border-b border-ink-100 ") +
        (isToday ? "bg-ink-50" : "")
      }
    >
      <Link
        href={`/daily?date=${date}`}
        className="flex w-10 shrink-0 items-baseline gap-1 font-mono text-xs leading-none text-ink-500 hover:text-ink-900"
        title="Open in Daily"
      >
        <span className="w-4 text-right tabular-nums">{dayNum}</span>
        <span className="text-ink-400">{letter}</span>
      </Link>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder=""
        className="min-w-0 flex-1 bg-transparent py-1 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none"
      />
      {habits.length > 0 && (
        <div className="flex shrink-0 items-center gap-1">
          {habits.map((h) => (
            <HabitDot
              key={h.id}
              habitId={h.id}
              date={date}
              symbol={h.symbol}
              done={habitDone.get(h.id) === true}
            />
          ))}
        </div>
      )}
      {saving && (
        <span className="ml-1 text-[10px] text-ink-300" aria-live="polite">
          …
        </span>
      )}
    </li>
  );
}

function HabitDot({
  habitId,
  date,
  symbol,
  done,
}: {
  habitId: string;
  date: string;
  symbol: string;
  done: boolean;
}) {
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState<boolean | null>(null);
  useEffect(() => {
    setPending(null);
  }, [done]);
  const effectiveDone = pending ?? done;
  return (
    <button
      type="button"
      onClick={() => {
        setPending(!effectiveDone);
        startTransition(async () => {
          await toggleHabitLogAction({ habitId, date });
        });
      }}
      className={
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] transition " +
        (effectiveDone
          ? "bg-ink-900 text-white"
          : "border border-ink-200 text-ink-300 hover:border-ink-400")
      }
      aria-pressed={effectiveDone}
      title={`${symbol} — tap to toggle`}
    >
      {effectiveDone ? symbol : ""}
    </button>
  );
}
