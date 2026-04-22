"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  daysAround,
  monthsAround,
  prettyMonthShort,
  shiftDate,
  shiftMonth,
  today,
  thisMonth,
} from "@/lib/dates";
import { format, parseISO } from "date-fns";

// useLayoutEffect runs before paint (no visible "slide"), but it warns on
// SSR — during the server render we fall back to useEffect.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Variant = "day" | "month" | "future";

export function BoardSwitcher({
  variant,
  current,
  basePath,
  paramKey,
  months,
}: {
  variant: Variant;
  current: string;
  basePath: string;
  paramKey: string;
  months?: string[];
}) {
  const items =
    variant === "day"
      ? daysAround(current, 10, 10)
      : variant === "month"
        ? monthsAround(current, 6, 6)
        : (months ?? []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  useIsoLayoutEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const el = c.querySelector<HTMLElement>("[data-active='true']");
    if (!el) return;
    // Position relative to the scroll container, not offsetParent. Centers
    // the active pill within the visible viewport of the container.
    const cRect = c.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const target =
      c.scrollLeft + (eRect.left - cRect.left) - c.clientWidth / 2 + el.clientWidth / 2;
    c.scrollTo({ left: target, behavior: "instant" as ScrollBehavior });
  }, [current, variant]);

  const prev =
    variant === "day" ? shiftDate(current, -1) : shiftMonth(current, -1);
  const next =
    variant === "day" ? shiftDate(current, 1) : shiftMonth(current, 1);
  const todayHref = `${basePath}?${paramKey}=${variant === "day" ? today() : thisMonth()}`;

  return (
    <div className="fixed inset-x-0 bottom-[52px] z-20 border-t border-ink-100 bg-ink-50/95 pr-[var(--sb)] backdrop-blur">
      <div className="mx-auto flex max-w-screen-sm items-center gap-1 px-2 py-2.5">
        <Link
          href={`${basePath}?${paramKey}=${prev}`}
          className="rounded-md px-2 py-1.5 text-base text-ink-500 hover:text-ink-900"
          aria-label="Previous"
        >
          ‹
        </Link>
        <div
          ref={containerRef}
          className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto scroll-smooth"
        >
          {items.map((item) => {
            const active = item === current;
            return (
              <Link
                key={item}
                href={`${basePath}?${paramKey}=${item}`}
                data-active={active ? "true" : undefined}
                className={
                  "shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition " +
                  (active
                    ? "bg-ink-900 text-white"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200")
                }
              >
                {labelFor(variant, item)}
              </Link>
            );
          })}
        </div>
        <Link
          href={`${basePath}?${paramKey}=${next}`}
          className="rounded-md px-2 py-1.5 text-base text-ink-500 hover:text-ink-900"
          aria-label="Next"
        >
          ›
        </Link>
        <Link
          href={todayHref}
          className="ml-1 shrink-0 rounded-md px-2 py-1.5 text-[11px] text-ink-400 hover:text-ink-700"
          aria-label="Jump to today"
        >
          {variant === "day" ? "Today" : "This"}
        </Link>
      </div>
    </div>
  );
}

function labelFor(variant: Variant, value: string): string {
  if (variant === "day") {
    const d = parseISO(value);
    const isToday = value === today();
    if (isToday) return "Today · " + format(d, "EEE d");
    return format(d, "EEE d");
  }
  return prettyMonthShort(value);
}
