# AGENTS.md — Edra frontend and repo conventions

This document is for humans and AI assistants working on **Edra** (academy / instructor product). Follow it when adding or changing UI, data access, or layout.

## Product context

- **Edra** is an educational academy management product (students, schedules, sessions, academy settings).
- **Roles:** Instructor flows live under `app/(instructor)/[slug]/…`; other segments include auth (`/login`, `/signup`) and student areas where present.

## Repo map

| Area | Purpose |
|------|---------|
| [`app/`](app/) | Next.js App Router: layouts, pages, API route handlers under `app/api/`. |
| [`app/(instructor)/[slug]/layout.tsx`](app/(instructor)/[slug]/layout.tsx) | **All** academy-scoped UI (dashboard + settings) wraps in `SidebarProvider`, `AppSidebar`, and `SidebarInset` so `SiteHeader` / `SidebarTrigger` always have context. |
| [`components/ui/`](components/ui/) | shadcn/Radix primitives and generic UI only — **no domain-specific API calls**. |
| [`components/shell/`](components/shell/) | Reusable **page chrome** (settings shell, academy settings shell). Prefer adding new cross-route layout here rather than copying `div` stacks. |
| [`components/students|sessions|schedules|settings|create/`](components/) | Domain feature components. |
| [`components/helpers/`](components/helpers/) | Shared config/data (e.g. sidebar nav), small types, and pure utils (`academy-utils`). Prefer **`lib/`** for pure utilities over time. |
| [`lib/`](lib/) | Supabase client, DB helpers, hooks, shared types ([`lib/types/database.ts`](lib/types/database.ts)), [`lib/get-error-message.ts`](lib/get-error-message.ts). |

## Frontend rules

1. **shadcn-first** — Use `@/components/ui/*` before inventing primitives. Add new official components with the shadcn CLI and [`components.json`](components.json) aliases (`@/components`, `@/components/ui`, `@/lib/utils`).
2. **Layouts** — Instructor dashboard uses [`SidebarProvider`](components/ui/sidebar.tsx) + [`AppSidebar`](components/app-sidebar.tsx) + **`SidebarInset`** for the main column ([`app/(instructor)/[slug]/(dashboard)/layout.tsx`](app/(instructor)/[slug]/(dashboard)/layout.tsx)). Settings uses [`SettingsPageShell`](components/shell/settings-page-shell.tsx); nested academy settings uses [`AcademySettingsShell`](components/shell/academy-settings-shell.tsx).
3. **Navigation** — For **in-app** URLs, use **`next/link`** (`Link`), not raw `<a href>`, so client navigation and prefetch work (sidebar, auth footers, menus).
4. **Styling** — Tailwind + `cn()` from [`lib/utils.ts`](lib/utils.ts). Icons: **Tabler** (`@tabler/icons-react`).
5. **Minimal `div` policy** — Prefer `Card`, `ScrollArea`, `Separator`, `Empty*`, sidebar slots, and `Field` / `Form` for structure. shadcn internals may still use `div`; do not rewrite them. Avoid new arbitrary flex wrappers when a shell or existing primitive fits.
6. **Site header breadcrumbs** — The prop type for crumbs is **`SiteHeaderCrumb`** (exported from [`components/site-header.tsx`](components/site-header.tsx)), not the shadcn `BreadcrumbItem` list primitive.
7. **Page toolbars** — Route-specific search, filters, columns, and primary page actions should live in a reusable page toolbar near the page content, not in `SiteHeader.actions`. Prefer the shared toolbar primitives in [`components/shell/page-toolbar.tsx`](components/shell/page-toolbar.tsx) and reserve `SiteHeader.actions` for controls that truly belong in the shared header chrome.

## Data boundaries

- **Server vs client** — Default to Server Components in `app/`; add `"use client"` only for interactivity, browser APIs, or hooks.
- **Auth** — Client academy/session context: [`components/auth-provider.tsx`](components/auth-provider.tsx). Server-side user access: [`lib/user-server.ts`](lib/user-server.ts) (and related `lib/` modules).
- **API access** — Prefer centralizing `fetch` to small modules or hooks under `lib/` as the codebase grows; surface failures with **Sonner** toasts where appropriate. Use [`getErrorMessage`](lib/get-error-message.ts) in `catch (err: unknown)` instead of `catch (err: any)`.

## API route handlers (canonical pattern)

Every mutation handler under `app/api/**/route.ts` MUST:

