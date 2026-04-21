import { requireUser } from "@/lib/auth";
import { listForDay } from "@/lib/entries";
import { shiftDate, today } from "@/lib/dates";
import { BoardSwitcher } from "@/components/BoardSwitcher";
import { DayHeader } from "@/components/DayHeader";
import { DailySubNav } from "@/components/DailySubNav";
import { BottomComposer } from "@/components/BottomComposer";
import { SortableEntryList } from "@/components/SortableEntryList";
import { MigrateYesterdayBanner } from "@/components/MigrateYesterdayBanner";

const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export default async function DailyPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const user = await requireUser();
  const raw = searchParams.date;
  const date = raw && dateRe.test(raw) ? raw : today();
  const journalId = user.current_journal_id ?? "";
  const entries = journalId ? await listForDay(journalId, date) : [];

  // Show the "migrate yesterday's open tasks" banner only when viewing today.
  let yesterdayOpenCount = 0;
  const isToday = date === today();
  if (isToday && journalId) {
    const yday = shiftDate(date, -1);
    const ydayEntries = await listForDay(journalId, yday);
    yesterdayOpenCount = ydayEntries.filter(
      (e) =>
        e.type === "task" &&
        (e.status === "open" || e.status === "scheduled"),
    ).length;
  }

  const tasks = entries.filter((e) => e.type === "task");

  // Position-based Top 3: the first three active tasks (open/scheduled)
  // in the ordered list get the 1/2/3 badges. Completed/migrated/cancelled
  // tasks don't consume rank slots.
  const ranks = new Map<string, number>();
  let n = 1;
  for (const t of tasks) {
    if ((t.status === "open" || t.status === "scheduled") && n <= 3) {
      ranks.set(t.id, n++);
    }
  }

  return (
    <div>
      <DayHeader date={date} />
      <DailySubNav date={date} />

      {isToday && yesterdayOpenCount > 0 && (
        <MigrateYesterdayBanner
          fromDate={shiftDate(date, -1)}
          toDate={date}
          count={yesterdayOpenCount}
        />
      )}

      <section className="mt-3">
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-200 px-3 py-5 text-center text-xs text-ink-400">
            No tasks yet — capture below. First three are your Top 3.
          </p>
        ) : (
          <SortableEntryList entries={tasks} date={date} ranks={ranks} />
        )}
      </section>

      <div className="h-24" aria-hidden />

      <BottomComposer date={date} defaultTypes={["task", "event"]} />

      <BoardSwitcher
        variant="day"
        current={date}
        basePath="/daily"
        paramKey="date"
      />
    </div>
  );
}
