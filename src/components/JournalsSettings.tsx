"use client";

import { useState, useTransition } from "react";
import {
  createJournalAction,
  deleteJournalAction,
  renameJournalAction,
  revokeMemberAction,
  switchJournalAction,
} from "@/app/(app)/settings/actions";
import type { Journal } from "@/lib/journals";
import type { Member } from "@/lib/memberships";

export function JournalsSettings({
  journals,
  currentId,
  membersByJournal,
}: {
  journals: Journal[];
  currentId: string | null;
  membersByJournal: Record<string, Member[]>;
}) {
  const [creating, setCreating] = useState(false);
  const ownedCount = journals.filter((j) => j.role === "owner").length;
  return (
    <section className="mt-1 overflow-hidden rounded-lg border border-ink-200 bg-white">
      {journals.map((j) => (
        <JournalRow
          key={j.id}
          journal={j}
          isCurrent={j.id === currentId}
          onlyOwnedOne={ownedCount <= 1 && j.role === "owner"}
          members={membersByJournal[j.id] ?? []}
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
  onlyOwnedOne,
  members,
}: {
  journal: Journal;
  isCurrent: boolean;
  onlyOwnedOne: boolean;
  members: Member[];
}) {
  const [editing, setEditing] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [name, setName] = useState(journal.name);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isOwner = journal.role === "owner";
  const collaborators = members.filter((m) => m.role !== "owner");

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
    if (onlyOwnedOne) return;
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

  function revoke(memberUserId: string, memberEmail: string) {
    if (
      !confirm(`Revoke access for ${memberEmail}? They'll lose this journal.`)
    ) {
      return;
    }
    startTransition(async () => {
      const res = await revokeMemberAction({
        journalId: journal.id,
        memberUserId,
      });
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
        {editing && isOwner ? (
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
            onClick={() => isOwner && setEditing(true)}
            className="flex-1 text-left text-sm text-ink-800"
          >
            {journal.name}
            {!isOwner && (
              <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-400">
                shared
              </span>
            )}
            {isCurrent && (
              <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-400">
                current
              </span>
            )}
          </button>
        )}
        {isOwner && collaborators.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMembers((o) => !o)}
            className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-600 hover:bg-ink-200"
            title="Show members"
          >
            {collaborators.length}
          </button>
        )}
        {isOwner && !onlyOwnedOne && (
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
      {showMembers && isOwner && collaborators.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-ink-100 pt-2">
          {collaborators.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="min-w-0 truncate text-ink-700">
                {m.name ?? m.email}{" "}
                <span className="text-ink-400">({m.email})</span>
              </span>
              <button
                type="button"
                onClick={() => revoke(m.user_id, m.email)}
                className="shrink-0 text-[11px] text-ink-400 hover:text-red-600"
              >
                revoke
              </button>
            </li>
          ))}
        </ul>
      )}
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
