-- =====================================================================
-- ProjectReporting (PRT) — Complete Database Schema
-- PostgreSQL 16 | All financials in INR (₹) | DECIMAL(15,2)
-- =====================================================================

-- =====================================================================
-- ENUMS
-- =====================================================================

CREATE TYPE "Role" AS ENUM ('PM', 'BU_HEAD', 'CFO');
CREATE TYPE "ProjectStatus" AS ENUM ('PROPOSAL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED');
CREATE TYPE "CostCategoryType" AS ENUM ('EMPLOYEE_SALARY', 'SUBSCRIPTIONS', 'TRAVEL', 'ACCOMMODATION', 'FOOD_ALLOWANCE', 'GIFTS', 'INFRASTRUCTURE', 'CONTRACTOR');
CREATE TYPE "RagStatus" AS ENUM ('RED', 'AMBER', 'GREEN');
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'MITIGATED', 'CLOSED', 'MATERIALIZED');
CREATE TYPE "ScopeCreepDecision" AS ENUM ('ABSORBED', 'CHANGE_REQUEST', 'DECLINED');

-- =====================================================================
-- TABLES
-- =====================================================================

-- 1. users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    display_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    role "Role" NOT NULL,
    business_unit VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    code VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    client VARCHAR NOT NULL,
    contract_value DECIMAL(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status "ProjectStatus" NOT NULL DEFAULT 'PROPOSAL',
    business_unit VARCHAR NOT NULL,
    description TEXT,
    manager_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_manager_id ON projects(manager_id);
CREATE INDEX idx_projects_business_unit ON projects(business_unit);
CREATE INDEX idx_projects_status ON projects(status);

-- 3. payment_milestones
CREATE TABLE payment_milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    paid_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_milestones_project_id ON payment_milestones(project_id);

-- 4. team_members
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    loaded_cost_rate DECIMAL(15, 2) NOT NULL,
    skills TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 5. project_allocations
CREATE TABLE project_allocations (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    team_member_id INTEGER NOT NULL REFERENCES team_members(id),
    allocation_pct DECIMAL(5, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    onboarding_date DATE,
    offboarding_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(project_id, team_member_id, start_date)
);

CREATE INDEX idx_project_allocations_project_id ON project_allocations(project_id);
CREATE INDEX idx_project_allocations_team_member_id ON project_allocations(team_member_id);

-- 6. cost_categories
CREATE TABLE cost_categories (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category_type "CostCategoryType" NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(project_id, category_type)
);

CREATE INDEX idx_cost_categories_project_id ON cost_categories(project_id);

-- 7. planned_amounts
CREATE TABLE planned_amounts (
    id SERIAL PRIMARY KEY,
    cost_category_id INTEGER NOT NULL REFERENCES cost_categories(id) ON DELETE CASCADE,
    period VARCHAR NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(cost_category_id, period)
);

CREATE INDEX idx_planned_amounts_category_period ON planned_amounts(cost_category_id, period);

-- 8. cost_entries
CREATE TABLE cost_entries (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cost_category_id INTEGER NOT NULL REFERENCES cost_categories(id),
    period VARCHAR NOT NULL,
    actual_amount DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    entered_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(cost_category_id, period)
);

CREATE INDEX idx_cost_entries_project_id_period ON cost_entries(project_id, period);

-- 9. cost_entry_audit
CREATE TABLE cost_entry_audit (
    id SERIAL PRIMARY KEY,
    cost_entry_id INTEGER NOT NULL REFERENCES cost_entries(id) ON DELETE CASCADE,
    previous_amount DECIMAL(15, 2) NOT NULL,
    new_amount DECIMAL(15, 2) NOT NULL,
    changed_by_id INTEGER NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT now(),
    reason TEXT
);

CREATE INDEX idx_cost_entry_audit_cost_entry_id ON cost_entry_audit(cost_entry_id);

-- 10. health_updates
CREATE TABLE health_updates (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    period VARCHAR NOT NULL,
    achievements TEXT[] NOT NULL DEFAULT '{}',
    challenges TEXT[] NOT NULL DEFAULT '{}',
    client_satisfaction_rag "RagStatus" NOT NULL,
    client_satisfaction_note TEXT,
    escalation_count INTEGER,
    change_request_volume INTEGER,
    avg_response_time_days DECIMAL(5, 2),
    entered_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(project_id, period)
);

CREATE INDEX idx_health_updates_project_id ON health_updates(project_id);

-- 11. risks
CREATE TABLE risks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    probability "RiskLevel" NOT NULL,
    cost_impact DECIMAL(15, 2) NOT NULL,
    status "RiskStatus" NOT NULL DEFAULT 'OPEN',
    mitigation_plan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_risks_project_id ON risks(project_id);
CREATE INDEX idx_risks_status ON risks(status);

-- 12. scope_creep_entries
CREATE TABLE scope_creep_entries (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    effort_hours DECIMAL(8, 2) NOT NULL,
    cost_impact DECIMAL(15, 2) NOT NULL,
    decision "ScopeCreepDecision" NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_scope_creep_entries_project_id ON scope_creep_entries(project_id);

-- 13. review_notes
CREATE TABLE review_notes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    period VARCHAR NOT NULL,
    note TEXT NOT NULL,
    decision VARCHAR,
    reviewer_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_notes_project_id ON review_notes(project_id);

-- =====================================================================
-- SESSION TABLE (for express-session + connect-pg-simple)
-- =====================================================================

CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL COLLATE "default",
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,
    PRIMARY KEY ("sid")
);

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

-- =====================================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all mutable tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_allocations_updated_at BEFORE UPDATE ON project_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planned_amounts_updated_at BEFORE UPDATE ON planned_amounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_entries_updated_at BEFORE UPDATE ON cost_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_updates_updated_at BEFORE UPDATE ON health_updates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON risks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scope_creep_entries_updated_at BEFORE UPDATE ON scope_creep_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- SEED DATA: Default users (one per role)
-- Passwords hashed with bcrypt (12 rounds)
-- All passwords: "Welcome@123"
-- =====================================================================

-- bcrypt hash for "Welcome@123" with 12 rounds
INSERT INTO users (username, password_hash, display_name, email, role, business_unit) VALUES
('priya.sharma', '$2b$12$LJ3m4ys3Lk8RHxYOqGZKxeKvGvJfVZGmFh1a5c8RQdN5kK3qK9XHi', 'Priya Sharma', 'priya.sharma@company.com', 'PM', 'Engineering'),
('rajesh.kumar', '$2b$12$LJ3m4ys3Lk8RHxYOqGZKxeKvGvJfVZGmFh1a5c8RQdN5kK3qK9XHi', 'Rajesh Kumar', 'rajesh.kumar@company.com', 'BU_HEAD', 'Engineering'),
('meera.patel', '$2b$12$LJ3m4ys3Lk8RHxYOqGZKxeKvGvJfVZGmFh1a5c8RQdN5kK3qK9XHi', 'Meera Patel', 'meera.patel@company.com', 'CFO', NULL),
('amit.joshi', '$2b$12$LJ3m4ys3Lk8RHxYOqGZKxeKvGvJfVZGmFh1a5c8RQdN5kK3qK9XHi', 'Amit Joshi', 'amit.joshi@company.com', 'PM', 'Digital'),
('neha.gupta', '$2b$12$LJ3m4ys3Lk8RHxYOqGZKxeKvGvJfVZGmFh1a5c8RQdN5kK3qK9XHi', 'Neha Gupta', 'neha.gupta@company.com', 'BU_HEAD', 'Digital');

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- Count all tables
SELECT 'Tables' as type, count(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Count all enums
SELECT 'Enums' as type, count(DISTINCT t.typname) as count FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid;

-- List all tables with row counts
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
