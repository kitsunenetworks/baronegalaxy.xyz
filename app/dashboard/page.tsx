"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Camera, PencilLine, ShieldCheck, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile, updateUserProfile, type AppUserProfile } from "@/lib/auth";
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
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        };

        setProfile(nextProfile);
        setBio(nextProfile.bio ?? "");
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

  const handleSaveProfile = async () => {
    if (!auth?.currentUser || !profile) return;

    setSaving(true);

    try {
      await updateUserProfile(auth.currentUser.uid, {
        ...profile,
        bio,
        displayName: profile.displayName,
      });

      setProfile((current) => (current ? { ...current, bio } : current));
    } finally {
      setSaving(false);
    }
  };

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
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
        >
          <PencilLine className="h-4 w-4" />
          Criar Novo Projeto
        </Link>
      </div>

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
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20 text-violet-200">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-medium">Perfil público</p>
              <p className="text-sm text-zinc-400">Atualize sua bio e imagem</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-violet-500/40 bg-violet-500/5 p-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 text-violet-200">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-sm text-zinc-300">{profile?.email ?? "Adicionar foto de perfil"}</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-zinc-400">Bio</span>
              <textarea
                rows={5}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200 outline-none ring-0 transition focus:border-violet-500/70"
              />
            </label>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-medium">Novo projeto</p>
              <p className="text-sm text-zinc-400">Formulário rápido</p>
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
