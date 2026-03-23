# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProjectReporting is an internal enterprise web application for tracking Fixed Price Project (FPP) financials, team resources, and project health. **ECM Division — Project Financial Intelligence.** Three roles: PM (data entry, project management), BU Head (portfolio review/approval), CFO (command center). All epics, stories, technical docs, and test scenarios are tracked in Atlassian (Jira PRT project + Confluence PR space).

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 8, KendoReact (all UI components), React Query (TanStack Query), React Router v7, React Hook Form + Zod, Axios
- **Backend:** Node.js + Express + TypeScript, express-session + connect-pg-simple, bcrypt
- **Database:** PostgreSQL + Prisma ORM (v6.x)
- **Exports:** Aspose.PDF, Aspose.Cells (server-side, stub implementation)
- **Deployment:** On-premise, PM2 + Nginx, no Docker

## Project Structure

Monorepo with `/client` (React SPA) and `/server` (Express API) top-level directories. Shared types in `/shared`. Feature-based component architecture:

```
client/src/
├── components/
│   ├── layout/          # DashboardLayout, Sidebar, TopBar, AuthLayout
│   └── shared/          # SkeletonLoader, Toast, ErrorBoundary, Breadcrumbs, ConfirmDialog, LoadingSpinner
├── config/              # api.ts (Axios), routes.ts, constants.ts (formatINR), queryClient.ts
├── context/             # AuthContext (session auth)
├── features/
│   ├── auth/            # LoginPage (ECM Division split layout)
│   ├── dashboard/       # PMDashboardPage (Program Dashboard), ProjectOverviewTab, KPICard
│   ├── projects/        # ProjectListPage, ProjectDetailPage, ProjectForm, ResourceAssignment, BudgetPlanning
│   ├── team-registry/   # TeamRegistryPage, AddTeamMemberDialog (inline edit with ref pattern)
│   ├── portfolio/       # PortfolioDashboardPage, ReviewNotesPanel, ExportButtons
│   ├── cfo-dashboard/   # CFOCommandCenter
│   ├── risk-register/   # RiskRegisterPage
│   ├── scope-creep/     # ScopeCreepPage
│   ├── team-allocation/ # TeamAllocationPage
│   ├── client-satisfaction/ # ClientSatisfactionPage
│   ├── trend-analysis/  # TrendAnalysisPage
│   └── burn-revenue/    # BurnRevenuePage
└── styles/              # tokens.css (design tokens), buttons.css, breakpoints.css

server/src/
├── config/              # database.ts, session.ts, logger.ts
├── middleware/          # authenticate.ts, authorize.ts, errorHandler.ts, validateRequest.ts
├── shared/              # AppError.ts, asyncHandler.ts, dataScope.ts
└── features/
    ├── auth/            # login/logout/me
    ├── projects/        # CRUD + status transitions
    ├── milestones/      # payment milestones
    ├── team-members/    # CRUD with optional fields
    ├── dashboards/      # PM dashboard, project dashboard, portfolio dashboard
    ├── allocations/     # project team allocations (mergeParams)
    ├── budget/          # budget planning per category/period (mergeParams)
    └── exports/         # PDF/Excel export stubs
```

## Build & Development Commands

```bash
# Frontend (from /client)
npm run dev          # Vite dev server with HMR (port 5173)
npm run build        # Production build
npx vitest           # Run frontend tests
npx vitest run       # Run tests once (CI)

# Backend (from /server)
npm run dev          # Dev server with tsx watch (default port 3000, use PORT=3001 if 3000 occupied)
npm run build        # TypeScript compilation
npx jest             # Run backend tests

# Database
npx prisma migrate dev      # Apply migrations in development
npx prisma migrate deploy   # Apply migrations in production
npx prisma generate         # Regenerate Prisma client
npx prisma db seed           # Seed development data (5 users, password: Welcome@123)
npx prisma studio           # Database browser UI
```

## Critical Architecture Rules

