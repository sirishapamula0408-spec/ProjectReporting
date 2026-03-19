import { Loader } from '@progress/kendo-react-indicators';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
}

export function LoadingSpinner({ size = 'medium', fullPage = false }: LoadingSpinnerProps) {
  if (fullPage) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}>
        <Loader size={size} type="infinite-spinner" themeColor="primary" />
      </div>
    );
  }

  return <Loader size={size} type="infinite-spinner" themeColor="primary" />;
}
