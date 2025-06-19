// src/components/layout/header.tsx
"use client";

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut } from 'lucide-react'; 
import { ThemeToggle } from '@/components/theme-toggle'; // Added ThemeToggle import

function getInitials(name?: string | null): string {
  if (!name) return "AG"; // Algo Grind initials as fallback
  const names = name.split(' ');
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return names[0].substring(0, 1).toUpperCase() + names[names.length - 1].substring(0, 1).toUpperCase();
}

export function AppHeader() {
  const { currentUser, logout, loading } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between space-x-4">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.Logo className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">Algo Grind</span>
        </Link>
        
        <div className="flex items-center space-x-2">
           <ThemeToggle /> {/* Added ThemeToggle button */}
          {!loading && (
            <>
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border">
                        {currentUser.photoURL && <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || "User"} />}
                        <AvatarFallback>{getInitials(currentUser.displayName || currentUser.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {currentUser.displayName || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Add any other user-specific links here, e.g., Profile */}
                    {/* <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem> */}
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => router.push('/login')}>
                    Login
                  </Button>
                  <Button onClick={() => router.push('/register')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Sign Up
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
