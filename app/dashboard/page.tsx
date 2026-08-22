"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, PencilLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile, type AppUserProfile } from "@/lib/auth";
import { fetchUserProjects } from "@/lib/projects";

type ProjectSummary = {
  id: string;
  title: string;
  summary: string;
  likesCount?: number;
  commentsCount?: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      router.push("/login");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isFirebaseConfigured || !auth) {
        router.push("/login");
        return;
      }

      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const [userProfile, userProjects] = await Promise.all([
          getUserProfile(currentUser.uid),
          fetchUserProjects(currentUser.uid),
        ]);

        const nextProfile = userProfile ?? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName ?? "Usuário",
          role: "user",
          bio: "",
          avatarUrl: currentUser.photoURL ?? "",
          username: "usuario",
          githubUrl: "",
          telegramUrl: "",
          xdaUrl: "",
          devices: [],
          badges: [],
        };

        setProfile(nextProfile);
        setProjects(userProjects as ProjectSummary[]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [router]);

  const stats = [
    { label: "Projetos", value: String(projects.length) },
    {
      label: "Comentários",
      value: String(projects.reduce((sum, item) => sum + (item.commentsCount ?? 0), 0)),
    },
    {
      label: "Curtidas",
      value: String(projects.reduce((sum, item) => sum + (item.likesCount ?? 0), 0)),
    },
  ];

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 text-zinc-50">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-8 text-center text-zinc-300">
          Carregando dashboard do Firebase...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-zinc-50">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-400">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold">Bem-vindo, {profile?.displayName ?? "Usuário"}</h1>
        </div>
      </div>

      <nav className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-2" aria-label="Navegação do painel">
        <a href="#postagens" className="rounded-xl bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/25">Minhas postagens</a>
        <Link href={`/perfil/${profile?.uid}`} className="rounded-xl px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white">Ver perfil</Link>
        <Link href="/dashboard/new" className="ml-auto inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"><PencilLine className="h-4 w-4" /> Nova publicação</Link>
      </nav>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur">
            <p className="text-sm text-zinc-400">{stat.label}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-3xl font-semibold">{stat.value}</span>
              <BarChart3 className="h-5 w-5 text-violet-400" />
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div id="postagens" className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-medium">Minhas postagens</p>
              <p className="text-sm text-zinc-400">Projetos e atividade publicada</p>
            </div>
          </div>

          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 p-5 text-sm text-zinc-300">
                Você ainda não publicou nenhum projeto.
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 4).map((project) => (
                  <div key={project.id} className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-zinc-100">{project.title}</p>
                      <span className="text-xs uppercase tracking-[0.18em] text-violet-200">#{project.id.slice(0, 6)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{project.summary}</p>
                    <div className="mt-3 flex gap-4 text-xs text-zinc-400">
                      <span>{project.likesCount ?? 0} curtidas</span>
                      <span>{project.commentsCount ?? 0} comentários</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/dashboard/new"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Publicar projeto
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
