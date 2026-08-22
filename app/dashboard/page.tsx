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
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [xdaUrl, setXdaUrl] = useState("");
  const [devices, setDevices] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
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
          username: "usuario",
          githubUrl: "",
          telegramUrl: "",
          xdaUrl: "",
          devices: [],
          badges: [],
        };

        setProfile(nextProfile);
        setBio(nextProfile.bio ?? "");
        setUsername(nextProfile.username ?? "usuario");
        setDisplayName(nextProfile.displayName ?? "Usuário");
        setGithubUrl(nextProfile.githubUrl ?? "");
        setTelegramUrl(nextProfile.telegramUrl ?? "");
        setXdaUrl(nextProfile.xdaUrl ?? "");
        setDevices((nextProfile.devices ?? []).join(", "));
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
    setProfileMessage("");

    try {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (cleanUsername.length < 3) {
        setProfileMessage("O nome de usuário precisa ter pelo menos 3 caracteres.");
        return;
      }

      const cleanDevices = devices.split(",").map((device) => device.trim()).filter(Boolean).slice(0, 10);
      await updateUserProfile(auth.currentUser.uid, {
        ...profile,
        bio,
        username: cleanUsername,
        displayName: displayName.trim() || "Usuário",
        githubUrl: githubUrl.trim(),
        telegramUrl: telegramUrl.trim(),
        xdaUrl: xdaUrl.trim(),
        devices: cleanDevices,
      });

      setProfile((current) => (current ? { ...current, bio, username: cleanUsername, displayName: displayName.trim() || "Usuário", githubUrl: githubUrl.trim(), telegramUrl: telegramUrl.trim(), xdaUrl: xdaUrl.trim(), devices: cleanDevices } : current));
      setUsername(cleanUsername);
      setProfileMessage("Perfil atualizado com sucesso.");
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
        <div id="perfil" className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
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
              <p className="text-lg font-semibold text-zinc-100">@{profile?.username ?? "usuario"}</p>
              <p className="mt-1 text-sm text-zinc-400">{profile?.email ?? "Conta Firebase"}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-400">Nome de usuário</span>
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="seu_nome" maxLength={30} className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200 outline-none transition focus:border-violet-500/70" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-400">Nome público</span>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Seu nome ou alias" maxLength={60} className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200 outline-none transition focus:border-violet-500/70" />
              </label>
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

            <label className="block">
              <span className="mb-2 block text-sm text-zinc-400">Dispositivos</span>
              <input value={devices} onChange={(event) => setDevices(event.target.value)} placeholder="POCO F3, Redmi Note 4" className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200 outline-none transition focus:border-violet-500/70" />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="GitHub URL" className="rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-3 text-sm text-zinc-200 outline-none focus:border-violet-500/70" />
              <input value={telegramUrl} onChange={(event) => setTelegramUrl(event.target.value)} placeholder="Telegram URL" className="rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-3 text-sm text-zinc-200 outline-none focus:border-violet-500/70" />
              <input value={xdaUrl} onChange={(event) => setXdaUrl(event.target.value)} placeholder="XDA URL" className="rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-3 text-sm text-zinc-200 outline-none focus:border-violet-500/70" />
            </div>

            <div className="flex flex-wrap gap-2">
              {(profile?.badges?.length ? profile.badges : ["Membro"]).map((badge) => <span key={badge} className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">{badge}</span>)}
            </div>

            {profileMessage && <p className={`text-sm ${profileMessage.includes("sucesso") ? "text-emerald-300" : "text-amber-200"}`}>{profileMessage}</p>}

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </div>

        <div id="postagens" className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
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
