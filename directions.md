# directions — deploy and operate bujo

A practical operator guide. Written for a technical founder but usable by a competent non-engineer with a terminal.

## Stack recap and rationale

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 14 (App Router) | Mobile-first SSR, first-class Vercel deploy, Server Actions keep forms simple |
| Language | TypeScript | Safety |
| Styling | Tailwind CSS | Fast, tiny CSS, mobile-first defaults |
| Database | libSQL via Turso (prod) / local SQLite file (dev) | SQLite semantics = trivial export + portability. Turso free tier easily covers 2 users. |
| DB client | `@libsql/client` | Single client works with both local `file:` URLs and Turso `libsql:` URLs |
| Auth | bcryptjs + `jose` (JWT cookies) | No third-party auth vendor; no Supabase; easy to replace later |
| Hosting | Vercel | Free Hobby tier covers this app; zero-config for Next.js |

**Why not Supabase / Clerk / Firebase?** Per product brief, we avoid Supabase. The auth surface is small enough that a signed JWT cookie + bcrypt is straightforward and keeps the data model vendor-neutral.

**Why SQLite (via Turso) and not Postgres?** Two users, simple relational data, and a strong desire for portable exports. SQLite dumps cleanly to JSON or SQL, and Turso gives us a hosted replica without paying Postgres overhead. If we later outgrow it, we can move to Postgres with a one-time schema port.

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | `file:./dev.db` locally, `libsql://<db>-<org>.turso.io` in production |
| `DATABASE_AUTH_TOKEN` | prod only | Turso auth token |
| `AUTH_SECRET` | yes | 32+ character random string used to sign JWT session cookies |
| `SIGNUPS` | no | `open` (default) or `closed`. Set to `closed` after your team has signed up to disable public signups |

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 48
```

## Run locally

```bash
npm install
cp .env.example .env.local
# edit .env.local — AUTH_SECRET is required
npm run dev
```

The local DB file `dev.db` is created automatically; schema runs on first request.

First-run flow:
1. Visit `http://localhost:3000`
2. Sign up with email + password
3. You land on the Daily tab for today

## Deploy to Vercel (free tier)

### 1. Create the Turso database

Install Turso CLI:

```bash
brew install tursodatabase/tap/turso
turso auth signup   # or: turso auth login
turso db create bujo
turso db show bujo --url            # -> libsql://... (this is DATABASE_URL)
turso db tokens create bujo         # -> eyJ... (this is DATABASE_AUTH_TOKEN)
```

### 2. Push the repo to GitHub

```bash
git init
git add -A
git commit -m "initial"
gh repo create bujo --private --source=. --remote=origin --push
```

### 3. Import into Vercel

- https://vercel.com/new → import the repo
- **Framework preset:** Next.js (auto-detected)
- **Environment variables:**
  - `DATABASE_URL` → your Turso URL
  - `DATABASE_AUTH_TOKEN` → your Turso token
  - `AUTH_SECRET` → the `openssl rand` string
  - `SIGNUPS` → leave blank (defaults to `open`), or set `closed` after your team signs up
- Deploy

The first request on the production instance runs the schema automatically against Turso. (Idempotent — `CREATE TABLE IF NOT EXISTS`.)

### 4. Lock down signups

Once your executive and assistant have both created accounts:

- Vercel dashboard → Project → Settings → Environment Variables
- Set `SIGNUPS=closed`
- Redeploy

New signups will now return an error. Existing users are unaffected.

## Verify the deployment

After deploy, check each of the following. This is the golden-path checklist for the refined BuJo flow:

