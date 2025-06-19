// src/components/auth/login-form.tsx
"use client";

import * as React from 'react';
import { useActionState } from 'react'; // Updated import
import { useFormStatus } from 'react-dom'; // useFormStatus remains in react-dom
import { loginUser, type FormState } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={pending}>
      {pending ? <Icons.Logo className="mr-2 h-5 w-5 animate-spin" /> : null}
      {pending ? 'Signing In...' : 'Sign In'}
    </Button>
  );
}

export function LoginForm() {
  const initialState: FormState = { message: '', type: '' };
  const [state, formAction] = useActionState(loginUser, initialState); // Updated usage

  return (
    <form action={formAction} className="space-y-6">
      {state.message && state.type === 'error' && (
        <Alert variant="destructive">
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
          className="bg-muted/30"
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
          className="bg-muted/30"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
