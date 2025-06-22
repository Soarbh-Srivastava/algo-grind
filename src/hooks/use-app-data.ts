
// src/hooks/use-app-data.ts
import { useState, useEffect, useCallback } from 'react';
import type { AppData, SolvedProblem, GoalSettings, UserPublicProfile } from '@/types';
import { GOAL_CATEGORIES } from '@/lib/constants';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast'; // Import useToast

const FIRESTORE_COLLECTION_ID = 'appData';
const USER_PUBLIC_PROFILES_COLLECTION = 'userPublicProfiles';

const getDefaultGoalSettings = (): GoalSettings => ({
  period: 'daily',
  goals: GOAL_CATEGORIES.map(category => ({
    categoryId: category.id,
    target: category.defaultTarget,
  })),
  defaultCodingLanguage: 'javascript',
  reminderTime: 18, // Default to 6 PM (18:00)
});

const getDefaultAppData = (): AppData => ({
  solvedProblems: [],
  goalSettings: getDefaultGoalSettings(),
});

async function syncUserPublicProfileData(
  userUid: string,
  displayName: string | null,
  photoURL: string | null,
  solvedProblemsCount: number,
  toastInstance?: ReturnType<typeof useToast>['toast'] // Optional toast for more direct feedback if needed
) {
  const profileDocRef = doc(db, USER_PUBLIC_PROFILES_COLLECTION, userUid);
  try {
    const docSnap = await getDoc(profileDocRef);
    const updateData: Partial<UserPublicProfile> = {
      userId: userUid,
      displayName: displayName || "Anonymous Grinder",
      photoURL: photoURL,
      solvedProblemsCount: solvedProblemsCount,
      lastUpdated: new Date().toISOString(),
    };

    if (docSnap.exists()) {
      await updateDoc(profileDocRef, updateData);
    } else {
      await setDoc(profileDocRef, updateData);
    }
  } catch (error: any) {
    console.error("Error syncing user public profile data:", error);
    if (error.code === 'permission-denied' && toastInstance) {
       toastInstance({ // Use the passed toastInstance if available
        variant: "destructive",
        title: "Firestore Sync Error",
        description: "Could not sync public profile due to Firestore security rules. Leaderboard data might be outdated.",
      });
    } else if (error.code === 'permission-denied') {
      console.error("Firestore Permission Denied: Could not sync public profile due to Firestore security rules. Leaderboard data might be outdated. User UID:", userUid);
    }
  }
}


