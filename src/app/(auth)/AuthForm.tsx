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

function GoogleButton({ label }: { label: string }) {
  return (
    <a
      href="/api/auth/google"
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white py-3 text-sm font-medium text-ink-800 hover:bg-ink-50"
    >
      <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
        <path
          fill="#4285F4"
          d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2577h2.9087c1.7018-1.5673 2.6836-3.874 2.6836-6.6146z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2577c-.806.54-1.837.8591-3.0477.8591-2.3441 0-4.3282-1.5832-5.036-3.7105H.9573v2.3318C2.4382 15.9818 5.4818 18 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z"
        />
        <path
          fill="#EA4335"
          d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0182.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z"
        />
      </svg>
      {label}
    </a>
  );
}

function Divider() {
  return (
    <div className="my-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-ink-400">
      <span className="h-px flex-1 bg-ink-200" />
      <span>or</span>
      <span className="h-px flex-1 bg-ink-200" />
    </div>
  );
}

export function LoginForm({ errorParam }: { errorParam?: string | null } = {}) {
  const [state, action] = useFormState<AuthState, FormData>(loginAction, undefined);
  const oauthError = errorParam && oauthErrorMessage(errorParam);
  return (
    <div className="flex flex-col gap-3">
      {oauthError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {oauthError}
        </p>
      )}
      <GoogleButton label="Continue with Google" />
      <Divider />
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
      </form>
      <p className="pt-2 text-center text-sm text-ink-500">
        New here?{" "}
        <Link href="/signup" className="underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function oauthErrorMessage(code: string): string {
  if (code === "oauth_state") return "Sign-in session expired — try again.";
  if (code === "email_unverified")
    return "Your Google account's email isn't verified.";
  if (code === "access_denied") return "Google sign-in was cancelled.";
  return "Google sign-in failed. Please try again.";
}

export function SignupForm() {
  const [state, action] = useFormState<AuthState, FormData>(signupAction, undefined);
  return (
    <div className="flex flex-col gap-3">
      <GoogleButton label="Continue with Google" />
      <Divider />
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
      </form>
      <p className="pt-2 text-center text-sm text-ink-500">
        Have an account?{" "}
        <Link href="/login" className="underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
