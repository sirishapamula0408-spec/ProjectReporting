/**
 * Burn vs Revenue Timeline types (PRT-39 / FR18).
 */

export interface TimelineEntry {
  month: string;           // "YYYY-MM"
  monthlySpend: string;    // Decimal string
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

export interface BurnRevenueResponse {
  projectId: number;
  timeline: TimelineEntry[];
  summary: TimelineSummary;
}
