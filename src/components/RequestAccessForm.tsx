"use client";

import { useState, useTransition } from "react";
import {
  cancelOutgoingRequestAction,
  requestAccessAction,
} from "@/app/(app)/settings/actions";
import type { AccessRequest } from "@/lib/accessRequests";

export function RequestAccessForm({
  outgoing,
}: {
  outgoing: AccessRequest[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <h2 className="mt-6 text-[11px] uppercase tracking-wide text-ink-400">
        Access another journal
      </h2>
      <section className="mt-1 overflow-hidden rounded-lg border border-ink-200 bg-white">
        {outgoing.map((r) => (
          <OutgoingRow key={r.id} request={r} />
        ))}
        {open ? (
          <Form onDone={() => setOpen(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            + Request access by email
          </button>
        )}
      </section>
    </>
  );
}

function OutgoingRow({ request }: { request: AccessRequest }) {
  const [hidden, setHidden] = useState(false);
  const [, startTransition] = useTransition();

  function cancel() {
    setHidden(true);
    startTransition(async () => {
      await cancelOutgoingRequestAction(request.id);
    });
  }

  if (hidden) return null;

  const statusLabel =
    request.status === "pending"
      ? "Pending"
      : request.status === "approved"
        ? `Approved${request.approved_journal_name ? ` → ${request.approved_journal_name}` : ""}`
        : "Denied";
  const statusColor =
    request.status === "approved"
      ? "text-ink-800"
      : request.status === "denied"
        ? "text-red-600"
        : "text-ink-500";

  return (
    <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-3 py-2 last:border-b-0">
      <div className="min-w-0">
        <div className="truncate text-sm text-ink-800">
          {request.target_email}
        </div>
        <div className={"text-[11px] " + statusColor}>{statusLabel}</div>
      </div>
      {request.status === "pending" && (
        <button
          type="button"
          onClick={cancel}
          className="shrink-0 text-[11px] text-ink-400 hover:text-red-600"
        >
          cancel
        </button>
      )}
    </div>
  );
}

function Form({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!email.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await requestAccessAction({
        email: email.trim(),
        message: message.trim() || undefined,
      });
      if (res?.error) setError(res.error);
      else {
        setEmail("");
        setMessage("");
        onDone();
      }
    });
  }

  return (
    <div className="border-t border-ink-100 px-3 py-2">
      <div className="flex flex-col gap-2">
        <input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@example.com"
          className="rounded border border-ink-200 bg-white px-2 py-1.5 text-sm"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Short note (optional)"
          className="resize-none rounded border border-ink-200 bg-white px-2 py-1.5 text-sm"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={!email.trim() || isPending}
            className="rounded-md bg-ink-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            Send request
          </button>
          <button
            type="button"
            onClick={onDone}
            className="text-xs text-ink-400 hover:text-ink-700"
          >
            cancel
          </button>
        </div>
        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>
    </div>
  );
}
