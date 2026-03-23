import { useState, useEffect, useCallback } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { useToast } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import { useBudgetPlan, useSaveBudgetPlan, type BudgetItem } from '../hooks/useBudget';
import './BudgetPlanning.css';

const CATEGORY_TYPES = [
  'EMPLOYEE_SALARY',
  'SUBSCRIPTIONS',
  'TRAVEL',
  'ACCOMMODATION',
  'FOOD_ALLOWANCE',
  'GIFTS',
  'INFRASTRUCTURE',
  'CONTRACTOR',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  EMPLOYEE_SALARY: 'Employee Salary',
  SUBSCRIPTIONS: 'Subscriptions',
  TRAVEL: 'Travel',
  ACCOMMODATION: 'Accommodation',
  FOOD_ALLOWANCE: 'Food Allowance',
  GIFTS: 'Gifts',
  INFRASTRUCTURE: 'Infrastructure',
  CONTRACTOR: 'Contractor',
};

interface BudgetPlanningProps {
  projectId?: number;
  startDate?: string;
  endDate?: string;
  mode: 'create' | 'edit';
}

function generateMonths(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

function formatMonth(period: string): string {
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
}

export function BudgetPlanning({ projectId, startDate, endDate, mode }: BudgetPlanningProps) {
  const { showToast } = useToast();
  const { data: budgetData = [] } = useBudgetPlan(projectId);
  const saveBudgetPlan = useSaveBudgetPlan(projectId ?? 0);

  // Grid state: { [categoryType]: { [period]: amount string } }
  const [grid, setGrid] = useState<Record<string, Record<string, string>>>({});

  const months = startDate && endDate ? generateMonths(startDate, endDate) : [];

  // Initialize grid from budget data
  useEffect(() => {
    const newGrid: Record<string, Record<string, string>> = {};
    for (const cat of CATEGORY_TYPES) {
      newGrid[cat] = {};
      for (const month of months) {
        newGrid[cat][month] = '';
      }
    }
    // Fill existing data
    for (const item of budgetData) {
      if (newGrid[item.categoryType] && months.includes(item.period)) {
        newGrid[item.categoryType][item.period] = item.amount;
      }
    }
    setGrid(newGrid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetData, startDate, endDate]);

  const handleCellChange = useCallback((categoryType: string, period: string, value: string) => {
    setGrid((prev) => ({
      ...prev,
      [categoryType]: {
        ...prev[categoryType],
        [period]: value,
      },
    }));
  }, []);

  const getRowTotal = (categoryType: string): number => {
    if (!grid[categoryType]) return 0;
    return Object.values(grid[categoryType]).reduce((sum, val) => {
      const n = parseFloat(val);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  };

  const getColumnTotal = (period: string): number => {
    return CATEGORY_TYPES.reduce((sum, cat) => {
      const val = grid[cat]?.[period] ?? '';
      const n = parseFloat(val);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  };

  const getGrandTotal = (): number => {
    return CATEGORY_TYPES.reduce((sum, cat) => sum + getRowTotal(cat), 0);
  };

  const handleSave = async () => {
    const items: BudgetItem[] = [];
    for (const cat of CATEGORY_TYPES) {
      for (const month of months) {
        const val = grid[cat]?.[month];
        if (val && parseFloat(val) > 0) {
          items.push({
            categoryType: cat,
            period: month,
            amount: parseFloat(val).toFixed(2),
          });
        }
      }
    }

    if (items.length === 0) {
      showToast('No budget amounts to save', 'error');
      return;
    }

    try {
      await saveBudgetPlan.mutateAsync({ items });
      showToast('Budget plan saved successfully', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || 'Failed to save budget plan', 'error');
    }
  };

  if (mode === 'create') {
    return (
      <section className="project-form__section">
        <div className="project-form__section-header">
          <h2 className="project-form__section-title">Section 3 — Budget Planning (8 Categories)</h2>
          <span className="project-form__section-hint">Plan monthly budget across cost categories</span>
        </div>
        <div className="budget-planning__placeholder">
          Save project first to set up budget.
        </div>
      </section>
    );
  }

  if (months.length === 0) {
    return (
      <section className="project-form__section">
        <div className="project-form__section-header">
          <h2 className="project-form__section-title">Section 3 — Budget Planning (8 Categories)</h2>
          <span className="project-form__section-hint">Plan monthly budget across cost categories</span>
        </div>
        <div className="budget-planning__placeholder">
          Set project start and end dates to enable budget planning.
        </div>
      </section>
    );
  }

  return (
    <section className="project-form__section">
      <div className="project-form__section-header">
        <h2 className="project-form__section-title">Section 3 — Budget Planning (8 Categories)</h2>
        <Button
          type="button"
          themeColor="primary"
          onClick={handleSave}
          disabled={saveBudgetPlan.isPending}
        >
          {saveBudgetPlan.isPending ? 'Saving...' : 'Save Budget'}
        </Button>
      </div>

      <div className="budget-planning__grid-wrapper">
        <table className="budget-planning__table">
          <thead>
            <tr>
              <th className="budget-planning__category-header">CATEGORY</th>
              {months.map((month) => (
                <th key={month} className="budget-planning__month-header">
                  {formatMonth(month)}
                </th>
              ))}
              <th className="budget-planning__total-header">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORY_TYPES.map((cat) => (
              <tr key={cat}>
                <td className="budget-planning__category-cell">
                  {CATEGORY_LABELS[cat]}
                </td>
                {months.map((month) => (
                  <td key={month} className="budget-planning__amount-cell">
                    <input
                      type="text"
                      className="budget-planning__input"
                      value={grid[cat]?.[month] ?? ''}
                      onChange={(e) => handleCellChange(cat, month, e.target.value)}
                      placeholder="0.00"
                    />
                  </td>
                ))}
                <td className="budget-planning__row-total">
                  {formatINR(getRowTotal(cat).toFixed(2))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="budget-planning__totals-row">
              <td className="budget-planning__category-cell"><strong>Monthly Total</strong></td>
              {months.map((month) => (
                <td key={month} className="budget-planning__col-total">
                  {formatINR(getColumnTotal(month).toFixed(2))}
                </td>
              ))}
              <td className="budget-planning__grand-total">
                {formatINR(getGrandTotal().toFixed(2))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
