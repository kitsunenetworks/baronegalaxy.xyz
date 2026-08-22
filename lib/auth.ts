import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  browserLocalPersistence,
  setPersistence,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseConfigured } from "./firebase";

export type AppUserRole = "owner" | "user";

export type AppUserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  role: AppUserRole;
  bio: string;
  avatarUrl: string;
  createdAt?: string;
  updatedAt?: string;
};

export function getFirebaseAuthErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  const messages: Record<string, string> = {
    "auth/invalid-email": "Digite um email válido.",
    "auth/missing-password": "Digite sua senha.",
    "auth/invalid-credential": "Email ou senha incorretos.",
    "auth/invalid-login-credentials": "Email ou senha incorretos.",
    "auth/email-already-in-use": "Este email já possui uma conta. Entre ou use outro email.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/user-disabled": "Esta conta foi desativada.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    "auth/operation-not-allowed": "Ative o provedor Email/Password no Firebase Console.",
    "auth/popup-blocked": "O navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.",
    "auth/popup-closed-by-user": "A janela de login foi fechada antes da conclusão.",
    "auth/unauthorized-domain": "Adicione este domínio em Authentication > Settings > Authorized domains.",
  };

  return messages[code] ?? (error instanceof Error ? error.message : "Não foi possível concluir a autenticação.");
}

function ensureFirebaseReady() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error("Firebase não está configurado. Preencha as variáveis do ambiente.");
  }
}

async function preparePersistentSession() {
  ensureFirebaseReady();
  await setPersistence(auth!, browserLocalPersistence);
}

export async function signUpWithEmail(email: string, password: string) {
  await preparePersistentSession();
  const currentAuth = auth!;
  const currentDb = db!;
  const credential = await createUserWithEmailAndPassword(currentAuth, email, password);

  await setDoc(doc(currentDb, "users", credential.user.uid), {
    uid: credential.user.uid,
    email: credential.user.email,
    displayName: credential.user.displayName ?? "Usuário",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bio: "",
    avatarUrl: "",
  }, { merge: true });
  await setDoc(doc(currentDb, "publicProfiles", credential.user.uid), {
    uid: credential.user.uid,
    displayName: "Usuário",
    bio: "",
    avatarUrl: "",
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  await preparePersistentSession();
  const currentAuth = auth!;
  const currentDb = db!;
  const credential = await signInWithEmailAndPassword(currentAuth, email, password);
  const profileRef = doc(currentDb, "publicProfiles", credential.user.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists()) {
    await setDoc(profileRef, {
      uid: credential.user.uid,
      displayName: credential.user.displayName ?? "Usuário",
      bio: "",
      avatarUrl: credential.user.photoURL ?? "",
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  return credential.user;
}

export async function signInWithGoogle() {
  await preparePersistentSession();
  const currentAuth = auth!;
  const currentDb = db!;
  const credential = await signInWithPopup(currentAuth, googleProvider);
  const uid = credential.user.uid;

  const userRef = doc(currentDb, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid,
      email: credential.user.email,
      displayName: credential.user.displayName ?? "Usuário",
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bio: "",
      avatarUrl: credential.user.photoURL ?? "",
    });
    await setDoc(doc(currentDb, "publicProfiles", uid), {
      uid,
      displayName: credential.user.displayName ?? "Usuário",
      bio: "",
      avatarUrl: credential.user.photoURL ?? "",
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  return credential.user;
}

export async function logOut() {
  ensureFirebaseReady();
  const currentAuth = auth!;
  await signOut(currentAuth);
}

export async function getUserProfile(uid: string) {
  if (!isFirebaseConfigured || !db) return null;
  const currentDb = db;
  const docRef = doc(currentDb, "users", uid);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as AppUserProfile) : null;
}

export async function updateUserProfile(uid: string, updates: Partial<AppUserProfile>) {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase não está configurado. Preencha as variáveis do ambiente.");
  }

  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    ...updates,
    uid,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  await setDoc(doc(db, "publicProfiles", uid), {
    uid,
    displayName: updates.displayName ?? "Usuário",
    bio: updates.bio ?? "",
    avatarUrl: updates.avatarUrl ?? "",
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function getPublicUserProfile(uid: string) {
  if (!isFirebaseConfigured || !db) return null;
  const snapshot = await getDoc(doc(db, "publicProfiles", uid));
  return snapshot.exists() ? (snapshot.data() as Pick<AppUserProfile, "uid" | "displayName" | "bio" | "avatarUrl">) : null;
}

export function isOwner(user: User | null | undefined) {
  return Boolean(user && user.email?.endsWith("@baronegalaxy.com"));
}
