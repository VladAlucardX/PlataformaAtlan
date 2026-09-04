"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import Icon from "@/components/ui/Icon";

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
  const [rol, setRol] = useState("turista"); // 'turista' | 'dueno' | 'guia_turistico'
  const [deptGuia, setDeptGuia] = useState("León");
  const [especialidadGuia, setEspecialidadGuia] = useState("Senderismo y Volcanes");
  const [idiomasGuia, setIdiomasGuia] = useState("Español, Inglés");
  const [telefonoGuia, setTelefonoGuia] = useState("");
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

    const cleanEmail = email.trim().toLowerCase();

    try {
      // Registrar en Supabase Auth pasándole los metadatos al trigger de base de datos
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            nombre_completo: fullName,
            rol: rol,
            ...(rol === "guia_turistico" ? {
              departamento_principal: deptGuia,
              especialidad: especialidadGuia,
              idiomas: idiomasGuia,
              telefono_contacto: telefonoGuia,
            } : {}),
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Si el rol es guía turístico, intentar registrar también en guias_turisticos
        if (rol === "guia_turistico") {
          try {
            await supabase.from("guias_turisticos").insert({
              id: data.user.id,
              departamento_principal: deptGuia,
              especialidad: especialidadGuia,
              idiomas: idiomasGuia,
              telefono_contacto: telefonoGuia,
              whatsapp: telefonoGuia,
              activo: true,
            });
          } catch (gErr) {
            console.warn("Notice: could not auto-create guide profile row:", gErr);
          }
        }

        setSuccessMsg(
          lang === "en"
            ? "Account created successfully! Redirecting..."
            : "¡Cuenta creada exitosamente! Redirigiendo..."
        );

        // Retraso de 1.5s para mostrar el mensaje de éxito antes de redirigir
        setTimeout(() => {
          router.push(rol === "guia_turistico" ? "/guias" : "/");
        }, 1500);
      }
    } catch (err) {
      console.error("Register catch error:", err);
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error("Google signup error:", err);
      setErrorMsg(lang === "en" ? "Error connecting with Google" : "Error al conectar con Google");
      setLoading(false);
    }
  };

  const DEPARTAMENTOS_LIST = [
    "Managua", "León", "Chinandega", "Granada", "Masaya", "Carazo", "Rivas",
    "Matagalpa", "Jinotega", "Estelí", "Madriz", "Nueva Segovia", "Boaco",
    "Chontales", "Río San Juan", "RACCN", "RACCS"
  ];

  return (
    <div style={styles.container}>
      {/* Fondo volteado horizontalmente cubriendo el 100% sin franjas ni costuras */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/images/registrobg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "right center",
          backgroundRepeat: "no-repeat",
          transform: "scaleX(-1)",
          zIndex: 0,
        }}
      />

      {/* Tortuga SVG en la esquina inferior izquierda */}
      <img
        src="/images/tortuga.svg"
        alt="Tortuga"
        style={{
          position: "absolute",
          bottom: "-40px",
          left: "-30px",
          width: "450px",
          height: "450px",
          objectFit: "contain",
          zIndex: 3,
          pointerEvents: "none",
          filter: "brightness(0) saturate(100%) invert(18%) sepia(45%) saturate(1200%) hue-rotate(95deg) opacity(0.88)",
        }}
      />

      <header style={styles.header}>
        <Link href="/" style={styles.logo}>
          <img
            src="/mapaicono.png"
            alt="Logo Atlan"
            style={{ width: "30px", height: "30px", objectFit: "contain" }}
          />
          <span className="logoText" style={styles.logoText}>atlan</span>
        </Link>
        <LanguageToggle variant="pill" />
      </header>

      <div style={{ ...styles.card, maxWidth: rol === "guia_turistico" ? "560px" : "520px" }} className="clay-card-static no-sheen register-card animate-fade-in-up">
        <h2 style={styles.title}>{t("auth.registerTitle")}</h2>
        <p style={styles.subtitle}>{t("auth.registerSubtitle")}</p>

        {errorMsg && <div style={styles.errorBanner}><Icon name="alertTriangle" size={15} /> {errorMsg}</div>}
        {successMsg && <div style={styles.successBanner}><Icon name="checkCircle" size={15} /> {successMsg}</div>}

        <form onSubmit={handleRegister} style={styles.form} autoComplete="off">
          {/* Selector de Rol Premium Compacto (3 opciones) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>{lang === "en" ? "Select your Role" : "Selecciona tu Rol"}</label>
            <div style={styles.roleSelector}>
              <button
                type="button"
                onClick={() => setRol("turista")}
                className={`clay-role-btn no-sheen ${rol === "turista" ? "active-turista" : ""}`}
                style={{
                  ...styles.roleBtnCompact,
                  border: rol === "turista" ? "1.5px solid #17AA4A" : "1px solid rgba(20, 109, 158, 0.12)",
                  background: rol === "turista" ? "rgba(23, 170, 74, 0.10)" : "rgba(255, 255, 255, 0.6)",
                  color: rol === "turista" ? "#17AA4A" : "#4A5568",
                }}
              >
                <img
                  src="/images/perfil.svg"
                  alt="Turista"
                  style={{
                    width: "20px",
                    height: "20px",
                    objectFit: "contain",
                    filter: rol === "turista"
                      ? "brightness(0) saturate(100%) invert(48%) sepia(85%) saturate(1400%) hue-rotate(100deg)"
                      : "brightness(0) opacity(0.55)"
                  }}
                />
                <span style={{ fontWeight: "750", fontSize: "13px" }}>
                  {lang === "en" ? "Tourist" : "Turista"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRol("dueno")}
                className={`clay-role-btn no-sheen ${rol === "dueno" ? "active-dueno" : ""}`}
                style={{
                  ...styles.roleBtnCompact,
                  border: rol === "dueno" ? "1.5px solid #FFD700" : "1px solid rgba(20, 109, 158, 0.12)",
                  background: rol === "dueno" ? "rgba(255, 215, 0, 0.12)" : "rgba(255, 255, 255, 0.6)",
                  color: rol === "dueno" ? "#D9B200" : "#4A5568",
                }}
              >
                <img
                  src="/images/edificio.svg"
                  alt="Propietario"
                  style={{
                    width: "20px",
                    height: "20px",
                    objectFit: "contain",
                    filter: rol === "dueno"
                      ? "brightness(0) saturate(100%) invert(75%) sepia(90%) saturate(1200%) hue-rotate(350deg)"
                      : "brightness(0) opacity(0.55)"
                  }}
                />
                <span style={{ fontWeight: "750", fontSize: "13px" }}>
                  {lang === "en" ? "Owner" : "Propietario"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRol("guia_turistico")}
                className={`clay-role-btn no-sheen ${rol === "guia_turistico" ? "active-guia" : ""}`}
                style={{
                  ...styles.roleBtnCompact,
                  border: rol === "guia_turistico" ? "1.5px solid #0EA5E9" : "1px solid rgba(20, 109, 158, 0.12)",
                  background: rol === "guia_turistico" ? "rgba(14, 165, 233, 0.12)" : "rgba(255, 255, 255, 0.6)",
                  color: rol === "guia_turistico" ? "#0284C7" : "#4A5568",
                }}
              >
                <Icon name="compass" size={20} color={rol === "guia_turistico" ? "#0284C7" : "#64748B"} />
                <span style={{ fontWeight: "750", fontSize: "13px" }}>
                  {lang === "en" ? "Tour Guide" : "Guía Turístico"}
                </span>
              </button>
            </div>
          </div>

          {/* Cuadrícula de 2 columnas para campos principales */}
          <div style={styles.grid2Col} className="register-grid-2col">
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t("auth.fullName")}</label>
              <input
                type="text"
                required
                placeholder={lang === "en" ? "John Doe" : "Juan Pérez"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="clay-input"
                style={styles.inputCompact}
                disabled={loading}
                autoComplete="off"
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
                className="clay-input"
                style={styles.inputCompact}
                disabled={loading}
                autoComplete="off"
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
                className="clay-input"
                style={styles.inputCompact}
                disabled={loading}
                autoComplete="new-password"
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
                className="clay-input"
                style={styles.inputCompact}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Campos adicionales de Guía Turístico */}
          {rol === "guia_turistico" && (
            <div style={{
              background: "rgba(14, 165, 233, 0.05)",
              border: "1px solid rgba(14, 165, 233, 0.2)",
              borderRadius: "14px",
              padding: "12px 14px",
              marginTop: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "#0284C7", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="compass" size={14} color="#0284C7" />
                {lang === "en" ? "Guide Profile Details" : "Datos de tu Perfil de Guía"}
              </div>

              <div style={styles.grid2Col}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>{lang === "en" ? "Primary Department" : "Departamento Principal"}</label>
                  <select
                    value={deptGuia}
                    onChange={(e) => setDeptGuia(e.target.value)}
                    className="clay-input"
                    style={{ ...styles.inputCompact, backgroundColor: "#FFF" }}
                  >
                    {DEPARTAMENTOS_LIST.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>{lang === "en" ? "Specialty" : "Especialidad"}</label>
                  <select
                    value={especialidadGuia}
                    onChange={(e) => setEspecialidadGuia(e.target.value)}
                    className="clay-input"
                    style={{ ...styles.inputCompact, backgroundColor: "#FFF" }}
                  >
                    <option value="Senderismo y Volcanes">Senderismo y Volcanes</option>
                    <option value="Cultura e Historia">Cultura e Historia</option>
                    <option value="Avistamiento de Aves">Avistamiento de Aves</option>
                    <option value="Playa y Surf">Playa y Surf</option>
                    <option value="Gastronomía Tradicional">Gastronomía Tradicional</option>
                    <option value="Ecoturismo Integral">Ecoturismo Integral</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>{lang === "en" ? "Languages Spoken" : "Idiomas"}</label>
                  <input
                    type="text"
                    placeholder="Ej. Español, Inglés"
                    value={idiomasGuia}
                    onChange={(e) => setIdiomasGuia(e.target.value)}
                    className="clay-input"
                    style={styles.inputCompact}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>{lang === "en" ? "WhatsApp / Phone" : "WhatsApp / Teléfono"}</label>
                  <input
                    type="text"
                    placeholder="+505 8888 8888"
                    value={telefonoGuia}
                    onChange={(e) => setTelefonoGuia(e.target.value)}
                    className="clay-input"
                    style={styles.inputCompact}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="clay-btn-green no-sheen no-hover-transform"
            style={{
              ...styles.submitBtn,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
            disabled={loading}
          >
            <img
              src="/images/gueguense.svg"
              alt="Güegüense"
              style={{
                width: "22px",
                height: "22px",
                objectFit: "contain",
                filter: "brightness(0) invert(1)"
              }}
            />
            <span>{loading ? t("common.loading") : t("auth.registerButton")}</span>
          </button>
        </form>

        <div style={{
          display: "flex",
          alignItems: "center",
          margin: "10px 0",
          gap: "10px",
          color: "#94A3B8",
          fontSize: "12px",
          fontWeight: "600"
        }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(148, 163, 184, 0.25)" }} />
          <span>{t("auth.orContinueWith")}</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(148, 163, 184, 0.25)" }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="clay-tab no-sheen"
          style={{
            width: '100%',
            padding: '9px 16px',
            fontSize: '13.5px',
            fontWeight: '700',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            borderRadius: '12px',
            border: '1px solid rgba(20, 109, 158, 0.15)',
            background: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
          }}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
          </svg>
          <span>{lang === "en" ? "Continue with Google" : "Continuar con Google"}</span>
        </button>

        <div style={styles.footerText}>
          {t("auth.hasAccount")}{" "}
          <Link href="/login" style={styles.link}>
            {t("auth.loginButton")}
          </Link>
        </div>
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

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background: "#1CAE4D",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "20px 20px",
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
    padding: "18px 36px",
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
    fontSize: "26px",
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: "-0.5px",
    fontFamily: "'LC Mogi', 'LC Mogi A', var(--font-outfit), sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    padding: "26px 30px",
    borderRadius: "24px",
    background: "#FFFFFF",
    border: "1px solid rgba(20, 109, 158, 0.12)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.08)",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    textAlign: "center",
    margin: "0 0 2px 0",
    color: "#1A1A2E",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: "13px",
    color: "#4A5568",
    textAlign: "center",
    margin: "0 0 14px 0",
    lineHeight: "1.3",
  },
  errorBanner: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "10px",
    padding: "8px 12px",
    color: "#ef4444",
    fontSize: "12.5px",
    fontWeight: "600",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  successBanner: {
    background: "rgba(23, 170, 74, 0.10)",
    border: "1px solid rgba(23, 170, 74, 0.20)",
    borderRadius: "10px",
    padding: "8px 12px",
    color: "#17AA4A",
    fontSize: "12.5px",
    fontWeight: "600",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "750",
    color: "#1A1A2E",
  },
  roleSelector: {
    display: "flex",
    gap: "10px",
    marginTop: "2px",
  },
  roleBtnCompact: {
    flex: 1,
    padding: "11px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  grid2Col: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  inputCompact: {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 12px",
    fontSize: "13.5px",
    borderRadius: "10px",
  },
  submitBtn: {
    marginTop: "6px",
    width: "100%",
    padding: "11px",
    background: "linear-gradient(145deg, #1FCC5C 0%, #17AA4A 70%, #128A3C 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(23, 170, 74, 0.3)",
    transition: "all 0.25s",
  },
  footerText: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#4A5568",
    textAlign: "center",
  },
  link: {
    color: "#146D9E",
    textDecoration: "none",
    fontWeight: "750",
  },
};
