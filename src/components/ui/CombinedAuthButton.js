"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * CombinedAuthButton — Botón dual combinado (Iniciar Sesión | Registrarse)
 * Reduce el espacio horizontal en el navbar unificando ambas acciones
 * en una cápsula interactiva con micro-animaciones.
 */
export default function CombinedAuthButton({ activePage = "" }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(null); // 'login' | 'register' | null

  const isLoginActive = activePage === "login";
  const isRegisterActive = activePage === "registro";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "34px",
        background: "#FFFFFF",
        border: "1px solid rgba(226, 232, 240, 0.95)",
        borderRadius: "9999px",
        padding: "2px",
        boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
        position: "relative",
        flexShrink: 0,
        transition: "all 0.2s ease"
      }}
    >
      {/* 1. Lado Izquierdo: Iniciar Sesión */}
      <Link
        href="/login"
        onMouseEnter={() => setHovered("login")}
        onMouseLeave={() => setHovered(null)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          height: "28px",
          padding: "0 8px",
          borderRadius: "9999px",
          textDecoration: "none",
          fontSize: "12px",
          fontWeight: "650",
          color: isLoginActive
            ? "#FFFFFF"
            : hovered === "login"
            ? "#146D9E"
            : "#475569",
          background: isLoginActive
            ? "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)"
            : hovered === "login"
            ? "rgba(20, 109, 158, 0.09)"
            : "transparent",
          transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: hovered === "login" ? "scale(1.02)" : "scale(1)",
          whiteSpace: "nowrap"
        }}
      >
        <img
          src="/images/gueguense.svg"
          alt="Iniciar Sesión"
          style={{
            width: "14px",
            height: "14px",
            objectFit: "contain",
            filter: isLoginActive ? "brightness(0) invert(1)" : "none",
            transition: "filter 0.2s ease"
          }}
        />
        <span>{t("nav.login") || "Iniciar Sesión"}</span>
      </Link>

      {/* Separador vertical sutil */}
      <div
        style={{
          width: "1px",
          height: "16px",
          background: "rgba(203, 213, 225, 0.8)",
          margin: "0 1px",
          opacity: hovered ? 0.3 : 1,
          transition: "opacity 0.2s ease",
          flexShrink: 0
        }}
      />

      {/* 2. Lado Derecho: Registrarse (Llamada a la acción con brillo dorado) */}
      <Link
        href="/registro"
        onMouseEnter={() => setHovered("register")}
        onMouseLeave={() => setHovered(null)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          height: "28px",
          padding: "0 10px",
          borderRadius: "9999px",
          textDecoration: "none",
          fontSize: "12px",
          fontWeight: "750",
          color: isRegisterActive ? "#FFFFFF" : "#FFFFFF",
          background: isRegisterActive
            ? "linear-gradient(135deg, #D97706 0%, #B45309 100%)"
            : hovered === "register"
            ? "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)"
            : "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
          boxShadow: hovered === "register"
            ? "0 4px 12px rgba(245, 158, 11, 0.45)"
            : "0 2px 6px rgba(245, 158, 11, 0.28)",
          transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: hovered === "register" ? "translateY(-0.5px) scale(1.03)" : "scale(1)",
          whiteSpace: "nowrap"
        }}
      >
        <img
          src="/images/tortuga.svg"
          alt="Registrarse"
          style={{
            width: "14px",
            height: "14px",
            objectFit: "contain",
            filter: "brightness(0) invert(1)",
            transform: hovered === "register" ? "rotate(-8deg)" : "none",
            transition: "transform 0.25s ease"
          }}
        />
        <span>{t("nav.register") || "Registrarse"}</span>
      </Link>
    </div>
  );
}
