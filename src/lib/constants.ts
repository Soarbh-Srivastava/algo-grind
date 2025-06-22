
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
    defaultTarget: 2, 
    problemTypes: ['array']
  },
  {
    id: 'string',
    label: 'String',
    defaultTarget: 2, 
    problemTypes: ['string']
  },
  {
    id: 'sliding_window',
    label: 'Sliding Window',
    defaultTarget: 2, 
    problemTypes: ['sliding window']
  },
  {
    id: 'prefix_sum',
    label: 'Prefix Sum',
    defaultTarget: 2, 
    problemTypes: ['prefix sum']
  },
  {
    id: 'dp_or_tree',
    label: 'DP or Tree',
    defaultTarget: 1, 
    problemTypes: ['dp', 'tree']
  },
  {
    id: 'recursion_or_backtracking',
    label: 'Recursion or Backtracking',
    defaultTarget: 1, 
    problemTypes: ['recursion', 'backtracking']
  },
];

export const CODING_LANGUAGES: { value: string; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'swift', label: 'Swift' },
];

export const REMINDER_TIMES: { value: number; label: string }[] = [
  { value: 17, label: '5:00 PM' },
  { value: 18, label: '6:00 PM' },
  { value: 19, label: '7:00 PM' },
  { value: 20, label: '8:00 PM' },
  { value: 21, label: '9:00 PM' },
  { value: 22, label: '10:00 PM' },
];