1. Visit the deployed URL → redirected to `/login`
2. Go to `/signup` → create an account → land on `/daily`
3. Brain-dump a few entries with the signifier toggle: a task (`•`), an event (`○`), a note (`—`), a mood (`=`)
4. Toggle the task's signifier → it shows `X` and strikes through
5. Open the `⋯` menu on an open task → tap **Top 1** → it moves up into the Top 3 panel with a `1` badge; tap **Top 2** on another task → confirm swap semantics hold
6. Tap another task in the Top 3 "Promote…" expander → it claims the empty slot
7. Open the Reflection section at the bottom of Daily → add a mood entry → confirm it italic-renders under Reflection, not Tasks
8. Swipe day pills in the bottom board switcher → pick tomorrow → brain-dump an intent → return to today → both days persist
9. **Monthly → Timeline** → type a one-liner for today → blur → the `…` saves; tap a habit dot → it fills
10. **Monthly → Plan** → add an item to Personal and to Work; toggle one done
11. **Monthly → Habits** → add up to 3 habits; tap a daily cell to toggle; long-hold (~0.5s) to reset
12. Advance a month in the monthly board switcher → Habits shows the "Copy last month's habits" button → tap → prior habits propagate
13. **Future** → scroll the stack of upcoming months → add an intent to two different months → use the ↑ on a task to pull it into this month → confirm it lands in today's date view for scheduling
14. Settings → toggle "Show shortcut legend" off/on
15. Settings → **Export JSON** — confirm `entries`, `day_summaries`, `habits`, `habit_logs`, `action_plan` all appear
16. Settings → **Export Markdown** → readable archive downloads
17. Sign out → redirected to `/login`

If all 17 pass, the refined build is live and working.

## Configuring auth

Auth is baked in. No third-party setup is required.

To reset a user's password, you currently have to do it in the DB:

```bash
turso db shell bujo
> UPDATE users SET password_hash = '<bcrypt-hash>' WHERE email = 'you@example.com';
```

Generate a bcrypt hash quickly:

```bash
node -e 'console.log(require("bcryptjs").hashSync(process.argv[1], 10))' "newpassword"
```

(Password reset email flow is listed in `roadmap.md`.)

## Configuring storage / persistence

Everything lives in one libSQL DB. Schema is in [`src/lib/schema.sql`](./src/lib/schema.sql). It is applied idempotently on first app request via [`src/lib/db.ts`](./src/lib/db.ts).

### Back up

```bash
turso db shell bujo .dump > bujo-backup-$(date +%F).sql
```

### Restore / migrate to another provider

Because we use SQLite-compatible SQL, any libSQL or SQLite target accepts the dump:

```bash
sqlite3 newbujo.db < bujo-backup-2026-04-19.sql
```

## Exporting data

End users export via **Settings → Export JSON** (or Markdown). This hits `/api/export` and returns a file owned by the signed-in user.

The JSON shape is stable and suitable for:
- Re-importing into a future version of bujo
- Archiving to Drive/Dropbox
- Migrating to a different backend

The Markdown export is for human reading and offline archival (email it to yourself, print it, etc.).

## Handing this off to a non-technical operator

The executive and assistant do not need to know anything about Turso, Vercel, or the schema to use bujo. They only need:

1. The deployed URL (e.g. `https://bujo.yourdomain.com`)
2. Their email/password
3. That they can always export their data from Settings

Everything else (DB migrations, deploys, env vars) is the operator's job.

If the operator changes:

- Rotate `AUTH_SECRET` (invalidates all sessions, users must sign in again)
- Rotate the Turso token (`turso db tokens create bujo`) and update `DATABASE_AUTH_TOKEN` in Vercel
- Transfer Vercel project ownership under Team → Members

## Known limitations

- **Next.js 14.2.35 DoS advisories.** The 14.2.x line has outstanding moderate/high advisories for features this app does not use (image optimizer `remotePatterns`, `rewrites`, `next/image`). Practical exposure is limited to app-availability DoS. Upgrade path is Next 15+, which introduces breaking changes to `cookies()` / `searchParams` / `params` (they become async) — plan ~1 hour of focused work to migrate.
- **No password reset email.** Reset requires DB access (see below). Email reset is in `roadmap.md`.
- **No rate limiting on login/signup.** Acceptable for a 2-user private deployment. For anything wider, add a middleware-based limiter or Vercel WAF rule.
- **Turso cold start.** Free-tier Turso can take a beat after long idle. Users may see the first request of the day hang ~1s.

## Troubleshooting

- **"AUTH_SECRET must be set"** — your env var is missing or shorter than 32 chars
- **"Unauthorized" on `/api/export`** — your session cookie expired; sign in again
- **Blank legend** — you toggled it off in Settings; toggle back on
- **`dev.db` corrupted during development** — delete it, restart `npm run dev`, your schema recreates
- **Turso cold-start latency** — expected for free tier; the first request after idle may take a beat
