import Link from "next/link";
import { toggleLegendAction } from "@/app/(app)/actions";

const ITEMS = [
  { sym: "•", label: "action" },
  { sym: "X", label: "done" },
  { sym: "○", label: "event" },
  { sym: "—", label: "note" },
  { sym: "=", label: "mood" },
  { sym: ">", label: "migrated" },
  { sym: "<", label: "scheduled" },
  { sym: "1·2·3", label: "top 3" },
];

export function TopLegend({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="safe-top sticky top-0 z-20 border-b border-ink-100 bg-ink-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-screen-sm items-center gap-2 px-3 py-1.5">
        <ul className="no-scrollbar flex flex-1 items-center gap-3 overflow-x-auto text-[11px] leading-none text-ink-500">
          {ITEMS.map((i) => (
            <li key={i.label} className="flex shrink-0 items-center gap-1.5">
              <span className="font-mono text-ink-900">{i.sym}</span>
              <span>{i.label}</span>
            </li>
          ))}
        </ul>
        <form
          action={async () => {
            "use server";
            await toggleLegendAction(false);
          }}
        >
          <button
            type="submit"
            className="shrink-0 text-[11px] text-ink-400 hover:text-ink-700"
            aria-label="Hide legend"
            title="Hide legend"
          >
            hide
          </button>
        </form>
        <Link
          href="/settings"
          className="shrink-0 text-[11px] text-ink-400 hover:text-ink-700"
          aria-label="Settings"
        >
          ⚙
        </Link>
      </div>
    </div>
  );
}
