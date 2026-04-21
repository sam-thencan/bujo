"use client";

import { useState, useTransition } from "react";
import { createEntryAction } from "@/app/(app)/actions";
import type { EntryType } from "@/lib/entries";

const ALL_TYPES: Array<{ key: EntryType; sym: string; label: string }> = [
  { key: "task", sym: "•", label: "Task" },
  { key: "event", sym: "○", label: "Event" },
  { key: "note", sym: "—", label: "Note" },
  { key: "mood", sym: "=", label: "Mood" },
];

export function BottomComposer({
  date,
  defaultTypes,
}: {
  date: string;
  defaultTypes?: EntryType[];
}) {
  const types = defaultTypes
    ? ALL_TYPES.filter((t) => defaultTypes.includes(t.key))
    : ALL_TYPES;
  const primary = types[0]?.key ?? "task";
  const [raw, setRaw] = useState("");
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canSubmit = raw.trim().length > 0;

  function submit(type: EntryType) {
    const value = raw.trim();
    if (!value) return;
    setError(null);
    setRaw("");
    startTransition(async () => {
      const res = await createEntryAction({ raw: value, type, log_date: date });
      if (res?.error) {
        setError(res.error);
        setRaw(value);
      }
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-[104px] z-30 border-t border-ink-100 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-screen-sm px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            enterKeyHint="send"
            value={raw}
            placeholder="Capture…"
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit) {
                e.preventDefault();
                submit(primary);
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-base placeholder:text-ink-400 focus:border-ink-400 focus:bg-white focus:outline-none"
          />
          <div className="flex shrink-0 items-center gap-1">
            {types.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => submit(t.key)}
                disabled={!canSubmit}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 font-mono text-base text-ink-700 transition hover:border-ink-400 hover:bg-white disabled:opacity-30 active:bg-ink-900 active:text-white"
                title={t.label}
                aria-label={`Add as ${t.label}`}
              >
                {t.sym}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className="mt-1 text-[11px] text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
