import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getAuthUrl } from "@/lib/google";

const STATE_COOKIE = "bujo_oauth_state";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const state = randomBytes(16).toString("hex");
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const authUrl = getAuthUrl(state, redirectUri);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
