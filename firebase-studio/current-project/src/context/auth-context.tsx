
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
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'; // Removed serverTimestamp as it's not used directly here
import type { UserPublicProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const USER_PUBLIC_PROFILES_COLLECTION = 'userPublicProfiles';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

async function updateUserPublicProfile(user: FirebaseUser, toastInstance: ReturnType<typeof useToast>['toast']) {
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
      profileData.solvedProblemsCount = 0; // Initialize for new profiles
      await setDoc(profileDocRef, profileData);
    } else {
      // For existing users, update relevant fields. solvedProblemsCount is managed elsewhere (useAppData)
      // but ensure other auth-related fields are synced.
      await updateDoc(profileDocRef, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
        lastUpdated: profileData.lastUpdated,
        // If solvedProblemsCount was previously missing, this is a good place to initialize it for older profiles
        ...(typeof docSnap.data()?.solvedProblemsCount === 'undefined' && { solvedProblemsCount: 0 })
      });
    }
  } catch (error: any) {
    console.error("Error updating user public profile:", error);
    if (error.code === 'permission-denied') {
      toastInstance({
        variant: "destructive",
        title: "Firestore Permission Error",
        description: "Could not update your public profile data due to Firestore security rules. Leaderboard data may be affected.",
      });
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const router = useRouter(); 

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => { 
      if (user) {
        setCurrentUser(user);
        // Asynchronously update profile without blocking setLoading
        updateUserPublicProfile(user, toast).catch(err => {
          console.error("Error during background profile update:", err);
        });
        setLoading(false);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [toast]); // Added toast to dependency array

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null); // Explicitly set user to null on logout
      router.push('/login'); 
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({ variant: "destructive", title: "Logout Error", description: error.message });
    }
  };

  const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    const provider = new GoogleAuthProvider();
    setLoading(true); // Set loading true before sign-in attempt
    try {
      const result = await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting currentUser and calling updateUserPublicProfile
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
      setLoading(false); // Reset loading state on error
      return null;
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setLoading(true); // Set loading true before sign-in attempt
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting currentUser and calling updateUserPublicProfile
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in with email from AuthContext:", error);
      setLoading(false); // Reset loading state on error
      throw error; // Re-throw for the form to handle
    }
  };
  
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
