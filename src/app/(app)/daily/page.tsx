import { requireUser } from "@/lib/auth";
import { listForDay } from "@/lib/entries";
import { today } from "@/lib/dates";
import { EntryInput } from "@/components/EntryInput";
import { EntryItem } from "@/components/EntryItem";
import { BoardSwitcher } from "@/components/BoardSwitcher";
import { DayHeader } from "@/components/DayHeader";
import { TopThreeSection } from "@/components/TopThreeSection";
import { ReflectionSection } from "@/components/ReflectionSection";

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

  const tasks = entries.filter((e) => e.type === "task");
  const reflections = entries.filter((e) => e.type !== "task");

  const topThree = tasks.filter(
    (t) => t.priority_rank != null && t.status !== "migrated",
  );
  const otherTasks = tasks.filter(
    (t) => t.priority_rank == null || t.status === "migrated",
  );
  const openOtherTasks = otherTasks.filter(
    (t) => t.status === "open" || t.status === "scheduled",
  );

  return (
    <div>
      <DayHeader date={date} />
      <EntryInput
        log_date={date}
        defaultType="task"
        types={["task", "event", "note", "mood"]}
        placeholder="Brain dump… (tasks by default)"
      />

      <TopThreeSection
        entries={topThree}
        candidates={openOtherTasks}
        date={date}
      />

      <section className="mt-5">
        <h2 className="text-[11px] uppercase tracking-wide text-ink-400">
          Tasks
        </h2>
        {otherTasks.length === 0 ? (
          <p className="mt-1 rounded-lg border border-dashed border-ink-200 bg-white px-3 py-4 text-center text-xs text-ink-400">
            No other tasks yet. Brain-dump above.
          </p>
        ) : (
          <ul className="mt-1 overflow-hidden rounded-lg border border-ink-100 bg-white px-2">
            {otherTasks.map((e) => (
              <EntryItem
                key={e.id}
                entry={e}
                context={{ kind: "day", date }}
              />
            ))}
          </ul>
        )}
      </section>

      <ReflectionSection entries={reflections} date={date} />

      <BoardSwitcher
        variant="day"
        current={date}
        basePath="/daily"
        paramKey="date"
      />
    </div>
  );
}
