import Link from 'next/link';
import { Icons } from '@/components/icons';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.Logo className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">Algo Grind</span>
        </Link>
        {/* Add navigation items here if needed later */}
      </div>
    </header>
  );
}
