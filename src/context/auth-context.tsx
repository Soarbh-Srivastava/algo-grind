// src/context/auth-context.tsx
"use client";

import * as React from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Ensure auth is exported from firebase.ts
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // For redirecting

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signUpWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
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
      setCurrentUser(null);
      router.push('/login'); // Redirect to login after logout
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
      setCurrentUser(result.user);
      router.push('/'); // Redirect to home after successful Google sign-in
      toast({ title: "Signed In", description: "Successfully signed in with Google." });
      return result.user;
    } catch (error: any) {
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

  const signUpWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      setCurrentUser(userCredential.user);
      router.push('/'); // Redirect to home after successful sign-up
      toast({ title: "Account Created", description: "Successfully signed up and logged in."});
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing up with email:", error);
      toast({ variant: "destructive", title: "Sign Up Error", description: error.message });
      return null;
    }
  };
  
  const signInWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setCurrentUser(userCredential.user);
      router.push('/'); // Redirect to home after successful sign-in
      toast({ title: "Signed In", description: "Successfully signed in with email."});
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in with email:", error);
      toast({ variant: "destructive", title: "Sign In Error", description: error.message });
      return null;
    }
  };


  const value: AuthContextType = {
    currentUser,
    loading,
    logout,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
  };

  if (loading) {
    // You might want a global loading spinner here
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading authentication...</p>
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
