"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function DayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="4.5" width="13" height="12" rx="2" />
      <path d="M3.5 8h13" />
      <path d="M7 3v3M13 3v3" />
      <circle cx="10" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

function MonthIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="4.5" width="13" height="12" rx="2" />
      <path d="M3.5 8h13" />
      <path d="M8 8v8.5M12 8v8.5M3.5 12h13" />
      <path d="M7 3v3M13 3v3" />
    </svg>
  );
}

function FutureIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6.5v4l2.5 1.5" />
    </svg>
  );
}

const TABS = [
  { href: "/daily", label: "Daily", Icon: DayIcon },
  { href: "/monthly", label: "Monthly", Icon: MonthIcon },
  { href: "/future", label: "Future", Icon: FutureIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-ink-50/95 backdrop-blur"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-screen-sm">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium " +
                (active ? "text-ink-900" : "text-ink-400")
              }
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
