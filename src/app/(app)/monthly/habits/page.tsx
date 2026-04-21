import { requireUser } from "@/lib/auth";
import { daysInMonth, prettyMonth, shiftMonth, thisMonth } from "@/lib/dates";
import { getHabitLogs, listHabits } from "@/lib/habits";
import { PageHeader } from "@/components/PageHeader";
import { BoardSwitcher } from "@/components/BoardSwitcher";
import { MonthlySubNav } from "@/components/MonthlySubNav";
import { HabitsGrid } from "@/components/HabitsGrid";

const monthRe = /^\d{4}-\d{2}$/;

export default async function MonthlyHabitsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const user = await requireUser();
  const raw = searchParams.month;
  const month = raw && monthRe.test(raw) ? raw : thisMonth();
  const prevMonth = shiftMonth(month, -1);
  const journalId = user.current_journal_id ?? "";

  const [habits, habitLogs, prevHabits] = journalId
    ? await Promise.all([
        listHabits(journalId, month),
        getHabitLogs(journalId, month),
        listHabits(journalId, prevMonth),
      ])
    : [[], new Map<string, Map<string, boolean>>(), []];
  const days = daysInMonth(month);

  return (
    <div>
      <PageHeader
        title={prettyMonth(month)}
        subtitle="Habits — up to 3 per month"
      />
      <MonthlySubNav month={month} />
      <HabitsGrid
        month={month}
        prevMonth={prevMonth}
        days={days}
        habits={habits}
        habitLogs={habitLogs}
        hasPrevMonthHabits={prevHabits.length > 0}
      />
      <BoardSwitcher
        variant="month"
        current={month}
        basePath="/monthly/habits"
        paramKey="month"
      />
    </div>
  );
}
