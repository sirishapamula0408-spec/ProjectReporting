import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/api';

export interface BudgetItem {
  categoryType: string;
  period: string;
  amount: string;
}

interface SaveBudgetPlanInput {
  items: BudgetItem[];
}

export function useBudgetPlan(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'budget'],
    queryFn: async () => {
      const res = await api.get<{ data: BudgetItem[] }>(`/projects/${projectId}/budget`);
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useSaveBudgetPlan(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveBudgetPlanInput) => {
      const res = await api.post<{ data: BudgetItem[] }>(`/projects/${projectId}/budget`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'budget'] });
    },
  });
}
