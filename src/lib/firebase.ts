
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let db: Firestore;
let authInstance: Auth;

if (!getApps().length) {
  const requiredKeys: (keyof typeof firebaseConfig)[] = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId',
  ];
  
  const missingOrInvalidKeysDetails = requiredKeys
    .map(key => {
      const envVarName = `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`;
      const value = firebaseConfig[key]; // This pulls from process.env due to the initial object definition
      const isInvalid = !value || typeof value !== 'string' || value.trim() === "" || value.toLowerCase() === "undefined";
      return { key, envVarName, value, isInvalid };
    })
    .filter(detail => detail.isInvalid);

  if (missingOrInvalidKeysDetails.length > 0) {
    const errorDetailsString = missingOrInvalidKeysDetails
      .map(detail => `- ${detail.envVarName}: (Value as seen by app: '${String(detail.value)}') - Expected a valid string.`)
      .join('\n    ');

    const errorMessage = `Firebase Initialization Aborted: Critical Configuration Missing/Invalid.
    The application cannot initialize Firebase services. The following essential Firebase configuration values are missing, empty, not strings, or literally "undefined" in your environment variables:
    ${errorDetailsString}

    Action Required:
    1. Please ensure all NEXT_PUBLIC_FIREBASE_... environment variables are correctly set in your .env file or your project's hosting/build configuration.
    2. Verify these values against your Firebase project settings (Project settings > General > Your apps > Firebase SDK snippet).
    3. If you recently updated these values, ensure your development server or build process has been restarted to pick up the changes.
    The application cannot function correctly without these values.`;
    
    console.error(errorMessage);
    // Log the entire firebaseConfig object (with API key potentially redacted if sensitive logging is a concern, but for debugging, raw value can be helpful)
    console.error("Full firebaseConfig object being used at time of error (check values carefully):", JSON.stringify(firebaseConfig, null, 2));
    throw new Error("Firebase configuration is critically missing or invalid. Halting application initialization to prevent further errors.");
  }

  try {
    app = initializeApp(firebaseConfig);
  } catch (initError: any) {
    console.error("CRITICAL FIREBASE INITIALIZATION ERROR (initializeApp call failed):", initError);
    console.error("This usually indicates a fundamental problem with the Firebase configuration values provided (e.g., malformed projectId, authDomain, or other critical fields).");
    console.error("Firebase Config Used (API Key Redacted for security if preferred, showing raw for debug):", JSON.stringify(firebaseConfig, (key, value) => key === "apiKey" && String(value).length > 5 ? "REDACTED_FOR_LOGGING_IF_NEEDED" : value, 2));
    throw new Error(`Firebase app initialization failed: ${initError.message}. Check console for details and verify your Firebase project configuration.`);
  }
} else {
  app = getApps()[0];
}

try {
  db = getFirestore(app);
  authInstance = getAuth(app); 
} catch (serviceError: any) {
  console.error("CRITICAL FIREBASE SERVICE INITIALIZATION ERROR (getFirestore or getAuth call failed):", serviceError.message, serviceError.code ? `(Code: ${serviceError.code})` : '');
  if (serviceError.code === 'auth/invalid-api-key') {
    console.error(
      "Specific Error Detected: 'auth/invalid-api-key'.\n" +
      "This means the Firebase API key (NEXT_PUBLIC_FIREBASE_API_KEY) you provided is invalid or not authorized for this project.\n" +
      `Current API Key Value (first 5 chars): ${String(firebaseConfig.apiKey).substring(0,5)}...\n`+
      "Troubleshooting Steps:\n" +
      "1. Double-check that the API key in your .env file (or project's environment settings) matches EXACTLY with the one from your Firebase project console (Project settings > General > Your apps > Firebase SDK snippet > Configuration).\n" +
      "2. Ensure the API key is enabled in the Google Cloud Console for your Firebase project (APIs & Services > Credentials).\n" +
      "3. Verify that the current Firebase project (projectId: " + firebaseConfig.projectId + ") is the one you intend to use and that it's correctly configured to allow operations from your app's domain (Authentication > Settings > Authorized domains).\n" +
      "4. If you recently created the API key or made changes, there might be a short delay for propagation."
    );
  } else {
    console.error("This could be due to other issues with Firebase configuration values, network problems, or Firebase service outages.");
  }
  console.error("Firebase Config Used at time of error (API Key potentially redacted):", JSON.stringify(firebaseConfig, (key, value) => key === "apiKey" && String(value).length > 5 ? "REDACTED_FOR_LOGGING_IF_NEEDED" : value, 2));
  throw new Error(`Firebase service initialization (Firestore/Auth) failed: ${serviceError.message}. Check console for specific error details and troubleshooting steps.`);
}

export { app, db, authInstance as auth };
