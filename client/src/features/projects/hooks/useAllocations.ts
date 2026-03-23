import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/api';

export interface Allocation {
  id: number;
  projectId: number;
  teamMemberId: number;
  allocationPct: string;
  startDate: string;
  endDate: string | null;
  teamMember?: { id: number; name: string; role: string };
}

interface CreateAllocationInput {
  teamMemberId: number;
  allocationPct: string;
  startDate: string;
  endDate?: string;
}

export function useAllocations(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'allocations'],
    queryFn: async () => {
      const res = await api.get<{ data: Allocation[] }>(`/projects/${projectId}/allocations`);
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateAllocation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAllocationInput) => {
      const res = await api.post<{ data: Allocation }>(`/projects/${projectId}/allocations`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'allocations'] });
    },
  });
}

export function useDeleteAllocation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (allocationId: number) => {
      await api.delete(`/projects/${projectId}/allocations/${allocationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'allocations'] });
    },
  });
}
