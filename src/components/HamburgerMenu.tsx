"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/(auth)/actions";

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

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
        <div className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-md border border-ink-200 bg-white text-sm shadow-soft">
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
