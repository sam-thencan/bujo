import { getDb } from "./db";
import { newId } from "./ids";

export type Journal = {
  id: string;
  owner_user_id: string;
  name: string;
  created_at: string;
};

function rowToJournal(row: Record<string, unknown>): Journal {
  return {
    id: String(row.id),
    owner_user_id: String(row.owner_user_id),
    name: String(row.name),
    created_at: String(row.created_at),
  };
}

export async function listJournals(userId: string): Promise<Journal[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT * FROM journals WHERE owner_user_id = ? ORDER BY created_at ASC`,
    args: [userId],
  });
  return res.rows.map((r) => rowToJournal(r as any));
}

export async function getJournal(
  userId: string,
  journalId: string,
): Promise<Journal | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT * FROM journals WHERE id = ? AND owner_user_id = ? LIMIT 1`,
    args: [journalId, userId],
  });
  const row = res.rows[0];
  return row ? rowToJournal(row as any) : null;
}

// Ensure the user has at least one journal. Returns the active/default one.
// Sets users.current_journal_id if it was null.
export async function ensureDefaultJournal(
  userId: string,
  name = "My journal",
): Promise<Journal> {
  const existing = await listJournals(userId);
  if (existing.length > 0) {
    const db = await getDb();
    const cur = (
      await db.execute({
        sql: "SELECT current_journal_id FROM users WHERE id = ? LIMIT 1",
        args: [userId],
      })
    ).rows[0] as any;
    if (!cur?.current_journal_id) {
      await db.execute({
        sql: "UPDATE users SET current_journal_id = ? WHERE id = ?",
        args: [existing[0].id, userId],
      });
    }
    return existing[0];
  }
  const j = await createJournal(userId, name);
  const db = await getDb();
  await db.execute({
    sql: "UPDATE users SET current_journal_id = ? WHERE id = ?",
    args: [j.id, userId],
  });
  return j;
}

export async function createJournal(
  userId: string,
  name: string,
): Promise<Journal> {
  const clean = name.trim().slice(0, 80) || "Untitled";
  const id = newId("j");
  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO journals (id, owner_user_id, name) VALUES (?, ?, ?)`,
    args: [id, userId, clean],
  });
  const j = await getJournal(userId, id);
  if (!j) throw new Error("Journal create failed");
  return j;
}

export async function renameJournal(
  userId: string,
  journalId: string,
  name: string,
): Promise<void> {
  const clean = name.trim().slice(0, 80);
  if (!clean) throw new Error("Name can't be empty.");
  const db = await getDb();
  const res = await db.execute({
    sql: `UPDATE journals SET name = ? WHERE id = ? AND owner_user_id = ?`,
    args: [clean, journalId, userId],
  });
  if (res.rowsAffected === 0) throw new Error("Journal not found.");
}

// Delete a journal (and cascade all its data). Refuses to delete the user's
// last remaining journal — they must create another first.
export async function deleteJournal(
  userId: string,
  journalId: string,
): Promise<void> {
  const all = await listJournals(userId);
  if (all.length <= 1) {
    throw new Error("Can't delete your only journal — create another first.");
  }
  const db = await getDb();
  // If it was the active one, fall back to another journal.
  const cur = (
    await db.execute({
      sql: "SELECT current_journal_id FROM users WHERE id = ? LIMIT 1",
      args: [userId],
    })
  ).rows[0] as any;
  if (cur?.current_journal_id === journalId) {
    const fallback = all.find((j) => j.id !== journalId)!;
    await db.execute({
      sql: "UPDATE users SET current_journal_id = ? WHERE id = ?",
      args: [fallback.id, userId],
    });
  }
  const res = await db.execute({
    sql: "DELETE FROM journals WHERE id = ? AND owner_user_id = ?",
    args: [journalId, userId],
  });
  if (res.rowsAffected === 0) throw new Error("Journal not found.");
}

export async function switchJournal(
  userId: string,
  journalId: string,
): Promise<void> {
  // Guard: journal must belong to the user (phase 2a/2b — sharing is later).
  const owned = await getJournal(userId, journalId);
  if (!owned) throw new Error("Journal not found.");
  const db = await getDb();
  await db.execute({
    sql: "UPDATE users SET current_journal_id = ? WHERE id = ?",
    args: [journalId, userId],
  });
}
