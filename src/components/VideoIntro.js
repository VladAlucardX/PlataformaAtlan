"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   VIDEO INTRO — Pantalla de bienvenida con video de fondo
   
   El video se reproduce automáticamente a pantalla completa.
   Cuando termina (o tras un timeout de seguridad), hace un fade-out
   elegante para revelar el contenido de la página.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function VideoIntro({ onComplete }) {
  const videoRef = useRef(null);
  const [phase, setPhase] = useState("playing"); // "playing" | "fading" | "done"
  const [videoReady, setVideoReady] = useState(false);

  // ── Iniciar el fade-out ─────────────────────────────────────────────────
  const startFadeOut = useCallback(() => {
    if (phase !== "playing") return;
    setPhase("fading");
  }, [phase]);

  // ── Cuando el fade-out termina, notificar al padre ──────────────────────
  useEffect(() => {
    if (phase === "fading") {
      const timer = setTimeout(() => {
        setPhase("done");
        onComplete?.();
      }, 1800); // duración del fade-out CSS
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // ── Timeout de seguridad (si el video tarda mucho o no carga) ──────────
  useEffect(() => {
    const safety = setTimeout(() => {
      startFadeOut();
    }, 15000); // 15s máximo
    return () => clearTimeout(safety);
  }, [startFadeOut]);

  // ── Skip con click o tecla ─────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        startFadeOut();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [startFadeOut]);

  if (phase === "done") return null;

  return (
    <div
      onClick={startFadeOut}
      style={{
        ...introStyles.overlay,
        opacity: phase === "fading" ? 0 : 1,
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
    >
      {/* Video de fondo */}
      <video
        ref={videoRef}
        src="/videos/portada2.0.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlayThrough={() => setVideoReady(true)}
        onEnded={startFadeOut}
        style={introStyles.video}
      />

      {/* Overlay oscuro sutil sobre el video */}
      <div style={introStyles.darkOverlay} />

      {/* Logo central animado */}
      <div
        style={{
          ...introStyles.logoContainer,
          opacity: videoReady ? 1 : 0,
          transform: videoReady ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0.85)",
        }}
      >
        <span style={introStyles.logoEmoji}>🗺️</span>
        <span style={introStyles.logoName}>Atlan</span>
        <span style={introStyles.logoTagline}>Tu GPS Turístico</span>
      </div>

      {/* Indicador "Toca para continuar" */}
      <div
        style={{
          ...introStyles.skipHint,
          opacity: videoReady ? 1 : 0,
        }}
      >
        <span style={introStyles.skipText}>Toca para continuar</span>
        <div style={introStyles.skipPulse} />
      </div>

      {/* Barra de progreso del video */}
      <div style={introStyles.progressBar}>
        <div
          style={{
            ...introStyles.progressFill,
            animation: videoReady ? "introProgress 12s linear forwards" : "none",
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ESTILOS
   ═══════════════════════════════════════════════════════════════════════════ */
const introStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "#050a14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
  },

  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 1,
  },

  darkOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
    background:
      "linear-gradient(180deg, rgba(5,10,20,0.3) 0%, rgba(5,10,20,0.1) 40%, rgba(5,10,20,0.4) 100%)",
    pointerEvents: "none",
  },

  logoContainer: {
    position: "absolute",
    top: "42%",
    left: "50%",
    zIndex: 3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    transition: "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
    textShadow: "0 4px 30px rgba(0,0,0,0.7)",
    pointerEvents: "none",
  },

  logoEmoji: {
    fontSize: "76px",
    filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.5))",
    animation: "introFloat 3s ease-in-out infinite",
  },

  logoName: {
    fontSize: "clamp(56px, 12vw, 96px)",
    fontWeight: "900",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
    color: "#D4AF37",
    letterSpacing: "-0.03em",
    lineHeight: 1,
  },

  logoTagline: {
    fontSize: "clamp(16px, 3vw, 24px)",
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginTop: "4px",
    WebkitTextStroke: "0.8px rgba(0,0,0,0.7)",
    textShadow: "0 1px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)",
  },

  skipHint: {
    position: "absolute",
    bottom: "180px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    transition: "opacity 1s ease 2s",
  },

  skipText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: "0.05em",
    animation: "introPulseText 2s ease-in-out infinite",
    WebkitTextStroke: "0.5px rgba(0,0,0,0.6)",
    textShadow: "0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)",
  },

  skipPulse: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.7)",
    boxShadow: "0 0 6px rgba(0,0,0,0.6), inset 0 0 4px rgba(0,0,0,0.3)",
    animation: "introRipple 2s ease-in-out infinite",
  },

  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: "rgba(255,255,255,0.1)",
    zIndex: 3,
  },

  progressFill: {
    height: "100%",
    width: "0%",
    background: "linear-gradient(90deg, #D4AF37, #E8CC6A)",
    borderRadius: "0 2px 2px 0",
  },
};
