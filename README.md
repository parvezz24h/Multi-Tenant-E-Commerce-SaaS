# ShopBD

Multi-tenant SaaS for single-vendor e-commerce stores, built for Bangladesh.
See [Project Plan.md](./Project%20Plan.md) for the full roadmap.

**Status:** Phase 2 — Storefront (host-based store routing, Modern theme, catalog browsing, guest cart).
Phase 1 (auth, stores, RBAC, tenant context, platform admin) is done.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · PostgreSQL 17 ·
Prisma 7 · Better Auth · Zod · Vitest

## Getting started

```bash
pnpm install
cp .env.example .env            # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm db:up                      # Postgres in Docker on localhost:5433
pnpm db:migrate                 # apply migrations
pnpm dev                        # http://localhost:3000
```

Sign up at `/sign-up`, create a store, then promote yourself to platform admin:

```bash
pnpm make-admin you@example.com # unlocks /admin
```

Add demo products to a store and open its storefront (publish it first from the dashboard):

```bash
pnpm seed:demo <store-slug>     # 4 categories, 14 products; safe to re-run
open http://<store-slug>.localhost:3000
```

> Check which database `DATABASE_URL` in `.env` points to before running migrations
> or seeds. `.env.example` uses the local Docker database.

## Scripts

| Script             | What it does                                |
| ------------------ | ------------------------------------------- |
| `pnpm dev`         | Dev server                                  |
| `pnpm build`       | Generate Prisma client + production build   |
| `pnpm typecheck`   | Generate route types + `tsc`                |
| `pnpm lint`        | ESLint                                      |
| `pnpm test`        | Unit tests (Vitest)                         |
| `pnpm db:migrate`  | Create/apply a migration in development     |
| `pnpm db:deploy`   | Apply migrations in production              |
| `pnpm db:studio`   | Prisma Studio                               |
| `pnpm make-admin`  | Promote a user to `SUPER_ADMIN`             |
| `pnpm seed:demo`   | Add a demo catalog to a store               |

## Project structure

```text
prisma/schema.prisma        Data model (users, stores, catalog, carts, themes, audit log)
src/proxy.ts                Host → store rewrite; optimistic signed-out redirect
src/themes/                 Ready-made themes (registry + components)
src/app/
  (auth)/                   Sign in / sign up
  onboarding/               Create a store
  dashboard/[storeSlug]/    Merchant dashboard (tenant-scoped)
  admin/                    Platform admin (SUPER_ADMIN only)
  s/[storeSlug]/            Public storefront (reached only via the store's host)
  api/auth/[...all]/        Better Auth handler
src/server/                 Server-only application modules
  auth/                     Better Auth config, session helpers
  tenant/context.ts         Tenant resolution + membership checks
  rbac/permissions.ts       Role → permission map
  stores/                   Store schemas, service, server actions
  admin/                    Platform admin service + actions
  storefront/               Public catalog queries (ACTIVE stores/products only)
  cart/                     Guest cart (per-store httpOnly cookie)
  audit/                    Audit log writer
src/components/             UI (shadcn/ui in components/ui)
src/generated/prisma/       Generated Prisma client (git-ignored)
```

## Tenant isolation rules

Every store is a tenant; tenant-owned rows carry `storeId`.

1. **Pages** resolve the tenant with `getStoreContext(slug, permission)`, which
   requires a `StoreMember` row for the signed-in user. Stores the user can't
   access return 404, so other tenants' slugs aren't revealed.
2. **Server actions** receive `storeId` from the client, which is untrusted.
   They must call `requireStoreAccess(storeId, permission)` before doing anything.
3. **Queries** on tenant data must always filter by `ctx.store.id`, never by an
   ID taken from the request alone.
4. **Authorization** checks permissions (`store:update`), not roles, via
   `ctx.can(...)`. Roles map to permissions in `src/server/rbac/permissions.ts`.
5. **Platform admin** is a separate `platformRole` on `User`. It is re-read from
   the database on every admin request and can't be set at sign-up.
6. Changes to tenant data write an `AuditLog` row in the same transaction.
7. **Storefronts** are resolved from the hostname (`<slug>.shopbd.com`, or
   `<slug>.localhost` in development) in `src/proxy.ts`. `/s/...` is not
   reachable on the platform host. Storefront queries only return ACTIVE
   products of ACTIVE stores, and cart actions re-check that the product
   belongs to the store and that the cart token belongs to the store.
