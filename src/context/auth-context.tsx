// src/context/auth-context.tsx
"use client";

import * as React from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  type User as FirebaseUser
  // Removed: createUserWithEmailAndPassword,
  // Removed: signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  // Removed: signUpWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  // Removed: signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const router = useRouter(); 

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
      router.push('/login'); 
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({ variant: "destructive", title: "Logout Error", description: error.message });
    }
  };

  const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      toast({ title: "Signed In", description: "Successfully signed in with Google." });
      // Redirection for Google Sign-In will be handled by useEffect in pages
      return result.user;
    } catch (error: any)
       {
      console.error("Error signing in with Google:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
        description = "Sign-in popup was closed before completion.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        description = "Multiple sign-in attempts. Please complete one or try again.";
      } else if (error.code === 'auth/popup-blocked') {
        description = "Popup blocked by browser. Please enable popups for this site.";
      } else if (error.code === 'auth/unauthorized-domain') {
        description = "This domain is not authorized for OAuth operations. Check Firebase console.";
      }
      toast({ variant: "destructive", title: "Google Sign-In Error", description });
      return null;
    }
  };

  // Removed signUpWithEmail method
  // Removed signInWithEmail method

  const value: AuthContextType = {
    currentUser,
    loading,
    logout,
    signInWithGoogle,
    // Removed: signUpWithEmail,
    // Removed: signInWithEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
