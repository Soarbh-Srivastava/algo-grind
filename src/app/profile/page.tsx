// src/app/profile/page.tsx
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/layout/header';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileUpdateForm } from '@/components/profile/profile-update-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function getInitials(name?: string | null, email?: string | null): string {
  const targetName = name || email?.split('@')[0];
  if (!targetName || targetName.trim() === "") return "AG"; 
  const names = targetName.trim().split(' ').filter(n => n);
  if (names.length === 0) return "AG";
  if (names.length === 1 && names[0].length > 0) return names[0].substring(0, Math.min(2, names[0].length)).toUpperCase();
  if (names.length > 1 && names[0].length > 0 && names[names.length - 1].length > 0) {
     return names[0].substring(0, 1).toUpperCase() + names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return (names[0] || "A").substring(0,1).toUpperCase();
}


export default function ProfilePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Icons.Logo className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary">
                {currentUser.photoURL && <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || "User"} />}
                <AvatarFallback className="text-3xl bg-muted">
                  {getInitials(currentUser.displayName, currentUser.email)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline text-3xl text-primary">
                {currentUser.displayName || currentUser.email?.split('@')[0] || "Your Profile"}
              </CardTitle>
              <CardDescription>
                Manage your account settings and profile information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileUpdateForm currentUser={currentUser} />
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Display Name</h3>
                    <p className="text-foreground">{currentUser.displayName || <span className="italic text-muted-foreground">Not set</span>}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="text-foreground">{currentUser.email}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Sign In</h3>
                    <p className="text-foreground">{currentUser.metadata.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleString() : 'N/A'}</p>
                </div>
                 <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Account Created</h3>
                    <p className="text-foreground">{currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleString() : 'N/A'}</p>
                </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Algo Grind. Manage Your Profile.</p>
      </footer>
    </div>
  );
}