### Financial Precision
- **All financials are in INR (₹)** — currency symbol, formatting (Indian numbering: ₹12,50,000.00), and display must use Indian Rupee throughout the application
- All monetary values: `Decimal(15,2)` in PostgreSQL, `Decimal` type in Prisma, **string** in JSON API responses
- Use `import { Decimal } from 'decimal.js'` for server-side calculations — never JavaScript `number` for money
- Frontend receives money as strings, uses `formatINR()` and `formatINRCompact()` from `config/constants.ts` for display
- All financial calculations are server-side and deterministic

### API Conventions
- Base path: `/api`
- Response wrapper: `{ "data": ..., "meta": { "total", "page", "pageSize" } }`
- Error format: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`
- Money in JSON: `"12500.00"` (string, never float)
- Dates: ISO 8601 strings. Periods: `"YYYY-MM"` format
- Null explicitly present for absent optional values; empty arrays as `[]`
- Sub-resource routes use `mergeParams: true` (e.g., `/api/projects/:projectId/allocations`)

### Auth & Authorization
- Session-based auth (express-session + PostgreSQL session store), 8-hour expiry
- Three roles: `PM`, `BU_HEAD`, `CFO` — enforced at API level via `authorize()` middleware
- Data filtering via `dataScope.ts`: PM sees own projects (`managerId`), BU_HEAD sees business unit, CFO sees all
- Middleware chain: `authenticate` → `authorize(['ROLE'])` on every route

### Frontend Patterns — KendoReact First
- **ALL UI controls MUST use KendoReact** — Button, Input, Grid, Dialog, DropDownList, TabStrip, Checkbox, etc. from `@progress/kendo-react-*`. No plain HTML `<button>`, `<input>`, `<select>` elements.
- **Exceptions (documented):** BudgetPlanning grid cells use native `<input>` for performance (many cells). TeamRegistry inline edit uses native `<input>` with `useRef` pattern to prevent focus loss on re-render.
- **Controller pattern required:** Never use `{...register()}` with KendoReact Input — it crashes. Always use `<Controller>` from react-hook-form with `value`/`onChange` props.
- **React Query** for ALL server state — no `useEffect` + `fetch` for data loading
- Query keys: `['resource', id?, 'subresource?', filters?]`
- Optimistic updates NOT used — financial data must be server-confirmed
- Axios with `withCredentials: true`; 401 interceptor redirects to login
- **Lazy loading:** All route-level components use `React.lazy()` with `Suspense` fallback
- **No `any` types** — use `unknown` with type assertion for catch blocks

### Backend Patterns
- Zod validation on all inputs BEFORE database operations
- Custom `AppError` class for all error responses
- Winston for structured logging (JSON)
- Prisma for all DB operations — raw SQL only for complex aggregation queries
- `asyncHandler` wraps all route handlers

## Enterprise Design System

### UI Screenshots Reference
- **Primary reference:** `Sceenshots_Enterprise/` folder — 20 enterprise screenshots
- **Legacy reference:** `screenshot/` folder — original wireframes
- Always check `Sceenshots_Enterprise/` for the latest design before building any UI screen

### Design Tokens (`client/src/styles/tokens.css`)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#2563eb` | Primary blue for buttons, links, active states |
| `--text-h1` | `2rem` (32px) | NOT used for page titles (too large) |
| `--text-h2` | `1.5rem` (24px) | Page titles — standard across all pages |
| `--text-h3` | `1.25rem` (20px) | Section headings |
| `--text-body` | `0.875rem` (14px) | Body text, subtitles |
| `--text-caption` | `0.75rem` (12px) | Labels, badges, hints |
| `--sidebar-width-expanded` | `240px` | Sidebar width |
| `--sidebar-width-collapsed` | `64px` | Collapsed sidebar |
| `--topbar-height` | `56px` | Top navigation bar |

