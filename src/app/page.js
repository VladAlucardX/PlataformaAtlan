"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import VideoIntro from "@/components/VideoIntro";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════════════════
   LANDING PAGE — Plataforma Atlan
   ═══════════════════════════════════════════════════════════════════════════ */

// ── NAVBAR ─────────────────────────────────────────────────────────────────
function Navbar({ session, perfil, handleLogout }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <nav style={styles.nav}>
      <div style={styles.navInner}>
        {/* Logo */}
        <Link href="/" style={styles.logo}>
          <img
            src="/mapaicono.png"
            alt="Logo"
            style={{
              width: "28px",
              height: "28px",
              objectFit: "contain"
            }}
          />
          <span className="logoText" style={{ fontSize: "24px", fontWeight: "900", color: "#FFD700" }}>atlan</span>
        </Link>

        {/* Desktop links */}
        <div style={styles.navLinks} className="hide-mobile">
          <Link href="/mapa" className="nav-pill-link">
            🗺️ {t("nav.map")}
          </Link>
          <Link href="/comunidad" className="nav-pill-link">
            👥 {t("social.community")}
          </Link>
          {session && (
            <Link href="/chat" className="nav-pill-link">
              💬 {t("chat.title")}
            </Link>
          )}
          <LanguageToggle variant="pill" />
          {session && <NotificationDropdown session={session} />}

          {session ? (
            <>
              {perfil?.rol === "dueno" || perfil?.rol === "admin" ? (
                <Link href="/dashboard" className="nav-pill-link">
                  {perfil?.avatar_url ? (
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: `url(${perfil.avatar_url}) center/cover`, border: "1px solid rgba(20, 109, 158, 0.15)", flexShrink: 0 }} />
                  ) : "💼"}
                  <span>{perfil?.nombre_completo?.split(" ")[0] || t("nav.dashboard")}</span>
                </Link>
              ) : (
                <Link href="/perfil" className="nav-pill-link">
                  {perfil?.avatar_url ? (
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: `url(${perfil.avatar_url}) center/cover`, border: "1px solid rgba(20, 109, 158, 0.15)", flexShrink: 0 }} />
                  ) : "👤"}
                  <span>{perfil?.nombre_completo?.split(" ")[0] || t("nav.myReservations")}</span>
                </Link>
              )}
              <button onClick={handleLogout} style={{ ...styles.logoutBtn, display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>{t("nav.logout")}</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-pill-link">
                {t("nav.login")}
              </Link>
              <Link href="/registro" className="btn-primary" style={{ padding: "10px 24px", fontSize: "14px" }}>
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="hide-desktop" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {session && <NotificationDropdown session={session} />}
          <LanguageToggle variant="icon" />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            style={styles.hamburger}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
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

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu} className="animate-fade-in-down">
          <Link href="/mapa" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            🗺️ {t("nav.map")}
          </Link>
          <Link href="/comunidad" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            👥 {t("social.community")}
          </Link>
          {session && (
            <Link href="/chat" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              💬 {t("chat.title")}
            </Link>
          )}
 
          {session ? (
            <>
              {perfil?.rol === "dueno" || perfil?.rol === "admin" ? (
                <Link href="/dashboard" style={{ ...styles.mobileLink, display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setMenuOpen(false)}>
                  {perfil?.avatar_url ? (
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `url(${perfil.avatar_url}) center/cover`, border: "1px solid rgba(20, 109, 158, 0.15)", flexShrink: 0 }} />
                  ) : "💼"}
                  <span>{perfil?.nombre_completo?.split(" ")[0] || t("nav.dashboard")}</span>
                </Link>
              ) : (
                <Link href="/perfil" style={{ ...styles.mobileLink, display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setMenuOpen(false)}>
                  {perfil?.avatar_url ? (
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `url(${perfil.avatar_url}) center/cover`, border: "1px solid rgba(20, 109, 158, 0.15)", flexShrink: 0 }} />
                  ) : "👤"}
                  <span>{perfil?.nombre_completo?.split(" ")[0] || t("nav.myReservations")}</span>
                </Link>
              )}
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} style={{ ...styles.mobileLogoutBtn, display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>{t("nav.logout")}</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                🔑 {t("nav.login")}
              </Link>
              <Link
                href="/registro"
                className="btn-primary"
                style={{ width: "100%", textAlign: "center", padding: "14px" }}
                onClick={() => setMenuOpen(false)}
              >
                ✨ {t("nav.register")}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ── HERO SECTION ───────────────────────────────────────────────────────────
function HeroSection({ perfil }) {
  const { t, lang } = useTranslation();

  return (
    <section style={styles.hero}>
      {/* Background gradient orbs */}
      <div style={styles.heroOrb1} />
      <div style={styles.heroOrb2} />
      <div style={styles.heroOrb3} />

      <div style={styles.heroContent} className="animate-fade-in-up">
        {perfil?.nombre_completo && (
          <div style={{
            fontSize: "15px",
            fontWeight: "800",
            color: "var(--atlan-ocean)",
            marginBottom: "12px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            background: "rgba(20, 109, 158, 0.08)",
            padding: "8px 18px",
            borderRadius: "30px",
            display: "inline-block",
            border: "1px solid rgba(20, 109, 158, 0.15)"
          }}>
            👋 {lang === "en" ? "Welcome back" : "Bienvenido de nuevo"}, {perfil.nombre_completo.split(" ")[0]}
          </div>
        )}

        <div className="badge badge-gold" style={{ marginBottom: "16px", marginLeft: perfil?.nombre_completo ? "12px" : "0" }}>
          🇳🇮 Nicaragua
        </div>

        <h1 style={styles.heroTitle}>
          {t("landing.hero.title")}
          <br />
          <span className="text-gradient-gold">{t("landing.hero.titleHighlight")}</span>
        </h1>

        <p style={styles.heroSubtitle}>{t("landing.hero.subtitle")}</p>

        <div style={styles.heroCTAs}>
          <Link href="/mapa" className="btn-primary" style={{ padding: "16px 36px", fontSize: "16px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            {t("landing.hero.cta")}
          </Link>
          <Link href="#cta" className="btn-secondary" style={{ padding: "16px 32px", fontSize: "16px" }}>
            {t("landing.hero.ctaSecondary")}
          </Link>
        </div>

        {/* Stats */}
        <div style={styles.heroStats} className="animate-fade-in-up delay-300">
          <div style={styles.stat}>
            <span style={styles.statNumber}>3+</span>
            <span style={styles.statLabel}>{t("landing.featured.subtitle").split(" ")[0]}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statNumber}>GPS</span>
            <span style={styles.statLabel}>{t("landing.features.gps.title").split(" ").slice(0, 2).join(" ")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statNumber}>24/7</span>
            <span style={styles.statLabel}>{t("landing.features.reservations.title").split(" ").slice(0, 2).join(" ")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FEATURES SECTION ───────────────────────────────────────────────────────
function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: "🗺️",
      title: t("landing.features.gps.title"),
      description: t("landing.features.gps.description"),
      gradient: "linear-gradient(135deg, rgba(20,109,158,0.08), rgba(26,138,199,0.08))",
      borderColor: "rgba(20, 109, 158, 0.15)",
    },
    {
      icon: "📍",
      title: t("landing.features.community.title"),
      description: t("landing.features.community.description"),
      gradient: "linear-gradient(135deg, rgba(23,170,74,0.08), rgba(31,204,92,0.08))",
      borderColor: "rgba(23, 170, 74, 0.15)",
    },
    {
      icon: "📅",
      title: t("landing.features.reservations.title"),
      description: t("landing.features.reservations.description"),
      gradient: "linear-gradient(135deg, rgba(255,215,0,0.10), rgba(230,194,0,0.08))",
      borderColor: "rgba(255, 215, 0, 0.25)",
    },
  ];

  return (
    <section style={styles.section}>
      <div style={styles.sectionInner}>
        <div style={styles.sectionHeader} className="animate-fade-in-up">
          <h2 style={styles.sectionTitle}>{t("landing.features.title")}</h2>
          <p style={styles.sectionSubtitle}>{t("landing.features.subtitle")}</p>
        </div>

        <div style={styles.featuresGrid}>
          {features.map((feature, i) => (
            <div
              key={i}
              className="animate-fade-in-up"
              style={{
                ...styles.featureCard,
                background: feature.gradient,
                borderColor: feature.borderColor,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              <div style={styles.featureIcon}>{feature.icon}</div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CATEGORIES SECTION ─────────────────────────────────────────────────────
function CategoriesSection() {
  const { t } = useTranslation();

  const categories = [
    { 
      icon: "🍽️", key: "comideria", color: "#E6A800",
      bg: "linear-gradient(135deg, #FFFDF0 0%, #FEF9C3 100%)",
      border: "1.5px solid #FDE047", textColor: "#854D0E"
    },
    { 
      icon: "🍲", key: "restaurante", color: "#DC2626",
      bg: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
      border: "1.5px solid #FECDD3", textColor: "#9F1239"
    },
    { 
      icon: "🎨", key: "artesanal", color: "#7C3AED",
      bg: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
      border: "1.5px solid #DDD6FE", textColor: "#5B21B6"
    },
    { 
      icon: "🏖️", key: "playa", color: "#0891B2",
      bg: "linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)",
      border: "1.5px solid #A5F3FC", textColor: "#155E75"
    },
    { 
      icon: "👨‍👩‍👧‍👦", key: "familiar", color: "#DB2777",
      bg: "linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)",
      border: "1.5px solid #FBCFE8", textColor: "#9D174D"
    },
    { 
      icon: "🏨", key: "hotel", color: "#4F46E5",
      bg: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
      border: "1.5px solid #C7D2FE", textColor: "#3730A3"
    },
  ];

  return (
    <section style={{ ...styles.section, background: "var(--atlan-bg-secondary)" }}>
      <div style={styles.sectionInner}>
        <div style={styles.sectionHeader} className="animate-fade-in-up">
          <h2 style={styles.sectionTitle}>{t("map.categories")}</h2>
          <p style={styles.sectionSubtitle}>{t("landing.features.subtitle")}</p>
        </div>

        <div style={styles.categoriesGrid}>
          {categories.map((cat, i) => (
            <Link
              key={cat.key}
              href="/mapa"
              className="animate-fade-in-up clay-card"
              style={{
                ...styles.categoryCard,
                background: cat.bg,
                border: cat.border,
                animationDelay: `${i * 0.1}s`,
                boxShadow: "0 10px 25px -4px rgba(20, 109, 158, 0.08), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
              }}
            >
              <div style={{ ...styles.categoryIcon, background: "rgba(255, 255, 255, 0.8)", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize: "28px" }}>{cat.icon}</span>
              </div>
              <span style={{ ...styles.categoryLabel, color: cat.textColor, fontWeight: "800" }}>
                {t(`addPoint.categories.${cat.key}`)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA SECTION ────────────────────────────────────────────────────────────
function CTASection() {
  const { t } = useTranslation();

  return (
    <section id="cta" style={styles.ctaSection}>
      <div style={styles.ctaOrb} />

      <div style={styles.ctaContent} className="animate-fade-in-up">
        <h2 style={styles.ctaTitle}>{t("landing.cta.title")}</h2>
        <p style={styles.ctaSubtitle}>{t("landing.cta.subtitle")}</p>

        <div style={styles.ctaBenefits}>
          {["benefit1", "benefit2", "benefit3"].map((key) => (
            <div key={key} style={styles.ctaBenefit}>
              <span style={styles.ctaCheck}>✓</span>
              <span>{t(`landing.cta.${key}`)}</span>
            </div>
          ))}
        </div>

        <Link href="/mapa" className="btn-primary" style={{ padding: "16px 40px", fontSize: "16px", marginTop: "16px" }}>
          {t("landing.cta.button")}
        </Link>
      </div>
    </section>
  );
}

// ── FOOTER ─────────────────────────────────────────────────────────────────
function Footer() {
  const { t } = useTranslation();

  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <div style={styles.footerBrand}>
          <div style={styles.logo}>
            <img
              src="/mapaicono.png"
              alt="Logo"
              style={{
                width: "28px",
                height: "28px",
                objectFit: "contain"
              }}
            />
            <span style={{ fontSize: "24px", fontWeight: "900", color: "#FFD700" }}>atlan</span>
          </div>
          <p style={styles.footerDesc}>{t("landing.footer.description")}</p>
        </div>

        <div style={styles.footerLinks}>
          <div>
            <h4 style={styles.footerLinkTitle}>{t("landing.footer.links")}</h4>
            <Link href="/mapa" style={styles.footerLink}>{t("nav.map")}</Link>
          </div>
          <div>
            <h4 style={styles.footerLinkTitle}>{t("landing.footer.legal")}</h4>
            <Link href="#" style={styles.footerLink}>{t("landing.footer.privacy")}</Link>
            <Link href="#" style={styles.footerLink}>{t("landing.footer.terms")}</Link>
          </div>
        </div>
      </div>

      <div style={styles.footerBottom}>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--atlan-text-muted)" }}>
          © {new Date().getFullYear()} Atlan. {t("landing.footer.rights")}
        </p>
      </div>
    </footer>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function Home() {
  const [introDone, setIntroDone] = React.useState(false);
  const [session, setSession] = React.useState(null);
  const [perfil, setPerfil] = React.useState(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("introSeen") === "true") {
      setIntroDone(true);
    }
  }, []);

  React.useEffect(() => {
    // 1. Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      }
    }).catch(async (err) => {
      console.warn("[Atlan] Fallo al recuperar sesión (token inválido). Limpiando almacenamiento:", err);
      try {
        await supabase.auth.signOut();
      } catch (_) { }
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      setSession(null);
      setPerfil(null);
    });

    // 2. Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setPerfil(null);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("rol, avatar_url, nombre_completo")
        .eq("id", userId)
        .single();
      if (!error && data) {
        setPerfil(data);
      }
    } catch (err) {
      console.error("Error fetching user profile in landing:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPerfil(null);
    window.location.reload();
  };

  const handleIntroComplete = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("introSeen", "true");
    }
    setIntroDone(true);
  };

  return (
    <>
      {/* Video Intro Overlay */}
      {!introDone && <VideoIntro onComplete={handleIntroComplete} />}

      {/* Landing Page Content */}
      <div
        style={{
          minHeight: "100vh",
          background: "#FFFFFF",
          opacity: introDone ? 1 : 0,
          transition: "opacity 0.8s ease 0.2s",
        }}
      >
        <Navbar session={session} perfil={perfil} handleLogout={handleLogout} />
        <HeroSection perfil={perfil} />
        <FeaturesSection />
        <CategoriesSection />
        <CTASection />
        <Footer />
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════ 
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = {
  // ── Nav
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(20,109,158,0.10)",
  },
  navInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
    height: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
  },
  logoIcon: { fontSize: "26px" },
  logoText: {
    fontSize: "24px",
    fontWeight: "900",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
    color: "#FFD700",
    letterSpacing: "-0.02em",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  navLink: {
    color: "var(--atlan-text-secondary)",
    fontSize: "14px",
    fontWeight: "500",
    textDecoration: "none",
    transition: "color 0.2s",
  },
  hamburger: {
    background: "none",
    border: "none",
    color: "#1A1A2E",
    cursor: "pointer",
    padding: "8px",
  },
  mobileMenu: {
    padding: "16px 24px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    borderTop: "1px solid rgba(20,109,158,0.08)",
  },
  mobileLink: {
    color: "var(--atlan-text-secondary)",
    fontSize: "16px",
    fontWeight: "500",
    textDecoration: "none",
    padding: "12px 0",
  },
  logoutBtn: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    padding: "8px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  mobileLogoutBtn: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },

  // ── Hero
  hero: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "100px 24px 60px",
  },
  heroOrb1: {
    position: "absolute",
    top: "-15%",
    right: "-5%",
    width: "650px",
    height: "650px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,215,0,0.22) 0%, rgba(255,215,0,0.05) 50%, transparent 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  heroOrb2: {
    position: "absolute",
    bottom: "-10%",
    left: "-5%",
    width: "550px",
    height: "550px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(20,109,158,0.18) 0%, rgba(20,109,158,0.04) 50%, transparent 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  heroOrb3: {
    position: "absolute",
    top: "35%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "450px",
    height: "450px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(23,170,74,0.12) 0%, transparent 70%)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative",
    textAlign: "center",
    maxWidth: "780px",
    zIndex: 2,
  },
  heroTitle: {
    fontSize: "clamp(36px, 6vw, 68px)",
    fontWeight: "900",
    lineHeight: "1.08",
    letterSpacing: "-0.03em",
    marginBottom: "24px",
    color: "var(--atlan-text-primary)",
  },
  heroSubtitle: {
    fontSize: "clamp(16px, 2.2vw, 20px)",
    color: "var(--atlan-text-secondary)",
    lineHeight: "1.7",
    maxWidth: "560px",
    margin: "0 auto 40px",
  },
  heroCTAs: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  heroStats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "32px",
    marginTop: "56px",
    flexWrap: "wrap",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  statNumber: {
    fontSize: "28px",
    fontWeight: "800",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
    color: "var(--atlan-gold)",
  },
  statLabel: {
    fontSize: "13px",
    color: "var(--atlan-text-muted)",
    fontWeight: "500",
  },
  statDivider: {
    width: "1px",
    height: "36px",
    background: "rgba(20,109,158,0.12)",
  },

  // ── Sections
  section: {
    padding: "100px 24px",
  },
  sectionInner: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: "56px",
  },
  sectionTitle: {
    fontSize: "clamp(28px, 4vw, 42px)",
    fontWeight: "800",
    letterSpacing: "-0.02em",
    marginBottom: "12px",
    color: "var(--atlan-text-primary)",
  },
  sectionSubtitle: {
    fontSize: "16px",
    color: "var(--atlan-text-secondary)",
    maxWidth: "500px",
    margin: "0 auto",
  },

  // ── Features
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  featureCard: {
    padding: "36px 28px",
    borderRadius: "var(--atlan-radius-xl)",
    border: "1px solid",
    transition: "all 0.3s ease",
    cursor: "default",
  },
  featureIcon: {
    fontSize: "40px",
    marginBottom: "20px",
  },
  featureTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "10px",
    color: "var(--atlan-text-primary)",
  },
  featureDesc: {
    fontSize: "15px",
    color: "var(--atlan-text-secondary)",
    lineHeight: "1.6",
    margin: 0,
  },

  // ── Categories
  categoriesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "16px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  categoryCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "28px 16px",
    background: "var(--atlan-glass)",
    border: "1px solid var(--atlan-glass-border)",
    borderRadius: "var(--atlan-radius-lg)",
    textDecoration: "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  categoryIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "var(--atlan-radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--atlan-text-primary)",
  },

  // ── CTA
  ctaSection: {
    position: "relative",
    padding: "100px 24px",
    overflow: "hidden",
  },
  ctaOrb: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)",
    filter: "blur(80px)",
    pointerEvents: "none",
  },
  ctaContent: {
    position: "relative",
    maxWidth: "620px",
    margin: "0 auto",
    textAlign: "center",
    zIndex: 2,
  },
  ctaTitle: {
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: "800",
    letterSpacing: "-0.02em",
    marginBottom: "16px",
    color: "var(--atlan-text-primary)",
  },
  ctaSubtitle: {
    fontSize: "16px",
    color: "var(--atlan-text-secondary)",
    lineHeight: "1.7",
    marginBottom: "32px",
  },
  ctaBenefits: {
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },
  ctaBenefit: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "15px",
    color: "var(--atlan-text-secondary)",
  },
  ctaCheck: {
    color: "var(--atlan-emerald)",
    fontWeight: "700",
    fontSize: "16px",
  },

  // ── Footer
  footer: {
    borderTop: "1px solid rgba(20,109,158,0.08)",
    background: "#F5F7FA",
  },
  footerInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "56px 24px 40px",
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "40px",
  },
  footerBrand: {
    maxWidth: "320px",
  },
  footerDesc: {
    fontSize: "14px",
    color: "var(--atlan-text-muted)",
    lineHeight: "1.7",
    marginTop: "12px",
  },
  footerLinks: {
    display: "flex",
    gap: "64px",
  },
  footerLinkTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--atlan-text-primary)",
    marginBottom: "12px",
  },
  footerLink: {
    display: "block",
    color: "var(--atlan-text-muted)",
    fontSize: "14px",
    textDecoration: "none",
    marginBottom: "8px",
    transition: "color 0.2s",
  },
  footerBottom: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "20px 24px",
    borderTop: "1px solid rgba(20,109,158,0.08)",
    textAlign: "center",
  },
};
