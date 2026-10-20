"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { uploadMedia } from "@/lib/storage";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";
import {
  MEMBERSHIP_PRICE_USD,
  PLAN_LIMITS,
  hasActiveMembership,
  isMember,
  membershipDaysLeft,
  getPaymentInfo,
} from "@/lib/membership";

const MONTH_OPTIONS = [1, 3, 6, 12];

export default function MembresiaPage() {
  const { tr, lang } = useTranslation();
  const router = useRouter();
  const { session, perfil, loading: authLoading, refreshProfile } = useAuth();

  const [historial, setHistorial] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [meses, setMeses] = useState(1);
  const [referencia, setReferencia] = useState("");
  const [comprobante, setComprobante] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { type, text }
  const [copiedAccount, setCopiedAccount] = useState(false);

  const pago = getPaymentInfo();
  const activa = hasActiveMembership(perfil);
  const diasRestantes = membershipDaysLeft(perfil);
  const legacy = isMember(perfil) && !activa;
  const pendiente = historial.some((h) => h.estado === "pendiente");

  useEffect(() => {
    if (authLoading) return;
    if (!session) router.replace("/login");
  }, [authLoading, session, router]);

  const [reloadKey, setReloadKey] = useState(0);
  const cargarHistorial = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    supabase
      .from("membresias")
      .select("*")
      .eq("usuario_id", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setHistorial(data || []);
        setLoadingHist(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session, reloadKey]);

  const handleCopyAccount = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pago.cuenta);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    }
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setMensaje(null);
    if (!comprobante && !referencia.trim()) {
      setMensaje({
        type: "error",
        text: tr(
          "Sube tu comprobante o escribe el número de referencia de la transferencia.",
          "Upload your receipt or enter the transfer reference number.",
          "请上传付款凭证或填写转账参考号。"
        ),
      });
      return;
    }
    setEnviando(true);
    try {
      let comprobanteUrl = null;
      if (comprobante) comprobanteUrl = await uploadMedia(comprobante, "membresias/comprobantes");

      const { error } = await supabase.from("membresias").insert({
        usuario_id: session.user.id,
        origen: "pago",
        estado: "pendiente",
        meses,
        monto: MEMBERSHIP_PRICE_USD * meses,
        metodo_pago: "transferencia",
        referencia: referencia.trim() || null,
        comprobante_url: comprobanteUrl,
      });
      if (error) throw error;

      setComprobante(null);
      setReferencia("");
      setMensaje({
        type: "success",
        text: tr(
          "¡Solicitud enviada con éxito! Revisaremos tu pago y activaremos tu membresía pronto.",
          "Request sent successfully! We will review your payment and activate your membership soon.",
          "申请提交成功！我们将审核并为您激活会员。"
        ),
      });
      cargarHistorial();
      refreshProfile?.();
    } catch (err) {
      console.error("[Membresia] Error enviando solicitud:", err);
      setMensaje({
        type: "error",
        text: tr(
          "No se pudo enviar la solicitud. Intenta de nuevo.",
          "Could not send the request. Please try again.",
          "无法提交申请，请重试。"
        ),
      });
    } finally {
      setEnviando(false);
    }
  };

  const fmtFecha = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : lang === "zh" ? "zh-CN" : "es-NI", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const estadoLabel = {
    pendiente: tr("En revisión", "Under review", "审核中"),
    aprobada: tr("Aprobada", "Approved", "已批准"),
    rechazada: tr("Rechazada", "Rejected", "已拒绝"),
  };
  const estadoColor = { pendiente: "#FBBF24", aprobada: "#10B981", rechazada: "#EF4444" };

  const filas = [
    [tr("Negocios administrados", "Managed businesses", "商户数量"), PLAN_LIMITS.free.negocios, `${PLAN_LIMITS.pro.negocios} locales`],
    [tr("Fotos de galería", "Gallery photos", "图库照片"), `${PLAN_LIMITS.free.fotosGaleria} fotos`, `${PLAN_LIMITS.pro.fotosGaleria} fotos`],
    [tr("Platos en el menú", "Menu dishes", "菜单菜品"), `${PLAN_LIMITS.free.platosMenu} platos`, tr("Ilimitados", "Unlimited", "无限")],
    [tr("Video del negocio", "Business video", "商户视频"), false, true],
    [tr("Menú QR descargable", "Downloadable QR menu", "可下载二维码菜单"), false, true],
    [tr("Insignia Verificado", "Verified badge", "认证徽章"), false, true],
    [tr("Pin dorado y posición destacada", "Golden pin & featured map spot", "地图置顶与金色图钉"), false, true],
  ];

  const renderCell = (v) =>
    v === true ? (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", background: "rgba(16,185,129,0.18)", color: "#10B981" }}>
        <Icon name="check" size={15} color="#10B981" />
      </span>
    ) : v === false ? (
      <span style={{ color: "#64748B", fontSize: 18 }}>—</span>
    ) : (
      <span style={{ fontWeight: "700" }}>{v}</span>
    );

  if (authLoading || !session) return null;

  return (
    <div style={styles.page}>
      <Navbar activePage="membresia" session={session} perfil={perfil} />

      <main style={styles.main} className="mem-main">
        {/* CONTENEDOR GENERAL UNIFICADO */}
        <div style={styles.mainContainer} className="mem-container">
          {/* 1. CABECERA INTEGRADA */}
          <header style={styles.integratedHeader} className="mem-header">
            <h1 style={styles.h1} className="mem-h1">
              {tr("Haz crecer tu negocio con ", "Grow your business with ", "用 ")}
              <span style={styles.goldText}>Tuani Pro</span>
            </h1>
            <p style={styles.sub} className="mem-sub">
              {tr(
                "Más visibilidad en el mapa, más fotos, herramientas de menú QR y prioridad turística por un costo simbólico.",
                "More map visibility, more gallery photos, QR menu tools and tourist priority for a symbolic price.",
                "更高的地图曝光度、更多照片、二维码菜单以及游客搜索优先权，价格亲民。"
              )}
            </p>
          </header>

          {/* 2. CINTA DE BENEFICIOS DESTACADOS */}
          <section style={styles.metricsRibbon} className="mem-ribbon">
            <div style={styles.metricItem} className="mem-ribbon-item">
              <div style={{ ...styles.metricIconBox, background: "rgba(255,215,0,0.16)", color: "#FFD700" }}>
                <Icon name="star" size={18} color="#FFD700" />
              </div>
              <div>
                <div style={styles.highlightTitle}>{tr("Posición Destacada", "Featured Spot", "置顶推荐")}</div>
                <div style={styles.highlightDesc}>{tr("Pin dorado y primeros en búsquedas de turistas", "Golden pin and top placement in search results", "专属金色图钉，游客搜索排名更靠前")}</div>
              </div>
            </div>

            <div style={styles.metricItem} className="mem-ribbon-item">
              <div style={{ ...styles.metricIconBox, background: "rgba(56,189,248,0.16)", color: "#38BDF8" }}>
                <Icon name="briefcase" size={18} color="#38BDF8" />
              </div>
              <div>
                <div style={styles.highlightTitle}>{tr("15 Fotos y hasta 5 Locales", "15 Photos & up to 5 Locations", "15张照片与多达5处商户")}</div>
                <div style={styles.highlightDesc}>{tr("Menú ilimitado, videos y galería completa", "Unlimited dishes, video and complete gallery", "无限菜品目录、视频展示及丰富图库")}</div>
              </div>
            </div>

            <div style={styles.metricItem} className="mem-ribbon-item">
              <div style={{ ...styles.metricIconBox, background: "rgba(16,185,129,0.16)", color: "#10B981" }}>
                <Icon name="check" size={18} color="#10B981" />
              </div>
              <div>
                <div style={styles.highlightTitle}>{tr("Menú QR y Verificación", "QR Menu & Verification", "二维码菜单与官方认证")}</div>
                <div style={styles.highlightDesc}>{tr("QR descargable para tus mesas y sello oficial", "Downloadable QR for tables and verified badge", "可直接打印用于桌面的二维码与官方认证标识")}</div>
              </div>
            </div>
          </section>

          {/* 3. CONTENIDO EN 2 COLUMNAS */}
          <div style={styles.innerContentGrid} className="mem-grid">
            {/* COLUMNA IZQUIERDA: COMPARATIVA Y BENEFICIOS + HISTORIAL */}
            <div style={styles.leftCol} className="mem-left-col">
            {/* COMPARATIVA DE PLANES */}
            <section style={styles.card} className="mem-card">
              <div style={styles.planHeader}>
                <div>
                  <h2 style={styles.cardTitle}>{tr("Comparativa de Planes", "Plan Comparison", "套餐权益对比")}</h2>
                  <p style={styles.cardSubtitle}>
                    {tr("Compara lo que incluye la versión gratuita contra Tuani Pro", "Compare what Free includes against Tuani Pro", "了解免费版与 Tuani Pro 的全部功能对比")}
                  </p>
                </div>
                <div style={styles.priceTag}>
                  <div style={styles.priceNum}>${MEMBERSHIP_PRICE_USD}</div>
                  <div style={styles.priceFreq}>/ {tr("mes", "mo", "月")}</div>
                </div>
              </div>

              <div style={{ overflowX: "auto" }} className="mem-table-scroll">
                <table style={styles.table} className="mem-table">
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, textAlign: "left" }} className="mem-th">{tr("Beneficio", "Feature", "权益项目")}</th>
                      <th style={{ ...styles.th, width: "110px" }} className="mem-th">{tr("Gratis", "Free", "免费版")}</th>
                      <th style={{ ...styles.th, width: "140px", color: "#FFD700", background: "rgba(255,215,0,0.08)", borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }} className="mem-th">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          Tuani Pro <Icon name="star" size={13} color="#FFD700" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map(([label, free, pro]) => (
                      <tr key={label} style={styles.tr}>
                        <td style={{ ...styles.td, textAlign: "left", fontWeight: "600", color: "#F1F5F9" }} className="mem-td">{label}</td>
                        <td style={styles.td} className="mem-td">{renderCell(free)}</td>
                        <td style={{ ...styles.td, background: "rgba(255,215,0,0.04)", color: "#FFD700" }} className="mem-td">{renderCell(pro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.noticeBox}>
                <Icon name="lock" size={14} color="#FBBF24" />
                <span>
                  {tr(
                    "Si ya tienes contenido creado que supera el plan gratuito, no se eliminará nada; simplemente se conservará sin poder agregar nuevos elementos hasta activar Tuani Pro.",
                    "If you already have existing content exceeding the free limits, nothing is deleted; it is preserved safely until you activate Tuani Pro.",
                    "若您现有内容超出免费限制，已发布内容绝不会被删除，仅限制继续新增，升级后立享完整额度。"
                  )}
                </span>
              </div>
            </section>

            {/* HISTORIAL DE SOLICITUDES */}
            <section style={styles.card} className="mem-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={styles.cardTitle}>{tr("Mis Solicitudes y Pagos", "My Requests & Payments", "我的申请与付款记录")}</h2>
                <button
                  type="button"
                  onClick={cargarHistorial}
                  style={styles.refreshBtn}
                  title={tr("Actualizar historial", "Refresh history", "刷新记录")}
                >
                  <Icon name="refresh" size={12} style={{ marginRight: 4 }} />
                  <span>{tr("Actualizar", "Refresh", "刷新")}</span>
                </button>
              </div>

              {loadingHist ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8" }}>
                  {tr("Cargando historial...", "Loading history...", "正在加载记录...")}
                </div>
              ) : historial.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#94A3B8", background: "rgba(255,255,255,0.02)", borderRadius: 14 }}>
                  <Icon name="briefcase" size={24} color="#64748B" />
                  <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>
                    {tr("Aún no tienes solicitudes registradas.", "You have no payment requests yet.", "暂无申请或付款记录。")}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {historial.map((h) => (
                    <div key={h.id} style={styles.histRow} className="mem-hist-row">
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ fontSize: 14.5, fontWeight: "800", color: "#FFFFFF" }}>
                          {h.origen === "cortesia" ? tr("Cortesía Especial", "Special Courtesy", "官方赠送") : `${h.meses} ${tr("mes(es) Tuani Pro", "month(s) Tuani Pro", "个月 Tuani Pro")} · $${h.monto}`}
                        </div>
                        <div style={styles.histSub}>
                          {tr("Enviado:", "Sent:", "提交于：")} {fmtFecha(h.created_at)}
                          {h.vence_en ? ` · ${tr("Vence:", "Expires:", "到期：")} ${fmtFecha(h.vence_en)}` : ""}
                          {h.referencia ? ` · Ref: ${h.referencia}` : ""}
                        </div>
                        {h.comprobante_url && (
                          <a href={h.comprobante_url} target="_blank" rel="noopener noreferrer" style={styles.receiptLink}>
                            <Icon name="link" size={12} style={{ marginRight: 4 }} />
                            <span>{tr("Ver comprobante adjunto", "View attached receipt", "查看上传凭证")}</span>
                          </a>
                        )}
                        {h.estado === "rechazada" && h.motivo_rechazo && (
                          <div style={{ ...styles.histSub, color: "#F87171", fontWeight: "600", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon name="x" size={12} color="#F87171" />
                            <span>{tr("Motivo:", "Reason:", "原因：")} {h.motivo_rechazo}</span>
                          </div>
                        )}
                      </div>
                      <span style={{ ...styles.pill, color: estadoColor[h.estado], borderColor: estadoColor[h.estado], background: `${estadoColor[h.estado]}15` }}>
                        {estadoLabel[h.estado]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* COLUMNA DERECHA: STATUS ACTUAL + FORMULARIO DE PAGO */}
          <div style={styles.rightCol} className="mem-right-col">
            {/* ESTADO ACTUAL */}
            <section style={{ ...styles.card, borderColor: perfil?.rol === "admin" ? "rgba(255,215,0,0.6)" : activa || legacy ? "rgba(16,185,129,0.45)" : "rgba(255,215,0,0.25)" }} className="mem-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8, color: "#94A3B8" }}>
                  {tr("ESTADO DE TU CUENTA", "ACCOUNT STATUS", "账户状态")}
                </span>
                <span style={{
                  ...styles.pill,
                  color: perfil?.rol === "admin" ? "#FFD700" : activa || legacy ? "#10B981" : "#FFD700",
                  borderColor: perfil?.rol === "admin" ? "#FFD700" : activa || legacy ? "#10B981" : "#FFD700",
                  background: perfil?.rol === "admin" ? "rgba(255,215,0,0.2)" : activa || legacy ? "rgba(16,185,129,0.15)" : "rgba(255,215,0,0.12)"
                }}>
                  {perfil?.rol === "admin" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Icon name="shield" size={13} color="#FFD700" />
                      {tr("Admin · Acceso Vitalicio", "Admin · Lifetime Access", "管理员 · 终身特权")}
                    </span>
                  ) : activa || legacy ? (
                    tr("Turista Deacachimba", "Top Tourist", "骨灰级旅行家")
                  ) : (
                    tr("Turista Tuani", "Cool Tourist", "达人旅行家")
                  )}
                </span>
              </div>

              {perfil?.rol === "admin" ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: "850", color: "#FFD700", marginBottom: 6 }}>
                    <Icon name="star" size={18} color="#FFD700" />
                    <span>{tr("Tuani Pro Permanente Activo", "Lifetime Tuani Pro Active", "终身 Tuani Pro 已激活")}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#E2E8F0", lineHeight: 1.5 }}>
                    {tr(
                      "Como Administrador de Atlan, tu cuenta cuenta con acceso permanente e ilimitado a todas las herramientas y beneficios de Tuani Pro sin costo ni vencimiento.",
                      "As an Atlan Administrator, your account has permanent and unlimited access to all Tuani Pro tools and benefits with no cost or expiration.",
                      "作为 Atlan 平台管理员，您的账户永久免费尊享 Tuani Pro 全部功能与权益，无到期时间限制。"
                    )}
                  </p>
                </div>
              ) : activa ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: "850", color: "#10B981", marginBottom: 6 }}>
                    <Icon name="check" size={18} color="#10B981" />
                    <span>{tr("Membresía Tuani Pro Activa", "Active Tuani Pro Membership", "Tuani Pro 会员已生效")}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#CBD5E1", lineHeight: 1.5 }}>
                    {tr("Vence el", "Expires on", "到期日：")}{" "}
                    <strong style={{ color: "#FFFFFF" }}>{fmtFecha(perfil.membresia_vence_en)}</strong>
                    {" "}(<span style={{ color: "#FFD700", fontWeight: "700" }}>{diasRestantes} {tr("días restantes", "days left", "天剩余")}</span>).
                    {" "}{tr("Puedes renovar en cualquier momento; los meses se sumarán automáticamente a tu fecha de vencimiento.", "You can renew anytime; months add up automatically to your expiration.", "您可以随时续费，月数将自动累加至到期日。")}
                  </p>
                </div>
              ) : legacy ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: "800", color: "#10B981", marginBottom: 4 }}>
                    <Icon name="check" size={18} color="#10B981" />
                    <span>{tr("Beneficios Deacachimba activos", "Top Tourist benefits active", "已拥有超级游客特权")}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#CBD5E1" }}>
                    {tr("Tu cuenta cuenta con rango especial Deacachimba.", "Your account has active special privileges.", "您的账户已拥有平台特权。")}
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 15, fontWeight: "850", color: "#FFFFFF", marginBottom: 4 }}>
                    {tr("Plan Actual: Gratuito", "Current Plan: Free", "当前套餐：免费版")}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#94A3B8", lineHeight: 1.45 }}>
                    {tr(
                      "Tu negocio opera con los límites estándar (1 local, 3 fotos, 10 platos). Activa Tuani Pro abajo para desbloquear todas las ventajas.",
                      "Your business operates on standard limits (1 location, 3 photos, 10 dishes). Upgrade below to unlock full power.",
                      "目前处于基础免费版额度（1个商户、3张照片、10道菜品）。升级 Tuani Pro 即可立即解锁全部功能。"
                    )}
                  </p>
                </div>
              )}
            </section>

            {/* FORMULARIO DE PAGO & ACTIVACIÓN */}
            <section style={{ ...styles.card, border: "1.5px solid rgba(255,215,0,0.35)", boxShadow: "0 12px 36px rgba(0,0,0,0.45)" }} className="mem-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,215,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="star" size={18} color="#FFD700" />
                </div>
                <div>
                  <h2 style={{ ...styles.cardTitle, margin: 0, fontSize: 18 }}>
                    {perfil?.rol === "admin"
                      ? tr("Prueba de Pago (Modo Admin)", "Payment Test (Admin Mode)", "付款测试（管理员模式）")
                      : activa
                      ? tr("Renovar Tuani Pro", "Renew Tuani Pro", "续费 Tuani Pro")
                      : tr("Activar Tuani Pro", "Activate Tuani Pro", "开通 Tuani Pro")}
                  </h2>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>
                    {perfil?.rol === "admin"
                      ? tr("Tu cuenta ya tiene acceso total vitalicio", "Your account already has lifetime full access", "您的管理员账户已具备永久完全访问权")
                      : tr("Pago directo por transferencia o billetera", "Direct transfer or mobile wallet payment", "银行转账或电子钱包直接支付")}
                  </span>
                </div>
              </div>

              {/* TARJETA DE DATOS BANCARIOS */}
              <div style={styles.bankCard} className="mem-bank-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: "800", color: "#FFD700", textTransform: "uppercase", letterSpacing: 0.6 }}>
                    {tr("DATOS DE TRANSFERENCIA", "TRANSFER DETAILS", "汇款账号信息")}
                  </span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{pago.moneda}</span>
                </div>

                <div style={styles.bankRow} className="mem-bank-row">
                  <span style={styles.bankLabel}>{tr("Banco", "Bank", "银行")}:</span>
                  <strong style={styles.bankValue}>{pago.banco}</strong>
                </div>

                <div style={styles.bankRow} className="mem-bank-row">
                  <span style={styles.bankLabel}>{tr("No. de Cuenta", "Account No.", "账号")}:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <strong style={{ ...styles.bankValue, color: "#38BDF8", fontFamily: "monospace", fontSize: 14 }}>{pago.cuenta}</strong>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      style={styles.copyBtn}
                      title={tr("Copiar número de cuenta", "Copy account number", "复制账号")}
                    >
                      {copiedAccount ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Icon name="check" size={12} />
                          {tr("¡Copiado!", "Copied!", "已复制")}
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Icon name="copy" size={12} />
                          {tr("Copiar", "Copy", "复制")}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div style={styles.bankRow} className="mem-bank-row">
                  <span style={styles.bankLabel}>{tr("Titular", "Beneficiary", "户名")}:</span>
                  <strong style={styles.bankValue}>{pago.titular}</strong>
                </div>
              </div>

              {/* FORMULARIO DE ENVÍO */}
              <form onSubmit={enviarSolicitud} style={styles.form}>
                <div>
                  <label style={styles.label}>{tr("Meses a contratar", "Subscription length", "开通月数")}</label>
                  <div style={styles.monthChipsGrid} className="mem-month-chips">
                    {MONTH_OPTIONS.map((m) => {
                      const selected = meses === m;
                      const total = MEMBERSHIP_PRICE_USD * m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMeses(m)}
                          className="mem-month-chip"
                          style={{
                            ...styles.monthChip,
                            borderColor: selected ? "#FFD700" : "rgba(255,255,255,0.12)",
                            background: selected ? "rgba(255,215,0,0.18)" : "rgba(255,255,255,0.04)",
                            color: selected ? "#FFD700" : "#CBD5E1",
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: "800" }}>
                            {m} {m === 1 ? tr("mes", "mo", "个月") : tr("meses", "mos", "个月")}
                          </div>
                          <div style={{ fontSize: 11.5, opacity: 0.85 }}>${total}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={styles.label}>
                    {tr("Número de referencia o confirmación", "Reference / Confirmation number", "转账流水号或确认号")}
                  </label>
                  <input
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    style={styles.input}
                    placeholder={tr("Ej: 84930194", "e.g., 84930194", "例：84930194")}
                  />
                </div>

                <div>
                  <label style={styles.label}>
                    {tr("Comprobante de pago (Foto o PDF)", "Payment receipt (Image or PDF)", "付款凭证（图片或PDF）")}
                  </label>
                  <div style={styles.fileBox} className="mem-file-box">
                    <input
                      type="file"
                      id="comprobante-input"
                      accept="image/*,application/pdf"
                      onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="comprobante-input" style={styles.fileLabel}>
                      <Icon name="upload" size={18} color="#FFD700" />
                      <span style={{ fontSize: 13 }}>
                        {comprobante ? comprobante.name : tr("Haz clic para seleccionar imagen o PDF", "Click to select image or PDF", "点击选择图片或PDF凭证")}
                      </span>
                    </label>
                    {comprobante && (
                      <button type="button" onClick={() => setComprobante(null)} style={styles.removeFileBtn} title={tr("Quitar archivo", "Remove file", "移除文件")}>
                        <Icon name="x" size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {mensaje && (
                  <div style={{ ...styles.msgBox, background: mensaje.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", borderColor: mensaje.type === "success" ? "#10B981" : "#EF4444", color: mensaje.type === "success" ? "#10B981" : "#F87171" }}>
                    <span>{mensaje.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enviando || pendiente}
                  className="mem-submit-btn"
                  style={{
                    ...styles.submitBtn,
                    opacity: enviando || pendiente ? 0.6 : 1,
                    cursor: enviando || pendiente ? "not-allowed" : "pointer",
                  }}
                >
                  {pendiente ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Icon name="hourglass" size={14} />
                      {tr("Ya tienes un pago en revisión", "Payment under review", "已有一笔付款在审核中")}
                    </span>
                  ) : enviando ? (
                    tr("Enviando solicitud...", "Submitting request...", "提交中...")
                  ) : (
                    tr(`Enviar Comprobante — $${MEMBERSHIP_PRICE_USD * meses}`, `Submit Receipt — $${MEMBERSHIP_PRICE_USD * meses}`, `提交凭证 — $${MEMBERSHIP_PRICE_USD * meses}`)
                  )}
                </button>
              </form>

              <div style={styles.trustFooter}>
                <Icon name="zap" size={14} color="#FFD700" style={{ marginRight: 6 }} />
                <span>{tr("Activación rápida por el equipo de Atlan", "Fast activation by Atlan team", "Atlan 团队快速人工审核激活")}</span>
              </div>
            </section>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 22, paddingBottom: 10 }}>
          <Link href="/dashboard" style={styles.backLink}>
            <Icon name="arrowLeft" size={14} style={{ marginRight: 6 }} />
            {tr("Volver al Panel de Negocios", "Back to Business Dashboard", "返回商户管理中心")}
          </Link>
        </div>
      </div>
    </main>

    <style jsx global>{`
      /* Tablet y Pantallas Medianas (≤ 960px) */
      @media (max-width: 960px) {
        .mem-grid {
          grid-template-columns: 1fr !important;
          gap: 18px !important;
          padding: 20px 20px 26px !important;
        }
        .mem-right-col {
          position: static !important;
        }
        .mem-ribbon {
          grid-template-columns: 1fr !important;
          padding: 14px 20px !important;
          gap: 12px !important;
        }
      }

      /* Celulares modernos (Samsung Galaxy S24 Ultra ~384-412px, iPhone 15/16 Pro Max, Pixel) */
      @media (max-width: 640px) {
        .mem-main {
          padding: 82px 12px 36px !important;
          gap: 16px !important;
        }
        .mem-container {
          border-radius: 18px !important;
        }
        .mem-header {
          padding: 22px 14px 18px !important;
        }
        .mem-h1 {
          font-size: 24px !important;
          line-height: 1.25 !important;
          margin: 10px 0 6px !important;
        }
        .mem-sub {
          font-size: 13px !important;
          line-height: 1.45 !important;
        }
        .mem-grid {
          padding: 14px 12px 20px !important;
          gap: 16px !important;
        }
        .mem-card {
          padding: 16px 14px !important;
          border-radius: 16px !important;
        }
        .mem-ribbon {
          padding: 12px 14px !important;
          gap: 8px !important;
        }
        .mem-ribbon-item {
          padding: 4px 0 !important;
        }
        .mem-table-scroll {
          margin: 0 -6px;
          padding-bottom: 6px;
          -webkit-overflow-scrolling: touch;
        }
        .mem-table {
          min-width: 380px;
        }
        .mem-th, .mem-td {
          padding: 8px 6px !important;
          font-size: 11.5px !important;
        }
        .mem-bank-card {
          padding: 12px 12px !important;
        }
        .mem-bank-row {
          font-size: 12px !important;
          flex-wrap: wrap !important;
          gap: 4px !important;
        }
        .mem-month-chips {
          gap: 6px !important;
        }
        .mem-month-chip {
          padding: 6px 2px !important;
        }
        .mem-hist-row {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 8px !important;
          padding: 11px 12px !important;
        }
        .mem-submit-btn {
          padding: 12px 16px !important;
          font-size: 13.5px !important;
          min-height: 44px;
        }
      }

      /* Celulares ultra-compactos (≤ 380px) */
      @media (max-width: 380px) {
        .mem-main {
          padding: 78px 8px 30px !important;
        }
        .mem-month-chips {
          grid-template-columns: repeat(2, 1fr) !important;
        }
        .mem-h1 {
          font-size: 21px !important;
        }
      }
    `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#070E18",
    color: "#E2E8F0",
    fontFamily: "var(--font-outfit), sans-serif",
    position: "relative",
  },
  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1240,
    margin: "0 auto",
    padding: "116px 20px 60px",
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  mainContainer: {
    background: "#0C1524",
    borderRadius: 22,
    border: "1px solid rgba(255, 255, 255, 0.09)",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55)",
    overflow: "hidden",
  },
  integratedHeader: {
    padding: "32px 30px 24px",
    textAlign: "center",
    background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 16px",
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#FFD700",
    background: "rgba(255,215,0,0.12)",
    border: "1.5px solid rgba(255,215,0,0.35)",
    boxShadow: "0 4px 14px rgba(255,215,0,0.15)",
  },
  h1: {
    fontSize: "clamp(28px, 4.2vw, 40px)",
    fontWeight: "900",
    margin: "14px 0 8px",
    color: "#FFFFFF",
    lineHeight: 1.2,
  },
  goldText: {
    color: "#FFD700",
  },
  sub: {
    color: "#94A3B8",
    fontSize: "clamp(13.5px, 1.8vw, 15px)",
    maxWidth: 680,
    margin: "0 auto",
    lineHeight: 1.5,
  },
  metricsRibbon: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    alignItems: "center",
    padding: "16px 30px",
    background: "rgba(0, 0, 0, 0.22)",
    borderTop: "1px solid rgba(255, 255, 255, 0.07)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
    gap: 16,
  },
  metricItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "4px 8px",
  },
  metricIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  highlightDesc: {
    fontSize: 11.5,
    color: "#94A3B8",
    lineHeight: 1.35,
  },
  innerContentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))",
    gap: 22,
    padding: "24px 30px 30px",
    alignItems: "start",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    position: "sticky",
    top: 96,
  },
  card: {
    background: "#0F1E33",
    borderRadius: 18,
    padding: "20px 22px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "850",
    color: "#FFFFFF",
    margin: "0 0 4px",
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: "#94A3B8",
    margin: 0,
  },
  planHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 14,
    marginBottom: 14,
  },
  priceTag: {
    textAlign: "right",
    flexShrink: 0,
  },
  priceNum: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFD700",
    lineHeight: 1,
  },
  priceFreq: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13.5,
    margin: "4px 0 14px",
  },
  th: {
    padding: "10px 12px",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#94A3B8",
    textAlign: "center",
    borderBottom: "1.5px solid rgba(255,255,255,0.12)",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  td: {
    padding: "11px 12px",
    textAlign: "center",
  },
  noticeBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 14px",
    background: "rgba(251,191,36,0.08)",
    border: "1px solid rgba(251,191,36,0.25)",
    borderRadius: 12,
    fontSize: 12,
    color: "#FDE68A",
    lineHeight: 1.45,
  },
  refreshBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 8,
    color: "#94A3B8",
    fontSize: 11.5,
    fontWeight: "700",
    padding: "4px 10px",
    cursor: "pointer",
  },
  histRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  histSub: {
    fontSize: 12,
    color: "#94A3B8",
  },
  receiptLink: {
    fontSize: 12,
    color: "#38BDF8",
    textDecoration: "underline",
    width: "fit-content",
    marginTop: 2,
  },
  pill: {
    fontSize: 11,
    fontWeight: "800",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid",
    whiteSpace: "nowrap",
  },
  bankCard: {
    background: "linear-gradient(135deg, rgba(20,109,158,0.2) 0%, rgba(10,25,47,0.4) 100%)",
    border: "1px dashed rgba(255,215,0,0.45)",
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 16,
  },
  bankRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    padding: "3px 0",
    fontSize: 13,
    flexWrap: "wrap",
  },
  bankLabel: {
    color: "#94A3B8",
  },
  bankValue: {
    color: "#FFFFFF",
  },
  copyBtn: {
    background: "rgba(56,189,248,0.15)",
    border: "1px solid rgba(56,189,248,0.35)",
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: 6,
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  label: {
    display: "block",
    fontSize: 12.5,
    fontWeight: "750",
    color: "#CBD5E1",
    marginBottom: 6,
  },
  monthChipsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
  },
  monthChip: {
    padding: "8px 4px",
    borderRadius: 12,
    border: "1.5px solid",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    transition: "all 0.15s ease",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1.5px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#FFFFFF",
    fontSize: 13.5,
    boxSizing: "border-box",
  },
  fileBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1.5px dashed rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: "10px 14px",
  },
  fileLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#E2E8F0",
    cursor: "pointer",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  removeFileBtn: {
    background: "rgba(239,68,68,0.2)",
    border: "none",
    color: "#EF4444",
    borderRadius: "50%",
    width: 22,
    height: 22,
    fontSize: 11,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  msgBox: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid",
    fontSize: 13,
    fontWeight: "700",
  },
  submitBtn: {
    padding: "14px 20px",
    borderRadius: 14,
    border: "none",
    fontWeight: "900",
    fontSize: 14.5,
    color: "#0A192F",
    background: "linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)",
    boxShadow: "0 8px 24px rgba(245,158,11,0.35)",
    transition: "transform 0.15s ease",
  },
  trustFooter: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 11.5,
    color: "#94A3B8",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    padding: "8px 18px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "750",
    textDecoration: "none",
  },
};
