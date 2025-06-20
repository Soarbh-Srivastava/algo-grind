
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
    // Slightly more concise system prompt
    const systemPrompt = `You are AlgoGrind Coding Buddy, an expert AI assistant for programming, Data Structures, and Algorithms (DSA). Help users understand concepts, debug code, optimize solutions, and learn new techniques.
    When providing code examples, use: ${preferredLanguage}. If the user specifies another language, use that.
    You can answer questions about algorithms, data structures, problem-solving, complexity, provide code snippets, explain errors, and offer programming advice.
    When explaining algorithms (especially recursive ones), aim to provide an execution tree or step-by-step breakdown. Analyze provided code snippets to explain their behavior and output.
    Keep responses clear, concise, and accurate. Use markdown for code blocks, specifying the language (e.g., \`\`\`${preferredLanguage}). Do not use HTML tags like <br>; use markdown newlines. Be encouraging.
    IMPORTANT: This is an ongoing conversation. Refer to the chat history to maintain context and provide relevant, coherent responses. Avoid repeating information already discussed unless clarification is needed.`;

    // Ensure history is an array of {role, content: [{text}]} for Genkit
    const genkitHistory = history
      ? history.map(h => ({role: h.role, content: [{text: h.content}]}))
      : [];

    const {text} = await ai.generate({
      prompt: message, // The current user message
      history: genkitHistory, // The conversation history BEFORE the current message
      system: systemPrompt,
    });

    return { response: text || "Sorry, I couldn't process that. Please try rephrasing." };
  }
);
