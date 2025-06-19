
import { useState, useEffect, useCallback } from 'react';
import type { AppData, SolvedProblem, GoalSettings, Goal } from '@/types';
import { LOCAL_STORAGE_KEY, GOAL_CATEGORIES } from '@/lib/constants';

const getDefaultGoalSettings = (): GoalSettings => ({
  period: 'weekly', // Changed to weekly
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

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData) as AppData;
        // Ensure goalSettings are present and complete
        if (!parsedData.goalSettings || parsedData.goalSettings.goals.length !== GOAL_CATEGORIES.length) {
          parsedData.goalSettings = getDefaultGoalSettings();
        } else {
          // Ensure all categories are present in goals
          const currentCategoryIds = new Set(parsedData.goalSettings.goals.map(g => g.categoryId));
          const defaultGoals = getDefaultGoalSettings().goals;
          for (const defaultGoal of defaultGoals) {
            if (!currentCategoryIds.has(defaultGoal.categoryId)) {
              // Find the category from GOAL_CATEGORIES to get the correct defaultTarget
              const categoryInfo = GOAL_CATEGORIES.find(cat => cat.id === defaultGoal.categoryId);
              parsedData.goalSettings.goals.push({
                categoryId: defaultGoal.categoryId,
                target: categoryInfo ? categoryInfo.defaultTarget : 0, // Use new default or 0 if somehow not found
              });
            }
          }
           // Ensure the period is also set correctly if missing or old
          if (!parsedData.goalSettings.period) {
            parsedData.goalSettings.period = getDefaultGoalSettings().period;
          }
        }
        // Initialize isForReview for older data
        parsedData.solvedProblems = parsedData.solvedProblems.map(p => ({
          ...p,
          isForReview: p.isForReview ?? false,
        }));
        setAppData(parsedData);
      } else {
        setAppData(getDefaultAppData());
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      setAppData(getDefaultAppData());
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData));
      } catch (error) {
        console.error("Failed to save data to localStorage:", error);
      }
    }
  }, [appData, isInitialized]);

  const addSolvedProblem = useCallback((problem: Omit<SolvedProblem, 'id'>) => {
    setAppData(prev => ({
      ...prev,
      solvedProblems: [...prev.solvedProblems, { ...problem, id: crypto.randomUUID(), isForReview: problem.isForReview ?? false }],
    }));
  }, []);

  const updateSolvedProblem = useCallback((updatedProblem: SolvedProblem) => {
    setAppData(prev => ({
      ...prev,
      solvedProblems: prev.solvedProblems.map(p => p.id === updatedProblem.id ? {...updatedProblem, isForReview: updatedProblem.isForReview ?? false } : p),
    }));
  }, []);
  
  const removeSolvedProblem = useCallback((problemId: string) => {
    setAppData(prev => ({
      ...prev,
      solvedProblems: prev.solvedProblems.filter(p => p.id !== problemId),
    }));
  }, []);

  const updateGoalSettings = useCallback((newGoalSettings: GoalSettings) => { // Changed Partial<GoalSettings> to GoalSettings
    setAppData(prev => ({
      ...prev,
      // Ensure all properties of GoalSettings are updated, not just partial
      goalSettings: { 
        period: newGoalSettings.period, 
        goals: newGoalSettings.goals.map(goal => ({ // ensure goals are fully formed
            categoryId: goal.categoryId,
            target: goal.target
        }))
      },
    }));
  }, []);
  
  const updateSingleGoal = useCallback((updatedGoal: Goal) => {
    setAppData(prev => {
      const newGoals = prev.goalSettings.goals.map(g => 
        g.categoryId === updatedGoal.categoryId ? updatedGoal : g
      );
      return {
        ...prev,
        goalSettings: {
          ...prev.goalSettings,
          goals: newGoals,
        },
      };
    });
  }, []);

  const toggleProblemReviewStatus = useCallback((problemId: string) => {
    setAppData(prev => ({
      ...prev,
      solvedProblems: prev.solvedProblems.map(p => 
        p.id === problemId ? { ...p, isForReview: !p.isForReview } : p
      ),
    }));
  }, []);


  return {
    appData,
    isInitialized,
    addSolvedProblem,
    updateSolvedProblem,
    removeSolvedProblem,
    updateGoalSettings,
    updateSingleGoal,
    toggleProblemReviewStatus, // Export new function
    solvedProblems: appData.solvedProblems,
    goalSettings: appData.goalSettings,
  };
}
