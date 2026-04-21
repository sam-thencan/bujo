"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { daysAround, shiftDate, today as todayFn } from "@/lib/dates";
import { format, parseISO } from "date-fns";

const COMMIT_PX = 50;
const MAX_DRAG_PX = 120;

export function DaySlider({
  current,
  basePath,
  paramKey,
}: {
  current: string;
  basePath: string;
  paramKey: string;
}) {
  const router = useRouter();
  const days = daysAround(current, 3, 3); // 7 pills, active in the middle
  const [dx, setDx] = useState(0);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const swipingRef = useRef(false);

  const prev = shiftDate(current, -1);
  const next = shiftDate(current, 1);

  function hrefFor(d: string) {
    return `${basePath}?${paramKey}=${d}`;
  }

  function navigate(d: string) {
    router.push(hrefFor(d));
  }

  function onPointerDown(e: React.PointerEvent) {
    startRef.current = { x: e.clientX, y: e.clientY };
    swipingRef.current = false;
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = startRef.current;
    if (!s) return;
    const rawDx = e.clientX - s.x;
    const rawDy = e.clientY - s.y;
    if (!swipingRef.current) {
      if (Math.abs(rawDy) > 12 && Math.abs(rawDy) > Math.abs(rawDx)) {
        startRef.current = null;
        return;
      }
      if (Math.abs(rawDx) > 10) {
        swipingRef.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    }
    if (swipingRef.current) {
      e.preventDefault();
      const clamped = Math.max(-MAX_DRAG_PX, Math.min(MAX_DRAG_PX, rawDx));
      setDx(clamped);
    }
  }
  function onPointerUp() {
    const final = dx;
    setDx(0);
    startRef.current = null;
    if (!swipingRef.current) return;
    swipingRef.current = false;
    // Swipe left (dx < 0) → future (next day).
    // Swipe right (dx > 0) → past (prev day).
    if (final <= -COMMIT_PX) navigate(next);
    else if (final >= COMMIT_PX) navigate(prev);
  }
  function onPointerCancel() {
    setDx(0);
    startRef.current = null;
    swipingRef.current = false;
  }

  return (
    <div className="fixed inset-x-0 bottom-[52px] z-20 border-t border-ink-100 bg-ink-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-screen-sm items-center gap-1 px-2 py-1.5">
        <Link
          href={hrefFor(prev)}
          className="rounded-md px-2 py-1 text-sm text-ink-500 hover:text-ink-900"
          aria-label="Previous day"
        >
          ‹
        </Link>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          className="flex flex-1 touch-pan-y select-none items-center justify-center overflow-hidden"
          style={{ touchAction: "pan-y" }}
        >
          <div
            className="flex items-center justify-center gap-1"
            style={{
              transform: `translateX(${dx}px)`,
              transition: dx === 0 ? "transform 180ms ease-out" : "none",
            }}
          >
            {days.map((d) => {
              const active = d === current;
              return (
                <Link
                  key={d}
                  href={hrefFor(d)}
                  className={
                    "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition " +
                    (active
                      ? "bg-ink-900 text-white"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200")
                  }
                >
                  {pillLabel(d)}
                </Link>
              );
            })}
          </div>
        </div>
        <Link
          href={hrefFor(next)}
          className="rounded-md px-2 py-1 text-sm text-ink-500 hover:text-ink-900"
          aria-label="Next day"
        >
          ›
        </Link>
        <Link
          href={hrefFor(todayFn())}
          className="ml-1 shrink-0 rounded-md px-2 py-1 text-[11px] text-ink-400 hover:text-ink-700"
          aria-label="Jump to today"
        >
          Today
        </Link>
      </div>
    </div>
  );
}

function pillLabel(d: string): string {
  const date = parseISO(d);
  if (d === todayFn()) return "Today";
  return format(date, "EEE d");
}
