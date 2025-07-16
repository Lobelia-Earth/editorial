import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { clientEnv } from "./env";

const firebaseConfig = {
  apiKey: clientEnv.FIREBASE_API_KEY,
  authDomain: clientEnv.FIREBASE_AUTH_DOMAIN,
  databaseURL: clientEnv.FIREBASE_DATABASE_URL,
  projectId: clientEnv.FIREBASE_PROJECT_ID,
  storageBucket: clientEnv.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: clientEnv.FIREBASE_MESSAGING_SENDER_ID || "",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firebaseDb = getDatabase(app);
