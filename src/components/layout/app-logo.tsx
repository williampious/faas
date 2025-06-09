import { Leaf } from 'lucide-react';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2 group">
      <div className="p-2 bg-primary group-hover:bg-primary/90 transition-colors rounded-lg">
        <Leaf className="h-6 w-6 text-primary-foreground" />
      </div>
      <span className="font-headline text-xl font-bold text-sidebar-foreground group-hover:text-sidebar-foreground/80 transition-colors">
        AgriFAAS Connect
      </span>
    </Link>
  );
}
