import { getDb } from "./db";

export type UserSettings = {
  user_id: string;
  show_legend: boolean;
  theme: "light" | "dark";
};

export async function getSettings(userId: string): Promise<UserSettings> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM settings WHERE user_id = ? LIMIT 1",
    args: [userId],
  });
  const row = res.rows[0] as any;
  if (!row) {
    await db.execute({
      sql: "INSERT INTO settings (user_id) VALUES (?)",
      args: [userId],
    });
    return { user_id: userId, show_legend: true, theme: "light" };
  }
  return {
    user_id: String(row.user_id),
    show_legend: Number(row.show_legend) === 1,
    theme: (row.theme as "light" | "dark") ?? "light",
  };
}

export async function updateSettings(
  userId: string,
  patch: Partial<Pick<UserSettings, "show_legend" | "theme">>,
): Promise<UserSettings> {
  const cur = await getSettings(userId);
  const next = {
    show_legend: patch.show_legend ?? cur.show_legend,
    theme: patch.theme ?? cur.theme,
  };
  const db = await getDb();
  await db.execute({
    sql: "UPDATE settings SET show_legend = ?, theme = ? WHERE user_id = ?",
    args: [next.show_legend ? 1 : 0, next.theme, userId],
  });
  return { user_id: userId, ...next };
}
