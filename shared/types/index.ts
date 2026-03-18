// =====================================================================
// Shared types between client and server
// All enums and interfaces mirror the Prisma schema
// =====================================================================

// Enums
export enum Role {
  PM = 'PM',
  BU_HEAD = 'BU_HEAD',
  CFO = 'CFO',
}

export enum ProjectStatus {
  PROPOSAL = 'PROPOSAL',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}

export enum CostCategoryType {
  EMPLOYEE_SALARY = 'EMPLOYEE_SALARY',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS',
  TRAVEL = 'TRAVEL',
  ACCOMMODATION = 'ACCOMMODATION',
  FOOD_ALLOWANCE = 'FOOD_ALLOWANCE',
  GIFTS = 'GIFTS',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  CONTRACTOR = 'CONTRACTOR',
}

export enum RagStatus {
  RED = 'RED',
  AMBER = 'AMBER',
  GREEN = 'GREEN',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum RiskStatus {
  OPEN = 'OPEN',
  MITIGATED = 'MITIGATED',
  CLOSED = 'CLOSED',
  MATERIALIZED = 'MATERIALIZED',
}

export enum ScopeCreepDecision {
  ABSORBED = 'ABSORBED',
  CHANGE_REQUEST = 'CHANGE_REQUEST',
  DECLINED = 'DECLINED',
}

// Valid project state transitions
export const VALID_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.PROPOSAL]: [ProjectStatus.ACTIVE],
  [ProjectStatus.ACTIVE]: [ProjectStatus.ON_HOLD, ProjectStatus.COMPLETED, ProjectStatus.CLOSED],
  [ProjectStatus.ON_HOLD]: [ProjectStatus.ACTIVE, ProjectStatus.CLOSED],
  [ProjectStatus.COMPLETED]: [ProjectStatus.CLOSED],
  [ProjectStatus.CLOSED]: [],
};

// Cost category display labels
export const COST_CATEGORY_LABELS: Record<CostCategoryType, string> = {
  [CostCategoryType.EMPLOYEE_SALARY]: 'Salaries & Payroll',
  [CostCategoryType.SUBSCRIPTIONS]: 'Software Licenses',
  [CostCategoryType.TRAVEL]: 'Travel & Lodging',
  [CostCategoryType.ACCOMMODATION]: 'Accommodation',
  [CostCategoryType.FOOD_ALLOWANCE]: 'Food Allowance',
  [CostCategoryType.GIFTS]: 'Gifts',
  [CostCategoryType.INFRASTRUCTURE]: 'Hardware/Infrastructure',
  [CostCategoryType.CONTRACTOR]: 'Subcontractors',
};

// API Response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// User types (used in auth context)
export interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: Role;
  businessUnit: string | null;
}
