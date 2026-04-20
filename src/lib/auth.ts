import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { newId } from "./ids";

const COOKIE = "bujo_session";
const ALG = "HS256";

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to a random string of at least 32 characters.",
    );
  }
  return new TextEncoder().encode(s);
}

export type SessionUser = { id: string; email: string; name: string | null };

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function createSessionCookie(userId: string): Promise<void> {
  const jwt = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
  cookies().set(COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  cookies().delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.sub;
    if (!userId) return null;
    const db = await getDb();
    const res = await db.execute({
      sql: "SELECT id, email, name FROM users WHERE id = ? LIMIT 1",
      args: [userId],
    });
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      email: String(row.email),
      name: row.name == null ? null : String(row.name),
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function signup(
  email: string,
  password: string,
  name?: string,
): Promise<SessionUser> {
  const db = await getDb();
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
    args: [email.toLowerCase()],
  });
  if (existing.rows[0]) throw new Error("Email already registered.");
  const id = newId("u");
  const hash = await hashPassword(password);
  await db.execute({
    sql: "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
    args: [id, email.toLowerCase(), hash, name ?? null],
  });
  await db.execute({
    sql: "INSERT INTO settings (user_id) VALUES (?)",
    args: [id],
  });
  return { id, email: email.toLowerCase(), name: name ?? null };
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT id, email, password_hash, name FROM users WHERE email = ? LIMIT 1",
    args: [email.toLowerCase()],
  });
  const row = res.rows[0];
  if (!row) throw new Error("Invalid email or password.");
  const ok = await verifyPassword(password, String(row.password_hash));
  if (!ok) throw new Error("Invalid email or password.");
  return {
    id: String(row.id),
    email: String(row.email),
    name: row.name == null ? null : String(row.name),
  };
}
