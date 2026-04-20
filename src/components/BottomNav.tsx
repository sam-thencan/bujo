"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/daily", label: "Daily", icon: "·" },
  { href: "/monthly", label: "Monthly", icon: "▦" },
  { href: "/future", label: "Future", icon: "»" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-ink-50/95 backdrop-blur"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-screen-sm">
        {TABS.map((t) => {
          const active = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium " +
                (active ? "text-ink-900" : "text-ink-400")
              }
              aria-current={active ? "page" : undefined}
            >
              <span
                className={
                  "font-mono text-base leading-none " +
                  (active ? "text-ink-900" : "text-ink-400")
                }
                aria-hidden
              >
                {t.icon}
              </span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
