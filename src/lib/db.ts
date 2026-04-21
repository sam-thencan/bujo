import { createClient, type Client } from "@libsql/client";
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
  for (const stmt of statements) await c.execute(stmt);
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
