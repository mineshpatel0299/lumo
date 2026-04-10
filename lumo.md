# Project Management Tool — Complete Build Guide
> A Jira-killer built with Next.js 14, Hono, PostgreSQL, Prisma, Redis, Clerk, and AI (Claude API).
> Follow phase by phase. Each phase is self-contained and deployable.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Clerk Auth Architecture](#clerk-auth-architecture)
3. [Premium UI Design System](#premium-ui-design-system)
4. [Monorepo Structure](#monorepo-structure)
5. [Full File & Folder Structure](#full-file--folder-structure)
   - [Frontend — apps/web](#frontend--appsweb)
   - [Backend — apps/api](#backend--appsapi)
   - [Shared Packages](#shared-packages)
6. [Database Schema](#database-schema)
   - [Domain 1 — Users & Workspaces (Clerk-synced)](#domain-1--users--workspaces-clerk-synced)
   - [Domain 2 — Projects, Issues & Sprints](#domain-2--projects-issues--sprints)
   - [Domain 3 — Comments, Activity & Notifications](#domain-3--comments-activity--notifications)
   - [Domain 4 — Analytics, Integrations & AI](#domain-4--analytics-integrations--ai)
   - [Prisma Schema (Full)](#prisma-schema-full)
   - [Database Indexes](#database-indexes)
7. [Phase-by-Phase Build Plan](#phase-by-phase-build-plan)
   - [Phase 1 — Foundation & Architecture](#phase-1--foundation--architecture)
   - [Phase 2 — Clerk Auth, Workspaces & Onboarding](#phase-2--clerk-auth-workspaces--onboarding)
   - [Phase 3 — Issues, Boards & Core PM Features](#phase-3--issues-boards--core-pm-features)
   - [Phase 4 — Sprints, Roadmap & Timeline](#phase-4--sprints-roadmap--timeline)
   - [Phase 5 — Dashboards, Reporting & Analytics](#phase-5--dashboards-reporting--analytics)
   - [Phase 6 — Notifications, Integrations & AI](#phase-6--notifications-integrations--ai)
   - [Phase 7 — Polish, Performance & Deployment](#phase-7--polish-performance--deployment)
8. [Environment Variables](#environment-variables)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS v3 |
| UI Library | shadcn/ui + Radix UI primitives |
| UI Animations | Framer Motion |
| Icons | Lucide React + custom SVG sprite |
| Fonts | Geist Sans + Geist Mono (Vercel) |
| State | Zustand (global UI), TanStack Query v5 (server state) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Rich Text | Tiptap v2 (ProseMirror) |
| Auth | Clerk (sign-in, sign-up, MFA, org management) |
| Backend | Node.js + Hono v4 |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma v5 |
| Cache / Queue | Redis (ioredis) + BullMQ |
| Real-time | Socket.io v4 |
| Search | Meilisearch |
| File Storage | Cloudflare R2 (S3-compatible) |
| Email | Resend |
| AI | Claude API (claude-sonnet-4-20250514) |
| Monorepo | Turborepo + bun workspaces |
| CI/CD | GitHub Actions |
| Deploy (FE) | Vercel |
| Deploy (API) | Fly.io |
| Deploy (DB) | Neon (serverless PostgreSQL) |
| Deploy (Redis) | Upstash |
| Monitoring | Sentry + PostHog + Betterstack |

---

## Clerk Auth Architecture

> Clerk replaces ALL custom auth. No JWT logic, no bcrypt, no OTP tables, no session management. Clerk handles sign-in, sign-up, MFA, social OAuth, magic links, and session rotation out of the box.

### How Clerk integrates

```
Browser                  Next.js (Edge)             Hono API
   |                          |                         |
   |  -- Clerk SignIn UI -->  |                         |
   |  (embedded component)    |                         |
   |                          |                         |
   |  <- Clerk session cookie |                         |
   |                          |                         |
   |  -- API request -------> |  middleware.ts           |
   |  (with __session cookie) |  clerkMiddleware()       |
   |                          |  validates JWT           |
   |                          | -- auth header --------> |
   |                          |  (Bearer Clerk JWT)      |
   |                          |                          | verifyToken()
   |                          |                          | extract clerkUserId
   |                          |                          | lookup local user
```

### Key Clerk SDK pieces used

| Concept | Usage |
|---|---|
| @clerk/nextjs | Frontend SDK — ClerkProvider, useUser, useAuth |
| clerkMiddleware() | Next.js edge middleware — protects all dashboard routes |
| auth() | Server component helper — gets current user in RSC |
| currentUser() | Full user object in server components |
| Clerk Webhooks | Sync user creates/updates to our users table in Neon |
| svix | Verify Clerk webhook signatures on the API |
| @clerk/backend | Hono middleware uses verifyToken() to validate JWTs |

### User sync strategy

Clerk is the source of truth for identity. Our database mirrors user data via webhooks.

```
Clerk event: user.created
      |
      v
POST /webhooks/clerk  (Hono route, verified with svix)
      |
      v
Upsert user in Neon DB
  users table <- clerk_id, email, name, avatar_url
      |
      v
Create default notification preferences
```

Fields in our DB: clerk_id (reference key), email, name, avatar_url, timezone, last_active_at.
No passwords. No sessions. No OTP codes. All owned by Clerk.

### Tables removed (no longer needed with Clerk)

- sessions — Clerk manages all sessions
- otp_codes — Clerk handles MFA and magic links
- password_hash field on users — Clerk owns credentials

---

## Premium UI Design System

> The UI is built to feel like a premium native app. Think Linear.app meets Vercel Dashboard. Dark-first, monochrome base, single accent color, purposeful motion.

### Core design principles

| Principle | Implementation |
|---|---|
| Speed | Optimistic updates everywhere, skeleton loaders, instant navigation |
| Density | Compact by default, comfortable on toggle |
| Dark-first | Dark mode is the primary design target |
| Motion | Purposeful micro-animations — functional, not decorative |
| Monochrome base | Zinc palette, single violet accent color |

### Design token system

```css
/* src/styles/tokens.css */
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', monospace;
  --duration-fast: 100ms;
  --duration-base: 150ms;
  --duration-slow: 250ms;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
}

.dark {
  --bg-base: #09090b;
  --bg-surface: #18181b;
  --bg-elevated: #27272a;
  --border-subtle: #27272a;
  --border-default: #3f3f46;
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;
  --accent: #7c3aed;
  --accent-hover: #6d28d9;
  --accent-muted: #2e1065;
}
```

### Tailwind config additions

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      keyframes: {
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 250ms var(--ease-smooth)',
        'fade-up': 'fade-up 200ms var(--ease-smooth)',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
}
```

### shadcn/ui component rules

All shadcn components are overridden in components/ui/ with these rules:

- Buttons: 3 variants — default (violet filled), secondary (zinc surface), ghost (transparent hover). Heights: 32px sm, 36px default, 40px lg.
- Cards: bg-zinc-900 border border-zinc-800 — no drop shadows, flat surfaces only.
- Inputs: bg-zinc-950 border-zinc-800 focus:border-violet-500 — ring on focus.
- Dropdowns: backdrop-blur-sm on dark surfaces.
- Toasts: Bottom-right, Sonner with dark theme override.
- Modals: Framer Motion AnimatePresence — slide up + fade in.
- Tooltips: 150ms delay, 8px offset, no arrow — minimal.

### Premium custom components

| Component | Description |
|---|---|
| command-palette.tsx | Full-screen cmdk overlay with fuzzy search + keyboard nav |
| issue-card.tsx | Compact kanban card — priority dot, assignee ring, label pills |
| activity-feed.tsx | GitHub-style timeline with per-event-type icons |
| presence-avatars.tsx | Stack of avatars for who is currently viewing |
| gantt-chart.tsx | Custom canvas renderer — no lib, pixel-perfect |
| burndown-chart.tsx | Recharts with custom tooltip + gradient fill |
| ai-panel.tsx | Slide-in drawer with streaming markdown, syntax highlighting |
| virtual-issue-list.tsx | TanStack Virtual — 10,000 issues at 60fps |

---

## Monorepo Structure

```
project-mgmt/                    <- monorepo root
├── turbo.json                   <- turborepo pipeline
├── bun-workspace.yaml          <- workspace config
├── package.json                 <- root scripts
├── .env.example                 <- env template
├── docker-compose.yml           <- redis + meilisearch (no postgres, using Neon)
├── .gitignore
├── README.md
├── .github/
│   └── workflows/
│       ├── ci.yml               <- lint + test + build on PR
│       ├── deploy-web.yml       <- Vercel deploy on main
│       └── deploy-api.yml       <- Fly.io deploy on main
├── apps/
│   ├── web/                     <- Next.js 14 + Clerk + shadcn
│   └── api/                     <- Hono REST API + WebSocket
└── packages/
    ├── db/                      <- Prisma + Neon connection
    ├── types/                   <- shared TypeScript interfaces
    ├── ui/                      <- shared components (future)
    └── config/                  <- ESLint, TSConfig, Tailwind presets
```

---

## Full File & Folder Structure

### Frontend — apps/web

```
apps/web/
├── package.json
├── next.config.ts
├── tailwind.config.ts           <- zinc/violet theme + shadcn tokens
├── components.json              <- shadcn/ui CLI config
├── tsconfig.json
├── .env.local
├── middleware.ts                <- clerkMiddleware() route protection
├── public/
│   ├── icons/                   <- SVG icon sprites
│   └── fonts/                   <- Geist font files
└── src/
    ├── app/
    │   ├── layout.tsx           <- root layout + ClerkProvider + ThemeProvider
    │   ├── not-found.tsx
    │   ├── error.tsx
    │   │
    │   ├── (auth)/              <- Clerk-handled auth routes
    │   │   ├── sign-in/
    │   │   │   └── [[...sign-in]]/
    │   │   │       └── page.tsx <- Clerk <SignIn /> with custom appearance
    │   │   └── sign-up/
    │   │       └── [[...sign-up]]/
    │   │           └── page.tsx <- Clerk <SignUp /> with custom appearance
    │   │
    │   ├── onboarding/
    │   │   └── page.tsx         <- 3-step wizard shown once post sign-up
    │   │
    │   └── (dashboard)/
    │       ├── layout.tsx       <- sidebar + topbar shell
    │       └── [workspaceSlug]/
    │           ├── page.tsx     <- workspace home / activity feed
    │           ├── loading.tsx
    │           ├── projects/
    │           │   ├── page.tsx
    │           │   └── [projectId]/
    │           │       ├── layout.tsx       <- project sub-nav
    │           │       ├── board/page.tsx   <- kanban
    │           │       ├── list/page.tsx    <- table view
    │           │       ├── timeline/page.tsx <- gantt
    │           │       ├── backlog/page.tsx  <- sprint backlog
    │           │       ├── roadmap/page.tsx  <- epic roadmap
    │           │       └── settings/page.tsx
    │           ├── issues/[issueId]/page.tsx
    │           ├── my-issues/page.tsx
    │           ├── inbox/page.tsx
    │           ├── analytics/page.tsx
    │           └── settings/
    │               ├── general/page.tsx
    │               ├── members/page.tsx
    │               ├── billing/page.tsx
    │               ├── integrations/page.tsx
    │               └── api-keys/page.tsx
    │
    ├── components/
    │   ├── ui/                              <- shadcn overrides + custom primitives
    │   │   ├── button.tsx                   <- default/secondary/ghost/destructive
    │   │   ├── badge.tsx                    <- status, priority, label badges
    │   │   ├── avatar.tsx                   <- Clerk avatar + initials fallback
    │   │   ├── avatar-group.tsx             <- presence avatar stack
    │   │   ├── dialog.tsx                   <- Framer Motion animated modal
    │   │   ├── drawer.tsx                   <- Vaul slide-in panel
    │   │   ├── dropdown-menu.tsx            <- Radix + blur backdrop
    │   │   ├── tooltip.tsx                  <- 150ms delay, minimal
    │   │   ├── popover.tsx
    │   │   ├── select.tsx                   <- cmdk searchable combobox
    │   │   ├── input.tsx                    <- zinc-950 bg, violet focus ring
    │   │   ├── textarea.tsx
    │   │   ├── checkbox.tsx                 <- violet accent
    │   │   ├── switch.tsx
    │   │   ├── progress.tsx
    │   │   ├── skeleton.tsx                 <- shimmer animation
    │   │   ├── spinner.tsx
    │   │   ├── toast.tsx                    <- Sonner dark theme
    │   │   ├── kbd.tsx                      <- keyboard shortcut display
    │   │   ├── empty-state.tsx
    │   │   ├── separator.tsx                <- zinc-800
    │   │   ├── scroll-area.tsx
    │   │   ├── card.tsx                     <- zinc-900 flat card
    │   │   ├── context-menu.tsx
    │   │   └── virtual-list.tsx
    │   │
    │   ├── layout/
    │   │   ├── sidebar.tsx                  <- collapsible, zinc-950 bg
    │   │   ├── sidebar-item.tsx             <- active indicator bar
    │   │   ├── sidebar-project-list.tsx     <- pinned projects, color dots
    │   │   ├── topbar.tsx                   <- workspace switcher + Cmd+K
    │   │   ├── workspace-switcher.tsx
    │   │   ├── command-palette.tsx          <- cmdk full-screen overlay
    │   │   ├── notification-bell.tsx        <- animated unread badge
    │   │   ├── notification-panel.tsx       <- grouped drawer
    │   │   ├── user-button.tsx              <- Clerk <UserButton /> wrapper
    │   │   ├── theme-toggle.tsx
    │   │   └── breadcrumb.tsx
    │   │
    │   ├── issues/
    │   │   ├── issue-card.tsx               <- kanban card, dnd-kit draggable
    │   │   ├── issue-row.tsx                <- list view row
    │   │   ├── issue-detail-panel.tsx       <- Framer Motion slide-in
    │   │   ├── issue-form.tsx               <- create/edit with all metadata
    │   │   ├── issue-list.tsx               <- TanStack Virtual grouped list
    │   │   ├── issue-filters.tsx
    │   │   ├── issue-sort.tsx
    │   │   ├── issue-group-header.tsx
    │   │   ├── issue-title-input.tsx        <- inline editable
    │   │   ├── priority-icon.tsx            <- colored dot icons
    │   │   ├── status-select.tsx            <- category colors
    │   │   ├── label-picker.tsx
    │   │   ├── assignee-picker.tsx          <- Clerk avatar + name
    │   │   ├── due-date-picker.tsx          <- overdue red highlight
    │   │   ├── estimate-input.tsx
    │   │   ├── subtask-list.tsx             <- progress ring
    │   │   ├── activity-feed.tsx            <- GitHub-style timeline
    │   │   ├── attachment-list.tsx          <- R2 file grid + preview
    │   │   ├── presence-avatars.tsx         <- who is viewing now
    │   │   └── relation-picker.tsx
    │   │
    │   ├── board/
    │   │   ├── kanban-board.tsx             <- dnd-kit DndContext root
    │   │   ├── kanban-column.tsx            <- droppable + WIP limit
    │   │   ├── kanban-column-header.tsx     <- status dot + name + count
    │   │   └── kanban-card-ghost.tsx        <- drag overlay ghost
    │   │
    │   ├── timeline/
    │   │   ├── gantt-chart.tsx              <- custom canvas (no lib)
    │   │   ├── gantt-row.tsx
    │   │   ├── gantt-header.tsx             <- date ruler
    │   │   ├── gantt-dependency-arrow.tsx   <- SVG arrows
    │   │   ├── gantt-zoom-controls.tsx      <- pill switcher
    │   │   └── gantt-today-marker.tsx
    │   │
    │   ├── sprint/
    │   │   ├── sprint-header.tsx            <- mini burndown sparkline
    │   │   ├── sprint-create-modal.tsx
    │   │   ├── sprint-complete-modal.tsx
    │   │   └── sprint-backlog.tsx
    │   │
    │   ├── editor/
    │   │   ├── rich-text-editor.tsx         <- Tiptap + floating toolbar
    │   │   ├── editor-toolbar.tsx
    │   │   ├── mention-list.tsx
    │   │   ├── slash-commands.tsx
    │   │   └── code-block.tsx               <- syntax highlighted
    │   │
    │   ├── comments/
    │   │   ├── comment-thread.tsx           <- optimistic updates
    │   │   ├── comment-item.tsx             <- Clerk avatar + reactions
    │   │   └── comment-input.tsx
    │   │
    │   ├── analytics/
    │   │   ├── dashboard-grid.tsx           <- react-grid-layout
    │   │   ├── dashboard-widget.tsx         <- draggable with config
    │   │   ├── burndown-chart.tsx           <- gradient fill
    │   │   ├── velocity-chart.tsx
    │   │   ├── cumulative-flow.tsx
    │   │   ├── issues-by-assignee.tsx       <- Clerk avatars in chart
    │   │   ├── cycle-time-histogram.tsx
    │   │   └── open-closed-trend.tsx
    │   │
    │   ├── ai/
    │   │   ├── ai-panel.tsx                 <- streaming + syntax hl
    │   │   ├── ai-message.tsx
    │   │   └── ai-suggestions.tsx           <- one-click add chips
    │   │
    │   └── settings/
    │       ├── member-row.tsx               <- Clerk avatar + role
    │       ├── invite-form.tsx
    │       ├── integration-card.tsx
    │       └── danger-zone.tsx
    │
    ├── hooks/
    │   ├── use-workspace.ts
    │   ├── use-projects.ts
    │   ├── use-issues.ts                    <- optimistic mutations
    │   ├── use-issue-filters.ts             <- URL-synced (nuqs)
    │   ├── use-sprints.ts
    │   ├── use-members.ts
    │   ├── use-notifications.ts
    │   ├── use-comments.ts
    │   ├── use-analytics.ts
    │   ├── use-realtime.ts                  <- Socket.io subscription
    │   ├── use-command-palette.ts
    │   ├── use-drag-drop.ts
    │   ├── use-keyboard-shortcuts.ts        <- useHotkeys
    │   ├── use-upload.ts                    <- R2 presigned
    │   ├── use-clerk-user.ts                <- sync Clerk -> Zustand
    │   ├── use-debounce.ts
    │   ├── use-local-storage.ts
    │   └── use-media-query.ts
    │
    ├── store/
    │   ├── workspace.store.ts
    │   ├── issue.store.ts                   <- panel state + selection
    │   ├── ui.store.ts                      <- sidebar, density, theme
    │   ├── notification.store.ts
    │   └── ai.store.ts
    │
    ├── lib/
    │   ├── api-client.ts                    <- typed fetch with Clerk JWT
    │   ├── socket.ts                        <- Socket.io + Clerk auth
    │   ├── query-client.ts
    │   ├── clerk.ts                         <- Clerk server helpers
    │   ├── utils.ts
    │   ├── cn.ts
    │   ├── date.ts
    │   ├── constants.ts
    │   └── validators.ts
    │
    ├── styles/
    │   ├── globals.css
    │   └── tokens.css                       <- design tokens (see above)
    │
    └── types/
        ├── clerk.d.ts                       <- session augmentation
        └── env.d.ts
```

---

### Backend — apps/api

```
apps/api/
├── package.json
├── tsconfig.json
├── .env
├── Dockerfile
├── fly.toml
└── src/
    ├── index.ts
    ├── app.ts
    │
    ├── routes/
    │   ├── index.ts
    │   ├── webhook.routes.ts                <- Clerk + GitHub + Slack
    │   ├── workspace.routes.ts
    │   ├── project.routes.ts
    │   ├── issue.routes.ts
    │   ├── sprint.routes.ts
    │   ├── comment.routes.ts
    │   ├── member.routes.ts
    │   ├── notification.routes.ts
    │   ├── analytics.routes.ts
    │   ├── upload.routes.ts                 <- presigned R2 URL
    │   ├── search.routes.ts
    │   ├── ai.routes.ts
    │   └── health.routes.ts
    │
    ├── controllers/
    │   ├── webhook.controller.ts            <- Clerk user sync
    │   ├── workspace.controller.ts
    │   ├── project.controller.ts
    │   ├── issue.controller.ts
    │   ├── sprint.controller.ts
    │   ├── comment.controller.ts
    │   ├── member.controller.ts
    │   ├── notification.controller.ts
    │   ├── analytics.controller.ts
    │   ├── upload.controller.ts
    │   ├── search.controller.ts
    │   └── ai.controller.ts
    │
    ├── services/
    │   ├── clerk-sync.service.ts            <- upsert user on webhook
    │   ├── workspace.service.ts
    │   ├── project.service.ts
    │   ├── issue.service.ts
    │   ├── sprint.service.ts
    │   ├── comment.service.ts
    │   ├── member.service.ts
    │   ├── notification.service.ts
    │   ├── analytics.service.ts
    │   ├── email.service.ts
    │   ├── storage.service.ts               <- R2 presigned ops
    │   ├── search.service.ts
    │   ├── ai.service.ts                    <- Claude API
    │   ├── github.service.ts
    │   ├── slack.service.ts
    │   └── activity.service.ts
    │
    ├── middleware/
    │   ├── clerk-auth.middleware.ts         <- verifyToken() from @clerk/backend
    │   ├── rbac.middleware.ts
    │   ├── workspace.middleware.ts
    │   ├── rate-limit.middleware.ts
    │   ├── validate.middleware.ts
    │   ├── logger.middleware.ts
    │   ├── error.middleware.ts
    │   └── cors.middleware.ts
    │
    ├── validators/
    │   ├── workspace.schema.ts
    │   ├── project.schema.ts
    │   ├── issue.schema.ts
    │   ├── sprint.schema.ts
    │   ├── comment.schema.ts
    │   ├── member.schema.ts
    │   └── analytics.schema.ts
    │
    ├── jobs/
    │   ├── queue.ts
    │   ├── worker.ts
    │   ├── analytics.job.ts
    │   ├── notification.job.ts
    │   ├── email-digest.job.ts
    │   └── search-index.job.ts
    │
    ├── events/
    │   ├── emitter.ts
    │   ├── issue.events.ts
    │   ├── comment.events.ts
    │   └── sprint.events.ts
    │
    ├── socket/
    │   ├── socket.server.ts                <- Clerk JWT auth guard
    │   ├── issue.socket.ts
    │   ├── notification.socket.ts
    │   └── presence.socket.ts
    │
    ├── lib/
    │   ├── prisma.ts                       <- PrismaClient + Neon adapter
    │   ├── redis.ts
    │   ├── meilisearch.ts
    │   ├── r2.ts                           <- Cloudflare R2
    │   ├── resend.ts
    │   └── anthropic.ts
    │
    ├── types/
    │   ├── context.ts                      <- Hono context with clerkUserId
    │   ├── env.ts
    │   └── pagination.ts
    │
    ├── utils/
    │   ├── slugify.ts
    │   ├── issue-id.ts
    │   ├── pagination.ts
    │   └── permissions.ts
    │
    └── tests/
        ├── unit/
        │   ├── issue.service.test.ts
        │   ├── sprint.service.test.ts
        │   └── clerk-sync.service.test.ts
        ├── integration/
        │   ├── issue.routes.test.ts
        │   └── webhook.routes.test.ts
        └── setup.ts
```

---

### Shared Packages

```
packages/
├── db/
│   ├── prisma/
│   │   ├── schema.prisma              <- Clerk-adapted, no sessions/OTP
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── index.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── types/
│   ├── src/
│   │   ├── user.types.ts              <- User (no password fields)
│   │   ├── workspace.types.ts
│   │   ├── project.types.ts
│   │   ├── issue.types.ts
│   │   ├── sprint.types.ts
│   │   ├── comment.types.ts
│   │   ├── notification.types.ts
│   │   ├── analytics.types.ts
│   │   ├── api.types.ts
│   │   ├── socket.types.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── ui/
│   ├── package.json
│   └── index.ts
│
└── config/
    ├── eslint-base.js
    ├── tsconfig-base.json
    ├── tailwind-base.ts
    └── prettier.config.js
```

---

## Database Schema

> Clerk integration: The users table no longer stores passwords, sessions, or OTP codes. clerk_id is the reference key. Clerk webhooks keep the table in sync.

### Domain 1 — Users & Workspaces (Clerk-synced)

#### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, internal DB ID |
| `clerk_id` | `varchar(255)` | UNIQUE — Clerk user ID (user_2abc...) |
| `email` | `varchar(255)` | UNIQUE, synced from Clerk |
| `name` | `varchar(100)` | Synced from Clerk |
| `avatar_url` | `text` | Clerk profile image URL |
| `timezone` | `varchar(50)` | Default UTC |
| `last_active_at` | `timestamptz` | Updated on API requests |
| `created_at` | `timestamptz` | Synced from Clerk |
| `updated_at` | `timestamptz` | Auto-updated |

> No password_hash, sessions, or otp_codes — all handled by Clerk.

#### `workspaces`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `varchar(100)` | NOT NULL |
| `slug` | `varchar(50)` | UNIQUE, URL-safe |
| `logo_url` | `text` | R2 URL |
| `plan` | `enum` | `free`, `pro`, `business`, `enterprise` |
| `member_limit` | `integer` | Based on plan |
| `settings` | `jsonb` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `workspace_members`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `workspace_id` | `uuid` | FK -> workspaces |
| `user_id` | `uuid` | FK -> users |
| `role` | `enum` | `owner`, `admin`, `member`, `viewer` |
| `joined_at` | `timestamptz` | |

> UNIQUE on (workspace_id, user_id)

#### `workspace_invites`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `workspace_id` | `uuid` | FK -> workspaces |
| `invited_by` | `uuid` | FK -> users |
| `email` | `varchar(255)` | NOT NULL |
| `role` | `enum` | Role on accept |
| `token` | `varchar(255)` | UNIQUE, signed |
| `expires_at` | `timestamptz` | 7 days |
| `accepted` | `boolean` | Default false |
| `created_at` | `timestamptz` | |

---

### Domain 2 — Projects, Issues & Sprints

#### `projects`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `workspace_id` | `uuid` | FK -> workspaces |
| `name` | `varchar(100)` | NOT NULL |
| `slug` | `varchar(20)` | UNIQUE per workspace |
| `description` | `text` | |
| `icon` | `varchar(10)` | Emoji |
| `color` | `varchar(7)` | Hex |
| `status` | `enum` | `active`, `archived` |
| `default_assignee_id` | `uuid` | FK -> users, nullable |
| `custom_fields_schema` | `jsonb` | Custom field definitions |
| `archived_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `project_statuses`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `project_id` | `uuid` | FK -> projects |
| `name` | `varchar(50)` | e.g. In Review, QA |
| `color` | `varchar(7)` | Hex |
| `category` | `enum` | `backlog`, `unstarted`, `started`, `completed`, `cancelled` |
| `position` | `integer` | Sort order |
| `is_default` | `boolean` | Default for new issues |

#### `labels`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `workspace_id` | `uuid` | FK -> workspaces |
| `project_id` | `uuid` | FK -> projects, nullable |
| `name` | `varchar(50)` | NOT NULL |
| `color` | `varchar(7)` | Hex |
| `created_at` | `timestamptz` | |

#### `sprints`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `project_id` | `uuid` | FK -> projects |
| `name` | `varchar(100)` | |
| `goal` | `text` | |
| `status` | `enum` | `planned`, `active`, `completed` |
| `start_date` | `date` | |
| `end_date` | `date` | |
| `completed_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

#### `issues`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `identifier` | `varchar(20)` | UNIQUE, e.g. TEA-123 |
| `project_id` | `uuid` | FK -> projects |
| `workspace_id` | `uuid` | FK -> workspaces (denormalized) |
| `sprint_id` | `uuid` | FK -> sprints, nullable |
| `parent_id` | `uuid` | Self-FK (sub-tasks) |
| `creator_id` | `uuid` | FK -> users |
| `assignee_id` | `uuid` | FK -> users, nullable |
| `status_id` | `uuid` | FK -> project_statuses |
| `title` | `varchar(500)` | NOT NULL |
| `description` | `jsonb` | Tiptap JSON document |
| `priority` | `enum` | `urgent`, `high`, `medium`, `low`, `no_priority` |
| `estimate` | `integer` | Story points |
| `sort_order` | `float8` | Fractional indexing |
| `due_date` | `date` | |
| `started_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | |
| `cancelled_at` | `timestamptz` | |
| `custom_fields` | `jsonb` | Custom field values |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `issue_labels` (join table)
| Column | Type | Notes |
|---|---|---|
| `issue_id` | `uuid` | FK -> issues |
| `label_id` | `uuid` | FK -> labels |

> PK: (issue_id, label_id)

#### `issue_relations`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `from_issue_id` | `uuid` | FK -> issues |
| `to_issue_id` | `uuid` | FK -> issues |
| `type` | `enum` | `blocks`, `is_blocked_by`, `duplicates`, `is_duplicated_by`, `relates_to` |
| `created_at` | `timestamptz` | |

---

### Domain 3 — Comments, Activity & Notifications

#### `comments`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `issue_id` | `uuid` | FK -> issues |
| `author_id` | `uuid` | FK -> users |
| `parent_id` | `uuid` | Self-FK, nullable |
| `body` | `jsonb` | Tiptap JSON |
| `edited` | `boolean` | Default false |
| `edited_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `comment_reactions`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `comment_id` | `uuid` | FK -> comments |
| `user_id` | `uuid` | FK -> users |
| `emoji` | `varchar(10)` | |
| `created_at` | `timestamptz` | |

> UNIQUE on (comment_id, user_id, emoji)

#### `activity_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `issue_id` | `uuid` | FK -> issues |
| `actor_id` | `uuid` | FK -> users |
| `event_type` | `enum` | `created`, `status_changed`, `assigned`, `priority_changed`, `title_changed`, `comment_added`, `attachment_added`, `sprint_changed`, `label_added`, `label_removed`, `estimate_changed`, `due_date_changed` |
| `field_name` | `varchar(50)` | |
| `old_value` | `jsonb` | |
| `new_value` | `jsonb` | |
| `created_at` | `timestamptz` | |

#### `attachments`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `issue_id` | `uuid` | FK -> issues |
| `uploaded_by` | `uuid` | FK -> users |
| `filename` | `varchar(255)` | |
| `storage_key` | `varchar(500)` | R2 key |
| `mime_type` | `varchar(100)` | |
| `size_bytes` | `integer` | |
| `url` | `text` | R2 public URL |
| `created_at` | `timestamptz` | |

#### `notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `recipient_id` | `uuid` | FK -> users |
| `actor_id` | `uuid` | FK -> users |
| `workspace_id` | `uuid` | FK -> workspaces |
| `type` | `enum` | `issue_assigned`, `issue_mentioned`, `issue_status_changed`, `comment_added`, `sprint_started`, `sprint_completed`, `invite_accepted` |
| `resource_id` | `uuid` | Related resource ID |
| `resource_type` | `varchar(50)` | `issue`, `comment`, `sprint` |
| `data` | `jsonb` | Rendering context |
| `read` | `boolean` | Default false |
| `read_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

#### `notification_preferences`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK -> users |
| `workspace_id` | `uuid` | FK -> workspaces |
| `issue_assigned` | `boolean` | Default true |
| `issue_mentioned` | `boolean` | Default true |
| `issue_status_changed` | `boolean` | Default false |
| `comment_added` | `boolean` | Default true |
| `sprint_started` | `boolean` | Default true |
| `email_digest` | `boolean` | Default true |
| `digest_frequency` | `enum` | `daily`, `weekly`, `never` |

> UNIQUE on (user_id, workspace_id)

#### `issue_watchers`
| Column | Type | Notes |
|---|---|---|
| `issue_id` | `uuid` | FK -> issues |
| `user_id` | `uuid` | FK -> users |
| `created_at` | `timestamptz` | |

> PK: (issue_id, user_id)

---

### Domain 4 — Analytics, Integrations & AI

#### `analytics_snapshots`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `project_id` | `uuid` | FK -> projects |
| `sprint_id` | `uuid` | FK -> sprints, nullable |
| `snapshot_date` | `date` | NOT NULL |
| `metric_type` | `enum` | `burndown`, `velocity`, `cumulative_flow`, `cycle_time`, `throughput` |
| `data` | `jsonb` | Pre-computed payload |
| `computed_at` | `timestamptz` | |

> UNIQUE on (project_id, sprint_id, snapshot_date, metric_type)

#### `dashboard_widgets`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `workspace_id` | `uuid` | FK -> workspaces |
| `user_id` | `uuid` | FK -> users |
| `widget_type` | `varchar(50)` | Chart type |
| `grid_x` | `integer` | |
| `grid_y` | `integer` | |
| `grid_w` | `integer` | |
| `grid_h` | `integer` | |
| `config` | `jsonb` | Filters, date range |
| `created_at` | `timestamptz` | |

#### `integrations`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `workspace_id` | `uuid` | FK -> workspaces |
| `provider` | `enum` | `github`, `slack`, `figma` |
| `access_token` | `text` | Encrypted at rest |
| `refresh_token` | `text` | Encrypted at rest |
| `external_id` | `varchar(255)` | |
| `metadata` | `jsonb` | |
| `active` | `boolean` | Default true |
| `token_expires_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

#### `github_pr_links`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `issue_id` | `uuid` | FK -> issues |
| `integration_id` | `uuid` | FK -> integrations |
| `pr_number` | `varchar(20)` | |
| `pr_url` | `text` | |
| `repo_full_name` | `varchar(255)` | |
| `head_branch` | `varchar(255)` | |
| `pr_status` | `enum` | `open`, `closed`, `merged`, `draft` |
| `merged_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

#### `webhook_events`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `workspace_id` | `uuid` | FK -> workspaces, nullable (Clerk events are global) |
| `provider` | `enum` | `clerk`, `github`, `slack` |
| `event_type` | `varchar(100)` | |
| `payload` | `jsonb` | Raw body |
| `status` | `enum` | `pending`, `processed`, `failed` |
| `retry_count` | `integer` | Default 0 |
| `error_message` | `text` | |
| `processed_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

#### `ai_interactions`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `workspace_id` | `uuid` | FK -> workspaces |
| `user_id` | `uuid` | FK -> users |
| `issue_id` | `uuid` | FK -> issues, nullable |
| `feature` | `enum` | `subtask_generation`, `sprint_summary`, `priority_suggestion`, `issue_labeling`, `chat` |
| `model` | `varchar(50)` | e.g. claude-sonnet-4-20250514 |
| `input_tokens` | `integer` | |
| `output_tokens` | `integer` | |
| `latency_ms` | `integer` | |
| `created_at` | `timestamptz` | |

#### `api_keys`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `workspace_id` | `uuid` | FK -> workspaces |
| `created_by` | `uuid` | FK -> users |
| `name` | `varchar(100)` | |
| `key_hash` | `varchar(255)` | SHA-256 |
| `key_prefix` | `varchar(10)` | First 8 chars shown in UI |
| `scopes` | `jsonb` | Permission scopes |
| `last_used_at` | `timestamptz` | |
| `expires_at` | `timestamptz` | Nullable = never expires |
| `created_at` | `timestamptz` | |

---

### Prisma Schema (Full)

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum WorkspacePlan {
  free
  pro
  business
  enterprise
}

enum MemberRole {
  owner
  admin
  member
  viewer
}

enum StatusCategory {
  backlog
  unstarted
  started
  completed
  cancelled
}

enum IssuePriority {
  urgent
  high
  medium
  low
  no_priority
}

enum SprintStatus {
  planned
  active
  completed
}

enum IssueRelationType {
  blocks
  is_blocked_by
  duplicates
  is_duplicated_by
  relates_to
}

enum ActivityEventType {
  created
  status_changed
  assigned
  priority_changed
  title_changed
  comment_added
  attachment_added
  sprint_changed
  label_added
  label_removed
  estimate_changed
  due_date_changed
}

enum NotificationType {
  issue_assigned
  issue_mentioned
  issue_status_changed
  comment_added
  sprint_started
  sprint_completed
  invite_accepted
}

enum DigestFrequency {
  daily
  weekly
  never
}

enum AnalyticsMetricType {
  burndown
  velocity
  cumulative_flow
  cycle_time
  throughput
}

enum IntegrationProvider {
  github
  slack
  figma
}

enum PrStatus {
  open
  closed
  merged
  draft
}

enum WebhookStatus {
  pending
  processed
  failed
}

enum WebhookProvider {
  clerk
  github
  slack
}

enum AiFeature {
  subtask_generation
  sprint_summary
  priority_suggestion
  issue_labeling
  chat
}

model User {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clerkId      String    @unique @map("clerk_id") @db.VarChar(255)
  email        String    @unique @db.VarChar(255)
  name         String    @db.VarChar(100)
  avatarUrl    String?   @map("avatar_url")
  timezone     String    @default("UTC") @db.VarChar(50)
  lastActiveAt DateTime? @map("last_active_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  workspaceMembers  WorkspaceMember[]
  sentInvites       WorkspaceInvite[]
  createdIssues     Issue[]                  @relation("IssueCreator")
  assignedIssues    Issue[]                  @relation("IssueAssignee")
  comments          Comment[]
  activityLogs      ActivityLog[]
  notifications     Notification[]
  notificationPrefs NotificationPreference[]
  watchedIssues     IssueWatcher[]
  dashboardWidgets  DashboardWidget[]
  aiInteractions    AiInteraction[]
  apiKeys           ApiKey[]

  @@map("users")
}

model Workspace {
  id          String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String        @db.VarChar(100)
  slug        String        @unique @db.VarChar(50)
  logoUrl     String?       @map("logo_url")
  plan        WorkspacePlan @default(free)
  memberLimit Int           @default(5) @map("member_limit")
  settings    Json          @default("{}")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  members            WorkspaceMember[]
  invites            WorkspaceInvite[]
  projects           Project[]
  labels             Label[]
  issues             Issue[]
  notifications      Notification[]
  notificationPrefs  NotificationPreference[]
  analyticsSnapshots AnalyticsSnapshot[]
  dashboardWidgets   DashboardWidget[]
  integrations       Integration[]
  webhookEvents      WebhookEvent[]
  aiInteractions     AiInteraction[]
  apiKeys            ApiKey[]

  @@map("workspaces")
}

model WorkspaceMember {
  id          String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String     @map("workspace_id") @db.Uuid
  userId      String     @map("user_id") @db.Uuid
  role        MemberRole @default(member)
  joinedAt    DateTime   @default(now()) @map("joined_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@map("workspace_members")
}

model WorkspaceInvite {
  id          String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String     @map("workspace_id") @db.Uuid
  invitedBy   String     @map("invited_by") @db.Uuid
  email       String     @db.VarChar(255)
  role        MemberRole @default(member)
  token       String     @unique @db.VarChar(255)
  expiresAt   DateTime   @map("expires_at")
  accepted    Boolean    @default(false)
  createdAt   DateTime   @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  inviter   User      @relation(fields: [invitedBy], references: [id])

  @@map("workspace_invites")
}

model Project {
  id                 String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId        String    @map("workspace_id") @db.Uuid
  name               String    @db.VarChar(100)
  slug               String    @db.VarChar(20)
  description        String?
  icon               String?   @db.VarChar(10)
  color              String?   @db.VarChar(7)
  status             String    @default("active")
  defaultAssigneeId  String?   @map("default_assignee_id") @db.Uuid
  customFieldsSchema Json      @default("[]") @map("custom_fields_schema")
  archivedAt         DateTime? @map("archived_at")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  workspace          Workspace           @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  statuses           ProjectStatus[]
  labels             Label[]
  sprints            Sprint[]
  issues             Issue[]
  analyticsSnapshots AnalyticsSnapshot[]

  @@unique([workspaceId, slug])
  @@map("projects")
}

model ProjectStatus {
  id        String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId String         @map("project_id") @db.Uuid
  name      String         @db.VarChar(50)
  color     String         @db.VarChar(7)
  category  StatusCategory
  position  Int
  isDefault Boolean        @default(false) @map("is_default")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issues  Issue[]

  @@map("project_statuses")
}

model Label {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  projectId   String?  @map("project_id") @db.Uuid
  name        String   @db.VarChar(50)
  color       String   @db.VarChar(7)
  createdAt   DateTime @default(now()) @map("created_at")

  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  project     Project?     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issueLabels IssueLabel[]

  @@map("labels")
}

model Sprint {
  id          String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId   String       @map("project_id") @db.Uuid
  name        String       @db.VarChar(100)
  goal        String?
  status      SprintStatus @default(planned)
  startDate   DateTime?    @map("start_date") @db.Date
  endDate     DateTime?    @map("end_date") @db.Date
  completedAt DateTime?    @map("completed_at")
  createdAt   DateTime     @default(now()) @map("created_at")

  project            Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issues             Issue[]
  analyticsSnapshots AnalyticsSnapshot[]

  @@map("sprints")
}

model Issue {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  identifier   String        @unique @db.VarChar(20)
  projectId    String        @map("project_id") @db.Uuid
  workspaceId  String        @map("workspace_id") @db.Uuid
  sprintId     String?       @map("sprint_id") @db.Uuid
  parentId     String?       @map("parent_id") @db.Uuid
  creatorId    String        @map("creator_id") @db.Uuid
  assigneeId   String?       @map("assignee_id") @db.Uuid
  statusId     String        @map("status_id") @db.Uuid
  title        String        @db.VarChar(500)
  description  Json?
  priority     IssuePriority @default(no_priority)
  estimate     Int?
  sortOrder    Float         @default(0) @map("sort_order")
  dueDate      DateTime?     @map("due_date") @db.Date
  startedAt    DateTime?     @map("started_at")
  completedAt  DateTime?     @map("completed_at")
  cancelledAt  DateTime?     @map("cancelled_at")
  customFields Json          @default("{}") @map("custom_fields")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  project        Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  workspace      Workspace       @relation(fields: [workspaceId], references: [id])
  sprint         Sprint?         @relation(fields: [sprintId], references: [id])
  parent         Issue?          @relation("SubTasks", fields: [parentId], references: [id])
  subTasks       Issue[]         @relation("SubTasks")
  creator        User            @relation("IssueCreator", fields: [creatorId], references: [id])
  assignee       User?           @relation("IssueAssignee", fields: [assigneeId], references: [id])
  status         ProjectStatus   @relation(fields: [statusId], references: [id])
  labels         IssueLabel[]
  relations      IssueRelation[] @relation("FromIssue")
  relatedBy      IssueRelation[] @relation("ToIssue")
  comments       Comment[]
  activityLogs   ActivityLog[]
  attachments    Attachment[]
  watchers       IssueWatcher[]
  prLinks        GithubPrLink[]
  aiInteractions AiInteraction[]

  @@map("issues")
}

model IssueLabel {
  issueId String @map("issue_id") @db.Uuid
  labelId String @map("label_id") @db.Uuid

  issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  label Label @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([issueId, labelId])
  @@map("issue_labels")
}

model IssueRelation {
  id          String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  fromIssueId String            @map("from_issue_id") @db.Uuid
  toIssueId   String            @map("to_issue_id") @db.Uuid
  type        IssueRelationType
  createdAt   DateTime          @default(now()) @map("created_at")

  fromIssue Issue @relation("FromIssue", fields: [fromIssueId], references: [id], onDelete: Cascade)
  toIssue   Issue @relation("ToIssue", fields: [toIssueId], references: [id], onDelete: Cascade)

  @@map("issue_relations")
}

model Comment {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  issueId   String    @map("issue_id") @db.Uuid
  authorId  String    @map("author_id") @db.Uuid
  parentId  String?   @map("parent_id") @db.Uuid
  body      Json
  edited    Boolean   @default(false)
  editedAt  DateTime? @map("edited_at")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  issue     Issue             @relation(fields: [issueId], references: [id], onDelete: Cascade)
  author    User              @relation(fields: [authorId], references: [id])
  parent    Comment?          @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[]         @relation("CommentReplies")
  reactions CommentReaction[]

  @@map("comments")
}

model CommentReaction {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  commentId String   @map("comment_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  emoji     String   @db.VarChar(10)
  createdAt DateTime @default(now()) @map("created_at")

  comment Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([commentId, userId, emoji])
  @@map("comment_reactions")
}

model ActivityLog {
  id        String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  issueId   String            @map("issue_id") @db.Uuid
  actorId   String            @map("actor_id") @db.Uuid
  eventType ActivityEventType @map("event_type")
  fieldName String?           @map("field_name") @db.VarChar(50)
  oldValue  Json?             @map("old_value")
  newValue  Json?             @map("new_value")
  createdAt DateTime          @default(now()) @map("created_at")

  issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  actor User  @relation(fields: [actorId], references: [id])

  @@map("activity_logs")
}

model Attachment {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  issueId    String   @map("issue_id") @db.Uuid
  uploadedBy String   @map("uploaded_by") @db.Uuid
  filename   String   @db.VarChar(255)
  storageKey String   @map("storage_key") @db.VarChar(500)
  mimeType   String   @map("mime_type") @db.VarChar(100)
  sizeBytes  Int      @map("size_bytes")
  url        String
  createdAt  DateTime @default(now()) @map("created_at")

  issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)

  @@map("attachments")
}

model Notification {
  id           String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  recipientId  String           @map("recipient_id") @db.Uuid
  actorId      String           @map("actor_id") @db.Uuid
  workspaceId  String           @map("workspace_id") @db.Uuid
  type         NotificationType
  resourceId   String           @map("resource_id") @db.Uuid
  resourceType String           @map("resource_type") @db.VarChar(50)
  data         Json             @default("{}")
  read         Boolean          @default(false)
  readAt       DateTime?        @map("read_at")
  createdAt    DateTime         @default(now()) @map("created_at")

  recipient User      @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id])

  @@map("notifications")
}

model NotificationPreference {
  id                 String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId             String          @map("user_id") @db.Uuid
  workspaceId        String          @map("workspace_id") @db.Uuid
  issueAssigned      Boolean         @default(true) @map("issue_assigned")
  issueMentioned     Boolean         @default(true) @map("issue_mentioned")
  issueStatusChanged Boolean         @default(false) @map("issue_status_changed")
  commentAdded       Boolean         @default(true) @map("comment_added")
  sprintStarted      Boolean         @default(true) @map("sprint_started")
  emailDigest        Boolean         @default(true) @map("email_digest")
  digestFrequency    DigestFrequency @default(daily) @map("digest_frequency")

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@map("notification_preferences")
}

model IssueWatcher {
  issueId   String   @map("issue_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([issueId, userId])
  @@map("issue_watchers")
}

model AnalyticsSnapshot {
  id           String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId    String              @map("project_id") @db.Uuid
  sprintId     String?             @map("sprint_id") @db.Uuid
  snapshotDate DateTime            @map("snapshot_date") @db.Date
  metricType   AnalyticsMetricType @map("metric_type")
  data         Json
  computedAt   DateTime            @default(now()) @map("computed_at")

  project Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sprint  Sprint?  @relation(fields: [sprintId], references: [id])

  @@unique([projectId, sprintId, snapshotDate, metricType])
  @@map("analytics_snapshots")
}

model DashboardWidget {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  widgetType  String   @map("widget_type") @db.VarChar(50)
  gridX       Int      @map("grid_x")
  gridY       Int      @map("grid_y")
  gridW       Int      @map("grid_w")
  gridH       Int      @map("grid_h")
  config      Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("dashboard_widgets")
}

model Integration {
  id             String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId    String              @map("workspace_id") @db.Uuid
  provider       IntegrationProvider
  accessToken    String              @map("access_token")
  refreshToken   String?             @map("refresh_token")
  externalId     String?             @map("external_id") @db.VarChar(255)
  metadata       Json                @default("{}")
  active         Boolean             @default(true)
  tokenExpiresAt DateTime?           @map("token_expires_at")
  createdAt      DateTime            @default(now()) @map("created_at")

  workspace Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  prLinks   GithubPrLink[]

  @@map("integrations")
}

model GithubPrLink {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  issueId       String    @map("issue_id") @db.Uuid
  integrationId String    @map("integration_id") @db.Uuid
  prNumber      String    @map("pr_number") @db.VarChar(20)
  prUrl         String    @map("pr_url")
  repoFullName  String    @map("repo_full_name") @db.VarChar(255)
  headBranch    String    @map("head_branch") @db.VarChar(255)
  prStatus      PrStatus  @default(open) @map("pr_status")
  mergedAt      DateTime? @map("merged_at")
  createdAt     DateTime  @default(now()) @map("created_at")

  issue       Issue       @relation(fields: [issueId], references: [id], onDelete: Cascade)
  integration Integration @relation(fields: [integrationId], references: [id])

  @@map("github_pr_links")
}

model WebhookEvent {
  id           String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId  String?         @map("workspace_id") @db.Uuid
  provider     WebhookProvider
  eventType    String          @map("event_type") @db.VarChar(100)
  payload      Json
  status       WebhookStatus   @default(pending)
  retryCount   Int             @default(0) @map("retry_count")
  errorMessage String?         @map("error_message")
  processedAt  DateTime?       @map("processed_at")
  createdAt    DateTime        @default(now()) @map("created_at")

  workspace Workspace? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("webhook_events")
}

model AiInteraction {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId  String    @map("workspace_id") @db.Uuid
  userId       String    @map("user_id") @db.Uuid
  issueId      String?   @map("issue_id") @db.Uuid
  feature      AiFeature
  model        String    @db.VarChar(50)
  inputTokens  Int       @map("input_tokens")
  outputTokens Int       @map("output_tokens")
  latencyMs    Int       @map("latency_ms")
  createdAt    DateTime  @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  user      User      @relation(fields: [userId], references: [id])
  issue     Issue?    @relation(fields: [issueId], references: [id])

  @@map("ai_interactions")
}

model ApiKey {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String    @map("workspace_id") @db.Uuid
  createdBy   String    @map("created_by") @db.Uuid
  name        String    @db.VarChar(100)
  keyHash     String    @map("key_hash") @db.VarChar(255)
  keyPrefix   String    @map("key_prefix") @db.VarChar(10)
  scopes      Json      @default("[]")
  lastUsedAt  DateTime? @map("last_used_at")
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator   User      @relation(fields: [createdBy], references: [id])

  @@map("api_keys")
}
```

---

### Database Indexes

```sql
-- Issues
CREATE INDEX idx_issues_project_status ON issues(project_id, status_id);
CREATE INDEX idx_issues_assignee        ON issues(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_issues_sprint          ON issues(sprint_id) WHERE sprint_id IS NOT NULL;
CREATE INDEX idx_issues_parent          ON issues(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_issues_workspace       ON issues(workspace_id);
CREATE INDEX idx_issues_created_at      ON issues(created_at DESC);
CREATE INDEX idx_issues_sort_order      ON issues(project_id, sort_order);

-- Activity logs
CREATE INDEX idx_activity_issue_time    ON activity_logs(issue_id, created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_recip    ON notifications(recipient_id, read, created_at DESC);

-- Analytics
CREATE INDEX idx_analytics_lookup       ON analytics_snapshots(project_id, metric_type, snapshot_date DESC);

-- Comments
CREATE INDEX idx_comments_issue         ON comments(issue_id, created_at ASC);

-- Users: Clerk lookup
CREATE INDEX idx_users_clerk_id         ON users(clerk_id);

-- Full-text search fallback (if Meilisearch is down)
CREATE INDEX idx_issues_fts ON issues USING gin(to_tsvector('english', title));
```

---

## Phase-by-Phase Build Plan

---

### Phase 1 — Foundation & Architecture
**Duration:** Week 1–2 | **Stack:** Both

#### Goal
Set up the monorepo, premium UI shell, Neon connection, and shadcn design system.

#### Frontend Tasks
- [ ] Init Next.js 14 with App Router + TypeScript
- [ ] Install shadcn/ui (`npx shadcn@latest init`)
- [ ] Install Geist font via `geist` package + configure in root layout
- [ ] Configure Tailwind with zinc/violet design tokens in `tokens.css`
- [ ] Override shadcn components with premium dark theme
- [ ] Set up `cn.ts` (clsx + twMerge)
- [ ] Build app shell: collapsible sidebar (zinc-950) + topbar
- [ ] Add dark/light mode toggle with smooth transition (next-themes)
- [ ] Build Cmd+K command palette shell (cmdk)
- [ ] Add Framer Motion: page transitions, panel slide-in animations
- [ ] Set up Zustand stores (ui.store, workspace.store)
- [ ] Configure TanStack Query v5 with optimistic update defaults
- [ ] Build shimmer skeleton loaders for all major views
- [ ] Add keyboard shortcut system (react-hotkeys-hook)

#### Backend Tasks
- [ ] Init Hono v4 with TypeScript
- [ ] Set up middleware chain: cors → logger → error handler
- [ ] Connect Prisma to Neon using `DATABASE_URL` + `DIRECT_URL`
- [ ] Run first migration: `bun prisma migrate dev --name init`
- [ ] Connect Redis via Upstash (`lib/redis.ts`)
- [ ] Set up Zod typed env validation
- [ ] Create `/health` route
- [ ] Set up Docker Compose for Redis + Meilisearch local dev

#### Deliverable
Running monorepo with premium zinc/violet app shell, Neon DB connected, design system in place.

---

### Phase 2 — Clerk Auth, Workspaces & Onboarding
**Duration:** Week 2–3 | **Stack:** Both

#### Goal
Full Clerk authentication, user sync to Neon, and workspace creation.

#### Frontend Tasks
- [ ] Install `@clerk/nextjs`
- [ ] Wrap root layout with `<ClerkProvider>`
- [ ] Add `clerkMiddleware()` to `middleware.ts` — protect all `(dashboard)` routes
- [ ] Create `(auth)/sign-in/[[...sign-in]]/page.tsx` with Clerk `<SignIn />`
- [ ] Create `(auth)/sign-up/[[...sign-up]]/page.tsx` with Clerk `<SignUp />`
- [ ] Style Clerk components to match zinc/violet theme via `appearance` prop
- [ ] Build `use-clerk-user.ts` — sync Clerk user to Zustand on mount
- [ ] Build 3-step onboarding wizard (shown once post sign-up via Clerk metadata)
  - Step 1: Create workspace (name + slug validation)
  - Step 2: Invite teammates (email list with role select)
  - Step 3: Choose workflow template (Scrum / Kanban / Custom)
- [ ] Build workspace switcher with keyboard navigation
- [ ] Replace user menu with Clerk `<UserButton />` wrapper
- [ ] Build `/accept-invite` page with invite token validation
- [ ] Update `lib/api-client.ts` — attach Clerk Bearer JWT to every request

#### Backend Tasks
- [ ] Install `@clerk/backend` + `svix`
- [ ] Build `clerk-auth.middleware.ts` — `verifyToken()`, extract `clerkUserId`, resolve to local user
- [ ] Build `POST /webhooks/clerk` — verify svix signature
  - `user.created` event: upsert user + create default notification prefs
  - `user.updated` event: sync name, email, avatarUrl
  - `user.deleted` event: anonymize user data
- [ ] `POST /workspaces` — create + add creator as owner
- [ ] `GET /workspaces` — list workspaces for current clerkUserId
- [ ] `POST /workspaces/:slug/invites` — generate token + send email via Resend
- [ ] `POST /workspaces/invites/accept` — validate token + add member
- [ ] `GET /workspaces/:slug/members` — list with Clerk-synced avatars

#### Deliverable
Clerk sign-in/sign-up. Users auto-synced to Neon via webhook. Workspace creation end-to-end.

---

### Phase 3 — Issues, Boards & Core PM Features
**Duration:** Week 3–5 | **Stack:** Both (Frontend-heavy)

#### Goal
Full issue management across all views with real-time updates.

#### Frontend Tasks
- [ ] Build issue list view with grouped rows (status, priority, assignee)
- [ ] Build Kanban board with `@dnd-kit/core` + `@dnd-kit/sortable`
- [ ] Build issue detail slide-in with Framer Motion `AnimatePresence`
- [ ] Integrate Tiptap v2 with floating toolbar + slash commands
- [ ] Build issue create modal (Cmd+I shortcut) with all metadata
- [ ] Build all metadata pickers with premium cmdk-powered dropdowns:
  - Assignee (Clerk avatar + name)
  - Priority (colored dot SVG icons)
  - Status (category color dot)
  - Label multi-select
  - Due date (overdue red highlight)
  - Estimate (story points)
- [ ] Build sub-tasks checklist with progress ring
- [ ] Build GitHub-style activity feed (`activity-feed.tsx`)
- [ ] Build comments with @mention, emoji reactions, threading
- [ ] Build attachment upload flow (R2 presigned URLs)
- [ ] Implement TanStack Virtual for 10,000+ issue lists
- [ ] Add optimistic updates on all mutations via TanStack Query
- [ ] Socket.io real-time field updates + presence awareness
- [ ] Right-click context menu on issue rows and cards

#### Backend Tasks
- [ ] `GET /projects/:id/issues` — paginated, cursor-based, filterable
- [ ] `POST /projects/:id/issues` — create + identifier + activity log
- [ ] `PATCH /issues/:id` — update + auto activity log + socket broadcast
- [ ] `DELETE /issues/:id` — soft delete
- [ ] `PATCH /issues/bulk` — bulk status/assignee/priority
- [ ] `GET /issues/:id` — full with all relations
- [ ] `POST /issues/:id/comments` — create + @mention notifications
- [ ] `PATCH /comments/:id` — edit
- [ ] `DELETE /comments/:id`
- [ ] `POST /issues/:id/attachments` — return R2 presigned URL
- [ ] `POST /issues/:id/relations` — block/duplicate relations
- [ ] Socket.io rooms per issue + field change broadcasts
- [ ] Meilisearch index sync on issue create/update

#### Deliverable
Full issue CRUD across list + kanban with real-time updates and premium UI.

---

### Phase 4 — Sprints, Roadmap & Timeline
**Duration:** Week 5–7 | **Stack:** Both

#### Goal
Agile sprint workflow and a custom canvas Gantt chart.

#### Frontend Tasks
- [ ] Build sprint header with name, dates, mini burndown sparkline
- [ ] Build sprint backlog with drag-in/drag-out
- [ ] Build sprint create, start, complete modals
- [ ] Build full burndown chart with gradient fill (Recharts)
- [ ] Build custom canvas Gantt renderer (zero dependencies):
  - Zoom levels: day / week / month / quarter — pill controls
  - Drag bar to move issue date range
  - Drag bar edge to resize duration
  - SVG dependency arrows between rows
  - Red today marker line
  - Row grouping by assignee or label
- [ ] Build epic roadmap view (horizontal colored bars)

#### Backend Tasks
- [ ] `POST /projects/:id/sprints` — create
- [ ] `PATCH /sprints/:id/start` — activate, enforce one active per project
- [ ] `PATCH /sprints/:id/complete` — complete, rollover unfinished issues
- [ ] `PATCH /sprints/:id/issues` — move issues in/out
- [ ] `GET /sprints/:id/burndown` — daily remaining vs ideal line
- [ ] Issue `start_date` + `end_date` for Gantt drag updates
- [ ] `GET /projects/:id/epics` — date range + grouping for roadmap

#### Deliverable
Sprint workflow and draggable Gantt timeline fully operational.

---

### Phase 5 — Dashboards, Reporting & Analytics
**Duration:** Week 7–8 | **Stack:** Both

#### Goal
Customizable analytics dashboard with real metric data.

#### Frontend Tasks
- [ ] Build `dashboard-grid.tsx` with `react-grid-layout`
- [ ] Build all 6 widget types:
  - Burndown: line + gradient area fill
  - Velocity: grouped bar by sprint
  - Cumulative flow: stacked area by status
  - Issues by assignee: horizontal bars with Clerk avatars
  - Cycle time: histogram with median marker
  - Open vs closed trend: dual line chart
- [ ] Add widget config drawer (date range, project filter, grouping)
- [ ] Add per-widget PNG + CSV export
- [ ] Build "My Work" view: assigned + watching + recent

#### Backend Tasks
- [ ] `GET /analytics/burndown?sprintId=`
- [ ] `GET /analytics/velocity?projectId=`
- [ ] `GET /analytics/cumulative-flow?projectId=`
- [ ] `GET /analytics/cycle-time?projectId=`
- [ ] `GET /analytics/throughput?projectId=`
- [ ] BullMQ worker: nightly analytics snapshot computation
- [ ] `analytics.job.ts` — compute + persist `analytics_snapshots`
- [ ] Save/load dashboard widget layout per user

#### Deliverable
Analytics dashboard with live data. Nightly pre-computation running.

---

### Phase 6 — Notifications, Integrations & AI
**Duration:** Week 9–11 | **Stack:** Both

#### Goal
Real-time notifications, GitHub/Slack integrations, AI superpowers.

#### Frontend Tasks
- [ ] Build notification bell with animated unread count badge
- [ ] Build notification drawer with grouped, socket-powered items
- [ ] Build notification preference settings (per workspace)
- [ ] Build integrations settings page (GitHub, Slack connect/disconnect)
- [ ] Build AI assistant drawer (`ai-panel.tsx`):
  - Streaming markdown with syntax highlighting (react-markdown + shiki)
  - "Summarize this sprint"
  - "Generate sub-tasks from this title"
  - "Suggest priority for this issue"
- [ ] Stream AI responses token-by-token via Vercel AI SDK
- [ ] Show AI sub-task chips as one-click add to issue

#### Backend Tasks
- [ ] Notification fan-out in `notification.service.ts`
- [ ] Push to Socket.io user rooms in real time
- [ ] Resend email notifications with styled templates
- [ ] Daily email digest job
- [ ] GitHub OAuth + `POST /webhooks/github` webhook listener
- [ ] Parse PR events → update `github_pr_links` table
- [ ] Slack OAuth + channel post integration
- [ ] `POST /ai/subtasks` — stream Claude sub-task list
- [ ] `POST /ai/sprint-summary` — stream sprint report
- [ ] `POST /ai/suggest-priority` — return priority suggestion
- [ ] Log all AI calls to `ai_interactions` for billing metering

#### Deliverable
Real-time notifications. GitHub PRs linked to issues. AI generating sub-tasks and summaries.

---

### Phase 7 — Polish, Performance & Deployment
**Duration:** Week 11–12 | **Stack:** Both

#### Goal
Production-ready. Lighthouse 90+, accessible, monitored, deployed.

#### Frontend Tasks
- [ ] Lighthouse audit all views — target 90+ on all metrics
- [ ] `React.lazy` + `Suspense` for all routes
- [ ] `stale-while-revalidate` via TanStack Query on all lists
- [ ] Full keyboard navigation — no mouse required for core flows
- [ ] ARIA roles + focus trapping in all modals and drawers
- [ ] WCAG AA contrast audit in dark mode
- [ ] PWA manifest + service worker (offline issue viewing)
- [ ] Sentry: error tracking + session replay
- [ ] PostHog: product analytics + feature flags
- [ ] Playwright E2E: sign-in, create issue, drag on board, complete sprint

#### Backend Tasks
- [ ] Add all database indexes (see Database Indexes above)
- [ ] Cursor-based pagination on all list endpoints
- [ ] Redis caching with smart invalidation on mutations
- [ ] Rate limiting on all public routes (Upstash Redis)
- [ ] BullMQ dead-letter queue + exponential backoff retry
- [ ] Betterstack uptime monitoring + APM
- [ ] Vitest unit tests for all service files
- [ ] Supertest integration tests for critical routes

#### Deployment
- [ ] Deploy `apps/web` to Vercel (auto-deploy on main merge)
- [ ] Deploy `apps/api` to Fly.io
- [ ] Database on Neon (serverless PostgreSQL, auto-scaling, branching for staging)
- [ ] Redis on Upstash (serverless)
- [ ] Search on Meilisearch Cloud
- [ ] File storage on Cloudflare R2
- [ ] GitHub Actions CI/CD pipeline
- [ ] Preview deployments on every PR (Vercel + Neon DB branching)
- [ ] Separate staging environment using Neon branch

#### Deliverable
App live, monitored, tested, and production-ready.

---

## Environment Variables

### apps/web — `.env.local`

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Clerk (from clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Socket
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Monitoring (optional in dev)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_SENTRY_DSN=
```

### apps/api — `.env`

```bash
# Server
PORT=3001
NODE_ENV=development

# Neon Database (two URLs required for Prisma + connection pooling)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Redis (Upstash)
REDIS_URL=rediss://default:...@...upstash.io:6379

# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Cloudflare R2
R2_BUCKET=your-bucket
R2_ACCOUNT_ID=your-cf-account-id
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# GitHub Integration
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=

# Slack Integration
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=

# CORS
APP_URL=http://localhost:3000
```

---

> **Getting started:**
> 1. Run `bun install` from monorepo root
> 2. Create project at [clerk.com](https://clerk.com) — copy publishable + secret keys
> 3. Create database at [neon.tech](https://neon.tech) — copy pooled + direct connection strings
> 4. Start local services: `docker compose up -d` (Redis + Meilisearch)
> 5. Run migrations: `cd packages/db && bun prisma migrate dev --name init`
> 6. Start dev: `bun dev` from monorepo root (Turborepo runs all apps in parallel)
> 7. Register Clerk webhook at your ngrok URL pointing to `/webhooks/clerk`
