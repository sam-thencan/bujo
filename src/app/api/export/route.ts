import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { exportAll } from "@/lib/entries";
import { prettyDateLong, prettyMonth } from "@/lib/dates";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const data = await exportAll(user.id);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "md") {
    const md = toMarkdown(data);
    return new NextResponse(md, {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="bujo-${stamp}.md"`,
      },
    });
  }
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="bujo-${stamp}.json"`,
    },
  });
}

function signifier(e: { type: string; status: string; priority: number }) {
  let s = "•";
  if (e.type === "event") s = "○";
  else if (e.type === "note") s = "—";
  else if (e.status === "done") s = "X";
  else if (e.status === "migrated") s = ">";
  else if (e.status === "scheduled") s = "<";
  else if (e.status === "cancelled") s = "~";
  return (e.priority ? "* " : "  ") + s;
}

function toMarkdown(data: Awaited<ReturnType<typeof exportAll>>): string {
  const lines: string[] = [];
  lines.push(`# bujo export — ${data.user.email}`);
  lines.push("");
  lines.push(`_Exported ${data.exported_at}_`);
  lines.push("");

  const byMonth = new Map<string, typeof data.entries>();
  for (const e of data.entries) {
    if (!byMonth.has(e.log_month)) byMonth.set(e.log_month, []);
    byMonth.get(e.log_month)!.push(e);
  }
  const months = Array.from(byMonth.keys()).sort();
  for (const m of months) {
    lines.push(`## ${prettyMonth(m)}`);
    lines.push("");
    const items = byMonth.get(m)!;
    const monthly = items.filter((e) => !e.log_date);
    const daily = items.filter((e) => !!e.log_date);
    if (monthly.length) {
      lines.push(`### Monthly log`);
      for (const e of monthly)
        lines.push(`${signifier(e)} ${e.content}`);
      lines.push("");
    }
    const byDay = new Map<string, typeof items>();
    for (const e of daily) {
      const d = e.log_date!;
      if (!byDay.has(d)) byDay.set(d, []);
      byDay.get(d)!.push(e);
    }
    const days = Array.from(byDay.keys()).sort();
    for (const d of days) {
      lines.push(`### ${prettyDateLong(d)}`);
      for (const e of byDay.get(d)!)
        lines.push(`${signifier(e)} ${e.content}`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("Legend: `•` task · `X` done · `>` migrated · `<` scheduled · `○` event · `—` note · `*` priority");
  lines.push("");
  return lines.join("\n");
}
