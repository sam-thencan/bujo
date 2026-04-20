"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { loginAction, signupAction, type AuthState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-ink-900 py-3 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState<AuthState, FormData>(loginAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-500">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-ink-200 bg-white px-3 py-3 text-base"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-500">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-ink-200 bg-white px-3 py-3 text-base"
        />
      </label>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton label="Sign in" />
      <p className="pt-2 text-center text-sm text-ink-500">
        New here?{" "}
        <Link href="/signup" className="underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useFormState<AuthState, FormData>(signupAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-500">Name (optional)</span>
        <input
          name="name"
          type="text"
          autoComplete="name"
          className="rounded-lg border border-ink-200 bg-white px-3 py-3 text-base"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-500">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-ink-200 bg-white px-3 py-3 text-base"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-500">
          Password (min 8 chars)
        </span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="rounded-lg border border-ink-200 bg-white px-3 py-3 text-base"
        />
      </label>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton label="Create account" />
      <p className="pt-2 text-center text-sm text-ink-500">
        Have an account?{" "}
        <Link href="/login" className="underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}
