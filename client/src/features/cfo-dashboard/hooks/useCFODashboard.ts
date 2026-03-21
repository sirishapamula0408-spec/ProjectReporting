import { useQuery } from '@tanstack/react-query';
import api from '../../../config/api';

export interface BurnRateTrend {
  month: string;
  total: string;
}

export interface MarginHealthProject {
  projectId: number;
  projectName: string;
  contractValue: string;
  totalSpend: string;
  marginPercent: string;
  healthRag: 'GREEN' | 'AMBER' | 'RED';
}

export interface RevenueVsCostEntry {
  month: string;
  totalRevenue: string;
  totalCost: string;
}

export interface ForecastProject {
  projectId: number;
  projectName: string;
  projectedTotalCost: string;
  contractValue: string;
  variance: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  completionMonth: string | null;
}

export interface PortfolioAggregates {
  totalContractValue: string;
  totalSpend: string;
  projectedTotalCost: string;
  overallMarginPercent: string;
}

export interface CFODashboardData {
  burnRate: {
    currentMonthTotal: string;
    trend: BurnRateTrend[];
  };
  marginHealth: MarginHealthProject[];
  revenueVsCost: RevenueVsCostEntry[];
  forecastList: ForecastProject[];
  aggregates: PortfolioAggregates;
}

export function useCFODashboard() {
  return useQuery({
    queryKey: ['dashboards', 'cfo'],
    queryFn: async () => {
      const res = await api.get<{ data: CFODashboardData }>('/dashboards/cfo');
      return res.data.data;
    },
  });
}
