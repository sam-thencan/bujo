# bujo

A calm, fast, mobile-first bullet journal web app. Built to be used daily in under a minute at a time. Deploy triggered.

## What it is

**bujo** is a personal operating system inspired by the Bullet Journal method: tasks, notes, and events flow through daily, monthly, and future logs, with migration as a first-class concept. It is not a project management suite.

- Three tabs: **Daily · Monthly · Future**
- Board switcher just above the bottom nav for fast context switching
- Top legend showing BuJo signifiers (hideable)
- Quick capture with prefix shortcuts (`. ` task, `o ` event, `n ` note, `*` priority)
- Migration flow for carrying unfinished items forward
- Portable JSON + Markdown export
- Email/password auth — no third-party auth service

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **libSQL / Turso** via `@libsql/client` (SQLite semantics, free-tier friendly, vendor-portable)
- **bcryptjs** + **jose** for password hashing and signed JWT session cookies
- Server Actions for mutations; Server Components for reads

## Run locally

```bash
npm install
cp .env.example .env.local
# edit .env.local and set AUTH_SECRET to a long random string
npm run dev
```

Open http://localhost:3000 and create an account.

The local database defaults to `./dev.db` (a SQLite file) and is auto-initialized with the schema on first request.

## Shortcuts

When typing in the quick-entry bar:

| Prefix | Meaning |
| --- | --- |
| `. ` or `- ` | task |
| `o ` | event |
| `n ` or `— ` | note |
| `*` prefix | priority (combine with any other prefix) |

You can also use the segmented `• ○ —` buttons to the left of the input to pick a type.

## Signifier legend

| `•` | task |
| `X` | done |
| `>` | migrated |
| `<` | scheduled (in future log) |
| `○` | event |
| `—` | note |
| `*` | priority |

## Deployment

See [`directions.md`](./directions.md) for full deploy + operator instructions. TL;DR: Vercel + Turso, free-tier friendly.

## Roadmap

See [`roadmap.md`](./roadmap.md) for future-work priorities.

## Data export

Settings → **Export JSON** (or Markdown). The JSON export is the full source of truth: user, entries, and settings. Structure is flat and portable.
