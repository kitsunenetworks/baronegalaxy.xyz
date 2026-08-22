"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  MessageSquareText,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { fetchProjects, type ProjectData } from "@/lib/projects";

type FeedProject = ProjectData & { id: string };

const categories = [
  { label: "Custom ROMs", value: "LineageOS, AOSP e builds" },
  { label: "Kernels", value: "Tweaks e performance" },
  { label: "Root & Recovery", value: "Magisk, KernelSU e TWRP" },
  { label: "Firmware", value: "Vendor e imagens oficiais" },
  { label: "Android", value: "Mods, dispositivos e personalização" },
  { label: "Labs", value: "Web, AI e software" },
];

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

export default function Home() {
  const [projects, setProjects] = useState<FeedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("Todos");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const result = await fetchProjects();
        setProjects(result as FeedProject[]);
      } catch (error) {
        setProjects([]);
        setLoadError(error instanceof Error ? error.message : "Não foi possível carregar o feed.");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const projectList = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      if (project.status === "hidden") return false;
      if (activeTag !== "Todos" &&
        !project.tags?.some((tag) => tag.toLowerCase() === activeTag.toLowerCase()) &&
        !project.category?.toLowerCase().includes(activeTag.toLowerCase())) return false;
      if (!normalizedSearch) return true;

      return [project.title, project.summary, project.authorName, ...(project.tags ?? [])]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });
  }, [activeTag, projects, search]);

  const visibleProjects = projects.filter((project) => project.status !== "hidden");
  const totalLikes = visibleProjects.reduce((sum, project) => sum + (project.likesCount ?? 0), 0);
  const totalThanks = visibleProjects.reduce((sum, project) => sum + (project.thanksCount ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#050816] text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0c1222]/90 px-4 py-3 shadow-[0_0_40px_rgba(139,92,246,0.18)] backdrop-blur-sm md:rounded-full">
          <div className="flex items-center gap-3">
            <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-sm font-semibold text-violet-200">
              <span>BG</span>
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">BaroneGalaxy</p>
              <p className="hidden text-[10px] uppercase tracking-[0.22em] text-cyan-300/70 sm:block">Android independent lab</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-sm">
            <a href="/login?mode=signup" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 transition hover:border-violet-400/40 hover:text-white">
              Criar conta
            </a>
            <a href="/login" className="rounded-full bg-violet-500 px-3.5 py-1.5 font-medium text-white transition hover:bg-violet-400">
              Entrar
            </a>
          </nav>
        </header>

        <section className="relative mb-10 overflow-hidden rounded-[32px] border border-violet-500/20 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_30%),radial-gradient(circle_at_top_left,_rgba(168,85,247,0.2),_transparent_35%),linear-gradient(135deg,#0b1020,#111827_45%,#09090f)] p-6 shadow-[0_0_50px_rgba(124,58,237,0.15)] md:p-10">
          <div className="pointer-events-none absolute right-8 top-8 hidden h-32 w-32 rounded-full border border-cyan-300/20 md:block" />
          <div className="pointer-events-none absolute right-16 top-16 hidden h-16 w-16 rounded-full border border-violet-300/20 md:block" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="hero-kicker mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-200">
                <Sparkles className="h-3.5 w-3.5" />
                BaroneGalaxy community
              </div>
              <h1 className="hero-title max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
                O laboratório da próxima ideia<span className="text-cyan-300">.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-zinc-300 md:text-lg">
                Custom ROMs, kernels, recoveries e software independente para quem prefere construir o próximo passo.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="/dashboard/new" className="rounded-full bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400">
                Publicar projeto
              </a>
              <a href="#feed" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-violet-500/40 hover:text-violet-200">
                Explorar
              </a>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Projetos publicados", value: loading ? "—" : String(visibleProjects.length) },
              { label: "Curtidas na comunidade", value: loading ? "—" : String(totalLikes) },
              { label: "Agradecimentos", value: loading ? "—" : String(totalThanks) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 backdrop-blur-sm">
                <p className="text-sm text-zinc-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <button
              key={category.label}
              onClick={() => {
                setSearch("");
                setActiveTag(category.label === "Custom ROMs" || category.label === "Android" ? "Android" : category.label);
                document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="category-tile group text-left"
            >
              <span className="text-sm font-semibold text-zinc-100 transition group-hover:text-cyan-200">{category.label}</span>
              <span className="mt-1 block text-xs text-zinc-500">{category.value}</span>
              <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-zinc-600 transition group-hover:text-cyan-300" />
            </button>
          ))}
        </section>

        <section id="feed" className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-4 md:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-400">Feed principal</p>
              <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Projetos em destaque</h2>
            </div>

            <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-zinc-300">
              <Search className="h-4 w-4 text-violet-300" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por categoria ou termo"
                className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2 text-xs">
            {['Todos', 'Android', 'IOS', 'Web', 'Firmware', 'UI/UX', 'AI'].map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`rounded-full border px-3 py-1.5 transition ${
                  activeTag === tag ? 'border-violet-500 bg-violet-500/12 text-violet-200' : 'border-white/10 bg-white/5 text-zinc-300 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8 text-center text-zinc-300">
                Carregando projetos do Firebase...
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center text-amber-100">
                <p className="font-medium">Feed indisponível no momento.</p>
                <p className="mt-2 text-sm text-amber-200/80">Configure o Firestore e publique as regras do projeto.</p>
              </div>
            ) : projectList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 p-8 text-center text-zinc-300">
                {search || activeTag !== "Todos" ? "Nenhum projeto corresponde a este filtro." : "O feed está pronto para a primeira build. Publique um projeto e abra a conversa."}
                {!search && activeTag === "Todos" && <a href="/dashboard/new" className="mt-4 inline-flex rounded-full border border-violet-400/30 px-4 py-2 text-sm text-violet-200 transition hover:bg-violet-500/10">Publicar primeira build</a>}
              </div>
            ) : (
              projectList.map((project) => (
                <article key={project.id} className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] transition hover:border-violet-500/30 hover:bg-white/[0.04]">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-violet-500/40 via-fuchsia-500/20 to-transparent md:w-72">
                      {project.coverImage ? (
                        <img src={project.coverImage} alt={project.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.25),_transparent_30%)]" />
                      )}
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur">
                        <TrendingUp className="h-3.5 w-3.5 text-violet-300" />
                        Trending
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {project.category && <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200">{project.category}</span>}
                          {project.buildStatus && <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200">{project.buildStatus}</span>}
                          {(project.tags || []).map((tag: string) => (
                            <span key={tag} className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-violet-200">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <h3 className="text-xl font-semibold text-white md:text-2xl">{project.title}</h3>
                        <p className="mt-2 font-mono text-xs text-cyan-200/80">{project.deviceCodename || "generic"}{project.androidVersion ? ` • ${project.androidVersion}` : ""}</p>
                        <div className="mt-3 flex items-center gap-3 text-sm text-zinc-400">
                          <a href={`/perfil/${project.authorId}`} className="transition hover:text-violet-200">
                            {project.authorName || "Usuário"}
                          </a>
                          <span>•</span>
                          <span>{formatDate(project.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-4 text-sm text-zinc-300">
                          <span className="inline-flex items-center gap-1.5">
                            <MessageSquareText className="h-4 w-4 text-violet-300" />
                            {project.commentsCount || 0}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-violet-300" />
                            {project.likesCount || 0}
                          </span>
                        </div>

                        <a href={`/projeto/${project.id}`} className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-violet-400">
                          Ver projeto
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
