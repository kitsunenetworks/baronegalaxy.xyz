"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { createProject, uploadProjectCover } from "@/lib/projects";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("android, custom-rom, kernel");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    if (!auth?.currentUser) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async () => {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      setError("Você precisa estar autenticado e configurar o Firebase.");
      return;
    }

    if (!title.trim() || !summary.trim()) {
      setError("Título e resumo são obrigatórios.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cleanTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const projectId = await createProject({
        title: title.trim(),
        summary: summary.trim(),
        tags: cleanTags,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || auth.currentUser.email || "Usuário",
      });

      if (coverFile) {
        await uploadProjectCover(coverFile, projectId);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o projeto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-zinc-50">
      {!isFirebaseConfigured && !error && (
        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Preencha as variáveis do Firebase para publicar.
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard" className="rounded-full border border-white/10 p-2 text-zinc-300 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-400">Novo Projeto</p>
          <h1 className="mt-1 text-3xl font-semibold">Publicar atualização</h1>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-[28px] border border-white/10 bg-zinc-900/70 p-5 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">Título</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="AetherOS v2.6"
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-zinc-100 outline-none transition focus:border-violet-500/70"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">Resumo</span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={6}
                placeholder="Descreva o que o projeto faz, suporte, changelog e requisitos..."
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-zinc-100 outline-none transition focus:border-violet-500/70"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">Tags</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-zinc-100 outline-none transition focus:border-violet-500/70"
              />
            </label>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-dashed border-violet-500/40 bg-violet-500/5 p-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 text-violet-200">
                <ImagePlus className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-zinc-200">Capa do projeto</p>
              <p className="mt-2 text-sm text-zinc-400">Upload da imagem principal</p>
              <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
                <UploadCloud className="h-4 w-4" />
                Selecionar arquivo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
              <p className="mb-3 text-sm text-zinc-300">Preview do card</p>
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
                {coverFile ? (
                  <img src={URL.createObjectURL(coverFile)} alt="Preview da capa" className="mb-3 h-24 w-full rounded-xl object-cover" />
                ) : (
                  <div className="mb-3 h-24 rounded-xl bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.5),_transparent_30%),linear-gradient(135deg,#111827,#1f2937)]" />
                )}
                <div className="mb-2 flex flex-wrap gap-2">
                  {tags
                    .split(",")
                    .slice(0, 3)
                    .map((tag) => (
                      <span key={tag} className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-violet-200">
                        {tag.trim() || "tag"}
                      </span>
                    ))}
                </div>
                <h3 className="text-lg font-semibold text-white">{title || "Título do projeto"}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{summary || "Resumo do projeto aparecerá aqui..."}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-full bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar Projeto"}
          </button>
        </div>
      </div>
    </main>
  );
}
