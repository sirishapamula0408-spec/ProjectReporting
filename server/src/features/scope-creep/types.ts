/**
 * Scope Creep types (PRT-40 / FR24, FR25).
 */

export interface ScopeCreepEntryResponse {
  id: number;
  projectId: number;
  description: string;
  effortHours: string;
  costImpact: string;
  decision: 'ABSORBED' | 'CHANGE_REQUEST' | 'DECLINED';
  createdAt: string;
  updatedAt: string;
}

export interface DecisionBreakdown {
  count: number;
  hours: string;
  cost: string;
}

export interface ScopeCreepAggregation {
  totalEntries: number;
  totalEffortHours: string;
  totalCostImpact: string;
  byDecision: {
    ABSORBED: DecisionBreakdown;
    CHANGE_REQUEST: DecisionBreakdown;
    DECLINED: DecisionBreakdown;
  };
}

export interface ScopeCreepListResponse {
  entries: ScopeCreepEntryResponse[];
  aggregation: ScopeCreepAggregation;
}
