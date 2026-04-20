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

export function EntryInput({
  log_date,
  log_month,
  placeholder = "Add an entry…",
  types,
  defaultType = "task",
  compact = false,
  autoFocus = false,
  onCreated,
}: {
  log_date?: string | null;
  log_month?: string;
  placeholder?: string;
  types?: EntryType[];
  defaultType?: EntryType;
  compact?: boolean;
  autoFocus?: boolean;
  onCreated?: () => void;
}) {
  const typeList = types
    ? ALL_TYPES.filter((t) => types.includes(t.key))
    : ALL_TYPES;
  const [type, setType] = useState<EntryType>(
    typeList.find((t) => t.key === defaultType)?.key ?? typeList[0].key,
  );
  const [raw, setRaw] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const value = raw.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      const res = await createEntryAction({
        raw: value,
        type,
        log_date: log_date ?? null,
        log_month,
      });
      if (res?.error) setError(res.error);
      else {
        setRaw("");
        onCreated?.();
      }
    });
  }

  return (
    <div
      className={
        compact
          ? "py-1"
          : "-mx-3 border-b border-ink-100 bg-ink-50/95 px-3 py-2"
      }
    >
      <div className="flex items-center gap-2">
        {typeList.length > 1 && (
          <div
            role="tablist"
            className="inline-flex overflow-hidden rounded-md border border-ink-200 bg-white"
          >
            {typeList.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={type === t.key}
                onClick={() => setType(t.key)}
                className={
                  "px-2 py-1.5 text-xs font-medium " +
                  (type === t.key
                    ? "bg-ink-900 text-white"
                    : "text-ink-500 hover:text-ink-900")
                }
                title={t.label}
              >
                <span className="font-mono">{t.sym}</span>
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          enterKeyHint="send"
          autoFocus={autoFocus}
          value={raw}
          placeholder={placeholder}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="flex-1 rounded-md border border-ink-200 bg-white px-3 py-2 text-base placeholder:text-ink-400"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !raw.trim()}
          className="rounded-md bg-ink-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="pt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
