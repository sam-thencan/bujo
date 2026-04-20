import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subDays,
} from "date-fns";

export const DATE_FMT = "yyyy-MM-dd";
export const MONTH_FMT = "yyyy-MM";

export function today(): string {
  return format(new Date(), DATE_FMT);
}

export function thisMonth(): string {
  return format(new Date(), MONTH_FMT);
}

export function parseDate(d: string): Date {
  return parseISO(d);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function prettyDate(date: string): string {
  return format(parseDate(date), "EEE, MMM d");
}

export function prettyDateLong(date: string): string {
  return format(parseDate(date), "EEEE, MMMM d, yyyy");
}

export function prettyMonth(month: string): string {
  return format(parseDate(month + "-01"), "MMMM yyyy");
}

export function prettyMonthShort(month: string): string {
  return format(parseDate(month + "-01"), "MMM yyyy");
}

export function shiftDate(date: string, days: number): string {
  const d = days >= 0 ? addDays(parseDate(date), days) : subDays(parseDate(date), -days);
  return format(d, DATE_FMT);
}

export function shiftMonth(month: string, months: number): string {
  return format(addMonths(parseDate(month + "-01"), months), MONTH_FMT);
}

export function monthStart(month: string): string {
  return format(startOfMonth(parseDate(month + "-01")), DATE_FMT);
}

export function isFutureMonth(month: string): boolean {
  return month > thisMonth();
}

export function daysAround(center: string, before: number, after: number): string[] {
  const out: string[] = [];
  for (let i = -before; i <= after; i++) out.push(shiftDate(center, i));
  return out;
}

export function monthsAround(center: string, before: number, after: number): string[] {
  const out: string[] = [];
  for (let i = -before; i <= after; i++) out.push(shiftMonth(center, i));
  return out;
}

export function futureMonths(count: number): string[] {
  const out: string[] = [];
  const base = thisMonth();
  for (let i = 1; i <= count; i++) out.push(shiftMonth(base, i));
  return out;
}

// Every date in the given month, as "yyyy-MM-dd" strings.
export function daysInMonth(month: string): string[] {
  const start = startOfMonth(parseDate(month + "-01"));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map((d) => format(d, DATE_FMT));
}

// Single-char weekday letter (S M T W T F S).
export function weekdayLetter(date: string): string {
  const d = parseDate(date);
  return format(d, "EEEEE");
}

// Two-char day-of-month ("1 " / "12").
export function dayNumber(date: string): string {
  return String(parseDate(date).getDate());
}
