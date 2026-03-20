import { Button } from '@progress/kendo-react-buttons';

interface ExportButtonsProps {
  onExportPdf: () => void;
  onExportExcel: () => void;
  isPdfLoading?: boolean;
  isExcelLoading?: boolean;
}

export function ExportButtons({
  onExportPdf,
  onExportExcel,
  isPdfLoading = false,
  isExcelLoading = false,
}: ExportButtonsProps) {
  return (
    <div className="export-buttons">
      <Button
        themeColor="primary"
        onClick={onExportPdf}
        disabled={isPdfLoading || isExcelLoading}
      >
        {isPdfLoading ? 'Exporting...' : 'Export PDF'}
      </Button>
      <Button
        className="btn-secondary"
        onClick={onExportExcel}
        disabled={isPdfLoading || isExcelLoading}
      >
        {isExcelLoading ? 'Exporting...' : 'Export Excel'}
      </Button>
    </div>
  );
}
