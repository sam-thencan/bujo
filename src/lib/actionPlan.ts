import { getDb } from "./db";
import { newId } from "./ids";

export type PlanCategory = "personal" | "work";
export const PLAN_CATEGORIES: PlanCategory[] = ["personal", "work"];

export type PlanItem = {
  id: string;
  month: string;
  category: PlanCategory;
  content: string;
  done: boolean;
  order_index: number;
};

function rowToItem(row: any): PlanItem {
  const cat =
    PLAN_CATEGORIES.find((c) => c === row.category) ?? "personal";
  return {
    id: String(row.id),
    month: String(row.month),
    category: cat,
    content: String(row.content),
    done: Number(row.done) === 1,
    order_index: Number(row.order_index ?? 0),
  };
}

export async function listPlan(
  journalId: string,
  month: string,
): Promise<PlanItem[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT * FROM action_plan_items
          WHERE journal_id = ? AND month = ?
          ORDER BY category ASC, done ASC, order_index ASC, created_at ASC`,
    args: [journalId, month],
  });
  return res.rows.map(rowToItem);
}

export async function createPlanItem(
  userId: string,
  journalId: string,
  month: string,
  category: PlanCategory,
  content: string,
): Promise<PlanItem> {
  const db = await getDb();
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Entry is empty.");
  const id = newId("p");
  const maxOrder = await db.execute({
    sql: `SELECT COALESCE(MAX(order_index), 0) AS m
          FROM action_plan_items
          WHERE journal_id = ? AND month = ? AND category = ?`,
    args: [journalId, month, category],
  });
  const nextOrder = Number((maxOrder.rows[0] as any).m ?? 0) + 1;
  await db.execute({
    sql: `INSERT INTO action_plan_items
          (id, user_id, journal_id, month, category, content, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, userId, journalId, month, category, trimmed, nextOrder],
  });
  return {
    id,
    month,
    category,
    content: trimmed,
    done: false,
    order_index: nextOrder,
  };
}

export async function togglePlanItem(
  userId: string,
  id: string,
): Promise<void> {
  const db = await getDb();
  const cur = await db.execute({
    sql: "SELECT done FROM action_plan_items WHERE id = ? AND user_id = ? LIMIT 1",
    args: [id, userId],
  });
  if (!cur.rows[0]) throw new Error("Not found.");
  const next = Number((cur.rows[0] as any).done) === 1 ? 0 : 1;
  await db.execute({
    sql: "UPDATE action_plan_items SET done = ? WHERE id = ? AND user_id = ?",
    args: [next, id, userId],
  });
}

export async function editPlanItem(
  userId: string,
  id: string,
  content: string,
): Promise<void> {
  const db = await getDb();
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Entry is empty.");
  await db.execute({
    sql: "UPDATE action_plan_items SET content = ? WHERE id = ? AND user_id = ?",
    args: [trimmed, id, userId],
  });
}

export async function deletePlanItem(
  userId: string,
  id: string,
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM action_plan_items WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
}
