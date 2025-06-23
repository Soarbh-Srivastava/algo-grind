'use server';

import { z } from 'zod';

const WebhookPayloadSchema = z.object({
  userId: z.string(),
  displayName: z.string().optional().nullable(),
  goalsMet: z.boolean(),
  unmetGoalLabels: z.array(z.string()),
  totalGoals: z.number(),
  completedGoals: z.number(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

export async function triggerWebhook(webhookUrl: string, payload: WebhookPayload) {
  if (!webhookUrl.startsWith('https://hook.make.com/')) {
    console.error("Invalid or non-Make.com webhook URL provided.");
    return { success: false, error: 'Invalid or non-Make.com webhook URL. Please provide a valid URL from Make.com.' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Webhook call failed with status: ${response.status}`, errorBody);
      throw new Error(`Webhook call failed with status: ${response.status}`);
    }

    const responseData = await response.text();
    return { success: true, data: responseData };
  } catch (error: any) {
    console.error("Error triggering webhook:", error.message);
    return { success: false, error: error.message };
  }
}
