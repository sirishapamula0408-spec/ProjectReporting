/**
 * CFO Dashboard types (PRT-43 / FR29).
 */

export interface BurnRateTrend {
  month: string;
  total: string;
}

export interface BurnRateData {
  currentMonthTotal: string;
  trend: BurnRateTrend[];
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

export interface CFODashboardResponse {
  burnRate: BurnRateData;
  marginHealth: MarginHealthProject[];
  revenueVsCost: RevenueVsCostEntry[];
  forecastList: ForecastProject[];
  aggregates: PortfolioAggregates;
}
