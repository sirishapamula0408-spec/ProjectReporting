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

export function useTeamMembers() {
  return useQuery<TeamMembersResponse>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await api.get<TeamMembersResponse>('/team-members');
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
