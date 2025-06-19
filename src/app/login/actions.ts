
// src/app/login/actions.ts
"use server";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Ensure this path is correct

export type FormState = {
  message: string;
  type: "error" | "success" | "";
};

export async function loginUser(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { message: "Email and password are required.", type: "error" };
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Success will be handled by onAuthStateChanged redirecting the user
    // For server action, we might not need to return a success message here if redirect happens
    return { message: "", type: "" }; // Clear message on success attempt before redirect
  } catch (e: any) {
    let errorMessage = "Failed to login. Please check your credentials.";
    if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password.";
    } else if (e.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
    }
    console.error("Login error:", e);
    return { message: errorMessage, type: "error" };
  }
}
