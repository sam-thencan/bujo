"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { toggleLegendAction } from "@/app/(app)/actions";

export function HamburgerMenuDropdown({
  showLegend,
}: {
  showLegend: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [optimisticLegend, setOptimisticLegend] = useState<boolean | null>(
    null,
  );
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOptimisticLegend(null);
  }, [showLegend]);

  const effectiveLegend = optimisticLegend ?? showLegend;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleLegend() {
    const next = !effectiveLegend;
    setOptimisticLegend(next);
    startTransition(async () => {
      await toggleLegendAction(next);
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md px-2 py-1 text-ink-500 hover:text-ink-900"
        aria-label="Menu"
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M3 6h14M3 10h14M3 14h14" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-52 overflow-hidden rounded-md border border-ink-200 bg-white text-sm shadow-soft">
          <button
            type="button"
            onClick={toggleLegend}
            className="flex w-full items-center justify-between border-b border-ink-100 px-3 py-2 text-left text-ink-800 hover:bg-ink-50"
          >
            <span>{effectiveLegend ? "Hide legend" : "Show legend"}</span>
            <span
              className={
                "ml-2 inline-block h-4 w-7 rounded-full transition " +
                (effectiveLegend ? "bg-ink-900" : "bg-ink-200")
              }
              aria-hidden
            >
              <span
                className={
                  "block h-3 w-3 translate-y-0.5 rounded-full bg-white transition " +
                  (effectiveLegend ? "translate-x-[14px]" : "translate-x-[2px]")
                }
              />
            </span>
          </button>
          <MenuLink href="/settings" onClick={() => setOpen(false)}>
            Settings
          </MenuLink>
          <MenuLink href="/api/export" onClick={() => setOpen(false)} prefetch>
            Export JSON
          </MenuLink>
          <MenuLink
            href="/api/export?format=md"
            onClick={() => setOpen(false)}
            prefetch
          >
            Export Markdown
          </MenuLink>
          <form action={logoutAction} className="border-t border-ink-100">
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left text-red-600 hover:bg-ink-50"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  prefetch,
  children,
}: {
  href: string;
  onClick: () => void;
  prefetch?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch ? undefined : false}
      onClick={onClick}
      className="block px-3 py-2 text-ink-800 hover:bg-ink-50"
    >
      {children}
    </Link>
  );
}
