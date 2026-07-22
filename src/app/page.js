"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import Navbar from "@/components/ui/Navbar";
import VideoIntro from "@/components/VideoIntro";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════════════════
   LANDING PAGE — Plataforma Atlan
   ═══════════════════════════════════════════════════════════════════════════ */

// ── HERO SECTION ───────────────────────────────────────────────────────────
function HeroSection({ perfil }) {
  const { t, lang } = useTranslation();

  return (
    <section style={{ ...styles.hero, background: "linear-gradient(180deg, #F8FAFC 0%, #FFFDF0 60%, #F0F9FF 100%)" }}>
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
        </h1>

        <p style={styles.heroSubtitle}>
          {t("landing.hero.subtitle")}
        </p>

        {/* Action Buttons */}
        <div style={styles.heroActions}>
          <Link href="/mapa" className="btn-primary" style={{ padding: "16px 36px", fontSize: "16px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            <span>{t("landing.hero.cta")}</span>
          </Link>
          <Link href="#cta" className="btn-secondary" style={{ padding: "16px 36px", fontSize: "16px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 1-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>{t("landing.hero.ctaSecondary")}</span>
          </Link>
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
    <section style={{ ...styles.section, background: "linear-gradient(180deg, #F0F9FF 0%, #ECFDF5 100%)" }}>
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
    <section style={{ ...styles.section, background: "linear-gradient(180deg, #ECFDF5 0%, #FFFDF0 100%)" }}>
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
        <Navbar activePage="inicio" session={session} perfil={perfil} onLogout={handleLogout} />
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
    width: "100%",
    padding: "0 32px",
    height: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  navCenterPills: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  navRightActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoutBtn: {
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
    transition: "all 0.2s ease",
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
    minHeight: "calc(100vh - 120px)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    overflow: "hidden",
    padding: "48px 24px 40px",
  },
  heroOrb1: {
    position: "absolute",
    top: "-10%",
    right: "-5%",
    width: "650px",
    height: "650px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,215,0,0.40) 0%, rgba(255,215,0,0.12) 50%, transparent 70%)",
    filter: "blur(40px)",
    pointerEvents: "none",
  },
  heroOrb2: {
    position: "absolute",
    bottom: "-5%",
    left: "-5%",
    width: "550px",
    height: "550px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(20,109,158,0.32) 0%, rgba(20,109,158,0.08) 50%, transparent 70%)",
    filter: "blur(40px)",
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
    background: "radial-gradient(circle, rgba(23,170,74,0.28) 0%, transparent 70%)",
    filter: "blur(45px)",
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative",
    textAlign: "center",
    maxWidth: "780px",
    zIndex: 2,
    marginTop: "12px",
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
  heroActions: {
    display: "flex",
    gap: "28px",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: "20px",
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
