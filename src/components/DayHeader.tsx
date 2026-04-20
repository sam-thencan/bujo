import Link from "next/link";
import { prettyDateLong, shiftDate, today } from "@/lib/dates";
import { format, parseISO } from "date-fns";

export function DayHeader({ date }: { date: string }) {
  const isToday = date === today();
  const isYesterday = date === shiftDate(today(), -1);
  const isTomorrow = date === shiftDate(today(), 1);
  const pretty = prettyDateLong(date);
  const weekday = format(parseISO(date), "EEEE");

  let title = weekday;
  if (isToday) title = "Today";
  else if (isYesterday) title = "Yesterday";
  else if (isTomorrow) title = "Tomorrow";

  return (
    <header className="flex items-start justify-between gap-2 pb-1 pt-1">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-0.5 text-xs text-ink-500">{pretty}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!isToday && (
          <Link
            href={`/daily?date=${today()}`}
            className="rounded-md bg-ink-100 px-2 py-1 text-[11px] font-medium text-ink-700 hover:bg-ink-200"
          >
            → Today
          </Link>
        )}
        <Link
          href="/settings"
          className="rounded-md px-2 py-1 text-sm text-ink-400 hover:text-ink-900"
          aria-label="Settings"
        >
          ⚙
        </Link>
      </div>
    </header>
  );
}
