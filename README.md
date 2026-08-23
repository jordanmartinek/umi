# 🌊 Umi Umi — Bracelet Storefront

Ocean-inspired bracelet webstore with PayPal checkout, admin dashboard, and Vercel deployment.

## Features

- **Storefront** — Clean, conversion-focused product page with filters, quick-add cart, and bundles
- **PayPal Checkout** — Integrated PayPal payment flow (supports PayPal, Venmo, Pay Later)
- **Admin Dashboard** — Order management, product CRUD, category management, store settings
- **Vercel Ready** — Serverless API functions, instant deploys from GitHub
- **Zero Dependencies** — Pure Node.js, no `npm install` needed

## Quick Start (Local Development)

```bash
git clone https://github.com/jordanmartinek/umi.git
cd umi
cp .env.example .env    # Add your PayPal credentials
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

```
umi/
├── api/                    # Vercel serverless functions
│   ├── _lib/              # Shared utilities (not exposed as routes)
│   │   ├── auth.js        # JWT auth, password hashing
│   │   ├── db.js          # JSON file database helpers
│   │   └── paypal.js      # PayPal API integration
│   ├── admin/             # Protected admin endpoints
│   │   ├── categories.js
│   │   ├── categories/[id].js
│   │   ├── orders.js
│   │   ├── orders/[id].js
│   │   ├── products.js
│   │   ├── products/[id].js
│   │   └── settings.js
│   ├── auth/              # Authentication endpoints
│   │   ├── check.js
│   │   ├── change-password.js
│   │   ├── login.js
│   │   └── logout.js
│   ├── paypal/            # PayPal checkout endpoints
│   │   ├── client-id.js
│   │   ├── create-order.js
│   │   └── capture-order.js
│   ├── categories.js      # Public categories
│   ├── products.js        # Public products
│   └── settings/
│       └── public.js      # Public store settings
├── data/                   # JSON database
│   ├── products.json
│   ├── categories.json
│   ├── orders.json
│   └── settings.json
├── public/
│   ├── store/             # Customer storefront
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── script.js
│   └── admin/             # Admin dashboard
│       ├── index.html
│       ├── admin.css
│       └── admin.js
├── server.js              # Local dev server (mimics Vercel routing)
├── vercel.json            # Vercel deployment config
├── .env.example           # Environment variable template
└── package.json
```

## Checkout Flow

1. Customer adds items to cart
2. Customer clicks PayPal button in cart drawer
3. PayPal popup opens → customer approves payment
4. Our API captures the payment via PayPal Orders API v2
5. Order is saved to `data/orders.json`
6. Customer sees success confirmation with order ID
7. Order appears in admin dashboard → owner marks as fulfilled when shipped

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | All active products |
| GET | `/api/categories` | All categories |
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

- **Data persistence on Vercel**: Vercel's serverless functions have ephemeral filesystems. For a production store with significant volume, consider migrating `data/*.json` to a database (e.g., Vercel KV, PlanetScale, or Supabase). For low-volume stores, the JSON files work fine with the data committed to the repo.
- **Security**: Always change the default admin password and set a strong `JWT_SECRET` in production.
- **PayPal Sandbox**: Use sandbox mode for testing. PayPal provides test buyer accounts in the developer dashboard.
