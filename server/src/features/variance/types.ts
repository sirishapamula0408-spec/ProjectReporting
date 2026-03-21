/**
 * Variance Dashboard types (PRT-42 / FR30).
 */

export type RagLevel = 'GREEN' | 'AMBER' | 'RED';
export type TrendDirection = 'IMPROVING' | 'WORSENING' | 'STABLE';

export interface VarianceCell {
  planned: string;
  actual: string;
  variance: string;
  variancePercent: string;
  rag: RagLevel;
}

export interface CategoryVariance {
  categoryType: string;
  categoryLabel: string;
  months: Record<string, VarianceCell>;
  trend: TrendDirection;
}

export interface VarianceSummary {
  overallVariance: string;
  overallVariancePercent: string;
  overallRag: RagLevel;
  categoriesOverBudget: number;
  totalCategories: number;
  bestPerforming: string | null;
}

export interface VarianceResponse {
  projectId: number;
  periods: string[];
  categories: CategoryVariance[];
  totals: Record<string, VarianceCell>;
  totalTrend: TrendDirection;
  summary: VarianceSummary;
}
