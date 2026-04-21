import { requireUser } from "@/lib/auth";
import { listForDay } from "@/lib/entries";
import { today } from "@/lib/dates";
import { EntryItem } from "@/components/EntryItem";
import { BoardSwitcher } from "@/components/BoardSwitcher";
import { DayHeader } from "@/components/DayHeader";
import { TopThreeSection } from "@/components/TopThreeSection";
import { BottomComposer } from "@/components/BottomComposer";

const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export default async function DailyPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const user = await requireUser();
  const raw = searchParams.date;
  const date = raw && dateRe.test(raw) ? raw : today();
  const entries = await listForDay(user.id, date);

  const topThree = entries.filter(
    (e) => e.type === "task" && e.priority_rank != null && e.status !== "migrated",
  );
  const rest = entries.filter(
    (e) => !(e.type === "task" && e.priority_rank != null && e.status !== "migrated"),
  );
  const openTasks = rest.filter(
    (e) => e.type === "task" && (e.status === "open" || e.status === "scheduled"),
  );

  return (
    <div>
      <DayHeader date={date} />

      <TopThreeSection entries={topThree} candidates={openTasks} date={date} />

      <section className="mt-4">
        {rest.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-200 px-3 py-5 text-center text-xs text-ink-400">
            Nothing here yet — capture below.
          </p>
        ) : (
          <ul className="rounded-lg border border-ink-100 bg-white px-2">
            {rest.map((e) => (
              <EntryItem key={e.id} entry={e} context={{ kind: "day", date }} />
            ))}
          </ul>
        )}
      </section>

      <div className="h-24" aria-hidden />

      <BottomComposer date={date} />

      <BoardSwitcher
        variant="day"
        current={date}
        basePath="/daily"
        paramKey="date"
      />
    </div>
  );
}
