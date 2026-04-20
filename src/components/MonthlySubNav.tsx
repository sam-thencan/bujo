"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/monthly", label: "Timeline" },
  { href: "/monthly/plan", label: "Plan" },
  { href: "/monthly/habits", label: "Habits" },
];

export function MonthlySubNav({ month }: { month: string }) {
  const pathname = usePathname();
  return (
    <div className="mt-1 flex items-center gap-1 overflow-hidden rounded-md border border-ink-200 bg-white p-0.5">
      {LINKS.map((l) => {
        const active =
          l.href === "/monthly"
            ? pathname === "/monthly"
            : pathname?.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={`${l.href}?month=${month}`}
            className={
              "flex-1 rounded-md py-1.5 text-center text-xs font-medium " +
              (active
                ? "bg-ink-900 text-white"
                : "text-ink-500 hover:text-ink-900")
            }
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
