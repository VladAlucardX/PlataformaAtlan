"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import Icon from "@/components/ui/Icon";

export default function ResetPasswordPage() {
  const { lang } = useTranslation();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Escuchar el evento de recuperación de contraseña de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery event received");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password.length < 6) {
      setErrorMsg(
        lang === "en"
          ? "Password must be at least 6 characters."
          : "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(
        lang === "en"
          ? "Passwords do not match."
          : "Las contraseñas no coinciden."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(
          lang === "en"
            ? "Password updated successfully! Redirecting to login..."
            : "¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión..."
        );
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      console.error("Reset password catch error:", err);
      setErrorMsg(
        lang === "en"
          ? "An unexpected error occurred."
          : "Ocurrió un error inesperado."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link href="/" style={styles.logo}>
          <img
            src="/mapaicono.png"
            alt="Logo Atlan"
            style={{ width: "32px", height: "32px", objectFit: "contain" }}
          />
          <span className="logoText" style={styles.logoText}>atlan</span>
        </Link>
        <LanguageToggle variant="pill" />
      </header>

      <div style={styles.card} className="clay-card-static no-sheen animate-fade-in-up">
        <h2 style={styles.title}>
          {lang === "en" ? "Set New Password" : "Nueva Contraseña"}
        </h2>
        <p style={styles.subtitle}>
          {lang === "en"
            ? "Enter your new password below."
            : "Ingresa tu nueva contraseña a continuación."}
        </p>

        {errorMsg && (
          <div style={styles.errorBanner} className="animate-fade-in">
            <Icon name="alertTriangle" size={16} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={styles.successBanner} className="animate-fade-in">
            <Icon name="checkCircle" size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleResetPassword} style={styles.form} autoComplete="off">
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              {lang === "en" ? "New Password" : "Nueva Contraseña"}
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="clay-input"
              style={styles.input}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              {lang === "en" ? "Confirm Password" : "Confirmar Contraseña"}
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="clay-input"
              style={styles.input}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="clay-btn-green no-sheen"
            style={styles.submitBtn}
            disabled={loading}
          >
            <span>{loading ? (lang === "en" ? "Saving..." : "Guardando...") : (lang === "en" ? "Update Password" : "Actualizar Contraseña")}</span>
          </button>
        </form>
      </div>

      <Link
        href="/"
        style={styles.homeBtn}
        className="clay-tab no-sheen"
      >
        <img src="/images/home.svg" alt="Inicio" style={{ width: "16px", height: "16px", objectFit: "contain" }} />
        <span>{lang === "en" ? "Home" : "Inicio"}</span>
      </Link>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background: "#030812",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "var(--font-outfit), sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    position: "absolute",
    top: "20px",
    left: "24px",
    right: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
  },
  logoText: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#FFD700",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(16px)",
    borderRadius: "24px",
    padding: "36px 32px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    position: "relative",
    zIndex: 2,
  },
  title: {
    margin: "0 0 6px 0",
    fontSize: "24px",
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 24px 0",
    fontSize: "13.5px",
    color: "#64748B",
    textAlign: "center",
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
    fontWeight: "750",
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    fontSize: "14px",
    borderRadius: "12px",
    border: "1px solid #CBD5E1",
    outline: "none",
  },
  submitBtn: {
    width: "100%",
    marginTop: "10px",
    padding: "13px",
    fontSize: "15px",
    fontWeight: "800",
    background: "linear-gradient(145deg, #1FCC5C 0%, #17AA4A 70%, #128A3C 100%)",
    color: "#FFFFFF",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
  },
  errorBanner: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: "#DC2626",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  successBanner: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    color: "#16A34A",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  homeBtn: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "20px",
    background: "rgba(255, 255, 255, 0.9)",
    color: "#1E293B",
    fontSize: "13px",
    fontWeight: "750",
    textDecoration: "none",
    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
    zIndex: 10,
  },
};
