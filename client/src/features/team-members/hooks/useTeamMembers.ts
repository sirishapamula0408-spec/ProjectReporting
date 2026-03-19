import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/api';

// ─── Types ───

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  department: string;
  loadedCostRate: string;
  skills: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: number;
  projectId: number;
  teamMemberId: number;
  allocationPct: string;
  startDate: string;
  endDate: string | null;
  onboardingDate: string | null;
  offboardingDate: string | null;
  teamMember?: TeamMember;
  project?: { id: number; code: string; name: string; status: string };
}

export interface CreateAllocationInput {
  teamMemberId: number;
  allocationPct: string;
  startDate: string;
  endDate?: string | null;
  onboardingDate?: string | null;
  offboardingDate?: string | null;
}

export interface UpdateAllocationInput {
  allocationPct?: string;
  startDate?: string;
  endDate?: string | null;
  onboardingDate?: string | null;
  offboardingDate?: string | null;
}

export interface CreateTeamMemberInput {
  name: string;
  role: string;
  department: string;
  loadedCostRate: string;
  skills?: string[];
}

// ─── Team Members ───

export function useTeamMembers(params?: { search?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['team-members', params],
    queryFn: async () => {
      const res = await api.get<{ data: TeamMember[]; meta: { total: number } }>(
        '/team-members',
        { params },
      );
      return res.data;
    },
  });
}

export function useTeamMember(id: number | undefined) {
  return useQuery({
    queryKey: ['team-members', id],
    queryFn: async () => {
      const res = await api.get<{ data: TeamMember }>(`/team-members/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTeamMemberInput) => {
      const res = await api.post<{ data: TeamMember }>('/team-members', input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useUpdateTeamMember(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CreateTeamMemberInput> & { isActive?: boolean }) => {
      const res = await api.put<{ data: TeamMember }>(`/team-members/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

// ─── Project Allocations ───

export function useProjectAllocations(projectId: number | undefined) {
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

export function useUpdateAllocation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ allocationId, data }: { allocationId: number; data: UpdateAllocationInput }) => {
      const res = await api.put<{ data: Allocation }>(
        `/projects/${projectId}/allocations/${allocationId}`,
        data,
      );
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

// ─── Cross-project Allocations ───

export function useMemberAllocations(teamMemberId: number | undefined) {
  return useQuery({
    queryKey: ['team-members', teamMemberId, 'allocations'],
    queryFn: async () => {
      const res = await api.get<{ data: Allocation[] }>(`/team-members/${teamMemberId}/allocations`);
      return res.data.data;
    },
    enabled: !!teamMemberId,
  });
}
