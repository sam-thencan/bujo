import type { EntryType } from "./entries";

export type ParsedInput = {
  type: EntryType;
  content: string;
  priority: number;
};

// BuJo-style quick entry parsing.
// Prefix shortcuts (optional):
//   ".", "-", "[]"    -> task
//   "o", "()"         -> event
//   "n", "—"          -> note
//   "=" (mood symbol) -> mood
//   "*" prefix        -> priority flag
// A bare string with no known prefix defaults to the fallback type.
export function parseInput(raw: string, fallbackType: EntryType = "task"): ParsedInput {
  let s = raw.trim();
  let priority = 0;
  if (s.startsWith("*")) {
    priority = 1;
    s = s.slice(1).trimStart();
  }
  const lower = s.toLowerCase();
  let type: EntryType = fallbackType;
  const prefixes: Array<[string, EntryType]> = [
    ["[] ", "task"],
    [". ", "task"],
    ["- ", "task"],
    ["o ", "event"],
    ["() ", "event"],
    ["n ", "note"],
    ["— ", "note"],
    ["-- ", "note"],
    ["= ", "mood"],
  ];
  for (const [p, t] of prefixes) {
    if (lower.startsWith(p)) {
      type = t;
      s = s.slice(p.length);
      break;
    }
  }
  return { type, content: s.trim(), priority };
}
