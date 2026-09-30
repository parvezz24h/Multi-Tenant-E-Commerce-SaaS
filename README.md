# ShopBD

Multi-tenant SaaS for single-vendor e-commerce stores, built for Bangladesh.
See [Project Plan.md](./Project%20Plan.md) for the full roadmap.

**Status:** Phase 1 — Foundation (auth, stores, RBAC, tenant context, platform admin).

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

## Project structure

```text
prisma/schema.prisma        Data model (User, Store, StoreMember, AuditLog, auth tables)
src/proxy.ts                Optimistic signed-out redirect (not a security boundary)
src/app/
  (auth)/                   Sign in / sign up
  onboarding/               Create a store
  dashboard/[storeSlug]/    Merchant dashboard (tenant-scoped)
  admin/                    Platform admin (SUPER_ADMIN only)
  api/auth/[...all]/        Better Auth handler
src/server/                 Server-only application modules
  auth/                     Better Auth config, session helpers
  tenant/context.ts         Tenant resolution + membership checks
  rbac/permissions.ts       Role → permission map
  stores/                   Store schemas, service, server actions
  admin/                    Platform admin service + actions
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
