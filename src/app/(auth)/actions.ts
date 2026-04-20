"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearSessionCookie,
  createSessionCookie,
  login,
  signup,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().max(80).optional(),
});

export type AuthState = { error?: string } | undefined;

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };
  try {
    const user = await login(parsed.data.email, parsed.data.password);
    await createSessionCookie(user.id);
  } catch (e) {
    return { error: (e as Error).message || "Login failed." };
  }
  redirect("/daily");
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if ((process.env.SIGNUPS ?? "open") !== "open") {
    return { error: "Sign-ups are currently disabled." };
  }
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: (formData.get("name") as string) || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const user = await signup(
      parsed.data.email,
      parsed.data.password,
      parsed.data.name,
    );
    await createSessionCookie(user.id);
  } catch (e) {
    return { error: (e as Error).message || "Sign up failed." };
  }
  redirect("/daily");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
