import { randomBytes } from "node:crypto";

export function newId(prefix = ""): string {
  const buf = randomBytes(12).toString("hex");
  return prefix ? `${prefix}_${buf}` : buf;
}
