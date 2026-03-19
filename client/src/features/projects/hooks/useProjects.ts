import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/api';

interface Project {
  id: number;
  code: string;
  name: string;
  client: string;
  contractValue: string;
  startDate: string;
  endDate: string;
  status: string;
  businessUnit: string;
  description: string | null;
  managerId: number;
  manager: { id: number; displayName: string; username: string };
  createdAt: string;
  updatedAt: string;
}

interface Milestone {
  id: number;
  projectId: number;
  name: string;
  amount: string;
  dueDate: string;
  isPaid: boolean;
  paidDate: string | null;
}

interface CreateProjectInput {
  code: string;
  name: string;
  client: string;
  contractValue: string;
  startDate: string;
  endDate: string;
  businessUnit: string;
  description?: string | null;
}

interface CreateMilestoneInput {
  name: string;
  amount: string;
  dueDate: string;
}

// ─── Projects ───

export function useProjects(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['projects', { page, pageSize }],
    queryFn: async () => {
      const res = await api.get<{ data: Project[]; meta: { total: number; page: number; pageSize: number } }>(
        '/projects',
        { params: { page, pageSize } },
      );
      return res.data;
    },
  });
}

export function useProjectDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const res = await api.get<{ data: Project }>(`/projects/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const res = await api.post<{ data: Project }>('/projects', input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CreateProjectInput>) => {
      const res = await api.put<{ data: Project }>(`/projects/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}

export function useTransitionStatus(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const res = await api.patch<{ data: Project }>(`/projects/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}

// ─── Milestones ───

export function useMilestones(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'milestones'],
    queryFn: async () => {
      const res = await api.get<{ data: Milestone[] }>(`/projects/${projectId}/milestones`);
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateMilestone(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMilestoneInput) => {
      const res = await api.post<{ data: Milestone }>(`/projects/${projectId}/milestones`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'milestones'] });
    },
  });
}

export function useDeleteMilestone(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (milestoneId: number) => {
      await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'milestones'] });
    },
  });
}
