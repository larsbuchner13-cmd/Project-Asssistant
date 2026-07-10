# PM Copilot

A project management assistant that guides teams through the core artifacts of
**PMBOK 7th Edition**, **PRINCE2**, and **Scrum** — organized around the five
PMBOK process groups (Initiating, Planning, Executing, Monitoring &
Controlling, Closing).

Each project picks a framework. PMBOK projects get the standard Planning/
Executing views (WBS, schedule, risk register, budget, task board, decisions).
Selecting **Scrum** swaps Planning/Executing for a Product Backlog, Sprint
Planning, a drag-and-drop Sprint Board, and a Burndown Chart. Selecting
**PRINCE2** adds a Business Case document, Stage Gates with checklists, and
Tolerance settings alongside the standard views.

## Tech stack

- Next.js 14 (App Router, TypeScript)
- Prisma ORM + PostgreSQL (Neon-compatible)
- Tailwind CSS + hand-rolled shadcn/ui-style components (Radix primitives)
- next-intl (German default, English secondary)
- react-hook-form + zod
- @dnd-kit for drag-and-drop (WBS tree, Kanban boards)
- NextAuth (Credentials) + bcryptjs for authentication and user management

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

Create a Postgres database — [Neon](https://neon.tech) works well for this.
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Neon gives you two connection strings — a **pooled** one (hostname contains
`-pooler`) and a **direct** one (no `-pooler`). Set both:

```
DATABASE_URL="postgresql://user:password@ep-example-000000-pooler.eu-central-1.aws.neon.tech/pmcopilot?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-example-000000.eu-central-1.aws.neon.tech/pmcopilot?sslmode=require"
```

`DATABASE_URL` (pooled) is what the app uses at runtime. `DIRECT_URL` is what
`prisma migrate` uses — Neon's pooled connection runs through PgBouncer in
transaction mode, which doesn't support the advisory locks Prisma Migrate
needs, so migrations against the pooled URL fail with a `P1002` timeout. If
you're on a plain (non-Neon) Postgres instance without pooling, both
variables can point at the same URL.

Also set `NEXTAUTH_SECRET` (generate one with `openssl rand -base64 32`) and
`NEXTAUTH_URL` (e.g. `http://localhost:3000` in dev) — both are used by
NextAuth to sign session tokens and build redirect URLs.

### 3. Run migrations and seed data

```bash
npx prisma migrate dev
npm run db:seed
```

This creates the schema and seeds one demo project per framework (PMBOK,
PRINCE2, Scrum), plus two demo accounts: `admin@pmcopilot.local` (role
`ADMIN`, owns the PMBOK and PRINCE2 projects) and `member@pmcopilot.local`
(role `USER`, owns the Scrum project). Both use the password `changeme123` —
change it after first login in a real deployment.

> If this is applied against a database that already has projects in it
> (e.g. an existing production deployment predating user accounts), the
> `20260709141000_backfill_project_owner` migration assigns every existing
> project to a bootstrap admin account before making `ownerId` required —
> no data is dropped. For a disposable local/dev database you can instead
> run `npx prisma migrate reset` to start clean.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to
`/de` (or `/en` depending on your browser's language).

## Available scripts

| Script              | Description                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`        | Start the dev server                         |
| `npm run build`      | Production build                             |
| `npm run start`      | Start the production server                  |
| `npm run lint`       | Lint                                          |
| `npm run db:migrate` | `prisma migrate dev`                         |
| `npm run db:seed`    | `prisma db seed` (re-runs `prisma/seed.ts`)  |
| `npm run db:studio`  | `prisma studio` — browse the database         |

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) environment
   variables in the Vercel project settings, pointing at your Neon database.
3. Vercel runs `npm run build`, which does **not** run migrations
   automatically. Run `npx prisma migrate deploy` from your machine (using
   the same `DIRECT_URL`) against the production database before or during
   your first deploy, and again after pulling any change that touches
   `prisma/schema.prisma`, so the schema stays in sync.
4. Optionally run `npm run db:seed` once against the production database if
   you want the demo projects there too.

## User management

Accounts are self-service but gated: anyone can register at `/register`,
but new accounts start with status `PENDING` and can't sign in to any
project pages until an admin approves them at `/admin/users` (visible only
to `ADMIN` users). The very first person to register on a fresh database is
auto-approved as `ADMIN` so there's always someone able to approve everyone
else.

- **Roles**: `ADMIN` (can approve/disable accounts and change roles) and
  `USER` (regular project access).
- **Status**: `PENDING` (awaiting approval, redirected to `/pending`),
  `ACTIVE` (full access), `DISABLED` (blocked, redirected to `/pending`).
- **Projects are per-user**: each project has an `ownerId`. A project only
  ever shows up for the user who created it (admins see every project, for
  oversight). This is enforced both in the UI (dashboard, project pages) and
  server-side on every create/update/delete action, so a signed-in user
  can't read or modify another user's project data even by calling a server
  action directly.

## Project structure

```
prisma/
  schema.prisma        # data model (see below)
  migrations/           # one folder per migration — run `migrate deploy` after pulling new ones
  seed.ts               # demo data — one project per framework
src/
  app/[locale]/         # all routes, locale-prefixed (next-intl)
    login/, register/, pending/  # auth pages
    admin/users/        # admin-only user management (approve, roles)
    projects/[projectId]/
      layout.tsx        # ownership gate — 404s if you don't own the project (or aren't admin)
      initiating/       # charter, stakeholders, business-case (PRINCE2)
      planning/         # wbs, schedule, risks, budget, stage-gates & tolerances (PRINCE2),
                         # backlog & sprint-planning (Scrum, replaces the above)
      executing/        # taskboard, decisions; sprint-board & burndown (Scrum, replaces these)
      monitoring/        # status-report, raid, change-requests
      closing/           # lessons-learned, checklist
    actions/            # server actions (create/update/delete per resource)
  app/api/auth/[...nextauth]/  # NextAuth route handler
  components/
    ui/                 # shadcn-style primitives (button, card, dialog, table, tabs, ...)
    layout/             # topbar, framework-aware project sidebar
    auth/                # login/register forms, sign-out button
    admin/               # user management table
    initiating/         # charter form, stakeholder matrix/table
    planning/           # WBS tree (dnd-kit), Gantt chart, risk/budget tables
    executing/          # Kanban task board, decisions log
    monitoring/         # status report view, RAID log, change requests
    closing/            # lessons learned, closure checklist
    scrum/              # backlog, sprint planning, sprint board, burndown chart
    prince2/            # business case, stage gates, tolerances
  lib/
    validations/        # zod schemas, one per resource
    prisma.ts, pm.ts, tree.ts, nav-config.ts
    auth.ts              # NextAuth config (Credentials provider, JWT session)
    authz.ts              # requireActiveUser / requireAdmin / requireProjectAccess guards
  middleware.ts          # next-intl + auth/role routing (login, pending, admin gates)
messages/
  de.json, en.json       # next-intl translation catalogs
```

## Data model

`User` (`role`: `ADMIN` | `USER`, `status`: `PENDING` | `ACTIVE` | `DISABLED`)
owns zero or more `Project`s via `Project.ownerId`. `Project` is otherwise the
root record for everything else; every artifact belongs to one project via
`framework` (`PMBOK` | `PRINCE2` | `SCRUM`), which also drives which nav items
and views are shown. Core PMBOK-generic models: `ProjectCharter`,
`Stakeholder`, `WorkPackage` (self-referencing tree with a separate
`WorkPackageDependency` join table for finish-to-start dependencies), `Risk`,
`Task`, `Decision` + `ActionItem`, `StatusReport`, `Issue`, `Assumption`,
`Dependency`, `ChangeRequest`, `Milestone`, `LessonLearned`,
`ClosureChecklistItem`. PRINCE2 adds `BusinessCase`, `Prince2Tolerance`,
`StageGate` (checklist stored as JSON). Scrum adds `BacklogItem` (with
`completedAt`, used to drive the burndown chart) and `Sprint`. See
`prisma/schema.prisma` for the full schema.
