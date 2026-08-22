"use client";

import { useEffect, useState } from "react";
import { ArrowBigUpDash, Heart, MessageSquareText, Reply, Send, ShieldCheck, Star, ThumbsUp } from "lucide-react";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { addComment, fetchComments, getProjectById, toggleProjectLike, toggleProjectThanks, type ProjectData } from "@/lib/projects";

type ProjectRecord = ProjectData & { id: string };
type CommentRecord = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  isOP?: boolean;
  parentId?: string | null;
  createdAt?: unknown;
};

function formatDate(value: unknown) {
  if (!value) return "agora";

  if (typeof value === "string") {
    return new Date(value).toLocaleDateString("pt-BR");
  }

  if (typeof value === "object" && value && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString("pt-BR");
  }

  return "agora";
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [thanked, setThanked] = useState(false);
  const [thanksCount, setThanksCount] = useState(0);
  const [thanking, setThanking] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProject = async () => {
      try {
        if (!isFirebaseConfigured) {
          setError("Configure o Firebase para carregar o projeto.");
          setLoading(false);
          return;
        }

        const [projectData, commentList] = await Promise.all([getProjectById(projectId), fetchComments(projectId)]);
        setProject(projectData as ProjectRecord | null);
        setComments(commentList as CommentRecord[]);
        setLikesCount(Number((projectData as ProjectRecord | null)?.likesCount ?? 0));
        setThanksCount(Number((projectData as ProjectRecord | null)?.thanksCount ?? 0));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar o projeto.");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const handleSubmitComment = async () => {
    if (!auth?.currentUser) {
      setError("Você precisa entrar para comentar.");
      return;
    }

    if (!message.trim()) {
      setError("Escreva algo antes de enviar.");
      return;
    }

    setPosting(true);
    setError("");

    try {
      await addComment(projectId, {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email || "Usuário",
        text: message,
        isOP: Boolean(project && auth.currentUser.uid === project.authorId),
        parentId: replyTo ?? undefined,
      });

      const nextComments = await fetchComments(projectId);
      setComments(nextComments as CommentRecord[]);
      setMessage("");
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o comentário.");
    } finally {
      setPosting(false);
    }
  };

  const handleThanks = async () => {
    if (!auth?.currentUser) {
      setError("Você precisa entrar para agradecer ao autor.");
      return;
    }

    setThanking(true);
    setError("");
    try {
      const result = await toggleProjectThanks(projectId, auth.currentUser.uid);
      setThanked(result.thanked);
      setThanksCount(result.thanksCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o agradecimento.");
    } finally {
      setThanking(false);
    }
  };

  const handleLike = async () => {
    if (!auth?.currentUser) {
      setError("Você precisa entrar para curtir projetos.");
      return;
    }

    setLiking(true);
    setError("");

    try {
      const result = await toggleProjectLike(projectId, auth.currentUser.uid);
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a curtida.");
    } finally {
      setLiking(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 text-zinc-50">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-8 text-center text-zinc-300">
          Carregando projeto do Firebase...
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 text-zinc-50">
        <div className="rounded-3xl border border-dashed border-violet-500/30 bg-violet-500/5 p-8 text-center text-zinc-300">
          {error || "Projeto não encontrado."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-zinc-50">
      <article className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70">
        <div className="h-72 w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.35),_transparent_35%),linear-gradient(135deg,_rgba(17,24,39,1),_rgba(59,130,246,0.2),_rgba(17,24,39,1))]">
          {project.coverImage && (
            <img src={project.coverImage} alt={project.title} className="h-full w-full object-cover" />
          )}
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-violet-300">
            {project.category && <span className="text-cyan-200">{project.category}</span>}
            {project.buildStatus && <span className="text-emerald-200">{project.buildStatus}</span>}
            {(project.tags || []).map((tag: string) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold md:text-4xl">{project.title}</h1>
              <p className="mt-2 text-sm text-zinc-400">
                por <a href={`/perfil/${project.authorId}`} className="text-violet-200 hover:underline">{project.authorName || "Usuário"}</a> • {formatDate(project.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-200">
              <Star className="h-4 w-4" />
              {likesCount}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
              <p className="text-sm text-zinc-400">Curtidas</p>
              <div className="mt-2 flex items-center gap-2 text-xl font-semibold">
                <ArrowBigUpDash className="h-5 w-5 text-violet-400" />
                {likesCount}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
              <p className="text-sm text-zinc-400">Comentários</p>
              <div className="mt-2 flex items-center gap-2 text-xl font-semibold">
                <MessageSquareText className="h-5 w-5 text-violet-400" />
                {comments.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
              <p className="text-sm text-zinc-400">Status</p>
              <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
                {project.status === "hidden" ? "Oculto" : "Estável"}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-5 text-base leading-8 text-zinc-300">
            <p>{project.summary}</p>
          </div>

          <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Dispositivo</p><p className="mt-1 font-mono text-sm text-cyan-200">{project.deviceCodename || "generic"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Android</p><p className="mt-1 text-sm text-zinc-200">{project.androidVersion || "Não informado"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Recovery</p><p className="mt-1 text-sm text-zinc-200">{project.recovery || "Não informado"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.16em] text-zinc-500">SELinux</p><p className="mt-1 text-sm text-zinc-200">{project.selinux || "Unknown"}</p></div>
          </div>

          {project.firmware && <p className="mt-4 text-sm text-zinc-400">Firmware mínimo: <span className="text-zinc-200">{project.firmware}</span></p>}

          {(project.downloadUrl || project.sourceUrl || project.xdaUrl || project.changelog) && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
              <p className="text-sm font-medium text-zinc-200">Recursos da build</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {project.downloadUrl && <a href={project.downloadUrl} target="_blank" rel="noreferrer" className="text-violet-200 hover:underline">Download</a>}
                {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noreferrer" className="text-violet-200 hover:underline">Código-fonte</a>}
                {project.xdaUrl && <a href={project.xdaUrl} target="_blank" rel="noreferrer" className="text-violet-200 hover:underline">Thread XDA</a>}
              </div>
              {project.changelog && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{project.changelog}</p>}
            </div>
          )}

          <button
            onClick={handleLike}
            disabled={liking}
            className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${liked ? "border-pink-400/50 bg-pink-400/15 text-pink-200" : "border-white/10 bg-white/5 text-zinc-200 hover:border-pink-400/40 hover:text-pink-200"}`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            {liking ? "Atualizando..." : liked ? "Curtido" : "Curtir projeto"}
          </button>
          <button
            onClick={handleThanks}
            disabled={thanking}
            className={`ml-2 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${thanked ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200" : "border-white/10 bg-white/5 text-zinc-200 hover:border-cyan-400/40 hover:text-cyan-200"}`}
          >
            <ThumbsUp className="h-4 w-4" />
            {thanking ? "Atualizando..." : `Agradecer (${thanksCount})`}
          </button>
        </div>
      </article>

      <section className="mt-10 rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Discussão</h2>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mb-5 rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Compartilhe sua dúvida ou feedback..."
            className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-zinc-100 outline-none focus:border-violet-500/70"
          />
          {replyTo && <p className="px-4 pt-2 text-xs text-cyan-200">Respondendo a um comentário <button onClick={() => setReplyTo(null)} className="ml-2 underline">cancelar</button></p>}
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSubmitComment}
              disabled={posting || !auth?.currentUser}
              className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {posting ? "Enviando..." : "Comentar"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 p-4 text-center text-zinc-300">
              Ainda não há comentários. Seja o primeiro a responder.
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={`rounded-2xl border border-white/10 bg-zinc-950/70 p-4 ${comment.parentId ? "ml-6 border-cyan-400/15" : ""}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-100">{comment.userName || comment.userId}</span>
                  {comment.isOP && (
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">
                      OP
                    </span>
                  )}
                </div>
                <p className="text-sm leading-7 text-zinc-300">{comment.text}</p>
                <button onClick={() => setReplyTo(comment.id)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-200 hover:text-cyan-100">
                  <Reply className="h-3.5 w-3.5" /> Responder
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
