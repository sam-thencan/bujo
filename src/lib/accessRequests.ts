import { getDb } from "./db";
import { newId } from "./ids";

export type AccessRequestStatus = "pending" | "approved" | "denied";

export type AccessRequest = {
  id: string;
  requester_user_id: string;
  requester_email: string;
  requester_name: string | null;
  target_email: string;
  status: AccessRequestStatus;
  message: string | null;
  approved_journal_id: string | null;
  approved_journal_name: string | null;
  created_at: string;
  resolved_at: string | null;
};

function rowToRequest(row: any): AccessRequest {
  return {
    id: String(row.id),
    requester_user_id: String(row.requester_user_id),
    requester_email: String(row.requester_email),
    requester_name: row.requester_name == null ? null : String(row.requester_name),
    target_email: String(row.target_email),
    status: String(row.status) as AccessRequestStatus,
    message: row.message == null ? null : String(row.message),
    approved_journal_id:
      row.approved_journal_id == null ? null : String(row.approved_journal_id),
    approved_journal_name:
      row.approved_journal_name == null
        ? null
        : String(row.approved_journal_name),
    created_at: String(row.created_at),
    resolved_at: row.resolved_at == null ? null : String(row.resolved_at),
  };
}

// Pending requests TO this email address (requests someone made for me to approve).
export async function listIncomingRequests(
  email: string,
): Promise<AccessRequest[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT ar.*, u.email AS requester_email, u.name AS requester_name,
                 j.name AS approved_journal_name
          FROM access_requests ar
          JOIN users u ON u.id = ar.requester_user_id
          LEFT JOIN journals j ON j.id = ar.approved_journal_id
          WHERE ar.target_email = ? AND ar.status = 'pending'
          ORDER BY ar.created_at DESC`,
    args: [email.toLowerCase()],
  });
  return res.rows.map(rowToRequest);
}

// Requests I made, any status.
export async function listOutgoingRequests(
  userId: string,
): Promise<AccessRequest[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT ar.*, u.email AS requester_email, u.name AS requester_name,
                 j.name AS approved_journal_name
          FROM access_requests ar
          JOIN users u ON u.id = ar.requester_user_id
          LEFT JOIN journals j ON j.id = ar.approved_journal_id
          WHERE ar.requester_user_id = ?
          ORDER BY ar.created_at DESC`,
    args: [userId],
  });
  return res.rows.map(rowToRequest);
}

export async function approveRequest(
  ownerId: string,
  ownerEmail: string,
  requestId: string,
  journalId: string,
): Promise<void> {
  const db = await getDb();
  // The request has to target this owner's email.
  const reqRow = (
    await db.execute({
      sql: `SELECT id, requester_user_id, status FROM access_requests
            WHERE id = ? AND target_email = ? LIMIT 1`,
      args: [requestId, ownerEmail.toLowerCase()],
    })
  ).rows[0];
  if (!reqRow) throw new Error("Request not found.");
  if (String((reqRow as any).status) !== "pending") {
    throw new Error("Request already resolved.");
  }
  // Owner must own the target journal.
  const jRow = (
    await db.execute({
      sql: "SELECT id FROM journals WHERE id = ? AND owner_user_id = ? LIMIT 1",
      args: [journalId, ownerId],
    })
  ).rows[0];
  if (!jRow) throw new Error("You don't own that journal.");

  const requesterId = String((reqRow as any).requester_user_id);

  // Grant membership (idempotent).
  await db.execute({
    sql: `INSERT OR IGNORE INTO memberships (id, journal_id, user_id, role)
          VALUES (?, ?, ?, 'collaborator')`,
    args: [newId("m"), journalId, requesterId],
  });
  await db.execute({
    sql: `UPDATE access_requests
          SET status = 'approved', approved_journal_id = ?, resolved_at = datetime('now')
          WHERE id = ?`,
    args: [journalId, requestId],
  });
}

export async function denyRequest(
  ownerEmail: string,
  requestId: string,
): Promise<void> {
  const db = await getDb();
  const res = await db.execute({
    sql: `UPDATE access_requests
          SET status = 'denied', resolved_at = datetime('now')
          WHERE id = ? AND target_email = ? AND status = 'pending'`,
    args: [requestId, ownerEmail.toLowerCase()],
  });
  if (res.rowsAffected === 0)
    throw new Error("Request not found or already resolved.");
}
