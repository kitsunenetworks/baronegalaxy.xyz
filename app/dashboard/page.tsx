"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, FilePlus2, MessageSquareText, PencilLine, ShieldCheck, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile, type AppUserProfile } from "@/lib/auth";
import { fetchProjects, fetchUserProjects } from "@/lib/projects";

type ProjectSummary = {
  id: string;
  title: string;
  summary: string;
  authorId: string;
  authorName?: string;
  status?: string;
  likesCount?: number;
  commentsCount?: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [communityProjects, setCommunityProjects] = useState<ProjectSummary[]>([]);
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
        const [userProfile, userProjects, allProjects] = await Promise.all([
          getUserProfile(currentUser.uid),
          fetchUserProjects(currentUser.uid),
          fetchProjects(),
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
        setCommunityProjects((allProjects as ProjectSummary[]).filter((project) => project.authorId !== currentUser.uid && project.status !== "hidden"));
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
      <main className="dashboard-page mx-auto max-w-6xl px-4 py-10 text-zinc-50">
        <div className="dashboard-loading rounded-3xl border border-white/10 bg-zinc-900/70 p-8 text-center text-zinc-300">
          Carregando dashboard do Firebase...
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page mx-auto max-w-6xl px-4 py-10 text-zinc-50">
      <div className="dashboard-heading mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-violet-200"><Sparkles className="h-3.5 w-3.5" />Área de trabalho</div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">Dashboard pessoal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Bem-vindo, {profile?.displayName ?? "Usuário"}</h1>
          <p className="mt-2 text-sm text-zinc-500">Acompanhe sua presença e mantenha suas builds em movimento.</p>
        </div>
      </div>

      <nav className="dashboard-tabs mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-2" aria-label="Navegação do painel">
        <a href="#minhas-postagens" className="dashboard-tab dashboard-tab--active rounded-xl px-4 py-2 text-sm font-medium">Minhas postagens</a>
        <a href="#comunidade" className="dashboard-tab rounded-xl px-4 py-2 text-sm font-medium">Comunidade</a>
        <Link href={`/perfil/${profile?.uid}`} className="dashboard-tab rounded-xl px-4 py-2 text-sm font-medium">Ver perfil</Link>
        <Link href="/dashboard/perfil" className="dashboard-tab rounded-xl px-4 py-2 text-sm font-medium">Configurações</Link>
        <Link href="/dashboard/new" className="dashboard-tab dashboard-tab--action ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"><PencilLine className="h-4 w-4" /> Nova publicação</Link>
      </nav>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="dashboard-stat rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{stat.label}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-4xl font-semibold tracking-tight">{stat.value}</span>
              <BarChart3 className="h-5 w-5 text-violet-400" />
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div id="minhas-postagens" className="dashboard-posts rounded-3xl border border-white/10 bg-zinc-900/70 p-6 lg:col-span-2">
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
              <div className="dashboard-empty rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200"><FilePlus2 className="h-6 w-6" /></div>
                <p className="mt-4 text-lg font-medium text-zinc-100">Seu laboratório começa aqui</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">Publique uma ROM, kernel, ferramenta ou experimento e transforme sua página em um histórico vivo de builds.</p>
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
                      <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-violet-300" />{project.likesCount ?? 0}</span>
                      <span className="inline-flex items-center gap-1.5"><MessageSquareText className="h-3.5 w-3.5 text-cyan-300" />{project.commentsCount ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </section>

      <section id="comunidade" className="dashboard-posts mt-6 rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Feed da comunidade</p>
            <h2 className="mt-1 text-xl font-semibold">Descobertas recentes</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">{communityProjects.length} publicações</span>
        </div>
        {communityProjects.length === 0 ? (
          <div className="dashboard-empty rounded-2xl border border-dashed border-cyan-400/20 bg-cyan-400/5 p-8 text-center text-sm text-zinc-400">As próximas descobertas da comunidade aparecerão aqui.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {communityProjects.slice(0, 6).map((project) => (
              <Link key={project.id} href={`/projeto/${project.id}`} className="dashboard-community-item rounded-2xl border border-white/10 bg-zinc-950/50 p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-medium text-zinc-100">{project.title}</p><p className="mt-1 text-xs text-cyan-200/70">por {project.authorName || "Membro"}</p></div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-cyan-300" />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">{project.summary}</p>
                <div className="mt-3 flex gap-4 text-xs text-zinc-500"><span>{project.likesCount ?? 0} curtidas</span><span>{project.commentsCount ?? 0} comentários</span></div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
