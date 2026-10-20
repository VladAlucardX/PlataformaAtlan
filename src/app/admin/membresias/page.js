"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";

export default function AdminMembresiasPage() {
  const { tr, lang } = useTranslation();
  const router = useRouter();
  const { session, perfil, loading: authLoading } = useAuth();

  const [pendientes, setPendientes] = useState([]);
  const [activos, setActivos] = useState([]);
  const [perfilesMap, setPerfilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Formulario de cortesía / pago directo
  const [destino, setDestino] = useState(null);
  const [tipo, setTipo] = useState("cortesia");
  const [cantidad, setCantidad] = useState(30);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Modal para seleccionar usuario destinatario
  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
  const [busquedaModal, setBusquedaModal] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [usuariosModal, setUsuariosModal] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  const isAdmin = perfil?.rol === "admin";

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!session) router.replace("/login");
    else if (perfil && perfil.rol !== "admin") router.replace("/mapa");
  }, [authLoading, session, perfil, router]);

  const [reloadKey, setReloadKey] = useState(0);
  const cargar = useCallback(() => setReloadKey((k) => k + 1), []);

  const llamarApi = useCallback(async (payload) => {
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch("/api/membresia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s?.session?.access_token}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Error");
    return json;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await llamarApi({ action: "datos_admin" });
        if (cancelled) return;
        setPendientes(data.pendientes || []);
        setActivos(data.activos || []);
        setPerfilesMap(data.perfilesMap || {});
      } catch (err) {
        console.error("Error al cargar datos admin:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, reloadKey, llamarApi]);

  const aprobar = async (m) => {
    if (!confirm(tr("¿Aprobar este pago y activar la membresía Tuani Pro?", "Approve this payment and activate Tuani Pro?", "确认批准此付款并激活会员？"))) return;
    try {
      await llamarApi({ action: "aprobar", id: m.id });
      showToast(tr("¡Membresía activada con éxito!", "Membership activated successfully!", "会员已成功激活！"));
      cargar();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const rechazar = async (m) => {
    const motivo = prompt(tr("Motivo del rechazo del comprobante:", "Receipt rejection reason:", "请输入驳回原因："));
    if (!motivo || !motivo.trim()) return;
    try {
      await llamarApi({ action: "rechazar", id: m.id, motivo });
      showToast(tr("Solicitud rechazada.", "Request rejected.", "申请已驳回。"), "info");
      cargar();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const cargarUsuariosModal = useCallback(async (q, rol) => {
    setCargandoUsuarios(true);
    try {
      const res = await llamarApi({ action: "buscar_usuarios", q, rol });
      setUsuariosModal(res.usuarios || []);
    } catch (err) {
      console.error("Error buscando usuarios:", err);
    } finally {
      setCargandoUsuarios(false);
    }
  }, [llamarApi]);

  const abrirModalUsuarios = () => {
    setModalUsuarioAbierto(true);
    setBusquedaModal("");
    cargarUsuariosModal("", filtroRol);
  };

  const handleCambiarFiltroRol = (rol) => {
    setFiltroRol(rol);
    cargarUsuariosModal(busquedaModal, rol);
  };

  const handleCambiarBusqueda = (val) => {
    setBusquedaModal(val);
    cargarUsuariosModal(val, filtroRol);
  };

  const seleccionarUsuario = (usuario) => {
    setDestino(usuario);
    setModalUsuarioAbierto(false);
  };

  const guardarManual = async (e) => {
    e.preventDefault();
    if (!destino) return showToast(tr("Selecciona un usuario de la lista", "Select a user from the list", "请选择目标用户"), "error");
    setGuardando(true);
    try {
      await llamarApi(
        tipo === "cortesia"
          ? { action: "cortesia", usuario_id: destino.id, dias: cantidad, notas }
          : { action: "registrar", usuario_id: destino.id, meses: cantidad, notas }
      );
      showToast(tr("¡Beneficio de membresía aplicado exitosamente!", "Membership benefit applied successfully!", "会员权益已成功应用！"));
      setDestino(null);
      setNotas("");
      cargar();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : lang === "zh" ? "zh-CN" : "es-NI", { day: "2-digit", month: "short", year: "numeric" }) : "—");

  const calcDiasRestantes = (venceIso) => {
    if (!venceIso) return 0;
    return Math.max(0, Math.ceil((new Date(venceIso) - new Date()) / 86400000));
  };

  if (authLoading || !isAdmin) return null;

  return (
    <div style={styles.page}>
      <Navbar activePage="admin" session={session} perfil={perfil} />

      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" : toast.type === "info" ? "linear-gradient(135deg, #146D9E 0%, #0D4E72 100%)" : "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}>
          <span>{toast.text}</span>
        </div>
      )}

      <main style={styles.main} className="admin-mem-main">
        {/* CONTENEDOR GENERAL UNIFICADO */}
        <div style={styles.mainContainer} className="admin-mem-container">
          {/* 1. CABECERA INTEGRADA */}
          <header style={styles.integratedHeader} className="admin-mem-header">
            <div style={styles.headerTopRow} className="admin-mem-top-row">
              <Link href="/admin" style={styles.backLink} className="admin-mem-back-link">
                <Icon name="arrowLeft" size={14} style={{ marginRight: 6 }} />
                {tr("Volver a Administración General", "Back to General Admin", "返回总管理后台")}
              </Link>
              <button
                type="button"
                onClick={cargar}
                style={styles.refreshBtnHeader}
                className="admin-mem-refresh-header"
                title="Recargar datos"
              >
                <Icon name="refresh" size={13} style={{ marginRight: 6 }} />
                {tr("Refrescar", "Refresh", "刷新")}
              </button>
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={styles.heroBadge}>
                <Icon name="shield" size={13} color="#FFD700" />
                <span>{tr("PANEL DE CONTROL ADMINISTRATIVO", "ADMIN CONTROL HUB", "管理控制中心")}</span>
              </div>
              <h1 style={styles.h1} className="admin-mem-h1">
                {tr("Gestión de Membresías ", "Tuani Pro ", "商户会员管理 ")}
                <span style={styles.goldText}>Tuani Pro</span>
              </h1>
              <p style={styles.sub} className="admin-mem-sub">
                {tr(
                  "Supervisa pagos por transferencia, aprueba comprobantes de negocios y asigna días de cortesía.",
                  "Review bank transfer payments, approve receipts and grant courtesy membership days to businesses.",
                  "审核商户汇款凭证、批准开通申请，并为合作商家赠送免费会员天数。"
                )}
              </p>
            </div>
          </header>

          {/* 2. CINTA DE MÉTRICAS KPI (INTEGRADA) */}
          <section style={styles.metricsRibbon} className="admin-mem-ribbon">
            <div style={styles.metricItem} className="admin-mem-ribbon-item">
              <div style={{ ...styles.metricIconBox, background: "rgba(251,191,36,0.16)", color: "#FBBF24" }}>
                <Icon name="star" size={18} color="#FBBF24" />
              </div>
              <div>
                <div style={styles.metricNum}>{pendientes.length}</div>
                <div style={styles.metricLabel}>{tr("Pagos Pendientes de Revisión", "Payments Pending Review", "待审核付款")}</div>
              </div>
            </div>

            <div style={styles.metricItem} className="admin-mem-ribbon-item">
              <div style={{ ...styles.metricIconBox, background: "rgba(16,185,129,0.16)", color: "#10B981" }}>
                <Icon name="check" size={18} color="#10B981" />
              </div>
              <div>
                <div style={styles.metricNum}>{activos.length}</div>
                <div style={styles.metricLabel}>{tr("Comercios Tuani Pro Activos", "Active Tuani Pro Businesses", "有效会员商户")}</div>
              </div>
            </div>

            <div style={styles.metricItem} className="admin-mem-ribbon-item">
              <div style={{ ...styles.metricIconBox, background: "rgba(56,189,248,0.16)", color: "#38BDF8" }}>
                <Icon name="briefcase" size={18} color="#38BDF8" />
              </div>
              <div>
                <div style={styles.metricNum}>$6.00 <span style={{ fontSize: 13, fontWeight: "600", color: "#94A3B8" }}>USD</span></div>
                <div style={styles.metricLabel}>{tr("Tarifa Mensual Simbólica", "Symbolic Monthly Fee", "每月象征性资费")}</div>
              </div>
            </div>
          </section>

          {/* 3. CONTENIDO EN 2 COLUMNAS (DENTRO DEL CONTENEDOR GENERAL) */}
          <div style={styles.innerContentGrid} className="admin-mem-grid">
          {/* COLUMNA IZQUIERDA: PAGOS PENDIENTES & MIEMBROS ACTIVOS */}
          <div style={styles.leftCol} className="admin-mem-left-col">
            {/* PAGOS POR REVISAR */}
            <section style={{ ...styles.card, border: pendientes.length > 0 ? "1.5px solid rgba(251,191,36,0.4)" : "1.5px solid rgba(255,255,255,0.12)" }} className="admin-mem-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(251,191,36,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="star" size={16} color="#FBBF24" />
                  </div>
                  <div>
                    <h2 style={{ ...styles.cardTitle, margin: 0, fontSize: 17.5 }}>
                      {tr("Pagos por Revisar", "Payments to Review", "待审核付款")} ({pendientes.length})
                    </h2>
                    <span style={styles.cardSubtitle}>
                      {tr("Comprobantes de transferencia subidos por los dueños", "Bank receipts submitted by business owners", "商户上传的银行转账凭证")}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={cargar} style={styles.refreshBtn} title="Recargar">
                  <Icon name="refresh" size={13} style={{ marginRight: 6 }} />
                  {tr("Refrescar", "Refresh", "刷新")}
                </button>
              </div>

              {loading ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#94A3B8" }}>
                  {tr("Cargando comprobantes...", "Loading receipts...", "正在加载凭证...")}
                </div>
              ) : pendientes.length === 0 ? (
                <div style={styles.emptyBox}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                    <Icon name="check" size={20} color="#10B981" />
                  </div>
                  <strong style={{ color: "#E2E8F0", fontSize: 14 }}>
                    {tr("¡Todo al día!", "All caught up!", "全部已处理！")}
                  </strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#94A3B8" }}>
                    {tr("No hay solicitudes ni comprobantes pendientes de aprobación.", "No pending payment receipts to approve.", "目前没有待处理的付款凭证。")}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendientes.map((m) => {
                    const p = perfilesMap[m.usuario_id];
                    return (
                      <div key={m.id} style={styles.requestCard} className="admin-mem-req-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: "850", color: "#FFFFFF" }}>
                              {p?.nombre_completo || tr("Usuario", "User", "用户")}
                            </div>
                            <div style={{ fontSize: 12.5, color: "#94A3B8" }}>{p?.email}</div>
                          </div>
                          <span style={styles.pendingBadge}>
                            <Icon name="hourglass" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                            {m.meses} {m.meses === 1 ? tr("mes", "mo", "个月") : tr("meses", "mos", "个月")} · ${m.monto}
                          </span>
                        </div>

                        <div style={styles.requestMeta}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Icon name="calendar" size={12} />
                            {tr("Enviado:", "Sent:", "提交于：")} {fmt(m.created_at)}
                          </span>
                          {m.referencia && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#38BDF8", fontWeight: "700" }}>
                              <Icon name="tag" size={12} color="#38BDF8" />
                              Ref: {m.referencia}
                            </span>
                          )}
                        </div>

                        {m.comprobante_url ? (
                          <div style={{ marginTop: 6, marginBottom: 8 }}>
                            <a
                              href={m.comprobante_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.viewDocBtn}
                            >
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <Icon name="fileText" size={13} color="#FFD700" />
                                {tr("Ver Comprobante de Transferencia", "View Transfer Receipt", "查看转账凭证图片/PDF")}
                              </span>
                              <Icon name="arrowRight" size={11} style={{ transform: "rotate(-45deg)" }} />
                            </a>
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic", margin: "4px 0" }}>
                            {tr("Sin archivo adjunto (pago reportado por referencia)", "No attachment (reported by reference)", "未上传文件（仅填写参考号）")}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 10, marginTop: 6 }} className="admin-mem-action-btns">
                          <button
                            type="button"
                            style={styles.approveBtn}
                            className="admin-mem-approve-btn"
                            onClick={() => aprobar(m)}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <Icon name="check" size={13} />
                              {tr("Aprobar y Activar", "Approve & Activate", "批准并开通")}
                            </span>
                          </button>
                          <button
                            type="button"
                            style={styles.rejectBtn}
                            className="admin-mem-reject-btn"
                            onClick={() => rechazar(m)}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <Icon name="x" size={13} />
                              {tr("Rechazar", "Reject", "驳回")}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* DIRECTORIO DE MIEMBROS ACTIVOS */}
            <section style={styles.card} className="admin-mem-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="check" size={16} color="#10B981" />
                  </div>
                  <div>
                    <h2 style={{ ...styles.cardTitle, margin: 0, fontSize: 17.5 }}>
                      {tr("Miembros Tuani Pro Activos", "Active Tuani Pro Members", "有效 Tuani Pro 会员")} ({activos.length})
                    </h2>
                    <span style={styles.cardSubtitle}>
                      {tr("Comercios con privilegios desbloqueados actualmente", "Businesses with currently unlocked benefits", "当前享有完整特权的所有合作商家")}
                    </span>
                  </div>
                </div>
              </div>

              {activos.length === 0 ? (
                <div style={styles.emptyBox}>
                  <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>
                    {tr("Aún no hay miembros con membresía activa registrada.", "No active member accounts registered yet.", "目前暂无有效会员记录。")}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activos.map((a) => {
                    const dias = calcDiasRestantes(a.membresia_vence_en);
                    return (
                      <div key={a.id} style={styles.memberRow} className="admin-mem-member-row">
                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: "800", color: "#FFFFFF" }}>
                            {a.nombre_completo || tr("Usuario Sin Nombre", "Unnamed User", "未命名用户")}
                          </div>
                          <div style={{ fontSize: 12, color: "#94A3B8" }}>{a.email}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={styles.activePill}>
                            <Icon name="star" size={11} color="#FFD700" style={{ marginRight: 4 }} />
                            {tr("Vence:", "Expires:", "到期：")} {fmt(a.membresia_vence_en)}
                          </span>
                          <div style={{ fontSize: 11, color: "#10B981", fontWeight: "700", marginTop: 3 }}>
                            {dias} {tr("días restantes", "days left", "天剩余")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* COLUMNA DERECHA: REGALAR DÍAS O REGISTRAR PAGO DIRECTO */}
          <div style={styles.rightCol} className="admin-mem-right-col">
            <section style={{ ...styles.card, border: "1.5px solid rgba(255,215,0,0.3)", boxShadow: "0 12px 36px rgba(0,0,0,0.4)" }} className="admin-mem-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,215,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="star" size={18} color="#FFD700" />
                </div>
                <div>
                  <h2 style={{ ...styles.cardTitle, margin: 0, fontSize: 18 }}>
                    {tr("Otorgar Cortesía o Pago Directo", "Grant Courtesy or Direct Payment", "赠送会员或手工登记收款")}
                  </h2>
                  <span style={styles.cardSubtitle}>
                    {tr("Regala días gratis o activa a un cliente manualmente", "Gift free trial days or activate manually", "直接为商户赠送天数或手动激活会员")}
                  </span>
                </div>
              </div>

              <form onSubmit={guardarManual} style={styles.form}>
                <div>
                  <label style={styles.label}>{tr("Usuario o negocio destinatario", "Target user or business", "目标用户或商户")}</label>
                  {destino ? (
                    <div style={styles.selectedUserBox} className="admin-mem-selected-user">
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: destino.avatar_url ? `url(${destino.avatar_url}) center/cover` : "linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)",
                          color: "#0A192F",
                          fontWeight: "900",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
                        }}>
                          {!destino.avatar_url && (destino.nombre_completo || destino.email || "U")[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>{destino.nombre_completo || tr("Sin nombre", "No name", "未命名")}</span>
                            <span style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 8,
                              fontWeight: "800",
                              background: destino.rol === "dueno" ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.1)",
                              color: destino.rol === "dueno" ? "#FFD700" : "#CBD5E1",
                              border: `1px solid ${destino.rol === "dueno" ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.15)"}`,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3
                            }}>
                              {destino.rol === "dueno" ? (
                                <>
                                  <Icon name="star" size={9} color="#FFD700" />
                                  <span>DUEÑO</span>
                                </>
                              ) : (
                                (destino.rol || "turista").toUpperCase()
                              )}
                            </span>
                          </div>
                          <div style={{ fontSize: 11.5, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {destino.email || "—"}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={abrirModalUsuarios}
                        style={styles.changeUserBtn}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Icon name="refresh" size={12} />
                          {tr("Cambiar", "Change", "更换")}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={abrirModalUsuarios}
                      style={styles.openUserModalBtn}
                      className="admin-mem-open-modal-btn"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={styles.openUserModalIcon}>
                          <Icon name="search" size={16} color="#FFD700" />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13.5 }}>
                            {tr("Seleccionar usuario o negocio destinatario…", "Select recipient user or business…", "选择目标用户或商家…")}
                          </div>
                          <div style={{ color: "#94A3B8", fontSize: 11.5, marginTop: 2 }}>
                            {tr("Haz clic para abrir el buscador interactivo con filtros", "Click to open interactive search modal with filters", "点击打开带筛选的用户选择弹窗")}
                          </div>
                        </div>
                      </div>
                      <Icon name="search" size={16} color="#FFD700" />
                    </button>
                  )}
                </div>

                <div>
                  <label style={styles.label}>{tr("Tipo de asignación", "Action type", "操作类型")}</label>
                  <div style={styles.typeGrid} className="admin-mem-type-grid">
                    <button
                      type="button"
                      onClick={() => { setTipo("cortesia"); setCantidad(30); }}
                      style={{
                        ...styles.typeBtn,
                        borderColor: tipo === "cortesia" ? "#FFD700" : "rgba(255,255,255,0.12)",
                        background: tipo === "cortesia" ? "rgba(255,215,0,0.18)" : "rgba(255,255,255,0.04)",
                        color: tipo === "cortesia" ? "#FFD700" : "#CBD5E1",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      <Icon name="gift" size={14} />
                      <span>{tr("Cortesía / Prueba", "Courtesy / Trial", "免费赠送")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTipo("registrar"); setCantidad(1); }}
                      style={{
                        ...styles.typeBtn,
                        borderColor: tipo === "registrar" ? "#38BDF8" : "rgba(255,255,255,0.12)",
                        background: tipo === "registrar" ? "rgba(56,189,248,0.18)" : "rgba(255,255,255,0.04)",
                        color: tipo === "registrar" ? "#38BDF8" : "#CBD5E1",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      <Icon name="dollarSign" size={14} />
                      <span>{tr("Pago en Efectivo / Meses", "Cash / Months", "已收现金登记")}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={styles.label}>
                    {tipo === "cortesia" ? tr("Días a regalar", "Days to grant", "赠送天数") : tr("Meses a registrar", "Months to register", "登记月数")}
                  </label>
                  {tipo === "cortesia" && (
                    <div style={styles.quickChipsGrid} className="admin-mem-quick-chips">
                      {[15, 30, 60, 90, 365].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCantidad(d)}
                          style={{
                            ...styles.quickChip,
                            borderColor: cantidad === d ? "#FFD700" : "rgba(255,255,255,0.12)",
                            background: cantidad === d ? "rgba(255,215,0,0.18)" : "rgba(255,255,255,0.04)",
                            color: cantidad === d ? "#FFD700" : "#CBD5E1",
                          }}
                        >
                          {d === 365 ? tr("1 Año", "1 Year", "1年") : `${d}d`}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    style={styles.input}
                    type="number"
                    min="1"
                    max={tipo === "cortesia" ? 365 : 36}
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label style={styles.label}>{tr("Notas internas o motivo (opcional)", "Internal notes (optional)", "内部备注（可选）")}</label>
                  <input
                    style={styles.input}
                    placeholder={tr("Ej: Promoción lanzamiento, pago en mano…", "e.g., Launch promo, in-person cash…", "例：开业特惠、线下收款…")}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardando || !destino}
                  className="admin-mem-submit-btn"
                  style={{
                    ...styles.submitBtn,
                    opacity: guardando || !destino ? 0.6 : 1,
                    cursor: guardando || !destino ? "not-allowed" : "pointer"
                  }}
                >
                  {guardando
                    ? tr("Aplicando...", "Applying...", "应用中...")
                    : tr("Aplicar Membresía Tuani Pro", "Apply Tuani Pro Membership", "应用 Tuani Pro 会员")}
                </button>
              </form>
            </section>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL INTERACTIVO DE BÚSQUEDA Y SELECCIÓN DE USUARIO */}
      {modalUsuarioAbierto && (
        <div style={styles.modalBackdrop} className="admin-mem-modal-backdrop" onClick={() => setModalUsuarioAbierto(false)}>
          <div style={styles.modalCard} className="admin-mem-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Cabecera del modal */}
            <div style={styles.modalHeader} className="admin-mem-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={styles.modalHeaderIcon}>
                  <Icon name="shop" size={18} color="#FFD700" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>
                    {tr("Seleccionar Negocio Destinatario", "Select Recipient Business", "选择目标商户")}
                  </h3>
                  <p style={styles.modalSubtitle}>
                    {tr("Solo dueños de negocios registrados en la plataforma Atlan", "Only verified business owners on Atlan platform", "仅限在Atlan平台注册的商户所有者")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalUsuarioAbierto(false)}
                style={styles.modalCloseBtn}
                title={tr("Cerrar", "Close", "关闭")}
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            {/* Barra de búsqueda interactiva */}
            <div style={styles.modalSearchBox} className="admin-mem-modal-search">
              <Icon name="search" size={15} color="#94A3B8" />
              <input
                autoFocus
                style={styles.modalSearchInput}
                placeholder={tr("Buscar por nombre de negocio, dueño o correo…", "Search by business name, owner or email…", "按商家名称、所有者或邮箱搜索…")}
                value={busquedaModal}
                onChange={(e) => handleCambiarBusqueda(e.target.value)}
              />
              {busquedaModal && (
                <button
                  type="button"
                  onClick={() => handleCambiarBusqueda("")}
                  style={styles.clearSearchBtn}
                >
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>

            {/* Chips de filtro por estado de membresía en negocios */}
            <div style={styles.modalFiltersRow} className="admin-mem-modal-filters">
              {[
                { id: "todos", label: tr("Todos los Negocios", "All Businesses", "全部商户"), icon: "shop" },
                { id: "sin_pro", label: tr("Sin Tuani Pro", "Without Tuani Pro", "未开通Pro"), icon: "clock" },
                { id: "con_pro", label: tr("Con Tuani Pro Activo", "Active Tuani Pro", "Pro有效"), icon: "star" },
              ].map((f) => {
                const activo = filtroRol === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleCambiarFiltroRol(f.id)}
                    style={{
                      ...styles.filterChip,
                      borderColor: activo ? "#FFD700" : "rgba(255,255,255,0.12)",
                      background: activo ? "rgba(255,215,0,0.18)" : "rgba(255,255,255,0.04)",
                      color: activo ? "#FFD700" : "#94A3B8",
                      fontWeight: activo ? "800" : "600",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    {f.icon && <Icon name={f.icon} size={12} />}
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Lista de usuarios con negocios */}
            <div style={styles.modalListContainer} className="admin-mem-modal-list">
              {cargandoUsuarios ? (
                <div style={styles.modalEmptyState}>
                  <Icon name="hourglass" size={26} color="#94A3B8" style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0, color: "#94A3B8", fontSize: 13 }}>
                    {tr("Buscando negocios registrados…", "Searching registered businesses…", "正在检索已登记商户…")}
                  </p>
                </div>
              ) : usuariosModal.length === 0 ? (
                <div style={styles.modalEmptyState}>
                  <Icon name="shop" size={28} color="#64748B" style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0, color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                    {tr("No se encontraron negocios", "No businesses found", "未找到商户")}
                  </p>
                  <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: 12 }}>
                    {tr("Intenta con otro nombre de local, dueño o correo", "Try another business name, owner or email", "请尝试其他店铺名称、所有者或邮箱")}
                  </p>
                </div>
              ) : (
                usuariosModal.map((u) => {
                  const dias = calcDiasRestantes(u.membresia_vence_en);
                  const tienePro = dias > 0;
                  const nombresNegocios = u.negocios && u.negocios.length > 0
                    ? u.negocios.map((n) => n.nombre).join(" • ")
                    : null;
                  return (
                    <div
                      key={u.id}
                      style={styles.userItemRow}
                      className="admin-mem-user-item"
                      onClick={() => seleccionarUsuario(u)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : "linear-gradient(135deg, #1E3A5F 0%, #0A192F 100%)",
                            border: "2px solid #FFD700",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
                            fontWeight: "900",
                            fontSize: 15,
                            flexShrink: 0,
                          }}
                        >
                          {!u.avatar_url && (u.nombre_completo || u.email || "N")[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                              {u.nombre_completo || tr("Dueño sin nombre registrado", "Unnamed owner", "未登记姓名所有者")}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                padding: "2px 7px",
                                borderRadius: 8,
                                fontWeight: "800",
                                background: "rgba(255,215,0,0.18)",
                                color: "#FFD700",
                                border: "1px solid rgba(255,215,0,0.35)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3
                              }}
                            >
                              <Icon name="shop" size={9} color="#FFD700" />
                              <span>{tr("NEGOCIO", "BUSINESS", "商户")}</span>
                            </span>
                          </div>

                          {/* Nombre del local / locales */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                            <Icon name="tag" size={11} color="#FFD700" />
                            <span style={{ fontSize: 12, color: "#E2E8F0", fontWeight: "700" }}>
                              {nombresNegocios || tr("Local comercial registrado", "Registered commercial spot", "已登记营业网点")}
                            </span>
                            {u.negocios && u.negocios.length > 1 && (
                              <span style={{ fontSize: 9, background: "rgba(255,215,0,0.16)", color: "#FFD700", padding: "1px 6px", borderRadius: 6, fontWeight: "800" }}>
                                {u.negocios.length} locales
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 11, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                            {u.email || tr("Sin correo visible", "No visible email", "无可见邮箱")}
                          </div>

                          {tienePro ? (
                            <div style={{ fontSize: 11, color: "#10B981", fontWeight: "700", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                              <Icon name="star" size={10} color="#10B981" />
                              <span>{tr("Tuani Pro activo:", "Active Tuani Pro:", "Tuani Pro 有效：")} {dias} {tr("días restantes", "days left", "天剩余")}</span>
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
                              {tr("Plan Estándar Gratuito (Sin Tuani Pro)", "Free Standard Plan (No Tuani Pro)", "免费标准版（未开通）")}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        style={styles.selectUserActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          seleccionarUsuario(u);
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {tr("Seleccionar", "Select", "选择")}
                          <Icon name="arrowRight" size={12} />
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie del modal */}
            <div style={styles.modalFooter} className="admin-mem-modal-footer">
              <span style={{ fontSize: 12, color: "#94A3B8" }}>
                {usuariosModal.length} {tr("negocio(s) disponible(s)", "business(es) available", "家可用商户")}
              </span>
              <button
                type="button"
                onClick={() => setModalUsuarioAbierto(false)}
                style={styles.closeModalBottomBtn}
              >
                {tr("Cerrar", "Close", "关闭")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Tablet y Pantallas Medianas (≤ 960px) */
        @media (max-width: 960px) {
          .admin-mem-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
            padding: 20px 20px 26px !important;
          }
          .admin-mem-right-col {
            position: static !important;
          }
          .admin-mem-ribbon {
            grid-template-columns: 1fr !important;
            padding: 14px 20px !important;
            gap: 12px !important;
          }
        }

        /* Celulares modernos (Samsung Galaxy S24 Ultra ~384-412px, iPhone 15/16 Pro Max, Pixel) */
        @media (max-width: 640px) {
          .admin-mem-main {
            padding: 82px 12px 36px !important;
            gap: 16px !important;
          }
          .admin-mem-container {
            border-radius: 18px !important;
          }
          .admin-mem-header {
            padding: 20px 14px 16px !important;
          }
          .admin-mem-top-row {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .admin-mem-back-link {
            min-height: 40px !important;
            padding: 6px 12px !important;
            border-radius: 10px !important;
            background: rgba(255,255,255,0.04) !important;
          }
          .admin-mem-refresh-header {
            min-height: 40px !important;
            padding: 6px 12px !important;
          }
          .admin-mem-h1 {
            font-size: 23px !important;
            line-height: 1.25 !important;
            margin: 10px 0 6px !important;
          }
          .admin-mem-sub {
            font-size: 13px !important;
            line-height: 1.45 !important;
          }
          .admin-mem-ribbon {
            padding: 12px 14px !important;
            gap: 8px !important;
          }
          .admin-mem-ribbon-item {
            padding: 4px 0 !important;
          }
          .admin-mem-grid {
            padding: 14px 12px 20px !important;
            gap: 16px !important;
          }
          .admin-mem-card {
            padding: 16px 14px !important;
            border-radius: 16px !important;
          }
          .admin-mem-req-card {
            padding: 12px !important;
            gap: 10px !important;
          }
          .admin-mem-action-btns {
            flex-direction: row !important;
            gap: 8px !important;
          }
          .admin-mem-approve-btn, .admin-mem-reject-btn {
            min-height: 42px !important;
            font-size: 12px !important;
            padding: 8px 10px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .admin-mem-member-row {
            padding: 10px 12px !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .admin-mem-selected-user {
            padding: 10px 12px !important;
          }
          .admin-mem-quick-chips {
            gap: 4px !important;
          }
          .admin-mem-submit-btn {
            min-height: 44px !important;
            padding: 12px 16px !important;
            font-size: 13.5px !important;
          }
          
          /* Modal de selección interactivo en móvil */
          .admin-mem-modal-backdrop {
            padding: 20px 14px !important;
          }
          .admin-mem-modal-card {
            border-radius: 20px !important;
            max-height: 84vh !important;
            margin: auto !important;
            width: 100% !important;
          }
          .admin-mem-modal-header {
            padding: 14px 16px !important;
          }
          .admin-mem-modal-search {
            padding: 10px 14px !important;
          }
          .admin-mem-modal-filters {
            padding: 8px 14px !important;
            -webkit-overflow-scrolling: touch;
          }
          .admin-mem-modal-list {
            padding: 10px 14px !important;
            max-height: none !important;
            flex: 1 !important;
          }
          .admin-mem-user-item {
            padding: 10px 12px !important;
            gap: 10px !important;
          }
          .admin-mem-modal-footer {
            padding: 12px 16px !important;
          }
        }

        /* Celulares ultra-compactos (≤ 380px) */
        @media (max-width: 380px) {
          .admin-mem-main {
            padding: 78px 8px 30px !important;
          }
          .admin-mem-h1 {
            font-size: 20px !important;
          }
          .admin-mem-quick-chips {
            grid-template-columns: repeat(3, 1fr) !important;
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
  },
  mainContainer: {
    background: "#0C1524",
    borderRadius: 22,
    border: "1px solid rgba(255, 255, 255, 0.09)",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55)",
    overflow: "hidden",
  },
  integratedHeader: {
    padding: "26px 30px 22px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
  },
  headerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "750",
    textDecoration: "none",
    transition: "color 0.15s ease",
  },
  refreshBtnHeader: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "750",
    padding: "6px 14px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 12px",
    borderRadius: 999,
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#FFD700",
    background: "rgba(255,215,0,0.10)",
    border: "1.5px solid rgba(255,215,0,0.30)",
  },
  h1: {
    fontSize: "clamp(24px, 3.2vw, 34px)",
    fontWeight: "900",
    margin: "10px 0 6px",
    color: "#FFFFFF",
    lineHeight: 1.2,
  },
  goldText: {
    color: "#FFD700",
  },
  sub: {
    color: "#94A3B8",
    fontSize: 13.5,
    margin: 0,
    lineHeight: 1.5,
    maxWidth: 720,
  },
  metricsRibbon: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
  metricNum: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 1.1,
  },
  metricLabel: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 2,
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
    fontWeight: "850",
    color: "#FFFFFF",
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: "#94A3B8",
    margin: 0,
  },
  refreshBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 8,
    color: "#94A3B8",
    fontSize: 11.5,
    fontWeight: "700",
    padding: "5px 10px",
    cursor: "pointer",
  },
  emptyBox: {
    padding: "28px 16px",
    textAlign: "center",
    background: "rgba(255,255,255,0.02)",
    borderRadius: 14,
    border: "1px dashed rgba(255,255,255,0.1)",
  },
  requestCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "14px 16px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  pendingBadge: {
    fontSize: 12,
    fontWeight: "800",
    padding: "3px 10px",
    borderRadius: 999,
    background: "rgba(251,191,36,0.15)",
    border: "1px solid rgba(251,191,36,0.4)",
    color: "#FBBF24",
  },
  requestMeta: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 12,
    color: "#94A3B8",
    flexWrap: "wrap",
  },
  viewDocBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 8,
    background: "rgba(56,189,248,0.12)",
    border: "1px solid rgba(56,189,248,0.3)",
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "750",
    textDecoration: "none",
  },
  approveBtn: {
    flex: 1,
    padding: "9px 14px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12.5,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
  },
  rejectBtn: {
    padding: "9px 14px",
    borderRadius: 10,
    border: "1px solid rgba(239,68,68,0.4)",
    background: "rgba(239,68,68,0.15)",
    color: "#F87171",
    fontWeight: "800",
    fontSize: 12.5,
    cursor: "pointer",
  },
  memberRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  activePill: {
    fontSize: 11.5,
    fontWeight: "800",
    padding: "3px 10px",
    borderRadius: 999,
    background: "rgba(16,185,129,0.15)",
    border: "1px solid rgba(16,185,129,0.35)",
    color: "#10B981",
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
  openUserModalBtn: {
    width: "100%",
    padding: "13px 15px",
    borderRadius: 14,
    border: "1.5px dashed rgba(255,215,0,0.45)",
    background: "rgba(255,215,0,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  openUserModalIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "rgba(255,215,0,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 7, 18, 0.82)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
    padding: "32px 20px",
    overflowY: "auto",
  },
  modalCard: {
    width: "100%",
    maxWidth: 580,
    maxHeight: "min(80vh, 560px)",
    background: "#0A192F",
    borderRadius: 22,
    border: "1.5px solid rgba(255,215,0,0.4)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.85), 0 0 35px rgba(255,215,0,0.14)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    margin: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  modalHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "rgba(255,215,0,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  modalSubtitle: {
    margin: "3px 0 0",
    fontSize: 12,
    color: "#94A3B8",
  },
  modalCloseBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#CBD5E1",
    width: 32,
    height: 32,
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSearchBox: {
    display: "flex",
    alignItems: "center",
    padding: "12px 18px",
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    gap: 10,
  },
  modalSearchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#FFFFFF",
    fontSize: 14,
    outline: "none",
  },
  clearSearchBtn: {
    background: "transparent",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    fontSize: 14,
  },
  modalFiltersRow: {
    display: "flex",
    gap: 8,
    padding: "10px 18px",
    overflowX: "auto",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  filterChip: {
    padding: "6px 12px",
    borderRadius: 20,
    border: "1px solid",
    cursor: "pointer",
    fontSize: 12,
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  modalListContainer: {
    flex: 1,
    minHeight: 140,
    overflowY: "auto",
    padding: "12px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  modalEmptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "36px 12px",
    textAlign: "center",
  },
  userItemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    gap: 12,
  },
  selectUserActionBtn: {
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,215,0,0.4)",
    background: "rgba(255,215,0,0.15)",
    color: "#FFD700",
    fontWeight: "800",
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.25)",
    flexShrink: 0,
  },
  closeModalBottomBtn: {
    padding: "7px 16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#CBD5E1",
    fontSize: 12.5,
    fontWeight: "750",
    cursor: "pointer",
  },
  selectedUserBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 14,
    background: "rgba(255,215,0,0.12)",
    border: "1.5px solid rgba(255,215,0,0.4)",
  },
  changeUserBtn: {
    background: "transparent",
    border: "none",
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "800",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 8,
  },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  typeBtn: {
    padding: "9px 8px",
    borderRadius: 10,
    border: "1.5px solid",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "800",
    transition: "all 0.15s ease",
  },
  quickChipsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 6,
    marginBottom: 8,
  },
  quickChip: {
    padding: "6px 2px",
    borderRadius: 8,
    border: "1px solid",
    cursor: "pointer",
    fontSize: 11.5,
    fontWeight: "800",
    textAlign: "center",
  },
  submitBtn: {
    padding: "13px 18px",
    borderRadius: 12,
    border: "none",
    fontWeight: "900",
    fontSize: 14,
    color: "#0A192F",
    background: "linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)",
    boxShadow: "0 8px 22px rgba(245,158,11,0.35)",
    transition: "transform 0.15s ease",
  },
  toast: {
    position: "fixed",
    top: 84,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1100,
    color: "#FFFFFF",
    padding: "12px 26px",
    borderRadius: 16,
    fontWeight: "800",
    fontSize: 13.5,
    boxShadow: "0 14px 35px rgba(0,0,0,0.35)",
  },
};
