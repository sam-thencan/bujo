import { getDb } from "./db";

export type DaySummary = { date: string; summary: string };

export async function getMonthSummaries(
  journalId: string,
  month: string,
): Promise<Map<string, string>> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT date, summary FROM day_summaries
          WHERE journal_id = ? AND date LIKE ?`,
    args: [journalId, `${month}-%`],
  });
  const out = new Map<string, string>();
  for (const r of res.rows)
    out.set(String((r as any).date), String((r as any).summary));
  return out;
}

// Day summaries are stored per-user (their PK is (user_id, date)), but we
// also stamp journal_id so multi-journal queries and exports can tell
// which journal the summary was authored against.
// Phase 2a limitation: if a user has multiple journals, a single summary
// per date is shared across them — the latest write wins.
export async function setDaySummary(
  userId: string,
  journalId: string,
  date: string,
  summary: string,
): Promise<void> {
  const db = await getDb();
  const trimmed = summary.trim();
  if (!trimmed) {
    await db.execute({
      sql: "DELETE FROM day_summaries WHERE user_id = ? AND date = ?",
      args: [userId, date],
    });
    return;
  }
  await db.execute({
    sql: `INSERT INTO day_summaries (user_id, journal_id, date, summary, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'))
          ON CONFLICT(user_id, date) DO UPDATE SET
            journal_id = excluded.journal_id,
            summary = excluded.summary,
            updated_at = datetime('now')`,
    args: [userId, journalId, date, trimmed],
  });
}