export function useAppData() {
  const { currentUser, loading: authLoading } = useAuth();
  const [appData, setAppData] = useState<AppData>(getDefaultAppData());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [dataDocRef, setDataDocRef] = useState<DocumentReference<DocumentData> | null>(null);
  const { toast } = useToast(); // Get toast instance

  useEffect(() => {
    if (currentUser && !authLoading) {
      const docRef = doc(db, FIRESTORE_COLLECTION_ID, currentUser.uid);
      setDataDocRef(docRef);
    } else if (!currentUser && !authLoading) {
      setAppData(getDefaultAppData());
      setIsInitialized(true);
      setIsLoadingStorage(false);
      setDataDocRef(null);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (!dataDocRef || !currentUser) {
      if (!authLoading) {
        setIsLoadingStorage(false);
        setIsInitialized(true);
      }
      return;
    }

    async function loadData() {
      setIsLoadingStorage(true);
      try {
        const docSnap = await getDoc(dataDocRef);
        let currentAppData: AppData;
        if (docSnap.exists()) {
          let parsedData = docSnap.data() as AppData;
          let shouldUpdateFirestore = false;
          
          if (!parsedData.goalSettings || !parsedData.goalSettings.goals || parsedData.goalSettings.goals.length === 0) {
              parsedData.goalSettings = getDefaultGoalSettings();
              shouldUpdateFirestore = true; 
          } else {
              const currentCategoryIds = new Set(parsedData.goalSettings.goals.map(g => g.categoryId));
              const defaultGoals = getDefaultGoalSettings().goals;
              let goalsModified = false;
              for (const defaultGoal of defaultGoals) {
                  if (!currentCategoryIds.has(defaultGoal.categoryId)) {
                      const categoryInfo = GOAL_CATEGORIES.find(cat => cat.id === defaultGoal.categoryId);
                      parsedData.goalSettings.goals.push({
                          categoryId: defaultGoal.categoryId,
                          target: categoryInfo ? categoryInfo.defaultTarget : 0,
                      });
                      goalsModified = true;
                  }
              }
              const originalLength = parsedData.goalSettings.goals.length;
              parsedData.goalSettings.goals = parsedData.goalSettings.goals.filter(g => 
                GOAL_CATEGORIES.some(cat => cat.id === g.categoryId)
              );
              if (parsedData.goalSettings.goals.length !== originalLength) {
                goalsModified = true;
              }
              if (parsedData.goalSettings.goals.length !== GOAL_CATEGORIES.length && !goalsModified) {
                parsedData.goalSettings = getDefaultGoalSettings(); 
                goalsModified = true;
              }
              if (goalsModified) {
                shouldUpdateFirestore = true;
              }
          }
          if (!parsedData.goalSettings.period) { 
              parsedData.goalSettings.period = getDefaultGoalSettings().period;
              shouldUpdateFirestore = true;
          }
          if (typeof parsedData.goalSettings.defaultCodingLanguage === 'undefined') {
            parsedData.goalSettings.defaultCodingLanguage = getDefaultGoalSettings().defaultCodingLanguage;
            shouldUpdateFirestore = true;
          }
          if (typeof parsedData.goalSettings.reminderTime === 'undefined') {
            parsedData.goalSettings.reminderTime = getDefaultGoalSettings().reminderTime;
            shouldUpdateFirestore = true;
          }
          if (typeof parsedData.solvedProblems === 'undefined' || !Array.isArray(parsedData.solvedProblems)) {
            parsedData.solvedProblems = []; 
            shouldUpdateFirestore = true;
          } else {
            parsedData.solvedProblems = parsedData.solvedProblems.map(p => ({
              ...p,
              id: p.id || crypto.randomUUID(), 
              isForReview: p.isForReview ?? false,
            }));
          }
          currentAppData = parsedData;
          setAppData(parsedData);

          if (shouldUpdateFirestore) {
            const updatePayload: Partial<AppData> = {};
            if (parsedData.goalSettings) updatePayload.goalSettings = parsedData.goalSettings;
            if (parsedData.solvedProblems) updatePayload.solvedProblems = parsedData.solvedProblems; 
            if (Object.keys(updatePayload).length > 0) {
                 await updateDoc(dataDocRef, updatePayload);
            }
          }
        } else {
          currentAppData = getDefaultAppData();
          await setDoc(dataDocRef, currentAppData);
          setAppData(currentAppData);
        }
        // Sync with public profile
        await syncUserPublicProfileData(
            currentUser.uid,
            currentUser.displayName,
            currentUser.photoURL,
            currentAppData.solvedProblems.length,
            toast // Pass toast for potential errors during this initial sync
        );

      } catch (error: any) {
        console.error("Failed to load or initialize data from Firestore:", error);
        if (error.code === 'permission-denied') {
            toast({
                variant: "destructive",
                title: "Firestore Permission Error",
                description: "Could not load your application data due to Firestore security rules. Please check your Firebase console.",
            });
        }
        setAppData(getDefaultAppData()); 
      } finally {
        setIsInitialized(true);
        setIsLoadingStorage(false);
      }
    }
    loadData();
  }, [dataDocRef, currentUser, authLoading, toast]); 

  const addSolvedProblem = useCallback(async (problem: Omit<SolvedProblem, 'id'>) => {
    if (!dataDocRef || !currentUser) return; 
    const newProblem: SolvedProblem = { ...problem, id: crypto.randomUUID(), isForReview: problem.isForReview ?? false };
    try {
      await updateDoc(dataDocRef, {
        solvedProblems: arrayUnion(newProblem)
      });
      const newSolvedProblems = [...appData.solvedProblems, newProblem];
      setAppData(prev => ({
        ...prev,
        solvedProblems: newSolvedProblems,
      }));
      await syncUserPublicProfileData(currentUser.uid, currentUser.displayName, currentUser.photoURL, newSolvedProblems.length);
    } catch (error: any) {
      console.error("Failed to add problem to Firestore:", error);
       if (error.code === 'permission-denied') {
            toast({
                variant: "destructive",
                title: "Firestore Permission Error",
                description: "Could not save your problem due to Firestore security rules.",
            });
        }
    }
  }, [dataDocRef, currentUser, appData.solvedProblems, toast]);

  const updateSolvedProblem = useCallback(async (updatedProblem: SolvedProblem) => {
    if (!dataDocRef || !currentUser) return;
    try {
      const currentDocSnap = await getDoc(dataDocRef); 
      if (currentDocSnap.exists()) {
        const currentData = currentDocSnap.data() as AppData;
        const updatedProblems = (currentData.solvedProblems || []).map(p => 
          p.id === updatedProblem.id ? {...updatedProblem, isForReview: updatedProblem.isForReview ?? false } : p
        );
        await updateDoc(dataDocRef, { solvedProblems: updatedProblems });
        setAppData(prev => ({
          ...prev,
          solvedProblems: updatedProblems,
        }));
      }
    } catch (error: any) {
      console.error("Failed to update problem in Firestore:", error);
      if (error.code === 'permission-denied') {
            toast({
                variant: "destructive",
                title: "Firestore Permission Error",
                description: "Could not update your problem due to Firestore security rules.",
            });
        }
    }
  }, [dataDocRef, currentUser, toast]);
  
  const removeSolvedProblem = useCallback(async (problemId: string) => {
    if (!dataDocRef || !currentUser) return;
    try {
      const currentDocSnap = await getDoc(dataDocRef); 
      if (currentDocSnap.exists()) {
        const currentData = currentDocSnap.data() as AppData;
        const problemToRemove = (currentData.solvedProblems || []).find(p => p.id === problemId);
        if (problemToRemove) {
          await updateDoc(dataDocRef, {
            solvedProblems: arrayRemove(problemToRemove)
          });
          const newSolvedProblems = appData.solvedProblems.filter(p => p.id !== problemId);
          setAppData(prev => ({
            ...prev,
            solvedProblems: newSolvedProblems,
          }));
          await syncUserPublicProfileData(currentUser.uid, currentUser.displayName, currentUser.photoURL, newSolvedProblems.length);
        }
      }
    } catch (error: any) {
      console.error("Failed to remove problem from Firestore:", error);
      if (error.code === 'permission-denied') {
            toast({
                variant: "destructive",
                title: "Firestore Permission Error",
                description: "Could not remove your problem due to Firestore security rules.",
            });
        }
    }
  }, [dataDocRef, currentUser, appData.solvedProblems, toast]);

  const updateGoalSettings = useCallback(async (settings: GoalSettings) => {
    if (!dataDocRef || !currentUser) return;
    try {
      const settingsToSave: GoalSettings = {
        ...settings,
        defaultCodingLanguage: settings.defaultCodingLanguage || getDefaultGoalSettings().defaultCodingLanguage,
        reminderTime: settings.reminderTime || getDefaultGoalSettings().reminderTime,
      };
      await updateDoc(dataDocRef, {
        goalSettings: settingsToSave
      });
      setAppData(prev => ({
        ...prev,
        goalSettings: settingsToSave,
      }));
    } catch (error: any) {
      console.error("Failed to update goal settings in Firestore:", error);
      if (error.code === 'permission-denied') {
            toast({
                variant: "destructive",
                title: "Firestore Permission Error",
                description: "Could not save your goal settings due to Firestore security rules.",
            });
        }
    }
  }, [dataDocRef, currentUser, toast]);

  const toggleProblemReviewStatus = useCallback(async (problemId: string) => {
    if (!dataDocRef || !currentUser) return;
    try {
      const currentDocSnap = await getDoc(dataDocRef); 
      if (currentDocSnap.exists()) {
        const currentData = currentDocSnap.data() as AppData;
        const updatedProblems = (currentData.solvedProblems || []).map(p =>
          p.id === problemId ? { ...p, isForReview: !(p.isForReview ?? false) } : p
        );
        await updateDoc(dataDocRef, { solvedProblems: updatedProblems });
        setAppData(prev => ({
          ...prev,
          solvedProblems: updatedProblems,
        }));
      }
    } catch (error: any) {
      console.error("Failed to toggle review status in Firestore:", error);
      if (error.code === 'permission-denied') {
            toast({
                variant: "destructive",
                title: "Firestore Permission Error",
                description: "Could not update review status due to Firestore security rules.",
            });
        }
    }
  }, [dataDocRef, currentUser, toast]);

  return {
    appData,
    isInitialized, 
    isLoading: authLoading || isLoadingStorage, 
    addSolvedProblem,
    updateSolvedProblem,
    removeSolvedProblem,
    updateGoalSettings,
    toggleProblemReviewStatus,
  };
}
