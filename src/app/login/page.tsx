// src/app/login/page.tsx
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function LoginPage() {
  // Authentication functionality has been removed.

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Icons.Logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">Login</CardTitle>
          <CardDescription>Authentication has been disabled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Login functionality is not available.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/" className="font-medium text-primary hover:underline">
            Go to Homepage
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
