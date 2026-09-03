# Shelby's Flower Fix — backend

A small Node.js + Express API backing the order/quote/payment system. This
is completely separate from the static frontend (`index.html`, `pay.html`,
etc. one level up) — it's not part of the GitHub Pages site and needs its
own hosting once it's ready to go live (see the project notes on hosting).

## Why this exists

Phase 1-2 of the project (the order form and the payment pages) work
entirely in the browser, with no real source of truth for orders or
prices. This server is that source of truth: it's the only thing allowed
to decide what an order number is, what an order costs, and whether it's
been paid.

## Stack

- **Express** — the HTTP server
- **Prisma + SQLite** — the database, for local development. Production
  will point this at a real Postgres database instead (a one-line change
  in `.env`); the code doesn't need to change.
- **Zod** — validates incoming request data
- **express-rate-limit** — basic abuse protection on public endpoints

## Local setup

```bash
cd server
npm install
cp .env.example .env
npm run migrate
npm run dev
```

- `npm install` — installs dependencies
- `cp .env.example .env` — creates your local config (already defaults to
  a local SQLite file, no changes needed to just try it out)
- `npm run migrate` — creates `prisma/dev.db` and applies the schema
- `npm run dev` — starts the API on http://localhost:3001, restarting on
  file changes

## Endpoints so far (Phase 3)

- `GET /health` — returns `{ ok: true }` if the server is running
- `POST /api/orders` — creates an order (used by the order form in a
  later phase)
- `GET /api/orders/:orderNumber` — fetches one order by its public order
  number (e.g. `SFF-260902-A7K4`)

Prices, quotes, payment links, and the admin routes come in later phases
— see the project's phase plan.

## A note on what's NOT done yet

This API currently has **no authentication** on any route. That's fine
while it's only running on your own machine, but nothing here should be
deployed publicly until the admin routes (Phase 5+) are behind a login
(Phase 11). Don't point `FRONTEND_ORIGIN` at a real domain or deploy this
until then.
