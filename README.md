# SupportDesk Frontend (Next.js + TypeScript)

Next.js (App Router) + TypeScript version of `customer-support-frontend` (Vite + React).
It has the same UI and the same stylesheet, and works with either backend:

- `customer-support-backend`: FastAPI + PostgreSQL
- `customer-support-backend-flask`: Flask + Supabase

## Run locally

```bash
npm install
cp .env.example .env     # pick a backend with BACKEND_URL
npm run dev              # http://localhost:5173
```

Port 5173 matches the Vite app, so the backends' CORS and Google-login redirect settings work unchanged.

## Choosing the backend

The browser always calls `/api/...` on this app. [next.config.ts](next.config.ts) rewrites those requests
to `BACKEND_URL`:

```
browser ──/api/tickets──▶ Next.js (rewrite) ──/tickets──▶ FastAPI or Flask
```

Because the browser only talks to one origin, the backend's httpOnly `access_token` cookie is
first-party, locally and in production. You don't need any CORS or `SameSite=None` setup.

In `.env`, keep exactly one `BACKEND_URL` uncommented (local FastAPI, local Flask, deployed FastAPI or
deployed Flask). Rewrites are fixed at build time, so restart `npm run dev` or redeploy after changing it.

**Google login through the proxy:** set the backend's `GOOGLE_REDIRECT_URI` to
`<frontend-url>/api/auth/google/callback` (and add that URL in Google Cloud Console). The callback
then also goes through the proxy, and the login cookie lands on the frontend's domain.

## Deploy to Vercel

1. Import the repo and set the **Root Directory** to this folder.
2. Add the `BACKEND_URL` environment variable (your Render/Railway backend URL).
3. Deploy. The backend's `FRONTEND_URL` should be the Vercel URL.

## Project structure

```
src/
  app/
    layout.tsx              Root layout: fonts, Font Awesome CSS, providers
    providers.tsx           Toast + Auth context providers (client component)
    login/page.tsx          Sign in / sign up / Google login
    (app)/layout.tsx        Route group: auth guard + sidebar shell for signed-in pages
    (app)/page.tsx          Dashboard
    (app)/tickets/          Ticket list and ticket detail ([id])
    (app)/(admin)/          Admin-only route group: new ticket, team management
    not-found.tsx           Unknown URLs redirect to the dashboard
  components/               UI pieces (modals, attachment picker/gallery, app shell, guards)
  context/                  AuthContext (current user via /auth/me) and ToastContext
  hooks/useUsers.ts         Team list for admins
  lib/api.ts                Typed API client
  lib/types.ts              Backend response types
  lib/format.ts             Date, status and size formatting
```

### How it maps from the Vite app

| Vite + React Router | Next.js App Router |
|---|---|
| `<Routes>` in `App.jsx` | Folders under `src/app/` |
| `<ProtectedRoute>` | `(app)/layout.tsx` with `RequireAuth` |
| `<ProtectedRoute adminOnly>` | `(app)/(admin)/layout.tsx` |
| `<AppLayout>` + `<Outlet>` | `AppShell` wrapping `children` |
| `useNavigate`, `useParams`, `useSearchParams` | `next/navigation` equivalents |
| `location.state.from` after login | `/login?next=/path` |
| Vite dev proxy | `rewrites()` in `next.config.ts` (also works in production) |
