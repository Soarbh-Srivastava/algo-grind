
import type { ProblemType, Difficulty, GoalCategory } from '@/types';

export const STRIVER_SHEET_URL = 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/';

export const PROBLEM_TYPES: { value: ProblemType; label: string }[] = [
  { value: 'array', label: 'Array' },
  { value: 'string', label: 'String' },
  { value: 'sliding window', label: 'Sliding Window' },
  { value: 'prefix sum', label: 'Prefix Sum' },
  { value: 'dp', label: 'Dynamic Programming' },
  { value: 'tree', label: 'Tree' },
  { value: 'recursion', label: 'Recursion' },
  { value: 'backtracking', label: 'Backtracking' },
];

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export const GOAL_CATEGORIES: GoalCategory[] = [
  {
    id: 'array',
    label: 'Array',
    defaultTarget: 12, 
    problemTypes: ['array']
  },
  {
    id: 'string',
    label: 'String',
    defaultTarget: 12, 
    problemTypes: ['string']
  },
  {
    id: 'sliding_window',
    label: 'Sliding Window',
    defaultTarget: 12, 
    problemTypes: ['sliding window']
  },
  {
    id: 'prefix_sum',
    label: 'Prefix Sum',
    defaultTarget: 12, 
    problemTypes: ['prefix sum']
  },
  {
    id: 'dp_or_tree',
    label: 'DP or Tree',
    defaultTarget: 11, 
    problemTypes: ['dp', 'tree']
  },
  {
    id: 'recursion_or_backtracking',
    label: 'Recursion or Backtracking',
    defaultTarget: 11, 
    problemTypes: ['recursion', 'backtracking']
  },
];
// Removed: export const LOCAL_STORAGE_KEY = 'algoGrindData';
