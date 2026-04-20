import { getDb } from "./db";
import { newId } from "./ids";
import { monthOf, thisMonth } from "./dates";

export type EntryType = "task" | "note" | "event" | "mood";
export type EntryStatus =
  | "open"
  | "done"
  | "migrated"
  | "scheduled"
  | "cancelled";

export const ENTRY_TYPES: EntryType[] = ["task", "note", "event", "mood"];
export const ENTRY_STATUSES: EntryStatus[] = [
  "open",
  "done",
  "migrated",
  "scheduled",
  "cancelled",
];

export type Entry = {
  id: string;
  user_id: string;
  type: EntryType;
  content: string;
  status: EntryStatus;
  priority: number;
  priority_rank: number | null;
  log_date: string | null;
  log_month: string;
  order_index: number;
  migrated_from_id: string | null;
  created_at: string;
  updated_at: string;
};

function rowToEntry(row: Record<string, unknown>): Entry {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    type: row.type as EntryType,
    content: String(row.content),
    status: row.status as EntryStatus,
    priority: Number(row.priority ?? 0),
    priority_rank:
      row.priority_rank == null ? null : Number(row.priority_rank),
    log_date: row.log_date == null ? null : String(row.log_date),
    log_month: String(row.log_month),
    order_index: Number(row.order_index ?? 0),
    migrated_from_id:
      row.migrated_from_id == null ? null : String(row.migrated_from_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listForDay(userId: string, date: string): Promise<Entry[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT * FROM entries
          WHERE user_id = ? AND log_date = ?
          ORDER BY
            (priority_rank IS NULL) ASC,
            priority_rank ASC,
            order_index ASC,
            created_at ASC`,
    args: [userId, date],
  });
  return res.rows.map(rowToEntry);
}

export async function listForMonth(
  userId: string,
  month: string,
  opts: { onlyMonthly?: boolean } = {},
): Promise<Entry[]> {
  const db = await getDb();
  const sql = opts.onlyMonthly
    ? `SELECT * FROM entries
       WHERE user_id = ? AND log_month = ? AND log_date IS NULL
       ORDER BY order_index ASC, created_at ASC`
    : `SELECT * FROM entries
       WHERE user_id = ? AND log_month = ?
       ORDER BY (log_date IS NULL) DESC, log_date ASC, order_index ASC, created_at ASC`;
  const res = await db.execute({ sql, args: [userId, month] });
  return res.rows.map(rowToEntry);
}

export async function listFuture(
  userId: string,
  month: string,
): Promise<Entry[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT * FROM entries
          WHERE user_id = ? AND log_month = ? AND log_date IS NULL
          ORDER BY order_index ASC, created_at ASC`,
    args: [userId, month],
  });
  return res.rows.map(rowToEntry);
}

export async function getEntry(
  userId: string,
  id: string,
): Promise<Entry | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM entries WHERE id = ? AND user_id = ? LIMIT 1",
    args: [id, userId],
  });
  const row = res.rows[0];
  return row ? rowToEntry(row as any) : null;
}

