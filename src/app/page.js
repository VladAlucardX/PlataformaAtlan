"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import Navbar from "@/components/ui/Navbar";
import VideoIntro from "@/components/VideoIntro";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import Icon from "@/components/ui/Icon";
import NeonMapSign from "@/components/ui/NeonMapSign";
import NeonBusinessSign from "@/components/ui/NeonBusinessSign";

// Landing Page

// Hero
function HeroSection({ session, perfil, introDone }) {
  const { t, lang } = useTranslation();
  const videoRef = useRef(null);

  useEffect(() => {
    if (introDone && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [introDone]);

  const handleEnded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <section style={{
      ...styles.hero,
      position: 'relative',
      overflow: 'hidden',
      background: '#0A192F'
    }}>
      {/* Video de Fondo Fullscreen */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedMetadata={() => {
          if (videoRef.current && introDone) videoRef.current.currentTime = 0;
        }}
        onEnded={handleEnded}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0
        }}
      >
        <source src="/videos/AtlanHero.mp4" type="video/mp4" />
      </video>
      {/* Overlay oscuro para legibilidad del texto */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, rgba(10, 25, 47, 0.25) 0%, rgba(10, 25, 47, 0.35) 100%)',
        zIndex: 1
      }} />
      <div style={{ ...styles.heroContent, position: 'relative', zIndex: 2 }} className="animate-fade-in-up">
        <h1 style={{ ...styles.heroTitle, color: "#FFFFFF", marginTop: "32px" }}>
          {t("landing.hero.title")}
        </h1>

        {/* Carteles Neón Interactivos: Explorar Mapa + ¿Tienes un Negocio? */}
        <div style={{ marginTop: "32px", display: "flex", gap: "72px", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <NeonMapSign />
          <NeonBusinessSign session={session} />
        </div>
      </div>
    </section>
  );
}

// Características
function FeaturesSection() {
  const { t, lang } = useTranslation();
  const [scrolled, setScrolled] = React.useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: <img src="/images/ubic.svg" alt="GPS" style={{ width: "38px", height: "38px", objectFit: "contain" }} />,
      title: t("landing.features.gps.title"),
      description: t("landing.features.gps.description"),
      bg: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
      border: "1.5px solid #BAE6FD",
      textColor: "#0369A1",
    },
    {
      icon: <img src="/images/ubicacion.svg" alt="Destinos Verificados" style={{ width: "38px", height: "38px", objectFit: "contain" }} />,
      title: t("landing.features.community.title"),
      description: t("landing.features.community.description"),
      bg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
      border: "1.5px solid #A7F3D0",
      textColor: "#047857",
    },
    {
      icon: <img src="/images/machoraton.svg" alt="Reservas Directas" style={{ width: "38px", height: "38px", objectFit: "contain" }} />,
      title: t("landing.features.reservations.title"),
      description: t("landing.features.reservations.description"),
      bg: "linear-gradient(135deg, #FFFDF0 0%, #FEF9C3 100%)",
      border: "1.5px solid #FDE047",
      textColor: "#854D0E",
    },
  ];

  return (
    <section style={{ ...styles.section, background: "url('/images/Frame 6.png') center / 100% 100% no-repeat", paddingTop: "140px", position: "relative" }}>
      {/* Indicador Animado "Desplaza hacia abajo para ver más" en la cabecera superior */}
      <div style={{
        position: "absolute",
        top: "22px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        zIndex: 10,
        opacity: scrolled ? 0 : 1,
        pointerEvents: scrolled ? "none" : "auto",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        color: "#FFFFFF"
      }}>
        <span style={{
          fontSize: "13.5px",
          fontWeight: "800",
          letterSpacing: "0.5px",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
          fontFamily: "var(--font-outfit), system-ui, sans-serif"
        }}>
          {lang === "en" ? "Scroll down to see more" : "Desplaza hacia abajo para ver más"}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-scroll-bounce"
          style={{ filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))" }}
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>

      {/* Transición leve superior con Hero */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "70px", background: "linear-gradient(to bottom, rgba(20, 109, 158, 0.35) 0%, transparent 100%)", pointerEvents: "none", zIndex: 1 }} />
      
      <div style={{ ...styles.sectionInner, position: "relative", zIndex: 2 }}>
        <div style={styles.sectionHeader} className="animate-fade-in-up">
          <h2 style={{ ...styles.sectionTitle, color: "#FFFFFF" }}>{t("landing.features.title")}</h2>
          <p style={{ ...styles.sectionSubtitle, color: "rgba(255, 255, 255, 0.9)" }}>{t("landing.features.subtitle")}</p>
        </div>

        <div style={styles.featuresGrid}>
          {features.map((feature, i) => (
            <div
              key={i}
              className="animate-fade-in-up clay-card"
              style={{
                ...styles.featureCard,
                background: feature.bg,
                border: feature.border,
                animationDelay: `${i * 0.15}s`,
                boxShadow: "0 10px 25px -4px rgba(0, 0, 0, 0.15), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
                padding: "32px 24px",
                borderRadius: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "16px",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                cursor: "pointer"
              }}
            >
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: "rgba(255, 255, 255, 0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06), inset 1px 1px 2px rgba(255,255,255,1)",
                fontSize: "28px",
                flexShrink: 0
              }}>
                {feature.icon}
              </div>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: "850", color: feature.textColor, marginBottom: "8px" }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--atlan-text-secondary)", margin: 0 }}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Transición leve inferior con Categorías */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70px", background: "linear-gradient(to top, rgba(255, 215, 0, 0.25) 0%, transparent 100%)", pointerEvents: "none", zIndex: 1 }} />
    </section>
  );
}

