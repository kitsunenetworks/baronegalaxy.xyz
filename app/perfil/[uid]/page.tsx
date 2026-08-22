"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Code2, ExternalLink, Heart, MessageSquareText, ShieldCheck, Smartphone, UserCircle2 } from "lucide-react";
import { getPublicUserProfile, getUserProfile, type AppUserProfile } from "@/lib/auth";
import { fetchUserProjects } from "@/lib/projects";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

type ProfileProject = {
  id: string;
  title: string;
  summary: string;
  likesCount?: number;
  commentsCount?: number;
  category?: string;
  buildStatus?: string;
  deviceCodename?: string;
};

type PublicProfile = Pick<AppUserProfile, "uid" | "username" | "displayName" | "bio" | "avatarUrl" | "githubUrl" | "telegramUrl" | "xdaUrl" | "devices" | "badges">;

export default function ProfilePage({ params }: { params: { uid: string } }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [projects, setProjects] = useState<ProfileProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectsError, setProjectsError] = useState("");
  const [role, setRole] = useState<AppUserProfile["role"]>("user");
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isFirebaseConfigured) {
        setError("Configure o Firebase para carregar este perfil.");
        setLoading(false);
        return;
      }

      try {
        let publicProfile = await getPublicUserProfile(params.uid);

        if (!publicProfile && auth?.currentUser?.uid === params.uid) {
          const privateProfile = await getUserProfile(params.uid);
          if (privateProfile) {
            publicProfile = {
              uid: privateProfile.uid,
              username: privateProfile.username || "usuario",
              displayName: privateProfile.displayName || "Usuário",
              bio: privateProfile.bio || "",
              avatarUrl: privateProfile.avatarUrl || "",
              githubUrl: privateProfile.githubUrl || "",
              telegramUrl: privateProfile.telegramUrl || "",
              xdaUrl: privateProfile.xdaUrl || "",
              devices: privateProfile.devices || [],
              badges: privateProfile.badges || [],
            };
          }
        }

        if (auth?.currentUser?.uid === params.uid) {
          const privateProfile = await getUserProfile(params.uid);
          setRole(privateProfile?.role ?? "user");
          setIsOwnProfile(true);
        }

        if (!publicProfile && auth?.currentUser?.uid === params.uid && auth.currentUser) {
          publicProfile = {
            uid: auth.currentUser.uid,
            username: "usuario",
            displayName: auth.currentUser.displayName || "Usuário",
            bio: "",
            avatarUrl: auth.currentUser.photoURL || "",
            githubUrl: "",
            telegramUrl: "",
            xdaUrl: "",
            devices: [],
            badges: [],
          };
        }

        setProfile(publicProfile);

        try {
          const projectList = await fetchUserProjects(params.uid);
          setProjects(projectList as ProfileProject[]);
        } catch (projectError) {
          setProjects([]);
          setProjectsError(projectError instanceof Error ? projectError.message : "As publicações não estão disponíveis agora.");
        }
      } catch (err) {
        if (auth?.currentUser?.uid === params.uid) {
          setProfile({
            uid: params.uid,
            username: "usuario",
            displayName: auth.currentUser.displayName || "Usuário",
            bio: "",
            avatarUrl: auth.currentUser.photoURL || "",
            githubUrl: "",
            telegramUrl: "",
            xdaUrl: "",
            devices: [],
            badges: [],
          });
          setIsOwnProfile(true);
          setError("");
        } else {
          setError(err instanceof Error ? err.message : "Não foi possível carregar o perfil.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [params.uid]);

  if (loading) return <main className="mx-auto max-w-5xl px-4 py-10 text-center text-zinc-300">Carregando perfil...</main>;
  if (!profile) return <main className="mx-auto max-w-5xl px-4 py-10 text-center text-zinc-300">{error || "Perfil não encontrado."}</main>;

  const totalLikes = projects.reduce((sum, project) => sum + (project.likesCount ?? 0), 0);
  const totalComments = projects.reduce((sum, project) => sum + (project.commentsCount ?? 0), 0);

  return (
    <main className="profile-page mx-auto max-w-5xl px-4 py-10 text-zinc-50">
      <section className="profile-hero overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70">
        <div className="profile-banner h-32 md:h-44" />
        <div className="relative px-6 pb-7 md:px-8">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.displayName} className="profile-avatar h-24 w-24 rounded-2xl object-cover" /> : <div className="profile-avatar flex h-24 w-24 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200"><UserCircle2 className="h-10 w-10" /></div>}
              <div className="pb-1">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Perfil público</p>
                <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{profile.displayName}</h1>
                <p className="mt-1 text-sm text-cyan-200">@{profile.username || "usuario"}</p>
              </div>
            </div>
            {isOwnProfile && <Link href="/dashboard/perfil" className="rounded-xl border border-violet-400/30 px-4 py-2 text-sm text-violet-200 transition hover:bg-violet-500/10">Editar perfil</Link>}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-cyan-200"><ShieldCheck className="h-3.5 w-3.5" />{role === "owner" ? "Owner" : "Membro"}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1"><Award className="h-3.5 w-3.5 text-violet-300" />{profile.badges?.length || 1} badges</span>
            <span className="inline-flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" />{profile.devices?.length || 0} dispositivos</span>
          </div>
          {profile.bio && <p className="mt-6 max-w-2xl leading-7 text-zinc-300">{profile.bio}</p>}
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
            <div><p className="text-2xl font-semibold text-white">{projects.length}</p><p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Projetos</p></div>
            <div><p className="text-2xl font-semibold text-white">{totalLikes}</p><p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Curtidas</p></div>
            <div><p className="text-2xl font-semibold text-white">{totalComments}</p><p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Comentários</p></div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
          <h2 className="text-lg font-semibold">Sobre este membro</h2>
          <div className="mt-5 space-y-5">
            <div><p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Dispositivos</p><div className="mt-3 flex flex-wrap gap-2">{profile.devices?.length ? profile.devices.map((device) => <span key={device} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">{device}</span>) : <span className="text-sm text-zinc-500">Nenhum dispositivo informado</span>}</div></div>
            <div><p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Badges</p><div className="mt-3 flex flex-wrap gap-2">{(profile.badges?.length ? profile.badges : ["Membro"]).map((badge) => <span key={badge} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-xs text-violet-200"><Award className="h-3.5 w-3.5" />{badge}</span>)}</div></div>
            {(profile.githubUrl || profile.telegramUrl || profile.xdaUrl) && <div><p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Links</p><div className="mt-3 flex flex-wrap gap-3 text-sm">{profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-violet-200 hover:underline"><Code2 className="h-4 w-4" />GitHub</a>}{profile.telegramUrl && <a href={profile.telegramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-violet-200 hover:underline"><ExternalLink className="h-4 w-4" />Telegram</a>}{profile.xdaUrl && <a href={profile.xdaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-violet-200 hover:underline"><ExternalLink className="h-4 w-4" />XDA</a>}</div></div>}
          </div>
        </aside>
        <div>
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Atividade pública</p><h2 className="mt-1 text-2xl font-semibold">Projetos publicados</h2></div><span className="text-sm text-zinc-400">{projects.length} projetos</span></div>
          {projectsError ? <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center text-sm text-amber-100">Perfil carregado. As publicações serão exibidas quando o Firestore estiver disponível.</div> : projects.length === 0 ? <div className="rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 p-8 text-center text-zinc-300">Este usuário ainda não publicou projetos.</div> : <div className="space-y-4">{projects.map((project) => <Link key={project.id} href={`/projeto/${project.id}`} className="profile-project-card block rounded-2xl border border-white/10 bg-zinc-900/70 p-5 transition hover:border-violet-500/40"><div className="flex items-start justify-between gap-4"><div><div className="mb-2 flex flex-wrap gap-2">{project.category && <span className="text-xs text-cyan-200">{project.category}</span>}{project.buildStatus && <span className="text-xs text-emerald-200">{project.buildStatus}</span>}</div><h3 className="text-lg font-semibold">{project.title}</h3></div><ExternalLink className="h-4 w-4 shrink-0 text-violet-300" /></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{project.summary}</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500"><span className="font-mono text-cyan-200/70">{project.deviceCodename || "generic"}</span><span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{project.likesCount ?? 0}</span><span className="inline-flex items-center gap-1"><MessageSquareText className="h-3.5 w-3.5" />{project.commentsCount ?? 0}</span></div></Link>)}</div>}
        </div>
      </section>
    </main>
  );
}
