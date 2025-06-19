
// src/hooks/use-app-data.ts
import { useState, useEffect, useCallback } from 'react';
import type { AppData, SolvedProblem, GoalSettings, Goal } from '@/types';
import { GOAL_CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';

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
  const { currentUser } = useAuth();
  const [appData, setAppData] = useState<AppData>(getDefaultAppData());
  const [isInitialized, setIsInitialized] = useState(false); // True once data is loaded/initialized from Firestore
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(true); // Specific loading for Firestore operations

  // Fetch data from Firestore or initialize for new user
  useEffect(() => {
    async function loadData() {
      if (currentUser) {
        setIsLoadingFirestore(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const firestoreData = docSnap.data() as AppData;
            // Ensure data integrity, especially for older data structures
            firestoreData.goalSettings = firestoreData.goalSettings || getDefaultGoalSettings();
            if (firestoreData.goalSettings.goals.length !== GOAL_CATEGORIES.length) {
                firestoreData.goalSettings = getDefaultGoalSettings();
            } else {
                const currentCategoryIds = new Set(firestoreData.goalSettings.goals.map(g => g.categoryId));
                const defaultGoals = getDefaultGoalSettings().goals;
                for (const defaultGoal of defaultGoals) {
                    if (!currentCategoryIds.has(defaultGoal.categoryId)) {
                        const categoryInfo = GOAL_CATEGORIES.find(cat => cat.id === defaultGoal.categoryId);
                        firestoreData.goalSettings.goals.push({
                            categoryId: defaultGoal.categoryId,
                            target: categoryInfo ? categoryInfo.defaultTarget : 0,
                        });
                    }
                }
            }
            if (!firestoreData.goalSettings.period) {
                firestoreData.goalSettings.period = getDefaultGoalSettings().period;
            }
            firestoreData.solvedProblems = (firestoreData.solvedProblems || []).map(p => ({
              ...p,
              isForReview: p.isForReview ?? false,
            }));
            setAppData(firestoreData);
          } else {
            // New user, create default data in Firestore
            const defaultData = getDefaultAppData();
            await setDoc(userDocRef, defaultData);
            setAppData(defaultData);
          }
        } catch (error) {
          console.error("Failed to load or initialize data from Firestore:", error);
          setAppData(getDefaultAppData()); // Fallback to default if error
        } finally {
          setIsInitialized(true);
          setIsLoadingFirestore(false);
        }
      } else {
        // No user, reset to default and mark as not initialized for Firestore
        setAppData(getDefaultAppData());
        setIsInitialized(false); 
        setIsLoadingFirestore(false);
      }
    }
    loadData();
  }, [currentUser]);

  const addSolvedProblem = useCallback(async (problem: Omit<SolvedProblem, 'id'>) => {
    if (!currentUser) return;
    const newProblem: SolvedProblem = { ...problem, id: crypto.randomUUID(), isForReview: problem.isForReview ?? false };
    
    setAppData(prev => ({
      ...prev,
      solvedProblems: [...prev.solvedProblems, newProblem],
    }));

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        solvedProblems: arrayUnion(newProblem)
      });
    } catch (error) {
      console.error("Failed to add problem to Firestore:", error);
      // Optionally revert local state or show error to user
    }
  }, [currentUser]);

  const updateSolvedProblem = useCallback(async (updatedProblem: SolvedProblem) => {
    if (!currentUser) return;
    
    // Optimistic update locally
    const oldProblems = appData.solvedProblems;
    setAppData(prev => ({
      ...prev,
      solvedProblems: prev.solvedProblems.map(p => p.id === updatedProblem.id ? {...updatedProblem, isForReview: updatedProblem.isForReview ?? false } : p),
    }));

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const currentProblems = (docSnap.data().solvedProblems || []) as SolvedProblem[];
        const problemIndex = currentProblems.findIndex(p => p.id === updatedProblem.id);
        if (problemIndex > -1) {
          currentProblems[problemIndex] = {...updatedProblem, isForReview: updatedProblem.isForReview ?? false };
          await updateDoc(userDocRef, { solvedProblems: currentProblems });
        }
      }
    } catch (error) {
      console.error("Failed to update problem in Firestore:", error);
      setAppData(prev => ({...prev, solvedProblems: oldProblems })); // Revert optimistic update
    }
  }, [currentUser, appData.solvedProblems]);
  
  const removeSolvedProblem = useCallback(async (problemId: string) => {
    if (!currentUser) return;

    const problemToRemove = appData.solvedProblems.find(p => p.id === problemId);
    if (!problemToRemove) return;

    setAppData(prev => ({
      ...prev,
      solvedProblems: prev.solvedProblems.filter(p => p.id !== problemId),
    }));

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      // Firestore's arrayRemove requires the exact object to remove.
      // If objects might differ slightly (e.g. due to non-serializable fields if any),
      // it's safer to read, filter, and write back the array.
      // For this case, assuming `problemToRemove` is the same as in Firestore if found.
      await updateDoc(userDocRef, {
        solvedProblems: arrayRemove(problemToRemove)
      });
    } catch (error) {
      console.error("Failed to remove problem from Firestore:", error);
      // Optionally revert local state
    }
  }, [currentUser, appData.solvedProblems]);

  const updateGoalSettings = useCallback(async (newGoalSettings: GoalSettings) => {
    if (!currentUser) return;
    
    const fullNewSettings = {
      period: newGoalSettings.period,
      goals: newGoalSettings.goals.map(goal => ({
        categoryId: goal.categoryId,
        target: goal.target
      }))
    };

    setAppData(prev => ({
      ...prev,
      goalSettings: fullNewSettings,
    }));
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        goalSettings: fullNewSettings
      });
    } catch (error) {
      console.error("Failed to update goal settings in Firestore:", error);
    }
  }, [currentUser]);
  
  const updateSingleGoal = useCallback(async (updatedGoal: Goal) => {
    if (!currentUser) return;
    setAppData(prev => {
      const newGoals = prev.goalSettings.goals.map(g => 
        g.categoryId === updatedGoal.categoryId ? updatedGoal : g
      );
      const newGoalSettings = { ...prev.goalSettings, goals: newGoals };
      
      // Update Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      updateDoc(userDocRef, { goalSettings: newGoalSettings }).catch(err => {
        console.error("Failed to update single goal in Firestore:", err);
        // Optionally revert local state
      });
      
      return { ...prev, goalSettings: newGoalSettings };
    });
  }, [currentUser]);

  const toggleProblemReviewStatus = useCallback(async (problemId: string) => {
    if (!currentUser) return;

    const oldProblems = appData.solvedProblems;
    let newProblemsState: SolvedProblem[] = [];

    setAppData(prev => {
      newProblemsState = prev.solvedProblems.map(p => 
        p.id === problemId ? { ...p, isForReview: !p.isForReview } : p
      );
      return {
        ...prev,
        solvedProblems: newProblemsState,
      };
    });

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      // To update a specific item in an array in Firestore, you typically need to read the array,
      // modify it, and then write the entire array back.
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const firestoreProblems = (docSnap.data().solvedProblems || []) as SolvedProblem[];
        const updatedFirestoreProblems = firestoreProblems.map(p =>
          p.id === problemId ? { ...p, isForReview: !p.isForReview } : p
        );
        await updateDoc(userDocRef, { solvedProblems: updatedFirestoreProblems });
      }
    } catch (error) {
      console.error("Failed to toggle review status in Firestore:", error);
      setAppData(prev => ({...prev, solvedProblems: oldProblems })); // Revert optimistic update
    }
  }, [currentUser, appData.solvedProblems]);


  return {
    appData,
    isInitialized, // This now means Firestore data for the user is loaded/initialized
    isLoading: isLoadingFirestore || (currentUser && !isInitialized), // Overall loading state
    addSolvedProblem,
    updateSolvedProblem,
    removeSolvedProblem,
    updateGoalSettings,
    updateSingleGoal,
    toggleProblemReviewStatus,
    solvedProblems: appData.solvedProblems,
    goalSettings: appData.goalSettings,
  };
}
