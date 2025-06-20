
'use server';
/**
 * @fileOverview Provides a chat interface with the AI Coding Buddy.
 *
 * - chatWithCodingBuddy - A function to send a message to the AI Coding Buddy and get a response.
 * - ChatInput - The input type for the chatWithCodingBuddy function.
 * - ChatOutput - The return type for the chatWithCodingBuddy function.
 */

import {ai} from '@/ai/genkit';
import { ChatInputSchema, type ChatInput, ChatOutputSchema, type ChatOutput } from '@/types';

export async function chatWithCodingBuddy(input: ChatInput): Promise<ChatOutput> {
  return codingBuddyFlow(input);
}

const codingBuddyFlow = ai.defineFlow(
  {
    name: 'codingBuddyFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ message, history, defaultCodingLanguage }) => {
    const preferredLanguage = defaultCodingLanguage || 'javascript';
    const systemPrompt = `You are AlgoGrind Coding Buddy, a helpful and expert AI assistant specializing in programming, Data Structures, and Algorithms (DSA). Your primary goal is to help users understand coding concepts, debug their code, optimize solutions, and learn new programming techniques. 
    When providing code examples, use the language: ${preferredLanguage}. If the user explicitly asks for code in a different language, please use that specified language instead.
    You can answer questions about specific algorithms, data structures, problem-solving strategies, time/space complexity, provide code snippets, explain errors, and offer general programming advice. Keep your responses clear, concise, and accurate. When asked for code, provide it in correct markdown code blocks, specifying the language (e.g., \`\`\`${preferredLanguage} or \`\`\`python). Do not use HTML tags like <br> in your responses; use markdown newlines instead. Be encouraging and supportive.`;

    const genkitHistory = history 
      ? history.map(h => ({role: h.role, content: [{text: h.content}]})) 
      : [];

    const {text} = await ai.generate({
      prompt: message, 
      history: genkitHistory,
      system: systemPrompt,
    });

    return { response: text || "Sorry, I couldn't process that. Please try rephrasing." };
  }
);
