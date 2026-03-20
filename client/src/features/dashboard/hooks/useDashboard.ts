import { useQuery } from '@tanstack/react-query';
import api from '../../../config/api';

// ─── Types ───

export interface ProjectSummary {
  id: number;
  code: string;
  name: string;
  client: string;
  status: string;
  healthRag: 'RED' | 'AMBER' | 'GREEN' | null;
  currentBurnRate: string;
  budgetUsedPct: number;
  updatedAt: string;
}

export interface PmDashboardKpis {
  totalActiveProjects: number;
  projectsAtRisk: number;
  totalPortfolioBurnRate: string;
}

export interface PmDashboardData {
  kpis: PmDashboardKpis;
  projects: ProjectSummary[];
}

// ─── Hooks ───

export function usePmDashboard() {
  return useQuery({
    queryKey: ['dashboards', 'pm'],
    queryFn: async () => {
      const res = await api.get<{ data: PmDashboardData }>('/dashboards/pm');
      return res.data.data;
    },
  });
}
