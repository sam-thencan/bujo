"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Entry } from "@/lib/entries";
import { reorderEntriesAction } from "@/app/(app)/actions";
import { EntryItem } from "./EntryItem";

export function SortableEntryList({
  entries,
  date,
}: {
  entries: Entry[];
  date: string;
}) {
  const [items, setItems] = useState(entries);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setItems(entries);
  }, [entries]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(async () => {
      await reorderEntriesAction({
        ids: next.map((i) => i.id),
        scope: "daily",
      });
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="rounded-lg border border-ink-100 bg-white px-2">
          {items.map((entry) => (
            <SortableRow key={entry.id} entry={entry} date={date} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ entry, date }: { entry: Entry; date: string }) {
  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging,
  } = useSortable({ id: entry.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <EntryItem
      entry={entry}
      context={{ kind: "day", date }}
      sortable={{
        setNodeRef,
        style,
        attributes: attributes as unknown as Record<string, unknown>,
        listeners: listeners as unknown as Record<string, unknown>,
        isDragging,
      }}
    />
  );
}
