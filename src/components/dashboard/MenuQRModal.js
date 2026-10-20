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
      width: 480,
      margin: 1,
      color: {
        dark: tema === "light" ? "#0F172A" : "#000000",
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

  // Copiar link al portapapeles
  const handleCopiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(urlDestino);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // fallback
    }
  };

  // Imprimir directo con estilos específicos
  const handleImprimir = () => {
    window.print();
  };

  // Generar y descargar la tarjeta en PNG de Alta Resolución (1200 x 1650 px ~ 300 DPI para impresión física)
  const handleDescargarPng = async () => {
    setGenerandoPng(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const width = 1200;
      const height = 1650;
      canvas.width = width;
      canvas.height = height;

      const isLight = tema === "light";
      const bgCard = isLight ? "#FFFFFF" : "#0A192F";
      const borderCol = isLight ? "#CBD5E1" : "rgba(255, 215, 0, 0.4)";
      const titleCol = isLight ? "#0F172A" : "#FFFFFF";
      const subCol = isLight ? "#475569" : "#94A3B8";
      const goldCol = "#D97706";
      const atlanTextCol = isLight ? "#64748B" : "#94A3B8";

      // 1. Fondo general de la tarjeta
      ctx.fillStyle = bgCard;
      ctx.fillRect(0, 0, width, height);

      // 2. Marco exterior elegante
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 6;
      ctx.strokeRect(36, 36, width - 72, height - 72);

      // Marco interior sutil
      ctx.strokeStyle = isLight ? "rgba(217, 119, 6, 0.25)" : "rgba(255, 215, 0, 0.2)";
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, width - 96, height - 96);

      // 3. Cabecera - Negocio Protagonista
      let yCursor = 130;

      // Cargar logo si existe o dibujar ícono de establecimiento
      if (logoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = logoUrl;
          });
          const imgSize = 130;
          const imgX = (width - imgSize) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, yCursor + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, imgX, yCursor, imgSize, imgSize);
          ctx.restore();

          // Borde del logo
          ctx.strokeStyle = goldCol;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(width / 2, yCursor + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.stroke();
          yCursor += imgSize + 30;
        } catch {
          yCursor += 20;
        }
      } else {
        yCursor += 30;
      }

      // Nombre del negocio en grande y destacado
      ctx.fillStyle = titleCol;
      ctx.font = "bold 64px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Ajustar texto si es muy largo
      let fontSize = 64;
      while (ctx.measureText(nombreNegocio).width > width - 180 && fontSize > 36) {
        fontSize -= 4;
        ctx.font = `bold ${fontSize}px sans-serif`;
      }
      ctx.fillText(nombreNegocio, width / 2, yCursor);
      yCursor += 55;

      // Categoría y Ubicación
      ctx.fillStyle = subCol;
      ctx.font = "600 28px sans-serif";
      ctx.fillText(`${categoria.toUpperCase()} • ${ubicacion.toUpperCase()}`, width / 2, yCursor);
      yCursor += 55;

      // Insignia Oficial
      ctx.fillStyle = isLight ? "#FEF3C7" : "rgba(255, 215, 0, 0.15)";
      const badgeW = 320;
      const badgeH = 46;
      ctx.beginPath();
      ctx.roundRect((width - badgeW) / 2, yCursor - badgeH / 2, badgeW, badgeH, 23);
      ctx.fill();
      ctx.strokeStyle = isLight ? "#F59E0B" : "#FFD700";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isLight ? "#B45309" : "#FFD700";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("★ MENÚ DIGITAL OFICIAL ★", width / 2, yCursor + 1);
      yCursor += 65;

      // Línea divisoria elegante
      ctx.strokeStyle = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, yCursor);
      ctx.lineTo(width - 140, yCursor);
      ctx.stroke();
      yCursor += 55;

      // Llamado a la acción
      ctx.fillStyle = isLight ? "#0F172A" : "#FFFFFF";
      ctx.font = "bold 34px sans-serif";
      ctx.fillText("ESCANEA CON TU CELULAR", width / 2, yCursor);
      yCursor += 42;

      ctx.fillStyle = subCol;
      ctx.font = "500 24px sans-serif";
      ctx.fillText("Para ver nuestros platillos, fotos y precios actualizados", width / 2, yCursor);
      yCursor += 60;

      // 4. Dibujar Código QR en el centro
      const qrImg = new Image();
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });

      const qrSize = 520;
      const qrX = (width - qrSize) / 2;
      // Contenedor blanco para el QR para máximo contraste al escanear
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(qrX - 20, yCursor - 20, qrSize + 40, qrSize + 40, 24);
      ctx.fill();
      ctx.strokeStyle = isLight ? "#E2E8F0" : "#FFD700";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, yCursor, qrSize, qrSize);
      yCursor += qrSize + 55;

      // Subtexto de comodidad
      ctx.fillStyle = subCol;
      ctx.font = "500 22px sans-serif";
      ctx.fillText("Sin descargar aplicaciones • Rápido, higiénico y directo", width / 2, yCursor);
      yCursor += 65;

      // Línea divisoria inferior
      ctx.strokeStyle = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(180, yCursor);
      ctx.lineTo(width - 180, yCursor);
      ctx.stroke();
      yCursor += 50;

      // 5. Pie de página - Atlan pequeñito y sutil como respaldo tecnológico
      ctx.fillStyle = atlanTextCol;
      ctx.font = "600 20px sans-serif";
      ctx.fillText("Menú interactivo impulsado por Plataforma Atlan • Turismo Nicaragua", width / 2, yCursor);

      // Disparar descarga del PNG generado
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
        {/* Cabecera del modal */}
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={styles.iconBox}>
              <Icon name="qrCode" size={20} color="#FFD700" />
            </div>
            <div>
              <h3 style={styles.title}>Tarjeta QR de Mesa</h3>
              <p style={styles.subtitle}>
                Imprime o descarga la tarjeta para colocar en los acrílicos de tus mesas
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn} title="Cerrar">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Barra de opciones de tema */}
        <div style={styles.themeBar}>
          <span style={styles.themeLabel}>Estilo de la tarjeta:</span>
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
              }}
            >
              ☀️ Blanco Elegante (Ideal para Imprimir)
            </button>
            <button
              type="button"
              onClick={() => setTema("dark")}
              style={{
                ...styles.themeBtn,
                background: !isLight ? "#0A192F" : "rgba(255,255,255,0.06)",
                color: !isLight ? "#FFD700" : "#94A3B8",
                borderColor: !isLight ? "#FFD700" : "rgba(255,255,255,0.12)",
                fontWeight: !isLight ? "800" : "600",
              }}
            >
              🌙 Modo Noche / Lounge
            </button>
          </div>
        </div>

        {/* Vista previa en vivo de la Tarjeta de Mesa */}
        <div style={styles.previewContainer}>
          <div
            ref={printCardRef}
            id="print-qr-card"
            style={{
              ...styles.tableCard,
              background: isLight ? "#FFFFFF" : "#0A192F",
              color: isLight ? "#0F172A" : "#FFFFFF",
              borderColor: isLight ? "#E2E8F0" : "rgba(255, 215, 0, 0.4)",
              boxShadow: isLight
                ? "0 18px 40px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.2)"
                : "0 22px 50px rgba(0,0,0,0.6), 0 0 25px rgba(255, 215, 0, 0.15)",
            }}
          >
            {/* Cabecera del comercio (Protagonista en grande) */}
            <div style={styles.cardHeader}>
              {logoUrl ? (
                <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", margin: "0 auto 10px", border: "2px solid #F59E0B" }}>
                  <img src={logoUrl} alt={nombreNegocio} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: "#F59E0B" }}>
                  <Icon name="utensils" size={24} color="#F59E0B" />
                </div>
              )}

              {/* Nombre grande del negocio */}
              <h2 style={{ ...styles.businessTitle, color: isLight ? "#0F172A" : "#FFFFFF" }}>
                {nombreNegocio}
              </h2>

              <p style={{ ...styles.businessMeta, color: isLight ? "#64748B" : "#94A3B8" }}>
                {categoria.toUpperCase()} • {ubicacion.toUpperCase()}
              </p>

              <div style={{ ...styles.cardBadge, background: isLight ? "#FEF3C7" : "rgba(255,215,0,0.15)", color: isLight ? "#B45309" : "#FFD700", borderColor: isLight ? "#F59E0B" : "rgba(255,215,0,0.4)" }}>
                ★ MENÚ DIGITAL OFICIAL ★
              </div>
            </div>

            <div style={{ ...styles.divider, background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)" }} />

            {/* Código QR y llamada a la acción */}
            <div style={styles.cardBody}>
              <div style={{ ...styles.scanTitle, color: isLight ? "#0F172A" : "#FFFFFF" }}>
                ESCANEA CON TU CELULAR
              </div>
              <div style={{ ...styles.scanSubtitle, color: isLight ? "#64748B" : "#94A3B8" }}>
                Para consultar platillos, fotos y precios actualizados
              </div>

              {/* Marco blanco del QR para lectura óptima */}
              <div style={styles.qrWrapper}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Código QR del Menú" style={styles.qrImage} />
                ) : (
                  <div style={{ width: 170, height: 170, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                    Generando QR…
                  </div>
                )}
              </div>

              <div style={{ ...styles.noAppsNote, color: isLight ? "#64748B" : "#94A3B8" }}>
                Sin descargar apps • Rápido, higiénico y directo
              </div>
            </div>

            <div style={{ ...styles.divider, background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)" }} />

            {/* Pie de página con Atlan pequeño como referencia */}
            <div style={styles.cardFooter}>
              <span style={{ ...styles.atlanFooterText, color: isLight ? "#94A3B8" : "#64748B" }}>
                Menú interactivo en Plataforma Atlan • Turismo Nicaragua
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Acciones del modal */}
        <div style={styles.modalActions}>
          <div style={styles.linkInfoBox}>
            <span style={{ fontSize: 11.5, color: "#94A3B8" }}>Enlace del QR:</span>
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
              <span>{copiado ? "¡Enlace Copiado!" : "Copiar Enlace"}</span>
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
              <span>{generandoPng ? "Generando PNG…" : "Descargar Tarjeta (PNG Alta Calidad)"}</span>
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
            width: 100mm !important;
            max-width: 100mm !important;
            border: 1px solid #CBD5E1 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 16mm 10mm !important;
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
    background: "rgba(3, 7, 18, 0.85)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1300,
    padding: "24px 16px",
    overflowY: "auto",
  },
  cardModal: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "min(92vh, 760px)",
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
    background: "rgba(255,255,255,0.02)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexWrap: "wrap",
    gap: 8,
    flexShrink: 0,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },
  themeButtons: {
    display: "flex",
    gap: 8,
  },
  themeBtn: {
    padding: "6px 12px",
    borderRadius: 10,
    border: "1px solid",
    cursor: "pointer",
    fontSize: 11.5,
    transition: "all 0.15s ease",
  },
  previewContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(circle at center, rgba(14, 116, 144, 0.08) 0%, transparent 70%)",
  },
  tableCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 18,
    border: "2px solid",
    padding: "22px 20px",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  businessTitle: {
    margin: "0 0 4px",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
  },
  businessMeta: {
    margin: "0 0 10px",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: "0.04em",
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: "800",
    padding: "3px 10px",
    borderRadius: 12,
    border: "1px solid",
    letterSpacing: "0.06em",
  },
  divider: {
    height: 1,
    margin: "14px 0",
    width: "100%",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  scanTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: "0.04em",
    marginBottom: 3,
  },
  scanSubtitle: {
    fontSize: 11,
    maxWidth: 240,
    lineHeight: 1.35,
    marginBottom: 12,
  },
  qrWrapper: {
    background: "#FFFFFF",
    padding: 10,
    borderRadius: 14,
    border: "1.5px solid rgba(0,0,0,0.08)",
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 170,
    height: 170,
    display: "block",
  },
  noAppsNote: {
    fontSize: 10.5,
    marginTop: 10,
    fontWeight: "600",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  atlanFooterText: {
    fontSize: 9.5,
    fontWeight: "600",
    letterSpacing: "0.02em",
  },
  modalActions: {
    padding: "14px 22px",
    background: "rgba(0,0,0,0.3)",
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
