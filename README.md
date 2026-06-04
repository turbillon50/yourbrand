# YourBrand — White-Label Construction Management Platform

A full-stack, white-label web application for construction project management.
Built with React + Vite (frontend) and Node/Express (backend API), deployed to Vercel.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 7, TailwindCSS 4, Wouter, TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Clerk |
| Deploy | Vercel (monorepo) |
| Package manager | pnpm 9 (workspace) |

## White-Label Setup

All brand-specific values live in two places:

### 1. Environment variables (`.env`)

Copy `.env.example` and fill in your brand values:

```bash
# Backend brand config
BRAND_NAME=YourBrand
BRAND_SLUG=yourbrand
BRAND_DOMAIN=yourbrand.com
BRAND_SUPPORT_EMAIL=soporte@yourbrand.com
ADMIN_ACCESS_PHRASE=your_secret_admin_phrase

# Frontend brand config (Vite)
VITE_BRAND_NAME=YourBrand
VITE_BRAND_SHORT_NAME=YourBrand
VITE_BRAND_FULL_NAME=YourBrand Company
VITE_BRAND_SLUG=yourbrand
VITE_BRAND_DESCRIPTION=Work management system
VITE_BRAND_LOGO_PATH=/brand-logo.jpeg
VITE_BRAND_THEME_COLOR=#0A0A0A
VITE_BRAND_PRIMARY_COLOR=#F59E0B
```

### 2. Static files to replace per brand

| File | What to update |
|------|---------------|
| `artifacts/app-control/index.html` | `BRAND_SLUG` constant in the inline script |
| `artifacts/app-control/public/sw.js` | `BRAND_SLUG` constant |
| `artifacts/app-control/public/manifest.json` | `name`, `short_name`, `description` |
| `artifacts/app-control/public/brand-logo.jpeg` | Replace with your logo |
| `artifacts/app-control/public/icon-192.png` | PWA icon 192×192 |
| `artifacts/app-control/public/icon-512.png` | PWA icon 512×512 |

### Brand config modules

- **Frontend:** `artifacts/app-control/src/brand.config.ts` — reads Vite env vars, exports `brand` object and `storageKey()` helper used throughout the UI
- **Backend:** `artifacts/api-server/src/lib/brand.ts` — reads Node env vars, used in session cookie name, CORS domain, error messages, push notifications, and emails

## Project Structure

```
.
├── api/                    Vercel serverless entry (proxies to api-server)
├── artifacts/
│   ├── app-control/        Frontend SPA (React + Vite)
│   │   └── src/
│   │       └── brand.config.ts   ← Frontend white-label config
│   └── api-server/         Express REST API
│       └── src/lib/brand.ts      ← Backend white-label config
├── lib/
│   ├── db/                 Drizzle ORM schema + migrations
│   ├── api-spec/           OpenAPI spec
│   ├── api-zod/            Auto-generated Zod validators
│   └── api-client-react/   Auto-generated React hooks
└── scripts/                Build utilities
```

## Getting Started

```bash
# 1. Install dependencies
corepack pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your brand values, database URL, and Clerk keys

# 3. Push database schema
corepack pnpm db:push

# 4. Start dev servers (run in separate terminals)
corepack pnpm --filter @workspace/api-server dev
corepack pnpm --filter @workspace/app-control dev
```

## Deploy to Vercel

1. Connect this repository to a Vercel project
2. Set all env vars from `.env.example` in the Vercel dashboard
3. Vercel will use `vercel.json` at the root for build/routing config

See `.env.example` for the full list of required variables.

## User Roles

| Role | Description |
|------|-------------|
| `admin` | Full access — manages projects, users, invitations |
| `supervisor` | Field manager — logs, materials, reports |
| `client` | Read-only access to project progress |
| `worker` | Attendance / geocheck via PIN |
| `proveedor` | Supplier — views materials |

## Troubleshooting

- **Blank screen** — check DevTools Console. The app has a global ErrorBoundary that should show a recovery screen.
- **CORS blocked** — verify `FRONTEND_PUBLIC_URL` (in API) matches the exact web domain and `VITE_API_BASE_URL` (in web) points to the exact API domain. No trailing slash in either.
- **Session cookie not persisting** — `NODE_ENV=production` in API is required; without it the cookie won't survive cross-site requests.
- **`@workspace/db` not resolved on Vercel** — confirm the `installCommand` runs from the monorepo root.
