// src/app/register/page.tsx
"use client";

import * as React from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function RegisterPage() {
  const { currentUser, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  React.useEffect(() => {
    if (!loading && currentUser) {
      router.push('/');
    }
  }, [currentUser, loading, router]);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    await signInWithGoogle();
    // setIsGoogleLoading(false); // No need to set here if redirect happens
  };

  if (loading || (!loading && currentUser)) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Icons.Logo className="h-16 w-16 animate-spin text-primary" />
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
          <CardTitle className="font-headline text-3xl text-primary">Create Your Account</CardTitle>
          <CardDescription>Join Algo Grind and start tracking your progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RegisterForm />
           <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={isGoogleLoading}>
            {isGoogleLoading ? (
              <Icons.Logo className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Icons.Google className="mr-2 h-5 w-5" />
            )}
            Sign up with Google
          </Button>
        </CardContent>
         <CardFooter className="flex justify-center">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
