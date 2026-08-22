"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, FileText, ShieldAlert, Users } from "lucide-react";
import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { getUserProfile } from "@/lib/auth";
import { hideProject } from "@/lib/projects";

type ModerationItem = {
  id: string;
  title: string;
  authorName: string;
  summary: string;
  status: string;
};

type FirestoreProjectRecord = {
  id: string;
  title?: string;
  authorName?: string;
  summary?: string;
  status?: string;
};

export default function AdminPage() {
  const [usersCount, setUsersCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!isFirebaseConfigured || !db || !auth?.currentUser) {
        setAuthorized(false);
        setModerationQueue([]);
        setUsersCount(0);
        setProjectsCount(0);
        return;
      }

      try {
        const profile = await getUserProfile(auth.currentUser.uid);
        if (profile?.role !== "owner") {
          setAuthorized(false);
          return;
        }
        setAuthorized(true);
        const [usersSnapshot, projectsSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "projects")),
        ]);

        const projectList: FirestoreProjectRecord[] = projectsSnapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Partial<FirestoreProjectRecord>),
        }));

        const queue = projectList.filter((project) => project.status !== "published").map((project) => ({
          id: String(project.id),
          title: String(project.title ?? "Projeto sem título"),
          authorName: String(project.authorName ?? "Usuário"),
          summary: String(project.summary ?? "Sem resumo."),
          status: String(project.status ?? "draft"),
        }));

        setUsersCount(usersSnapshot.size);
        setProjectsCount(projectList.length);
        setModerationQueue(queue);
      } catch (error) {
        console.error(error);
      }
    };

    loadAdminData();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Usuários", value: String(usersCount), icon: Users },
      { label: "Projetos", value: String(projectsCount), icon: FileText },
      { label: "Alertas", value: String(moderationQueue.length), icon: ShieldAlert },
    ],
    [moderationQueue.length, projectsCount, usersCount],
  );

  if (authorized === false) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-zinc-50">
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8">
          <h1 className="text-2xl font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-red-100/80">A área administrativa exige uma conta com função owner.</p>
        </div>
      </main>
    );
  }

  const handleApprove = async (projectId: string) => {
    if (!db) return;

    await updateDoc(doc(db, "projects", projectId), {
      status: "published",
      updatedAt: serverTimestamp(),
    });

    setModerationQueue((current) => current.filter((item) => item.id !== projectId));
  };

  const handleHide = async (projectId: string) => {
    await hideProject(projectId);
    setModerationQueue((current) => current.filter((item) => item.id !== projectId));
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-zinc-50">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-violet-400">Admin Console</p>
        <h1 className="mt-2 text-3xl font-semibold">Moderação e dados da plataforma</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-zinc-400">{label}</p>
              <Icon className="h-5 w-5 text-violet-400" />
            </div>
            <span className="text-3xl font-semibold">{value}</span>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Fila de revisão</h2>
          <button className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-200">
            Exportar relatório
          </button>
        </div>

        <div className="space-y-4">
          {moderationQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 p-4 text-sm text-zinc-300">
              Nenhuma revisão pendente no momento.
            </div>
          ) : (
            moderationQueue.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-zinc-100">{item.title}</p>
                  <p className="text-sm text-zinc-400">
                    {item.authorName} · {item.status}
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">{item.summary}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleHide(item.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
