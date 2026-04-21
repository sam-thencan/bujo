"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { markOnboarded, requireUser } from "@/lib/auth";
import { newId } from "@/lib/ids";

export type OnboardingState = { error?: string } | undefined;

export async function chooseOwnJournalAction(): Promise<void> {
  const user = await requireUser();
  await markOnboarded(user.id);
  redirect("/daily");
}

const accessSchema = z.object({
  email: z.string().email(),
  message: z.string().max(500).optional(),
});

export async function requestAccessAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();
  const parsed = accessSchema.safeParse({
    email: formData.get("email"),
    message: (formData.get("message") as string) || undefined,
  });
  if (!parsed.success) {
    return { error: "Enter a valid email." };
  }
  const target = parsed.data.email.toLowerCase();
  if (target === user.email.toLowerCase()) {
    return { error: "That's your own email — pick \"Own journal\" instead." };
  }
  const db = await getDb();
  // De-dupe: if an active pending request already exists, don't create another.
  const existing = await db.execute({
    sql: `SELECT id FROM access_requests
          WHERE requester_user_id = ? AND target_email = ? AND status = 'pending'
          LIMIT 1`,
    args: [user.id, target],
  });
  if (!existing.rows[0]) {
    await db.execute({
      sql: `INSERT INTO access_requests
            (id, requester_user_id, target_email, status, message)
            VALUES (?, ?, ?, 'pending', ?)`,
      args: [newId("ar"), user.id, target, parsed.data.message ?? null],
    });
  }
  await markOnboarded(user.id);
  redirect(`/onboarding/pending?email=${encodeURIComponent(target)}`);
}
