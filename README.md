# Interview Tracker

A single-page dashboard for tracking interview pass rates across an active job
search. Pass rate per round sits at the top; every company is one row below,
where each round cell cycles **Not yet → Passed → Rejected** with a click.

Built with Next.js 16, Tailwind v4, Drizzle ORM, and Neon Postgres. The whole
site sits behind one password.

## How the rates are calculated

- **Round pass rates** count _decided_ cells only: `passed / (passed + rejected)`.
  A round you haven't sat yet doesn't drag the percentage down.
- **Offer rate** uses a different denominator on purpose — `offers / total companies`
  — because a company that never made an offer still counts against the search.
- A stage with nothing decided shows `—`, not `0%`.

## Local setup

1. **Create a Neon database** — [neon.tech](https://neon.tech), free tier is
   plenty. From your project's **Connect** panel, copy the _pooled_ connection
   string (it contains `-pooler` and ends with `?sslmode=require`).

2. **Fill in `.env.local`** (already created, with `AUTH_SECRET` generated):

   ```ini
   DATABASE_URL="postgresql://…-pooler.….neon.tech/neondb?sslmode=require"
   APP_PASSWORD="whatever-you-want-to-type"
   AUTH_SECRET="…"   # already generated; openssl rand -hex 32
   ```

3. **Create the table:**

   ```bash
   npm run db:push
   ```

4. **Run it:**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000, enter `APP_PASSWORD`, and start adding rows.

## Deploying to Vercel

```bash
git add -A && git commit -m "Interview tracker"
gh repo create interview-tracker --private --source=. --push
```

Then import the repo at [vercel.com/new](https://vercel.com/new) and add the
same three environment variables (`DATABASE_URL`, `APP_PASSWORD`,
`AUTH_SECRET`) under **Settings → Environment Variables**. Vercel detects
Next.js with no further configuration.

`npm run db:push` targets whatever `DATABASE_URL` points at, so run it once
against your production database too — or just use the same Neon database for
both, which is the simplest setup for a personal tracker.

## Scripts

| Command              | What it does                        |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Dev server                          |
| `npm run build`      | Production build                    |
| `npm run typecheck`  | `tsc --noEmit`                      |
| `npm run lint`       | ESLint                              |
| `npm run db:push`    | Push the schema to `DATABASE_URL`   |
| `npm run db:studio`  | Browse/edit rows in Drizzle Studio  |

## Notes

- **Auth** is a single shared password. The session cookie stores an HMAC of a
  fixed payload signed with `AUTH_SECRET`, so it can't be forged and doesn't
  contain the password. Rotating `AUTH_SECRET` logs you out everywhere.
- **Edits save automatically** — cell clicks immediately, text fields ~0.7s
  after you stop typing (and on blur). The header shows the last save time.
- **Deleting a row** asks for confirmation only when the row has real data in
  it; blank rows are removed without a prompt.
- **Icon** — source art is [assets/discount_8797971.gif](assets/discount_8797971.gif),
  which has an opaque white background. The three derived PNGs
  ([src/app/icon.png](src/app/icon.png),
  [src/app/apple-icon.png](src/app/apple-icon.png),
  [public/logo.png](public/logo.png)) are its first frame with the background
  made transparent by **flood-filling inward from the edges** — a plain
  "remove white" would also knock out the white fill inside the `%` badge and
  leave its dark glyph invisible on the dark theme. Edge pixels get partial
  alpha and are un-blended from white so there is no pale fringe.
- **The logo `<Image>` must keep `unoptimized`.** Next's image optimizer
  transcodes to WebP for Chrome and **discards the alpha channel**, which paints
  a white box behind the logo in dark mode. The favicons are unaffected — they
  are served by the metadata route, not the optimizer. If you swap the art,
  re-check dark mode in a real browser: `curl` sends no `Accept: image/webp`
  header, so it will fetch the intact PNG and hide the bug.
- **Static assets are exempt from the password gate** in
  [src/proxy.ts](src/proxy.ts) — without that, image requests get 307'd to
  `/login` and silently never load.
- Adding a 5th round or extra columns means adding a field to
  [src/db/schema.ts](src/db/schema.ts) and an entry to `CELL_KEYS` in
  [src/lib/pipeline.ts](src/lib/pipeline.ts) — the table and the summary card
  both derive their columns from that list.
