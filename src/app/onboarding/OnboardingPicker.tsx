"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  chooseOwnJournalAction,
  requestAccessAction,
  type OnboardingState,
} from "./actions";

export function OnboardingPicker() {
  const [mode, setMode] = useState<"pick" | "access">("pick");

  if (mode === "access") return <RequestAccess onBack={() => setMode("pick")} />;

  return (
    <div className="flex flex-col gap-3">
      <OwnJournalButton />
      <button
        type="button"
        onClick={() => setMode("access")}
        className="rounded-lg border border-ink-200 bg-white px-4 py-4 text-left transition hover:border-ink-400"
      >
        <div className="text-sm font-semibold text-ink-800">
          Access someone else's journal
        </div>
        <div className="mt-1 text-xs text-ink-500">
          Send a request to view and edit another user's entries. They'll have
          to approve you.
        </div>
      </button>
    </div>
  );
}

function OwnJournalButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => chooseOwnJournalAction())}
      className="rounded-lg bg-ink-900 px-4 py-4 text-left text-white transition hover:bg-ink-800 disabled:opacity-60"
    >
      <div className="text-sm font-semibold">Have your own journal</div>
      <div className="mt-1 text-xs text-ink-200">
        Start fresh. Your captures, Top 3, habits, and reflections are just
        yours.
      </div>
    </button>
  );
}

function RequestAccess({ onBack }: { onBack: () => void }) {
  const [state, action] = useFormState<OnboardingState, FormData>(
    requestAccessAction,
    undefined,
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-xs text-ink-400 hover:text-ink-700"
      >
        ← back
      </button>
      <div>
        <h2 className="text-sm font-semibold text-ink-800">
          Request access to a journal
        </h2>
        <p className="mt-1 text-xs text-ink-500">
          We'll send a request to the journal's owner. They can approve or
          deny it from their app.
        </p>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-500">Owner's email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          className="rounded-lg border border-ink-200 bg-white px-3 py-3 text-base"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-500">
          Short note (optional)
        </span>
        <textarea
          name="message"
          rows={3}
          maxLength={500}
          className="resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
          placeholder="e.g. Hey, it's your assistant."
        />
      </label>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-ink-900 py-3 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "…" : "Send request"}
    </button>
  );
}
