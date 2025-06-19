// src/context/auth-context.tsx
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import * as React from 'react';
import { auth } from '@/lib/firebase';
import { Icons } from '@/components/icons'; // For loading indicator
import { useToast } from '@/hooks/use-toast';


interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      // currentUser will be set to null by onAuthStateChanged
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while signing out. Please try again."
      })
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting the user and redirecting
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      let errorMessage = "Failed to sign in with Google. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Google Sign-In was cancelled. Please try again if this was unintentional.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email address using a different sign-in method (e.g., email/password). Try signing in with that method.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Google Sign-In popup was blocked by the browser. Please disable your popup blocker and try again.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Google Sign-In is not enabled for this project. Please contact support.";
      } else if (error.code === 'auth/unauthorized-domain') {
        // This specific error might not always be caught here as it can prevent the popup entirely.
        // The primary fix is adding the domain in the Firebase console.
        errorMessage = "This application's domain is not authorized for Google Sign-In. Please contact support.";
      }
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: errorMessage,
      });
      setLoading(false); // Ensure loading is set to false on error
    }
    // setLoading(false) is handled by onAuthStateChanged in the success case or if an error above sets it
  };

  const value = {
    currentUser,
    loading,
    logout,
    signInWithGoogle,
  };

  if (loading && !currentUser) { // Show loading only if not already authenticated
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Icons.Logo className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
