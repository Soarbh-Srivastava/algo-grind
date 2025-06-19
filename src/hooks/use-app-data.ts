
// src/hooks/use-app-data.ts
import { useState, useEffect, useCallback } from 'react';
import type { AppData, SolvedProblem, GoalSettings, Goal } from '@/types';
import { GOAL_CATEGORIES } from '@/lib/constants';
import { db } from '@/lib/firebase'; // Firebase integration
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const FIRESTORE_COLLECTION_ID = 'appData'; // Collection to store app data
const FIRESTORE_DOCUMENT_ID = 'defaultUserData'; // Document ID for the single user data

const getDefaultGoalSettings = (): GoalSettings => ({
  period: 'daily',
  goals: GOAL_CATEGORIES.map(category => ({
    categoryId: category.id,
    target: category.defaultTarget,
  })),
});

const getDefaultAppData = (): AppData => ({
  solvedProblems: [],
  goalSettings: getDefaultGoalSettings(),
});

export function useAppData() {
  const [appData, setAppData] = useState<AppData>(getDefaultAppData());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  const dataDocRef = doc(db, FIRESTORE_COLLECTION_ID, FIRESTORE_DOCUMENT_ID);

  useEffect(() => {
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

          if (typeof parsedData.solvedProblems === 'undefined' || !Array.isArray(parsedData.solvedProblems)) {
            console.warn("solvedProblems field is missing or not an array in Firestore. Initializing to empty array.");
            parsedData.solvedProblems = [];
            shouldUpdateFirestore = true;
          } else {
            parsedData.solvedProblems = parsedData.solvedProblems.map(p => ({
              ...p,
              id: p.id || crypto.randomUUID(), // Ensure ID exists
              isForReview: p.isForReview ?? false,
            }));
          }
          
          setAppData(parsedData);

          if (shouldUpdateFirestore) {
            const updatePayload: Partial<AppData> = {};
            if (parsedData.goalSettings) updatePayload.goalSettings = parsedData.goalSettings;
            // Only add/update solvedProblems if it was initially missing or malformed
            if (typeof docSnap.data().solvedProblems === 'undefined' || !Array.isArray(docSnap.data().solvedProblems)) {
                 updatePayload.solvedProblems = parsedData.solvedProblems; 
            } else if (parsedData.solvedProblems.some(p => !docSnap.data().solvedProblems.find((dp: SolvedProblem) => dp.id === p.id && dp.isForReview === p.isForReview))) {
              // If isForReview or id was added to any existing problem, update the whole array
              updatePayload.solvedProblems = parsedData.solvedProblems;
            }


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
        if (error.code === 'permission-denied' || 
            (error.message && error.message.toLowerCase().includes("permission denied")) || 
            (error.message && error.message.toLowerCase().includes("insufficient permissions")) ||
            (error.message && error.message.toLowerCase().includes("missing or insufficient permissions"))) {
          console.error(
            "CRITICAL: Firestore Permission Denied. Ensure your Firestore security rules allow read/write access " +
            `to the '${FIRESTORE_COLLECTION_ID}/${FIRESTORE_DOCUMENT_ID}' document. Example rules:\n` +
            "rules_version = '2';\n" +
            "service cloud.firestore {\n" +
            "  match /databases/{database}/documents {\n" +
            `    match /${FIRESTORE_COLLECTION_ID}/${FIRESTORE_DOCUMENT_ID} {\n` +
            "      allow read, write: if true;\n" +
            "    }\n" +
            "    // Consider adding: match /{document=**} { allow read, write: if false; } to secure other paths.\n" +
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const addSolvedProblem = useCallback(async (problem: Omit<SolvedProblem, 'id'>) => {
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
  }, [dataDocRef]);

  const updateSolvedProblem = useCallback(async (updatedProblem: SolvedProblem) => {
    try {
      const currentDoc = await getDoc(dataDocRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data() as AppData;
        const updatedProblems = currentData.solvedProblems.map(p => 
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
  }, [dataDocRef]);
  
  const removeSolvedProblem = useCallback(async (problemId: string) => {
    try {
      const currentDoc = await getDoc(dataDocRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data() as AppData;
        const problemToRemove = currentData.solvedProblems.find(p => p.id === problemId);
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
  }, [dataDocRef]);

  const updateGoalSettings = useCallback(async (settings: GoalSettings) => {
    try {
      await updateDoc(dataDocRef, {
        goalSettings: settings
      });
      setAppData(prev => ({
        ...prev,
        goalSettings: settings,
      }));
    } catch (error) {
      console.error("Failed to update goal settings in Firestore:", error);
    }
  }, [dataDocRef]);

  const toggleProblemReviewStatus = useCallback(async (problemId: string) => {
    try {
      const currentDoc = await getDoc(dataDocRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data() as AppData;
        const updatedProblems = currentData.solvedProblems.map(p =>
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
  }, [dataDocRef]);

  return {
    appData,
    isInitialized,
    isLoading: isLoadingStorage,
    addSolvedProblem,
    updateSolvedProblem,
    removeSolvedProblem,
    updateGoalSettings,
    toggleProblemReviewStatus,
  };
}
