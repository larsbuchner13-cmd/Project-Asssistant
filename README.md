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

### 3. Run migrations and seed data

```bash
npx prisma migrate dev
npm run db:seed
```

This creates the schema and seeds one demo project per framework (PMBOK,
PRINCE2, Scrum).

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

## Project structure

```
prisma/
  schema.prisma        # data model (see below)
  migrations/           # one folder per migration — run `migrate deploy` after pulling new ones
  seed.ts               # demo data — one project per framework
src/
  app/[locale]/         # all routes, locale-prefixed (next-intl)
    projects/[projectId]/
      initiating/       # charter, stakeholders, business-case (PRINCE2)
      planning/         # wbs, schedule, risks, budget, stage-gates & tolerances (PRINCE2),
                         # backlog & sprint-planning (Scrum, replaces the above)
      executing/        # taskboard, decisions; sprint-board & burndown (Scrum, replaces these)
      monitoring/        # status-report, raid, change-requests
      closing/           # lessons-learned, checklist
    actions/            # server actions (create/update/delete per resource)
  components/
    ui/                 # shadcn-style primitives (button, card, dialog, table, tabs, ...)
    layout/             # topbar, framework-aware project sidebar
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
messages/
  de.json, en.json       # next-intl translation catalogs
```

## Data model

`Project` is the root record; every artifact belongs to one project via
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
