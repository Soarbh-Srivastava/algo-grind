
import { config } from 'dotenv';
config();

import '@/ai/flows/personalized-recommendations.ts';
import '@/ai/flows/ai-chat-flow.ts'; // Ensure the new chat flow is imported
