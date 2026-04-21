"use client";

import { useState, useTransition } from "react";
import {
  approveRequestAction,
  denyRequestAction,
} from "@/app/(app)/settings/actions";
import type { AccessRequest } from "@/lib/accessRequests";
import type { Journal } from "@/lib/journals";

export function AccessRequestsInbox({
  requests,
  ownedJournals,
}: {
  requests: AccessRequest[];
  ownedJournals: Journal[];
}) {
  if (requests.length === 0) return null;
  return (
    <>
      <h2 className="mt-6 text-[11px] uppercase tracking-wide text-ink-400">
        Access requests
      </h2>
      <section className="mt-1 overflow-hidden rounded-lg border border-ink-200 bg-white">
        {requests.map((r) => (
          <RequestRow key={r.id} request={r} journals={ownedJournals} />
        ))}
      </section>
    </>
  );
}

function RequestRow({
  request,
  journals,
}: {
  request: AccessRequest;
  journals: Journal[];
}) {
  const [journalId, setJournalId] = useState(journals[0]?.id ?? "");
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function approve() {
    if (!journalId) return;
    setHidden(true);
    startTransition(async () => {
      const res = await approveRequestAction({
        requestId: request.id,
        journalId,
      });
      if (res?.error) {
        setError(res.error);
        setHidden(false);
      }
    });
  }

  function deny() {
    setHidden(true);
    startTransition(async () => {
      const res = await denyRequestAction(request.id);
      if (res?.error) {
        setError(res.error);
        setHidden(false);
      }
    });
  }

  if (hidden) return null;

  return (
    <div className="border-b border-ink-100 px-3 py-3 last:border-b-0">
      <div className="text-sm text-ink-800">
        <strong>
          {request.requester_name ?? request.requester_email}
        </strong>{" "}
        <span className="text-ink-500">
          ({request.requester_email})
        </span>
      </div>
      {request.message && (
        <p className="mt-1 text-xs italic text-ink-500">
          "{request.message}"
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="text-[11px] uppercase tracking-wide text-ink-400">
          Grant access to
        </label>
        <select
          value={journalId}
          onChange={(e) => setJournalId(e.target.value)}
          className="rounded border border-ink-200 bg-white px-2 py-1 text-xs"
        >
          {journals.map((j) => (
            <option key={j.id} value={j.id}>
              {j.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={approve}
          disabled={!journalId}
          className="rounded-md bg-ink-900 px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={deny}
          className="rounded-md border border-ink-200 px-2 py-1 text-[11px] text-ink-600 hover:text-red-600"
        >
          Deny
        </button>
      </div>
      {error && (
        <p className="pt-1 text-[11px] text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
