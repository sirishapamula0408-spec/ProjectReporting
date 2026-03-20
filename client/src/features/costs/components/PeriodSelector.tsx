import { useCallback, useMemo } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { DropDownList } from '@progress/kendo-react-dropdowns';

interface PeriodSelectorProps {
  value: string; // YYYY-MM
  onChange: (period: string) => void;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parsePeriod(period: string): { year: number; month: number } {
  const [y, m] = period.split('-').map(Number);
  return { year: y, month: m };
}

function formatPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function displayPeriod(period: string): string {
  const { year, month } = parsePeriod(period);
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const handlePrev = useCallback(() => {
    const { year, month } = parsePeriod(value);
    if (month === 1) onChange(formatPeriod(year - 1, 12));
    else onChange(formatPeriod(year, month - 1));
  }, [value, onChange]);

  const handleNext = useCallback(() => {
    const { year, month } = parsePeriod(value);
    if (month === 12) onChange(formatPeriod(year + 1, 1));
    else onChange(formatPeriod(year, month + 1));
  }, [value, onChange]);

  // Build dropdown options for last 24 months + next 12 months
  const options = useMemo(() => {
    const result: Array<{ text: string; value: string }> = [];
    const now = new Date();
    for (let i = -24; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const p = formatPeriod(d.getFullYear(), d.getMonth() + 1);
      result.push({ text: displayPeriod(p), value: p });
    }
    return result;
  }, []);

  const selectedOption = options.find((o) => o.value === value) || { text: displayPeriod(value), value };

  return (
    <div className="period-selector">
      <Button fillMode="flat" size="small" onClick={handlePrev} aria-label="Previous month">
        ◀
      </Button>
      <DropDownList
        data={options}
        textField="text"
        dataItemKey="value"
        value={selectedOption}
        onChange={(e) => onChange(e.value.value)}
        style={{ width: 160 }}
      />
      <Button fillMode="flat" size="small" onClick={handleNext} aria-label="Next month">
        ▶
      </Button>
    </div>
  );
}
