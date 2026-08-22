"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, UserCircle2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { getUserProfile, updateUserProfile, type AppUserProfile } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ManageProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [devices, setDevices] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [xdaUrl, setXdaUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      router.push("/login");
      return;
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const data = await getUserProfile(currentUser.uid);
      if (data) {
        setProfile(data);
        setUsername(data.username || "usuario");
        setDisplayName(data.displayName || "Usuário");
        setBio(data.bio || "");
        setDevices((data.devices || []).join(", "));
        setGithubUrl(data.githubUrl || "");
        setTelegramUrl(data.telegramUrl || "");
        setXdaUrl(data.xdaUrl || "");
      }
      setLoading(false);
    });
  }, [router]);

  const saveProfile = async () => {
    if (!auth?.currentUser || !profile) return;
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanUsername.length < 3) {
      setMessage("O nome de usuário precisa ter pelo menos 3 caracteres.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await updateUserProfile(auth.currentUser.uid, {
        ...profile,
        username: cleanUsername,
        displayName: displayName.trim() || "Usuário",
        bio: bio.trim(),
        devices: devices.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 10),
        githubUrl: githubUrl.trim(),
        telegramUrl: telegramUrl.trim(),
        xdaUrl: xdaUrl.trim(),
      });
      setMessage("Perfil atualizado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-12 text-center text-zinc-300">Carregando seu perfil...</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-zinc-50">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard" className="rounded-xl border border-white/10 p-2 text-zinc-300 hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
        <div><p className="text-xs uppercase tracking-[0.2em] text-violet-400">Conta</p><h1 className="mt-1 text-3xl font-semibold">Gerenciar perfil</h1></div>
      </div>
      <section className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 md:p-8">
        <div className="mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 text-violet-200"><UserCircle2 className="h-8 w-8" /></div>
          <div><p className="text-lg font-semibold">@{username || "usuario"}</p><p className="text-sm text-zinc-400">{profile?.email}</p><p className="mt-1 text-xs uppercase tracking-[0.15em] text-cyan-200">{profile?.role === "owner" ? "Owner" : "Membro"}</p></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label><span className="mb-2 block text-sm text-zinc-400">Nome de usuário</span><input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} className="profile-input" /></label>
          <label><span className="mb-2 block text-sm text-zinc-400">Nome público</span><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} className="profile-input" /></label>
          <label className="sm:col-span-2"><span className="mb-2 block text-sm text-zinc-400">Bio</span><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} maxLength={500} className="profile-input resize-y" /></label>
          <label className="sm:col-span-2"><span className="mb-2 block text-sm text-zinc-400">Dispositivos</span><input value={devices} onChange={(e) => setDevices(e.target.value)} placeholder="POCO F3, Pixel 8" className="profile-input" /></label>
          <label><span className="mb-2 block text-sm text-zinc-400">GitHub</span><input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." className="profile-input" /></label>
          <label><span className="mb-2 block text-sm text-zinc-400">Telegram</span><input value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} placeholder="https://t.me/..." className="profile-input" /></label>
          <label className="sm:col-span-2"><span className="mb-2 block text-sm text-zinc-400">Perfil XDA</span><input value={xdaUrl} onChange={(e) => setXdaUrl(e.target.value)} placeholder="https://forum.xda-developers.com/..." className="profile-input" /></label>
        </div>
        {message && <p className="mt-5 text-sm text-cyan-200">{message}</p>}
        <button onClick={saveProfile} disabled={saving} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white hover:bg-violet-400 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar alterações"}</button>
      </section>
    </main>
  );
}