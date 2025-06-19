// src/hooks/use-app-data.ts
import { useState, useEffect, useCallback } from 'react';
import type { AppData, SolvedProblem, GoalSettings, Goal } from '@/types';
import { GOAL_CATEGORIES } from '@/lib/constants';
// Removed: import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';

const HARDCODED_USER_ID = "default_local_user_data"; // Using a hardcoded ID for data persistence

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
  // Removed: const { currentUser } = useAuth();
  const [appData, setAppData] = useState<AppData>(getDefaultAppData());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoadingFirestore(true);
      const userDocRef = doc(db, 'users', HARDCODED_USER_ID);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const firestoreData = docSnap.data() as AppData;
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
          const defaultData = getDefaultAppData();
          await setDoc(userDocRef, defaultData);
          setAppData(defaultData);
        }
      } catch (error) {
        console.error("Failed to load or initialize data from Firestore:", error);
        setAppData(getDefaultAppData());
      } finally {
        setIsInitialized(true);
        setIsLoadingFirestore(false);
      }
    }
    loadData();
  }, []); // Run once on mount

  const addSolvedProblem = useCallback(async (problem: Omit<SolvedProblem, 'id'>) => {
    const newProblem: SolvedProblem = { ...problem, id: crypto.randomUUID(), isForReview: problem.isForReview ?? false };
    
    setAppData(prev => ({
      ...prev,
      solvedProblems: [...prev.solvedProblems, newProblem],
    }));

    try {
      const userDocRef = doc(db, 'users', HARDCODED_USER_ID);
      await updateDoc(userDocRef, {
        solvedProblems: arrayUnion(newProblem)
      });
    } catch (error) {
      console.error("Failed to add problem to Firestore:", error);
    }
  }, []);

  const updateSolvedProblem = useCallback(async (updatedProblem: SolvedProblem) => {
    const oldProblems = appData.solvedProblems;
    setAppData(prev => ({
      ...prev,
      solvedProblems: prev.solvedProblems.map(p => p.id === updatedProblem.id ? {...updatedProblem, isForReview: updatedProblem.isForReview ?? false } : p),
    }));

    try {
      const userDocRef = doc(db, 'users', HARDCODED_USER_ID);
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
      setAppData(prev => ({...prev, solvedProblems: oldProblems }));
    }
  }, [appData.solvedProblems]);
  
  const removeSolvedProblem = useCallback(async (problemId: string) => {
    const problemToRemove = appData.solvedProblems.find(p => p.id === problemId);
    if (!problemToRemove) return;

    setAppData(prev => ({
      ...prev,
      solvedProblems: prev.solvedProblems.filter(p => p.id !== problemId),
    }));

    try {
      const userDocRef = doc(db, 'users', HARDCODED_USER_ID);
      await updateDoc(userDocRef, {
        solvedProblems: arrayRemove(problemToRemove)
      });
    } catch (error) {
      console.error("Failed to remove problem from Firestore:", error);
    }
  }, [appData.solvedProblems]);

  const updateGoalSettings = useCallback(async (newGoalSettings: GoalSettings) => {
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
      const userDocRef = doc(db, 'users', HARDCODED_USER_ID);
      await updateDoc(userDocRef, {
        goalSettings: fullNewSettings
      });
    } catch (error) {
      console.error("Failed to update goal settings in Firestore:", error);
    }
  }, []);
  
  const updateSingleGoal = useCallback(async (updatedGoal: Goal) => {
    setAppData(prev => {
      const newGoals = prev.goalSettings.goals.map(g => 
        g.categoryId === updatedGoal.categoryId ? updatedGoal : g
      );
      const newGoalSettings = { ...prev.goalSettings, goals: newGoals };
      
      const userDocRef = doc(db, 'users', HARDCODED_USER_ID);
      updateDoc(userDocRef, { goalSettings: newGoalSettings }).catch(err => {
        console.error("Failed to update single goal in Firestore:", err);
      });
      
      return { ...prev, goalSettings: newGoalSettings };
    });
  }, []);

  const toggleProblemReviewStatus = useCallback(async (problemId: string) => {
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
      const userDocRef = doc(db, 'users', HARDCODED_USER_ID);
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
      setAppData(prev => ({...prev, solvedProblems: oldProblems }));
    }
  }, [appData.solvedProblems]);


  return {
    appData,
    isInitialized,
    isLoading: isLoadingFirestore || !isInitialized, 
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
