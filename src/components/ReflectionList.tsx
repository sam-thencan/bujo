"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setEntryIndentAction } from "@/app/(app)/actions";
import type { Entry } from "@/lib/entries";
import { EntryItem } from "./EntryItem";

const SWIPE_THRESHOLD = 40; // px — minimum horizontal distance to count as a swipe
const VERTICAL_GUARD = 20; // px — abort if vertical movement exceeds horizontal early

export function ReflectionList({
  entries,
  date,
}: {
  entries: Entry[];
  date: string;
}) {
  return (
    <ul className="rounded-lg border border-ink-100 bg-white px-2">
      {entries.map((e) => (
        <ReflectionRow key={e.id} entry={e} date={date} />
      ))}
    </ul>
  );
}

function ReflectionRow({ entry, date }: { entry: Entry; date: string }) {
  const [, startTransition] = useTransition();
  const [pendingIndent, setPendingIndent] = useState<number | null>(null);
  const effectiveIndent =
    pendingIndent ?? Math.max(0, Math.min(3, entry.indent ?? 0));

  useEffect(() => {
    setPendingIndent(null);
  }, [entry.indent]);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const swipingRef = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLLIElement>) {
    // Only left-button mouse or touch.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    swipingRef.current = false;
  }

  function onPointerMove(e: React.PointerEvent<HTMLLIElement>) {
    const s = startRef.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    // Bail if vertical motion dominates — lets the user scroll normally.
    if (!swipingRef.current) {
      if (Math.abs(dy) > VERTICAL_GUARD && Math.abs(dy) > Math.abs(dx)) {
        startRef.current = null;
        return;
      }
      if (Math.abs(dx) > 12) {
        swipingRef.current = true;
        // Lock the pointer so we keep receiving events.
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    }
    if (swipingRef.current) {
      e.preventDefault();
      setDragX(dx);
    }
  }

  function commit(dx: number) {
    if (!swipingRef.current) return;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    const next =
      dx > 0
        ? Math.min(3, effectiveIndent + 1)
        : Math.max(0, effectiveIndent - 1);
    if (next === effectiveIndent) return;
    setPendingIndent(next);
    startTransition(async () => {
      await setEntryIndentAction({ id: entry.id, indent: next });
    });
  }

  function onPointerUp(e: React.PointerEvent<HTMLLIElement>) {
    if (swipingRef.current) commit(dragX);
    startRef.current = null;
    swipingRef.current = false;
    setDragX(0);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  function onPointerCancel() {
    startRef.current = null;
    swipingRef.current = false;
    setDragX(0);
  }

  return (
    <EntryItem
      entry={entry}
      context={{ kind: "day", date }}
      indent={effectiveIndent}
      sortable={{
        listeners: {
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel,
        },
        style: dragX
          ? {
              transform: `translateX(${dragX / 3}px)`,
              transition: "none",
            }
          : { transition: "transform 140ms ease" },
      }}
    />
  );
}
