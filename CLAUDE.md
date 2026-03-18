# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProjectReporting is an internal web application for tracking Fixed Price Project (FPP) financials, team resources, and project health. Three roles: PM (data entry, project management), BU Head (portfolio review/approval), CFO (command center). Greenfield project — no application code exists yet; only planning artifacts in `_bmad-output/planning-artifacts/`. All epics, stories, technical docs, and test scenarios are tracked in Atlassian (Jira PRT project + Confluence PR space).

## Tech Stack

- **Frontend:** React + TypeScript + Vite, Kendo UI for React, React Query (TanStack Query), React Router v7, React Hook Form + Zod, Axios
- **Backend:** Node.js + Express + TypeScript, express-session + connect-pg-simple, bcrypt
- **Database:** PostgreSQL + Prisma ORM (v6.x)
- **Exports:** Aspose.PDF, Aspose.Cells (server-side)
- **Deployment:** On-premise, PM2 + Nginx, no Docker

## Project Structure

Monorepo with `/client` (React SPA) and `/server` (Express API) top-level directories. Shared types in `/shared`. Feature-based organization inside each:
- Backend feature: `src/features/{feature}/` → `routes.ts`, `service.ts`, `validation.ts`, `types.ts`
- Frontend feature: `src/features/{feature}/` → `components/`, `hooks/`, `types.ts`, `index.ts`
- Tests co-located with source (e.g., `projectService.test.ts` next to `projectService.ts`)

## Build & Development Commands

```bash
# Frontend (from /client)
npm run dev          # Vite dev server with HMR
npm run build        # Production build
npx vitest           # Run frontend tests
npx vitest run       # Run tests once (CI)

# Backend (from /server)
npm run dev          # Dev server with auto-restart (tsx watch or nodemon)
npm run build        # TypeScript compilation
npx jest             # Run backend tests
npx jest --testPathPattern=<pattern>  # Run specific test

# Database
npx prisma migrate dev      # Apply migrations in development
npx prisma migrate deploy   # Apply migrations in production
npx prisma generate         # Regenerate Prisma client
npx prisma db seed           # Seed development data
npx prisma studio           # Database browser UI
```

## Critical Architecture Rules

### Financial Precision
- **All financials are in INR (₹)** — currency symbol, formatting (Indian numbering: ₹12,50,000.00), and display must use Indian Rupee throughout the application
- All monetary values: `Decimal(15,2)` in PostgreSQL, `Decimal` type in Prisma, **string** in JSON API responses
- Use `decimal.js` library for server-side calculations — never JavaScript `number` for money
- Frontend receives money as strings, uses utility functions for display formatting only
- All financial calculations are server-side and deterministic

