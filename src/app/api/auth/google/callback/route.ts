import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode } from "@/lib/google";
import { createSessionCookie, findOrCreateGoogleUser } from "@/lib/auth";

const STATE_COOKIE = "bujo_oauth_state";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(error)}`,
    );
  }

  const saved = cookies().get(STATE_COOKIE)?.value;
  if (!code || !state || !saved || state !== saved) {
    return NextResponse.redirect(`${url.origin}/login?error=oauth_state`);
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;
  try {
    const profile = await exchangeCode(code, redirectUri);
    if (!profile.email_verified || !profile.email) {
      return NextResponse.redirect(
        `${url.origin}/login?error=email_unverified`,
      );
    }
    const user = await findOrCreateGoogleUser({
      sub: profile.sub,
      email: profile.email,
      name: profile.name,
    });
    await createSessionCookie(user.id);
    const next = user.onboarded_at ? "/daily" : "/onboarding";
    const response = NextResponse.redirect(`${url.origin}${next}`);
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (e) {
    console.error("google oauth callback failed", e);
    const msg = (e as Error).message || "oauth_failed";
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(msg)}`,
    );
  }
}