export async function createEntry(
  userId: string,
  input: {
    type: EntryType;
    content: string;
    priority?: number;
    log_date?: string | null;
    log_month?: string;
    migrated_from_id?: string | null;
    status?: EntryStatus;
  },
): Promise<Entry> {
  const db = await getDb();
  const id = newId("e");
  const log_date = input.log_date ?? null;
  const log_month = input.log_month ?? (log_date ? monthOf(log_date) : thisMonth());
  const status =
    input.status ??
    (input.type === "task" ? (log_date ? "open" : "scheduled") : "open");

  const maxOrder = await db.execute({
    sql: `SELECT COALESCE(MAX(order_index), 0) AS m FROM entries
          WHERE user_id = ? AND
          (log_date IS ? OR log_date = ?) AND log_month = ?`,
    args: [userId, log_date, log_date ?? "", log_month],
  });
  const nextOrder = Number((maxOrder.rows[0] as any).m ?? 0) + 1;

  await db.execute({
    sql: `INSERT INTO entries
          (id, user_id, type, content, status, priority,
           log_date, log_month, order_index, migrated_from_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      userId,
      input.type,
      input.content,
      status,
      input.priority ?? 0,
      log_date,
      log_month,
      nextOrder,
      input.migrated_from_id ?? null,
    ],
  });
  const created = await getEntry(userId, id);
  if (!created) throw new Error("Entry create failed");
  return created;
}

export async function updateEntry(
  userId: string,
  id: string,
  patch: Partial<
    Pick<
      Entry,
      | "content"
      | "status"
      | "priority"
      | "priority_rank"
      | "log_date"
      | "log_month"
      | "type"
    >
  >,
): Promise<Entry> {
  const db = await getDb();
  const cur = await getEntry(userId, id);
  if (!cur) throw new Error("Not found");
  const next = {
    content: patch.content ?? cur.content,
    status: patch.status ?? cur.status,
    priority: patch.priority ?? cur.priority,
    priority_rank:
      patch.priority_rank === undefined ? cur.priority_rank : patch.priority_rank,
    log_date: patch.log_date === undefined ? cur.log_date : patch.log_date,
    log_month:
      patch.log_month ??
      (patch.log_date ? monthOf(patch.log_date) : cur.log_month),
    type: patch.type ?? cur.type,
  };
  await db.execute({
    sql: `UPDATE entries
          SET content = ?, status = ?, priority = ?, priority_rank = ?,
              log_date = ?, log_month = ?, type = ?, updated_at = datetime('now')
          WHERE id = ? AND user_id = ?`,
    args: [
      next.content,
      next.status,
      next.priority,
      next.priority_rank,
      next.log_date,
      next.log_month,
      next.type,
      id,
      userId,
    ],
  });
  const updated = await getEntry(userId, id);
  if (!updated) throw new Error("Update failed");
  return updated;
}

export async function deleteEntry(userId: string, id: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM entries WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
}

export async function toggleDone(userId: string, id: string): Promise<Entry> {
  const cur = await getEntry(userId, id);
  if (!cur) throw new Error("Not found");
  if (cur.type !== "task") return cur;
  const nextStatus: EntryStatus = cur.status === "done" ? "open" : "done";
  return updateEntry(userId, id, { status: nextStatus });
}

// Set a task's priority_rank (1..3). Pass null to clear. If another task in
// the same day holds that rank, swap it with the old rank of this entry.
export async function setPriorityRank(
  userId: string,
  id: string,
  rank: number | null,
): Promise<void> {
  const db = await getDb();
  const cur = await getEntry(userId, id);
  if (!cur) throw new Error("Not found");
  if (cur.type !== "task") return;
  if (!cur.log_date) return;
  if (rank !== null && (rank < 1 || rank > 3)) throw new Error("Invalid rank");
  const oldRank = cur.priority_rank;

  if (rank !== null) {
    // Whoever currently holds `rank` gets this entry's old rank (possibly null).
    const other = await db.execute({
      sql: `SELECT id FROM entries
            WHERE user_id = ? AND log_date = ?
            AND type = 'task' AND priority_rank = ? AND id != ?`,
      args: [userId, cur.log_date, rank, id],
    });
    const otherId = other.rows[0] ? String((other.rows[0] as any).id) : null;
    if (otherId) {
      await db.execute({
        sql: `UPDATE entries SET priority_rank = ?, updated_at = datetime('now')
              WHERE id = ? AND user_id = ?`,
        args: [oldRank, otherId, userId],
      });
    }
  }
  await db.execute({
    sql: `UPDATE entries SET priority_rank = ?, updated_at = datetime('now')
          WHERE id = ? AND user_id = ?`,
    args: [rank, id, userId],
  });
}

export async function migrateEntry(
  userId: string,
  id: string,
  dest: { log_date?: string | null; log_month?: string },
): Promise<Entry> {
  const cur = await getEntry(userId, id);
  if (!cur) throw new Error("Not found");
  const log_date = dest.log_date ?? null;
  const log_month =
    dest.log_month ?? (log_date ? monthOf(log_date) : thisMonth());
  const isFuture = !log_date;
  const newEntry = await createEntry(userId, {
    type: cur.type,
    content: cur.content,
    priority: cur.priority,
    log_date,
    log_month,
    migrated_from_id: cur.id,
    status: isFuture ? "scheduled" : "open",
  });
  await updateEntry(userId, id, {
    status: isFuture ? "scheduled" : "migrated",
    priority_rank: null,
  });
  return newEntry;
}

export async function bulkMigrateOpen(
  userId: string,
  opts: { fromDate?: string; fromMonth?: string; toDate?: string | null; toMonth?: string },
): Promise<number> {
  const db = await getDb();
  let rows: any[] = [];
  if (opts.fromDate) {
    const res = await db.execute({
      sql: `SELECT * FROM entries
            WHERE user_id = ? AND log_date = ? AND type = 'task' AND status = 'open'`,
      args: [userId, opts.fromDate],
    });
    rows = res.rows;
  } else if (opts.fromMonth) {
    const res = await db.execute({
      sql: `SELECT * FROM entries
            WHERE user_id = ? AND log_month = ? AND type = 'task' AND status = 'open'`,
      args: [userId, opts.fromMonth],
    });
    rows = res.rows;
  }
  let count = 0;
  for (const r of rows) {
    await migrateEntry(userId, String(r.id), {
      log_date: opts.toDate ?? null,
      log_month: opts.toMonth,
    });
    count++;
  }
  return count;
}

export async function exportAll(userId: string): Promise<{
  user: { id: string; email: string; name: string | null };
  entries: Entry[];
  day_summaries: Array<{ date: string; summary: string }>;
  habits: Array<{
    id: string;
    month: string;
    name: string;
    symbol: string;
    archived: boolean;
  }>;
  habit_logs: Array<{ habit_id: string; date: string; done: boolean }>;
  action_plan: Array<{
    id: string;
    month: string;
    category: string;
    content: string;
    done: boolean;
  }>;
  settings: Record<string, unknown> | null;
  exported_at: string;
}> {
  const db = await getDb();
  const [u, e, s, ds, h, hl, ap] = await Promise.all([
    db.execute({
      sql: "SELECT id, email, name FROM users WHERE id = ? LIMIT 1",
      args: [userId],
    }),
    db.execute({
      sql: "SELECT * FROM entries WHERE user_id = ? ORDER BY created_at ASC",
      args: [userId],
    }),
    db.execute({
      sql: "SELECT * FROM settings WHERE user_id = ? LIMIT 1",
      args: [userId],
    }),
    db.execute({
      sql: "SELECT date, summary FROM day_summaries WHERE user_id = ? ORDER BY date",
      args: [userId],
    }),
    db.execute({
      sql: "SELECT id, month, name, symbol, archived FROM habits WHERE user_id = ? ORDER BY month, order_index",
      args: [userId],
    }),
    db.execute({
      sql: `SELECT hl.habit_id, hl.date, hl.done
            FROM habit_logs hl
            JOIN habits h ON h.id = hl.habit_id
            WHERE h.user_id = ? ORDER BY hl.date`,
      args: [userId],
    }),
    db.execute({
      sql: "SELECT id, month, category, content, done FROM action_plan_items WHERE user_id = ? ORDER BY month, order_index",
      args: [userId],
    }),
  ]);
  const user = u.rows[0] as any;
  return {
    user: {
      id: String(user.id),
      email: String(user.email),
      name: user.name == null ? null : String(user.name),
    },
    entries: e.rows.map((r) => rowToEntry(r as any)),
    day_summaries: ds.rows.map((r: any) => ({
      date: String(r.date),
      summary: String(r.summary),
    })),
    habits: h.rows.map((r: any) => ({
      id: String(r.id),
      month: String(r.month),
      name: String(r.name),
      symbol: String(r.symbol),
      archived: Number(r.archived) === 1,
    })),
    habit_logs: hl.rows.map((r: any) => ({
      habit_id: String(r.habit_id),
      date: String(r.date),
      done: Number(r.done) === 1,
    })),
    action_plan: ap.rows.map((r: any) => ({
      id: String(r.id),
      month: String(r.month),
      category: String(r.category),
      content: String(r.content),
      done: Number(r.done) === 1,
    })),
    settings: (s.rows[0] as any) ?? null,
    exported_at: new Date().toISOString(),
  };
}
