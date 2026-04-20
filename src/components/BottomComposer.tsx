"use client";

import { useState, useTransition } from "react";
import { createEntryAction } from "@/app/(app)/actions";
import type { EntryType } from "@/lib/entries";

type Mode = "capture" | "reflect";

const BUTTONS: Record<
  Mode,
  Array<{ key: EntryType; sym: string; label: string }>
> = {
  capture: [
    { key: "task", sym: "•", label: "Task" },
    { key: "event", sym: "○", label: "Event" },
    { key: "note", sym: "—", label: "Note" },
  ],
  reflect: [
    { key: "event", sym: "○", label: "Event" },
    { key: "note", sym: "—", label: "Note" },
    { key: "mood", sym: "=", label: "Mood" },
  ],
};

export function BottomComposer({ date }: { date: string }) {
  const [mode, setMode] = useState<Mode>("capture");
  const [raw, setRaw] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canSubmit = raw.trim().length > 0 && !isPending;

  function submit(type: EntryType) {
    const value = raw.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      const res = await createEntryAction({
        raw: value,
        type,
        log_date: date,
      });
      if (res?.error) setError(res.error);
      else setRaw("");
    });
  }

  const buttons = BUTTONS[mode];

  return (
    <div className="fixed inset-x-0 bottom-[92px] z-30 border-t border-ink-100 bg-ink-50/95 backdrop-blur">
      <div className="mx-auto max-w-screen-sm px-2 pb-2 pt-1.5">
        <div className="mb-1.5 flex items-center gap-1">
          <ModeChip
            label="Capture"
            active={mode === "capture"}
            onClick={() => setMode("capture")}
          />
          <ModeChip
            label="Reflect"
            active={mode === "reflect"}
            onClick={() => setMode("reflect")}
          />
          {error && (
            <span className="ml-auto text-[11px] text-red-600">{error}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex shrink-0 items-center gap-1">
            {buttons.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => submit(b.key)}
                disabled={!canSubmit}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-ink-200 bg-white font-mono text-lg text-ink-800 transition disabled:opacity-40 active:bg-ink-900 active:text-white"
                title={`Add as ${b.label}`}
                aria-label={`Add as ${b.label}`}
              >
                {b.sym}
              </button>
            ))}
          </div>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            enterKeyHint="send"
            value={raw}
            placeholder={
              mode === "capture"
                ? "Brain dump…"
                : "Log an event, note, or mood…"
            }
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit) {
                e.preventDefault();
                submit(buttons[0].key);
              }
            }}
            className="min-w-0 flex-1 rounded-md border border-ink-200 bg-white px-3 py-2.5 text-base placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function ModeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition " +
        (active
          ? "bg-ink-900 text-white"
          : "bg-ink-100 text-ink-500 hover:text-ink-900")
      }
    >
      {label}
    </button>
  );
}
