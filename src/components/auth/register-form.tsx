
// src/components/auth/register-form.tsx
"use client";

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { registerUser } from '@/app/register/actions';
import type { FormState } from '@/app/login/actions'; // Re-use FormState
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
      {pending ? 'Creating Account...' : 'Create Account'}
    </Button>
  );
}

export function RegisterForm() {
  const initialState: FormState = { message: '', type: '' };
  const [state, formAction] = useFormState(registerUser, initialState);

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
          placeholder="•••••••• (min. 6 characters)"
          required
          className="bg-muted/30"
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
          className="bg-muted/30"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
