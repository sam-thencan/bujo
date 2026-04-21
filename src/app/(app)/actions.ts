"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  bulkMigrateOpen,
  createEntry,
  deleteEntry,
  listForDay,
  migrateEntry,
  reorderEntries,
  setPriorityRank,
  toggleDone,
  updateEntry,
  type EntryType,
} from "@/lib/entries";
import { parseInput } from "@/lib/parse";
import { updateSettings } from "@/lib/settings";
import { monthOf } from "@/lib/dates";
import { setDaySummary } from "@/lib/daySummaries";
import {
  createHabit,
  deleteHabit,
  renameHabit,
  resetHabitLog,
  toggleHabitLog,
  carryForwardHabits,
} from "@/lib/habits";
import {
  createPlanItem,
  deletePlanItem,
  editPlanItem,
  togglePlanItem,
  type PlanCategory,
} from "@/lib/actionPlan";

const typeSchema = z.enum(["task", "note", "event", "mood"]);
const planCategorySchema = z.enum(["personal", "work"]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

// ---------- Entries ----------

export async function createEntryAction(input: {
  raw: string;
  type?: EntryType;
  log_date?: string | null;
  log_month?: string;
}) {
  const user = await requireUser();
  const raw = (input.raw ?? "").trim();
  if (!raw) return { error: "Empty entry." };
  const parsed = parseInput(raw, input.type ?? "task");
  if (!parsed.content) return { error: "Empty entry." };
  const log_date = input.log_date ?? null;
  const log_month =
    input.log_month ?? (log_date ? monthOf(log_date) : undefined);
  const created = await createEntry(user.id, {
    type: parsed.type,
    content: parsed.content,
    priority: parsed.priority,
    log_date,
    log_month,
  });

  // Auto-rank: first 3 open tasks for a day get Top 1/2/3 automatically.
  if (created.type === "task" && log_date) {
    const dayEntries = await listForDay(user.id, log_date);
    const taken = new Set(
      dayEntries
        .filter(
          (e) =>
            e.type === "task" &&
            e.priority_rank != null &&
            e.status !== "migrated" &&
            e.id !== created.id,
        )
        .map((e) => e.priority_rank),
    );
    const nextRank = [1, 2, 3].find((r) => !taken.has(r));
    if (nextRank !== undefined) {
      await setPriorityRank(user.id, created.id, nextRank);
    }
  }

  revalidateViews(log_date ? "daily" : log_month ? "future" : "daily");
  return { ok: true };
}

export async function toggleDoneAction(id: string) {
  const user = await requireUser();
  const entry = await toggleDone(user.id, id);
  revalidateViews(entry.log_date ? "daily" : "monthly");
}

export async function setPriorityRankAction(id: string, rank: number | null) {
  const user = await requireUser();
  await setPriorityRank(user.id, id, rank);
  revalidateViews("daily");
}

export async function cancelEntryAction(id: string) {
  const user = await requireUser();
  await updateEntry(user.id, id, { status: "cancelled" });
  revalidateViews("daily");
}

export async function deleteEntryAction(id: string) {
  const user = await requireUser();
  await deleteEntry(user.id, id);
  revalidateViews("all");
}

export async function reorderEntriesAction(input: {
  ids: string[];
  scope?: "daily" | "monthly" | "future";
}) {
  const user = await requireUser();
  await reorderEntries(user.id, input.ids);
  revalidateViews(input.scope ?? "daily");
  return { ok: true };
}

export async function editEntryAction(input: {
  id: string;
  content: string;
  type?: EntryType;
}) {
  const user = await requireUser();
  const content = (input.content ?? "").trim();
  if (!content) return { error: "Empty entry." };
  const patch: {
    content: string;
    type?: EntryType;
    priority_rank?: number | null;
  } = { content };
  if (input.type) {
    const t = typeSchema.safeParse(input.type);
    if (t.success) {
      patch.type = t.data;
      // Non-task entries cannot hold a Top 3 rank.
      if (t.data !== "task") patch.priority_rank = null;
    }
  }
  await updateEntry(user.id, input.id, patch);
  revalidateViews("daily");
  return { ok: true };
}

export async function migrateEntryAction(input: {
  id: string;
  log_date?: string | null;
  log_month?: string;
}) {
  const user = await requireUser();
  if (input.log_date && !dateSchema.safeParse(input.log_date).success)
    return { error: "Invalid date." };
  if (input.log_month && !monthSchema.safeParse(input.log_month).success)
    return { error: "Invalid month." };
  await migrateEntry(user.id, input.id, {
    log_date: input.log_date ?? null,
    log_month: input.log_month,
  });
  revalidateViews();
  return { ok: true };
}

export async function bulkMigrateAction(input: {
  fromDate?: string;
  fromMonth?: string;
  toDate?: string | null;
  toMonth?: string;
}) {
  const user = await requireUser();
  const n = await bulkMigrateOpen(user.id, input);
  revalidateViews();
  return { ok: true, count: n };
}

export async function scheduleIntoMonthAction(input: {
  id: string;
  log_date: string;
}) {
  const user = await requireUser();
  if (!dateSchema.safeParse(input.log_date).success)
    return { error: "Invalid date." };
  await migrateEntry(user.id, input.id, {
    log_date: input.log_date,
    log_month: monthOf(input.log_date),
  });
  revalidateViews();
  return { ok: true };
}

// ---------- Settings ----------

export async function toggleLegendAction(value: boolean) {
  const user = await requireUser();
  await updateSettings(user.id, { show_legend: value });
  revalidateViews();
}

// ---------- Day summaries ----------

export async function saveDaySummaryAction(input: {
  date: string;
  summary: string;
}) {
  const user = await requireUser();
  if (!dateSchema.safeParse(input.date).success)
    return { error: "Invalid date." };
  await setDaySummary(user.id, input.date, input.summary);
  revalidateViews();
  return { ok: true };
}

// ---------- Habits ----------

export async function createHabitAction(input: {
  month: string;
  name: string;
  symbol?: string;
}) {
  const user = await requireUser();
  if (!monthSchema.safeParse(input.month).success)
    return { error: "Invalid month." };
  try {
    await createHabit(user.id, input.month, input.name, input.symbol);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateViews();
  return { ok: true };
}

export async function renameHabitAction(input: {
  id: string;
  name: string;
  symbol?: string;
}) {
  const user = await requireUser();
  try {
    await renameHabit(user.id, input.id, input.name, input.symbol);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateViews();
  return { ok: true };
}

export async function deleteHabitAction(id: string) {
  const user = await requireUser();
  await deleteHabit(user.id, id);
  revalidateViews();
}

export async function toggleHabitLogAction(input: {
  habitId: string;
  date: string;
}) {
  const user = await requireUser();
  if (!dateSchema.safeParse(input.date).success)
    return { error: "Invalid date." };
  await toggleHabitLog(user.id, input.habitId, input.date);
  revalidateViews();
  return { ok: true };
}

export async function resetHabitLogAction(input: {
  habitId: string;
  date: string;
}) {
  const user = await requireUser();
  if (!dateSchema.safeParse(input.date).success)
    return { error: "Invalid date." };
  await resetHabitLog(user.id, input.habitId, input.date);
  revalidateViews();
  return { ok: true };
}

export async function carryForwardHabitsAction(input: {
  fromMonth: string;
  toMonth: string;
}) {
  const user = await requireUser();
  if (
    !monthSchema.safeParse(input.fromMonth).success ||
    !monthSchema.safeParse(input.toMonth).success
  )
    return { error: "Invalid month." };
  const n = await carryForwardHabits(user.id, input.fromMonth, input.toMonth);
  revalidateViews();
  return { ok: true, count: n };
}

// ---------- Action plan ----------

export async function createPlanItemAction(input: {
  month: string;
  category: PlanCategory;
  content: string;
}) {
  const user = await requireUser();
  if (!monthSchema.safeParse(input.month).success)
    return { error: "Invalid month." };
  const cat = planCategorySchema.safeParse(input.category);
  if (!cat.success) return { error: "Invalid category." };
  try {
    await createPlanItem(user.id, input.month, cat.data, input.content);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateViews();
  return { ok: true };
}

export async function togglePlanItemAction(id: string) {
  const user = await requireUser();
  await togglePlanItem(user.id, id);
  revalidateViews();
}

export async function editPlanItemAction(id: string, content: string) {
  const user = await requireUser();
  try {
    await editPlanItem(user.id, id, content);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateViews();
  return { ok: true };
}

export async function deletePlanItemAction(id: string) {
  const user = await requireUser();
  await deletePlanItem(user.id, id);
  revalidateViews();
}

// ---------- Shared ----------

function revalidateViews(scope: "daily" | "monthly" | "future" | "all" = "all") {
  if (scope === "daily" || scope === "all") revalidatePath("/daily");
  if (scope === "monthly" || scope === "all") {
    revalidatePath("/monthly");
    revalidatePath("/monthly/plan");
    revalidatePath("/monthly/habits");
  }
  if (scope === "future" || scope === "all") revalidatePath("/future");
}
