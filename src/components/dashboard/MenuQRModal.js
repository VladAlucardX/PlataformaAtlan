"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import QRCode from "qrcode";
import Icon from "@/components/ui/Icon";

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
      return `${window.location.origin}/lugares?lugar=${negocio.id}`;
    }
    return `https://plataforma-atlan.mexicocentral.cloudapp.azure.com/lugares?lugar=${negocio.id}`;
  }, [negocio]);

  // Generar QR al abrir o cambiar de tema
  useEffect(() => {
    if (!isOpen || !negocio) return;
    const url = getDestinationUrl();
    if (!url) return;

    QRCode.toDataURL(url, {
      width: 520,
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

  // Generar y descargar la tarjeta en PNG de Alta Resolución (1200 x 1750 px ~ 300 DPI)
  const handleDescargarPng = async () => {
    setGenerandoPng(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const width = 1200;
      const height = 1750;
      canvas.width = width;
      canvas.height = height;

      const isLight = tema === "light";
      const bgCard = isLight ? "#FFFFFF" : "#08101E";
      const primaryCol = isLight ? "#0F172A" : "#F8FAFC";
      const subCol = isLight ? "#475569" : "#94A3B8";
      const goldCol = "#D97706";
      const goldLight = isLight ? "#F59E0B" : "#FBBF24";

      // 1. Fondo principal
      ctx.fillStyle = bgCard;
      ctx.fillRect(0, 0, width, height);

      // 2. Marco perimetral con doble filete dorado
      ctx.strokeStyle = isLight ? "#E2E8F0" : "rgba(255, 215, 0, 0.35)";
      ctx.lineWidth = 8;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      ctx.strokeStyle = isLight ? "rgba(217, 119, 6, 0.4)" : "rgba(255, 215, 0, 0.6)";
      ctx.lineWidth = 3;
      ctx.strokeRect(44, 44, width - 88, height - 88);

      // Decoración en las 4 esquinas del marco
      const cornerSize = 24;
      const corners = [
        [44, 44],
        [width - 44, 44],
        [44, height - 44],
        [width - 44, height - 44],
      ];
      ctx.fillStyle = goldLight;
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Encabezado de la tarjeta
      let y = 110;

      // Banner superior decorativo
      ctx.fillStyle = isLight ? "rgba(245, 158, 11, 0.12)" : "rgba(255, 215, 0, 0.15)";
      const topBadgeW = 440;
      const topBadgeH = 46;
      ctx.beginPath();
      ctx.roundRect((width - topBadgeW) / 2, y, topBadgeW, topBadgeH, 23);
      ctx.fill();
      ctx.strokeStyle = goldLight;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isLight ? "#B45309" : "#FCD34D";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★ MENÚ DIGITAL & PROMOCIONES ★", width / 2, y + topBadgeH / 2 + 1);

      y += topBadgeH + 45;

      // Logo circular o emblema
      if (logoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = logoUrl;
          });
          const imgSize = 130;
          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, y + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, (width - imgSize) / 2, y, imgSize, imgSize);
          ctx.restore();

          ctx.strokeStyle = goldLight;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(width / 2, y + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.stroke();
          y += imgSize + 30;
        } catch {
          y += 10;
        }
      }

      // Nombre del negocio (Protagonista absoluto en grande)
      ctx.fillStyle = primaryCol;
      ctx.font = "900 60px sans-serif";
      let fontSize = 60;
      while (ctx.measureText(nombreNegocio).width > width - 160 && fontSize > 36) {
        fontSize -= 3;
        ctx.font = `900 ${fontSize}px sans-serif`;
      }
      ctx.fillText(nombreNegocio, width / 2, y);
      y += 52;

      // Categoría y Ciudad
      ctx.fillStyle = subCol;
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(`${categoria.toUpperCase()} • ${ubicacion.toUpperCase()}`, width / 2, y);
      y += 45;

      // Línea divisoria elegante
      ctx.strokeStyle = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, y);
      ctx.lineTo(width - 120, y);
      ctx.stroke();
      y += 50;

      // 4. Instrucción clara para el cliente de la mesa
      ctx.fillStyle = isLight ? "#0F172A" : "#FFFFFF";
      ctx.font = "900 36px sans-serif";
      ctx.fillText("ESCANEA CON TU CELULAR", width / 2, y);
      y += 40;

      ctx.fillStyle = subCol;
      ctx.font = "600 24px sans-serif";
      ctx.fillText("Apunta con tu cámara para ver fotos, platillos y precios", width / 2, y);
      y += 55;

      // 5. Marco del Código QR con esquinas tipo visor de cámara
      const qrSize = 520;
      const qrX = (width - qrSize) / 2;
      const qrY = y;

      // Fondo blanco del QR para lectura instantánea
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 28);
      ctx.fill();
      ctx.strokeStyle = isLight ? "#CBD5E1" : goldLight;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Esquinas estilo visor
      const bracketLen = 36;
      const bracketThick = 6;
      ctx.strokeStyle = goldLight;
      ctx.lineWidth = bracketThick;

      // Arriba-Izquierda
      ctx.beginPath();
      ctx.moveTo(qrX - 34, qrY - 34 + bracketLen);
      ctx.lineTo(qrX - 34, qrY - 34);
      ctx.lineTo(qrX - 34 + bracketLen, qrY - 34);
      ctx.stroke();

      // Arriba-Derecha
      ctx.beginPath();
      ctx.moveTo(qrX + qrSize + 34 - bracketLen, qrY - 34);
      ctx.lineTo(qrX + qrSize + 34, qrY - 34);
      ctx.lineTo(qrX + qrSize + 34, qrY - 34 + bracketLen);
      ctx.stroke();

      // Abajo-Izquierda
      ctx.beginPath();
      ctx.moveTo(qrX - 34, qrY + qrSize + 34 - bracketLen);
      ctx.lineTo(qrX - 34, qrY + qrSize + 34);
      ctx.lineTo(qrX - 34 + bracketLen, qrY + qrSize + 34);
      ctx.stroke();

      // Abajo-Derecha
      ctx.beginPath();
      ctx.moveTo(qrX + qrSize + 34 - bracketLen, qrY + qrSize + 34);
      ctx.lineTo(qrX + qrSize + 34, qrY + qrSize + 34);
      ctx.lineTo(qrX + qrSize + 34, qrY + qrSize + 34 - bracketLen);
      ctx.stroke();

      // Dibujar imagen del QR
      const qrImg = new Image();
      await new Promise((res, rej) => {
        qrImg.onload = res;
        qrImg.onerror = rej;
        qrImg.src = qrDataUrl;
      });
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      y += qrSize + 65;

      // 6. Guía visual de 3 pasos rápidos
      const stepsY = y;
      const stepBoxW = 320;
      const stepGap = 20;
      const totalStepsW = stepBoxW * 3 + stepGap * 2;
      const startX = (width - totalStepsW) / 2;

      const steps = [
        { num: "1", tit: "Abre la Cámara", sub: "Desde tu teléfono" },
        { num: "2", tit: "Apunta al QR", sub: "Sin descargar apps" },
        { num: "3", tit: "Mira el Menú", sub: "Con fotos y precios" },
      ];

      steps.forEach((s, idx) => {
        const sx = startX + idx * (stepBoxW + stepGap);
        ctx.fillStyle = isLight ? "#F8FAFC" : "rgba(255, 255, 255, 0.04)";
        ctx.beginPath();
        ctx.roundRect(sx, stepsY, stepBoxW, 70, 14);
        ctx.fill();
        ctx.strokeStyle = isLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Número en círculo dorado
        ctx.fillStyle = goldLight;
        ctx.beginPath();
        ctx.arc(sx + 32, stepsY + 35, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0F172A";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(s.num, sx + 32, stepsY + 36);

        // Texto del paso
        ctx.textAlign = "left";
        ctx.fillStyle = primaryCol;
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(s.tit, sx + 62, stepsY + 28);

        ctx.fillStyle = subCol;
        ctx.font = "500 15px sans-serif";
        ctx.fillText(s.sub, sx + 62, stepsY + 50);
      });

      y += 110;

      // Línea divisoria
      ctx.strokeStyle = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(140, y);
      ctx.lineTo(width - 140, y);
      ctx.stroke();
      y += 45;

      // 7. Pie de página - Atlan como referencia pequeña
      ctx.textAlign = "center";
      ctx.fillStyle = subCol;
      ctx.font = "600 20px sans-serif";
      ctx.fillText("Menú Digital impulsado por Plataforma Atlan • www.plataforma-atlan.com", width / 2, y);

      // Disparar descarga del PNG
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

  const isLight = tema === "light";

  return (
    <div style={styles.backdrop} onClick={onClose} className="qr-modal-backdrop">
      <div style={styles.cardModal} onClick={(e) => e.stopPropagation()} className="qr-modal-card">
        {/* CABECERA DEL MODAL */}
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={styles.iconBox}>
              <Icon name="qrCode" size={20} color="#FFD700" />
            </div>
            <div>
              <h3 style={styles.title}>Exhibidor QR para Mesas</h3>
              <p style={styles.subtitle}>
                Diseño optimizado para soportes acrílicos de restaurante (10x15 cm) o stickers de mesa
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn} title="Cerrar">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* SELECTOR DE ESTILO */}
        <div style={styles.themeBar}>
          <span style={styles.themeLabel}>Estilo de la tarjeta para imprimir:</span>
          <div style={styles.themeButtons}>
            <button
              type="button"
              onClick={() => setTema("light")}
              style={{
                ...styles.themeBtn,
                background: isLight ? "#FFFFFF" : "rgba(255,255,255,0.06)",
                color: isLight ? "#0F172A" : "#94A3B8",
                borderColor: isLight ? "#F59E0B" : "rgba(255,255,255,0.12)",
                fontWeight: isLight ? "800" : "600",
                boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
              }}
            >
              ☀️ Blanco Elegante (Ahorra Tinta y Recomendado)
            </button>
            <button
              type="button"
              onClick={() => setTema("dark")}
              style={{
                ...styles.themeBtn,
                background: !isLight ? "#0B192C" : "rgba(255,255,255,0.06)",
                color: !isLight ? "#FFD700" : "#94A3B8",
                borderColor: !isLight ? "#FFD700" : "rgba(255,255,255,0.12)",
                fontWeight: !isLight ? "800" : "600",
                boxShadow: !isLight ? "0 2px 8px rgba(255,215,0,0.2)" : "none",
              }}
            >
              🌙 Modo Noche / Lounge
            </button>
          </div>
        </div>

        {/* VISTA PREVIA DEL EXHIBIDOR DE MESA (SIN CORTARSE Y CON DISEÑO PROFESIONAL) */}
        <div style={styles.previewContainer}>
          {/* MOCKUP VISUAL DE SOPORTE ACRÍLICO */}
          <div style={styles.standMockupWrapper}>
            <div
              ref={printCardRef}
              id="print-qr-card"
              style={{
                ...styles.tableCard,
                background: isLight ? "#FFFFFF" : "#0A192F",
                color: isLight ? "#0F172A" : "#FFFFFF",
                borderColor: isLight ? "#CBD5E1" : "rgba(255, 215, 0, 0.45)",
                boxShadow: isLight
                  ? "0 20px 45px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)"
                  : "0 24px 55px rgba(0,0,0,0.7), 0 0 25px rgba(255, 215, 0, 0.18)",
              }}
            >
              {/* Franja superior decorativa */}
              <div style={styles.cardTopBanner}>
                <span style={{ ...styles.cardBadge, background: isLight ? "#FEF3C7" : "rgba(255,215,0,0.18)", color: isLight ? "#B45309" : "#FFD700", borderColor: isLight ? "#F59E0B" : "rgba(255,215,0,0.4)" }}>
                  ★ MENÚ DIGITAL & PROMOCIONES ★
                </span>
              </div>

              {/* Encabezado con Nombre Grande del Negocio */}
              <div style={styles.cardHeader}>
                {logoUrl ? (
                  <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", margin: "0 auto 8px", border: "2.5px solid #F59E0B", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                    <img src={logoUrl} alt={nombreNegocio} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", border: "2px solid #F59E0B" }}>
                    <Icon name="utensils" size={22} color="#F59E0B" />
                  </div>
                )}

                <h2 style={{ ...styles.businessTitle, color: isLight ? "#0F172A" : "#FFFFFF" }}>
                  {nombreNegocio}
                </h2>

                <p style={{ ...styles.businessMeta, color: isLight ? "#475569" : "#94A3B8" }}>
                  {categoria.toUpperCase()} • {ubicacion.toUpperCase()}
                </p>
              </div>

              <div style={{ ...styles.divider, background: isLight ? "rgba(0,0,0,0.09)" : "rgba(255,255,255,0.12)" }} />

              {/* Sección central con el llamado y el código QR */}
              <div style={styles.cardBody}>
                <div style={{ ...styles.scanTitle, color: isLight ? "#0F172A" : "#FFFFFF" }}>
                  ESCANEA CON TU CELULAR
                </div>
                <div style={{ ...styles.scanSubtitle, color: isLight ? "#64748B" : "#94A3B8" }}>
                  Apunta con tu cámara para ver fotos, platillos y precios
                </div>

                {/* Contenedor del código QR con esquinas estilo visor */}
                <div style={styles.qrContainerBox}>
                  <div style={styles.qrFrameCornerTL} />
                  <div style={styles.qrFrameCornerTR} />
                  <div style={styles.qrFrameCornerBL} />
                  <div style={styles.qrFrameCornerBR} />

                  <div style={styles.qrWhitePlate}>
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Código QR del Menú" style={styles.qrImage} />
                    ) : (
                      <div style={{ width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 12 }}>
                        Generando QR…
                      </div>
                    )}
                  </div>
                </div>

                {/* Guía gráfica de 3 pasos rápidos */}
                <div style={styles.stepsRow}>
                  <div style={{ ...styles.stepBadge, background: isLight ? "#F1F5F9" : "rgba(255,255,255,0.06)", borderColor: isLight ? "#E2E8F0" : "rgba(255,255,255,0.1)" }}>
                    <span style={styles.stepNum}>1</span>
                    <span style={{ ...styles.stepText, color: isLight ? "#334155" : "#E2E8F0" }}>Abre Cámara</span>
                  </div>
                  <div style={{ ...styles.stepBadge, background: isLight ? "#F1F5F9" : "rgba(255,255,255,0.06)", borderColor: isLight ? "#E2E8F0" : "rgba(255,255,255,0.1)" }}>
                    <span style={styles.stepNum}>2</span>
                    <span style={{ ...styles.stepText, color: isLight ? "#334155" : "#E2E8F0" }}>Apunta al QR</span>
                  </div>
                  <div style={{ ...styles.stepBadge, background: isLight ? "#F1F5F9" : "rgba(255,255,255,0.06)", borderColor: isLight ? "#E2E8F0" : "rgba(255,255,255,0.1)" }}>
                    <span style={styles.stepNum}>3</span>
                    <span style={{ ...styles.stepText, color: isLight ? "#334155" : "#E2E8F0" }}>Mira el Menú</span>
                  </div>
                </div>

                <div style={{ ...styles.noAppsNote, color: isLight ? "#64748B" : "#94A3B8" }}>
                  Sin descargar aplicaciones • Rápido y seguro
                </div>
              </div>

              <div style={{ ...styles.divider, background: isLight ? "rgba(0,0,0,0.09)" : "rgba(255,255,255,0.12)" }} />

              {/* Pie de página sutil con Atlan como respaldo */}
              <div style={styles.cardFooter}>
                <span style={{ ...styles.atlanFooterText, color: isLight ? "#64748B" : "#94A3B8" }}>
                  Menú Digital en <strong>Plataforma Atlan</strong> • Turismo Nicaragua
                </span>
              </div>
            </div>

            {/* Base física simulada del acrílico */}
            <div style={styles.acrylicStandBase} />
          </div>
        </div>

        {/* BARRA DE ACCIONES */}
        <div style={styles.modalActions}>
          <div style={styles.linkInfoBox}>
            <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: "700" }}>Destino:</span>
            <span style={styles.linkUrl} title={urlDestino}>
              {urlDestino}
            </span>
          </div>

          <div style={styles.buttonsGroup}>
            <button
              type="button"
              onClick={handleCopiarEnlace}
              style={styles.actionBtnSecondary}
              title="Copiar enlace"
            >
              <Icon name={copiado ? "check" : "copy"} size={14} />
              <span>{copiado ? "¡Copiado!" : "Copiar Enlace"}</span>
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              style={styles.actionBtnSecondary}
              title="Imprimir tarjeta de mesa"
            >
              <Icon name="printer" size={14} />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDescargarPng}
              disabled={generandoPng || !qrDataUrl}
              style={styles.actionBtnPrimary}
            >
              <Icon name="download" size={15} />
              <span>{generandoPng ? "Generando PNG…" : "Descargar Tarjeta en Alta Resolución (PNG)"}</span>
            </button>
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
            padding: 14mm 10mm !important;
            background: #FFFFFF !important;
            color: #0F172A !important;
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
    padding: "24px 16px",
    overflowY: "auto",
  },
  cardModal: {
    width: "100%",
    maxWidth: 640,
    maxHeight: "min(92vh, 840px)",
    background: "#070E18",
    borderRadius: 22,
    border: "1.5px solid rgba(255,215,0,0.35)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.85), 0 0 35px rgba(255,215,0,0.12)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    margin: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    flexShrink: 0,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "rgba(255,215,0,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    margin: 0,
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  subtitle: {
    margin: "3px 0 0",
    fontSize: 12,
    color: "#94A3B8",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#CBD5E1",
    width: 32,
    height: 32,
    borderRadius: 10,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  themeBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 22px",
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexWrap: "wrap",
    gap: 8,
    flexShrink: 0,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#CBD5E1",
  },
  themeButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  themeBtn: {
    padding: "6px 14px",
    borderRadius: 10,
    border: "1.5px solid",
    cursor: "pointer",
    fontSize: 11.5,
    transition: "all 0.15s ease",
  },
  previewContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 20px 28px",
    display: "flex",
    justifyContent: "center",
    background: "radial-gradient(circle at center, rgba(14, 116, 144, 0.12) 0%, transparent 70%)",
  },
  standMockupWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: 350,
    width: "100%",
  },
  tableCard: {
    width: "100%",
    borderRadius: "18px 18px 4px 4px",
    border: "2px solid",
    padding: "18px 18px 16px",
    textAlign: "center",
    transition: "all 0.2s ease",
    position: "relative",
  },
  cardTopBanner: {
    marginBottom: 8,
  },
  cardBadge: {
    fontSize: 9.5,
    fontWeight: "800",
    padding: "3px 12px",
    borderRadius: 12,
    border: "1px solid",
    letterSpacing: "0.06em",
    display: "inline-block",
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  businessTitle: {
    margin: "0 0 3px",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
  },
  businessMeta: {
    margin: "0",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: "0.04em",
  },
  divider: {
    height: 1,
    margin: "12px 0",
    width: "100%",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  scanTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: "0.05em",
    marginBottom: 2,
  },
  scanSubtitle: {
    fontSize: 11,
    maxWidth: 240,
    lineHeight: 1.35,
    marginBottom: 10,
  },
  qrContainerBox: {
    position: "relative",
    padding: 8,
    margin: "0 auto 12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qrFrameCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 14,
    height: 14,
    borderTop: "3px solid #D97706",
    borderLeft: "3px solid #D97706",
    borderRadius: "3px 0 0 0",
  },
  qrFrameCornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderTop: "3px solid #D97706",
    borderRight: "3px solid #D97706",
    borderRadius: "0 3px 0 0",
  },
  qrFrameCornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 14,
    height: 14,
    borderBottom: "3px solid #D97706",
    borderLeft: "3px solid #D97706",
    borderRadius: "0 0 0 3px",
  },
  qrFrameCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderBottom: "3px solid #D97706",
    borderRight: "3px solid #D97706",
    borderRadius: "0 0 3px 0",
  },
  qrWhitePlate: {
    background: "#FFFFFF",
    padding: 8,
    borderRadius: 14,
    border: "1.5px solid rgba(0,0,0,0.1)",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
    display: "inline-flex",
  },
  qrImage: {
    width: 160,
    height: 160,
    display: "block",
  },
  stepsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 6,
    width: "100%",
    marginBottom: 8,
  },
  stepBadge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 6px",
    borderRadius: 8,
    border: "1px solid",
  },
  stepNum: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#F59E0B",
    color: "#0F172A",
    fontSize: 10,
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: {
    fontSize: 9.5,
    fontWeight: "800",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  noAppsNote: {
    fontSize: 10,
    fontWeight: "600",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  atlanFooterText: {
    fontSize: 10,
    letterSpacing: "0.02em",
  },
  acrylicStandBase: {
    width: "104%",
    height: 10,
    background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(203, 213, 225, 0.9) 100%)",
    borderRadius: "0 0 10px 10px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
    border: "1px solid rgba(148, 163, 184, 0.4)",
    marginTop: -2,
  },
  modalActions: {
    padding: "14px 22px",
    background: "rgba(0,0,0,0.35)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    flexShrink: 0,
  },
  linkInfoBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.03)",
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  linkUrl: {
    fontSize: 11.5,
    color: "#38BDF8",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  buttonsGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },
  actionBtnSecondary: {
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "750",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.15s ease",
  },
  actionBtnPrimary: {
    padding: "9px 18px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #FFD700 0%, #D97706 100%)",
    color: "#0A192F",
    fontSize: 12.5,
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    boxShadow: "0 4px 14px rgba(217,119,6,0.3)",
    transition: "all 0.15s ease",
  },
};
