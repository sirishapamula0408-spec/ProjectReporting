-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PM', 'BU_HEAD', 'CFO');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PROPOSAL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CostCategoryType" AS ENUM ('EMPLOYEE_SALARY', 'SUBSCRIPTIONS', 'TRAVEL', 'ACCOMMODATION', 'FOOD_ALLOWANCE', 'GIFTS', 'INFRASTRUCTURE', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "RagStatus" AS ENUM ('RED', 'AMBER', 'GREEN');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'MITIGATED', 'CLOSED', 'MATERIALIZED');

-- CreateEnum
CREATE TYPE "ScopeCreepDecision" AS ENUM ('ABSORBED', 'CHANGE_REQUEST', 'DECLINED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "business_unit" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "contract_value" DECIMAL(15,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PROPOSAL',
    "business_unit" TEXT NOT NULL,
    "description" TEXT,
    "manager_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_milestones" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "loaded_cost_rate" DECIMAL(15,2) NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_allocations" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "team_member_id" INTEGER NOT NULL,
    "allocation_pct" DECIMAL(5,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "onboarding_date" DATE,
    "offboarding_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_categories" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "category_type" "CostCategoryType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_amounts" (
    "id" SERIAL NOT NULL,
    "cost_category_id" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_amounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_entries" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "cost_category_id" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "actual_amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "entered_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_entry_audit" (
    "id" SERIAL NOT NULL,
    "cost_entry_id" INTEGER NOT NULL,
    "previous_amount" DECIMAL(15,2) NOT NULL,
    "new_amount" DECIMAL(15,2) NOT NULL,
    "changed_by_id" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "cost_entry_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_updates" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "challenges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "client_satisfaction_rag" "RagStatus" NOT NULL,
    "client_satisfaction_note" TEXT,
    "escalation_count" INTEGER,
    "change_request_volume" INTEGER,
    "avg_response_time_days" DECIMAL(5,2),
    "entered_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risks" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "probability" "RiskLevel" NOT NULL,
    "cost_impact" DECIMAL(15,2) NOT NULL,
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "mitigation_plan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scope_creep_entries" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "effort_hours" DECIMAL(8,2) NOT NULL,
    "cost_impact" DECIMAL(15,2) NOT NULL,
    "decision" "ScopeCreepDecision" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scope_creep_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_notes" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "decision" TEXT,
    "reviewer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "project_allocations_project_id_team_member_id_start_date_key" ON "project_allocations"("project_id", "team_member_id", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "cost_categories_project_id_category_type_key" ON "cost_categories"("project_id", "category_type");

-- CreateIndex
CREATE UNIQUE INDEX "planned_amounts_cost_category_id_period_key" ON "planned_amounts"("cost_category_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "cost_entries_cost_category_id_period_key" ON "cost_entries"("cost_category_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "health_updates_project_id_period_key" ON "health_updates"("project_id", "period");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_milestones" ADD CONSTRAINT "payment_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_allocations" ADD CONSTRAINT "project_allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_allocations" ADD CONSTRAINT "project_allocations_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_categories" ADD CONSTRAINT "cost_categories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_amounts" ADD CONSTRAINT "planned_amounts_cost_category_id_fkey" FOREIGN KEY ("cost_category_id") REFERENCES "cost_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_cost_category_id_fkey" FOREIGN KEY ("cost_category_id") REFERENCES "cost_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_entered_by_id_fkey" FOREIGN KEY ("entered_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_entry_audit" ADD CONSTRAINT "cost_entry_audit_cost_entry_id_fkey" FOREIGN KEY ("cost_entry_id") REFERENCES "cost_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_updates" ADD CONSTRAINT "health_updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_updates" ADD CONSTRAINT "health_updates_entered_by_id_fkey" FOREIGN KEY ("entered_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scope_creep_entries" ADD CONSTRAINT "scope_creep_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_notes" ADD CONSTRAINT "review_notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_notes" ADD CONSTRAINT "review_notes_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
