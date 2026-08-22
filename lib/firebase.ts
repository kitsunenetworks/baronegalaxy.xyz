import { getApp, getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId,
);

export const firebaseConfigStatus = {
  isConfigured: isFirebaseConfigured,
  missing: [
    !firebaseConfig.apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
    !firebaseConfig.authDomain && "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    !firebaseConfig.projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    !firebaseConfig.messagingSenderId && "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    !firebaseConfig.appId && "NEXT_PUBLIC_FIREBASE_APP_ID",
  ].filter((name): name is string => Boolean(name)),
};

const app = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;
