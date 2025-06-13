
// src/app/reports/layout.tsx
import type { ReactNode } from 'react';

// This layout can be used for common styling or structure for all report pages if needed.
// For now, it's minimal.

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <div className="container mx-auto py-6">{children}</div>;
}
