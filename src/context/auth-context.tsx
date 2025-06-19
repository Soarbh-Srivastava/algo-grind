
// src/context/auth-context.tsx
"use client";

import * as React from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  type User as FirebaseUser,
  createUserWithEmailAndPassword // Added for user creation to also update profile
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // Added db
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'; // Added Firestore functions
import type { UserPublicProfile } from '@/types'; // Added UserPublicProfile type
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const USER_PUBLIC_PROFILES_COLLECTION = 'userPublicProfiles';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  // registerWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>; // Kept for consistency if needed by register-form directly
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

async function updateUserPublicProfile(user: FirebaseUser, initialProblemCount?: number) {
  if (!user) return;
  const profileDocRef = doc(db, USER_PUBLIC_PROFILES_COLLECTION, user.uid);
  try {
    const docSnap = await getDoc(profileDocRef);
    const profileData: Partial<UserPublicProfile> = {
      userId: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || "Anonymous Grinder",
      photoURL: user.photoURL,
      lastUpdated: new Date().toISOString(),
    };

    if (!docSnap.exists()) {
      // New user profile, set initial problem count if provided or default to 0
      profileData.solvedProblemsCount = initialProblemCount ?? 0;
      await setDoc(profileDocRef, profileData);
    } else {
      // Existing user, only update fields that might change via auth
      // solvedProblemsCount is managed by useAppData
      await updateDoc(profileDocRef, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
        lastUpdated: profileData.lastUpdated,
      });
    }
  } catch (error) {
    console.error("Error updating user public profile:", error);
    // Optionally, toast an error, but this is a background task
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const router = useRouter(); 

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await updateUserPublicProfile(user); // Update public profile on auth state change
      }
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
      // updateUserPublicProfile is called by onAuthStateChanged
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

  const signInWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // updateUserPublicProfile is called by onAuthStateChanged
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in with email from AuthContext:", error);
      throw error;
    }
  };
  
  // Note: Registration logic in `register/actions.ts` already handles user creation.
  // The onAuthStateChanged listener above will pick up new users and create their public profile.

  const value: AuthContextType = {
    currentUser,
    loading,
    logout,
    signInWithGoogle,
    signInWithEmail,
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
