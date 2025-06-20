
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
  isForReview?: boolean; // Added for review feature
}

export interface Goal {
  categoryId: string; // Corresponds to GoalCategory id
  target: number;
}

export interface GoalSettings {
  goals: Goal[];
  period: 'daily' | 'weekly';
  defaultCodingLanguage?: string; // Added default coding language
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

// Chat-related schemas and types are removed

// Leaderboard related type
export interface UserPublicProfile {
  userId: string;
  displayName: string | null;
  photoURL: string | null;
  solvedProblemsCount: number;
  lastUpdated: string; // ISO date string
}
