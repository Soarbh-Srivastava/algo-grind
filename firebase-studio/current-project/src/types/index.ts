
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
  isForReview?: boolean;
}

export interface Goal {
  categoryId: string; // Corresponds to GoalCategory id
  target: number;
}

export interface GoalSettings {
  goals: Goal[];
  period: 'daily' | 'weekly';
  defaultCodingLanguage?: string;
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

// Chat-related schemas and types (re-added for Coding Buddy)
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe("The role of the message sender, either 'user' or 'model' (AI)."),
  content: z.string().describe("The content of the chat message."),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatInputSchema = z.object({
  message: z.string().describe('The latest message from the user.'),
  history: z.array(ChatMessageSchema).optional().describe('The conversation history up to this point.'),
  defaultCodingLanguage: z.string().optional().describe('The default coding language preferred by the user.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  response: z.string().describe("The AI's response message content."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


export interface UserPublicProfile {
  userId: string;
  displayName: string | null;
  photoURL: string | null;
  solvedProblemsCount: number;
  lastUpdated: string; // ISO date string
}

