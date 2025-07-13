// src/app/settings/layout.tsx
import type { ReactNode } from 'react';

// This layout can be used for common styling or structure for all settings pages.
// Access control is handled by the specific feature layouts, not here, to ensure
// all users can access their main settings and billing pages.

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <div className="container mx-auto py-6">{children}</div>;
}