// Categorías
function CategoriesSection() {
  const { t } = useTranslation();

  const categories = [
    {
      icon: <img src="/images/comideria.svg" alt="Comidería" style={{ width: "30px", height: "30px", objectFit: "contain" }} />, key: "comideria",
      bg: "#FFFFFF", border: "1.5px solid rgba(217, 119, 6, 0.25)",
      iconBg: "rgba(245, 158, 11, 0.15)", textColor: "#92400E"
    },
    {
      icon: <img src="/images/restaurante.svg" alt="Restaurante" style={{ width: "30px", height: "30px", objectFit: "contain" }} />, key: "restaurante",
      bg: "#FFFFFF", border: "1.5px solid rgba(220, 38, 38, 0.25)",
      iconBg: "rgba(239, 68, 68, 0.15)", textColor: "#991B1B"
    },
    {
      icon: <img src="/images/arte.svg" alt="Artesanal" style={{ width: "30px", height: "30px", objectFit: "contain" }} />, key: "artesanal",
      bg: "#FFFFFF", border: "1.5px solid rgba(124, 58, 237, 0.25)",
      iconBg: "rgba(139, 92, 246, 0.15)", textColor: "#5B21B6"
    },
    {
      icon: <img src="/images/playa.svg" alt="Playa" style={{ width: "30px", height: "30px", objectFit: "contain" }} />, key: "playa",
      bg: "#FFFFFF", border: "1.5px solid rgba(8, 145, 178, 0.25)",
      iconBg: "rgba(6, 182, 212, 0.15)", textColor: "#155E75"
    },
    {
      icon: <img src="/images/comunidad.svg" alt="Familiar" style={{ width: "30px", height: "30px", objectFit: "contain" }} />, key: "familiar",
      bg: "#FFFFFF", border: "1.5px solid rgba(219, 39, 119, 0.25)",
      iconBg: "rgba(236, 72, 153, 0.15)", textColor: "#9D174D"
    },
    {
      icon: <img src="/images/hotel.svg" alt="Hotel" style={{ width: "30px", height: "30px", objectFit: "contain" }} />, key: "hotel",
      bg: "#FFFFFF", border: "1.5px solid rgba(79, 70, 229, 0.25)",
      iconBg: "rgba(99, 102, 241, 0.15)", textColor: "#3730A3"
    },
    {
      icon: <img src="/images/hostal.svg" alt="Hostal" style={{ width: "30px", height: "30px", objectFit: "contain" }} />, key: "hostal",
      bg: "#FFFFFF", border: "1.5px solid rgba(13, 148, 136, 0.25)",
      iconBg: "rgba(20, 184, 166, 0.15)", textColor: "#115E59"
    },
    {
      icon: <img src="/images/transporte.svg" alt="Transporte" style={{ width: "30px", height: "30px", objectFit: "contain" }} />, key: "transporte",
      bg: "#FFFFFF", border: "1.5px solid rgba(234, 88, 12, 0.25)",
      iconBg: "rgba(249, 115, 22, 0.15)", textColor: "#9A3412"
    },
    {
      icon: <img src="/images/tour.svg" alt="Tour" style={{ width: "30px", height: "30px", objectFit: "contain" }} />, key: "tour",
      bg: "#FFFFFF", border: "1.5px solid rgba(23, 170, 74, 0.25)",
      iconBg: "rgba(34, 197, 94, 0.15)", textColor: "#166534"
    },
    {
      icon: <img src="/images/tienda.svg" alt="Tienda" style={{ width: "30px", height: "30px", objectFit: "contain" }} />, key: "tienda",
      bg: "#FFFFFF", border: "1.5px solid rgba(147, 51, 234, 0.25)",
      iconBg: "rgba(168, 85, 247, 0.15)", textColor: "#6B21A8"
    },
  ];

  return (
    <section style={{ ...styles.section, background: "url('/images/Frame 4.png') center / 100% 100% no-repeat", position: "relative" }}>
      {/* Transición leve superior con Features */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "70px", background: "linear-gradient(to bottom, rgba(23, 170, 74, 0.25) 0%, transparent 100%)", pointerEvents: "none", zIndex: 1 }} />

      <div style={{ ...styles.sectionInner, position: "relative", zIndex: 2 }}>
        <div style={styles.sectionHeader} className="animate-fade-in-up">
          <h2 style={{ ...styles.sectionTitle, color: "#FFFFFF" }}>{t("map.categories")}</h2>
          <p style={{ ...styles.sectionSubtitle, color: "#FFFFFF", opacity: 0.9 }}>{t("landing.categories.subtitle")}</p>
        </div>

        <div className="categories-grid-5">
          {categories.map((cat, i) => (
            <Link
              key={cat.key}
              href={`/mapa?categoria=${cat.key}`}
              className="animate-fade-in-up clay-card"
              style={{
                ...styles.categoryCard,
                background: cat.bg,
                border: cat.border,
                animationDelay: `${i * 0.08}s`,
                boxShadow: "0 10px 25px -4px rgba(0, 0, 0, 0.14), inset 2px 2px 4px rgba(255, 255, 255, 1)",
              }}
            >
              <div style={{ ...styles.categoryIcon, background: cat.iconBg, boxShadow: "0 4px 10px rgba(0,0,0,0.04)" }}>
                <span style={{ fontSize: "28px" }}>{cat.icon}</span>
              </div>
              <span style={{ ...styles.categoryLabel, color: cat.textColor, fontWeight: "850" }}>
                {t(`addPoint.categories.${cat.key}`)}
              </span>
            </Link>
          ))}
        </div>
      </div>
      {/* Transición leve inferior con CTA */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70px", background: "linear-gradient(to top, rgba(20, 109, 158, 0.25) 0%, transparent 100%)", pointerEvents: "none", zIndex: 1 }} />
    </section>
  );
}

