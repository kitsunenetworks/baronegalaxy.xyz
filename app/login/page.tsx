"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Globe, LockKeyhole, Mail } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getFirebaseAuthErrorMessage, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const handleEmailLogin = async () => {
    if (!isFirebaseConfigured) {
      setError("Configure as chaves do Firebase no arquivo .env.local para ativar login.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!email.trim()) {
        setError("Digite seu email.");
        return;
      }

      if (!password) {
        setError("Digite sua senha.");
        return;
      }

      if (mode === "signup") {
        if (password.length < 6) {
          setError("A senha precisa ter pelo menos 6 caracteres.");
          return;
        }

        if (password !== passwordConfirmation) {
          setError("As senhas não conferem.");
          return;
        }

        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      setError("Configure as chaves do Firebase no arquivo .env.local para ativar login.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050816] px-4 py-10 text-zinc-50">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-zinc-900/80 p-6 shadow-[0_0_40px_rgba(139,92,246,0.18)] backdrop-blur-md">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-violet-400">BaroneGalaxy</p>
          <h1 className="mt-3 text-3xl font-semibold">Entrar na plataforma</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {mode === "signup" ? "Crie sua conta da comunidade" : "Acesse sua conta da comunidade"}
          </p>
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Firebase ainda não está configurado. Copie o arquivo .env.example para .env.local e preencha as chaves.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
              <Mail className="h-4 w-4 text-violet-300" />
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-zinc-100 outline-none focus:border-violet-500/70"
              placeholder="voce@baronegalaxy.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
              <LockKeyhole className="h-4 w-4 text-violet-300" />
              Senha
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-zinc-100 outline-none focus:border-violet-500/70"
              placeholder="••••••••"
            />
          </label>

          {mode === "signup" && (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
                <LockKeyhole className="h-4 w-4 text-violet-300" />
                Confirmar senha
              </span>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-zinc-100 outline-none focus:border-violet-500/70"
                placeholder="Repita sua senha"
              />
            </label>
          )}

          <button
            onClick={handleEmailLogin}
            disabled={loading || !isFirebaseConfigured}
            className="w-full rounded-full bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
          >
            {loading ? "Processando..." : mode === "signup" ? "Criar conta" : "Entrar com email"}
          </button>

          <button
            onClick={handleGoogleLogin}
            disabled={loading || !isFirebaseConfigured}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-violet-500/40 hover:text-violet-200 disabled:opacity-60"
          >
            <Globe className="h-4 w-4" />
            Continuar com Google
          </button>

          <button
            type="button"
            onClick={() => {
              setMode((currentMode) => (currentMode === "login" ? "signup" : "login"));
              setError("");
            }}
            className="w-full text-sm text-violet-200 transition hover:text-violet-100"
          >
            {mode === "signup" ? "Já tenho uma conta" : "Ainda não tenho conta"}
          </button>
        </div>
      </div>
    </main>
  );
}
