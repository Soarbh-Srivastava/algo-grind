// src/components/auth/login-form.tsx
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation'; // Keep for potential future use if needed within form

export function LoginForm() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { signInWithEmail, currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();


  // This useEffect handles redirection if the user is already logged in
  // when the component mounts or if the auth state changes externally.
  React.useEffect(() => {
    if (!authLoading && currentUser) {
      router.push('/');
    }
  }, [currentUser, authLoading, router]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await signInWithEmail(email, password);
      if (user) {
        toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
        // Redirection is primarily handled by the useEffect in `login/page.tsx`
        // or the one above if already logged in.
        // Explicit push can be added here if direct navigation after submit is preferred,
        // but ensure it doesn't conflict with page-level effects.
        // router.push('/'); // Example: direct push
      } else {
        // This case should ideally not be hit if signInWithEmail throws on error
        setError("Login failed. Please try again.");
      }
    } catch (e: any) {
      console.error("Login form submission error:", e);
      let errorMessage = "An unknown error occurred during login.";
      if (e.code) {
        switch (e.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential": // Common error for invalid email/password
            errorMessage = "Invalid email or password.";
            break;
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address.";
            break;
          case "auth/too-many-requests":
              errorMessage = "Too many login attempts. Please try again later.";
              break;
          default:
            errorMessage = e.message || "Login failed due to an unexpected error.";
            break;
        }
      }
      setError(errorMessage);
      toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Login Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
        {isLoading ? <Icons.Logo className="mr-2 h-4 w-4 animate-spin" /> : null}
        Login
      </Button>
    </form>
  );
}

// Ensure useToast is imported if not already, or remove its usage if not defined globally in this file
import { useToast } from '@/hooks/use-toast'; 
