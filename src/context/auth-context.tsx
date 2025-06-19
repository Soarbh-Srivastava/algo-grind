// src/context/auth-context.tsx
"use client";

import type { User as FirebaseUser } from 'firebase/auth'; // Type import is okay
import * as React from 'react';
// Firebase auth imports and logic have been removed as authentication is disabled.

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Auth functionality has been removed.
  // This provider now does nothing but render its children with a dummy context.
  const value: AuthContextType = {
    currentUser: null,
    loading: false,
    logout: async () => { console.warn("Logout called, but auth is disabled."); },
    signInWithGoogle: async () => { console.warn("signInWithGoogle called, but auth is disabled."); },
  };

  // No loading screen needed as auth is disabled
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    // This fallback is to prevent crashes if something still tries to call useAuth.
    // Ideally, AuthProvider and useAuth calls should be removed from active app parts.
    console.warn("useAuth called, but AuthProvider is likely removed or auth is disabled. Returning dummy values.");
    return {
      currentUser: null,
      loading: false,
      logout: async () => { console.warn("Logout called, but auth is disabled."); },
      signInWithGoogle: async () => { console.warn("signInWithGoogle called, but auth is disabled."); },
    };
  }
  return context;
}
