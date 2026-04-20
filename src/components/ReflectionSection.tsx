"use client";

import { useState } from "react";
import { EntryInput } from "./EntryInput";
import { EntryItem } from "./EntryItem";
import type { Entry } from "@/lib/entries";

export function ReflectionSection({
  entries,
  date,
}: {
  entries: Entry[];
  date: string;
}) {
  const [open, setOpen] = useState(entries.length > 0);

  return (
    <section className="mt-6 rounded-lg border border-ink-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <div>
          <div className="text-[11px] uppercase tracking-wide text-ink-400">
            Reflection
          </div>
          <div className="text-xs text-ink-500">
            Events · notes · moods — end-of-day capture.
            {entries.length > 0 && ` (${entries.length})`}
          </div>
        </div>
        <span className="text-ink-400" aria-hidden>
          {open ? "–" : "+"}
        </span>
      </button>
      {open && (
        <div className="border-t border-ink-100 px-3 pb-3 pt-2">
          <EntryInput
            log_date={date}
            placeholder="Log an event, note, or mood…"
            types={["event", "note", "mood"]}
            defaultType="mood"
            compact
          />
          {entries.length > 0 ? (
            <ul className="pt-1">
              {entries.map((e) => (
                <EntryItem
                  key={e.id}
                  entry={e}
                  context={{ kind: "day", date }}
                  hideRank
                />
              ))}
            </ul>
          ) : (
            <p className="pt-2 text-xs text-ink-400">
              Nothing reflected yet. What happened today? How did it feel?
            </p>
          )}
        </div>
      )}
    </section>
  );
}
