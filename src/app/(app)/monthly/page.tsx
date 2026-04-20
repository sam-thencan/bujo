import { requireUser } from "@/lib/auth";
import { daysInMonth, prettyMonth, thisMonth } from "@/lib/dates";
import { getMonthSummaries } from "@/lib/daySummaries";
import { getHabitLogs, listHabits } from "@/lib/habits";
import { PageHeader } from "@/components/PageHeader";
import { BoardSwitcher } from "@/components/BoardSwitcher";
import { MonthlySubNav } from "@/components/MonthlySubNav";
import { MonthlyTimeline } from "@/components/MonthlyTimeline";

const monthRe = /^\d{4}-\d{2}$/;

export default async function MonthlyTimelinePage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const user = await requireUser();
  const raw = searchParams.month;
  const month = raw && monthRe.test(raw) ? raw : thisMonth();

  const [summaries, habits, habitLogs] = await Promise.all([
    getMonthSummaries(user.id, month),
    listHabits(user.id, month),
    getHabitLogs(user.id, month),
  ]);
  const days = daysInMonth(month);

  return (
    <div>
      <PageHeader
        title={prettyMonth(month)}
        subtitle="Timeline — one line per day"
      />
      <MonthlySubNav month={month} />
      <MonthlyTimeline
        days={days}
        summaries={summaries}
        habits={habits}
        habitLogs={habitLogs}
      />

      <BoardSwitcher
        variant="month"
        current={month}
        basePath="/monthly"
        paramKey="month"
      />
    </div>
  );
}
