// src/app/register/actions.ts
"use server";

// Firebase auth imports and logic have been removed as authentication is disabled.
import type { FormState } from "@/app/login/actions"; // Re-use FormState type

export async function registerUser(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  console.warn("Registration attempt made, but authentication is disabled.");
  return { message: "Registration functionality is currently disabled.", type: "error" };
}
