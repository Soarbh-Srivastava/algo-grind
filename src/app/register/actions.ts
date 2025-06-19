
// src/app/register/actions.ts
"use server";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { FormState } from "@/app/login/actions"; // Re-use FormState type

export async function registerUser(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { message: "All fields are required.", type: "error" };
  }

  if (password !== confirmPassword) {
    return { message: "Passwords do not match.", type: "error" };
  }

  if (password.length < 6) {
    return { message: "Password must be at least 6 characters long.", type: "error" };
  }
  
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // User creation success, onAuthStateChanged will handle redirect
    return { message: "Registration successful! You will be redirected shortly.", type: "success" };
  } catch (e: any) {
    let errorMessage = "Failed to register. Please try again.";
     if (e.code === 'auth/email-already-in-use') {
      errorMessage = "This email is already registered. Please login or use a different email.";
    } else if (e.code === 'auth/invalid-email') {
      errorMessage = "Please enter a valid email address.";
    } else if (e.code === 'auth/weak-password') {
      errorMessage = "Password is too weak. Please choose a stronger password (at least 6 characters).";
    }
    console.error("Registration error:", e);
    return { message: errorMessage, type: "error" };
  }
}
