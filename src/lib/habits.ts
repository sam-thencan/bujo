import { getDb } from "./db";
import { newId } from "./ids";

export const HABIT_LIMIT = 3;

export type Habit = {
  id: string;
  month: string;
  name: string;
  symbol: string;
  order_index: number;
  archived: boolean;
};

function rowToHabit(row: any): Habit {
  return {
    id: String(row.id),
    month: String(row.month),
    name: String(row.name),
    symbol: String(row.symbol),
    order_index: Number(row.order_index ?? 0),
    archived: Number(row.archived) === 1,
  };
}

export async function listHabits(
  journalId: string,
  month: string,
): Promise<Habit[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT * FROM habits
          WHERE journal_id = ? AND month = ? AND archived = 0
          ORDER BY order_index ASC, created_at ASC`,
    args: [journalId, month],
  });
  return res.rows.map(rowToHabit);
}

export async function createHabit(
  userId: string,
  journalId: string,
  month: string,
  name: string,
  symbol?: string,
): Promise<Habit> {
  const db = await getDb();
  const existing = await listHabits(journalId, month);
  if (existing.length >= HABIT_LIMIT) {
    throw new Error(`At most ${HABIT_LIMIT} habits per month.`);
  }
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Habit name is required.");
  const sym = (symbol ?? trimmed[0] ?? "•").slice(0, 2);
  const id = newId("h");
  const nextOrder =
    existing.reduce((m, h) => Math.max(m, h.order_index), 0) + 1;
  await db.execute({
    sql: `INSERT INTO habits (id, user_id, journal_id, month, name, symbol, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, userId, journalId, month, trimmed, sym, nextOrder],
  });
  return {
    id,
    month,
    name: trimmed,
    symbol: sym,
    order_index: nextOrder,
    archived: false,
  };
}

export async function renameHabit(
  userId: string,
  id: string,
  name: string,
  symbol?: string,
): Promise<void> {
  const db = await getDb();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Habit name is required.");
  const sym = symbol?.slice(0, 2);
  if (sym) {
    await db.execute({
      sql: "UPDATE habits SET name = ?, symbol = ? WHERE id = ? AND user_id = ?",
      args: [trimmed, sym, id, userId],
    });
  } else {
    await db.execute({
      sql: "UPDATE habits SET name = ? WHERE id = ? AND user_id = ?",
      args: [trimmed, id, userId],
    });
  }
}

export async function deleteHabit(userId: string, id: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM habits WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
}

export async function carryForwardHabits(
  userId: string,
  journalId: string,
  fromMonth: string,
  toMonth: string,
): Promise<number> {
  const db = await getDb();
  const src = await listHabits(journalId, fromMonth);
  const dst = await listHabits(journalId, toMonth);
  if (dst.length > 0) return 0;
  let count = 0;
  for (const h of src) {
    await db.execute({
      sql: `INSERT INTO habits (id, user_id, journal_id, month, name, symbol, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newId("h"),
        userId,
        journalId,
        toMonth,
        h.name,
        h.symbol,
        h.order_index,
      ],
    });
    count++;
  }
  return count;
}

export async function getHabitLogs(
  journalId: string,
  month: string,
): Promise<Map<string, Map<string, boolean>>> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT hl.habit_id, hl.date, hl.done
          FROM habit_logs hl
          JOIN habits h ON h.id = hl.habit_id
          WHERE h.journal_id = ? AND h.month = ?`,
    args: [journalId, month],
  });
  const map = new Map<string, Map<string, boolean>>();
  for (const r of res.rows) {
    const habitId = String((r as any).habit_id);
    const date = String((r as any).date);
    const done = Number((r as any).done) === 1;
    if (!map.has(habitId)) map.set(habitId, new Map());
    map.get(habitId)!.set(date, done);
  }
  return map;
}

export async function toggleHabitLog(
  userId: string,
  habitId: string,
  date: string,
): Promise<boolean> {
  const db = await getDb();
  // Ensure ownership
  const own = await db.execute({
    sql: "SELECT id FROM habits WHERE id = ? AND user_id = ? LIMIT 1",
    args: [habitId, userId],
  });
  if (!own.rows[0]) throw new Error("Habit not found.");
  const cur = await db.execute({
    sql: "SELECT done FROM habit_logs WHERE habit_id = ? AND date = ? LIMIT 1",
    args: [habitId, date],
  });
  if (!cur.rows[0]) {
    await db.execute({
      sql: `INSERT INTO habit_logs (habit_id, date, done) VALUES (?, ?, 1)`,
      args: [habitId, date],
    });
    return true;
  }
  const was = Number((cur.rows[0] as any).done) === 1;
  if (was) {
    await db.execute({
      sql: "DELETE FROM habit_logs WHERE habit_id = ? AND date = ?",
      args: [habitId, date],
    });
    return false;
  }
  await db.execute({
    sql: `UPDATE habit_logs SET done = 1, updated_at = datetime('now')
          WHERE habit_id = ? AND date = ?`,
    args: [habitId, date],
  });
  return true;
}

export async function resetHabitLog(
  userId: string,
  habitId: string,
  date: string,
): Promise<void> {
  const db = await getDb();
  const own = await db.execute({
    sql: "SELECT id FROM habits WHERE id = ? AND user_id = ? LIMIT 1",
    args: [habitId, userId],
  });
  if (!own.rows[0]) throw new Error("Habit not found.");
  await db.execute({
    sql: "DELETE FROM habit_logs WHERE habit_id = ? AND date = ?",
    args: [habitId, date],
  });
}
