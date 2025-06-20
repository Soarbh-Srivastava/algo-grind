
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
  url: z.string().describe('URL of the recommended problem from Striver sheet.'), // Removed .url() as AI might generate non-standard "links" from text
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
Your goal is to help users improve by suggesting relevant problems from Striver's A2Z DSA Sheet.

The user has solved the following problems:
{{#if solvedProblems.length}}
{{#each solvedProblems}}
- Type: {{this.problemType}}, Difficulty: {{this.difficulty}}, URL: {{this.url}}
{{/each}}
{{else}}
The user has not logged any solved problems yet.
{{/if}}

The Striver's A2Z DSA sheet, which is your primary source for recommendations, is available at: {{striverSheetUrl}}

{{#if targetProblemTypes.length}}
The user wants to focus on the following problem types: {{#each targetProblemTypes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}. Prioritize these if possible.
{{/if}}

Based on their progress (or lack thereof), observed weaknesses (e.g., few problems in a specific category or difficulty), and any target problem types, recommend 3-5 problems from the Striver's A2Z DSA sheet.
For each recommendation, provide:
1.  problemType: The category of the problem (must be one of: ${ProblemTypeEnum.options.join(', ')}).
2.  problemName: The name of the problem as listed on the Striver sheet.
3.  difficulty: The difficulty of the problem (easy, medium, or hard).
4.  url: The direct link to the problem on the Striver sheet or a LeetCode/GeeksforGeeks link IF found directly on the Striver sheet for that problem. If the Striver sheet only lists the problem name, try to find a common platform URL for it (e.g. LeetCode). If no direct link is available on the sheet and you cannot confidently find one, use the Striver sheet URL itself as a fallback for the problem URL.
5.  reason: A concise explanation of why this problem is being recommended (e.g., "To strengthen understanding of X topic," or "Builds upon previously solved Y problem," or "Good starting point for Z").

If the user has not solved many problems, suggest some foundational problems.
If the user has solved many problems in one area, suggest problems in other areas or higher difficulty problems in the same area.
Ensure the output matches the schema exactly, and that ALL fields are populated for each recommendation. Do not omit any fields.
If no relevant recommendations can be made from the Striver sheet based on the input, return an empty recommendations array.
`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    // Ensure that if solvedProblems is empty, it's an empty array, not undefined.
    const flowInput = {
      ...input,
      solvedProblems: input.solvedProblems || [],
      targetProblemTypes: input.targetProblemTypes || [],
    };
    const {output} = await prompt(flowInput);
    // Ensure output is never null and recommendations is an array.
    return output ? output : { recommendations: [] };
  }
);
