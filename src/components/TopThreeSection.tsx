"use client";

import { useTransition } from "react";
import { setPriorityRankAction } from "@/app/(app)/actions";
import { EntryItem } from "./EntryItem";
import type { Entry } from "@/lib/entries";

export function TopThreeSection({
  entries,
  candidates,
  date,
}: {
  entries: Entry[];
  candidates: Entry[];
  date: string;
}) {
  // Build a 3-row view, filling with null for empty slots.
  const slots: Array<Entry | null> = [null, null, null];
  for (const e of entries) {
    if (e.priority_rank && e.priority_rank >= 1 && e.priority_rank <= 3) {
      slots[e.priority_rank - 1] = e;
    }
  }
  const hasAny = slots.some(Boolean);

  return (
    <section className="mt-3">
      <h2 className="text-[11px] uppercase tracking-wide text-ink-400">
        Top 3 today
      </h2>
      <ul className="mt-1 rounded-lg border border-ink-100 bg-white">
        {slots.map((entry, i) => (
          <li
            key={i}
            className="flex items-start gap-2 border-b border-ink-100 last:border-b-0"
          >
            {entry ? (
              <div className="flex-1 px-2">
                <EntryItem
                  entry={entry}
                  context={{ kind: "day", date }}
                />
              </div>
            ) : (
              <EmptySlot rank={i + 1} candidates={candidates} />
            )}
          </li>
        ))}
      </ul>
      {!hasAny && (
        <p className="mt-1 px-1 text-[11px] text-ink-400">
          Tap a slot to promote one of today's tasks to the top.
        </p>
      )}
    </section>
  );
}

function EmptySlot({
  rank,
  candidates,
}: {
  rank: number;
  candidates: Entry[];
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <details className="w-full">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-ink-300 font-mono text-[11px] text-ink-400">
          {rank}
        </span>
        <span className="text-ink-400">Promote a task…</span>
      </summary>
      <div className="max-h-60 overflow-y-auto border-t border-ink-100">
        {candidates.length === 0 ? (
          <p className="px-3 py-2 text-xs text-ink-400">
            Add a task first to promote it.
          </p>
        ) : (
          <ul>
            {candidates.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await setPriorityRankAction(c.id, rank);
                    })
                  }
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-ink-50 disabled:opacity-60"
                >
                  <span className="mr-2 font-mono text-ink-500">•</span>
                  {c.content}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