1. **Guard auth + academy ownership** using helpers from [`lib/api/guard.ts`](lib/api/guard.ts):
   - `requireAcademyAccess(academyId)` when the request carries `academyId` in body or query.
   - `requireAcademyAccessForRow(table, id)` on `[id]` routes that do not pass `academyId` — it fetches the row and verifies ownership.
   - `requireAuth()` only for endpoints that are user-scoped, not academy-scoped (e.g. `/api/profile`, `/api/academy/me`, `/api/invites/accept`).
2. **Validate inputs** using shared Zod schemas from [`lib/schemas/index.ts`](lib/schemas/index.ts) via `validateBody(request, schema)` / `validateQuery(request, schema)` from [`lib/api/validation.ts`](lib/api/validation.ts). Do not redefine schemas inside handlers — add them to `lib/schemas` so forms reuse them.
3. **Return errors** using helpers from [`lib/api/response.ts`](lib/api/response.ts): `errors.badRequest(…)`, `errors.unauthorized()`, `errors.forbidden(…)`, `errors.notFound(…)`, `errors.validationError(…)`, `errors.internal(…)`.
4. **Preserve success shapes** — `lib/hooks/use-data.ts` expects raw arrays/objects (not wrapped). Only error responses use the `{ success: false, error }` envelope.

Canonical skeleton:

```ts
import { requireAcademyAccess } from "@/lib/api/guard";
import { validateBody } from "@/lib/api/validation";
import { errors } from "@/lib/api/response";
import { createStudentSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const parsed = await validateBody(request, createStudentSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academy_id);
  if (!auth.ok) return auth.response;

  // use auth.ctx.academyId as the source of truth — never trust body academy_id alone
}
```

## Loading & error boundaries

Every major route segment (`app/loading.tsx`, `app/error.tsx`, `(dashboard)/loading.tsx`, `settings/loading.tsx`, `settings/error.tsx`, etc.) must have a `loading.tsx` skeleton and a client `error.tsx` that calls `getErrorMessage(error)` and exposes a `reset()` button.

## Forms

- Prefer React Hook Form + Zod via `zodResolver(schemaFromLibSchemas)` so the client validates against the same schema the server enforces.
- After a successful create, reset the form to defaults (`form.reset(defaultValues)` for RHF, or `setState(initialFormData)` for controlled forms). On edit, do NOT reset — leave the current values so the user can continue editing.

## How to add a new component

1. Choose **domain folder** (`components/students/`, etc.) or **`components/shell/`** if it is route chrome shared by multiple areas.
2. Compose from **`@/components/ui`**; avoid duplicating button/input styles.
3. New shadcn primitives: `npx shadcn@latest add …` (see project CLI preference), then import from `@/components/ui/…`.
4. Export from the domain **`index.ts`** when the component is part of that module’s public API.
5. Do not add **raw `fetch` scattered in leaf UI** without going through a shared helper (existing code may still do this — migrate opportunistically).

## Quality bar

- Run **`npm run typecheck`**, **`npm run build`**, and **`npm test`** before merging (CI runs these on push/PR). **`npm run lint`** still reports many legacy issues across `app/api` and `lib/`; fix opportunistically or tighten scope in a follow-up so lint can be added to CI.
- **`npm test`** runs Vitest unit tests (currently [`components/helpers/academy-utils.test.ts`](components/helpers/academy-utils.test.ts)).
- No placeholder routes in primary flows; academy slug root should redirect to the dashboard.
- Prefer **typed** TanStack Table columns over `as any` (legacy code is being tightened over time).

## Trusted exceptions

- [`components/ui/chart.tsx`](components/ui/chart.tsx) uses `dangerouslySetInnerHTML` for theming — internal-only, trusted content.

## Duplicate inventory (checklist)

Track consolidation work here; tick when done or not applicable.

- [ ] Shared **academy row chrome** between [`field-rows.tsx`](components/shared/academy/field-rows.tsx) and [`level-rows.tsx`](components/shared/academy/level-rows.tsx) (menus, tooltips, DnD wrappers).
- [ ] Shared **list / data-table toolbar** pattern across students, sessions, and schedules toolbars.
- [ ] Single **form dialect**: align [`app-input.tsx`](components/ui/app-input.tsx) usage with `Form` + `Field` where possible.
- [x] Central **`lib/api` or hooks** for repeated `fetch` in domain components. Guard/validation helpers live under `lib/api/`; shared mutation schemas under `lib/schemas/`. Client hooks still raw-shape JSON — migrate to typed helpers opportunistically.

## CI

GitHub Actions workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — install, lint, typecheck, test, build.
