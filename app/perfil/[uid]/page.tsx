"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicUserProfile, getUserProfile, type AppUserProfile } from "@/lib/auth";
import { fetchUserProjects } from "@/lib/projects";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

type ProfileProject = {
  id: string;
  title: string;
  summary: string;
  likesCount?: number;
  commentsCount?: number;
};
type PublicProfile = Pick<AppUserProfile, "uid" | "username" | "displayName" | "bio" | "avatarUrl" | "githubUrl" | "telegramUrl" | "xdaUrl" | "devices" | "badges">;

export default function ProfilePage({ params }: { params: { uid: string } }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [projects, setProjects] = useState<ProfileProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        const [profileData, projectList] = await Promise.all([
          getPublicUserProfile(params.uid),
          fetchUserProjects(params.uid),
        ]);

        setProfile(profileData);
        setProjects(projectList as ProfileProject[]);

        if (auth) {
          const currentUser = auth.currentUser;
          if (currentUser?.uid === params.uid) {
            const privateProfile = await getUserProfile(currentUser.uid);
            setRole(privateProfile?.role ?? "user");
            setIsOwnProfile(true);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar o perfil.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [params.uid]);

  if (loading) {
    return <main className="mx-auto max-w-5xl px-4 py-10 text-center text-zinc-300">Carregando perfil do Firebase...</main>;
  }

  if (!profile) {
    return <main className="mx-auto max-w-5xl px-4 py-10 text-center text-zinc-300">{error || "Perfil não encontrado."}</main>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-zinc-50">
      <section className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 text-2xl font-semibold text-violet-200">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-400">Perfil público</p>
            <h1 className="mt-2 text-3xl font-semibold">{profile.displayName}</h1>
            <p className="mt-2 text-sm text-cyan-200">@{profile.username || "usuario"}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">{role === "owner" ? "Owner" : "Membro"}</p>
          </div>
          {isOwnProfile && <Link href="/dashboard#perfil" className="rounded-full border border-violet-400/30 px-4 py-2 text-sm text-violet-200 transition hover:bg-violet-500/10">Editar perfil</Link>}
        </div>
        {profile.bio && <p className="mt-6 max-w-2xl leading-7 text-zinc-300">{profile.bio}</p>}
        {(profile.devices?.length > 0 || profile.badges?.length > 0) && (
          <div className="mt-6 flex flex-wrap gap-2">
            {profile.devices?.map((device) => <span key={device} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">{device}</span>)}
            {profile.badges?.map((badge) => <span key={badge} className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">{badge}</span>)}
          </div>
        )}
        {(profile.githubUrl || profile.telegramUrl || profile.xdaUrl) && (
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-violet-200 hover:underline">GitHub</a>}
            {profile.telegramUrl && <a href={profile.telegramUrl} target="_blank" rel="noreferrer" className="text-violet-200 hover:underline">Telegram</a>}
            {profile.xdaUrl && <a href={profile.xdaUrl} target="_blank" rel="noreferrer" className="text-violet-200 hover:underline">XDA Developers</a>}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Projetos publicados</h2>
          <span className="text-sm text-zinc-400">{projects.length} projetos</span>
        </div>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 p-6 text-center text-zinc-300">Este usuário ainda não publicou projetos.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/projeto/${project.id}`} className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 transition hover:border-violet-500/40">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{project.summary}</p>
                <div className="mt-4 flex gap-4 text-xs text-zinc-400">
                  <span>{project.likesCount ?? 0} curtidas</span>
                  <span>{project.commentsCount ?? 0} comentários</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}