// Llamado a la acción
function CTASection({ session }) {
  const { t } = useTranslation();

  return (
    <section id="cta" style={{
      ...styles.ctaSection,
      background: "url('/images/Frame 5.png') center / 100% 100% no-repeat"
    }}>
      <div style={{
        ...styles.ctaContent,
        background: "rgba(255, 255, 255, 0.95)",
        border: "2px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "32px",
        padding: "48px 32px",
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.2), inset 2px 2px 4px rgba(255, 255, 255, 0.9)"
      }} className="animate-fade-in-up clay-card">
        <h2 style={{ ...styles.ctaTitle, color: "#146D9E", fontWeight: "900" }}>{t("landing.cta.title")}</h2>
        <p style={{ ...styles.ctaSubtitle, color: "#4A5568", fontSize: "16px" }}>{t("landing.cta.subtitle")}</p>

        <div style={styles.ctaBenefits}>
          {["benefit1", "benefit2", "benefit3"].map((key) => (
            <div key={key} style={{ ...styles.ctaBenefit, color: "#1A1A2E", fontWeight: "750", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                color: "#17AA4A",
                background: "#E6F4EA",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "13px"
              }}>✓</span>
              <span>{t(`landing.cta.${key}`)}</span>
            </div>
          ))}
        </div>

        <Link href={session ? "/dashboard" : "/registro"} className="btn-primary" style={{ padding: "16px 40px", fontSize: "16px", marginTop: "24px" }}>
          {t("landing.cta.button")}
        </Link>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const { t } = useTranslation();

  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <div style={styles.footerBrand}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <img
              src="/mapaicono.png"
              alt="Logo Atlan"
              style={{
                width: "36px",
                height: "36px",
                objectFit: "contain"
              }}
            />
            <span style={{ fontSize: "28px", fontWeight: "900", color: "#FFD700", letterSpacing: "-0.5px" }}>atlan</span>
          </div>
          <p style={styles.footerDesc}>{t("landing.footer.description")}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", color: "#94A3B8", fontSize: "13px", fontWeight: "600" }}>

            <span>Orgullosamente desarrollado para Nicaragua</span>
          </div>
        </div>

        <div style={styles.footerLinks}>
          <div>
            <h4 style={styles.footerLinkTitle}>{t("landing.footer.links")}</h4>
            <Link href="/mapa" style={styles.footerLink}><Icon name="map" size={14} /> {t("nav.map")}</Link>
            <Link href="/comunidad" style={styles.footerLink}><Icon name="users" size={14} /> {t("nav.community")}</Link>
          </div>
          <div>
            <h4 style={styles.footerLinkTitle}>Negocios</h4>
            <Link href="/registro" style={styles.footerLink}><Icon name="store" size={14} /> Registrar Negocio</Link>
            <Link href="/dashboard" style={styles.footerLink}><Icon name="barChart" size={14} /> Mi Panel</Link>
          </div>
          <div>
            <h4 style={styles.footerLinkTitle}>{t("landing.footer.legal")}</h4>
            <Link href="#" style={styles.footerLink}><Icon name="lock" size={14} /> {t("landing.footer.privacy")}</Link>
            <Link href="#" style={styles.footerLink}><Icon name="fileText" size={14} /> {t("landing.footer.terms")}</Link>
          </div>
        </div>
      </div>

      <div style={styles.footerBottom}>
        <p style={{ margin: 0, fontSize: "13px", color: "#94A3B8" }}>
          © {new Date().getFullYear()} Atlan. {t("landing.footer.rights")}
        </p>
      </div>
    </footer>
  );
}

