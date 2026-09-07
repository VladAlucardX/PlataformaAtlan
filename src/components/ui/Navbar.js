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
  const { t, tr, lang, setLang } = useTranslation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [hasBusinesses, setHasBusinesses] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const dropdownRef = useRef(null);
  const hideTimerRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const touchStartYRef = useRef(0);

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
    return tr("Perfil", "Profile", "个人中心");
  };

  const communityProfileUrl = perfil ? `/comunidad/perfil/${getProfileSlug(perfil)}` : (session?.user?.id ? `/comunidad/perfil/${session.user.id}` : "/comunidad");

  return (
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
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
          <img
            src="/images/Isotipo.png"
            alt="Logo"
            style={{ width: "30px", height: "30px", objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
          />
          <span className="logoText" style={{ fontSize: "25px", fontWeight: "900", color: "#F59E0B" }}>atlan</span>
        </Link>

        {/* Center Nav Pills */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap", justifyContent: "center" }} className="hide-mobile">
          <Link href="/" className={`nav-pill-link ${activePage === "inicio" ? "active" : ""}`}>
            <img src="/images/home.svg" alt="Inicio" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> {tr("Inicio", "Home", "首页")}
          </Link>
          <Link href="/mapa" className={`nav-pill-link ${activePage === "mapa" ? "active" : ""}`}>
            <img src="/images/ubic.svg" alt="Mapa" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> {tr("Mapa", "Map", "地图")}
          </Link>
          <Link href="/departamentos" className={`nav-pill-link ${activePage === "departamentos" ? "active" : ""}`}>
            <img src="/images/flor.svg" alt="Ranking" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0)" }} /> {tr("Ranking", "Ranking", "排行榜")}
          </Link>
          <Link href="/mas-de-nicaragua" className={`nav-pill-link ${activePage === "mas-de-nicaragua" ? "active" : ""}`}>
            <img src="/images/Nicaragua croquis.svg" alt="Nicaragua" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> {tr("Más de Nicaragua", "More of Nicaragua", "探索尼加拉瓜")}
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
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* Nombre de usuario -> Redirige al Perfil de la Comunidad */}
                <Link
                  href={communityProfileUrl}
                  className={`nav-pill-link ${activePage === "perfil-comunidad" ? "active" : ""}`}
                  title={getProfileLabel()}
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
                    borderRadius: "20px",
                    maxWidth: "180px",
                    flexShrink: 1,
                    overflow: "hidden"
                  }}
                >
                  {perfil?.avatar_url ? (
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: `url(${perfil.avatar_url}) center/cover`, border: "1px solid rgba(20, 109, 158, 0.15)", flexShrink: 0 }} />
                  ) : (
                    <Icon name="user" size={18} />
                  )}
                  <span style={{
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    verticalAlign: "middle"
                  }}>
                    {getProfileLabel()}
                  </span>
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
                  title={tr("Opciones de Usuario", "User Options", "用户选项")}
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
                    border: "1.5px solid rgba(20, 109, 158, 0.12)",
                    boxShadow: "0 20px 40px -8px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)",
                    borderRadius: "20px",
                    padding: "8px",
                    minWidth: "230px",
                    zIndex: 100,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                  className="animate-fade-in-down"
                >
                  {/* Opción Admin: Gestión */}
                  {perfil?.rol === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "14px",
                        color: "#1E1B4B",
                        fontSize: "13.5px",
                        fontWeight: "750",
                        textDecoration: "none",
                        transition: "all 0.18s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(124, 58, 237, 0.08)";
                        e.currentTarget.style.transform = "translateX(3px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(109, 40, 217, 0.25) 100%)",
                        border: "1px solid rgba(124, 58, 237, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <Icon name="shield" size={16} color="#7C3AED" />
                      </div>
                      <span>{lang === "en" ? "Management" : lang === "zh" ? "管理控制台" : "Gestión"}</span>
                    </Link>
                  )}

                  {/* Opción 1: Mi Perfil Comunidad */}
                  <Link
                    href={communityProfileUrl}
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      color: "#064E3B",
                      fontSize: "13.5px",
                      fontWeight: "750",
                      textDecoration: "none",
                      transition: "all 0.18s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(16, 185, 129, 0.08)";
                      e.currentTarget.style.transform = "translateX(3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <Icon name="users" size={16} color="#059669" />
                    </div>
                    <span>{lang === "en" ? "My Community Profile" : lang === "zh" ? "我的社区资料" : "Mi Perfil Comunidad"}</span>
                  </Link>

                  {/* Opción 2: Mi Perfil Personal */}
                  <Link
                    href="/perfil"
                    onClick={() => setUserDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      color: "#0C4A6E",
                      fontSize: "13.5px",
                      fontWeight: "750",
                      textDecoration: "none",
                      transition: "all 0.18s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(2, 132, 199, 0.08)";
                      e.currentTarget.style.transform = "translateX(3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(3, 105, 161, 0.25) 100%)",
                      border: "1px solid rgba(2, 132, 199, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <Icon name="user" size={16} color="#0284C7" />
                    </div>
                    <span>{lang === "en" ? "My Personal Profile" : lang === "zh" ? "我的个人资料" : "Mi Perfil Personal"}</span>
                  </Link>

                  {/* Opción Guía: Mi Perfil de Guía (Solo si es guía turístico) */}
                  {perfil?.rol === "guia_turistico" && (
                    <Link
                      href="/perfil-guia"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "14px",
                        color: "#0369A1",
                        fontSize: "13.5px",
                        fontWeight: "750",
                        textDecoration: "none",
                        transition: "all 0.18s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(14, 165, 233, 0.1)";
                        e.currentTarget.style.transform = "translateX(3px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(56, 189, 248, 0.3) 100%)",
                        border: "1px solid rgba(14, 165, 233, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <Icon name="compass" size={16} color="#0EA5E9" />
                      </div>
                      <span>{lang === "en" ? "My Guide Profile Section" : lang === "zh" ? "我的导游资料" : "Mi Perfil de Guía Turístico"}</span>
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
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "14px",
                        color: "#78350F",
                        fontSize: "13.5px",
                        fontWeight: "750",
                        textDecoration: "none",
                        transition: "all 0.18s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(245, 158, 11, 0.08)";
                        e.currentTarget.style.transform = "translateX(3px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.28) 100%)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <Icon name="briefcase" size={16} color="#D97706" />
                      </div>
                      <span>{lang === "en" ? "My Businesses" : lang === "zh" ? "我的店铺" : "Mis Negocios"}</span>
                    </Link>
                  )}

                  <div style={{ height: "1px", background: "rgba(20, 109, 158, 0.08)", margin: "4px 0" }} />

                  {/* Opción 4: Traducir Página */}
                  <button
                    onClick={() => {
                      const nextLang = lang === "es" ? "en" : lang === "en" ? "zh" : "es";
                      setLang(nextLang);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      background: "transparent",
                      border: "none",
                      color: "#312E81",
                      fontSize: "13.5px",
                      fontWeight: "750",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.18s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
                      e.currentTarget.style.transform = "translateX(3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.25) 100%)",
                        border: "1px solid rgba(99, 102, 241, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <img src="/images/remolino.svg" alt="Idioma" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                      </div>
                      <span>{lang === "es" ? "Traducir Página" : lang === "en" ? "Translate Page" : "翻译页面"}</span>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "3px 9px",
                      borderRadius: "8px",
                      background: lang === "zh"
                        ? "linear-gradient(135deg, #DE2910 0%, #B22222 100%)"
                        : lang === "en"
                        ? "linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)"
                        : "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)",
                      color: "#FFFFFF",
                      letterSpacing: "0.5px",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)"
                    }}>
                      {lang === "es" ? "🇳🇮 ES" : lang === "en" ? "🇬🇧 EN" : "🇨🇳 ZH"}
                    </span>
                  </button>

                  <div style={{ height: "1px", background: "rgba(20, 109, 158, 0.08)", margin: "4px 0" }} />

                  {/* Opción 5: Cerrar Sesión */}
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      color: "#EF4444",
                      background: "none",
                      border: "none",
                      fontSize: "13.5px",
                      fontWeight: "750",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.18s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                      e.currentTarget.style.transform = "translateX(3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.25) 100%)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <Icon name="logOut" size={16} color="#DC2626" />
                    </div>
                    <span>{t("nav.logout") || (lang === "en" ? "Log Out" : lang === "zh" ? "退出登录" : "Cerrar Sesión")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={`nav-pill-link ${activePage === "login" ? "active" : ""}`}>
                <img src="/images/gueguense.svg" alt="Iniciar Sesión" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                <span>{t("nav.login")}</span>
              </Link>
              <Link href="/registro" className="btn-primary" style={{ padding: "8px 20px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <img src="/images/tortuga.svg" alt="Registrarse" style={{ width: "16px", height: "16px", objectFit: "contain" }} />
                <span>{t("nav.register")}</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="hide-desktop" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {session && <NotificationDropdown session={session} />}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setMenuOpen(!menuOpen);
            }}
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

      {/* Mobile Drawer Dropdown Overlay */}
      {menuOpen && (
        <div className="mobile-menu-drawer animate-fade-in-down hide-desktop">
          {/* Header interno del Menú Móvil */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", marginBottom: "8px", borderBottom: "1.5px solid rgba(255, 215, 0, 0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/mapaicono.png" alt="Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
              <span style={{ fontSize: "26px", fontWeight: "900", color: "#FFD700", fontFamily: "var(--font-outfit)" }}>atlan</span>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1.5px solid rgba(255, 215, 0, 0.4)",
                color: "#FFD700",
                borderRadius: "50%",
                width: "38px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          <Link href="/" className={`mobile-menu-item ${activePage === "inicio" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <img src="/images/home.svg" alt="Inicio" style={{ width: "20px", height: "20px", objectFit: "contain" }} /> <span>{tr("Inicio", "Home", "首页")}</span>
          </Link>
          <Link href="/mapa" className={`mobile-menu-item ${activePage === "mapa" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <img src="/images/ubic.svg" alt="Mapa" style={{ width: "20px", height: "20px", objectFit: "contain" }} /> <span>{tr("Mapa", "Map", "地图")}</span>
          </Link>
          <Link href="/departamentos" className={`mobile-menu-item ${activePage === "departamentos" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <img src="/images/flor.svg" alt="Ranking" style={{ width: "20px", height: "20px", objectFit: "contain" }} /> <span>{tr("Ranking", "Ranking", "排行榜")}</span>
          </Link>
          <Link href="/mas-de-nicaragua" className={`mobile-menu-item ${activePage === "mas-de-nicaragua" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <img src="/images/Nicaragua croquis.svg" alt="Nicaragua" style={{ width: "20px", height: "20px", objectFit: "contain" }} /> <span>{tr("Más de Nicaragua", "More of Nicaragua", "探索尼加拉瓜")}</span>
          </Link>
          <Link href="/comunidad" className={`mobile-menu-item ${activePage === "comunidad" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <img src="/images/comunidad.svg" alt="Comunidad" style={{ width: "20px", height: "20px", objectFit: "contain" }} /> <span>{tr("Comunidad", "Community", "社区")}</span>
          </Link>
          <Link href="/guias" className={`mobile-menu-item ${activePage === "guias" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Icon name="compass" size={20} color={activePage === "guias" ? "#38BDF8" : "#FFD700"} /> <span>{tr("Guías Turísticos", "Tour Guides", "专业导游")}</span>
          </Link>
          {session && (
            <Link href="/chat" className={`mobile-menu-item ${activePage === "chat" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
              <img src="/images/comentarios.svg" alt="Mensajes" style={{ width: "20px", height: "20px", objectFit: "contain" }} /> <span>{tr("Mensajes", "Messages", "消息")}</span>
            </Link>
          )}
          {perfil?.rol === "admin" && (
            <Link href="/admin" className={`mobile-menu-item ${activePage === "admin" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
              <Icon name="shield" size={18} /> <span>{tr("Gestión", "Management", "管理后台")}</span>
            </Link>
          )}
          {session ? (
            <>
              <Link href={communityProfileUrl} className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                <Icon name="users" size={18} /> <span>{tr("Mi Perfil Comunidad", "My Community Profile", "我的社区主页")}</span>
              </Link>
              <Link href="/perfil" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                <Icon name="user" size={18} /> <span>{tr("Mi Perfil Personal", "My Personal Profile", "我的个人资料")}</span>
              </Link>
              {(perfil?.rol === "dueno" || perfil?.rol === "admin") && (
                <Link href="/dashboard" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                  <Icon name="briefcase" size={18} /> <span>{tr("Mi Negocio", "My Business", "我的商家")}</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  const nextLang = lang === "es" ? "en" : lang === "en" ? "zh" : "es";
                  setLang(nextLang);
                }}
                className="mobile-menu-item"
                style={{ width: "100%", textAlign: "left", cursor: "pointer", justifyContent: "space-between", background: "rgba(20, 109, 158, 0.15)", borderColor: "rgba(20, 109, 158, 0.3)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img src="/images/remolino.svg" alt="Idioma" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
                  <span>{lang === "es" ? "Traducir Página" : lang === "en" ? "Translate Page" : "翻译页面"}</span>
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
              <button
                type="button"
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="mobile-menu-item"
                style={{ background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", width: "100%", textAlign: "left", cursor: "pointer" }}
              >
                <Icon name="logOut" size={18} /> <span>{t("nav.logout") || "Cerrar Sesión"}</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                <img src="/images/gueguense.svg" alt="Iniciar Sesión" style={{ width: "20px", height: "20px", objectFit: "contain" }} /> <span>{t("nav.login")}</span>
              </Link>
              <Link
                href="/registro"
                className="mobile-menu-item"
                style={{ background: "linear-gradient(135deg, #146D9E 0%, #0D496B 100%)", borderColor: "#FFD700", color: "#FFFFFF", justifyContent: "center", gap: "8px" }}
                onClick={() => setMenuOpen(false)}
              >
                <img src="/images/tortuga.svg" alt="Registrarse" style={{ width: "20px", height: "20px", objectFit: "contain" }} /> <span>{t("nav.register")}</span>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
