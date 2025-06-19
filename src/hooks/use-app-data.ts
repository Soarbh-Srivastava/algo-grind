// src/hooks/use-app-data.ts
import { useState, useEffect, useCallback } from 'react';
import type { AppData, SolvedProblem, GoalSettings, Goal } from '@/types';
import { GOAL_CATEGORIES, LOCAL_STORAGE_KEY } from '@/lib/constants';

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

  useEffect(() => {
    async function loadData() {
      setIsLoadingStorage(true);
      try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
          let parsedData = JSON.parse(storedData) as AppData;
          
          // Ensure goalSettings exist and are structured correctly
          parsedData.goalSettings = parsedData.goalSettings || getDefaultGoalSettings();
          if (!parsedData.goalSettings.goals || parsedData.goalSettings.goals.length !== GOAL_CATEGORIES.length) {
              // If goals are missing or structure is incorrect, reset to default
              parsedData.goalSettings = getDefaultGoalSettings();
          } else {
              // Check if all current categories are present, add if not
              const currentCategoryIds = new Set(parsedData.goalSettings.goals.map(g => g.categoryId));
              const defaultGoals = getDefaultGoalSettings().goals;
              for (const defaultGoal of defaultGoals) {
                  if (!currentCategoryIds.has(defaultGoal.categoryId)) {
                      const categoryInfo = GOAL_CATEGORIES.find(cat => cat.id === defaultGoal.categoryId);
                      parsedData.goalSettings.goals.push({
                          categoryId: defaultGoal.categoryId,
                          target: categoryInfo ? categoryInfo.defaultTarget : 0,
                      });
                  }
              }
          }
          if (!parsedData.goalSettings.period) {
              parsedData.goalSettings.period = getDefaultGoalSettings().period;
          }

          // Ensure isForReview property exists on problems
          parsedData.solvedProblems = (parsedData.solvedProblems || []).map(p => ({
            ...p,
            isForReview: p.isForReview ?? false,
          }));

          setAppData(parsedData);
        } else {
          // No data in localStorage, initialize with defaults and save
          const defaultData = getDefaultAppData();
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData));
          setAppData(defaultData);
        }
      } catch (error) {
        console.error("Failed to load or initialize data from localStorage:", error);
        // Fallback to default data in case of parsing errors or other issues
        const defaultData = getDefaultAppData();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData)); // Attempt to save default if storage was corrupted
        setAppData(defaultData);
      } finally {
        setIsInitialized(true);
        setIsLoadingStorage(false);
      }
    }
    loadData();
  }, []);

  const saveDataToLocalStorage = useCallback((data: AppData) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
    }
  }, []);

  const addSolvedProblem = useCallback(async (problem: Omit<SolvedProblem, 'id'>) => {
    const newProblem: SolvedProblem = { ...problem, id: crypto.randomUUID(), isForReview: problem.isForReview ?? false };
    
    setAppData(prev => {
      const newData = {
        ...prev,
        solvedProblems: [...prev.solvedProblems, newProblem],
      };
      saveDataToLocalStorage(newData);
      return newData;
    });
  }, [saveDataToLocalStorage]);

  const updateSolvedProblem = useCallback(async (updatedProblem: SolvedProblem) => {
    setAppData(prev => {
      const newData = {
        ...prev,
        solvedProblems: prev.solvedProblems.map(p => p.id === updatedProblem.id ? {...updatedProblem, isForReview: updatedProblem.isForReview ?? false } : p),
      };
      saveDataToLocalStorage(newData);
      return newData;
    });
  }, [saveDataToLocalStorage]);
  
  const removeSolvedProblem = useCallback(async (problemId: string) => {
    setAppData(prev => {
      const newData = {
        ...prev,
        solvedProblems: prev.solvedProblems.filter(p => p.id !== problemId),
      };
      saveDataToLocalStorage(newData);
      return newData;
    });
  }, [saveDataToLocalStorage]);

  const updateGoalSettings = useCallback(async (newGoalSettings: GoalSettings) => {
    const fullNewSettings = {
      period: newGoalSettings.period,
      goals: newGoalSettings.goals.map(goal => ({
        categoryId: goal.categoryId,
        target: goal.target
      }))
    };

    setAppData(prev => {
      const newData = {
        ...prev,
        goalSettings: fullNewSettings,
      };
      saveDataToLocalStorage(newData);
      return newData;
    });
  }, [saveDataToLocalStorage]);
  
  const updateSingleGoal = useCallback(async (updatedGoal: Goal) => {
    setAppData(prev => {
      const newGoals = prev.goalSettings.goals.map(g => 
        g.categoryId === updatedGoal.categoryId ? updatedGoal : g
      );
      const newGoalSettings = { ...prev.goalSettings, goals: newGoals };
      const newData = { ...prev, goalSettings: newGoalSettings };
      saveDataToLocalStorage(newData);
      return newData;
    });
  }, [saveDataToLocalStorage]);

  const toggleProblemReviewStatus = useCallback(async (problemId: string) => {
    setAppData(prev => {
      const newProblemsState = prev.solvedProblems.map(p => 
        p.id === problemId ? { ...p, isForReview: !(p.isForReview ?? false) } : p
      );
      const newData = {
        ...prev,
        solvedProblems: newProblemsState,
      };
      saveDataToLocalStorage(newData);
      return newData;
    });
  }, [saveDataToLocalStorage]);


  return {
    appData,
    isInitialized,
    isLoading: isLoadingStorage || !isInitialized, 
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
