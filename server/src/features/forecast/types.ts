/**
 * Forecast to Completion types (PRT-38 / FR17).
 */

export interface ForecastResult {
  projectId: number;
  projectedTotalCost: string;
  contractValue: string;
  variance: string | null;
  variancePercent: string | null;
  completionMonth: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  dataPoints: number;
  rSquared: string;
  monthlyTrend: string;
}

export interface InsufficientDataResult {
  projectId: number;
  status: 'INSUFFICIENT_DATA';
  message: string;
  dataPoints: number;
}

export type ForecastResponse = ForecastResult | InsufficientDataResult;

export interface RegressionResult {
  slope: string;
  intercept: string;
  rSquared: string;
}

export interface MonthlyBurn {
  period: string;   // "YYYY-MM"
  monthIndex: number;
  totalCost: string; // Decimal string
}
