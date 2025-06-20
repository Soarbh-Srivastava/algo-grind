// src/app/register/actions.ts
"use server";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Ensure this path is correct
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
    // Successful registration is handled client-side by onAuthStateChanged,
    // which then redirects. The message below will be shown briefly.
    return { message: "Registration successful! Try login.", type: "success" };
  } catch (e: any) {
    console.error("Registration error from server action:", e);
    let errorMessage = "An unknown error occurred during registration.";
     if (e.code) {
      switch (e.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email address is already in use.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
        default:
          errorMessage = e.message;
          break;
      }
    }
    return { message: errorMessage, type: "error" };
  }
}
