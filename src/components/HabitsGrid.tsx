"use client";

import { useState, useTransition } from "react";
import {
  carryForwardHabitsAction,
  createHabitAction,
  deleteHabitAction,
  renameHabitAction,
  resetHabitLogAction,
  toggleHabitLogAction,
} from "@/app/(app)/actions";
import { today, weekdayLetter } from "@/lib/dates";
import type { Habit } from "@/lib/habits";

const HABIT_LIMIT = 3;

export function HabitsGrid({
  month,
  prevMonth,
  days,
  habits,
  habitLogs,
  hasPrevMonthHabits,
}: {
  month: string;
  prevMonth: string;
  days: string[];
  habits: Habit[];
  habitLogs: Map<string, Map<string, boolean>>;
  hasPrevMonthHabits: boolean;
}) {
  return (
    <div className="mt-2 space-y-3">
      <div className="overflow-hidden rounded-lg border border-ink-100 bg-white">
        <header className="flex items-center justify-between border-b border-ink-100 px-3 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-700">
            Habits ({habits.length}/{HABIT_LIMIT})
          </h3>
          {habits.length === 0 && hasPrevMonthHabits && (
            <CarryForwardButton fromMonth={prevMonth} toMonth={month} />
          )}
        </header>
        {habits.length === 0 ? (
          <p className="px-3 py-3 text-xs text-ink-400">
            Set up to {HABIT_LIMIT} habits to track this month.
          </p>
        ) : (
          <ul>
            {habits.map((h) => (
              <HabitHeader key={h.id} habit={h} />
            ))}
          </ul>
        )}
        {habits.length < HABIT_LIMIT && (
          <AddHabitRow month={month} count={habits.length} />
        )}
      </div>

      {habits.length > 0 && (
        <HabitMonthGrid
          days={days}
          habits={habits}
          habitLogs={habitLogs}
        />
      )}
    </div>
  );
}

function CarryForwardButton({
  fromMonth,
  toMonth,
}: {
  fromMonth: string;
  toMonth: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await carryForwardHabitsAction({ fromMonth, toMonth });
        })
      }
      className="rounded-md bg-ink-100 px-2 py-1 text-[11px] font-medium text-ink-700 hover:bg-ink-200 disabled:opacity-60"
    >
      Copy last month's habits
    </button>
  );
}

function HabitHeader({ habit }: { habit: Habit }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(habit.name);
  const [symbol, setSymbol] = useState(habit.symbol);
  const [isPending, startTransition] = useTransition();

  function commit() {
    const n = name.trim();
    const s = (symbol || habit.symbol || "•").slice(0, 2);
    if (!n) {
      setEditing(false);
      setName(habit.name);
      return;
    }
    startTransition(async () => {
      await renameHabitAction({ id: habit.id, name: n, symbol: s });
      setEditing(false);
    });
  }

  return (
    <li className="flex items-center gap-2 border-b border-ink-100 px-3 py-2 last:border-b-0">
      {editing ? (
        <>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.slice(0, 2))}
            className="w-10 rounded border border-ink-200 bg-white px-1 py-0.5 text-center font-mono text-sm"
          />
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                setEditing(false);
                setName(habit.name);
                setSymbol(habit.symbol);
              }
            }}
            className="flex-1 rounded border border-ink-200 bg-white px-2 py-0.5 text-sm"
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 font-mono text-[11px] text-white">
            {habit.symbol}
          </span>
          <span className="text-sm text-ink-800">{habit.name}</span>
        </button>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await deleteHabitAction(habit.id);
          })
        }
        className="text-xs text-ink-300 hover:text-red-600"
        aria-label="Delete habit"
      >
        ×
      </button>
    </li>
  );
}

function AddHabitRow({ month, count }: { month: string; count: number }) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add() {
    const n = name.trim();
    if (!n) return;
    setError(null);
    const s = (symbol || n[0] || "•").slice(0, 2).toUpperCase();
    startTransition(async () => {
      const res = await createHabitAction({ month, name: n, symbol: s });
      if (res?.error) setError(res.error);
      else {
        setName("");
        setSymbol("");
      }
    });
  }

  return (
    <div className="border-t border-ink-100 p-2">
      <div className="flex items-center gap-2">
        <input
          value={symbol}
          placeholder={`#${count + 1}`}
          onChange={(e) => setSymbol(e.target.value.slice(0, 2).toUpperCase())}
          className="w-12 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-center font-mono text-sm"
          aria-label="Habit symbol"
        />
        <input
          value={name}
          placeholder="Add habit (e.g. Meditate)"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="flex-1 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={add}
          disabled={isPending || !name.trim()}
          className="rounded-md bg-ink-900 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="pt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function HabitMonthGrid({
  days,
  habits,
  habitLogs,
}: {
  days: string[];
  habits: Habit[];
  habitLogs: Map<string, Map<string, boolean>>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-100 bg-white">
      <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-700">
          Daily log
        </h3>
        <span className="ml-auto text-[11px] text-ink-400">
          tap toggle · long hold to reset
        </span>
      </div>
      <ul>
        {days.map((d) => (
          <DailyRow
            key={d}
            date={d}
            habits={habits}
            doneMap={
              new Map(
                habits.map((h) => [
                  h.id,
                  habitLogs.get(h.id)?.get(d) === true,
                ]),
              )
            }
          />
        ))}
      </ul>
    </div>
  );
}

function DailyRow({
  date,
  habits,
  doneMap,
}: {
  date: string;
  habits: Habit[];
  doneMap: Map<string, boolean>;
}) {
  const dayNum = Number(date.slice(8, 10));
  const isToday = date === today();
  const letter = weekdayLetter(date);
  return (
    <li
      className={
        "flex items-center gap-2 border-b border-ink-100 px-3 py-1.5 last:border-b-0 " +
        (isToday ? "bg-ink-50" : "")
      }
    >
      <span className="flex w-10 shrink-0 items-baseline gap-1 font-mono text-xs text-ink-500">
        <span className="w-4 text-right tabular-nums">{dayNum}</span>
        <span className="text-ink-400">{letter}</span>
      </span>
      <div className="flex flex-1 items-center gap-2">
        {habits.map((h) => (
          <HabitCell
            key={h.id}
            habitId={h.id}
            date={date}
            symbol={h.symbol}
            done={doneMap.get(h.id) === true}
          />
        ))}
      </div>
    </li>
  );
}

function HabitCell({
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
  const [isPending, startTransition] = useTransition();

  const timerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };

  function onPointerDown() {
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      startTransition(async () => {
        await resetHabitLogAction({ habitId, date });
      });
    }, 550);
  }

  function onPointerUp() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      startTransition(async () => {
        await toggleHabitLogAction({ habitId, date });
      });
    }
  }

  function onPointerLeave() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerLeave}
      onPointerLeave={onPointerLeave}
      className={
        "inline-flex h-8 w-10 shrink-0 items-center justify-center rounded-md font-mono text-xs transition " +
        (done
          ? "bg-ink-900 text-white"
          : "border border-ink-200 text-ink-300 hover:border-ink-400")
      }
      aria-pressed={done}
      title={`${symbol} — tap toggle, hold to reset`}
    >
      {done ? symbol : ""}
    </button>
  );
}
