import { createClient, type Client } from "@libsql/client";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

let client: Client | null = null;
let initialized = false;

function makeClient(): Client {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  return createClient({ url, authToken });
}

async function runSchema(c: Client) {
  const schemaPath = path.join(process.cwd(), "src", "lib", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  // Per-statement tolerance: an index that references a column we're about
  // to add via migrate() will fail on existing DBs; we catch and continue
  // so migrate() still gets a chance to run.
  for (const stmt of statements) {
    try {
      await c.execute(stmt);
    } catch (e) {
      console.warn(
        "schema statement skipped:",
        stmt.replace(/\s+/g, " ").slice(0, 80),
        (e as Error).message,
      );
    }
  }
}

// Idempotent ALTERs for tables that may pre-date a field. SQLite doesn't
// support "ADD COLUMN IF NOT EXISTS", so we inspect PRAGMA first.
async function ensureColumn(
  c: Client,
  table: string,
  column: string,
  ddl: string,
) {
  const info = await c.execute(`PRAGMA table_info(${table})`);
  const has = info.rows.some((r) => String((r as any).name) === column);
  if (!has) await c.execute(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

async function migrate(c: Client) {
  await ensureColumn(c, "entries", "priority_rank", "priority_rank INTEGER");
  await ensureColumn(
    c,
    "entries",
    "indent",
    "indent INTEGER NOT NULL DEFAULT 0",
  );
  await ensureColumn(c, "users", "google_sub", "google_sub TEXT");
  await ensureColumn(c, "users", "onboarded_at", "onboarded_at TEXT");
  await ensureColumn(c, "users", "current_journal_id", "current_journal_id TEXT");
  await ensureColumn(c, "entries", "journal_id", "journal_id TEXT");
  await ensureColumn(c, "habits", "journal_id", "journal_id TEXT");
  await ensureColumn(c, "day_summaries", "journal_id", "journal_id TEXT");
  await ensureColumn(
    c,
    "action_plan_items",
    "journal_id",
    "journal_id TEXT",
  );
  await backfillDefaultJournals(c);
  await ensureColumn(
    c,
    "access_requests",
    "approved_journal_id",
    "approved_journal_id TEXT",
  );
  await backfillOwnerMemberships(c);
  // Indexes that reference journal_id — created here so they only run
  // after the columns definitely exist.
  for (const stmt of [
    "CREATE INDEX IF NOT EXISTS idx_entries_journal_date ON entries(journal_id, log_date)",
    "CREATE INDEX IF NOT EXISTS idx_entries_journal_month ON entries(journal_id, log_month)",
    "CREATE INDEX IF NOT EXISTS idx_entries_journal_status ON entries(journal_id, status)",
    "CREATE INDEX IF NOT EXISTS idx_day_summaries_journal ON day_summaries(journal_id, date)",
    "CREATE INDEX IF NOT EXISTS idx_habits_journal_month ON habits(journal_id, month)",
    "CREATE INDEX IF NOT EXISTS idx_plan_journal_month ON action_plan_items(journal_id, month)",
  ]) {
    try {
      await c.execute(stmt);
    } catch (e) {
      console.warn("index creation skipped:", stmt, (e as Error).message);
    }
  }
}

// For every journal, make sure the owner has an owner-role membership.
// Idempotent via UNIQUE (journal_id, user_id) + INSERT OR IGNORE.
async function backfillOwnerMemberships(c: Client) {
  const journals = (
    await c.execute("SELECT id, owner_user_id FROM journals")
  ).rows;
  for (const j of journals) {
    const journalId = String((j as any).id);
    const ownerId = String((j as any).owner_user_id);
    await c.execute({
      sql: `INSERT OR IGNORE INTO memberships (id, journal_id, user_id, role)
            VALUES (?, ?, ?, 'owner')`,
      args: [`m_${randomBytes(6).toString("hex")}`, journalId, ownerId],
    });
  }
}

// For every user without a current_journal_id, create a default journal
// and point their existing data at it. Idempotent.
async function backfillDefaultJournals(c: Client) {
  const rows = (
    await c.execute(
      "SELECT id FROM users WHERE current_journal_id IS NULL",
    )
  ).rows;
  for (const r of rows) {
    const userId = String((r as any).id);
    const journalId = `j_${randomBytes(6).toString("hex")}`;
    await c.execute({
      sql: `INSERT INTO journals (id, owner_user_id, name) VALUES (?, ?, 'My journal')`,
      args: [journalId, userId],
    });
    await c.execute({
      sql: `UPDATE users SET current_journal_id = ? WHERE id = ?`,
      args: [journalId, userId],
    });
    // Back-fill every data row owned by this user that lacks a journal.
    for (const table of [
      "entries",
      "habits",
      "day_summaries",
      "action_plan_items",
    ]) {
      await c.execute({
        sql: `UPDATE ${table} SET journal_id = ? WHERE user_id = ? AND journal_id IS NULL`,
        args: [journalId, userId],
      });
    }
  }
}

export async function getDb(): Promise<Client> {
  if (!client) client = makeClient();
  if (!initialized) {
    try {
      await runSchema(client);
      await migrate(client);
    } catch (e) {
      console.error("schema init failed", e);
    }
    initialized = true;
  }
  return client;
}
