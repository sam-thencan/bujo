// End-to-end smoke test of the bujo data layer.
// Runs against whatever DATABASE_URL is set.
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const db = createClient({
  url: process.env.DATABASE_URL || "file:./smoke.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const schema = readFileSync("src/lib/schema.sql", "utf8");
for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
  await db.execute(stmt);
}

const id = (p) => `${p}_${randomBytes(6).toString("hex")}`;
const today = new Date().toISOString().slice(0, 10);
const month = today.slice(0, 7);

function assert(cond, msg) {
  if (!cond) {
    console.error("✗", msg);
    process.exit(1);
  } else {
    console.log("✓", msg);
  }
}

// 1. signup (with default journal)
const uid = id("u");
const jid = id("j");
await db.execute({
  sql: "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
  args: [uid, "smoke@example.com", await bcrypt.hash("correcthorse", 10), "Smoke"],
});
await db.execute({ sql: "INSERT INTO settings (user_id) VALUES (?)", args: [uid] });
await db.execute({
  sql: "INSERT INTO journals (id, owner_user_id, name) VALUES (?, ?, 'My journal')",
  args: [jid, uid],
});
await db.execute({
  sql: "UPDATE users SET current_journal_id = ? WHERE id = ?",
  args: [jid, uid],
});
assert(true, "user created and settings/journal rows inserted");

// 2. verify password
const urow = (
  await db.execute({
    sql: "SELECT password_hash FROM users WHERE email = ?",
    args: ["smoke@example.com"],
  })
).rows[0];
assert(await bcrypt.compare("correcthorse", String(urow.password_hash)), "password verifies");

// 3. create three entries for today
for (const [type, content] of [
  ["task", "Call Jane"],
  ["event", "Lunch with Sam"],
  ["note", "Great idea about X"],
]) {
  await db.execute({
    sql: `INSERT INTO entries (id, user_id, journal_id, type, content, status, log_date, log_month, order_index)
          VALUES (?, ?, ?, ?, ?, 'open', ?, ?, 0)`,
    args: [id("e"), uid, jid, type, content, today, month],
  });
}
const dayRows = await db.execute({
  sql: "SELECT * FROM entries WHERE user_id = ? AND log_date = ? ORDER BY created_at",
  args: [uid, today],
});
assert(dayRows.rows.length === 3, "three entries persisted for today");
assert(
  dayRows.rows.every((r) => r.log_month === month),
  "entries carry the correct log_month",
);

// 4. toggle task done
const taskId = String(dayRows.rows.find((r) => r.type === "task").id);
await db.execute({
  sql: "UPDATE entries SET status = 'done' WHERE id = ?",
  args: [taskId],
});
const doneCheck = (
  await db.execute({ sql: "SELECT status FROM entries WHERE id = ?", args: [taskId] })
).rows[0];
assert(doneCheck.status === "done", "task toggled to done");

// 5. migrate: create a second open task, migrate it to tomorrow
const tmrwTask = id("e");
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
await db.execute({
  sql: `INSERT INTO entries (id, user_id, journal_id, type, content, status, log_date, log_month, order_index)
        VALUES (?, ?, ?, 'task', 'Follow up', 'open', ?, ?, 1)`,
  args: [tmrwTask, uid, jid, today, month],
});
const newTomorrowId = id("e");
await db.execute({
  sql: `INSERT INTO entries (id, user_id, journal_id, type, content, status, log_date, log_month, order_index, migrated_from_id)
        VALUES (?, ?, ?, 'task', 'Follow up', 'open', ?, ?, 0, ?)`,
  args: [newTomorrowId, uid, jid, tomorrow, tomorrow.slice(0, 7), tmrwTask],
});
await db.execute({
  sql: "UPDATE entries SET status = 'migrated' WHERE id = ?",
  args: [tmrwTask],
});
const origStatus = (
  await db.execute({ sql: "SELECT status FROM entries WHERE id = ?", args: [tmrwTask] })
).rows[0].status;
const newOnTmrw = (
  await db.execute({
    sql: "SELECT status, log_date FROM entries WHERE id = ?",
    args: [newTomorrowId],
  })
).rows[0];
assert(origStatus === "migrated", "original entry marked migrated");
assert(newOnTmrw.status === "open" && newOnTmrw.log_date === tomorrow, "new entry landed on tomorrow");

// 6. future log entry (no log_date)
await db.execute({
  sql: `INSERT INTO entries (id, user_id, journal_id, type, content, status, log_date, log_month, order_index)
        VALUES (?, ?, ?, 'task', 'Book venue', 'scheduled', NULL, ?, 0)`,
  args: [id("e"), uid, jid, "2099-06"],
});
const future = await db.execute({
  sql: "SELECT * FROM entries WHERE user_id = ? AND log_date IS NULL AND log_month = ?",
  args: [uid, "2099-06"],
});
assert(future.rows.length === 1, "future entry persists without a log_date");

// 7. legend toggle
await db.execute({
  sql: "UPDATE settings SET show_legend = 0 WHERE user_id = ?",
  args: [uid],
});
const s = (
  await db.execute({ sql: "SELECT show_legend FROM settings WHERE user_id = ?", args: [uid] })
).rows[0];
assert(Number(s.show_legend) === 0, "legend toggle persists");

// 8. export shape
const ents = (
  await db.execute({
    sql: "SELECT id, type, content, status, log_date, log_month FROM entries WHERE user_id = ? ORDER BY created_at",
    args: [uid],
  })
).rows;
assert(ents.length === 6, "export surfaces all 6 entries (3 today + 1 migrated-origin + 1 migrated-dest + 1 future)");
assert(
  ents.every((r) => typeof r.id === "string" && typeof r.log_month === "string"),
  "export rows have portable primitive shapes",
);

// 9. priority_rank: rank a task, then swap with another
const rankTaskA = id("e");
const rankTaskB = id("e");
await db.execute({
  sql: `INSERT INTO entries (id, user_id, journal_id, type, content, status, log_date, log_month, order_index, priority_rank)
        VALUES (?, ?, ?, 'task', 'Top A', 'open', ?, ?, 10, 1)`,
  args: [rankTaskA, uid, jid, today, month],
});
await db.execute({
  sql: `INSERT INTO entries (id, user_id, journal_id, type, content, status, log_date, log_month, order_index, priority_rank)
        VALUES (?, ?, ?, 'task', 'Top B', 'open', ?, ?, 11, 2)`,
  args: [rankTaskB, uid, jid, today, month],
});
// Promote B to rank 1; A should inherit B's old rank (2).
await db.execute({
  sql: "UPDATE entries SET priority_rank = 2 WHERE id = ?",
  args: [rankTaskA],
});
await db.execute({
  sql: "UPDATE entries SET priority_rank = 1 WHERE id = ?",
  args: [rankTaskB],
});
const ranks = await db.execute({
  sql: "SELECT id, priority_rank FROM entries WHERE id IN (?, ?) ORDER BY priority_rank",
  args: [rankTaskA, rankTaskB],
});
assert(
  Number(ranks.rows[0].priority_rank) === 1 && Number(ranks.rows[1].priority_rank) === 2,
  "priority_rank persists and swaps",
);

// 10. day summaries (upsert semantics)
await db.execute({
  sql: `INSERT INTO day_summaries (user_id, journal_id, date, summary) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, date) DO UPDATE SET summary = excluded.summary,
        updated_at = datetime('now')`,
  args: [uid, jid, today, "first"],
});
await db.execute({
  sql: `INSERT INTO day_summaries (user_id, journal_id, date, summary) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, date) DO UPDATE SET summary = excluded.summary,
        updated_at = datetime('now')`,
  args: [uid, jid, today, "second"],
});
const ds = (
  await db.execute({
    sql: "SELECT summary FROM day_summaries WHERE user_id = ? AND date = ?",
    args: [uid, today],
  })
).rows[0];
assert(String(ds.summary) === "second", "day summary upserts cleanly");

// 11. habits + logs
const hId = id("h");
await db.execute({
  sql: `INSERT INTO habits (id, user_id, journal_id, month, name, symbol, order_index)
        VALUES (?, ?, ?, ?, 'Meditate', 'M', 0)`,
  args: [hId, uid, jid, month],
});
await db.execute({
  sql: `INSERT INTO habit_logs (habit_id, date, done) VALUES (?, ?, 1)
        ON CONFLICT(habit_id, date) DO UPDATE SET done = excluded.done`,
  args: [hId, today],
});
const hl = (
  await db.execute({
    sql: "SELECT done FROM habit_logs WHERE habit_id = ? AND date = ?",
    args: [hId, today],
  })
).rows[0];
assert(Number(hl.done) === 1, "habit log records done=1");

// 12. action plan items
const apId = id("ap");
await db.execute({
  sql: `INSERT INTO action_plan_items (id, user_id, journal_id, month, category, content, done, order_index)
        VALUES (?, ?, ?, ?, 'personal', 'Plan garden', 0, 0)`,
  args: [apId, uid, jid, month],
});
const ap = (
  await db.execute({
    sql: "SELECT category, content FROM action_plan_items WHERE id = ?",
    args: [apId],
  })
).rows[0];
assert(
  String(ap.category) === "personal" && String(ap.content) === "Plan garden",
  "action plan item persists with category",
);

// 13. multi-journal isolation: a second journal's entries don't leak into the first
const jid2 = id("j");
await db.execute({
  sql: "INSERT INTO journals (id, owner_user_id, name) VALUES (?, ?, 'Work')",
  args: [jid2, uid],
});
await db.execute({
  sql: `INSERT INTO entries (id, user_id, journal_id, type, content, status, log_date, log_month, order_index)
        VALUES (?, ?, ?, 'task', 'Work-only task', 'open', ?, ?, 0)`,
  args: [id("e"), uid, jid2, today, month],
});
const inJ1 = (
  await db.execute({
    sql: "SELECT COUNT(*) AS c FROM entries WHERE journal_id = ? AND log_date = ?",
    args: [jid, today],
  })
).rows[0];
const inJ2 = (
  await db.execute({
    sql: "SELECT COUNT(*) AS c FROM entries WHERE journal_id = ? AND log_date = ?",
    args: [jid2, today],
  })
).rows[0];
assert(
  Number(inJ1.c) === 6 && Number(inJ2.c) === 1,
  "entries are isolated by journal_id (6 in journal 1, 1 in journal 2)",
);

// 14. cleanup
await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [uid] });
const remaining = await db.execute({
  sql: "SELECT COUNT(*) AS c FROM entries WHERE user_id = ?",
  args: [uid],
});
assert(Number(remaining.rows[0].c) === 0, "cascading delete removes entries");
const remHabits = await db.execute({
  sql: "SELECT COUNT(*) AS c FROM habits WHERE user_id = ?",
  args: [uid],
});
assert(Number(remHabits.rows[0].c) === 0, "cascading delete removes habits");
const remAp = await db.execute({
  sql: "SELECT COUNT(*) AS c FROM action_plan_items WHERE user_id = ?",
  args: [uid],
});
assert(Number(remAp.rows[0].c) === 0, "cascading delete removes action plan items");

console.log("\nAll smoke checks passed.");
