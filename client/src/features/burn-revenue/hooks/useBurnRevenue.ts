import { useQuery } from '@tanstack/react-query';
import api from '../../../config/api';

export interface TimelineEntry {
  month: string;
  monthlySpend: string;
  cumulativeSpend: string;
  paymentAmount: string;
  cumulativeRevenue: string;
  gap: string;
  status: 'SURPLUS' | 'DEFICIT';
}

export interface TimelineSummary {
  totalSpend: string;
  totalRevenue: string;
  currentGap: string;
  status: 'SURPLUS' | 'DEFICIT';
}

export interface BurnRevenueData {
  projectId: number;
  timeline: TimelineEntry[];
  summary: TimelineSummary;
}

export function useBurnRevenue(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'burn-revenue'],
    queryFn: async () => {
      const res = await api.get<{ data: BurnRevenueData }>(
        `/projects/${projectId}/burn-revenue`,
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}
