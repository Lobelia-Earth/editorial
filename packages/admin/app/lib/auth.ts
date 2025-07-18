import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import type { FirebaseConfig } from "./config";

export function createFirebaseApp(config: FirebaseOptions) {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const firebaseDb = getDatabase(app);

  return {
    app,
    auth,
    firebaseDb,
  };
}

let firebaseInstance: ReturnType<typeof createFirebaseApp> | null = null;

export function initializeFirebase(config: FirebaseConfig) {
  if (firebaseInstance) {
    return firebaseInstance;
  }

  const firebaseConfig: FirebaseOptions = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    databaseURL: config.databaseURL,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
  };

  firebaseInstance = createFirebaseApp(firebaseConfig);
  return firebaseInstance;
}

export function getFirebaseInstance() {
  if (!firebaseInstance) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first.",
    );
  }

  return firebaseInstance;
}

export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_, prop) {
    return getFirebaseInstance().auth[prop as keyof ReturnType<typeof getAuth>];
  },
});

export const firebaseDb = new Proxy({} as ReturnType<typeof getDatabase>, {
  get(_, prop) {
    return getFirebaseInstance().firebaseDb[
      prop as keyof ReturnType<typeof getDatabase>
    ];
  },
});
