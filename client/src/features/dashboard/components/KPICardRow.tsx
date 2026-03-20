import type { ReactNode } from 'react';

interface KPICardRowProps {
  children: ReactNode;
}

export function KPICardRow({ children }: KPICardRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {children}
    </div>
  );
}
