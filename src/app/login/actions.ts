// src/app/login/actions.ts
"use server";

// Firebase auth imports and logic have been removed as authentication is disabled.

export type FormState = {
  message: string;
  type: "error" | "success" | "";
};

export async function loginUser(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  console.warn("Login attempt made, but authentication is disabled.");
  return { message: "Login functionality is currently disabled.", type: "error" };
}
