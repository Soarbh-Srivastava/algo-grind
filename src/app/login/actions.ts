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
    // Successful login is handled client-side by onAuthStateChanged,
    // which then redirects. So, we might not even see this message
    // if the redirect happens fast enough.
    return { message: "Login successful! Redirecting...", type: "success" };
  } catch (e: any) {
    console.error("Login error from server action:", e);
    let errorMessage = "An unknown error occurred during login.";
    if (e.code) {
      switch (e.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage = "Invalid email or password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/too-many-requests":
            errorMessage = "Too many login attempts. Please try again later.";
            break;
        default:
          errorMessage = e.message;
          break;
      }
    }
    return { message: errorMessage, type: "error" };
  }
}
