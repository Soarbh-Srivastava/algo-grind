// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// IMPORTANT: For a production app, move these to environment variables!
const firebaseConfig = {
  apiKey: "AIzaSyCC9S4er3lXdll5G3bZTZFUFnUFRLFnEp8",
  authDomain: "easy-apply-ef76e.firebaseapp.com",
  projectId: "easy-apply-ef76e",
  storageBucket: "easy-apply-ef76e.firebasestorage.app",
  messagingSenderId: "49124194703",
  appId: "1:49124194703:web:eb98850733ffbeade433fa",
  measurementId: "G-MPZ9WQW17Z"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
