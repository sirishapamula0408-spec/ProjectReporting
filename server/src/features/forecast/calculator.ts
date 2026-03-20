/**
 * Forecast Calculator — Linear regression engine using Decimal.js (PRT-38).
 * All arithmetic uses Decimal.js for financial precision (NFR18).
 * Deterministic: same inputs always produce same outputs (NFR14).
 */
import { Decimal } from 'decimal.js';
import type { RegressionResult, MonthlyBurn } from './types.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const ZERO = new Decimal(0);
const ONE = new Decimal(1);

/**
 * Parses "YYYY-MM" into { year, month } integers.
 */
function parsePeriod(period: string): { year: number; month: number } {
  const parts = period.split('-');
  return { year: Number(parts[0]), month: Number(parts[1]) };
}

/**
 * Gets the month index relative to a base period.
 */
function getMonthIndex(period: string, basePeriod: string): number {
  const base = parsePeriod(basePeriod);
  const target = parsePeriod(period);
  return (target.year - base.year) * 12 + (target.month - base.month);
}

/**
 * Converts a month index back to "YYYY-MM" format.
 */
function indexToMonth(index: number, basePeriod: string): string {
  const base = parsePeriod(basePeriod);
  const totalMonths = (base.year * 12 + base.month - 1) + index;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Least-squares linear regression on (x, y) data points.
 * Returns slope, intercept, and R-squared (coefficient of determination).
 */
export function linearRegression(
  points: Array<{ x: number; y: Decimal }>,
): RegressionResult {
  const n = new Decimal(points.length);

  let sumX = ZERO;
  let sumY = ZERO;
  let sumXY = ZERO;
  let sumX2 = ZERO;

  for (const p of points) {
    const x = new Decimal(p.x);
    sumX = sumX.plus(x);
    sumY = sumY.plus(p.y);
    sumXY = sumXY.plus(x.times(p.y));
    sumX2 = sumX2.plus(x.times(x));
  }

  // slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX)
  const numerator = n.times(sumXY).minus(sumX.times(sumY));
  const denominator = n.times(sumX2).minus(sumX.times(sumX));

  const slope = denominator.isZero() ? ZERO : numerator.div(denominator);

  // intercept = (sumY - slope*sumX) / n
  const intercept = sumY.minus(slope.times(sumX)).div(n);

  // R-squared calculation
  const meanY = sumY.div(n);
  let ssTot = ZERO;
  let ssRes = ZERO;

  for (const p of points) {
    const x = new Decimal(p.x);
    const predicted = slope.times(x).plus(intercept);
    const residual = p.y.minus(predicted);
    const deviation = p.y.minus(meanY);
    ssRes = ssRes.plus(residual.times(residual));
    ssTot = ssTot.plus(deviation.times(deviation));
  }

  const rSquared = ssTot.isZero() ? ONE : ONE.minus(ssRes.div(ssTot));

  return {
    slope: slope.toFixed(2),
    intercept: intercept.toFixed(2),
    rSquared: rSquared.toFixed(2),
  };
}

/**
 * Determines confidence level from R-squared value.
 */
export function getConfidence(rSquared: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const r2 = new Decimal(rSquared);
  if (r2.gte(0.8)) return 'HIGH';
  if (r2.gte(0.5)) return 'MEDIUM';
  return 'LOW';
}

/**
 * Returns the greater of a Decimal value and zero.
 */
function clampPositive(value: Decimal): Decimal {
  return value.gt(ZERO) ? value : ZERO;
}

/**
 * Projects total cost at the project end date using the linear model.
 */
export function projectTotalCost(
  monthlyBurns: MonthlyBurn[],
  endMonth: string,
  regression: RegressionResult,
): string {
  const first = monthlyBurns[0];
  const last = monthlyBurns[monthlyBurns.length - 1];
  if (!first || !last) return '0.00';

  const slope = new Decimal(regression.slope);
  const intercept = new Decimal(regression.intercept);

  let cumulativeCost = ZERO;
  for (const burn of monthlyBurns) {
    cumulativeCost = cumulativeCost.plus(burn.totalCost);
  }

  const lastIndex = last.monthIndex;
  const endIndex = getMonthIndex(endMonth, first.period);

  if (endIndex <= lastIndex) {
    return cumulativeCost.toFixed(2);
  }

  // Project forward
  for (let i = lastIndex + 1; i <= endIndex; i++) {
    const projectedMonthly = clampPositive(slope.times(i).plus(intercept));
    cumulativeCost = cumulativeCost.plus(projectedMonthly);
  }

  return cumulativeCost.toFixed(2);
}

/**
 * Finds the month when cumulative cost will reach the contract value.
 */
export function projectCompletionMonth(
  monthlyBurns: MonthlyBurn[],
  contractValue: string,
  regression: RegressionResult,
): string | null {
  const first = monthlyBurns[0];
  const last = monthlyBurns[monthlyBurns.length - 1];
  if (!first || !last) return null;

  const contract = new Decimal(contractValue);
  const slope = new Decimal(regression.slope);
  const intercept = new Decimal(regression.intercept);

  let cumulativeCost = ZERO;
  for (const burn of monthlyBurns) {
    cumulativeCost = cumulativeCost.plus(burn.totalCost);
  }

  if (cumulativeCost.gte(contract)) {
    return last.period;
  }

  const lastIndex = last.monthIndex;

  // Project forward up to 120 months (10 years max)
  for (let i = lastIndex + 1; i <= lastIndex + 120; i++) {
    const projectedMonthly = clampPositive(slope.times(i).plus(intercept));

    if (projectedMonthly.isZero()) return null;

    cumulativeCost = cumulativeCost.plus(projectedMonthly);
    if (cumulativeCost.gte(contract)) {
      return indexToMonth(i, first.period);
    }
  }

  return null;
}
