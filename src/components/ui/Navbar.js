"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import Icon from "@/components/ui/Icon";

import { getProfileSlug } from "@/lib/profileUtils";

export default function Navbar({ activePage = "inicio", session: sessionProp, perfil: perfilProp, onLogout }) {
  // Obtener sesión del contexto global (fuente de verdad)
  // Props se mantienen como fallback para compatibilidad
  const auth = useAuth();
  const session = sessionProp || auth.session;
  const perfil = perfilProp || auth.perfil;
  const { t, lang } = useTranslation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [hasBusinesses, setHasBusinesses] = useState(false);
  const dropdownRef = useRef(null);

  // Comprobar si el usuario posee 1 o más negocios
  useEffect(() => {
    async function checkBusinesses() {
      if (!session?.user?.id) {
        setHasBusinesses(false);
        return;
      }
      if (perfil?.rol === "dueno" || perfil?.rol === "admin") {
        setHasBusinesses(true);
        return;
      }
      try {
        const { count, error } = await supabase
          .from("negocios")
          .select("id", { count: "exact", head: true })
          .eq("dueno_id", session.user.id);

        if (!error && count && count > 0) {
          setHasBusinesses(true);
        } else {
          setHasBusinesses(false);
        }
      } catch (err) {
        console.error("Error checking businesses:", err);
      }
    }
    checkBusinesses();
  }, [session?.user?.id, perfil?.rol]);

  // Cerrar desplegable al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    // Usar logout centralizado del AuthContext
    await auth.logout();
    router.push("/login");
  };

  const getProfileLabel = () => {
    if (perfil?.nombre_completo && perfil.nombre_completo.trim()) {
      return perfil.nombre_completo.trim();
    }
    if (perfil?.nombre && perfil.nombre.trim()) {
      return perfil.nombre.trim();
    }
    if (perfil?.full_name && perfil.full_name.trim()) {
      return perfil.full_name.trim();
    }
    if (session?.user?.user_metadata?.nombre_completo && session.user.user_metadata.nombre_completo.trim()) {
      return session.user.user_metadata.nombre_completo.trim();
    }
    if (session?.user?.user_metadata?.full_name && session.user.user_metadata.full_name.trim()) {
      return session.user.user_metadata.full_name.trim();
    }
    if (session?.user?.user_metadata?.name && session.user.user_metadata.name.trim()) {
      return session.user.user_metadata.name.trim();
    }
    if (perfil?.email || session?.user?.email) {
      const email = perfil?.email || session?.user?.email;
      return email.split("@")[0];
    }
    return lang === "en" ? "Profile" : "Perfil";
  };

  const communityProfileLink = perfil ? `/comunidad/perfil/${getProfileSlug(perfil)}` : (session?.user?.id ? `/comunidad/perfil/${session.user.id}` : "/comunidad");

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
            <Icon name="home" size={16} /> {lang === "en" ? "Home" : "Inicio"}
          </Link>
          <Link href="/mapa" className={`nav-pill-link ${activePage === "mapa" ? "active" : ""}`}>
            <Icon name="map" size={16} /> {t("nav.map")}
          </Link>
          <Link href="/departamentos" className={`nav-pill-link ${activePage === "departamentos" ? "active" : ""}`}>
            <Icon name="star" size={16} /> {lang === "en" ? "Ranking" : "Ranking"}
          </Link>
          <Link href="/mas-de-nicaragua" className={`nav-pill-link ${activePage === "mas-de-nicaragua" ? "active" : ""}`}>
            <Icon name="book" size={16} /> {t("nav.moreNicaragua") || (lang === "en" ? "More of Nicaragua" : "Más de Nicaragua")}
          </Link>
          <Link href="/comunidad" className={`nav-pill-link ${activePage === "comunidad" ? "active" : ""}`}>
            <Icon name="users" size={16} /> {t("social.community")}
          </Link>
          {session && (
            <Link href="/chat" className={`nav-pill-link ${activePage === "chat" ? "active" : ""}`}>
              <Icon name="messageCircle" size={16} /> {t("chat.title")}
            </Link>
          )}
          {perfil?.rol === "admin" && (
            <Link href="/admin" className={`nav-pill-link ${activePage === "admin" ? "active" : ""}`}>
              <Icon name="shield" size={16} /> {lang === "en" ? "Management" : "Gestión"}
            </Link>
          )}
          <LanguageToggle variant="pill" />
          {session && <NotificationDropdown session={session} />}
        </div>

        {/* Far Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="hide-mobile">
          {session ? (
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* Nombre de usuario -> Redirige al Perfil de la Comunidad */}
                <Link
                  href={communityProfileLink}
                  className={`nav-pill-link ${activePage === "perfil-comunidad" ? "active" : ""}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#FFFFFF",
                    color: "#1A1A2E",
                    fontWeight: "750",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    padding: "7px 14px",
                    borderRadius: "20px"
                  }}
                >
                  {perfil?.avatar_url ? (
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: `url(${perfil.avatar_url}) center/cover`, border: "1px solid rgba(20, 109, 158, 0.15)", flexShrink: 0 }} />
                  ) : (
                    <Icon name="user" size={18} />
                  )}
                  <span>{getProfileLabel()}</span>
                </Link>

                {/* Flecha desplegable del Menú */}
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    color: "#1A1A2E",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
                  }}
                  title={lang === "en" ? "User Options" : "Opciones de Usuario"}
                >
                  <Icon name="chevronDown" size={14} />
                </button>
              </div>

              {/* Menú Desplegable de Usuario */}
              {userDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "#FFFFFF",
                    border: "2px solid rgba(255, 255, 255, 0.95)",
                    boxShadow: "inset 2px 2px 4px rgba(255, 255, 255, 1), inset -3px -3px 6px rgba(20, 109, 158, 0.06), 0 14px 35px rgba(0, 0, 0, 0.15)",
                    borderRadius: "18px",
                    padding: "8px",
                    minWidth: "210px",
                    zIndex: 100,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                  className="animate-fade-in-down"
                >
                  {/* Opción 1: Mi Perfil (Comunidad) */}
                  <Link
                    href={communityProfileLink}
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      color: "#1A1A2E",
                      fontSize: "13px",
                      fontWeight: "750",
                      textDecoration: "none",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(20, 109, 158, 0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Icon name="user" size={16} /> {lang === "en" ? "My Profile" : "Mi Perfil"}
                  </Link>

                  {/* Opción 2: Mis Negocios (Solo si posee 1 o más negocios) */}
                  {hasBusinesses && (
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        color: "#1A1A2E",
                        fontSize: "13px",
                        fontWeight: "750",
                        textDecoration: "none",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(20, 109, 158, 0.06)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <Icon name="briefcase" size={16} /> {lang === "en" ? "My Businesses" : "Mis Negocios"}
                    </Link>
                  )}

                  {/* Opción 3: Mis Giras (Favoritos, Giras y Reservas guardadas) */}
                  <Link
                    href="/perfil"
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      color: "#1A1A2E",
                      fontSize: "13px",
                      fontWeight: "750",
                      textDecoration: "none",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(20, 109, 158, 0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Icon name="compass" size={16} /> {lang === "en" ? "My Tours & Saved" : "Mis Giras"}
                  </Link>

                  <div style={{ height: "1px", background: "rgba(20, 109, 158, 0.08)", margin: "4px 0" }} />

                  {/* Opción 4: Cerrar Sesión */}
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      color: "#ef4444",
                      background: "none",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: "750",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Icon name="logOut" size={16} /> {t("nav.logout") || "Cerrar Sesión"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="nav-pill-link">{t("nav.login")}</Link>
              <Link href="/registro" className="btn-primary" style={{ padding: "8px 20px", fontSize: "13px" }}>{t("nav.register")}</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="hide-desktop" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {session && <NotificationDropdown session={session} />}
          <LanguageToggle variant="icon" />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            style={{
              background: menuOpen ? "rgba(255, 215, 0, 0.2)" : "rgba(255, 255, 255, 0.08)",
              border: "1.5px solid rgba(255, 215, 0, 0.4)",
              borderRadius: "12px",
              color: "#FFD700",
              cursor: "pointer",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
              transition: "all 0.2s ease"
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round">
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
        <div
          style={{
            padding: "16px 20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: "#0A192F",
            borderTop: "1.5px solid rgba(255, 215, 0, 0.25)",
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.6)"
          }}
          className="animate-fade-in-down hide-desktop"
        >
          <Link href="/" className={`nav-pill-link ${activePage === "inicio" ? "active" : ""}`} onClick={() => setMenuOpen(false)}><Icon name="home" size={16} /> {lang === "en" ? "Home" : "Inicio"}</Link>
          <Link href="/mapa" className={`nav-pill-link ${activePage === "mapa" ? "active" : ""}`} onClick={() => setMenuOpen(false)}><Icon name="map" size={16} /> {t("nav.map")}</Link>
          <Link href="/departamentos" className={`nav-pill-link ${activePage === "departamentos" ? "active" : ""}`} onClick={() => setMenuOpen(false)}><Icon name="star" size={16} /> {lang === "en" ? "Ranking" : "Ranking"}</Link>
          <Link href="/mas-de-nicaragua" className={`nav-pill-link ${activePage === "mas-de-nicaragua" ? "active" : ""}`} onClick={() => setMenuOpen(false)}><Icon name="book" size={16} /> {t("nav.moreNicaragua") || (lang === "en" ? "More of Nicaragua" : "Más de Nicaragua")}</Link>
          <Link href="/comunidad" className={`nav-pill-link ${activePage === "comunidad" ? "active" : ""}`} onClick={() => setMenuOpen(false)}><Icon name="users" size={16} /> {t("social.community")}</Link>
          {session && <Link href="/chat" className={`nav-pill-link ${activePage === "chat" ? "active" : ""}`} onClick={() => setMenuOpen(false)}><Icon name="messageCircle" size={16} /> {t("chat.title")}</Link>}
          {perfil?.rol === "admin" && (
            <Link href="/admin" className={`nav-pill-link ${activePage === "admin" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
              <Icon name="shield" size={16} /> {lang === "en" ? "Management" : "Gestión"}
            </Link>
          )}
          {session ? (
            <>
              <Link href={communityProfileLink} className="nav-pill-link" onClick={() => setMenuOpen(false)}><Icon name="user" size={16} /> {lang === "en" ? "My Profile" : "Mi Perfil"}</Link>
              <Link href="/perfil" className="nav-pill-link" onClick={() => setMenuOpen(false)}><Icon name="compass" size={16} /> {lang === "en" ? "My Tours & Saved" : "Mis Giras"}</Link>
              {(perfil?.rol === "dueno" || perfil?.rol === "admin") && (
                <Link href="/dashboard" className="nav-pill-link" onClick={() => setMenuOpen(false)}><Icon name="briefcase" size={16} /> {lang === "en" ? "My Business" : "Mi Negocio"}</Link>
              )}
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "10px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", width: "100%", textAlign: "left" }}>
                <Icon name="logOut" size={16} /> {t("nav.logout") || "Cerrar Sesión"}
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
