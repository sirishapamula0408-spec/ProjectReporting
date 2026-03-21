import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/api';

export interface HealthUpdate {
  id: number;
  projectId: number;
  period: string;
  achievements: string[];
  challenges: string[];
  clientSatisfactionRag: 'RED' | 'AMBER' | 'GREEN';
  clientSatisfactionNote: string | null;
  escalationCount: number;
  changeRequestVolume: number;
  avgResponseTimeDays: string | null;
  enteredBy?: { id: number; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateHealthUpdateInput {
  period: string;
  achievements?: string[];
  challenges?: string[];
  clientSatisfactionRag: 'RED' | 'AMBER' | 'GREEN';
  clientSatisfactionNote?: string | null;
  escalationCount?: number | null;
  changeRequestVolume?: number | null;
  avgResponseTimeDays?: string | null;
}

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

export function useCreateHealthUpdate(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHealthUpdateInput) => {
      const res = await api.post<{ data: HealthUpdate }>(
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
