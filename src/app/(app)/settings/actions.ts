"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  createJournal,
  deleteJournal,
  renameJournal,
  switchJournal,
} from "@/lib/journals";
import { approveRequest, denyRequest } from "@/lib/accessRequests";
import { revokeMember } from "@/lib/memberships";

const journalIdSchema = z.string().min(1);
const nameSchema = z.string().trim().min(1).max(80);

function revalidateAll() {
  revalidatePath("/daily");
  revalidatePath("/daily/reflect");
  revalidatePath("/monthly");
  revalidatePath("/monthly/plan");
  revalidatePath("/monthly/habits");
  revalidatePath("/future");
  revalidatePath("/settings");
}

export async function createJournalAction(formData: FormData) {
  const user = await requireUser();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: "Enter a name." };
  const j = await createJournal(user.id, parsed.data);
  await switchJournal(user.id, j.id);
  revalidateAll();
  return { ok: true };
}

export async function switchJournalAction(journalId: string) {
  const user = await requireUser();
  const ok = journalIdSchema.safeParse(journalId);
  if (!ok.success) return { error: "Invalid journal." };
  try {
    await switchJournal(user.id, ok.data);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateAll();
  return { ok: true };
}

export async function renameJournalAction(input: {
  id: string;
  name: string;
}) {
  const user = await requireUser();
  const id = journalIdSchema.safeParse(input.id);
  const name = nameSchema.safeParse(input.name);
  if (!id.success || !name.success) return { error: "Invalid input." };
  try {
    await renameJournal(user.id, id.data, name.data);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateAll();
  return { ok: true };
}

export async function deleteJournalAction(journalId: string) {
  const user = await requireUser();
  const ok = journalIdSchema.safeParse(journalId);
  if (!ok.success) return { error: "Invalid journal." };
  try {
    await deleteJournal(user.id, ok.data);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateAll();
  return { ok: true };
}

export async function approveRequestAction(input: {
  requestId: string;
  journalId: string;
}) {
  const user = await requireUser();
  try {
    await approveRequest(user.id, user.email, input.requestId, input.journalId);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateAll();
  return { ok: true };
}

export async function denyRequestAction(requestId: string) {
  const user = await requireUser();
  try {
    await denyRequest(user.email, requestId);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateAll();
  return { ok: true };
}

export async function revokeMemberAction(input: {
  journalId: string;
  memberUserId: string;
}) {
  const user = await requireUser();
  try {
    await revokeMember(user.id, input.journalId, input.memberUserId);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateAll();
  return { ok: true };
}
