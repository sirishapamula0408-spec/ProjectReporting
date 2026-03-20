import { useQuery } from '@tanstack/react-query';
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
