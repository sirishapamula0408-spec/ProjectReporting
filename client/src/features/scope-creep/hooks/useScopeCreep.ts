import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/api';

export interface ScopeCreepEntry {
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

export interface ScopeCreepData {
  entries: ScopeCreepEntry[];
  aggregation: ScopeCreepAggregation;
}

export interface CreateScopeCreepInput {
  description: string;
  effortHours: string;
  costImpact: string;
  decision: 'ABSORBED' | 'CHANGE_REQUEST' | 'DECLINED';
}

export function useScopeCreep(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'scope-creep'],
    queryFn: async () => {
      const res = await api.get<{ data: ScopeCreepData }>(
        `/projects/${projectId}/scope-creep`,
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateScopeCreep(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateScopeCreepInput) => {
      const res = await api.post<{ data: ScopeCreepEntry }>(
        `/projects/${projectId}/scope-creep`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'scope-creep'] });
    },
  });
}

export function useDeleteScopeCreep(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: number) => {
      await api.delete(`/projects/${projectId}/scope-creep/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'scope-creep'] });
    },
  });
}
