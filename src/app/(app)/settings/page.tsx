import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { listJournals } from "@/lib/journals";
import { toggleLegendAction } from "@/app/(app)/actions";
import { logoutAction } from "@/app/(auth)/actions";
import { PageHeader } from "@/components/PageHeader";
import { JournalsSettings } from "@/components/JournalsSettings";

export default async function SettingsPage() {
  const user = await requireUser();
  const [settings, journals] = await Promise.all([
    getSettings(user.id),
    listJournals(user.id),
  ]);

  return (
    <div className="pb-6">
      <PageHeader title="Settings" />
      <section className="mt-4 overflow-hidden rounded-lg border border-ink-200 bg-white">
        <Row label="Signed in as" value={user.email} />
        {user.name && <Row label="Name" value={user.name} />}
      </section>

      <h2 className="mt-6 text-[11px] uppercase tracking-wide text-ink-400">
        Journals
      </h2>
      <JournalsSettings
        journals={journals}
        currentId={user.current_journal_id}
      />

      <h2 className="mt-6 text-[11px] uppercase tracking-wide text-ink-400">
        Display
      </h2>
      <section className="mt-1 overflow-hidden rounded-lg border border-ink-200 bg-white">
        <form
          action={async () => {
            "use server";
            await toggleLegendAction(!settings.show_legend);
          }}
          className="flex items-center justify-between px-3 py-3"
        >
          <div>
            <div className="text-sm font-medium text-ink-800">
              Show shortcut legend
            </div>
            <div className="text-xs text-ink-500">
              Display bullet-journal signifiers at the top of each view.
            </div>
          </div>
          <button
            type="submit"
            aria-pressed={settings.show_legend}
            className={
              "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition " +
              (settings.show_legend ? "bg-ink-900" : "bg-ink-200")
            }
          >
            <span
              className={
                "inline-block h-5 w-5 transform rounded-full bg-white transition " +
                (settings.show_legend ? "translate-x-[18px]" : "translate-x-[2px]")
              }
            />
          </button>
        </form>
      </section>

      <h2 className="mt-6 text-[11px] uppercase tracking-wide text-ink-400">
        Data
      </h2>
      <section className="mt-1 overflow-hidden rounded-lg border border-ink-200 bg-white">
        <Link
          href="/api/export"
          prefetch={false}
          className="flex items-center justify-between px-3 py-3"
        >
          <div>
            <div className="text-sm font-medium text-ink-800">Export JSON</div>
            <div className="text-xs text-ink-500">
              Download a portable copy of your entries and settings.
            </div>
          </div>
          <span className="text-sm text-ink-400">↓</span>
        </Link>
        <Link
          href="/api/export?format=md"
          prefetch={false}
          className="flex items-center justify-between border-t border-ink-100 px-3 py-3"
        >
          <div>
            <div className="text-sm font-medium text-ink-800">
              Export Markdown
            </div>
            <div className="text-xs text-ink-500">
              Human-readable dump grouped by day and month.
            </div>
          </div>
          <span className="text-sm text-ink-400">↓</span>
        </Link>
      </section>

      <h2 className="mt-6 text-[11px] uppercase tracking-wide text-ink-400">
        Account
      </h2>
      <section className="mt-1 overflow-hidden rounded-lg border border-ink-200 bg-white">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-medium text-red-600"
          >
            Sign out
            <span aria-hidden>→</span>
          </button>
        </form>
      </section>

      <p className="mt-8 text-center text-[11px] text-ink-400">
        bujo · a calm bullet journal
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 px-3 py-3 last:border-b-0">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-sm text-ink-800">{value}</div>
    </div>
  );
}
