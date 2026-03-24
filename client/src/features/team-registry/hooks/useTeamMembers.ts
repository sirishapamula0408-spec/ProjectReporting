import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/api';

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  department: string;
  loadedCostRate: string;
  skills: string[];
  isActive: boolean;
}

interface TeamMembersResponse {
  data: TeamMember[];
  meta: { total: number; page: number; pageSize: number };
}

export interface TeamMembersParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useTeamMembers(params: TeamMembersParams) {
  return useQuery<TeamMembersResponse>({
    queryKey: ['team-members', params],
    queryFn: async () => {
      const res = await api.get<TeamMembersResponse>('/team-members', { params });
      return res.data;
    },
  });
}

export interface CreateTeamMemberInput {
  name: string;
  role: string;
  department: string;
  loadedCostRate: string;
  skills: string[];
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

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateTeamMemberInput> & { id: number }) => {
      const res = await api.put<{ data: TeamMember }>(`/team-members/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useDeactivateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/team-members/${id}`, { isActive: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}
