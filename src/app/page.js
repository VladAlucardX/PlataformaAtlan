"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import VideoIntro from "@/components/VideoIntro";

/* ═══════════════════════════════════════════════════════════════════════════
   LANDING PAGE — Plataforma Atlan
   ═══════════════════════════════════════════════════════════════════════════ */

// ── NAVBAR ─────────────────────────────────────────────────────────────────
function Navbar() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <nav style={styles.nav}>
      <div style={styles.navInner}>
        {/* Logo */}
        <Link href="/" style={styles.logo}>
          <span style={styles.logoIcon}>🗺️</span>
          <span style={styles.logoText}>Atlan</span>
        </Link>

        {/* Desktop links */}
        <div style={styles.navLinks} className="hide-mobile">
          <Link href="/mapa" style={styles.navLink}>
            {t("nav.map")}
          </Link>
          <LanguageToggle variant="pill" />
          <Link href="/mapa" className="btn-primary" style={{ padding: "10px 24px", fontSize: "14px" }}>
            {t("landing.hero.cta")}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="hide-desktop" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
          <Link
            href="/mapa"
            className="btn-primary"
            style={{ width: "100%", textAlign: "center", padding: "14px" }}
            onClick={() => setMenuOpen(false)}
          >
            {t("landing.hero.cta")}
          </Link>
        </div>
      )}
    </nav>
  );
}

// ── HERO SECTION ───────────────────────────────────────────────────────────
function HeroSection() {
  const { t } = useTranslation();

  return (
    <section style={styles.hero}>
      {/* Background gradient orbs */}
      <div style={styles.heroOrb1} />
      <div style={styles.heroOrb2} />
      <div style={styles.heroOrb3} />

      <div style={styles.heroContent} className="animate-fade-in-up">
        <div className="badge badge-gold" style={{ marginBottom: "16px" }}>
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
      gradient: "linear-gradient(135deg, #2563eb22, #06b6d422)",
      borderColor: "rgba(37, 99, 235, 0.2)",
    },
    {
      icon: "📍",
      title: t("landing.features.community.title"),
      description: t("landing.features.community.description"),
      gradient: "linear-gradient(135deg, #10b98122, #84cc1622)",
      borderColor: "rgba(16, 185, 129, 0.2)",
    },
    {
      icon: "📅",
      title: t("landing.features.reservations.title"),
      description: t("landing.features.reservations.description"),
      gradient: "linear-gradient(135deg, #D4AF3722, #f59e0b22)",
      borderColor: "rgba(212, 175, 55, 0.2)",
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
    { icon: "🍽️", key: "comideria", color: "var(--atlan-cat-comideria)" },
    { icon: "🍲", key: "restaurante", color: "var(--atlan-cat-restaurante)" },
    { icon: "🎨", key: "artesanal", color: "var(--atlan-cat-artesanal)" },
    { icon: "🏖️", key: "playa", color: "var(--atlan-cat-playa)" },
    { icon: "👨‍👩‍👧‍👦", key: "familiar", color: "var(--atlan-cat-familiar)" },
    { icon: "🏨", key: "hotel", color: "var(--atlan-cat-hotel)" },
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
              className="animate-fade-in-up"
              style={{
                ...styles.categoryCard,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div style={{ ...styles.categoryIcon, background: `${cat.color}22` }}>
                <span style={{ fontSize: "28px" }}>{cat.icon}</span>
              </div>
              <span style={styles.categoryLabel}>
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
            <span style={styles.logoIcon}>🗺️</span>
            <span style={styles.logoText}>Atlan</span>
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

  return (
    <>
      {/* Video Intro Overlay */}
      {!introDone && <VideoIntro onComplete={() => setIntroDone(true)} />}

      {/* Landing Page Content */}
      <div
        style={{
          minHeight: "100vh",
          background: "var(--atlan-bg-primary)",
          opacity: introDone ? 1 : 0,
          transition: "opacity 0.8s ease 0.2s",
        }}
      >
        <Navbar />
        <HeroSection />
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
    background: "rgba(10, 15, 28, 0.8)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
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
    fontSize: "22px",
    fontWeight: "800",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
    background: "linear-gradient(135deg, #D4AF37, #E8CC6A)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
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
    color: "var(--atlan-text-primary)",
    cursor: "pointer",
    padding: "8px",
  },
  mobileMenu: {
    padding: "16px 24px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  mobileLink: {
    color: "var(--atlan-text-secondary)",
    fontSize: "16px",
    fontWeight: "500",
    textDecoration: "none",
    padding: "12px 0",
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
    top: "-20%",
    right: "-10%",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  heroOrb2: {
    position: "absolute",
    bottom: "-15%",
    left: "-5%",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(26,58,110,0.25) 0%, transparent 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  heroOrb3: {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
    filter: "blur(80px)",
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
    background: "rgba(255,255,255,0.1)",
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
    background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)",
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
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "var(--atlan-bg-secondary)",
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
    borderTop: "1px solid rgba(255,255,255,0.06)",
    textAlign: "center",
  },
};
