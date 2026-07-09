# PM Copilot

A project management assistant that guides teams through the core artifacts of
**PMBOK 7th Edition**, **PRINCE2**, and **Scrum** — organized around the five
PMBOK process groups (Initiating, Planning, Executing, Monitoring &
Controlling, Closing).

Currently implemented: **Initiating** (Project Charter builder, Stakeholder
Register with power-interest grid) and **Planning** (WBS with drag-and-drop,
Gantt-style schedule, Risk Register, Budget tracker). Executing, Monitoring &
Controlling, Closing, and the Scrum/PRINCE2-specific views are scaffolded in
the data model and navigation but not yet built.

## Tech stack

- Next.js 14 (App Router, TypeScript)
- Prisma ORM + PostgreSQL (Neon-compatible)
- Tailwind CSS + hand-rolled shadcn/ui-style components (Radix primitives)
- next-intl (German default, English secondary)
- react-hook-form + zod
- @dnd-kit for the WBS drag-and-drop tree

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

Create a Postgres database — [Neon](https://neon.tech) works well for this.
Copy `.env.example` to `.env` and set `DATABASE_URL` to your connection
string:

```bash
cp .env.example .env
```

```
DATABASE_URL="postgresql://user:password@ep-example-000000.eu-central-1.aws.neon.tech/pmcopilot?sslmode=require"
```

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
2. Add the `DATABASE_URL` environment variable in the Vercel project settings,
   pointing at your Neon (or other Postgres) database.
3. Vercel runs `npm run build`, which does **not** run migrations
   automatically. Run `npx prisma migrate deploy` against the production
   database before or during your first deploy (e.g. via a one-off command,
   or add it to a build step) so the schema exists.
4. Optionally run `npm run db:seed` once against the production database if
   you want the demo projects there too.

## Project structure

```
prisma/
  schema.prisma        # data model (see below)
  seed.ts               # demo data — one project per framework
src/
  app/[locale]/         # all routes, locale-prefixed (next-intl)
    projects/[projectId]/
      initiating/       # charter, stakeholders
      planning/         # wbs, schedule, risks, budget
    actions/            # server actions (create/update/delete)
  components/
    ui/                 # shadcn-style primitives (button, card, dialog, ...)
    layout/             # topbar, project sidebar
    initiating/         # charter form, stakeholder matrix/table
    planning/           # WBS tree (dnd-kit), Gantt chart, risk/budget tables
  lib/
    validations/        # zod schemas
    prisma.ts, pm.ts, tree.ts, nav-config.ts
messages/
  de.json, en.json       # next-intl translation catalogs
```

## Data model

`Project` is the root record; every artifact belongs to one project via
`framework` (`PMBOK` | `PRINCE2` | `SCRUM`). Core PMBOK-generic models:
`Stakeholder`, `WorkPackage` (self-referencing tree with a separate
`WorkPackageDependency` join table for finish-to-start dependencies), `Risk`,
`Task`, `Issue`, `Assumption`, `Dependency`, `ChangeRequest`, `Decision` +
`ActionItem`, `Milestone`, `LessonLearned`, `ClosureChecklistItem`. PRINCE2
adds `BusinessCase`, `Prince2Tolerance`, `StageGate`; Scrum adds
`BacklogItem` and `Sprint`. See `prisma/schema.prisma` for the full schema.
