# agents.md

Instructions for all agents (subagents) working in this repository.

## Project Context

ProjectReporting is an internal web application for tracking Fixed Price Project (FPP) financials, team resources, and project health. No application code exists yet — planning artifacts are in `_bmad-output/planning-artifacts/`. Tracking is in Atlassian Jira (PRT project) and Confluence (PR space).

## Mandatory Rules

### UI Framework
- **Always use KendoReact** (`@progress/kendo-react-*`) for ALL UI components — grids, charts, forms, date pickers, dropdowns, buttons, notifications, layouts. Never use plain HTML elements or other UI libraries.

### Screenshots
- Before building any screen/page, check the `/screenshots` folder for a reference screenshot.
- If a screenshot exists, match the layout and design exactly.
- If no screenshot is available, **stop and ask the user** before proceeding.

### Financial Rules
- **All financials are in INR (₹)** — use Indian numbering format (₹12,50,000.00).
- All monetary values: `Decimal(15,2)` in PostgreSQL, `Decimal` in Prisma, **string** in JSON API responses.
- Use `decimal.js` for server-side calculations — **never** JavaScript `number` for money.
- Frontend receives money as strings; use utility functions for display formatting only.
- All financial calculations are server-side and deterministic.

### API Conventions
- Base path: `/api`
- Success response: `{ "data": ..., "meta": { "total", "page", "pageSize" } }`
- Error response: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`
- Money in JSON: `"12500.00"` (string, never float)
- Dates: ISO 8601 strings. Periods: `"YYYY-MM"` format.
- Null explicitly present for absent optional values; empty arrays as `[]`.

### Auth & Authorization
- Session-based auth (express-session + PostgreSQL session store), 8-hour expiry.
- Three roles: `PM`, `BU_HEAD`, `CFO` — enforced at API level, not client-side only.
- Data filtering: PM sees own projects, BU_HEAD sees business unit, CFO sees all.
- Middleware chain: `authenticate` → `authorize(['ROLE'])` on every route.

### Frontend Patterns
- React Query for ALL server state — no `useEffect` + `fetch` for data loading.
- Query keys: `[resource, id?, subresource?, filters?]`
- Optimistic updates NOT used — financial data must be server-confirmed.
- Axios with `withCredentials: true` for session cookies; 401 interceptor redirects to login.

### Backend Patterns
- Zod validation on all inputs BEFORE database operations.
- Custom `AppError` class for all error responses.
- Winston for structured logging (JSON).
- Prisma for all DB operations — raw SQL only for complex aggregation queries.
- Async error handler wraps all route handlers.

## Tech Stack

- **Frontend:** React + TypeScript + Vite, KendoReact, React Query (TanStack Query), React Router v7, React Hook Form + Zod, Axios
- **Backend:** Node.js + Express + TypeScript, express-session + connect-pg-simple, bcrypt
- **Database:** PostgreSQL + Prisma ORM (v6.x)
- **Exports:** Aspose.PDF, Aspose.Cells (server-side)
- **Deployment:** On-premise, PM2 + Nginx, no Docker

## Project Structure

Monorepo with `/client` (React SPA) and `/server` (Express API). Shared types in `/shared`. Feature-based organization:
- Backend: `server/src/features/{feature}/` → `routes.ts`, `service.ts`, `validation.ts`, `types.ts`
- Frontend: `client/src/features/{feature}/` → `components/`, `hooks/`, `types.ts`, `index.ts`
- Tests co-located with source files.

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| DB tables | snake_case, plural | `cost_entries` |
| DB columns | snake_case | `contract_value` |
| API endpoints | kebab-case, plural | `/api/cost-entries` |
| TS files (functions) | camelCase | `authMiddleware.ts` |
| TS files (components) | PascalCase | `ProjectDashboard.tsx` |
| Directories | kebab-case | `cost-entries/` |
| Variables/functions | camelCase | `calculateBurnRate()` |
| Types/interfaces | PascalCase | `ProjectSummary` |
| Constants | UPPER_SNAKE_CASE | `MAX_ALLOCATION_PCT` |

## Domain Constants

**8 Cost Categories:** EMPLOYEE_SALARY, SUBSCRIPTIONS, TRAVEL, ACCOMMODATION, FOOD_ALLOWANCE, GIFTS, INFRASTRUCTURE, CONTRACTOR

**Project States:** PROPOSAL → ACTIVE → ON_HOLD → COMPLETED → CLOSED

**Key Enums:** Role (PM/BU_HEAD/CFO), RagStatus (RED/AMBER/GREEN), RiskLevel (LOW/MEDIUM/HIGH), RiskStatus (OPEN/MITIGATED/CLOSED/MATERIALIZED), ScopeCreepDecision (ABSORBED/CHANGE_REQUEST/DECLINED)

## Atlassian References

- **Jira Project:** PRT at `sedin.atlassian.net` (Cloud ID: `5275dc2d-06f9-412a-891f-342b8dca4f4e`)
- **Confluence Space:** Project Reporting (key: PR, ID: 1245741058)
- **Epics:** PRT-1 to PRT-8 | **Stories:** PRT-9 to PRT-45
- Each story has a Technical Document and Test Scenarios page in Confluence, plus an implementation approach comment in Jira.

## Implementation Order

Epic 1 (Auth) → Epic 2 (Projects) → Epic 3 (Teams) → Epic 4 (Costs) → Epic 5 (Health/Dashboard) → Epic 6 (Portfolio/Exports) → Epic 7 (Analytics) → Epic 8 (CFO)

Stories within each epic build sequentially: model → API → UI.

## Build Commands

```bash
# Frontend (from /client)
npm run dev              # Vite dev server
npm run build            # Production build
npx vitest run           # Run tests

# Backend (from /server)
npm run dev              # Dev server (tsx watch)
npm run build            # TypeScript compilation
npx jest                 # Run tests

# Database
npx prisma migrate dev   # Apply migrations
npx prisma db seed       # Seed data
npx prisma studio        # DB browser
```

## Environment Variables

`DATABASE_URL`, `SESSION_SECRET`, `PORT`, `NODE_ENV`, `ASPOSE_LICENSE_PATH`
