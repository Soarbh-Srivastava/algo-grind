
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Log successful login on the server for diagnostics
    console.log(`Login successful for user: ${userCredential.user.email} (UID: ${userCredential.user.uid})`);
    
    // Success is primarily handled by onAuthStateChanged triggering a redirect client-side.
    // Returning a success message here is mostly for completeness of the FormState.
    return { message: "Login successful. Redirecting...", type: "success" };
  } catch (e: any) {
    let errorMessage = "An unexpected error occurred during login. Please try again.";
    // Log the full error object to the server console for detailed diagnosis
    console.error("Login attempt failed. Raw Firebase error object:", e);
    // For better debugging, log specific properties if they exist
    if (e.code || e.message) {
        console.error(`Login attempt failed. Code: ${e.code}, Message: ${e.message}`);
    }


    if (e.code) { // Check if e.code exists (Firebase errors usually have this)
        switch (e.code) {
            case 'auth/invalid-credential':
                errorMessage = "Invalid email or password. Please double-check your credentials.";
                console.log("Login error detail: auth/invalid-credential. This usually means incorrect email or password combination, or the user does not exist.");
                break;
            case 'auth/invalid-email':
                errorMessage = "The email address format is not valid.";
                console.log("Login error detail: auth/invalid-email.");
                break;
            case 'auth/user-disabled':
                errorMessage = "This user account has been disabled.";
                console.log("Login error detail: auth/user-disabled.");
                break;
            case 'auth/user-not-found': // Often wrapped into auth/invalid-credential in newer SDKs
                errorMessage = "No user found with this email. Please register or check the email.";
                console.log("Login error detail: auth/user-not-found.");
                break;
            case 'auth/wrong-password': // Often wrapped into auth/invalid-credential in newer SDKs
                errorMessage = "Incorrect password. Please try again.";
                console.log("Login error detail: auth/wrong-password.");
                break;
            case 'auth/too-many-requests':
                errorMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can try again later or reset your password.";
                console.log("Login error detail: auth/too-many-requests.");
                break;
            default:
                // For any other Firebase error code not explicitly handled above
                console.error(`Unhandled Firebase Auth error code during login: ${e.code}`);
                errorMessage = `Login failed. If the issue persists, please contact support (Code: ${e.code}).`;
        }
    } else {
        // For errors that are not Firebase-specific or don't have a 'code' property
        console.error("Non-Firebase or unknown error during login:", e.message || e);
    }
    return { message: errorMessage, type: "error" };
  }
}
    