# Roadmap

A list of deliberately-deferred features. Nothing here is required for v1 — it is all stuff we chose not to build yet so the core product stays calm and focused.

## Near-term (low risk, high daily value)

### Search
- **Why:** Once a few months of entries accumulate, finding an old note becomes painful.
- **Notes:** Full-text search over `entries.content` (SQLite FTS5 virtual table). Add a lightweight `/search` route or inline command.
- **Type:** User-facing.

### Tags / signifiers
- **Why:** BuJo purists use custom signifiers (health, money, idea). Matches the spirit without drifting into project management.
- **Notes:** Add a `tags TEXT` column (comma-separated) or a separate join table; parse `#tag` in quick entry.
- **Type:** User-facing.

### PWA install + offline read
- **Why:** Mobile home-screen launch feels native; offline read means the journal is always available even on flaky connections.
- **Notes:** Add `manifest.webmanifest` and a service worker caching last-viewed day/month.
- **Type:** User-facing + infra.

### Dark mode
- **Why:** Evening journaling is common; Tailwind makes this cheap.
- **Notes:** Use `class`-based dark mode, persist preference in `settings.theme`.
- **Type:** User-facing.

### Reorder entries within a day
- **Why:** Priority ordering by drag beats the current implicit created-at order.
- **Notes:** Use `order_index` that already exists; add a long-press-to-drag handle or a simple up/down arrow per entry.
- **Type:** User-facing.

## Mid-term (meaningful, slightly larger lifts)

### Recurring entries
- **Why:** Weekly review, monthly bill, Friday standup — repeating items are part of real life.
- **Notes:** Add a small `recurrences` table (`rule TEXT`, `next_occurrence DATE`) and a cron or on-request expander that materializes the next N instances.
- **Type:** User-facing.

### Reminders / notifications
- **Why:** Events-without-reminders are only half useful.
- **Notes:** Start with email reminders via a scheduled job (Vercel Cron + Resend). Push notifications later.
- **Type:** User-facing + infra.

### Assistant delegation / shared access
- **Why:** The secondary user (assistant) needs to capture on the executive's behalf for specific boards/months.
- **Notes:** Add a `memberships` table with a role (`owner` / `assistant`) per user pair. Scope queries via `effective_user_id`. Keep UI simple: a user switcher at the top of the app header.
- **Type:** User-facing + schema change.

### Import from plain text / Markdown
- **Why:** Users coming from Apple Notes, Notion, or a paper journal need a ramp.
- **Notes:** Parse a Markdown file with `## YYYY-MM-DD` headings and BuJo signifiers; reuse the existing signifier glyphs.
- **Type:** User-facing.

### Weekly review screen
- **Why:** A light "this week" snapshot bridges daily and monthly and supports reflective use.
- **Notes:** Secondary screen reachable from the Monthly tab; do not add a 4th bottom tab.
- **Type:** User-facing.

## Longer-term (strategic, needs more thought)

### Multi-tenant teams / founders
- **Why:** The brief mentions additional founders later. Teams need shared boards and per-user visibility rules.
- **Notes:** Evolve `memberships` into `workspaces`. Separate "personal" vs "shared" entries with a `workspace_id`.
- **Type:** Infra + user-facing.

### Calendar integrations
- **Why:** Most events already live in Google/Apple Calendar. One-way sync from calendars into the daily/monthly log would reduce duplicate entry.
- **Notes:** Read-only ICS import first; OAuth + Google Calendar API later.
- **Type:** User-facing + infra.

### End-to-end encryption
- **Why:** Journals are intimate. E2EE is a real differentiator versus every other productivity app.
- **Notes:** Non-trivial. Requires client-side encryption with a key derived from the password and a separate salt. Breaks server-side search. Consider after search is stable.
- **Type:** Infra.

### Offline-first sync
- **Why:** The product goal is "usable every day in under a minute" — a network-bound app fails that on the subway.
- **Notes:** Swap writes to IndexedDB + background sync queue. Non-trivial; revisit once the data model is stable.
- **Type:** Infra.

### Attachments (images, voice memos)
- **Why:** Capturing a whiteboard photo next to a meeting note is a real use case.
- **Notes:** Use object storage (Vercel Blob / R2). Keep content field text-first; attachments are supplementary.
- **Type:** User-facing + infra.

### Analytics / streaks
- **Why:** Lightweight feedback loops improve habit formation, but risk turning bujo into a habit tracker.
- **Notes:** Keep minimal and on-device-calculated only (e.g., "you migrated 4 tasks last month"). No dashboards.
- **Type:** User-facing.

## Explicitly out of scope

- Template marketplaces
- Rich-text editor / styled journaling
- Project views (Kanban, Gantt)
- Team chat / comments
- Decorative stickers / visual theming
- Per-entry permissions at fine granularity
