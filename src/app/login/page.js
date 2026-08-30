"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import Icon from "@/components/ui/Icon";

function formatAuthError(msg, lang) {
  if (!msg) return "";
  if (
    msg.includes("Invalid login credentials") ||
    msg.includes("invalid_credentials") ||
    msg.includes("Credenciales")
  ) {
    return lang === "en"
      ? "Invalid login credentials."
      : "Credenciales de inicio de sesión no válidas.";
  }
  if (msg.includes("Email not confirmed") || msg.includes("no verificado")) {
    return lang === "en"
      ? "Email not confirmed. Please check your inbox."
      : "Correo no verificado. Por favor revisa tu bandeja de entrada.";
  }
  return msg;
}

export default function LoginPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  // Redireccionar si ya hay sesión activa
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.push("/");
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    };
    checkActiveSession();
  }, [router]);

  // Estados del flujo
  const [step, setStep] = useState("credentials"); // 'credentials' | 'otp' | 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 minutos en segundos
  const [canResend, setCanResend] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(lang === "en" ? "Please enter your email" : "Por favor ingresa tu correo electrónico");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setForgotSent(true);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setErrorMsg(lang === "en" ? "Error sending reset email" : "Error al enviar el correo de recuperación");
    } finally {
      setLoading(false);
    }
  };

  // Refs para los inputs OTP
  const otpInputRefs = useRef([]);

  // Timer de cuenta regresiva para el OTP
  useEffect(() => {
    if (step !== "otp") return;
    if (otpCountdown <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, otpCountdown]);

  // Paso 1: Validar credenciales y enviar OTP
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Verificar que las credenciales son correctas
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (
          authError.message?.includes("Invalid login credentials") ||
          authError.message?.includes("invalid_credentials") ||
          authError.status === 400
        ) {
          setErrorMsg(
            lang === "en"
              ? "Invalid login credentials."
              : "Credenciales de inicio de sesión no válidas."
          );
        } else {
          setErrorMsg(authError.message);
        }
        setLoading(false);
        return;
      }

      // Credenciales correctas — cerrar sesión temporal para que no entre sin OTP
      await supabase.auth.signOut();

      // Enviar código OTP al correo del usuario
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // No crear usuario nuevo, solo enviar OTP
        },
      });

      const isDevOrTestEmail =
        email.endsWith("@atlan.com") ||
        email.endsWith("@demo.com") ||
        email.endsWith("@test.com") ||
        (typeof window !== "undefined" && window.location.hostname === "localhost");

      if (otpError && !isDevOrTestEmail) {
        setErrorMsg(
          lang === "en"
            ? "Failed to send verification code. Try again."
            : "Error al enviar el código de verificación. Intenta de nuevo."
        );
        setLoading(false);
        return;
      }

      // Pasar al paso 2
      setStep("otp");
      setOtpCountdown(300);
      setCanResend(false);
      setOtpCode(["", "", "", "", "", ""]);
    } catch (err) {
      console.error("Login catch error:", err);
      setErrorMsg(
        lang === "en"
          ? "An unexpected error occurred."
          : "Ocurrió un error inesperado."
      );
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const code = otpCode.join("");
    if (code.length !== 6) {
      setErrorMsg(
        lang === "en"
          ? "Please enter the complete 6-digit code."
          : "Ingresa el código completo de 6 dígitos."
      );
      setLoading(false);
      return;
    }

    try {
      const isDevOrTestEmail =
        email.endsWith("@atlan.com") ||
        email.endsWith("@demo.com") ||
        email.endsWith("@test.com") ||
        (typeof window !== "undefined" && window.location.hostname === "localhost");

      // 1. Soporte para Código Maestro de Desarrollo (123456)
      if (code === "123456" && isDevOrTestEmail) {
        const { data: devAuthData, error: devAuthError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!devAuthError && devAuthData?.user) {
          router.push("/");
          return;
        }
      }

      // 2. Verificación real con el código OTP recibido en el correo
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error) {
        setErrorMsg(
          lang === "en"
            ? "Invalid or expired code. Try again."
            : "Código inválido o expirado. Intenta de nuevo."
        );
        setLoading(false);
        return;
      }

      if (data?.user) {
        router.push("/");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setErrorMsg(
        lang === "en"
          ? "An unexpected error occurred."
          : "Ocurrió un error inesperado."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código OTP
  const handleResendOTP = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (error) {
        setErrorMsg(
          lang === "en"
            ? "Failed to resend code."
            : "Error al reenviar el código."
        );
      } else {
        setOtpCountdown(300);
        setCanResend(false);
        setOtpCode(["", "", "", "", "", ""]);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
      // Si no hay error, Supabase redirige automáticamente a Google
    } catch (err) {
      console.error("Google login error:", err);
      setErrorMsg(
        lang === "en"
          ? "An unexpected error occurred."
          : "Ocurrió un error inesperado."
      );
      setLoading(false);
    }
  };

  // Manejo de inputs OTP individuales
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Solo dígitos
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1); // Solo un carácter
    setOtpCode(newOtp);

    // Auto-avanzar al siguiente input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Pegar código OTP completo
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtpCode(newOtp);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Formatear cuenta regresiva
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={styles.container}>
      {/* Flor Sacuanjoche decorativa en esquina inferior izquierda */}
      <img
        src="/images/flor.svg"
        alt=""
        style={{
          position: "fixed",
          bottom: "-30px",
          left: "-30px",
          width: "360px",
          height: "340px",
          objectFit: "contain",
          filter: "drop-shadow(0 4px 20px rgba(255, 215, 0, 0.4))",
          pointerEvents: "none",
          zIndex: 1,
          transform: "rotate(15deg)"
        }}
      />


      {/* Header con Logo y Selector de Idioma */}
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

      {/* Tarjeta de Login Glassmorphism */}
      <div style={styles.card} className="clay-card-static no-sheen animate-fade-in-up">

        {step === "credentials" && (
          <>
            <h2 style={styles.title}>{t("auth.loginTitle")}</h2>
            <p style={styles.subtitle}>{t("auth.loginSubtitle")}</p>

            {errorMsg && (
              <div style={styles.errorBanner} className="animate-fade-in">
                <Icon name="alertTriangle" size={16} /> {formatAuthError(errorMsg, lang)}
              </div>
            )}

            <form onSubmit={handleLogin} style={styles.form} autoComplete="off">
              <div style={styles.inputGroup}>
                <label style={styles.label}>{t("auth.email")}</label>
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="clay-input"
                  style={styles.input}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <div style={styles.inputGroup}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={styles.label}>{t("auth.password")}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("forgot");
                      setErrorMsg("");
                      setForgotSent(false);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#146D9E",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "700"
                    }}
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="clay-input"
                  style={styles.input}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                className="clay-btn-green no-sheen"
                style={{
                  width: '100%',
                  marginTop: '14px',
                  padding: '14px 30px',
                  fontSize: '16.5px',
                  fontWeight: '800',
                  background: 'linear-gradient(145deg, #1FCC5C 0%, #17AA4A 70%, #128A3C 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  borderRadius: '9999px',
                  boxShadow: '0 10px 24px -4px rgba(23, 170, 74, 0.45)'
                }}
                disabled={loading}
              >
                <img
                  src="/images/perfil.svg"
                  alt="Perfil"
                  style={{ width: '20px', height: '20px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                />
                <span>{loading ? t("common.loading") : t("auth.loginButton")}</span>
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerText}>{t("auth.orContinueWith")}</span>
            </div>

            {/* Login con Google */}
            <button
              onClick={handleGoogleLogin}
              className="clay-tab"
              style={{ width: '100%', justifyContent: 'center', gap: '10px', padding: '13px', fontSize: '13.5px', fontWeight: '700' }}
              disabled={loading}
            >
              <svg style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {lang === "en" ? "Continue with Google" : "Continuar con Google"}
            </button>

            <div style={styles.footerText}>
              {t("auth.noAccount")}{" "}
              <Link href="/registro" style={styles.link}>
                {t("auth.registerButton")}
              </Link>
            </div>
          </>
        )}

        {/* ── PASO 2: Verificación OTP ── */}
        {step === "otp" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(23, 170, 74, 0.12)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}>
                <Icon name="lock" size={28} />
              </div>
            </div>

            <h2 style={styles.title}>
              {lang === "en" ? "Verify Your Identity" : "Verifica tu Identidad"}
            </h2>
            <p style={{ ...styles.subtitle, marginBottom: "8px" }}>
              {lang === "en"
                ? "We sent a 6-digit code to"
                : "Enviamos un código de 6 dígitos a"}
            </p>
            <p style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#17AA4A",
              textAlign: "center",
              margin: "0 0 24px 0",
              wordBreak: "break-all",
            }}>
              {email}
            </p>

            {errorMsg && (
              <div style={styles.errorBanner} className="animate-fade-in">
                <Icon name="alertTriangle" size={16} /> {formatAuthError(errorMsg, lang)}
              </div>
            )}

            <form onSubmit={handleVerifyOTP} style={styles.form}>
              {/* Inputs OTP de 6 dígitos */}
              <div style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                marginBottom: "20px",
              }}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    disabled={loading}
                    style={{
                      width: "50px",
                      height: "56px",
                      textAlign: "center",
                      fontSize: "24px",
                      fontWeight: "800",
                      fontFamily: "var(--font-outfit), monospace",
                      border: digit
                        ? "2px solid #17AA4A"
                        : "2px solid rgba(20, 109, 158, 0.15)",
                      borderRadius: "14px",
                      background: digit
                        ? "rgba(23, 170, 74, 0.06)"
                        : "#FAFBFC",
                      color: "#1A1A2E",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                  />
                ))}
              </div>

              {typeof window !== "undefined" && window.location.hostname === "localhost" && (
                <div style={{
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#146D9E",
                  background: "rgba(20, 109, 158, 0.08)",
                  border: "1px solid rgba(20, 109, 158, 0.15)",
                  padding: "6px 12px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}>
                  <Icon name="info" size={14} />
                  <span>Modo de prueba: usa tu correo real o el código <strong>123456</strong></span>
                </div>
              )}

              <button type="submit" className="clay-btn-gold" style={{ width: '100%' }} disabled={loading}>
                {loading
                  ? t("common.loading")
                  : lang === "en"
                    ? "Verify Code"
                    : "Verificar Código"}
              </button>
            </form>

            {/* Timer y reenvío */}
            <div style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "13px",
              color: "#4A5568",
            }}>
              {otpCountdown > 0 ? (
                <p style={{ margin: 0 }}>
                  {lang === "en" ? "Code expires in " : "El código expira en "}
                  <span style={{ fontWeight: "800", color: "#17AA4A" }}>
                    {formatTime(otpCountdown)}
                  </span>
                </p>
              ) : (
                <p style={{ margin: 0, color: "#9CA3AF" }}>
                  {lang === "en" ? "Code expired." : "El código ha expirado."}
                </p>
              )}

              <button
                onClick={handleResendOTP}
                disabled={!canResend || loading}
                style={{
                  background: "none",
                  border: "none",
                  color: canResend ? "#17AA4A" : "#9CA3AF",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: canResend ? "pointer" : "default",
                  marginTop: "10px",
                  textDecoration: canResend ? "underline" : "none",
                  transition: "color 0.2s",
                }}
              >
                {lang === "en" ? "Resend code" : "Reenviar código"}
              </button>
            </div>

            {/* Volver al paso 1 */}
            <button
              onClick={() => {
                setStep("credentials");
                setErrorMsg("");
                setOtpCode(["", "", "", "", "", ""]);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "none",
                border: "none",
                color: "#4A5568",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "16px",
                width: "100%",
              }}
            >
              <Icon name="arrowLeft" size={14} />
              {lang === "en" ? "Back to login" : "Volver al inicio de sesión"}
            </button>
          </>
        )}

        {step === "forgot" && (
          <>
            <h2 style={styles.title}>{lang === "en" ? "Reset Password" : "Recuperar Contraseña"}</h2>
            <p style={styles.subtitle}>
              {lang === "en"
                ? "Enter your email address and we'll send you a link to reset your password."
                : "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."}
            </p>

            {errorMsg && (
              <div style={styles.errorBanner} className="animate-fade-in">
                <Icon name="alertTriangle" size={16} /> {formatAuthError(errorMsg, lang)}
              </div>
            )}

            {forgotSent ? (
              <div style={{
                background: "rgba(23, 170, 74, 0.12)",
                border: "1px solid rgba(23, 170, 74, 0.3)",
                borderRadius: "14px",
                padding: "16px",
                textAlign: "center",
                margin: "16px 0"
              }}>
                <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "800", color: "#17AA4A" }}>
                  ✉️ {lang === "en" ? "Check your email!" : "¡Revisa tu correo!"}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                  {lang === "en"
                    ? `We sent password reset instructions to ${email}. Check your inbox or spam folder.`
                    : `Hemos enviado las instrucciones para restablecer tu contraseña a ${email}. Revisa tu bandeja de entrada o spam.`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={styles.form} autoComplete="off">
                <div style={styles.inputGroup}>
                  <label style={styles.label}>{t("auth.email")}</label>
                  <input
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="clay-input"
                    style={styles.input}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  className="clay-btn-green no-sheen"
                  style={{
                    width: '100%',
                    marginTop: '14px',
                    padding: '14px 30px',
                    fontSize: '15.5px',
                    fontWeight: '800',
                    background: 'linear-gradient(145deg, #1FCC5C 0%, #17AA4A 70%, #128A3C 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    borderRadius: '9999px',
                    boxShadow: '0 10px 24px -4px rgba(23, 170, 74, 0.45)'
                  }}
                  disabled={loading}
                >
                  <span>{loading ? t("common.loading") : (lang === "en" ? "Send Reset Link" : "Enviar Enlace de Recuperación")}</span>
                </button>
              </form>
            )}

            <button
              onClick={() => {
                setStep("credentials");
                setErrorMsg("");
                setForgotSent(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "none",
                border: "none",
                color: "#4A5568",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "20px",
                width: "100%",
              }}
            >
              <Icon name="arrowLeft" size={14} />
              {lang === "en" ? "Back to login" : "Volver al inicio de sesión"}
            </button>
          </>
        )}
      </div>

      {/* Botón de Inicio en la esquina inferior derecha */}
      <Link
        href="/"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(12px)",
          color: "#1E293B",
          padding: "10px 18px",
          borderRadius: "999px",
          fontWeight: "700",
          fontSize: "14.5px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
          textDecoration: "none",
          zIndex: 10,
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)";
        }}
      >
        <img
          src="/images/home.svg"
          alt=""
          style={{ width: "20px", height: "20px", objectFit: "contain" }}
        />
        <span>{lang === "en" ? "Home" : "Inicio"}</span>
      </Link>
    </div>
  );
}

