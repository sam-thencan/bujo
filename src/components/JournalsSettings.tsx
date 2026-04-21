"use client";

import { useState, useTransition } from "react";
import {
  createJournalAction,
  deleteJournalAction,
  renameJournalAction,
  switchJournalAction,
} from "@/app/(app)/settings/actions";
import type { Journal } from "@/lib/journals";

export function JournalsSettings({
  journals,
  currentId,
}: {
  journals: Journal[];
  currentId: string | null;
}) {
  const [creating, setCreating] = useState(false);
  return (
    <section className="mt-1 overflow-hidden rounded-lg border border-ink-200 bg-white">
      {journals.map((j) => (
        <JournalRow
          key={j.id}
          journal={j}
          isCurrent={j.id === currentId}
          onlyOne={journals.length === 1}
        />
      ))}
      {creating ? (
        <NewJournalForm onDone={() => setCreating(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-between border-t border-ink-100 px-3 py-3 text-left text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          + New journal
        </button>
      )}
    </section>
  );
}

function JournalRow({
  journal,
  isCurrent,
  onlyOne,
}: {
  journal: Journal;
  isCurrent: boolean;
  onlyOne: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(journal.name);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function rename() {
    const v = name.trim();
    if (!v || v === journal.name) {
      setEditing(false);
      setName(journal.name);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await renameJournalAction({ id: journal.id, name: v });
      if (res?.error) setError(res.error);
      else setEditing(false);
    });
  }

  function switchTo() {
    if (isCurrent) return;
    startTransition(async () => {
      await switchJournalAction(journal.id);
    });
  }

  function del() {
    if (onlyOne) return;
    if (
      !confirm(
        `Delete "${journal.name}" and all its entries, habits, and plans? This can't be undone.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteJournalAction(journal.id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="border-b border-ink-100 px-3 py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={switchTo}
          className={
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border " +
            (isCurrent
              ? "border-ink-900 bg-ink-900 text-white"
              : "border-ink-300 text-transparent hover:border-ink-500")
          }
          aria-label={isCurrent ? "Current journal" : `Switch to ${journal.name}`}
          title={isCurrent ? "Current" : "Switch to this journal"}
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
            <path d="M4.5 8.5L2 6l1-1 1.5 1.5L9 2l1 1-5.5 5.5z" />
          </svg>
        </button>
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={rename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                rename();
              }
              if (e.key === "Escape") {
                setEditing(false);
                setName(journal.name);
              }
            }}
            className="flex-1 rounded border border-ink-200 bg-white px-2 py-1 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 text-left text-sm text-ink-800"
          >
            {journal.name}
            {isCurrent && (
              <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-400">
                current
              </span>
            )}
          </button>
        )}
        {!onlyOne && (
          <button
            type="button"
            onClick={del}
            className="shrink-0 text-xs text-ink-300 hover:text-red-600"
            aria-label="Delete journal"
            title="Delete journal"
          >
            ×
          </button>
        )}
      </div>
      {error && <p className="pt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function NewJournalForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const res = await createJournalAction(formData);
      if (res?.error) setError(res.error);
      else {
        setName("");
        onDone();
      }
    });
  }

  return (
    <form
      action={submit}
      className="flex items-center gap-2 border-t border-ink-100 px-3 py-2"
    >
      <input
        name="name"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Journal name (e.g. Work)"
        className="flex-1 rounded border border-ink-200 bg-white px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="rounded-md bg-ink-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        Create
      </button>
      <button
        type="button"
        onClick={onDone}
        className="text-xs text-ink-400 hover:text-ink-700"
      >
        cancel
      </button>
      {error && <p className="pt-1 text-[11px] text-red-600">{error}</p>}
    </form>
  );
}
