"use client";

import { useEffect, useState } from "react";
import { LogOut, Plus, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { getUserProfile, logOut, type AppUserProfile } from "@/lib/auth";

function roleLabel(role?: AppUserProfile["role"]) {
  return role === "owner" ? "Owner" : "Membro";
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setProfile(currentUser ? await getUserProfile(currentUser.uid) : null);
    });
  }, []);

  const handleLogout = async () => {
    await logOut();
    router.push("/");
  };

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <Link href="/" className="site-brand">
          <span className="site-brand__mark">BG</span>
          <span>
            <strong>BaroneGalaxy</strong>
            <small>Android independent lab</small>
          </span>
        </Link>

        <nav className="site-nav__links" aria-label="Navegação principal">
          <Link href="/#feed">Explorar</Link>
          {user && <Link href="/dashboard#postagens">Postagens</Link>}
          {user && <Link href="/dashboard#perfil">Meu perfil</Link>}
        </nav>

        <div className="site-nav__actions">
          {user ? (
            <>
              <Link href={`/perfil/${user.uid}`} className="site-account">
                <span className="site-account__avatar"><UserCircle2 /></span>
                <span className="site-account__copy">
                  <strong>@{profile?.username || "usuario"}</strong>
                  <small>{roleLabel(profile?.role)}</small>
                </span>
              </Link>
              <Link href="/dashboard/new" className="site-nav__publish" title="Criar nova postagem">
                <Plus /> <span>Postar</span>
              </Link>
              <button onClick={handleLogout} className="site-nav__logout" title="Sair">
                <LogOut />
              </button>
            </>
          ) : (
            <>
              <Link href="/registro" className="site-nav__register">Criar conta</Link>
              <Link href="/login" className="site-nav__login">Entrar</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
