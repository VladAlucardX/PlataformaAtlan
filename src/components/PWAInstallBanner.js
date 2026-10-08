"use client";

import { useEffect, useState } from "react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // No mostrar si ya está instalada como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detectar iOS (Safari no tiene beforeinstallprompt)
    const ua = navigator.userAgent;
    const isiOS = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    setIsIOS(isiOS);

    // Verificar si ya fue descartado antes
    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (dismissed) return;

    if (isiOS) {
      // En iOS mostrar el banner siempre (instrucciones manuales)
      const isMobile = window.innerWidth <= 900 || "ontouchstart" in window;
      if (isMobile) {
        setTimeout(() => setShowBanner(true), 3000);
      }
      return;
    }

    // Android/Chrome: escuchar el evento nativo
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.sheet}>
        {/* Pill indicador */}
        <div style={styles.pill} />

        {/* Icono + Info */}
        <div style={styles.header}>
          <img src="/icon-192.png" alt="Atlan" style={styles.icon} />
          <div style={styles.info}>
            <span style={styles.appName}>atlan</span>
            <span style={styles.appDesc}>GPS Turístico · Nicaragua</span>
          </div>
          <button onClick={handleDismiss} style={styles.closeBtn} aria-label="Cerrar">✕</button>
        </div>

        {/* Beneficios */}
        <div style={styles.benefits}>
          {["📍 GPS sin instalar nada", "⚡ Carga instantánea", "📶 Funciona offline"].map((b, i) => (
            <div key={i} style={styles.benefit}>{b}</div>
          ))}
        </div>

        {/* CTA */}
        {isIOS ? (
          <div style={styles.iosInstructions}>
            <span style={styles.iosText}>
              Toca <strong style={{ color: "#007AFF" }}>Compartir</strong> →{" "}
              <strong>"Añadir a inicio"</strong>
            </span>
          </div>
        ) : (
          <button onClick={handleInstall} style={styles.installBtn}>
            <span>⬇</span>
            <span>Instalar App Gratis</span>
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    padding: "0 12px 12px",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
  },
  sheet: {
    background: "linear-gradient(145deg, #0d1b2e 0%, #0a192f 100%)",
    border: "1px solid rgba(212, 175, 55, 0.3)",
    borderRadius: "24px",
    padding: "8px 20px 20px",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1)",
    backdropFilter: "blur(20px)",
    maxWidth: "480px",
    margin: "0 auto",
  },
  pill: {
    width: "40px",
    height: "4px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "2px",
    margin: "0 auto 16px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "16px",
  },
  icon: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    border: "1.5px solid rgba(212,175,55,0.3)",
    flexShrink: 0,
    objectFit: "cover",
  },
  info: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  appName: {
    fontFamily: "'LC Mogi', var(--font-outfit), sans-serif",
    fontSize: "22px",
    fontWeight: "900",
    color: "#D4AF37",
    letterSpacing: "0.04em",
    lineHeight: 1,
  },
  appDesc: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    letterSpacing: "0.05em",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  benefits: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "18px",
  },
  benefit: {
    fontSize: "13.5px",
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  installBtn: {
    width: "100%",
    padding: "15px",
    background: "linear-gradient(135deg, #D4AF37 0%, #F0CB5E 50%, #D4AF37 100%)",
    border: "none",
    borderRadius: "14px",
    color: "#0A192F",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    letterSpacing: "0.02em",
    boxShadow: "0 4px 20px rgba(212,175,55,0.4)",
  },
  iosInstructions: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "14px 16px",
    textAlign: "center",
  },
  iosText: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 1.5,
  },
};
