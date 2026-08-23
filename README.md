# 🌊 Umi Umi — Bracelet Storefront

Ocean-inspired bracelet webstore with a built-in admin dashboard.

## Features

- **Storefront** — Clean, conversion-focused product page with filters, quick-add cart, and bundle sections
- **Admin Dashboard** — Full product & category management with image uploads
- **JSON Database** — Lightweight file-based storage, no external DB needed
- **Auth** — Password-protected admin with JWT sessions

## Quick Start

```bash
git clone https://github.com/jordanmartinek/umi.git
cd umi
npm install
npm run dev
```

Then open:
- **Store:** http://localhost:3000
- **Admin:** http://localhost:3000/admin

## Default Admin Login

**Password:** `umiumi2026`

> ⚠️ Change this after first login in Settings → Change Password

## Project Structure

```
umi/
├── server.js              # Express server & API routes
├── data/
│   ├── products.json      # Product data
│   ├── categories.json    # Category data
│   └── settings.json      # Store settings
├── public/
│   ├── store/             # Customer-facing storefront
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── script.js
│   └── admin/             # Admin dashboard
│       ├── index.html
│       ├── admin.css
│       └── admin.js
└── uploads/               # Product images
```

## API Endpoints

### Public
- `GET /api/products` — All active products
- `GET /api/categories` — All categories
- `GET /api/settings/public` — Store settings (public fields only)

### Admin (auth required)
- `POST /api/auth/login` — Login
- `GET/POST /api/admin/products` — List / Create products
- `PUT/DELETE /api/admin/products/:id` — Update / Delete product
- `GET/POST /api/admin/categories` — List / Create categories
- `PUT/DELETE /api/admin/categories/:id` — Update / Delete category
- `GET/PUT /api/admin/settings` — Read / Update settings

## Deployment

This can be deployed to any Node.js hosting:
- **Railway** — Push to GitHub, connect repo
- **Render** — Free tier available
- **Fly.io** — Lightweight containers
- **Vercel** — With serverless adapter

Set `JWT_SECRET` environment variable in production.
