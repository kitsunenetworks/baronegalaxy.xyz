import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  where,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type ProjectData = {
  id?: string;
  title: string;
  summary: string;
  tags: string[];
  authorId: string;
  authorName: string;
  category: string;
  deviceCodename: string;
  androidVersion: string;
  buildStatus: "Stable" | "Beta" | "Nightly" | "Experimento" | "Discontinued";
  recovery: string;
  firmware: string;
  selinux: "Enforcing" | "Permissive" | "Unknown";
  downloadUrl?: string;
  sourceUrl?: string;
  xdaUrl?: string;
  changelog?: string;
  thanksCount?: number;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
  likesCount?: number;
  commentsCount?: number;
  status?: "published" | "hidden" | "draft";
};

export async function createProject(project: Omit<ProjectData, "id" | "createdAt" | "updatedAt"> & { coverFile?: File | null }) {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  const projectRef = await addDoc(collection(currentDb, "projects"), {
    ...project,
    tags: project.tags ?? [],
    likesCount: 0,
    commentsCount: 0,
    thanksCount: 0,
    status: project.status ?? "published",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return projectRef.id;
}

export async function uploadProjectCover(file: File, projectId: string) {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  const url = await compressImage(file);

  await updateDoc(doc(currentDb, "projects", projectId), {
    coverImage: url,
    updatedAt: serverTimestamp(),
  });

  return url;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("O arquivo selecionado não é uma imagem válida."));
      image.onload = () => {
        const maxSize = 1280;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
        if (dataUrl.length > 900_000) {
          reject(new Error("A imagem é muito grande mesmo após compressão. Escolha uma imagem menor."));
          return;
        }

        resolve(dataUrl);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function fetchProjects() {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  const q = query(collection(currentDb, "projects"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function fetchUserProjects(uid: string) {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  const q = query(collection(currentDb, "projects"), where("authorId", "==", uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function getProjectById(projectId: string) {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  const docRef = doc(currentDb, "projects", projectId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function fetchComments(projectId: string) {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  const q = query(collection(currentDb, "projects", projectId, "comments"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function addComment(
  projectId: string,
  payload: {
    userId: string;
    userName: string;
    text: string;
    isOP?: boolean;
    parentId?: string;
  },
) {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  const projectRef = doc(currentDb, "projects", projectId);
  const commentRef = doc(collection(currentDb, "projects", projectId, "comments"));

  await runTransaction(currentDb, async (transaction) => {
    const projectSnapshot = await transaction.get(projectRef);

    if (!projectSnapshot.exists()) {
      throw new Error("Projeto não encontrado.");
    }

    transaction.set(commentRef, {
      userId: payload.userId,
      userName: payload.userName,
      text: payload.text.trim(),
      isOP: Boolean(payload.isOP),
      parentId: payload.parentId ?? null,
      createdAt: serverTimestamp(),
    });
    transaction.update(projectRef, {
      commentsCount: Number(projectSnapshot.data().commentsCount ?? 0) + 1,
      updatedAt: serverTimestamp(),
    });
  });

  return commentRef.id;
}

export async function toggleProjectThanks(projectId: string, userId: string) {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  const projectRef = doc(currentDb, "projects", projectId);
  const thanksRef = doc(currentDb, "projects", projectId, "thanks", userId);

  return runTransaction(currentDb, async (transaction) => {
    const [projectSnapshot, thanksSnapshot] = await Promise.all([
      transaction.get(projectRef),
      transaction.get(thanksRef),
    ]);

    if (!projectSnapshot.exists()) throw new Error("Projeto não encontrado.");
    const currentThanks = Number(projectSnapshot.data().thanksCount ?? 0);
    const nextThanks = thanksSnapshot.exists() ? Math.max(0, currentThanks - 1) : currentThanks + 1;

    if (thanksSnapshot.exists()) transaction.delete(thanksRef);
    else transaction.set(thanksRef, { userId, createdAt: serverTimestamp() });

    transaction.update(projectRef, { thanksCount: nextThanks, updatedAt: serverTimestamp() });
    return { thanked: !thanksSnapshot.exists(), thanksCount: nextThanks };
  });
}

export async function toggleProjectLike(projectId: string, userId: string) {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  const projectRef = doc(currentDb, "projects", projectId);
  const likeRef = doc(currentDb, "projects", projectId, "likes", userId);

  return runTransaction(currentDb, async (transaction) => {
    const [projectSnapshot, likeSnapshot] = await Promise.all([
      transaction.get(projectRef),
      transaction.get(likeRef),
    ]);

    if (!projectSnapshot.exists()) {
      throw new Error("Projeto não encontrado.");
    }

    const currentLikes = Number(projectSnapshot.data().likesCount ?? 0);

    if (likeSnapshot.exists()) {
      transaction.delete(likeRef);
      transaction.update(projectRef, {
        likesCount: Math.max(0, currentLikes - 1),
        updatedAt: serverTimestamp(),
      });
      return { liked: false, likesCount: Math.max(0, currentLikes - 1) };
    }

    transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
    transaction.update(projectRef, {
      likesCount: currentLikes + 1,
      updatedAt: serverTimestamp(),
    });
    return { liked: true, likesCount: currentLikes + 1 };
  });
}

export async function hideProject(projectId: string) {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  await updateDoc(doc(currentDb, "projects", projectId), {
    status: "hidden",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(projectId: string) {
  if (!db) {
    throw new Error("Firebase Firestore não está configurado.");
  }

  const currentDb = db;
  await deleteDoc(doc(currentDb, "projects", projectId));
}
