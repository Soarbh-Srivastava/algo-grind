// src/components/layout/header.tsx
"use client";

import Link from 'next/link';
import { Icons } from '@/components/icons';
// Removed: import { useAuth } from '@/context/auth-context';
// Removed: import { Button } from '@/components/ui/button';
// Removed: import { useRouter } from 'next/navigation';
// Removed: DropdownMenu components
// Removed: Avatar components
// Removed: User, LogOut from lucide-react


export function AppHeader() {
  // Removed: useAuth, logout logic, getInitials

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between space-x-4">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.Logo className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">Algo Grind</span>
        </Link>
        
        {/* Removed Auth related UI (DropdownMenu, Buttons) */}
      </div>
    </header>
  );
}
