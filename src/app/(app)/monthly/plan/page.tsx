import { requireUser } from "@/lib/auth";
import { prettyMonth, thisMonth } from "@/lib/dates";
import { listPlan } from "@/lib/actionPlan";
import { PageHeader } from "@/components/PageHeader";
import { BoardSwitcher } from "@/components/BoardSwitcher";
import { MonthlySubNav } from "@/components/MonthlySubNav";
import { PlanLists } from "@/components/PlanLists";

const monthRe = /^\d{4}-\d{2}$/;

export default async function MonthlyPlanPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const user = await requireUser();
  const raw = searchParams.month;
  const month = raw && monthRe.test(raw) ? raw : thisMonth();
  const items = await listPlan(user.id, month);

  return (
    <div>
      <PageHeader
        title={prettyMonth(month)}
        subtitle="Plan — intents for the month"
      />
      <MonthlySubNav month={month} />
      <PlanLists month={month} items={items} />
      <BoardSwitcher
        variant="month"
        current={month}
        basePath="/monthly/plan"
        paramKey="month"
      />
    </div>
  );
}
