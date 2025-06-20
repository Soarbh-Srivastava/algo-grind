
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
    You can answer questions about specific algorithms, data structures, problem-solving strategies, time/space complexity, provide code snippets, explain errors, and offer general programming advice.

    When explaining algorithms, especially recursive ones, try to provide an execution tree or a step-by-step breakdown of how the algorithm processes an example input. You can represent execution trees using nested lists or simple text-based diagrams.
    If a user provides a code snippet and asks for its output or behavior, analyze the code carefully and explain what it will do and what its output will be.

    Keep your responses clear, concise, and accurate. When asked for code, provide it in correct markdown code blocks, specifying the language (e.g., \`\`\`${preferredLanguage} or \`\`\`python). Do not use HTML tags like <br> in your responses; use markdown newlines instead. Be encouraging and supportive.
    IMPORTANT: You are having an ongoing conversation. Use the provided conversation history to understand the context of the user's current message and provide relevant, coherent follow-up responses. Do not repeat information or ask questions that have already been addressed in the history unless clarification is genuinely needed.`;

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

