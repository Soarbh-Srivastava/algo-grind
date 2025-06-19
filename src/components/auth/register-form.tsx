// src/components/auth/register-form.tsx
"use client";

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
// Removed: import { useRouter } from 'next/navigation'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { registerUser } from '@/app/register/actions';
import type { FormState } from '@/app/login/actions';
import { Icons } from '@/components/icons';
// Removed: import { useAuth } from '@/context/auth-context'; 

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={pending}>
      {pending ? <Icons.Logo className="mr-2 h-4 w-4 animate-spin" /> : null}
      Create Account
    </Button>
  );
}

export function RegisterForm() {
  const initialState: FormState = { message: "", type: "" };
  const [state, formAction] = useActionState(registerUser, initialState);
  // Removed: const router = useRouter(); 
  // Removed: const { currentUser, loading: authLoading } = useAuth(); 

  // Removed useEffect for redirection:
  // React.useEffect(() => {
  //   if (state.type === "success" && currentUser && !authLoading) {
  //     router.push('/');
  //   }
  // }, [state.type, currentUser, authLoading, router]);

  return (
    <form action={formAction} className="space-y-6">
       {state.message && state.type === "error" && (
        <Alert variant="destructive">
          <AlertTitle>Registration Failed</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state.message && state.type === "success" && (
         <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-700">
           <AlertTitle>Success!</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="•••••••• (min. 6 characters)"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
