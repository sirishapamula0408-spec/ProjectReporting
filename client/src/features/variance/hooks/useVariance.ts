import { useQuery } from '@tanstack/react-query';
import api from '../../../config/api';

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

export interface VarianceData {
  projectId: number;
  periods: string[];
  categories: CategoryVariance[];
  totals: Record<string, VarianceCell>;
  totalTrend: TrendDirection;
  summary: VarianceSummary;
}

export function useVariance(
  projectId: number | undefined,
  startPeriod?: string,
  endPeriod?: string,
) {
  return useQuery({
    queryKey: ['projects', projectId, 'variance', { startPeriod, endPeriod }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (startPeriod) params['startPeriod'] = startPeriod;
      if (endPeriod) params['endPeriod'] = endPeriod;
      const res = await api.get<{ data: VarianceData }>(
        `/projects/${projectId}/variance`,
        { params },
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}
