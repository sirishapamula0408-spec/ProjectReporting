import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/api';

// ─── Types ───

export interface PortfolioProject {
  id: number;
  code: string;
  name: string;
  client: string;
  status: string;
  managerName: string;
  healthRag: string | null;
  burnRate: string;
  marginPercent: number | null;
  budgetUsedPercent: number | null;
  contractValue: string;
  totalCost: string;
  updatedAt: string;
}

export interface PortfolioDashboardData {
  totalProjects: number;
  activeProjects: number;
  atRiskProjects: number;
  totalBurnRate: string;
  projects: PortfolioProject[];
}

export interface ReviewNote {
  id: number;
  projectId: number;
  reviewerName: string;
  decision: 'APPROVED' | 'NEEDS_REVISION' | 'ACKNOWLEDGED';
  note: string;
  createdAt: string;
}

export interface CreateReviewNoteInput {
  decision: string;
  note: string;
}

// ─── Portfolio Dashboard ───

export function usePortfolioDashboard() {
  return useQuery({
    queryKey: ['portfolio', 'dashboard'],
    queryFn: async () => {
      const res = await api.get<{ data: PortfolioDashboardData }>('/dashboards/portfolio');
      return res.data.data;
    },
  });
}

// ─── Review Notes ───

export function useReviewNotes(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'review-notes'],
    queryFn: async () => {
      const res = await api.get<{ data: ReviewNote[] }>(`/projects/${projectId}/review-notes`);
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateReviewNote(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReviewNoteInput) => {
      const res = await api.post<{ data: ReviewNote }>(`/projects/${projectId}/review-notes`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'review-notes'] });
    },
  });
}

// ─── Exports ───

async function downloadBlob(url: string, filename: string) {
  const res = await api.post(url, {}, { responseType: 'blob' });
  const blob = new Blob([res.data]);
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

export function useExportProjectPdf(projectId: number) {
  return useMutation({
    mutationFn: async () => {
      await downloadBlob(`/projects/${projectId}/export/pdf`, `project-${projectId}-report.pdf`);
    },
  });
}

export function useExportProjectExcel(projectId: number) {
  return useMutation({
    mutationFn: async () => {
      await downloadBlob(`/projects/${projectId}/export/excel`, `project-${projectId}-report.xlsx`);
    },
  });
}

export function useExportPortfolioPdf() {
  return useMutation({
    mutationFn: async () => {
      await downloadBlob('/portfolio/export/pdf', 'portfolio-report.pdf');
    },
  });
}

export function useExportPortfolioExcel() {
  return useMutation({
    mutationFn: async () => {
      await downloadBlob('/portfolio/export/excel', 'portfolio-report.xlsx');
    },
  });
}
