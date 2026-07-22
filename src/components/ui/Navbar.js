"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import NotificationDropdown from "@/components/ui/NotificationDropdown";

export default function Navbar({ activePage = "inicio", session, perfil, onLogout }) {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const getProfileLink = () => {
    if (perfil?.rol === "dueno" || perfil?.rol === "admin") return "/dashboard";
    return "/perfil";
  };

  const getProfileLabel = () => {
    return perfil?.nombre_completo || perfil?.email?.split("@")[0] || (lang === "en" ? "My Profile" : "Mi Perfil");
  };

  return (
    <nav className="atlan-navbar-header">
      <div style={{
        width: "100%",
        padding: "0 32px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative"
      }}>
        {/* Logo Far Left */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <img
            src="/mapaicono.png"
            alt="Logo"
            style={{ width: "30px", height: "30px", objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
          />
          <span className="logoText" style={{ fontSize: "25px", fontWeight: "900", color: "#FFD700" }}>atlan</span>
        </Link>

        {/* Center Nav Pills */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }} className="hide-mobile">
          <Link href="/" className={`nav-pill-link ${activePage === "inicio" ? "active" : ""}`}>
            🏠 {lang === "en" ? "Home" : "Inicio"}
          </Link>
          <Link href="/mapa" className={`nav-pill-link ${activePage === "mapa" ? "active" : ""}`}>
            🗺️ {t("nav.map")}
          </Link>
          <Link href="/comunidad" className={`nav-pill-link ${activePage === "comunidad" ? "active" : ""}`}>
            👥 {t("social.community")}
          </Link>
          {session && (
            <Link href="/chat" className={`nav-pill-link ${activePage === "chat" ? "active" : ""}`}>
              💬 {t("chat.title")}
            </Link>
          )}
          {perfil?.rol === "admin" && (
            <Link href="/admin" className={`nav-pill-link ${activePage === "admin" ? "active" : ""}`}>
              🛡️ {lang === "en" ? "Management" : "Gestión"}
            </Link>
          )}
          <LanguageToggle variant="pill" />
          {session && <NotificationDropdown session={session} />}
        </div>

        {/* Far Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="hide-mobile">
          {session ? (
            <>
              <Link href={getProfileLink()} className={`nav-pill-link ${activePage === "perfil" || activePage === "dashboard" ? "active" : ""}`}>
                {perfil?.avatar_url ? (
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: `url(${perfil.avatar_url}) center/cover`, border: "1px solid rgba(20, 109, 158, 0.15)", flexShrink: 0 }} />
                ) : (
                  perfil?.rol === "dueno" || perfil?.rol === "admin" ? "💼" : "👤"
                )}
                <span>{getProfileLabel()}</span>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#ef4444",
                  borderRadius: "var(--atlan-radius-full)",
                  fontSize: "13px",
                  fontWeight: "750",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                title={t("nav.logout") || "Cerrar Sesión"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>{t("nav.logout") || "Cerrar Sesión"}</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-pill-link">{t("nav.login")}</Link>
              <Link href="/registro" className="btn-primary" style={{ padding: "8px 20px", fontSize: "13px" }}>{t("nav.register")}</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="hide-desktop" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {session && <NotificationDropdown session={session} />}
          <LanguageToggle variant="icon" />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            style={{ background: "none", border: "none", color: "var(--atlan-text-primary)", cursor: "pointer", padding: "8px" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div style={{ padding: "12px 24px 20px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid rgba(20,109,158,0.08)" }} className="animate-fade-in-down hide-desktop">
          <Link href="/" className={`nav-pill-link ${activePage === "inicio" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>🏠 {lang === "en" ? "Home" : "Inicio"}</Link>
          <Link href="/mapa" className={`nav-pill-link ${activePage === "mapa" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>🗺️ {t("nav.map")}</Link>
          <Link href="/comunidad" className={`nav-pill-link ${activePage === "comunidad" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>👥 {t("social.community")}</Link>
          {session && <Link href="/chat" className={`nav-pill-link ${activePage === "chat" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>💬 {t("chat.title")}</Link>}
          {perfil?.rol === "admin" && (
            <Link href="/admin" className={`nav-pill-link ${activePage === "admin" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
              🛡️ {lang === "en" ? "Management" : "Gestión"}
            </Link>
          )}
          {session ? (
            <>
              <Link href={getProfileLink()} className={`nav-pill-link ${activePage === "perfil" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>👤 {getProfileLabel()}</Link>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "10px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", width: "100%", textAlign: "left" }}>
                🚪 {t("nav.logout") || "Cerrar Sesión"}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-pill-link" onClick={() => setMenuOpen(false)}>{t("nav.login")}</Link>
              <Link href="/registro" className="btn-primary" style={{ width: "100%", textAlign: "center", padding: "10px" }} onClick={() => setMenuOpen(false)}>{t("nav.register")}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
