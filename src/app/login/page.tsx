// src/app/login/page.tsx
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const { currentUser, signInWithGoogle, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && currentUser) {
      router.push('/'); // Redirect if already logged in
    }
  }, [currentUser, authLoading, router]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signInWithGoogle();
    // Redirection is handled by AuthContext or useEffect above
    setIsGoogleLoading(false); 
  };
  
  if (authLoading || (!authLoading && currentUser)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Icons.Logo className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4">Loading or redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Icons.Logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue your grind.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Icons.Logo className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.Google className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex-col space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
