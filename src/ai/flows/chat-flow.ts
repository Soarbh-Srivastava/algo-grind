
'use server';
/**
 * @fileOverview Provides a chat interface with the AI mentor.
 *
 * - chatWithMentor - A function to send a message to the AI mentor and get a response.
 * - ChatInput - The input type for the chatWithMentor function. (Imported from @/types)
 * - ChatOutput - The return type for the chatWithMentor function. (Imported from @/types)
 * - ChatMessage - The schema for a single chat message. (Imported from @/types)
 */

import {ai} from '@/ai/genkit';
import { ChatInputSchema, type ChatInput, ChatOutputSchema, type ChatOutput, type ChatMessage } from '@/types'; // Updated import

export async function chatWithMentor(input: ChatInput): Promise<ChatOutput> {
  return chatWithMentorFlow(input);
}

const chatWithMentorFlow = ai.defineFlow(
  {
    name: 'chatWithMentorFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ message, history }) => {
    const systemPrompt = `You are AlgoGrind AI Mentor, a friendly and encouraging expert in Data Structures and Algorithms (DSA). Your goal is to help users understand DSA concepts, overcome challenges, and stay motivated in their learning journey. You can answer questions about specific algorithms, data structures, problem-solving strategies, time/space complexity, and provide general guidance. Keep your responses concise and helpful. When asked for code, provide it in correct markdown code blocks, specifying the language if possible (e.g., \`\`\`javascript). Do not use HTML tags like <br> in your responses, use markdown newlines instead.`;

    // Map simple history to Genkit's expected format
    const genkitHistory = history 
      ? history.map(h => ({role: h.role, content: [{text: h.content}]})) 
      : [];

    const {text} = await ai.generate({
      prompt: message, // Current user message
      history: genkitHistory,
      system: systemPrompt,
      // The model configured in src/ai/genkit.ts will be used by default
      // config: { // Optional safety settings if needed
      //   safetySettings: [...] 
      // }
    });

    return { response: text || "Sorry, I couldn't process that. Please try rephrasing." };
  }
);
