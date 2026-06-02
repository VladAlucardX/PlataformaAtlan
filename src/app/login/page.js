"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();


  // Redireccionar si ya hay sesión activa
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: perfilData } = await supabase
            .from("perfiles")
            .select("rol")
            .eq("id", session.user.id)
            .single();

          if (perfilData?.rol === "dueno" || perfilData?.rol === "admin") {
            router.push("/dashboard");
          } else {
            router.push("/mapa");
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    };
    checkActiveSession();
  }, [router]);

  // Estados
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setErrorMsg(authError.message);
        setLoading(false);
        return;
      }

      if (authData?.user) {
        // Consultar el rol del usuario en la tabla 'perfiles'
        const { data: perfilData, error: perfilError } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", authData.user.id)
          .single();

        if (perfilError) {
          console.error("Error obteniendo perfil:", perfilError);
          // Redirigir al mapa por defecto si hay un fallo
          router.push("/mapa");
          return;
        }

        // Redirigir según el rol
        if (perfilData?.rol === "dueno" || perfilData?.rol === "admin") {
          router.push("/dashboard");
        } else {
          router.push("/mapa");
        }
      }
    } catch (err) {
      console.error("Login catch error:", err);
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Orbes de fondo gradiente */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      {/* Header con Logo y Selector de Idioma */}
      <header style={styles.header}>
        <Link href="/" style={styles.logo}>
          <span style={styles.logoIcon}>🗺️</span>
          <span style={styles.logoText}>Atlan</span>
        </Link>
        <LanguageToggle variant="pill" />
      </header>

      {/* Tarjeta de Login Glassmorphism */}
      <div style={styles.card} className="glass-card animate-fade-in-up">
        <h2 style={styles.title}>{t("auth.loginTitle")}</h2>
        <p style={styles.subtitle}>{t("auth.loginSubtitle")}</p>

        {errorMsg && (
          <div style={styles.errorBanner} className="animate-fade-in">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t("auth.email")}</label>
            <input
              type="email"
              required
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={styles.label}>{t("auth.password")}</label>
              <Link href="#" style={styles.forgotLink}>
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? t("common.loading") : t("auth.loginButton")}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>{t("auth.orContinueWith")}</span>
        </div>

        {/* Login con Proveedores (Estilo Demo) */}
        <button
          onClick={async () => {
            alert("Acceso rápido con Google (Demo)");
          }}
          style={styles.googleBtn}
          disabled={loading}
        >
          <svg style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.5 0-6.35-2.85-6.35-6.35s2.85-6.35 6.35-6.35c1.63 0 3.12.62 4.26 1.74l3.1-3.1C18.9 2.19 15.77 1 12.24 1 6.03 1 1 6.03 1 12.24s5.03 11.24 11.24 11.24c5.89 0 10.9-4.22 10.9-11.24 0-.668-.08-1.317-.23-1.954H12.24z"/>
          </svg>
          {t("auth.googleButton")}
        </button>

        <div style={styles.footerText}>
          {t("auth.noAccount")}{" "}
          <Link href="/registro" style={styles.link}>
            {t("auth.registerButton")}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── ESTILOS PREMIUM INLINE ──────────────────────────────────────────────────
const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background: "#0a0f1c",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "24px",
    fontFamily: "var(--font-outfit), sans-serif",
  },
  orb1: {
    position: "absolute",
    top: "10%",
    left: "15%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    zIndex: 1,
    pointerEvents: "none",
  },
  orb2: {
    position: "absolute",
    bottom: "10%",
    right: "15%",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(0,0,0,0) 75%)",
    borderRadius: "50%",
    zIndex: 1,
    pointerEvents: "none",
  },
  header: {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    padding: "24px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
  },
  logoIcon: {
    fontSize: "24px",
  },
  logoText: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#fff",
    letterSpacing: "-0.02em",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "40px",
    borderRadius: "24px",
    background: "rgba(16, 22, 40, 0.65)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    textAlign: "center",
    margin: "0 0 6px 0",
    background: "linear-gradient(135deg, #fff 0%, #a1a1aa 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    textAlign: "center",
    margin: "0 0 24px 0",
    lineHeight: "1.4",
  },
  errorBanner: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#f87171",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#e2e8f0",
  },
  forgotLink: {
    fontSize: "12.5px",
    color: "#D4AF37",
    textDecoration: "none",
    fontWeight: "600",
    transition: "opacity 0.2s",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
  },
  submitBtn: {
    marginTop: "10px",
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #D4AF37 0%, #b89324 100%)",
    color: "#0a0f1c",
    border: "none",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(212, 175, 55, 0.3)",
    transition: "all 0.25s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "24px 0",
  },
  dividerText: {
    padding: "0 12px",
    color: "#52525b",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  googleBtn: {
    width: "100%",
    padding: "13px",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "12px",
    color: "#fff",
    fontWeight: "700",
    fontSize: "13.5px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.2s",
  },
  footerText: {
    marginTop: "24px",
    fontSize: "13.5px",
    color: "#a1a1aa",
    textAlign: "center",
  },
  link: {
    color: "#10b981",
    textDecoration: "none",
    fontWeight: "700",
  },
};
