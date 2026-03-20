import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/api';

// ─── Types ───

export interface CostCategory {
  id: number;
  projectId: number;
  categoryType: string;
  createdAt: string;
}

export interface PlannedAmount {
  id: number;
  costCategoryId: number;
  categoryType: string;
  period: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostEntry {
  id: number;
  projectId: number;
  costCategoryId: number;
  categoryType: string;
  period: string;
  actualAmount: string;
  notes: string | null;
  enteredBy: { id: number; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export interface VarianceCategory {
  costCategoryId: number;
  categoryType: string;
  planned: string;
  actual: string;
  variance: string;
  variancePct: number;
  rag: string;
}

export interface VarianceData {
  period: string;
  categories: VarianceCategory[];
  totals: {
    planned: string;
    actual: string;
    variance: string;
    variancePct: number;
    rag: string;
  };
}

export interface BurnRatePeriod {
  period: string;
  monthlyBurn: string;
  cumulativeBurn: string;
}

export interface BurnRateData {
  contractValue: string;
  periods: BurnRatePeriod[];
}

export interface DashboardData {
  contractValue: string;
  totalSpend: string;
  totalPlanned: string;
  budgetRemaining: string;
  spendPct: number;
  variance: string;
  variancePct: number;
  varianceRag: string;
}

// ─── Cost Categories ───

export function useCostCategories(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'cost-categories'],
    queryFn: async () => {
      const res = await api.get<{ data: CostCategory[] }>(`/projects/${projectId}/cost-categories`);
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

// ─── Planned Amounts ───

export function usePlannedAmounts(projectId: number | undefined, period?: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'planned-amounts', period],
    queryFn: async () => {
      const params = period ? { period } : undefined;
      const res = await api.get<{ data: PlannedAmount[] }>(
        `/projects/${projectId}/cost-categories/planned-amounts`,
        { params },
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useBatchUpsertPlannedAmounts(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ costCategoryId: number; period: string; amount: string }>) => {
      const res = await api.put(`/projects/${projectId}/cost-categories/planned-amounts`, { items });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

// ─── Cost Entries ───

export function useCostEntries(projectId: number | undefined, period?: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'cost-entries', period],
    queryFn: async () => {
      const params = period ? { period } : undefined;
      const res = await api.get<{ data: CostEntry[] }>(
        `/projects/${projectId}/cost-categories/cost-entries`,
        { params },
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useBatchUpsertCostEntries(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ costCategoryId: number; period: string; actualAmount: string; notes?: string }>) => {
      const res = await api.put(`/projects/${projectId}/cost-categories/cost-entries`, { items });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

// ─── Variance ───

export function useVariance(projectId: number | undefined, period: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'variance', period],
    queryFn: async () => {
      const res = await api.get<{ data: VarianceData }>(
        `/projects/${projectId}/cost-categories/variance`,
        { params: { period } },
      );
      return res.data.data;
    },
    enabled: !!projectId && !!period,
  });
}

// ─── Burn Rate ───

export function useBurnRate(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'burn-rate'],
    queryFn: async () => {
      const res = await api.get<{ data: BurnRateData }>(
        `/projects/${projectId}/cost-categories/burn-rate`,
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

// ─── Dashboard ───

export function useCostDashboard(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'dashboard'],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardData }>(
        `/projects/${projectId}/cost-categories/dashboard`,
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}
