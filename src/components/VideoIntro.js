"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

// Pantalla de bienvenida con video de fondo

export default function VideoIntro({ onComplete }) {
  const videoRef = useRef(null);
  const [phase, setPhase] = useState("playing"); // "playing" | "fading" | "done"
  const [videoReady, setVideoReady] = useState(false);

  // Fade-out
  const startFadeOut = useCallback(() => {
    setPhase((prev) => (prev === "playing" ? "fading" : prev));
  }, []);

  // Forzar reproducción en Chrome
  useEffect(() => {
    if (videoRef.current) {
      // Forzar mute por si React no lo aplica correctamente en el DOM
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay bloqueado por el navegador:", err);
      });

      if (videoRef.current.readyState >= 3) {
        setVideoReady(true);
      }
    }
  }, []);

  // Notificar al terminar fade-out
  useEffect(() => {
    if (phase === "fading") {
      const timer = setTimeout(() => {
        setPhase("done");
        onComplete?.();
      }, 800); // duración acelerada del fade-out CSS
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // Timeout de seguridad (Máximo 8 segundos para no trabar al usuario en móvil)
  useEffect(() => {
    const safety = setTimeout(() => {
      startFadeOut();
    }, 8000);
    return () => clearTimeout(safety);
  }, [startFadeOut]);

  if (phase === "done") return null;

  return (
    <div
      onClick={startFadeOut}
      onTouchEnd={startFadeOut}
      style={{
        ...introStyles.overlay,
        opacity: phase === "fading" ? 0 : 1,
        pointerEvents: phase === "fading" ? "none" : "auto",
        cursor: "pointer"
      }}
    >
      {/* Botón de Omitir Video en la esquina superior derecha */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          startFadeOut();
        }}
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          zIndex: 10,
          background: "rgba(10, 25, 47, 0.75)",
          border: "1.5px solid rgba(255, 215, 0, 0.4)",
          color: "#FFD700",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "12.5px",
          fontWeight: "800",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          letterSpacing: "0.5px"
        }}
      >
        <span>Omitir</span>
        <span>➔</span>
      </button>

      {/* Video de fondo */}
      <video
        ref={videoRef}
        src="/videos/portada2.0.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlayThrough={() => setVideoReady(true)}
        onError={startFadeOut}
        onStalled={startFadeOut}
        onLoadedData={() => {
          if (videoRef.current && videoRef.current.readyState >= 3) {
            setVideoReady(true);
          }
        }}
        onEnded={startFadeOut}
        style={introStyles.video}
      />

      {/* Overlay oscuro sutil sobre el video */}
      <div style={introStyles.darkOverlay} />

      {/* Logo central animado */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            animation: "fadeIn 1.2s ease forwards",
            textShadow: "0 4px 30px rgba(0,0,0,0.7)",
          }}
        >
          <img
            src="/mapaicono.png"
            alt="Logo"
            style={{
              width: "80px",
              height: "80px",
              filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.5))",
              animation: "introFloat 3s ease-in-out infinite",
              objectFit: "contain"
            }}
          />
          <span className="logoName" style={introStyles.logoName}>atlan</span>
          <span className="logoTagline" style={introStyles.logoTagline}>Descubrí lo tuyo, viví lo nuestro.</span>
        </div>

        {/* Símbolo de Carga Animado */}
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            animation: "fadeIn 1s ease 1s both",
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid rgba(255,255,255,0.1)",
              borderTopColor: "#D4AF37",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <span
            className="loaderText"
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'LC Mogi', var(--font-outfit), sans-serif",
            }}
          >
            Cargando
          </span>
        </div>
      </div>

      {/* Barra de progreso de 8 segundos */}
      <div style={introStyles.progressBar}>
        <div
          style={{
            ...introStyles.progressFill,
            animation: "introProgress 8s linear forwards, shimmerProgress 2s linear infinite",
            boxShadow: "0 0 10px rgba(212,175,55,0.5)",
          }}
        />
      </div>

      {/* Estilos inyectados para las animaciones del spinner y la barra */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmerProgress {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes introProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>

      {/* Branded panel that covers the Gemini watermark area */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "10px",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 20px 12px 14px",
          background: "linear-gradient(135deg, rgba(10,15,28,0.95) 0%, rgba(20,28,45,0.92) 100%)",
          borderRadius: "14px",
          border: "1px solid rgba(212,175,55,0.25)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          backdropFilter: "blur(12px)",
          pointerEvents: "none",
          minWidth: "175px",
          minHeight: "54px",
        }}
      >
        <img
          src="/mapaicono.png"
          alt=""
          style={{
            width: "34px",
            height: "34px",
            objectFit: "contain",
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
            flexShrink: 0,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            style={{
              fontFamily: "'LC Mogi', var(--font-outfit), sans-serif",
              fontSize: "20px",
              fontWeight: "800",
              color: "#D4AF37",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
            }}
          >
            atlan
          </span>
          <span
            style={{
              fontFamily: "'Delight', var(--font-inter), sans-serif",
              fontSize: "11px",
              fontWeight: "500",
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              lineHeight: 1.2,
              marginTop: "2px",
            }}
          >
            GPS Turístico
          </span>
        </div>
      </div>
    </div>
  );
}

// Estilos
const introStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "#050a14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    fontFamily: "'LC Mogi', var(--font-outfit), system-ui, sans-serif",
    color: "#D4AF37",
    letterSpacing: "0.05em",
    lineHeight: 1,
  },

  logoTagline: {
    fontSize: "clamp(16px, 3vw, 24px)",
    fontWeight: "600",
    fontFamily: "'LC Mogi', var(--font-outfit), sans-serif",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: "0.1em",
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
    fontFamily: "'LC Mogi', var(--font-outfit), sans-serif",
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
