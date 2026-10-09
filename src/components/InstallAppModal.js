"use client";

import { useEffect, useState } from "react";
import Icon from "./ui/Icon";
import { useTranslation } from "@/hooks/useTranslation";

export default function InstallAppModal({ isOpen, onClose }) {
  const { lang, tr } = useTranslation();
  const [platform, setPlatform] = useState(() => {
    if (typeof window === "undefined") return "android";
    const ua = navigator.userAgent;
    const isiOS = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    return isiOS ? "ios" : isMobile ? "android" : "desktop";
  });
  const [canPrompt, setCanPrompt] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.__pwaInstallPrompt);
  });
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.matchMedia("(display-mode: standalone)").matches || window.__pwaIsInstalled);
  });

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const updatePrompt = () => setCanPrompt(Boolean(window.__pwaInstallPrompt));
    const onInstalled = () => setIsInstalled(true);
    window.addEventListener("pwa-prompt-available", updatePrompt);
    window.addEventListener("pwa-installed", onInstalled);

    return () => {
      window.removeEventListener("pwa-prompt-available", updatePrompt);
      window.removeEventListener("pwa-installed", onInstalled);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (typeof window !== "undefined" && window.__pwaInstallPrompt) {
      try {
        const promptEvent = window.__pwaInstallPrompt;
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          window.__pwaInstallPrompt = null;
          window.__pwaIsInstalled = true;
          setTimeout(() => onClose(), 1500);
        }
      } catch (err) {
        console.error("Error al disparar instalación nativa:", err);
      }
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(3, 10, 20, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.25s ease-out"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "linear-gradient(165deg, #0f2138 0%, #0a1727 100%)",
          border: "1.5px solid rgba(212, 175, 55, 0.4)",
          borderRadius: "24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.15)",
          color: "#FFFFFF",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Cabecera del modal */}
        <div
          style={{
            padding: "20px 24px 16px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #102a45 0%, #091827 100%)",
                border: "1.5px solid rgba(212, 175, 55, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(212, 175, 55, 0.2)"
              }}
            >
              <img
                src="/icon-192.png"
                alt="Atlan Logo"
                style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "contain" }}
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "800",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-outfit)"
                  }}
                >
                  {tr("Descargar App Atlan", "Download Atlan App", "下载 Atlan 应用程序")}
                </h3>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#94A3B8" }}>
                {tr(
                  "GPS Turístico · Instalación ligera y rápida",
                  "Tourist GPS · Fast & lightweight install",
                  "旅游GPS · 快速轻量安装"
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#CBD5E1",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "#CBD5E1";
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Selector de Dispositivo / Plataforma */}
        <div style={{ padding: "16px 24px 0" }}>
          <div
            style={{
              display: "flex",
              background: "rgba(0, 0, 0, 0.35)",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              gap: "4px"
            }}
          >
            {[
              { id: "android", label: "Android", icon: "smartphone" },
              { id: "ios", label: "iPhone / iPad", icon: "smartphone" },
              { id: "desktop", label: tr("Computadora", "PC / Mac", "电脑"), icon: "globe" }
            ].map((tab) => {
              const active = platform === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPlatform(tab.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 4px",
                    borderRadius: "8px",
                    border: "none",
                    background: active
                      ? "linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.1) 100%)"
                      : "transparent",
                    borderBottom: active ? "2px solid #D4AF37" : "2px solid transparent",
                    color: active ? "#FFD700" : "#94A3B8",
                    fontSize: "12.5px",
                    fontWeight: active ? "700" : "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <Icon name={tab.icon} size={14} color={active ? "#FFD700" : "#94A3B8"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido según Plataforma */}
        <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {isInstalled ? (
            <div
              style={{
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: "14px",
                padding: "16px",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "6px" }}>🎉</div>
              <h4 style={{ margin: "0 0 4px", color: "#34D399", fontSize: "15px", fontWeight: "700" }}>
                {tr("¡Atlan ya está instalada!", "Atlan is already installed!", "Atlan 已经安装！")}
              </h4>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#CBD5E1" }}>
                {tr(
                  "Puedes abrirla directamente desde tu pantalla de inicio o aplicaciones.",
                  "You can open it right from your home screen or apps list.",
                  "您可以直接从主屏幕或应用程序打开它。"
                )}
              </p>
            </div>
          ) : platform === "android" ? (
            <>
              {/* Botón directo si el prompt está listo */}
              {canPrompt && (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
                    border: "none",
                    color: "#0a1727",
                    fontWeight: "800",
                    fontSize: "14.5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(212, 175, 55, 0.35)",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <Icon name="download" size={18} color="#0a1727" />
                  <span>{tr("Instalar App en tu Android Ahora", "Install App on Android Now", "立即在 Android 上安装")}</span>
                </button>
              )}

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "14px",
                  padding: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#FFD700" }}>
                  {tr("Pasos para instalar en Android (Chrome / Brave / Edge):", "Steps to install on Android:", "Android 安装步骤:")}
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={stepBadgeStyle}>1</div>
                  <div style={{ fontSize: "13px", color: "#E2E8F0" }}>
                    {tr(
                      "Abre el menú del navegador tocando los tres puntos (⋮) en la esquina superior derecha.",
                      "Open browser menu by tapping the three dots (⋮) in the top-right corner.",
                      "点击右上角的三个点 (⋮) 打开浏览器菜单。"
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={stepBadgeStyle}>2</div>
                  <div style={{ fontSize: "13px", color: "#E2E8F0" }}>
                    {tr(
                      "Selecciona la opción \"Instalar aplicación\" o \"Agregar a la pantalla principal\".",
                      "Select \"Install app\" or \"Add to Home screen\".",
                      "选择“安装应用程序”或“添加到主屏幕”。"
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={stepBadgeStyle}>3</div>
                  <div style={{ fontSize: "13px", color: "#E2E8F0" }}>
                    {tr(
                      "Confirma tocando \"Instalar\". ¡Listo! Tendrás el icono de Atlan listo para usar.",
                      "Confirm by tapping \"Install\". That's it!",
                      "点击“安装”进行确认即可！"
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : platform === "ios" ? (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "14px",
                padding: "14px",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#FFD700" }}>
                {tr("Pasos para iPhone o iPad (Navegador Safari):", "Steps for iPhone or iPad (Safari browser):", "iPhone 或 iPad 步骤 (Safari 浏览器):")}
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={stepBadgeStyle}>1</div>
                <div style={{ fontSize: "13px", color: "#E2E8F0" }}>
                  {tr(
                    "En Safari, presiona el botón Compartir (el ícono del cuadrado con la flecha hacia arriba ⎋) en la barra inferior.",
                    "In Safari, tap the Share button (square with arrow ⎋) on the bottom bar.",
                    "在 Safari 中，点击底部的分享按钮 (⎋)。"
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={stepBadgeStyle}>2</div>
                <div style={{ fontSize: "13px", color: "#E2E8F0" }}>
                  {tr(
                    "Baja un poco en el menú y selecciona \"Agregar a pantalla de inicio\" (con el signo ➕).",
                    "Scroll down in the options and tap \"Add to Home Screen\" (with ➕ icon).",
                    "向下滚动并选择“添加到主屏幕” (带有 ➕ 图标)。"
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={stepBadgeStyle}>3</div>
                <div style={{ fontSize: "13px", color: "#E2E8F0" }}>
                  {tr(
                    "Toca \"Agregar\" en la esquina superior derecha. ¡Atlan se abrirá a pantalla completa como cualquier app nativa!",
                    "Tap \"Add\" in the top right corner. Atlan will open full-screen like a native app!",
                    "点击右上角的“添加”。Atlan 将以全屏原生体验运行！"
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "14px",
                padding: "14px",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              {canPrompt && (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
                    border: "none",
                    color: "#0a1727",
                    fontWeight: "800",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(212, 175, 55, 0.35)",
                    transition: "all 0.2s ease",
                    marginBottom: "6px"
                  }}
                >
                  <Icon name="download" size={18} color="#0a1727" />
                  <span>{tr("Instalar en esta Computadora", "Install on this Computer", "在此电脑上安装")}</span>
                </button>
              )}

              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#FFD700" }}>
                {tr("¿Cómo descargarla en tu celular?", "How to get it on your phone?", "如何下载到手机？")}
              </div>

              <p style={{ margin: 0, fontSize: "13px", color: "#CBD5E1", lineHeight: "1.5" }}>
                {tr(
                  "Abre el navegador en tu teléfono celular (Chrome o Safari) e ingresa a Atlan. Luego abre el menú y presiona este mismo botón \"Descargar App\" para instalarla al instante sin descargas pesadas de tienda.",
                  "Open your mobile browser (Chrome or Safari) and visit Atlan. Then open the menu and tap \"Download App\" to install it right away without heavy store downloads.",
                  "用手机浏览器访问 Atlan，点击菜单中的“下载应用”即可秒速安装。"
                )}
              </p>
            </div>
          )}

          {/* Ventajas PWA */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              paddingTop: "4px"
            }}
          >
            {[
              { icon: "⚡", label: tr("Carga rápida", "Fast load", "极速加载") },
              { icon: "📍", label: tr("GPS Turístico", "Tour GPS", "旅游GPS") },
              { icon: "📶", label: tr("Modo Offline", "Offline Mode", "离线模式") }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  borderRadius: "10px",
                  padding: "8px 6px",
                  textAlign: "center",
                  border: "1px solid rgba(255, 255, 255, 0.05)"
                }}
              >
                <div style={{ fontSize: "16px", marginBottom: "2px" }}>{item.icon}</div>
                <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "600" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "11px 20px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              fontSize: "13.5px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
          >
            {tr("¡Entendido!", "Got it!", "知道了！")}
          </button>
        </div>
      </div>
    </div>
  );
}

const stepBadgeStyle = {
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
  color: "#0a1727",
  fontSize: "12px",
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
};
