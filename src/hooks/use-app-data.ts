
// src/hooks/use-app-data.ts
import { useState, useEffect, useCallback } from 'react';
import type { AppData, SolvedProblem, GoalSettings } from '@/types';
import { GOAL_CATEGORIES } from '@/lib/constants';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context'; // Import useAuth

const FIRESTORE_COLLECTION_ID = 'appData';

const getDefaultGoalSettings = (): GoalSettings => ({
  period: 'daily',
  goals: GOAL_CATEGORIES.map(category => ({
    categoryId: category.id,
    target: category.defaultTarget,
  })),
  defaultCodingLanguage: 'javascript', // Default language
});

const getDefaultAppData = (): AppData => ({
  solvedProblems: [],
  goalSettings: getDefaultGoalSettings(),
});

export function useAppData() {
  const { currentUser, loading: authLoading } = useAuth(); // Get currentUser
  const [appData, setAppData] = useState<AppData>(getDefaultAppData());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [dataDocRef, setDataDocRef] = useState<DocumentReference<DocumentData> | null>(null);

  useEffect(() => {
    if (currentUser && !authLoading) {
      const docRef = doc(db, FIRESTORE_COLLECTION_ID, currentUser.uid);
      setDataDocRef(docRef);
    } else if (!currentUser && !authLoading) {
      // User is not logged in, reset app data and stop loading.
      setAppData(getDefaultAppData());
      setIsInitialized(true);
      setIsLoadingStorage(false);
      setDataDocRef(null);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (!dataDocRef || !currentUser) {
      if (!authLoading) { // Only set loading to false if auth is also done loading
        setIsLoadingStorage(false);
        setIsInitialized(true); // Mark as initialized even if no user
      }
      return;
    }

    async function loadData() {
      setIsLoadingStorage(true);
      try {
        const docSnap = await getDoc(dataDocRef);
        if (docSnap.exists()) {
          let parsedData = docSnap.data() as AppData;
          let shouldUpdateFirestore = false;
          
          if (!parsedData.goalSettings || !parsedData.goalSettings.goals || parsedData.goalSettings.goals.length === 0) {
              parsedData.goalSettings = getDefaultGoalSettings();
              shouldUpdateFirestore = true; 
          } else {
              // Ensure all default categories are present
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
              // Remove any goals for categories that no longer exist
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
          // Initialize defaultCodingLanguage if missing
          if (typeof parsedData.goalSettings.defaultCodingLanguage === 'undefined') {
            parsedData.goalSettings.defaultCodingLanguage = getDefaultGoalSettings().defaultCodingLanguage;
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
          const defaultData = getDefaultAppData();
          await setDoc(dataDocRef, defaultData);
          setAppData(defaultData);
        }
      } catch (error: any) {
        console.error("Failed to load or initialize data from Firestore:", error);
         if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes("permission denied")) || (error.message && error.message.toLowerCase().includes("insufficient permissions"))) {
          console.error(
            "CRITICAL: Firestore Permission Denied. For multi-user setup, ensure your Firestore security rules are: \n" +
            "rules_version = '2';\n" +
            "service cloud.firestore {\n" +
            "  match /databases/{database}/documents {\n" +
            `    match /${FIRESTORE_COLLECTION_ID}/{userId} {\n` +
            "      allow read, write: if request.auth != null && request.auth.uid == userId;\n" +
            "    }\n" +
            "  }\n" +
            "}"
          );
        }
        setAppData(getDefaultAppData()); 
      } finally {
        setIsInitialized(true);
        setIsLoadingStorage(false);
      }
    }
    loadData();
  }, [dataDocRef, currentUser, authLoading]); 

  const addSolvedProblem = useCallback(async (problem: Omit<SolvedProblem, 'id'>) => {
    if (!dataDocRef || !currentUser) return; 
    const newProblem: SolvedProblem = { ...problem, id: crypto.randomUUID(), isForReview: problem.isForReview ?? false };
    try {
      await updateDoc(dataDocRef, {
        solvedProblems: arrayUnion(newProblem)
      });
      setAppData(prev => ({
        ...prev,
        solvedProblems: [...prev.solvedProblems, newProblem],
      }));
    } catch (error) {
      console.error("Failed to add problem to Firestore:", error);
    }
  }, [dataDocRef, currentUser]);

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
    } catch (error) {
      console.error("Failed to update problem in Firestore:", error);
    }
  }, [dataDocRef, currentUser]);
  
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
          setAppData(prev => ({
            ...prev,
            solvedProblems: prev.solvedProblems.filter(p => p.id !== problemId),
          }));
        }
      }
    } catch (error) {
      console.error("Failed to remove problem from Firestore:", error);
    }
  }, [dataDocRef, currentUser]);

  const updateGoalSettings = useCallback(async (settings: GoalSettings) => {
    if (!dataDocRef || !currentUser) return;
    try {
      // Ensure defaultCodingLanguage is part of the settings being saved
      const settingsToSave: GoalSettings = {
        ...settings,
        defaultCodingLanguage: settings.defaultCodingLanguage || getDefaultGoalSettings().defaultCodingLanguage,
      };
      await updateDoc(dataDocRef, {
        goalSettings: settingsToSave
      });
      setAppData(prev => ({
        ...prev,
        goalSettings: settingsToSave,
      }));
    } catch (error) {
      console.error("Failed to update goal settings in Firestore:", error);
    }
  }, [dataDocRef, currentUser]);

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
    } catch (error) {
      console.error("Failed to toggle review status in Firestore:", error);
    }
  }, [dataDocRef, currentUser]);

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
