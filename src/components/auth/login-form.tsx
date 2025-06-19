// src/components/auth/login-form.tsx
"use client";

import * as React from 'react';
import { useFormStatus } from 'react-dom'; // useFormStatus remains from react-dom
import { useActionState } from 'react'; // useActionState is imported from react
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { loginUser, type FormState } from '@/app/login/actions';
import { Icons } from '@/components/icons'; // For loading spinner

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={pending}>
      {pending ? <Icons.Logo className="mr-2 h-4 w-4 animate-spin" /> : null}
      Sign In
    </Button>
  );
}

export function LoginForm() {
  const initialState: FormState = { message: "", type: "" };
  // Updated to use useActionState
  const [state, formAction] = useActionState(loginUser, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.message && state.type === "error" && (
        <Alert variant="destructive">
          <AlertTitle>Login Failed</AlertTitle>
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
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
