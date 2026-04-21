"use client";

import { useTransition } from "react";
import { bulkMigrateAction } from "@/app/(app)/actions";

export function MigrateYesterdayBanner({
  fromDate,
  toDate,
  count,
}: {
  fromDate: string;
  toDate: string;
  count: number;
}) {
  const [isPending, startTransition] = useTransition();
  if (count <= 0) return null;

  function migrate() {
    startTransition(async () => {
      await bulkMigrateAction({ fromDate, toDate });
    });
  }

  return (
    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs">
      <div className="min-w-0">
        <span className="font-medium text-ink-800">
          {count} open task{count === 1 ? "" : "s"} from yesterday
        </span>
        <span className="ml-1 text-ink-500">— migrate to today?</span>
      </div>
      <button
        type="button"
        onClick={migrate}
        disabled={isPending}
        className="shrink-0 rounded-md bg-ink-900 px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
      >
        Migrate →
      </button>
    </div>
  );
}
