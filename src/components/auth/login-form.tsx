// src/components/auth/login-form.tsx
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginForm() {
  // Login functionality has been removed.
  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertDescription>Login functionality is currently disabled.</AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          disabled
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
          disabled
          className="bg-muted/30"
        />
      </div>
      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled>
        Sign In (Disabled)
      </Button>
    </div>
  );
}
