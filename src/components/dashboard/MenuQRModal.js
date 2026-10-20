"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import QRCode from "qrcode";

/* ─── COMPONENTES SVG VECTORIALES DE ALTA DEFINICIÓN (SIN EMOJIS) ─── */
function SunSvg({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

function MoonSvg({ size = 19, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function BulbSvg({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

function StarSvg({ size = 10, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function DownloadSvg({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function PrinterSvg({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  );
}

function CopySvg({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckSvg({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function QrHeaderSvg({ size = 18, color = "#FFD700" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CloseSvg({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CameraSvg({ size = 9, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function ScanSvg({ size = 9, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function UtensilsSvg({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
      <path d="M15 11v11" />
      <path d="M5 2v20" />
      <path d="M2 2h6" />
    </svg>
  );
}

/* ─── COMPONENTE PRINCIPAL DEL MODAL ─── */
export default function MenuQRModal({ negocio, isOpen, onClose, lang = "es" }) {
  const [tema, setTema] = useState("light"); // 'light' (para imprimir) | 'dark' (lounge/noche)
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [generandoPng, setGenerandoPng] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const printCardRef = useRef(null);

  // Determinar URL de destino para el cliente
  const getDestinationUrl = useCallback(() => {
    if (!negocio?.id) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/lugares?lugar=${negocio.id}&tab=menu`;
    }
    return `https://plataforma-atlan.mexicocentral.cloudapp.azure.com/lugares?lugar=${negocio.id}&tab=menu`;
  }, [negocio]);

  // Generar QR al abrir o cambiar de tema
  useEffect(() => {
    if (!isOpen || !negocio) return;
    const url = getDestinationUrl();
    if (!url) return;

    QRCode.toDataURL(url, {
      width: 480,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })
      .then((dataUri) => setQrDataUrl(dataUri))
      .catch((err) => console.error("Error generando QR:", err));
  }, [isOpen, negocio, tema, getDestinationUrl]);

  if (!isOpen || !negocio) return null;

  const urlDestino = getDestinationUrl();
  const nombreNegocio = negocio.nombre || "Mi Negocio";
  const categoria = negocio.categoria || "Comercio Local";
  const ubicacion = negocio.departamento || "Nicaragua";
  const logoUrl = negocio.foto_url || negocio.logo_url || null;
  const isLight = tema === "light";

  const handleCopiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(urlDestino);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  // Generar y descargar la tarjeta en PNG de Alta Resolución (1200 x 1680 px ~ 300 DPI)
  const handleDescargarPng = async () => {
    setGenerandoPng(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const width = 1200;
      const height = 1680;
      canvas.width = width;
      canvas.height = height;

      const bgCard = isLight ? "#FFFFFF" : "#08101E";
      const primaryCol = isLight ? "#0F172A" : "#F8FAFC";
      const subCol = isLight ? "#475569" : "#94A3B8";
      const goldLight = isLight ? "#D97706" : "#FBBF24";

      // 1. Fondo principal
      ctx.fillStyle = bgCard;
      ctx.fillRect(0, 0, width, height);

      // 2. Marco perimetral doble
      ctx.strokeStyle = isLight ? "#E2E8F0" : "rgba(255, 215, 0, 0.35)";
      ctx.lineWidth = 8;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      ctx.strokeStyle = isLight ? "rgba(217, 119, 6, 0.4)" : "rgba(255, 215, 0, 0.6)";
      ctx.lineWidth = 3;
      ctx.strokeRect(44, 44, width - 88, height - 88);

      // Decoración de esquinas
      ctx.fillStyle = goldLight;
      [
        [44, 44],
        [width - 44, 44],
        [44, height - 44],
        [width - 44, height - 44],
      ].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Encabezado
      let y = 105;

      // Banner superior
      ctx.fillStyle = isLight ? "rgba(245, 158, 11, 0.12)" : "rgba(255, 215, 0, 0.15)";
      const topBadgeW = 440;
      const topBadgeH = 44;
      ctx.beginPath();
      ctx.roundRect((width - topBadgeW) / 2, y, topBadgeW, topBadgeH, 22);
      ctx.fill();
      ctx.strokeStyle = goldLight;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isLight ? "#B45309" : "#FCD34D";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★ MENÚ DIGITAL & PROMOCIONES ★", width / 2, y + topBadgeH / 2 + 1);

      y += topBadgeH + 40;

      // Logo circular
      if (logoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = logoUrl;
          });
          const imgSize = 120;
          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, y + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, (width - imgSize) / 2, y, imgSize, imgSize);
          ctx.restore();

          ctx.strokeStyle = goldLight;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(width / 2, y + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.stroke();
          y += imgSize + 25;
        } catch {
          y += 10;
        }
      }

      // Nombre del negocio (Protagonista en grande)
      ctx.fillStyle = primaryCol;
      ctx.font = "900 58px sans-serif";
      let fontSize = 58;
      while (ctx.measureText(nombreNegocio).width > width - 160 && fontSize > 34) {
        fontSize -= 3;
        ctx.font = `900 ${fontSize}px sans-serif`;
      }
      ctx.fillText(nombreNegocio, width / 2, y);
      y += 50;

      // Categoría y Ciudad
      ctx.fillStyle = subCol;
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(`${categoria.toUpperCase()} • ${ubicacion.toUpperCase()}`, width / 2, y);
      y += 40;

      // Línea divisoria
      ctx.strokeStyle = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, y);
      ctx.lineTo(width - 120, y);
      ctx.stroke();
      y += 45;

      // Llamado a la acción
      ctx.fillStyle = isLight ? "#0F172A" : "#FFFFFF";
      ctx.font = "900 34px sans-serif";
      ctx.fillText("ESCANEA CON TU CELULAR", width / 2, y);
      y += 38;

      ctx.fillStyle = subCol;
      ctx.font = "600 22px sans-serif";
      ctx.fillText("Apunta con tu cámara para ver fotos, platillos y precios", width / 2, y);
      y += 50;

      // Marco del QR
      const qrSize = 500;
      const qrX = (width - qrSize) / 2;
      const qrY = y;

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 24);
      ctx.fill();
      ctx.strokeStyle = isLight ? "#CBD5E1" : goldLight;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Esquinas estilo visor
      const bracketLen = 32;
      ctx.strokeStyle = goldLight;
      ctx.lineWidth = 5;

      // TL
      ctx.beginPath();
      ctx.moveTo(qrX - 28, qrY - 28 + bracketLen);
      ctx.lineTo(qrX - 28, qrY - 28);
      ctx.lineTo(qrX - 28 + bracketLen, qrY - 28);
      ctx.stroke();

      // TR
      ctx.beginPath();
      ctx.moveTo(qrX + qrSize + 28 - bracketLen, qrY - 28);
      ctx.lineTo(qrX + qrSize + 28, qrY - 28);
      ctx.lineTo(qrX + qrSize + 28, qrY - 28 + bracketLen);
      ctx.stroke();

      // BL
      ctx.beginPath();
      ctx.moveTo(qrX - 28, qrY + qrSize + 28 - bracketLen);
      ctx.lineTo(qrX - 28, qrY + qrSize + 28);
      ctx.lineTo(qrX - 28 + bracketLen, qrY + qrSize + 28);
      ctx.stroke();

      // BR
      ctx.beginPath();
      ctx.moveTo(qrX + qrSize + 28 - bracketLen, qrY + qrSize + 28);
      ctx.lineTo(qrX + qrSize + 28, qrY + qrSize + 28);
      ctx.lineTo(qrX + qrSize + 28, qrY + qrSize + 28 - bracketLen);
      ctx.stroke();

      // Dibujar QR
      const qrImg = new Image();
      await new Promise((res, rej) => {
        qrImg.onload = res;
        qrImg.onerror = rej;
        qrImg.src = qrDataUrl;
      });
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      y += qrSize + 60;

      // 3 pasos rápidos
      const stepsY = y;
      const stepBoxW = 320;
      const stepGap = 20;
      const totalStepsW = stepBoxW * 3 + stepGap * 2;
      const startX = (width - totalStepsW) / 2;

      [
        { num: "1", tit: "Abre la Cámara", sub: "Desde tu teléfono" },
        { num: "2", tit: "Apunta al QR", sub: "Sin descargar apps" },
        { num: "3", tit: "Mira el Menú", sub: "Con fotos y precios" },
      ].forEach((s, idx) => {
        const sx = startX + idx * (stepBoxW + stepGap);
        ctx.fillStyle = isLight ? "#F8FAFC" : "rgba(255, 255, 255, 0.04)";
        ctx.beginPath();
        ctx.roundRect(sx, stepsY, stepBoxW, 66, 14);
        ctx.fill();
        ctx.strokeStyle = isLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = goldLight;
        ctx.beginPath();
        ctx.arc(sx + 30, stepsY + 33, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0F172A";
        ctx.font = "bold 17px sans-serif";
        ctx.fillText(s.num, sx + 30, stepsY + 34);

        ctx.textAlign = "left";
        ctx.fillStyle = primaryCol;
        ctx.font = "bold 17px sans-serif";
        ctx.fillText(s.tit, sx + 58, stepsY + 26);

        ctx.fillStyle = subCol;
        ctx.font = "500 14px sans-serif";
        ctx.fillText(s.sub, sx + 58, stepsY + 47);
      });

      y += 100;

      // Línea divisoria
      ctx.strokeStyle = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(140, y);
      ctx.lineTo(width - 140, y);
      ctx.stroke();
      y += 45;

      // Pie
      ctx.textAlign = "center";
      ctx.fillStyle = subCol;
      ctx.font = "600 20px sans-serif";
      ctx.fillText("Menú Digital impulsado por Plataforma Atlan • www.plataforma-atlan.com", width / 2, y);

      // Disparar descarga
      const cleanName = nombreNegocio.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `tarjeta_mesa_qr_${cleanName}.png`;
      a.click();
    } catch (err) {
      console.error("Error exportando imagen de tarjeta QR:", err);
      alert("Hubo un detalle al exportar la imagen. Intenta de nuevo.");
    } finally {
      setGenerandoPng(false);
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose} className="qr-modal-backdrop">
      <div style={styles.cardModal} onClick={(e) => e.stopPropagation()} className="qr-modal-card">
        {/* CABECERA SUPERIOR */}
        <div style={styles.modalHeader} className="qr-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.iconBox}>
              <QrHeaderSvg size={18} color="#FFD700" />
            </div>
            <div>
              <h3 style={styles.title}>Generador de Tarjeta QR para Mesas</h3>
              <p style={styles.subtitle}>
                Diseño optimizado para soportes acrílicos (10×15 cm) o adhesivos de mesa
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn} title="Cerrar modal">
            <CloseSvg size={15} color="#CBD5E1" />
          </button>
        </div>

        {/* CUERPO DEL MODAL: DISEÑO EN 2 COLUMNAS SIN SCROLLBAR */}
        <div style={styles.modalBodyGrid} className="qr-modal-grid">
          {/* COLUMNA IZQUIERDA: VISTA PREVIA COMPLETA DE LA TARJETA */}
          <div style={styles.previewColumn} className="qr-preview-col">
            <div style={styles.standMockupWrapper} className="qr-stand-wrapper">
              <div
                ref={printCardRef}
                id="print-qr-card"
                style={{
                  ...styles.tableCard,
                  background: isLight ? "#FFFFFF" : "#0A192F",
                  color: isLight ? "#0F172A" : "#FFFFFF",
                  borderColor: isLight ? "#CBD5E1" : "rgba(255, 215, 0, 0.45)",
                  boxShadow: isLight
                    ? "0 12px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)"
                    : "0 16px 36px rgba(0,0,0,0.7), 0 0 18px rgba(255, 215, 0, 0.16)",
                }}
              >
                {/* Banner superior de la tarjeta */}
                <div style={{ marginBottom: 6 }}>
                  <span
                    style={{
                      ...styles.cardBadge,
                      background: isLight ? "#FEF3C7" : "rgba(255,215,0,0.18)",
                      color: isLight ? "#B45309" : "#FFD700",
                      borderColor: isLight ? "#F59E0B" : "rgba(255,215,0,0.4)",
                    }}
                  >
                    <StarSvg size={8} color={isLight ? "#B45309" : "#FFD700"} />
                    <span style={{ margin: "0 4px" }}>MENÚ DIGITAL OFICIAL</span>
                    <StarSvg size={8} color={isLight ? "#B45309" : "#FFD700"} />
                  </span>
                </div>

                {/* Logo y Nombre del Negocio (Protagonista) */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {logoUrl ? (
                    <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", margin: "0 auto 4px", border: "2px solid #F59E0B" }}>
                      <img src={logoUrl} alt={nombreNegocio} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", border: "1.5px solid #F59E0B" }}>
                      <UtensilsSvg size={16} color="#F59E0B" />
                    </div>
                  )}

                  <h2 style={{ ...styles.businessTitle, color: isLight ? "#0F172A" : "#FFFFFF" }}>
                    {nombreNegocio}
                  </h2>

                  <p style={{ ...styles.businessMeta, color: isLight ? "#475569" : "#94A3B8" }}>
                    {categoria.toUpperCase()} • {ubicacion.toUpperCase()}
                  </p>
                </div>

                <div style={{ ...styles.divider, background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)" }} />

                {/* Llamado de escaneo */}
                <div style={styles.scanTitle}>ESCANEA CON TU CELULAR</div>
                <div style={{ ...styles.scanSubtitle, color: isLight ? "#64748B" : "#94A3B8" }}>
                  Apunta con tu cámara para ver fotos y precios
                </div>

                {/* Código QR con esquinas estilo visor */}
                <div style={styles.qrContainerBox}>
                  <div style={styles.qrFrameCornerTL} />
                  <div style={styles.qrFrameCornerTR} />
                  <div style={styles.qrFrameCornerBL} />
                  <div style={styles.qrFrameCornerBR} />

                  <div style={styles.qrWhitePlate}>
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Código QR del Menú" style={styles.qrImage} />
                    ) : (
                      <div style={{ width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 11 }}>
                        Generando QR…
                      </div>
                    )}
                  </div>
                </div>

                {/* 3 Pasos amigables con SVGs */}
                <div style={styles.stepsRow}>
                  <div style={{ ...styles.stepBadge, background: isLight ? "#F1F5F9" : "rgba(255,255,255,0.06)", borderColor: isLight ? "#E2E8F0" : "rgba(255,255,255,0.1)" }}>
                    <CameraSvg size={9} color="#F59E0B" />
                    <span style={{ ...styles.stepText, color: isLight ? "#334155" : "#E2E8F0" }}>Cámara</span>
                  </div>
                  <div style={{ ...styles.stepBadge, background: isLight ? "#F1F5F9" : "rgba(255,255,255,0.06)", borderColor: isLight ? "#E2E8F0" : "rgba(255,255,255,0.1)" }}>
                    <ScanSvg size={9} color="#F59E0B" />
                    <span style={{ ...styles.stepText, color: isLight ? "#334155" : "#E2E8F0" }}>Apunta QR</span>
                  </div>
                  <div style={{ ...styles.stepBadge, background: isLight ? "#F1F5F9" : "rgba(255,255,255,0.06)", borderColor: isLight ? "#E2E8F0" : "rgba(255,255,255,0.1)" }}>
                    <UtensilsSvg size={9} color="#F59E0B" />
                    <span style={{ ...styles.stepText, color: isLight ? "#334155" : "#E2E8F0" }}>Mira Menú</span>
                  </div>
                </div>

                <div style={{ ...styles.divider, background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)" }} />

                {/* Respaldo sutil al pie */}
                <div style={{ ...styles.atlanFooterText, color: isLight ? "#64748B" : "#94A3B8" }}>
                  Menú Digital en <strong>Plataforma Atlan</strong>
                </div>
              </div>

              {/* Base de acrílico simulada (ancho 100% sin desborde) */}
              <div style={styles.acrylicStandBase} />
            </div>
          </div>

          {/* COLUMNA DERECHA: PANEL DE CONTROL Y ACCIONES */}
          <div style={styles.controlsColumn} className="qr-controls-col">
            {/* 1. Selector de estilo de impresión con SVGs */}
            <div style={styles.controlSection}>
              <label style={styles.controlLabel}>1. Estilo para imprimir:</label>
              <div style={styles.themeSelectorGrid} className="qr-theme-grid">
                <button
                  type="button"
                  onClick={() => setTema("light")}
                  style={{
                    ...styles.themeCardBtn,
                    background: isLight ? "rgba(245, 158, 11, 0.12)" : "rgba(255,255,255,0.03)",
                    borderColor: isLight ? "#F59E0B" : "rgba(255,255,255,0.1)",
                    color: isLight ? "#F59E0B" : "#94A3B8",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ color: isLight ? "#F59E0B" : "#64748B", display: "flex", alignItems: "center" }}>
                      <SunSvg size={22} color={isLight ? "#F59E0B" : "#64748B"} />
                    </div>
                    <div>
                      <div style={{ fontWeight: "800", fontSize: 12.5, color: isLight ? "#F59E0B" : "#E2E8F0" }}>Blanco Clásico</div>
                      <div style={{ fontSize: 10, color: isLight ? "#D97706" : "#64748B" }}>Ahorra tinta • Ideal acrílico</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTema("dark")}
                  style={{
                    ...styles.themeCardBtn,
                    background: !isLight ? "rgba(255, 215, 0, 0.14)" : "rgba(255,255,255,0.03)",
                    borderColor: !isLight ? "#FFD700" : "rgba(255,255,255,0.1)",
                    color: !isLight ? "#FFD700" : "#94A3B8",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ color: !isLight ? "#FFD700" : "#64748B", display: "flex", alignItems: "center" }}>
                      <MoonSvg size={20} color={!isLight ? "#FFD700" : "#64748B"} />
                    </div>
                    <div>
                      <div style={{ fontWeight: "800", fontSize: 12.5, color: !isLight ? "#FFD700" : "#E2E8F0" }}>Modo Noche</div>
                      <div style={{ fontSize: 10, color: !isLight ? "#FFD700" : "#64748B" }}>Bares y ambientes lounge</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Enlace directo del menú */}
            <div style={styles.controlSection}>
              <label style={styles.controlLabel}>2. Enlace web del menú:</label>
              <div style={styles.linkRow}>
                <span style={styles.linkText} title={urlDestino}>
                  {urlDestino}
                </span>
                <button
                  type="button"
                  onClick={handleCopiarEnlace}
                  style={styles.copySmallBtn}
                  title="Copiar enlace"
                >
                  {copiado ? <CheckSvg size={13} color="#10B981" /> : <CopySvg size={13} color="#FFFFFF" />}
                  <span>{copiado ? "¡Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>

            {/* 3. Botones de acción (Distribuidos horizontalmente en escritorio para no generar scroll) */}
            <div style={styles.controlSection}>
              <label style={styles.controlLabel}>3. Descargar o Imprimir:</label>
              <div style={styles.actionsRow} className="qr-actions-row">
                <button
                  type="button"
                  onClick={handleDescargarPng}
                  disabled={generandoPng || !qrDataUrl}
                  style={styles.downloadBigBtn}
                >
                  <DownloadSvg size={17} color="#0A192F" />
                  <span>{generandoPng ? "Generando…" : "Descargar PNG (Alta Resolución)"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleImprimir}
                  style={styles.printBigBtn}
                >
                  <PrinterSvg size={16} color="#E2E8F0" />
                  <span>Imprimir Tarjeta</span>
                </button>
              </div>
            </div>

            {/* Tip de uso para el negocio con SVG */}
            <div style={styles.tipBox}>
              <div style={{ color: "#FFD700", flexShrink: 0, display: "flex", alignItems: "center", marginTop: 1 }}>
                <BulbSvg size={16} color="#FFD700" />
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", lineHeight: 1.45 }}>
                <strong>Formato estándar:</strong> El PNG está optimizado a proporción <strong>10 × 15 cm</strong> (300 DPI) para soportes acrílicos verticales de restaurante o stickers adhesivos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-qr-card,
          #print-qr-card * {
            visibility: visible !important;
          }
          #print-qr-card {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 105mm !important;
            max-width: 105mm !important;
            border: 1px solid #CBD5E1 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 12mm 10mm !important;
            background: #FFFFFF !important;
            color: #0F172A !important;
          }
        }

        /* TABLET (entre 641px y 940px) */
        @media (min-width: 641px) and (max-width: 940px) {
          .qr-modal-card {
            max-width: 700px !important;
          }
          .qr-modal-grid {
            grid-template-columns: 250px 1fr !important;
            gap: 18px !important;
            padding: 14px 18px !important;
          }
          .qr-actions-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
        }

        /* CELULAR (pantallas de 640px o menos) */
        @media (max-width: 640px) {
          .qr-modal-backdrop {
            padding: 10px 8px !important;
          }
          .qr-modal-card {
            max-height: 92vh !important;
            max-width: 95vw !important;
            border-radius: 18px !important;
          }
          .qr-modal-header {
            padding: 12px 14px !important;
          }
          .qr-modal-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            padding: 14px !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          .qr-preview-col {
            width: 100% !important;
          }
          .qr-stand-wrapper {
            width: 100% !important;
            max-width: 260px !important;
            margin: 0 auto !important;
          }
          .qr-theme-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .qr-actions-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 7, 18, 0.88)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1300,
    padding: "20px 16px",
    overflowY: "auto",
    overflowX: "hidden",
  },
  cardModal: {
    width: "100%",
    maxWidth: 940,
    background: "#070E18",
    borderRadius: 22,
    border: "1.5px solid rgba(255,215,0,0.35)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.85), 0 0 35px rgba(255,215,0,0.12)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    margin: "auto",
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    flexShrink: 0,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "rgba(255,215,0,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  subtitle: {
    margin: "2px 0 0",
    fontSize: 11.5,
    color: "#94A3B8",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#CBD5E1",
    width: 32,
    height: 32,
    borderRadius: 8,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.15s ease",
  },
  modalBodyGrid: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: 28,
    padding: "18px 24px",
    alignItems: "center",
    overflowX: "hidden",
    boxSizing: "border-box",
  },
  previewColumn: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 0,
  },
  standMockupWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: 255,
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  tableCard: {
    width: "100%",
    borderRadius: "14px 14px 2px 2px",
    border: "1.5px solid",
    padding: "11px 12px 9px",
    textAlign: "center",
    position: "relative",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  cardBadge: {
    fontSize: 8,
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: 10,
    border: "1px solid",
    letterSpacing: "0.04em",
    display: "inline-flex",
    alignItems: "center",
  },
  businessTitle: {
    margin: "0 0 2px",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
    maxWidth: 230,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  businessMeta: {
    margin: "0",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: "0.03em",
  },
  divider: {
    height: 1,
    margin: "7px 0",
    width: "100%",
  },
  scanTitle: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: "0.04em",
    marginBottom: 1,
  },
  scanSubtitle: {
    fontSize: 8.5,
    maxWidth: 195,
    margin: "0 auto 5px",
    lineHeight: 1.3,
  },
  qrContainerBox: {
    position: "relative",
    padding: 5,
    margin: "0 auto 5px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qrFrameCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 12,
    height: 12,
    borderTop: "2.5px solid #D97706",
    borderLeft: "2.5px solid #D97706",
    borderRadius: "3px 0 0 0",
  },
  qrFrameCornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderTop: "2.5px solid #D97706",
    borderRight: "2.5px solid #D97706",
    borderRadius: "0 3px 0 0",
  },
  qrFrameCornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 12,
    height: 12,
    borderBottom: "2.5px solid #D97706",
    borderLeft: "2.5px solid #D97706",
    borderRadius: "0 0 0 3px",
  },
  qrFrameCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderBottom: "2.5px solid #D97706",
    borderRight: "2.5px solid #D97706",
    borderRadius: "0 0 3px 0",
  },
  qrWhitePlate: {
    background: "#FFFFFF",
    padding: 5,
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
    display: "inline-flex",
  },
  qrImage: {
    width: 108,
    height: 108,
    display: "block",
  },
  stepsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 4,
    width: "100%",
  },
  stepBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "3px 2px",
    borderRadius: 6,
    border: "1px solid",
  },
  stepText: {
    fontSize: 7.8,
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  atlanFooterText: {
    fontSize: 8,
    letterSpacing: "0.02em",
  },
  acrylicStandBase: {
    width: "100%",
    height: 7,
    background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(203, 213, 225, 0.95) 100%)",
    borderRadius: "0 0 8px 8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    border: "1px solid rgba(148, 163, 184, 0.4)",
    boxSizing: "border-box",
  },
  controlsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minWidth: 0,
    boxSizing: "border-box",
  },
  controlSection: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#CBD5E1",
  },
  themeSelectorGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  themeCardBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1.5px solid",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s ease",
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.03)",
    padding: "7px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  linkText: {
    fontSize: 11.5,
    color: "#38BDF8",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  copySmallBtn: {
    padding: "5px 10px",
    borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "750",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    transition: "background 0.15s ease",
  },
  actionsRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 10,
  },
  downloadBigBtn: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #FFD700 0%, #D97706 100%)",
    color: "#0A192F",
    fontSize: 12.5,
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 4px 16px rgba(217,119,6,0.35)",
    transition: "all 0.15s ease",
  },
  printBigBtn: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.05)",
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "800",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    transition: "all 0.15s ease",
  },
  tipBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "rgba(255, 215, 0, 0.05)",
    border: "1px solid rgba(255, 215, 0, 0.15)",
    borderRadius: 10,
    padding: "8px 12px",
  },
};
