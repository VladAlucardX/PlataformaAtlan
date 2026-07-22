"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function RegisterPage() {
  const { t, lang } = useTranslation();
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

          // Redirigir siempre a la página de bienvenida (/)
          router.push("/");
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    };
    checkActiveSession();
  }, [router]);

  // Estados
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rol, setRol] = useState("turista"); // 'turista' | 'dueno'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Validar contraseñas
    if (password !== confirmPassword) {
      setErrorMsg(lang === "en" ? "Passwords do not match" : "Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      // Registrar en Supabase Auth pasándole los metadatos al trigger de base de datos
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo: fullName,
            rol: rol,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        setSuccessMsg(
          lang === "en"
            ? "Account created successfully! Redirecting..."
            : "¡Cuenta creada exitosamente! Redirigiendo..."
        );

        // Retraso de 1.5s para mostrar el mensaje de éxito antes de redirigir
        setTimeout(() => {
          // Redirigir siempre a la página de bienvenida (/)
          router.push("/");
        }, 1500);
      }
    } catch (err) {
      console.error("Register catch error:", err);
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <header style={styles.header}>
        <Link href="/" style={styles.logo}>
          <span style={styles.logoIcon}>🗺️</span>
          <span style={styles.logoText}>Atlan</span>
        </Link>
        <LanguageToggle variant="pill" />
      </header>

      <div style={styles.card} className="glass-card animate-fade-in-up">
        <h2 style={styles.title}>{t("auth.registerTitle")}</h2>
        <p style={styles.subtitle}>{t("auth.registerSubtitle")}</p>

        {errorMsg && <div style={styles.errorBanner}>⚠️ {errorMsg}</div>}
        {successMsg && <div style={styles.successBanner}>✅ {successMsg}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          {/* Selector de Rol Premium */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t("addPoint.category")}</label>
            <div style={styles.roleSelector}>
              <button
                type="button"
                onClick={() => setRol("turista")}
                style={{
                  ...styles.roleBtn,
                  ...(rol === "turista" ? styles.roleBtnActiveTurista : {}),
                }}
              >
                <span style={{ fontSize: "18px" }}>🧳</span>
                <span style={{ fontWeight: "750" }}>
                  {lang === "en" ? "Tourist" : "Turista"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRol("dueno")}
                style={{
                  ...styles.roleBtn,
                  ...(rol === "dueno" ? styles.roleBtnActiveDueno : {}),
                }}
              >
                <span style={{ fontSize: "18px" }}>🏢</span>
                <span style={{ fontWeight: "750" }}>
                  {lang === "en" ? "Business Owner" : "Propietario"}
                </span>
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t("auth.fullName")}</label>
            <input
              type="text"
              required
              placeholder={lang === "en" ? "John Doe" : "Juan Pérez"}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

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
            <label style={styles.label}>{t("auth.password")}</label>
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

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t("auth.confirmPassword")}</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? t("common.loading") : t("auth.registerButton")}
          </button>
        </form>

        <div style={styles.footerText}>
          {t("auth.hasAccount")}{" "}
          <Link href="/login" style={styles.link}>
            {t("auth.loginButton")}
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "40px 24px 24px 24px",
    fontFamily: "var(--font-outfit), sans-serif",
  },
  orb1: {
    position: "absolute",
    top: "5%",
    right: "10%",
    width: "450px",
    height: "450px",
    background: "radial-gradient(circle, rgba(23, 170, 74, 0.08) 0%, rgba(255,255,255,0) 70%)",
    borderRadius: "50%",
    zIndex: 1,
    pointerEvents: "none",
  },
  orb2: {
    position: "absolute",
    bottom: "5%",
    left: "10%",
    width: "450px",
    height: "450px",
    background: "radial-gradient(circle, rgba(255, 215, 0, 0.10) 0%, rgba(255,255,255,0) 70%)",
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
    fontSize: "24px",
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: "-0.02em",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    padding: "40px",
    borderRadius: "24px",
    background: "#FFFFFF",
    border: "1px solid rgba(20, 109, 158, 0.12)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
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
    background: "linear-gradient(135deg, #1A1A2E 0%, #4A5568 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: "14px",
    color: "#4A5568",
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
  successBanner: {
    background: "rgba(23, 170, 74, 0.10)",
    border: "1px solid rgba(23, 170, 74, 0.20)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#17AA4A",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#1A1A2E",
  },
  roleSelector: {
    display: "flex",
    gap: "10px",
    marginTop: "4px",
  },
  roleBtn: {
    flex: 1,
    padding: "12px",
    background: "rgba(20, 109, 158, 0.03)",
    border: "1px solid rgba(20, 109, 158, 0.10)",
    borderRadius: "12px",
    color: "#4A5568",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  roleBtnActiveTurista: {
    background: "rgba(23, 170, 74, 0.10)",
    border: "1.5px solid #17AA4A",
    color: "#17AA4A",
    boxShadow: "0 0 12px rgba(23, 170, 74, 0.15)",
  },
  roleBtnActiveDueno: {
    background: "rgba(255, 215, 0, 0.10)",
    border: "1.5px solid #FFD700",
    color: "#E6C200",
    boxShadow: "0 0 12px rgba(255, 215, 0, 0.15)",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(20, 109, 158, 0.04)",
    border: "1px solid rgba(20, 109, 158, 0.12)",
    borderRadius: "12px",
    color: "#1A1A2E",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
  },
  submitBtn: {
    marginTop: "10px",
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(23, 170, 74, 0.3)",
    transition: "all 0.25s",
  },
  footerText: {
    marginTop: "20px",
    fontSize: "13.5px",
    color: "#4A5568",
    textAlign: "center",
  },
  link: {
    color: "#146D9E",
    textDecoration: "none",
    fontWeight: "700",
  },
};
