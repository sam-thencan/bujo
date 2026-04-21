import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function PendingPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const target = searchParams.email ?? "the journal owner";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Request sent.</h1>
      <p className="mt-2 text-sm text-ink-500">
        We've queued your access request for <strong>{target}</strong>. They'll
        see it next time they open bujo and can approve or deny it from there.
      </p>
      <p className="mt-4 text-xs text-ink-400">
        Heads up — shared journals aren't fully wired yet. This phase captures
        the request; the approval UI and shared access ship in a follow-up.
      </p>
      <div className="mt-8 flex flex-col gap-2">
        <Link
          href="/daily"
          className="rounded-lg border border-ink-200 bg-white px-4 py-3 text-center text-sm font-medium text-ink-800 hover:bg-ink-50"
        >
          Browse your own empty journal for now
        </Link>
      </div>
    </main>
  );
}