### Enterprise Layout
- **TopBar:** Logo, Overview/Portfolio/Resources tabs, search, notification/settings icons, user avatar
- **Sidebar:** Collapsible (localStorage persisted), nav items with SVG icons, "+ New Entry" button, "Log Out" at bottom
- **Footer:** "© 2026 PROJECTREPORTING ENTERPRISE. ALL RIGHTS RESERVED." + PRIVACY POLICY link
- **Page headers:** All use `--text-h2` (24px) for title, `--text-body` (14px) for subtitle — matches BU Portfolio Overview style
- **Labels:** 11px uppercase with `letter-spacing: 0.06em` for table headers and KPI labels

### Login Page
- Split layout: blue left panel (ECM DIVISION branding, 3 feature cards) + white right panel (form)
- LOG IN / SIGN UP tab toggle
- Uppercase labels (EMAIL ADDRESS, PASSWORD, KEEP ME SIGNED IN)
- Password visibility toggle (eye icon)
- "Log In →" button with arrow

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| DB tables | snake_case, plural | `cost_entries`, `team_members` |
| DB columns | snake_case | `contract_value`, `manager_id` |
| API endpoints | kebab-case, plural nouns | `/api/cost-entries`, `/api/team-members` |
| TS files (functions) | camelCase | `authMiddleware.ts`, `costCalculations.ts` |
| TS files (components) | PascalCase | `ProjectDashboard.tsx`, `CostEntryForm.tsx` |
| Directories | kebab-case | `cost-entries/`, `health-updates/` |
| Variables/functions | camelCase | `calculateBurnRate()` |
| Types/interfaces | PascalCase | `ProjectSummary`, `CostEntryInput` |
| Constants | UPPER_SNAKE_CASE | `MAX_ALLOCATION_PCT` |

## Implemented Features

### Screens (20 enterprise screens)
| Screen | Route | Role | Status |
|--------|-------|------|--------|
| Login | `/login` | All | Full — ECM Division split layout |
| PM Dashboard | `/dashboard` | PM | Full — KPI cards, Active Projects, side panels |
| Project Portfolio | `/projects` | All | Full — filter tabs, card rows, search |
| Project Detail | `/projects/:id` | All | Full — Overview/Costs/Health/Team tabs with real data |
| Project Setup | `/projects/new` | PM | Full — 4 sections, redirects to edit after save |
| Edit Project | `/projects/:id/edit` | PM | Full — Resource Assignment + Budget Planning |
| Team Registry | `/team-registry` | All | Full — Kendo Grid, inline edit, add/delete |
| BU Portfolio | `/portfolio` | BU_HEAD, CFO | Full — KPI cards, project grid, exports |
| CFO Command Center | `/command-center` | CFO | Static — KPI cards, charts placeholder |
| Risk Register | `/risks` | All | Static — filter tabs, risk table |
| Scope Creep Log | `/scope-creep` | All | Static — KPI cards, entry table |
| Team Allocation | `/team-allocation` | All | Static — allocation table, timeline |
| Client Satisfaction | `/client-satisfaction` | All | Static — RAG cards, metrics |
| Trend Analysis | `/trend-analysis` | All | Static — KPI cards, benchmark table |
| Burn vs Revenue | `/burn-vs-revenue` | All | Static — gap KPI, milestones table |
| Financials | `/financials` | All | Links to Trend Analysis |
| Reports | `/reports` | All | Links to Burn vs Revenue |

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Session login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Session logout |
| GET/POST | `/api/projects` | List/create projects |
| GET/PUT | `/api/projects/:id` | Get/update project |
| GET/POST/PUT/DELETE | `/api/projects/:id/milestones` | Payment milestones |
| GET/POST/DELETE | `/api/projects/:projectId/allocations` | Team allocations |
| GET/POST | `/api/projects/:projectId/budget` | Budget planning |
| GET | `/api/dashboards/pm` | PM dashboard data |
| GET | `/api/dashboards/project/:id` | Project dashboard data |
| GET | `/api/dashboards/portfolio` | Portfolio dashboard data |
| GET/POST/PUT | `/api/team-members` | Team member CRUD |
| POST | `/api/exports/project/:id/pdf` | Project PDF export |
| POST | `/api/exports/project/:id/excel` | Project Excel export |
| POST | `/api/exports/portfolio/pdf` | Portfolio PDF export |
| POST | `/api/exports/portfolio/excel` | Portfolio Excel export |

