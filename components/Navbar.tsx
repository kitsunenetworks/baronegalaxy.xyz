"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, UserCircle2 } from "lucide-react";
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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setProfile(currentUser ? await getUserProfile(currentUser.uid) : null);
    });
  }, []);

  useEffect(() => {
    const closeProfileMenu = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeProfileMenu);
    return () => document.removeEventListener("mousedown", closeProfileMenu);
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
          {user && <Link href="/dashboard/perfil">Meu perfil</Link>}
        </nav>

        <div className="site-nav__actions">
          {user ? (
            <>
              <div ref={profileMenuRef} className="site-profile-menu">
                <button onClick={() => setProfileOpen((open) => !open)} className="site-account" aria-expanded={profileOpen} aria-label="Abrir informações do perfil">
                  <span className="site-account__avatar"><UserCircle2 /></span>
                  <span className="site-account__copy">
                    <strong>@{profile?.username || "usuario"}</strong>
                    <small>{roleLabel(profile?.role)}</small>
                  </span>
                </button>
                {profileOpen && (
                  <div className="site-profile-popover">
                    <div className="site-profile-popover__heading">
                      <span className="site-account__avatar"><UserCircle2 /></span>
                      <div><strong>{profile?.displayName || "Usuário"}</strong><small>@{profile?.username || "usuario"}</small></div>
                    </div>
                    <div className="site-profile-popover__details">
                      <span><b>Cargo</b>{roleLabel(profile?.role)}</span>
                      <span><b>Email</b>{user.email || "Conta Google"}</span>
                    </div>
                    <Link href={`/perfil/${user.uid}`} onClick={() => setProfileOpen(false)} className="site-profile-popover__link">Ver perfil público</Link>
                    <Link href="/dashboard/perfil" onClick={() => setProfileOpen(false)} className="site-profile-popover__link">Gerenciar perfil</Link>
                  </div>
                )}
              </div>
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
