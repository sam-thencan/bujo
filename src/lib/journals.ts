import { getDb } from "./db";
import { newId } from "./ids";

export type JournalRole = "owner" | "collaborator";

export type Journal = {
  id: string;
  owner_user_id: string;
  name: string;
  created_at: string;
  role: JournalRole;
};

function rowToJournal(row: Record<string, unknown>): Journal {
  return {
    id: String(row.id),
    owner_user_id: String(row.owner_user_id),
    name: String(row.name),
    created_at: String(row.created_at),
    role: (String(row.role ?? "collaborator") as JournalRole),
  };
}

// Every journal the user has a membership on — owner + collaborator both.
// Owned journals sort first, then by creation.
export async function listJournals(userId: string): Promise<Journal[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT j.*, m.role
          FROM journals j
          INNER JOIN memberships m ON m.journal_id = j.id
          WHERE m.user_id = ?
          ORDER BY (m.role = 'owner') DESC, j.created_at ASC`,
    args: [userId],
  });
  return res.rows.map((r) => rowToJournal(r as any));
}

// Fetch a journal only if the user has any membership (owner or collab).
export async function getJournal(
  userId: string,
  journalId: string,
): Promise<Journal | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT j.*, m.role
          FROM journals j
          INNER JOIN memberships m
            ON m.journal_id = j.id AND m.user_id = ?
          WHERE j.id = ?
          LIMIT 1`,
    args: [userId, journalId],
  });
  const row = res.rows[0];
  return row ? rowToJournal(row as any) : null;
}

export async function hasJournalAccess(
  userId: string,
  journalId: string,
): Promise<boolean> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT 1 FROM memberships WHERE user_id = ? AND journal_id = ? LIMIT 1",
    args: [userId, journalId],
  });
  return res.rows.length > 0;
}

// Ensure the user has at least one journal and that current_journal_id
// points to something they can still access. Returns the active journal.
export async function ensureDefaultJournal(
  userId: string,
  name = "My journal",
): Promise<Journal> {
  const existing = await listJournals(userId);
  const db = await getDb();
  const cur = (
    await db.execute({
      sql: "SELECT current_journal_id FROM users WHERE id = ? LIMIT 1",
      args: [userId],
    })
  ).rows[0] as any;
  const currentId: string | null = cur?.current_journal_id
    ? String(cur.current_journal_id)
    : null;

  // Repair: if current_journal_id points to a journal they can no longer
  // access (revoked or deleted), snap it to the first one they can.
  if (
    currentId &&
    !existing.find((j) => j.id === currentId) &&
    existing.length > 0
  ) {
    await db.execute({
      sql: "UPDATE users SET current_journal_id = ? WHERE id = ?",
      args: [existing[0].id, userId],
    });
    return existing[0];
  }

  if (existing.length > 0) {
    if (!currentId) {
      await db.execute({
        sql: "UPDATE users SET current_journal_id = ? WHERE id = ?",
        args: [existing[0].id, userId],
      });
    }
    return existing.find((j) => j.id === currentId) ?? existing[0];
  }
  const created = await createJournal(userId, name);
  await db.execute({
    sql: "UPDATE users SET current_journal_id = ? WHERE id = ?",
    args: [created.id, userId],
  });
  return created;
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
  await db.execute({
    sql: `INSERT INTO memberships (id, journal_id, user_id, role)
          VALUES (?, ?, ?, 'owner')`,
    args: [newId("m"), id, userId],
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
  // Only the owner may rename.
  const res = await db.execute({
    sql: `UPDATE journals SET name = ? WHERE id = ? AND owner_user_id = ?`,
    args: [clean, journalId, userId],
  });
  if (res.rowsAffected === 0)
    throw new Error("Journal not found or you're not the owner.");
}

// Only the owner can delete. Cascades memberships + all journal data.
export async function deleteJournal(
  userId: string,
  journalId: string,
): Promise<void> {
  const all = await listJournals(userId);
  const owned = all.filter((j) => j.role === "owner");
  if (owned.length <= 1) {
    throw new Error("Can't delete your only journal — create another first.");
  }
  const target = owned.find((j) => j.id === journalId);
  if (!target) {
    throw new Error("Only the owner can delete this journal.");
  }
  const db = await getDb();
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
  const access = await hasJournalAccess(userId, journalId);
  if (!access) throw new Error("Journal not found.");
  const db = await getDb();
  await db.execute({
    sql: "UPDATE users SET current_journal_id = ? WHERE id = ?",
    args: [journalId, userId],
  });
}
