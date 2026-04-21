import { getDb } from "./db";
import type { JournalRole } from "./journals";

export type Member = {
  user_id: string;
  email: string;
  name: string | null;
  role: JournalRole;
  created_at: string;
};

function rowToMember(row: any): Member {
  return {
    user_id: String(row.user_id),
    email: String(row.email),
    name: row.name == null ? null : String(row.name),
    role: String(row.role) as JournalRole,
    created_at: String(row.created_at),
  };
}

// Members on a journal. Only the owner can see the full member list.
export async function listMembers(
  ownerId: string,
  journalId: string,
): Promise<Member[]> {
  const db = await getDb();
  const own = await db.execute({
    sql: "SELECT id FROM journals WHERE id = ? AND owner_user_id = ? LIMIT 1",
    args: [journalId, ownerId],
  });
  if (!own.rows[0]) throw new Error("You don't own that journal.");
  const res = await db.execute({
    sql: `SELECT m.user_id, u.email, u.name, m.role, m.created_at
          FROM memberships m
          JOIN users u ON u.id = m.user_id
          WHERE m.journal_id = ?
          ORDER BY (m.role = 'owner') DESC, m.created_at ASC`,
    args: [journalId],
  });
  return res.rows.map(rowToMember);
}

// Revoke a collaborator. Refuses to remove the owner.
export async function revokeMember(
  ownerId: string,
  journalId: string,
  memberUserId: string,
): Promise<void> {
  const db = await getDb();
  const own = await db.execute({
    sql: "SELECT id FROM journals WHERE id = ? AND owner_user_id = ? LIMIT 1",
    args: [journalId, ownerId],
  });
  if (!own.rows[0]) throw new Error("You don't own that journal.");
  if (memberUserId === ownerId) {
    throw new Error("Owner can't revoke themselves.");
  }
  const res = await db.execute({
    sql: `DELETE FROM memberships
          WHERE journal_id = ? AND user_id = ? AND role != 'owner'`,
    args: [journalId, memberUserId],
  });
  if (res.rowsAffected === 0) throw new Error("Member not found.");
  // If the revoked user had this journal as their active one, the
  // ensureDefaultJournal guard will repair on their next request.
}
