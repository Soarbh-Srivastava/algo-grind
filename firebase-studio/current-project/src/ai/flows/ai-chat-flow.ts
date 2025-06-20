
'use server';
/**
 * @fileOverview Provides a chat interface with the AI mentor for DSA guidance.
 *
 * - chatWithAIChatMentor - A function to send a message to the AI mentor and get a response.
 * - AIChatInput - The input type for the chatWithAIChatMentor function.
 * - AIChatOutput - The return type for the chatWithAIChatMentor function.
 */

import {ai} from '@/ai/genkit';
import { AIChatInputSchema, type AIChatInput, AIChatOutputSchema, type AIChatOutput } from '@/types';

export async function chatWithAIChatMentor(input: AIChatInput): Promise<AIChatOutput> {
  return aiChatMentorFlow(input);
}

const aiChatMentorFlow = ai.defineFlow(
  {
    name: 'aiChatMentorFlow',
    inputSchema: AIChatInputSchema,
    outputSchema: AIChatOutputSchema,
  },
  async ({ message, history, defaultCodingLanguage }) => {
    const preferredLanguage = defaultCodingLanguage || 'javascript';
    const systemPrompt = `You are AlgoGrind AI Mentor, a friendly and encouraging expert in Data Structures and Algorithms (DSA). Your primary goal is to help users understand DSA concepts, overcome problem-solving challenges, and stay motivated in their learning journey.
When providing code examples, use the language: ${preferredLanguage}. If the user explicitly asks for code in a different language, please use that specified language instead.
You can answer questions about specific algorithms, data structures, problem-solving strategies, time/space complexity analysis, and provide general guidance related to competitive programming and technical interviews.
Keep your responses concise, clear, and helpful. When asked for code, provide it in correct markdown code blocks, specifying the language (e.g., \`\`\`${preferredLanguage} or \`\`\`python). Do not use HTML tags like <br> in your responses; use markdown newlines instead.
If a question is outside the scope of DSA, coding, or software engineering interview preparation, politely state that you are specialized in those areas.`;

    const genkitHistory = history
      ? history.map(h => ({role: h.role, content: [{text: h.content}]}))
      : [];

    const {text} = await ai.generate({
      prompt: message,
      history: genkitHistory,
      system: systemPrompt,
    });

    return { response: text || "I'm sorry, I wasn't able to generate a response. Could you please try rephrasing?" };
  }
);