// Estilos
const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background: "url('/images/loginbg2.jpeg') center top / cover no-repeat",
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
    background: "radial-gradient(circle, rgba(23, 170, 74, 0.10) 0%, rgba(255,255,255,0) 70%)",
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
    background: "radial-gradient(circle, rgba(23, 170, 74, 0.08) 0%, rgba(255,255,255,0) 75%)",
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
    fontSize: "28px",
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: "-0.5px",
    fontFamily: "'LC Mogi', 'LC Mogi A', 'LC Mogi B', 'LC Mogi C', var(--font-outfit), sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "40px",
    borderRadius: "28px",
    background: "rgba(255, 255, 255, 0.94)",
    border: "2px solid rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 1)",
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
    color: "#1A1A2E",
    letterSpacing: "-0.01em",
    fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
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
    color: "#1A1A2E",
  },
  forgotLink: {
    fontSize: "12.5px",
    color: "#146D9E",
    textDecoration: "none",
    fontWeight: "600",
    transition: "opacity 0.2s",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "24px 0",
  },
  dividerText: {
    padding: "0 12px",
    color: "#9CA3AF",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  footerText: {
    marginTop: "24px",
    fontSize: "13.5px",
    color: "#4A5568",
    textAlign: "center",
  },
  link: {
    color: "#17AA4A",
    textDecoration: "none",
    fontWeight: "700",
  },
};
