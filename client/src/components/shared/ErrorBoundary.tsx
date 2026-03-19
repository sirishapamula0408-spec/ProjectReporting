import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@progress/kendo-react-buttons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
          gap: '16px',
          padding: '32px',
          textAlign: 'center',
        }}>
          <h2 style={{ color: 'var(--color-red)', margin: 0 }}>Something went wrong</h2>
          <p style={{ color: 'var(--color-gray-500)', maxWidth: '400px' }}>
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          <Button themeColor="primary" onClick={this.handleReset}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
