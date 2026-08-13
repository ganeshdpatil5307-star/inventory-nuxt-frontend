# Inventory Management — Nuxt 3 Frontend

Client-rendered Nuxt 3 dashboard for the Inventory Management System. Talks to the
FastAPI service in **`inventory-fastapi-backend`** over REST with a JWT bearer token.

Built to exercise a PaaS **App Platform**: GitHub integration, build & deploy,
auto-deploy on push, build/runtime environment variables, cross-service API
communication, health checks and monitoring.

---

## Features

| Area | What's included |
|---|---|
| **Login** | JWT auth, token persisted in `localStorage`, redirect-after-login |
| **Route guard** | Global middleware protects every page and revalidates the session |
| **Dashboard** | KPI cards, inventory value, low/out-of-stock, category bars, recent movements |
| **Products** | Full CRUD with modal forms, category/supplier pickers, stock badges |
| **Categories** | Full CRUD |
| **Suppliers** | Full CRUD with contact details |
| **Inventory** | Stock In / Stock Out with client-side overdraw guard, movement ledger |
| **Search** | Debounced (400 ms) free-text search on every list, plus filters |
| **Pagination** | Server-driven pagination with page-size selector and ellipsis pager |
| **Sorting** | Click column headers on the products table |
| **Loading states** | Skeleton rows, spinners on every submit button |
| **Error handling** | Inline form errors, retryable error panels, toast notifications, 401 auto-logout |
| **Responsive UI** | Collapsible sidebar, mobile-first tables, bottom-sheet modals on small screens |

---

## Tech stack

Nuxt 3 (SPA mode) · Vue 3 `<script setup>` + TypeScript · Tailwind CSS · Pinia · Nitro node-server

---

## Project structure

```
app.vue · error.vue          # Root shell and error page
layouts/
  default.vue                # Sidebar + header shell
  auth.vue                   # Centered layout for login
middleware/auth.global.ts    # Route guard
stores/auth.ts               # Pinia auth store (token, user, login/logout)
composables/
  useApi.ts                  # $fetch wrapper: base URL, JWT, error normalisation
  useToast.ts                # Toast notifications
  useDebouncedRef.ts         # Debounced search input
  useFormat.ts               # Currency / number / date formatting
components/                  # LoadingState, ErrorState, EmptyState, SearchInput,
                             # PaginationBar, ModalDialog, ConfirmDialog,
                             # StatCard, ToastHost
pages/
  login.vue                  # Sign in
  index.vue                  # Dashboard
  products/index.vue         # Product CRUD
  categories/index.vue       # Category CRUD
  suppliers/index.vue        # Supplier CRUD
  inventory/index.vue        # Stock In/Out + movement ledger
server/routes/healthz.ts     # Health endpoint for the platform probe
types/index.ts               # Shared API types
.do/app.yaml                 # App Platform spec
Dockerfile · nuxt.config.ts · tailwind.config.js · .env.example
```

---

## Environment variables

| Variable | Scope | Default | Notes |
|---|---|---|---|
| `NUXT_PUBLIC_API_BASE` | build + run | `http://localhost:8000/api/v1` | Backend base URL **including `/api/v1`** |
| `NUXT_PUBLIC_APP_NAME` | build + run | `Inventory Manager` | Branding in sidebar/login |
| `PORT` | run | `3000` | Injected by the platform |
| `HOST` | run | `0.0.0.0` | Must be `0.0.0.0` in containers |
| `NITRO_PRESET` | build | `node-server` | Leave as-is for service deploys |

`NUXT_PUBLIC_*` values are embedded in the client bundle — never put secrets there.

---

## Local development

```bash
git clone https://github.com/<your-username>/inventory-nuxt-frontend.git
cd inventory-nuxt-frontend

npm install
cp .env.example .env          # point NUXT_PUBLIC_API_BASE at your API

npm run dev                   # http://localhost:3000
```

Sign in with the seeded backend admin (`admin@example.com` / the value of
`FIRST_ADMIN_PASSWORD`), then change the password.

Production build locally:

```bash
npm run build
node .output/server/index.mjs
```

Docker:

```bash
docker build --build-arg NUXT_PUBLIC_API_BASE=https://<api-domain>/api/v1 -t inventory-web .
docker run -p 3000:3000 inventory-web
```

---

## Deploying to App Platform

### Build & run commands

| Setting | Value |
|---|---|
| **Environment** | Node.js 20 |
| **Build command** | `npm ci && npm run build` |
| **Run command** | `node .output/server/index.mjs` |
| **HTTP port** | `3000` |
| **Health check path** | `/healthz` |

### Steps

1. **Deploy the backend first** and note its public URL.
2. **Create the app** → *Create App* → **GitHub** → pick `inventory-nuxt-frontend`,
   branch `main`, and enable **Autodeploy on push**.
3. **Set environment variables** — `NUXT_PUBLIC_API_BASE` must be scoped to
   **build *and* run time**, because Nuxt inlines public runtime config at build:
   ```
   NUXT_PUBLIC_API_BASE = https://<your-backend-domain>/api/v1
   NUXT_PUBLIC_APP_NAME = Inventory Manager
   HOST                 = 0.0.0.0
   ```
   Changing this value requires a **rebuild**, not just a restart.
4. **Set the health check** to `/healthz`.
5. **Allow this origin on the backend** — add the frontend URL to the backend's
   `BACKEND_CORS_ORIGINS` and redeploy it, otherwise the browser blocks every call.
6. **Deploy and verify:**
   ```bash
   curl https://<your-frontend-domain>/healthz
   ```
   then open the app, sign in, and confirm the dashboard loads.

A ready-made spec is committed at [`.do/app.yaml`](.do/app.yaml).

---

## How the frontend talks to the API

```
Browser ──► Nuxt SPA ──► fetch(NUXT_PUBLIC_API_BASE + path)
                          Authorization: Bearer <jwt from localStorage>
```

* All requests go through `composables/useApi.ts`, which injects the token,
  strips empty query params and converts FastAPI's `{detail}` / `{errors[]}`
  payloads into readable messages.
* A `401` clears the session and bounces the user to `/login`.
* Because calls are made from the browser, **CORS is enforced by the backend** —
  a "Failed to fetch" error in the console almost always means the frontend origin
  is missing from `BACKEND_CORS_ORIGINS`.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Login says "Network error — is the API reachable?" | Wrong `NUXT_PUBLIC_API_BASE`, or the API is down |
| CORS error in the browser console | Frontend origin not in the backend's `BACKEND_CORS_ORIGINS` |
| Env var change had no effect | `NUXT_PUBLIC_*` is baked in at build — trigger a rebuild |
| Blank page after deploy | Check the run command is `node .output/server/index.mjs` and `HOST=0.0.0.0` |
| Immediate logout after signing in | Backend `SECRET_KEY` changed, invalidating issued tokens |

## License

MIT