## Atlassian Integration

### Jira Project
- **Project:** Project Reporting Tool (PRT) at `sedin.atlassian.net`
- **Cloud ID:** `5275dc2d-06f9-412a-891f-342b8dca4f4e`
- **Issue Types:** Epic, Story, Task, Bug, Sub-task
- **Epics:** PRT-1 through PRT-8 (8 epics)
- **Stories:** PRT-9 through PRT-45 (37 stories)
- **Additional tasks:** PRT-76 through PRT-81 (collapsible menu, add team member, resource/budget, login redesign, KendoReact cleanup)

### Confluence Space
- **Space:** Project Reporting (key: PR, ID: 1245741058)

### Implementation Order (Dependencies)
Epic 1 (Auth) → Epic 2 (Projects) → Epic 3 (Teams) → Epic 4 (Costs) → Epic 5 (Health/Dashboard) → Epic 6 (Portfolio/Exports) → Epic 7 (Analytics) → Epic 8 (CFO)

## Implementation Workflow (Per Story)

When implementing any Jira story, use the `/implement-prt-jira` skill which automates:
1. JIRA type check (standalone vs parent with sub-tasks)
2. Branch creation (`feature/PRT-{N}`)
3. Implementation with Confluence doc reference
4. Code simplification review
5. Code review checklist
6. Vercel React best practices verification
7. Security audit
8. Test cases
9. Commit, push, and JIRA transition (To Do → In Progress → IN TESTING → In UAT → Resolved)

## BMAD Methodology

This project uses the BMAD (Build Measure Analyze Decide) agent framework. Skills are in `.claude/skills/` and workflow definitions in `_bmad/`. Use `/bmad-help` to see what to do next.

## Domain Constants

**8 Fixed Cost Categories:** EMPLOYEE_SALARY, SUBSCRIPTIONS, TRAVEL, ACCOMMODATION, FOOD_ALLOWANCE, GIFTS, INFRASTRUCTURE, CONTRACTOR

**Project Lifecycle States:** PROPOSAL → ACTIVE → ON_HOLD → COMPLETED → CLOSED

**Key Enums:** Role (PM/BU_HEAD/CFO), RagStatus (RED/AMBER/GREEN), RiskLevel (LOW/MEDIUM/HIGH), RiskStatus (OPEN/MITIGATED/CLOSED/MATERIALIZED), ScopeCreepDecision (ABSORBED/CHANGE_REQUEST/DECLINED)

## Seeded Users

| Username | Role | Password | Business Unit |
|----------|------|----------|---------------|
| priya.sharma | PM | Welcome@123 | Engineering |
| amit.joshi | PM | Welcome@123 | ECM |
| rajesh.kumar | BU_HEAD | Welcome@123 | Engineering |
| neha.gupta | BU_HEAD | Welcome@123 | — |
| meera.patel | CFO | Welcome@123 | — |

## Environment Variables

`DATABASE_URL`, `SESSION_SECRET`, `PORT`, `NODE_ENV`, `ASPOSE_LICENSE_PATH`

## Known Issues & Workarounds

- **Kendo Charts + Vite:** `@progress/kendo-charts` has ES5 class inheritance that breaks with Vite ESM. Fix: lazy-load chart components with `React.lazy()` so they don't crash the entire app on import.
- **KendoReact Input + react-hook-form:** Never use `{...register()}` on KendoReact `<Input>`. Use `<Controller>` with `value`/`onChange` props instead — register tries to set a read-only `value` property and crashes.
- **Port 3000 stuck:** If port 3000 is occupied, use `PORT=3001 npm run dev` and update `vite.config.ts` proxy target accordingly.
- **Prisma generate EPERM:** If `npx prisma generate` fails with EPERM, delete `node_modules/.prisma/client/query_engine-windows.dll.node` first then retry.
