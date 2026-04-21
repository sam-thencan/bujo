"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/daily", label: "Today" },
  { href: "/daily/reflect", label: "Reflect" },
];

export function DailySubNav({ date }: { date: string }) {
  const pathname = usePathname();
  return (
    <div className="mt-1 flex items-center gap-1 rounded-md border border-ink-200 bg-white p-0.5">
      {LINKS.map((l) => {
        const active =
          l.href === "/daily"
            ? pathname === "/daily"
            : pathname?.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={`${l.href}?date=${date}`}
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
