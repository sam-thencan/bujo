import { requireUser } from "@/lib/auth";
import { listFuture, type Entry } from "@/lib/entries";
import { futureMonths } from "@/lib/dates";
import { PageHeader } from "@/components/PageHeader";
import { FutureStack } from "@/components/FutureStack";

export default async function FuturePage() {
  const user = await requireUser();
  const months = futureMonths(12);
  const journalId = user.current_journal_id ?? "";
  const lists = journalId
    ? await Promise.all(months.map((m) => listFuture(journalId, m)))
    : months.map(() => [] as Entry[]);
  const entriesByMonth = new Map<string, Entry[]>();
  months.forEach((m, i) => entriesByMonth.set(m, lists[i]));

  return (
    <div className="pb-6">
      <PageHeader
        title="Future log"
        subtitle="Capture intents for the months ahead"
      />
      <FutureStack months={months} entriesByMonth={entriesByMonth} />
    </div>
  );
}
