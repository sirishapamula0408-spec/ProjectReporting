import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/api';

// ─── Types ───

export interface HealthUpdate {
  id: number;
  projectId: number;
  period: string;
  achievements: string[];
  challenges: string[];
  clientSatisfactionRag: 'RED' | 'AMBER' | 'GREEN';
  clientSatisfactionNote: string | null;
  escalationCount: number | null;
  changeRequestVolume: number | null;
  avgResponseTimeDays: string | null;
  enteredById: number;
  createdAt: string;
  updatedAt: string;
}

export interface Risk {
  id: number;
  projectId: number;
  description: string;
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  costImpact: string;
  status: 'OPEN' | 'MITIGATED' | 'CLOSED' | 'MATERIALIZED';
  mitigationPlan: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertHealthUpdateInput {
  period: string;
  achievements: string[];
  challenges: string[];
  clientSatisfactionRag: 'RED' | 'AMBER' | 'GREEN';
  clientSatisfactionNote?: string | null;
  escalationCount?: number | null;
  changeRequestVolume?: number | null;
  avgResponseTimeDays?: string | null;
}

export interface CreateRiskInput {
  description: string;
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  costImpact: string;
  mitigationPlan?: string | null;
}

export interface UpdateRiskInput {
  description?: string;
  probability?: 'LOW' | 'MEDIUM' | 'HIGH';
  costImpact?: string;
  mitigationPlan?: string | null;
  status?: 'OPEN' | 'MITIGATED' | 'CLOSED' | 'MATERIALIZED';
}

export interface UpdateRiskStatusInput {
  status: 'OPEN' | 'MITIGATED' | 'CLOSED' | 'MATERIALIZED';
}

// ─── Health Updates ───

export function useHealthUpdates(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'health-updates'],
    queryFn: async () => {
      const res = await api.get<{ data: HealthUpdate[] }>(
        `/projects/${projectId}/health-updates`,
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useHealthUpdate(projectId: number | undefined, period: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'health-updates', period],
    queryFn: async () => {
      const res = await api.get<{ data: HealthUpdate }>(
        `/projects/${projectId}/health-updates/${period}`,
      );
      return res.data.data;
    },
    enabled: !!projectId && !!period,
  });
}

export function useUpsertHealthUpdate(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertHealthUpdateInput) => {
      const res = await api.put<{ data: HealthUpdate }>(
        `/projects/${projectId}/health-updates`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'health-updates'] });
    },
  });
}

// ─── Risks ───

export function useRisks(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'risks'],
    queryFn: async () => {
      const res = await api.get<{ data: Risk[] }>(`/projects/${projectId}/risks`);
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateRisk(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRiskInput) => {
      const res = await api.post<{ data: Risk }>(
        `/projects/${projectId}/risks`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'risks'] });
    },
  });
}

export function useUpdateRisk(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ riskId, ...input }: UpdateRiskInput & { riskId: number }) => {
      const res = await api.put<{ data: Risk }>(
        `/projects/${projectId}/risks/${riskId}`,
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'risks'] });
    },
  });
}

export function useUpdateRiskStatus(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ riskId, status }: { riskId: number; status: string }) => {
      const res = await api.patch<{ data: Risk }>(
        `/projects/${projectId}/risks/${riskId}/status`,
        { status },
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'risks'] });
    },
  });
}
