import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-7 w-7 md:h-8 md:w-8 text-primary" />}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">{title}</h1>
        </div>
        {action && <div className="md:ml-auto">{action}</div>}
      </div>
      {description && <p className="text-muted-foreground mt-2 text-sm md:text-base">{description}</p>}
    </div>
  );
}