// Componente Principal
export default function Home() {
  const [introDone, setIntroDone] = React.useState(false);
  const { session, perfil, logout } = useAuth();

  React.useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("introSeen") === "true") {
      setIntroDone(true);
    }
  }, []);

  const handleLogout = async () => {
    await logout();
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
        <HeroSection session={session} perfil={perfil} introDone={introDone} />
        <FeaturesSection />
        <CategoriesSection />
        <CTASection session={session} />
        <Footer />
      </div>
    </>
  );
}

// Estilos
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
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "110px 24px 80px",
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
    maxWidth: "840px",
    zIndex: 2,
    marginTop: "0px",
  },
  heroTitle: {
    fontSize: "clamp(28px, 6vw, 76px)",
    fontWeight: "900",
    lineHeight: "1.1",
    letterSpacing: "-0.03em",
    marginBottom: "28px",
    color: "var(--atlan-text-primary)",
    whiteSpace: "nowrap",
  },
  heroSubtitle: {
    fontSize: "clamp(18px, 2.5vw, 22px)",
    color: "var(--atlan-text-secondary)",
    lineHeight: "1.7",
    maxWidth: "680px",
    margin: "0 auto 44px",
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
    fontSize: "clamp(34px, 5.2vw, 54px)",
    fontWeight: "900",
    letterSpacing: "-0.02em",
    marginBottom: "14px",
    color: "var(--atlan-text-primary)",
  },
  sectionSubtitle: {
    fontSize: "18px",
    color: "var(--atlan-text-secondary)",
    maxWidth: "560px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "18px",
    maxWidth: "1050px",
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
    background: "#0A192F",
    color: "#FFFFFF",
    borderTop: "3px solid #0F5579",
  },
  footerInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "64px 24px 44px",
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "48px",
  },
  footerBrand: {
    maxWidth: "340px",
  },
  footerDesc: {
    fontSize: "14px",
    color: "#94A3B8",
    lineHeight: "1.7",
    margin: 0,
  },
  footerLinks: {
    display: "flex",
    gap: "56px",
    flexWrap: "wrap",
  },
  footerLinkTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: "16px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  footerLink: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#CBD5E1",
    fontSize: "14px",
    fontWeight: "500",
    textDecoration: "none",
    marginBottom: "12px",
    transition: "all 0.2s ease",
  },
  footerBottom: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px 24px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    textAlign: "center",
  },
};
