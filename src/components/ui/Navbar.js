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
import InstallAppModal from "@/components/InstallAppModal";
import CombinedAuthButton from "@/components/ui/CombinedAuthButton";

import { getProfileSlug, resolveUserDisplayName, resolveUserAvatar } from "@/lib/profileUtils";

export default function Navbar({ activePage = "inicio", session: sessionProp, perfil: perfilProp, onLogout }) {
  // Obtener sesión del contexto global (fuente de verdad)
  // Props se mantienen como fallback para compatibilidad
  const auth = useAuth();
  const session = sessionProp || auth.session;
  const perfil = perfilProp || auth.perfil;
  const { t, tr, lang, setLang } = useTranslation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [hasBusinesses, setHasBusinesses] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const dropdownRef = useRef(null);
  const hideTimerRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const touchStartYRef = useRef(0);

  const handleInstallClick = () => {
    setUserDropdownOpen(false);
    setMenuOpen(false);

    if (typeof window !== "undefined" && window.__pwaInstallPrompt) {
      try {
        window.__pwaInstallPrompt.prompt().then(() => {
          window.__pwaInstallPrompt.userChoice.then((result) => {
            if (result.outcome === "accepted") {
              window.__pwaInstallPrompt = null;
              window.__pwaIsInstalled = true;
            } else {
              setShowInstallModal(true);
            }
          });
        }).catch(() => {
          setShowInstallModal(true);
        });
        return;
      } catch (e) {
        setShowInstallModal(true);
        return;
      }
    }

    setShowInstallModal(true);
  };

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

  // Bloquear el scroll de la página de fondo cuando el menú móvil está abierto
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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
    const resolved = resolveUserDisplayName(perfil, session?.user);
    if (resolved && resolved !== "Usuario" && resolved !== "Usuario Atlan") {
      return resolved;
    }
    return tr("Perfil", "Profile", "个人中心");
  };

  const navAvatarUrl = resolveUserAvatar(perfil, session?.user);
  const communityProfileUrl = perfil || session?.user ? `/comunidad/perfil/${getProfileSlug(perfil, session?.user)}` : "/comunidad";

  return (
    <>
      <nav className="atlan-navbar-header">
      <div className="atlan-navbar-inner" style={{
        width: "100%",
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px"
      }}>
        {/* Logo / Home */}
        <Link
          href="/"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.__atlanNavigatedInternally = true;
            }
          }}
          style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none", flexShrink: 0 }}
        >
          <img
            src="/mapaicono.png"
            alt="Atlan Logo"
            style={{ width: "32px", height: "32px", objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))" }}
          />
          <span className="logoText" style={{ fontSize: "25px", fontWeight: "900", color: "#F59E0B" }}>atlan</span>
        </Link>

        {/* Center Nav Pills */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap", justifyContent: "center", minWidth: 0 }} className="hide-mobile">
          <Link
            href="/"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.__atlanNavigatedInternally = true;
              }
            }}
            className={`nav-pill-link ${activePage === "inicio" ? "active" : ""}`}
          >
            <img src="/images/home.svg" alt="Inicio" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> {tr("Inicio", "Home", "首页")}
          </Link>
          <Link href="/mapa" className={`nav-pill-link ${activePage === "mapa" ? "active" : ""}`}>
            <img src="/images/ubic.svg" alt="Mapa" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> {tr("Explorar Mapa", "Explore Map", "探索地图")}
          </Link>
          <Link href="/lugares" className={`nav-pill-link ${activePage === "lugares" ? "active" : ""}`}>
            <img src="/images/Ubicacion.svg" alt="Lugares" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> {tr("Lugares", "Places", "景点地点")}
          </Link>
          <Link href="/mas-de-nicaragua" className={`nav-pill-link ${activePage === "mas-de-nicaragua" ? "active" : ""}`}>
            <img src="/images/Nicaragua croquis.svg" alt="Nicaragua" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> {tr("Más de Nicaragua", "More of Nicaragua", "探索尼加拉瓜")}
          </Link>
          <Link href="/departamentos" className={`nav-pill-link ${activePage === "departamentos" ? "active" : ""}`}>
            <img src="/images/flor.svg" alt="Ranking" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0)" }} /> {tr("Ranking", "Ranking", "排行榜")}
          </Link>
          <Link href="/comunidad" className={`nav-pill-link ${activePage === "comunidad" ? "active" : ""}`}>
            <img src="/images/comunidad.svg" alt="Comunidad" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> {tr("Comunidad", "Community", "社区")}
          </Link>
          <Link href="/guias" className={`nav-pill-link ${activePage === "guias" ? "active" : ""}`}>
            <Icon name="compass" size={16} color={activePage === "guias" ? "#38BDF8" : "currentColor"} /> {tr("Guías", "Guides", "导游")}
          </Link>
          {session && (
            <Link href="/chat" className={`nav-pill-link ${activePage === "chat" ? "active" : ""}`}>
              <img src="/images/comentarios.svg" alt="Mensajes" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> {tr("Mensajes", "Messages", "消息")}
            </Link>
          )}

        </div>

        {/* Far Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }} className="hide-mobile">
          {session && <NotificationDropdown session={session} />}
          {session ? (
            <div ref={dropdownRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              {/* Botón Avatar con Flecha Integrada (Estilo Imagen de Referencia) */}
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label={getProfileLabel()}
                title={getProfileLabel()}
                style={{
                  background: userDropdownOpen ? "rgba(255, 255, 255, 0.15)" : "transparent",
                  border: "none",
                  padding: "2px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  transition: "transform 0.18s ease, background 0.18s ease",
                  transform: userDropdownOpen ? "scale(0.96)" : "scale(1)"
                }}
              >
                {/* Avatar Circular */}
                <div style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: navAvatarUrl
                    ? `url("${navAvatarUrl}") center/cover no-repeat`
                    : "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
                  border: "2px solid rgba(255, 255, 255, 0.35)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: "750",
                  flexShrink: 0
                }}>
                  {!navAvatarUrl && (getProfileLabel()?.[0]?.toUpperCase() || "U")}
                </div>

                {/* Flecha Integrada en la esquina inferior derecha */}
                <div style={{
                  position: "absolute",
                  bottom: "-1px",
                  right: "-1px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "#1E293B",
                  border: "1.5px solid #0B192C",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  transition: "transform 0.2s ease",
                  transform: userDropdownOpen ? "rotate(180deg)" : "rotate(0deg)"
                }}>
                  <Icon name="chevronDown" size={10} color="#FFFFFF" strokeWidth={2.5} />
                </div>
              </button>

              {/* Menú Desplegable de Usuario (Estilo Oscuro / Imagen de Referencia) */}
              {userDropdownOpen && (
                <div
                  className="user-dropdown-panel animate-fade-in-down"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    left: "auto"
                  }}
                >
                  {/* Tarjeta de Cabecera con Nombre y Avatar (Dentro del Menú) */}
                  <Link
                    href={communityProfileUrl}
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.10)",
                      textDecoration: "none",
                      transition: "all 0.18s ease",
                      marginBottom: "4px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.10)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.20)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.10)";
                    }}
                  >
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: navAvatarUrl
                        ? `url("${navAvatarUrl}") center/cover no-repeat`
                        : "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
                      border: "1.5px solid rgba(255, 255, 255, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                      fontSize: "16px",
                      fontWeight: "750",
                      flexShrink: 0
                    }}>
                      {!navAvatarUrl && (getProfileLabel()?.[0]?.toUpperCase() || "U")}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: "14.5px",
                        fontWeight: "800",
                        color: "#FFFFFF",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        letterSpacing: "0.1px"
                      }}>
                        {getProfileLabel()}
                      </div>
                      <div style={{
                        fontSize: "11.5px",
                        fontWeight: "500",
                        color: "#94A3B8",
                        marginTop: "1px"
                      }}>
                        {perfil?.rol === "admin"
                          ? (lang === "en" ? "Administrator" : lang === "zh" ? "管理员" : "Administrador")
                          : perfil?.rol === "guia_turistico"
                          ? (lang === "en" ? "Tour Guide" : lang === "zh" ? "专业导游" : "Guía Turístico")
                          : perfil?.rol === "dueno"
                          ? (lang === "en" ? "Business Owner" : lang === "zh" ? "商户" : "Comercio")
                          : (lang === "en" ? "View Profile" : lang === "zh" ? "查看主页" : "Ver Perfil")}
                      </div>
                    </div>
                    <Icon name="chevronRight" size={16} color="#94A3B8" />
                  </Link>

                  <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px" }} />

                  {/* Opción Admin: Gestión */}
                  {perfil?.rol === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        borderRadius: "12px",
                        color: "#F1F5F9",
                        textDecoration: "none",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "rgba(167, 139, 250, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <Icon name="shield" size={16} color="#C4B5FD" />
                        </div>
                        <span style={{ fontSize: "13.5px", fontWeight: "600" }}>
                          {lang === "en" ? "Management" : lang === "zh" ? "管理控制台" : "Gestión"}
                        </span>
                      </div>
                      <Icon name="chevronRight" size={14} color="#64748B" />
                    </Link>
                  )}

                  {/* Opción 1: Mi Perfil Comunidad */}
                  <Link
                    href={communityProfileUrl}
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 12px",
                      borderRadius: "12px",
                      color: "#F1F5F9",
                      textDecoration: "none",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(52, 211, 153, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <Icon name="users" size={16} color="#6EE7B7" />
                      </div>
                      <span style={{ fontSize: "13.5px", fontWeight: "600" }}>
                        {lang === "en" ? "My Community Profile" : lang === "zh" ? "我的社区资料" : "Mi Perfil Comunidad"}
                      </span>
                    </div>
                    <Icon name="chevronRight" size={14} color="#64748B" />
                  </Link>

                  {/* Opción 2: Mi Perfil Personal */}
                  <Link
                    href="/perfil"
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 12px",
                      borderRadius: "12px",
                      color: "#F1F5F9",
                      textDecoration: "none",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(56, 189, 248, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <Icon name="user" size={16} color="#7DD3FC" />
                      </div>
                      <span style={{ fontSize: "13.5px", fontWeight: "600" }}>
                        {lang === "en" ? "My Personal Profile" : lang === "zh" ? "我的个人资料" : "Mi Perfil Personal"}
                      </span>
                    </div>
                    <Icon name="chevronRight" size={14} color="#64748B" />
                  </Link>

                  {/* Opción Guía: Mi Perfil de Guía (Solo si es guía turístico) */}
                  {perfil?.rol === "guia_turistico" && (
                    <Link
                      href="/perfil-guia"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        borderRadius: "12px",
                        color: "#F1F5F9",
                        textDecoration: "none",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "rgba(251, 191, 36, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <Icon name="compass" size={16} color="#FDE68A" />
                        </div>
                        <span style={{ fontSize: "13.5px", fontWeight: "600" }}>
                          {lang === "en" ? "My Guide Profile Section" : lang === "zh" ? "我的导游资料" : "Mi Perfil de Guía Turístico"}
                        </span>
                      </div>
                      <Icon name="chevronRight" size={14} color="#64748B" />
                    </Link>
                  )}

                  {/* Opción 3: Mis Negocios (Solo si posee 1 o más negocios) */}
                  {hasBusinesses && (
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        borderRadius: "12px",
                        color: "#F1F5F9",
                        textDecoration: "none",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "rgba(251, 146, 60, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <Icon name="briefcase" size={16} color="#FDBA74" />
                        </div>
                        <span style={{ fontSize: "13.5px", fontWeight: "600" }}>
                          {lang === "en" ? "My Businesses" : lang === "zh" ? "我的店铺" : "Mis Negocios"}
                        </span>
                      </div>
                      <Icon name="chevronRight" size={14} color="#64748B" />
                    </Link>
                  )}

                  <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px" }} />

                  {/* Opción: Descargar App */}
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "12px",
                      background: "transparent",
                      border: "none",
                      color: "#F1F5F9",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(212, 175, 55, 0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <Icon name="download" size={16} color="#FFD700" />
                      </div>
                      <span style={{ fontSize: "13.5px", fontWeight: "600" }}>
                        {tr("Descargar App", "Download App", "下载应用")}
                      </span>
                    </div>
                    <Icon name="chevronRight" size={14} color="#64748B" />
                  </button>

                  {/* Opción 4: Traducir Página */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextLang = lang === "es" ? "en" : lang === "en" ? "zh" : "es";
                      setLang(nextLang);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "12px",
                      background: "transparent",
                      border: "none",
                      color: "#F1F5F9",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(99, 102, 241, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <img
                          src="/images/remolino.svg"
                          alt="Idioma"
                          style={{
                            width: "16px",
                            height: "16px",
                            objectFit: "contain",
                            filter: "brightness(0) invert(1)"
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "13.5px", fontWeight: "600" }}>
                        {lang === "es" ? "Traducir Página" : lang === "en" ? "Translate Page" : "翻译页面"}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: lang === "zh"
                        ? "linear-gradient(135deg, #DE2910 0%, #B22222 100%)"
                        : lang === "en"
                        ? "linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)"
                        : "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                      color: "#FFFFFF",
                      letterSpacing: "0.5px"
                    }}>
                      {lang === "es" ? "🇳🇮 ES" : lang === "en" ? "🇬🇧 EN" : "🇨🇳 ZH"}
                    </span>
                  </button>

                  <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px" }} />

                  {/* Opción 5: Cerrar Sesión */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "9px 12px",
                      borderRadius: "12px",
                      color: "#F87171",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(239, 68, 68, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <Icon name="logOut" size={16} color="#F87171" />
                    </div>
                    <span style={{ fontSize: "13.5px", fontWeight: "650" }}>
                      {t("nav.logout") || (lang === "en" ? "Log Out" : lang === "zh" ? "退出登录" : "Cerrar Sesión")}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <LanguageToggle />
              <CombinedAuthButton activePage={activePage} />
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="hide-desktop" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={handleInstallClick}
            aria-label="Instalar App"
            title={tr("Instalar App Atlan", "Install Atlan App", "安装应用")}
            style={{
              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.08) 100%)",
              border: "1.5px solid rgba(255, 215, 0, 0.45)",
              borderRadius: "12px",
              color: "#FFD700",
              cursor: "pointer",
              padding: "7px 9px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
              fontSize: "11.5px",
              fontWeight: "700",
              touchAction: "manipulation"
            }}
          >
            <Icon name="download" size={13} color="#FFD700" />
            <span>App</span>
          </button>
          <LanguageToggle />
          {session && <NotificationDropdown session={session} />}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
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
              transition: "all 0.2s ease",
              touchAction: "manipulation"
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
    </nav>

      {/* Mobile Drawer Dropdown Overlay (como elemento de nivel superior para permitir scroll completo) */}
      {menuOpen && (
        <div className="mobile-menu-drawer animate-fade-in-down hide-desktop">
          <Link
            href="/"
            className={`mobile-menu-item ${activePage === "inicio" ? "active" : ""}`}
            onClick={() => {
              if (typeof window !== "undefined") {
                window.__atlanNavigatedInternally = true;
              }
              setMenuOpen(false);
            }}
          >
            <img src="/images/home.svg" alt="Inicio" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> <span>{tr("Inicio", "Home", "首页")}</span>
          </Link>
          <Link href="/mapa" className={`mobile-menu-item ${activePage === "mapa" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <img src="/images/ubic.svg" alt="Mapa" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> <span>{tr("Explorar Mapa", "Explore Map", "探索地图")}</span>
          </Link>
          <Link href="/lugares" className={`mobile-menu-item ${activePage === "lugares" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <img src="/images/Ubicacion.svg" alt="Lugares" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> <span>{tr("Lugares de Nicaragua", "Places of Nicaragua", "尼加拉瓜地点")}</span>
          </Link>
          <Link href="/mas-de-nicaragua" className={`mobile-menu-item ${activePage === "mas-de-nicaragua" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <img src="/images/Nicaragua croquis.svg" alt="Nicaragua" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> <span>{tr("Más de Nicaragua", "More of Nicaragua", "探索尼加拉瓜")}</span>
          </Link>
          <Link href="/departamentos" className={`mobile-menu-item ${activePage === "departamentos" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <img src="/images/flor.svg" alt="Ranking" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> <span>{tr("Ranking", "Ranking", "排行榜")}</span>
          </Link>
          <Link href="/comunidad" className={`mobile-menu-item ${activePage === "comunidad" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <img src="/images/comunidad.svg" alt="Comunidad" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> <span>{tr("Comunidad", "Community", "社区")}</span>
          </Link>
          <Link href="/guias" className={`mobile-menu-item ${activePage === "guias" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Icon name="compass" size={20} color="#FFFFFF" /> <span>{tr("Guías Turísticos", "Tour Guides", "专业导游")}</span>
          </Link>
          {session && (
            <Link href="/chat" className={`mobile-menu-item ${activePage === "chat" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
              <img src="/images/comentarios.svg" alt="Mensajes" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> <span>{tr("Mensajes", "Messages", "消息")}</span>
            </Link>
          )}
          {perfil?.rol === "admin" && (
            <Link href="/admin" className={`mobile-menu-item ${activePage === "admin" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
              <Icon name="shield" size={18} color="#FFFFFF" /> <span>{tr("Gestión", "Management", "管理后台")}</span>
            </Link>
          )}

          {/* Opciones de usuario o botones de acceso en cascada */}
          {session ? (
            <>
              <Link href={communityProfileUrl} className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                <Icon name="users" size={18} color="#FFFFFF" /> <span>{tr("Mi Perfil Comunidad", "My Community Profile", "我的社区主页")}</span>
              </Link>
              <Link href="/perfil" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                <Icon name="user" size={18} color="#FFFFFF" /> <span>{tr("Mi Perfil Personal", "My Personal Profile", "我的个人资料")}</span>
              </Link>
              {(perfil?.rol === "dueno" || perfil?.rol === "admin") && (
                <Link href="/dashboard" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                  <Icon name="briefcase" size={18} color="#FFFFFF" /> <span>{tr("Mi Negocio", "My Business", "我的商家")}</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="mobile-menu-item"
                style={{ background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.3)", color: "#FFFFFF", width: "100%", textAlign: "left", cursor: "pointer", justifyContent: "flex-start", gap: "14px" }}
              >
                <Icon name="logOut" size={18} color="#FFFFFF" /> <span>{t("nav.logout") || "Cerrar Sesión"}</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                <img src="/images/gueguense.svg" alt="Iniciar Sesión" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> <span>{t("nav.login")}</span>
              </Link>
              <Link
                href="/registro"
                className="mobile-menu-item"
                style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", borderColor: "#F59E0B", color: "#FFFFFF", justifyContent: "flex-start", gap: "14px" }}
                onClick={() => setMenuOpen(false)}
              >
                <img src="/images/tortuga.svg" alt="Registrarse" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> <span>{t("nav.register")}</span>
              </Link>
            </>
          )}

          {/* Opción: Descargar App en Menú Móvil */}
          <button
            type="button"
            onClick={handleInstallClick}
            className="mobile-menu-item"
            style={{
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              justifyContent: "space-between",
              background: "rgba(212, 175, 55, 0.12)",
              borderColor: "rgba(212, 175, 55, 0.3)",
              marginTop: "4px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "rgba(212, 175, 55, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Icon name="download" size={14} color="#FFD700" />
              </div>
              <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{tr("Descargar App", "Download App", "下载应用")}</span>
            </div>
            <span style={{
              fontSize: "11px",
              fontWeight: "800",
              padding: "3px 9px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #D4AF37, #B8860B)",
              color: "#0a1727"
            }}>
              {tr("GRATIS", "FREE", "免费")}
            </span>
          </button>

          {/* Opción de cambio de idioma en menú móvil siempre visible para todos los usuarios */}
          <button
            type="button"
            onClick={() => {
              const nextLang = lang === "es" ? "en" : lang === "en" ? "zh" : "es";
              setLang(nextLang);
            }}
            className="mobile-menu-item"
            style={{ width: "100%", textAlign: "left", cursor: "pointer", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.06)", borderColor: "rgba(255, 255, 255, 0.12)", marginTop: "4px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <img src="/images/remolino.svg" alt="Idioma" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
              <span style={{ color: "#FFFFFF" }}>{lang === "es" ? "Traducir Página" : lang === "en" ? "Translate Page" : "翻译页面"}</span>
            </div>
            <span style={{
              fontSize: "11px",
              fontWeight: "800",
              padding: "3px 9px",
              borderRadius: "6px",
              background: lang === "zh"
                ? "linear-gradient(135deg, #DE2910, #B22222)"
                : lang === "en"
                ? "linear-gradient(135deg, #1E40AF, #1E3A8A)"
                : "#146D9E",
              color: "white"
            }}>
              {lang === "es" ? "🇳🇮 ES" : lang === "en" ? "🇬🇧 EN" : "🇨🇳 ZH"}
            </span>
          </button>
        </div>
      )}

      {/* Modal interactivo de descarga e instalación de la app */}
      <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </>
  );
}
