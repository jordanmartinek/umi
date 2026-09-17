# 🌊 Umi Umi — Bracelet Storefront

Ocean-inspired bracelet webstore with PayPal checkout, admin dashboard, and Vercel deployment.

## Features

- **Storefront** — Clean, conversion-focused product page with filters, quick-add cart, and bundles
- **PayPal Checkout** — Integrated PayPal payment flow (supports PayPal, Venmo, Pay Later)
- **Admin Dashboard** — Order management, product CRUD, category management, store settings
- **Vercel Ready** — Serverless API functions, instant deploys from GitHub
- **Persistent Storage** — Upstash Redis on Vercel (one-click Marketplace add-on), with automatic local JSON fallback for dev

## Quick Start (Local Development)

```bash
git clone https://github.com/jordanmartinek/umi.git
cd umi
npm install             # installs @upstash/redis
cp .env.example .env    # Add your PayPal credentials (Redis is optional locally)
npm run dev
```

Then open:
- **Store:** http://localhost:3000
- **Admin:** http://localhost:3000/admin

## Default Admin Login

**Password:** `umiumi2026`

> ⚠️ Change this after first login in Settings → Change Password

## PayPal Setup

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications)
2. Create a new app (or use existing)
3. Copy your **Client ID** and **Secret**
4. Add them to your environment:

### For local development:
Create a `.env` file:
```
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
PAYPAL_MODE=sandbox
JWT_SECRET=any-random-string
```

### For Vercel deployment:
Add these as **Environment Variables** in your Vercel project settings:

| Variable | Value |
|----------|-------|
| `PAYPAL_CLIENT_ID` | Your PayPal Client ID |
| `PAYPAL_CLIENT_SECRET` | Your PayPal Client Secret |
| `PAYPAL_MODE` | `sandbox` for testing, `live` for real payments |
| `JWT_SECRET` | A random secure string for auth tokens |
| `UPSTASH_REDIS_REST_URL` | Injected automatically by the Upstash Marketplace add-on |
| `UPSTASH_REDIS_REST_TOKEN` | Injected automatically by the Upstash Marketplace add-on |

## Persistent Storage (Upstash Redis)

Vercel's serverless filesystem is **ephemeral** — anything written to `data/*.json`
at runtime is lost on the next deploy or cold start. So on Vercel the admin
dashboard needs a real database, or every product/order/settings change silently
disappears. This project uses **Upstash Redis** (the successor to the now-sunset
Vercel KV) for that.

### One-time setup on Vercel
1. In your Vercel project, open the **Storage** tab → **Create Database** →
   **Upstash for Redis** (or **Marketplace → Upstash**).
2. Connect it to this project. Vercel automatically injects
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as environment
   variables — no manual copying needed.
3. Redeploy.

That's it. On first request, the store **auto-seeds Redis** from the committed
`data/*.json` files, so your existing catalog carries over with zero manual
import. From then on, all admin edits persist.

### How it works
- **Redis configured** (`UPSTASH_REDIS_*` present) → all reads/writes go to
  Upstash. Each collection lives under a `umi:<name>` key (e.g. `umi:products`).
- **Not configured** (local dev) → falls back to the JSON files in `data/`, so
  you can still `npm run dev` with zero setup.
- Visit `/api/debug` to see which backend is active (`storageBackend`).

### Dependencies
This adds a single dependency, [`@upstash/redis`](https://www.npmjs.com/package/@upstash/redis)
(HTTP-based, serverless-friendly). Run `npm install` before deploying, or let
Vercel install it during the build.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables (see above)
4. Deploy — it auto-deploys on every push!

### Going Live (Real Payments)

When ready to accept real payments:
1. In your PayPal Developer Dashboard, switch to **Live** credentials
2. Update your Vercel env vars:
   - `PAYPAL_CLIENT_ID` → your **live** client ID
   - `PAYPAL_CLIENT_SECRET` → your **live** secret
   - `PAYPAL_MODE` → `live`
3. Redeploy

## Project Structure

All API routes are handled by a **single serverless function** (`api/index.js`).
This keeps the project under Vercel's Hobby-plan function limit — `vercel.json`
rewrites every `/api/*` request to that one handler, which dispatches internally
based on the path and method.

```
umi/
├── api/
│   ├── _lib/               # Shared utilities (not exposed as routes)
│   │   ├── auth.js         # JWT auth, password hashing
│   │   ├── db.js           # JSON file database helpers
│   │   └── paypal.js       # PayPal Orders API v2 integration
│   └── index.js            # Single handler for ALL /api routes
│                           #   (public, paypal, auth, and admin)
├── data/                   # JSON "database" (committed to the repo)
│   ├── products.json       # Product catalog
│   ├── categories.json     # Product categories
│   ├── sets.json           # Curated bundle sets (validated at checkout)
│   ├── orders.json         # Captured orders
│   └── settings.json       # Store settings + hashed admin password
├── public/
│   ├── index.html          # Customer storefront
│   ├── styles.css          # Storefront styles
│   ├── script.js           # Storefront logic (cart, PayPal, animations)
│   └── admin/              # Admin dashboard
│       ├── index.html
│       ├── admin.css
│       └── admin.js
├── uploads/                # Product image uploads
├── server.js               # Local dev server (mimics Vercel routing)
├── vercel.json             # Vercel deployment config (rewrites → api/index.js)
├── .env.example            # Environment variable template
└── package.json
```

## Checkout Flow

1. Customer adds items to cart (individual bracelets and/or bundle **sets**)
2. Customer clicks PayPal button in cart drawer
3. `/api/paypal/create-order` validates every line against the catalog —
   both `products.json` and `sets.json` — and resolves prices **server-side**
   so client-supplied prices can't be tampered with
4. PayPal popup opens → customer approves payment
5. `/api/paypal/capture-order` captures the payment via PayPal Orders API v2
6. Order is saved to `data/orders.json`
7. Customer sees success confirmation with order ID
8. Order appears in admin dashboard → owner marks as fulfilled when shipped

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | All active products |
| GET | `/api/categories` | All categories |
| GET | `/api/sets` | Curated bundle sets |
| GET | `/api/settings/public` | Store settings |
| GET | `/api/paypal/client-id` | PayPal client ID for frontend |
| POST | `/api/paypal/create-order` | Create PayPal order |
| POST | `/api/paypal/capture-order` | Capture payment after approval |

### Admin (auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/orders` | All orders |
| PUT | `/api/admin/orders/:id` | Update order status |
| GET/POST | `/api/admin/products` | List/Create products |
| PUT/DELETE | `/api/admin/products/:id` | Update/Delete product |
| GET/POST | `/api/admin/categories` | List/Create categories |
| PUT/DELETE | `/api/admin/categories/:id` | Update/Delete category |
| GET/PUT | `/api/admin/settings` | Read/Update settings |

## Important Notes

- **Data persistence on Vercel**: Vercel's serverless functions have ephemeral filesystems, so the app uses **Upstash Redis** for persistent storage in production (see [Persistent Storage](#persistent-storage-upstash-redis) above). Without it configured, admin dashboard changes will not survive redeploys/cold starts. Locally, it transparently falls back to the JSON files in `data/`.
- **Security**: Always change the default admin password and set a strong `JWT_SECRET` in production.
- **PayPal Sandbox**: Use sandbox mode for testing. PayPal provides test buyer accounts in the developer dashboard.
