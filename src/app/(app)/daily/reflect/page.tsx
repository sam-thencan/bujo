import { requireUser } from "@/lib/auth";
import { listForDay } from "@/lib/entries";
import { today } from "@/lib/dates";
import { BoardSwitcher } from "@/components/BoardSwitcher";
import { DayHeader } from "@/components/DayHeader";
import { DailySubNav } from "@/components/DailySubNav";
import { BottomComposer } from "@/components/BottomComposer";
import { ReflectionList } from "@/components/ReflectionList";

const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export default async function DailyReflectPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const user = await requireUser();
  const raw = searchParams.date;
  const date = raw && dateRe.test(raw) ? raw : today();
  const journalId = user.current_journal_id ?? "";
  const entries = journalId ? await listForDay(journalId, date) : [];
  const reflections = entries.filter((e) => e.type !== "task");

  return (
    <div>
      <DayHeader date={date} />
      <DailySubNav date={date} />

      <section className="mt-3">
        {reflections.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-200 px-3 py-5 text-center text-xs text-ink-400">
            Nothing yet. Log events, notes, or moods from the composer.
            <br />
            Swipe right on a row to indent, left to un-indent.
          </p>
        ) : (
          <ReflectionList entries={reflections} date={date} />
        )}
      </section>

      <div className="h-24" aria-hidden />

      <BottomComposer date={date} defaultTypes={["event", "note", "mood"]} />

      <BoardSwitcher
        variant="day"
        current={date}
        basePath="/daily/reflect"
        paramKey="date"
      />
    </div>
  );
}