### API Conventions
- Base path: `/api`
- Response wrapper: `{ "data": ..., "meta": { "total", "page", "pageSize" } }`
- Error format: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`
- Money in JSON: `"12500.00"` (string, never float)
- Dates: ISO 8601 strings. Periods: `"YYYY-MM"` format
- Null explicitly present for absent optional values; empty arrays as `[]`

### Auth & Authorization
- Session-based auth (express-session + PostgreSQL session store), 8-hour expiry
- Three roles: `PM`, `BU_HEAD`, `CFO` — enforced at API level, not client-side only
- Data filtering: PM sees own projects, BU_HEAD sees business unit, CFO sees all
- Middleware chain: `authenticate` → `authorize(['ROLE'])` on every route

### Frontend Patterns
- **Always use KendoReact for UI** — all forms, grids, charts, date pickers, dropdowns, buttons, notifications, and layout components must use KendoReact (`@progress/kendo-react-*`). Do not use plain HTML elements or other UI libraries for these.
- **Screenshot references:** Before building any screen/page, check the `/screenshots` folder for a reference screenshot. If a screenshot exists, match the layout and design. If no screenshot is available for the screen being built, ask the user to provide one before proceeding.
- React Query for ALL server state — no `useEffect` + `fetch` for data loading
- Query keys: `[resource, id?, subresource?, filters?]`
- Optimistic updates NOT used — financial data must be server-confirmed
- Axios with `withCredentials: true` for session cookies; 401 interceptor redirects to login
- Kendo UI components for all data-intensive UI (grids, charts, forms, date pickers)

### Backend Patterns
- Zod validation on all inputs BEFORE database operations
- Custom `AppError` class for all error responses
- Winston for structured logging (JSON)
- Prisma for all DB operations — raw SQL only for complex aggregation queries
- Async error handler wraps all route handlers

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

## Planning Artifacts

All design documents are in `_bmad-output/planning-artifacts/`:
- `prd.md` — Full product requirements (38 functional + 20 non-functional requirements)
- `architecture.md` — Architecture decisions, Prisma schema, API endpoints, implementation patterns
- `ux-design-specification.md` — UX design for three personas (PM, BU Head, CFO)
- `epics.md` — Epic and story breakdown for implementation

## Atlassian Integration

### Jira Project
- **Project:** Project Reporting Tool (PRT) at `sedin.atlassian.net`
- **Cloud ID:** `5275dc2d-06f9-412a-891f-342b8dca4f4e`
- **Issue Types:** Epic, Story, Task, Bug, Sub-task
- **Epics:** PRT-1 through PRT-8 (8 epics)
- **Stories:** PRT-9 through PRT-45 (37 stories)

### Confluence Space
- **Space:** Project Reporting (key: PR, ID: 1245741058)
- **Top-level pages:**
  - Product Requirements Document (PRD)
  - Architecture Decision Document
  - UX Design Specification
  - Epic and Story Breakdown
- **Per-story pages:** Each story (PRT-9 to PRT-45) has two Confluence pages:
  - `PRT-{N}: Technical Document - {title}` — design, data model, API endpoints, file structure
  - `PRT-{N}: Test Scenarios - {title}` — 6-10 test cases with preconditions, steps, expected results
- **Jira comments:** Each story has an implementation approach comment with links to its Confluence pages

### Phased Implementation

| Phase | Epics | Jira Keys | Stories |
|-------|-------|-----------|---------|
| Phase 1 (MVP) | Epics 1-6 | PRT-1 to PRT-6, PRT-9 to PRT-37 | 29 stories |
| Phase 2 (Growth) | Epic 7 | PRT-7, PRT-38 to PRT-42 | 5 stories |
| Phase 3 (Expansion) | Epic 8 | PRT-8, PRT-43 to PRT-45 | 3 stories |

### Implementation Order (Dependencies)
Epic 1 (Auth) → Epic 2 (Projects) → Epic 3 (Teams) → Epic 4 (Costs) → Epic 5 (Health/Dashboard) → Epic 6 (Portfolio/Exports) → Epic 7 (Analytics) → Epic 8 (CFO)

Stories within each epic build sequentially (model → API → UI pattern).

## Implementation Workflow (Per Story)

When implementing any Jira story, always follow this workflow:
1. **Before coding:** Read the story's Technical Document and Test Scenarios from Confluence (PR space)
2. **After implementing:** Update the Jira story with an "Implementation Complete" comment including: what was built, files created/modified, verification results
3. **Update Confluence:** Update the Technical Document with any deviations from the original design and add actual implementation details
4. **Update Test Scenarios:** Add actual test results to the Test Scenarios page, noting any new edge cases discovered
5. **UI Design Reference:** All UI screens are at https://sedin.atlassian.net/wiki/spaces/PR/pages/1248264193/UI+Design — always check the relevant screenshot before building any UI

## BMAD Methodology

This project uses the BMAD (Build Measure Analyze Decide) agent framework. Skills are in `.claude/skills/` and workflow definitions in `_bmad/`. Use `/bmad-help` to see what to do next.

## Domain Constants

**8 Fixed Cost Categories:** EMPLOYEE_SALARY, SUBSCRIPTIONS, TRAVEL, ACCOMMODATION, FOOD_ALLOWANCE, GIFTS, INFRASTRUCTURE, CONTRACTOR

**Project Lifecycle States:** PROPOSAL → ACTIVE → ON_HOLD → COMPLETED → CLOSED

**Key Enums:** Role (PM/BU_HEAD/CFO), RagStatus (RED/AMBER/GREEN), RiskLevel (LOW/MEDIUM/HIGH), RiskStatus (OPEN/MITIGATED/CLOSED/MATERIALIZED), ScopeCreepDecision (ABSORBED/CHANGE_REQUEST/DECLINED)

## Environment Variables

`DATABASE_URL`, `SESSION_SECRET`, `PORT`, `NODE_ENV`, `ASPOSE_LICENSE_PATH`
