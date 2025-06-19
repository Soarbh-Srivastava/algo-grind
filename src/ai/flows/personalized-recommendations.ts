// src/ai/flows/personalized-recommendations.ts
'use server';

/**
 * @fileOverview Provides personalized problem recommendations based on user progress.
 *
 * - getPersonalizedRecommendations - A function that generates problem recommendations.
 * - PersonalizedRecommendationsInput - The input type for the getPersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the getPersonalizedRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ProblemTypeEnum } from '@/types';


const PersonalizedRecommendationsInputSchema = z.object({
  solvedProblems: z.array(
    z.object({
      problemType: ProblemTypeEnum.describe('The category of the problem.'),
      difficulty: z.enum(['easy', 'medium', 'hard']).describe('Difficulty of the problem'),
      url: z.string().url().describe('URL of the solved problem'),
    })
  ).describe('List of problems already solved by the user, with their difficulty and type.'),
  targetProblemTypes: z.array(ProblemTypeEnum).optional().describe('Optional list of problem types to focus on.'),
  striverSheetUrl: z.string().url().describe('URL for the Striver A2Z DSA Sheet.'),
});

export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const RecommendationSchema = z.object({
  problemType: ProblemTypeEnum.describe('The category of the recommended problem.'),
  problemName: z.string().describe('The name of the recommended problem.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('Difficulty of the problem'),
  url: z.string().url().describe('URL of the recommended problem from Striver sheet.'),
  reason: z.string().describe('Why this problem is being recommended')
});

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema).describe('Personalized problem recommendations.'),
});

export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function getPersonalizedRecommendations(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  prompt: `You are an AI mentor specializing in DSA problem recommendations based on user progress.

  The user has solved the following problems:
  {{#each solvedProblems}}
  - Type: {{this.problemType}}, Difficulty: {{this.difficulty}}, URL: {{this.url}}
  {{/each}}

  The Striver's A2Z DSA sheet is available at: {{striverSheetUrl}}

  {{#if targetProblemTypes}}
  The user wants to focus on the following problem types: {{#each targetProblemTypes}}{{{this}}}, {{/each}}.
  {{/if}}

  Based on their progress and weaknesses, recommend problems from the Striver's A2Z DSA sheet, adjusting difficulty appropriately.
  Explain why each problem is being recommended.

  Ensure the URLs you provide are valid and directly link to the problem on the Striver's sheet.
  Ensure that the output matches the schema exactly, and that ALL fields are populated. Do not omit any fields.
  `, 
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
