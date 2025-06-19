import { z } from 'zod';

export const ProblemTypeEnum = z.enum([
  'array',
  'string',
  'sliding window',
  'prefix sum',
  'dp',
  'tree',
  'recursion',
  'backtracking',
]);
export type ProblemType = z.infer<typeof ProblemTypeEnum>;


export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SolvedProblem {
  id: string;
  title: string;
  type: ProblemType;
  difficulty: Difficulty;
  url: string;
  dateSolved: string; // YYYY-MM-DD
}

export interface Goal {
  categoryId: string; // Corresponds to GoalCategory id
  target: number;
}

export interface GoalSettings {
  goals: Goal[];
  period: 'daily' | 'weekly';
}

export interface GoalCategory {
  id: string; // e.g., 'array', 'dp_or_tree'
  label: string;
  defaultTarget: number;
  problemTypes: ProblemType[]; // Specific problem types this category covers
}

export interface AppData {
  solvedProblems: SolvedProblem[];
  goalSettings: GoalSettings;
}

export interface Recommendation {
  problemType: ProblemType;
  problemName: string;
  difficulty: Difficulty;
  url: string;
  reason: string;
}
