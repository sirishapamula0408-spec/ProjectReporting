/**
 * Forecast Service — orchestrates data retrieval and forecast computation (PRT-38).
 */
import { Decimal } from 'decimal.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { canAccessProject, type AuthUser } from '../../shared/dataScope.js';
import {
  linearRegression,
  getConfidence,
  projectTotalCost,
  projectCompletionMonth,
} from './calculator.js';
import type { ForecastResponse, MonthlyBurn } from './types.js';

const MIN_DATA_POINTS = 3;

/**
 * Generates a forecast-to-completion for a project.
 * Requires at least 3 months of cost entry data.
 */
export async function getForecast(
  projectId: number,
  user: AuthUser,
): Promise<{ data: ForecastResponse }> {
  // Fetch project with access check
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      contractValue: true,
      managerId: true,
      businessUnit: true,
      endDate: true,
    },
  });

  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  if (!canAccessProject(user, project)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this project');
  }

  // Get monthly totals from cost_entries grouped by period
  const monthlyCosts = await prisma.costEntry.groupBy({
    by: ['period'],
    where: { projectId },
    _sum: { actualAmount: true },
    orderBy: { period: 'asc' },
  });

  // Check minimum data requirement
  if (monthlyCosts.length < MIN_DATA_POINTS) {
    return {
      data: {
        projectId,
        status: 'INSUFFICIENT_DATA',
        message: 'At least 3 months of burn rate data required for forecasting',
        dataPoints: monthlyCosts.length,
      },
    };
  }

  // Build monthly burn data with indices
  const monthlyBurns: MonthlyBurn[] = monthlyCosts.map((row, idx) => ({
    period: row.period,
    monthIndex: idx,
    totalCost: (row._sum.actualAmount ?? new Decimal(0)).toString(),
  }));

  // Run linear regression on (monthIndex, monthlyCost)
  const regressionPoints = monthlyBurns.map((b) => ({
    x: b.monthIndex,
    y: new Decimal(b.totalCost),
  }));

  const regression = linearRegression(regressionPoints);
  const confidence = getConfidence(regression.rSquared);

  // Project end month from project end date
  const endDate = project.endDate;
  const endMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;

  // Calculate projected total cost
  const projectedTotal = projectTotalCost(monthlyBurns, endMonth, regression);
  const contractValue = project.contractValue.toString();

  // Calculate variance
  const contractDec = new Decimal(contractValue);
  const projectedDec = new Decimal(projectedTotal);

  let variance: string | null = null;
  let variancePercent: string | null = null;
  let completionMonth: string | null = null;

  if (!contractDec.isZero()) {
    const varianceDec = projectedDec.minus(contractDec);
    variance = varianceDec.toFixed(2);
    variancePercent = varianceDec.div(contractDec).times(100).toFixed(2);
    completionMonth = projectCompletionMonth(monthlyBurns, contractValue, regression);
  }

  // Monthly trend = slope of regression (average monthly increase/decrease)
  const monthlyTrend = regression.slope;

  return {
    data: {
      projectId,
      projectedTotalCost: projectedTotal,
      contractValue,
      variance,
      variancePercent,
      completionMonth,
      confidence,
      dataPoints: monthlyBurns.length,
      rSquared: regression.rSquared,
      monthlyTrend,
    },
  };
}
