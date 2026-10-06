# Shelby's Flower Fix — backend

A small Node.js + Express API backing the order/quote/payment system. This
is completely separate from the static frontend (`index.html`, `pay.html`,
etc. one level up): the site stays on GitHub Pages, and this API is hosted
on Render with its database on Neon.

## Why this exists

The order form and payment pages run in the customer's browser, which
can't be trusted to decide prices. This server is the source of truth: it's
the only thing allowed to decide what an order number is, what an order
costs, and whether it's been paid.

## Stack

- **Express** — the HTTP server
- **Prisma + Postgres** — the database (Neon in production)
- **Zod** — validates incoming request data
- **express-rate-limit** — basic abuse protection on public endpoints and
  the admin login

## Going live (one-time setup)

1. **Database (Neon):** sign up at https://neon.tech, create a project, and
   copy its connection string (starts with `postgresql://`).
2. **Server (Render):** sign up at https://render.com with GitHub, choose
   **New > Blueprint**, and pick this repository. Render reads
   `render.yaml` in the repo root and asks for:
   - `DATABASE_URL` — the Neon connection string from step 1
   - `ADMIN_PASSWORD` — the password Shelby will use on the admin pages
3. Wait for the deploy to finish, then open
   `https://<your-service>.onrender.com/health` — it should show
   `{"ok":true}`.
4. If Render gave the service a different address than
   `https://shelbys-flower-fix-api.onrender.com`, update `API_BASE_URL` in
   `config.js` (repo root) to match, then commit and push.

Every push to `main` redeploys the server. Database changes in
`prisma/migrations` are applied automatically by the build step.

On Render's free plan the server sleeps after 15 minutes without traffic,
so the first request after that takes up to a minute. Render's $7/month
plan keeps it awake.

## Local setup

```bash
cd server
npm install
cp .env.example .env
npm run build
npm run dev
```

- `cp .env.example .env` — then fill in `.env`. Use a separate Neon branch
  for `DATABASE_URL` so testing never touches real orders, and set any
  `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` you like.
- `npm run build` — generates the Prisma client and applies migrations
- `npm run dev` — starts the API on http://localhost:3001, restarting on
  file changes. The site pages use it automatically when opened from
  `localhost` (see `config.js`).
- `npm run migrate` — after changing `prisma/schema.prisma`, creates a new
  migration

## Endpoints

Public:

- `GET /health` — returns `{ ok: true }` if the server is running
- `POST /api/orders` — creates an order from the order form
- `GET /api/orders/by-token/:token` — the order behind a payment link
  (powers `pay.html`)

Admin (all need `Authorization: Bearer <token>` from the login):

- `POST /api/admin/login` — `{ password }` in, `{ token }` out (valid 12
  hours)
- `GET /api/admin/orders` and `GET /api/admin/orders/:orderNumber`
- `PATCH /api/admin/orders/:orderNumber/quote` — sets the price (in
  dollars) and creates the payment link
- `PATCH /api/admin/orders/:orderNumber/status`
- `PATCH /api/admin/orders/:orderNumber/mark-paid`
