import { getDb } from "./db";

export type DaySummary = { date: string; summary: string };

export async function getMonthSummaries(
  userId: string,
  month: string,
): Promise<Map<string, string>> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT date, summary FROM day_summaries
          WHERE user_id = ? AND date LIKE ?`,
    args: [userId, `${month}-%`],
  });
  const out = new Map<string, string>();
  for (const r of res.rows)
    out.set(String((r as any).date), String((r as any).summary));
  return out;
}

export async function setDaySummary(
  userId: string,
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
    sql: `INSERT INTO day_summaries (user_id, date, summary, updated_at)
          VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(user_id, date) DO UPDATE SET
            summary = excluded.summary,
            updated_at = datetime('now')`,
    args: [userId, date, trimmed],
  });
}
