import { EntryItem } from "./EntryItem";
import type { Entry } from "@/lib/entries";

export function ReflectionSection({
  entries,
  date,
}: {
  entries: Entry[];
  date: string;
}) {
  return (
    <section className="mt-5">
      <h2 className="text-[11px] uppercase tracking-wide text-ink-400">
        Reflection
      </h2>
      {entries.length === 0 ? (
        <p className="mt-1 rounded-lg border border-dashed border-ink-200 bg-white px-3 py-4 text-center text-xs text-ink-400">
          Events · notes · moods — switch the composer to Reflect.
        </p>
      ) : (
        <ul className="mt-1 rounded-lg border border-ink-100 bg-white px-2">
          {entries.map((e) => (
            <EntryItem
              key={e.id}
              entry={e}
              context={{ kind: "day", date }}
              hideRank
            />
          ))}
        </ul>
      )}
    </section>
  );
}
