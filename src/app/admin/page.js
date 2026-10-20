"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";

export default function AdminDashboard() {
  const { t, tr, lang } = useTranslation();
  const router = useRouter();

  // Sesión centralizada desde AuthContext
  const { session, perfil, loading: authLoading } = useAuth();
  const isAdmin = perfil?.rol === "admin";

  const [loadingData, setLoadingData] = useState(true);

  // Datos
  const [reclamos, setReclamos] = useState([]);
  const [stats, setStats] = useState({
    pendientes: 0,
    aprobados: 0,
    totalPuntos: 0,
  });

  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'all'
  const [todosLosPuntos, setTodosLosPuntos] = useState([]);

  // Buscador y Paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  // Filtrado de items
  const rawItems = activeTab === "pending" ? reclamos : todosLosPuntos;
  const filteredItems = rawItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.nombre?.toLowerCase().includes(term) ||
      item.categoria?.toLowerCase().includes(term) ||
      item.nombre_creador?.toLowerCase().includes(term) ||
      item.descripcion?.toLowerCase().includes(term) ||
      item.negocios?.nombre?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Estados para modal de rechazo interactivo
  const [rejectionTarget, setRejectionTarget] = useState(null); // { puntoId, negocioId, nombreNegocio }
  const [rejectionType, setRejectionType] = useState("correction"); // 'correction' | 'release'
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingRejection, setSubmittingRejection] = useState(false);

  // Toast Banner
  const [toastBanner, setToastBanner] = useState(null);
  const showToast = (message, type = "success") => {
    setToastBanner({ message, type });
    setTimeout(() => setToastBanner(null), 4000);
  };

  // Verificar rol de admin
  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.replace("/login");
    } else if (perfil && perfil.rol !== "admin") {
      console.warn("[Atlan Admin] Acceso denegado. Rol insuficiente.");
      router.replace("/mapa");
    }
  }, [authLoading, session, perfil, router]);

  // Recarga de datos
  const [reloadKey, setReloadKey] = useState(0);
  const reloadAdminData = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    (async () => {
      try {
        // 1. Cargar reclamos pendientes (puntos con estado 'en_verificacion')
        let { data: puntosPendientes, error: errorPuntos } = await supabase
          .from("puntos")
          .select(`
            id,
            nombre,
            descripcion,
            categoria,
            estado,
            negocio_id,
            nombre_creador,
            negocios (
              id,
              nombre,
              tipo,
              descripcion,
              telefono,
              whatsapp,
              rango_precios,
              servicios,
              datos_verificacion,
              dueno_id
            )
          `)
          .eq("estado", "en_verificacion");

        if (errorPuntos) {
          console.warn("[Atlan Admin] Intentando consulta alternativa para reclamos:", errorPuntos);
          const { data: rawPuntos } = await supabase
            .from("puntos")
            .select("*")
            .eq("estado", "en_verificacion");
          puntosPendientes = rawPuntos || [];
        }

        // Enriquecer con datos de perfil si dueno_id está presente
        if (puntosPendientes && puntosPendientes.length > 0) {
          const duenoIds = puntosPendientes
            .map((p) => p.negocios?.dueno_id)
            .filter(Boolean);

          if (duenoIds.length > 0) {
            const { data: perfilesData } = await supabase
              .from("perfiles")
              .select("id, nombre_completo, email")
              .in("id", duenoIds);

            if (perfilesData) {
              const profileMap = new Map(perfilesData.map((p) => [p.id, p]));
              puntosPendientes.forEach((p) => {
                if (p.negocios && p.negocios.dueno_id) {
                  p.negocios.perfiles = profileMap.get(p.negocios.dueno_id) || null;
                }
              });
            }
          }
        }

        // 2. Cargar todos los puntos para la segunda pestaña
        const { data: todosPuntos } = await supabase
          .from("puntos")
          .select("*")
          .order("nombre", { ascending: true });

        if (cancelled) return;

        setReclamos(puntosPendientes || []);
        setTodosLosPuntos(todosPuntos || []);

        // 3. Calcular estadísticas
        const totalPuntos = todosPuntos?.length || 0;
        const pendientes = puntosPendientes?.length || 0;
        const aprobados = todosPuntos?.filter((p) => p.estado === "aprobado").length || 0;

        setStats({
          pendientes,
          aprobados,
          totalPuntos,
        });
      } catch (err) {
        console.error("[Atlan Admin] Error cargando datos:", err);
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, reloadKey]);

  // Aprobar un negocio reclamado
  const handleAprobarReclamo = async (puntoId, negocioId) => {
    const confirmMsg = tr(
      "¿Está seguro de aprobar este reclamo de negocio?",
      "Are you sure you want to approve this business claim?",
      "您确定要批准此商户认领申请吗？"
    );
    if (!confirm(confirmMsg)) return;

    try {
      // 1. Actualizar estado del punto a 'aprobado'
      const { error: errPunto } = await supabase
        .from("puntos")
        .update({ estado: "aprobado" })
        .eq("id", puntoId);

      if (errPunto) throw errPunto;

      // 2. Activar el negocio en negocios (activo = true) y actualizar el rol del dueño a 'dueno'
      if (negocioId) {
        const { data: negData, error: errNegocio } = await supabase
          .from("negocios")
          .update({ activo: true })
          .eq("id", negocioId)
          .select("dueno_id")
          .single();

        if (errNegocio) throw errNegocio;

        if (negData?.dueno_id) {
          await supabase
            .from("perfiles")
            .update({ rol: "dueno" })
            .eq("id", negData.dueno_id);
        }
      }

      showToast(
        tr("¡Reclamo aprobado con éxito!", "Claim approved successfully!", "认领申请批准成功！"),
        "success"
      );
      reloadAdminData();
    } catch (err) {
      console.error("Error aprobando reclamo:", err);
      showToast(
        tr("Error al aprobar el reclamo.", "Error approving claim.", "批准认领时出错。"),
        "error"
      );
    }
  };

  // Confirmar el rechazo desde el modal interactivo
  const handleConfirmarRechazo = async () => {
    if (!rejectionTarget) return;
    if (!rejectionReason.trim()) {
      showToast(
        tr(
          "Por favor, ingrese un motivo para el rechazo.",
          "Please enter a reason for the rejection.",
          "请输入驳回原因。"
        ),
        "error"
      );
      return;
    }

    setSubmittingRejection(true);
    const { puntoId, negocioId } = rejectionTarget;

    try {
      if (rejectionType === "correction" || rejectionType === "observations") {
        // 1. Cambiar estado de punto a 'rechazado' (mantiene la vinculación para que el dueño corrija)
        const { error: errPunto } = await supabase
          .from("puntos")
          .update({ estado: "rechazado" })
          .eq("id", puntoId);

        if (errPunto) throw errPunto;

        // 2. Guardar el motivo de rechazo en negocios y marcar como inactivo
        if (negocioId) {
          const { error: errNegocio } = await supabase
            .from("negocios")
            .update({
              activo: false,
              motivo_rechazo: rejectionReason,
            })
            .eq("id", negocioId);

          if (errNegocio) throw errNegocio;
        }

        showToast(
          tr(
            "¡Reclamo rechazado con observaciones con éxito!",
            "Claim rejected with observations successfully.",
            "已成功附带修改意见驳回申请。"
          ),
          "info"
        );
      } else {
        // 1. Devolver el punto a estado 'sin_reclamar' y desvincular el negocio_id para liberar el reclamo
        const { error: errPunto } = await supabase
          .from("puntos")
          .update({
            estado: "sin_reclamar",
            negocio_id: null,
          })
          .eq("id", puntoId);

        if (errPunto) throw errPunto;

        // 2. Registrar el motivo en el negocio y marcar como inactivo
        if (negocioId) {
          const { error: errNegocio } = await supabase
            .from("negocios")
            .update({
              activo: false,
              motivo_rechazo: `[LIBERADO] ${rejectionReason}`,
            })
            .eq("id", negocioId);

          if (errNegocio) throw errNegocio;
        }

        showToast(
          tr(
            "¡Punto liberado y reclamo rechazado con éxito!",
            "Point released and claim rejected.",
            "地点已释放并成功驳回申请！"
          ),
          "success"
        );
      }

      setRejectionTarget(null);
      reloadAdminData();
    } catch (err) {
      console.error("Error procesando rechazo:", err);
      showToast(
        tr("Error al procesar el rechazo.", "Error processing rejection.", "处理驳回申请时出错。"),
        "error"
      );
    } finally {
      setSubmittingRejection(false);
    }
  };

  if (authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ textAlign: "center" }}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div style={styles.page}>
      <Navbar activePage="admin" session={session} perfil={perfil} />

      {/* TOAST NOTIFICATION BANNER */}
      {toastBanner && (
        <div
          style={{
            ...styles.toastBanner,
            background:
              toastBanner.type === "success"
                ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                : toastBanner.type === "error"
                ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                : "linear-gradient(135deg, #146D9E 0%, #0D4E72 100%)",
          }}
          className="admin-toast-fade"
        >
          <span style={{ display: "flex", alignItems: "center" }}>
            {toastBanner.type === "success" ? (
              <Icon name="check" size={17} color="#FFFFFF" />
            ) : toastBanner.type === "error" ? (
              <Icon name="x" size={17} color="#FFFFFF" />
            ) : (
              <Icon name="clock" size={17} color="#FFFFFF" />
            )}
          </span>
          <span>{toastBanner.message}</span>
        </div>
      )}

      <main style={styles.main} className="admin-main">
        {/* CONTENEDOR GENERAL UNIFICADO */}
        <div style={styles.mainContainer} className="admin-container">
          {/* 1. CABECERA INTEGRADA */}
          <header style={styles.integratedHeader} className="admin-header">
            <div style={styles.topRow} className="admin-top-row">
              <Link
                href="/admin/membresias"
                style={styles.membershipBtn}
                className="admin-membership-btn"
              >
                <Icon name="star" size={14} color="#0A192F" />
                <span>
                  {tr(
                    "⭐ Membresías Tuani Pro",
                    "⭐ Tuani Pro Memberships",
                    "⭐ Tuani Pro 会员管理"
                  )}
                </span>
              </Link>

              <button
                type="button"
                onClick={reloadAdminData}
                style={styles.refreshBtn}
                className="admin-refresh-btn"
                title="Recargar datos"
              >
                <Icon name="refresh" size={13} style={{ marginRight: 6 }} />
                <span>{tr("Refrescar", "Refresh", "刷新")}</span>
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={styles.heroBadge} className="admin-hero-badge">
                <Icon name="shield" size={13} color="#FFD700" />
                <span>
                  {tr(
                    "PANEL DE CONTROL ADMINISTRATIVO",
                    "ADMIN CONTROL HUB",
                    "管理控制中心"
                  )}
                </span>
              </div>
              <h1 style={styles.h1} className="admin-h1">
                {tr("Administración General de ", "General Administration of ", "总管理中心 ")}
                <span style={styles.goldText}>Atlan</span>
              </h1>
              <p style={styles.sub} className="admin-sub">
                {tr(
                  "Supervisa reclamos de propiedad comercial, aprueba o rechaza solicitudes y gestiona el directorio de puntos turísticos.",
                  "Review business ownership claims, approve or reject applications and manage the platform's point directory.",
                  "审核商户认领申请、批准或驳回所有权申请，并全面管理平台旅游地点目录。"
                )}
              </p>
            </div>
          </header>

          {/* 2. CINTA DE MÉTRICAS KPI (INTEGRADA) */}
          <section style={styles.metricsRibbon} className="admin-ribbon">
            <div style={styles.metricItem} className="admin-ribbon-item">
              <div
                style={{
                  ...styles.metricIconBox,
                  background: "rgba(251, 191, 36, 0.16)",
                  color: "#FBBF24",
                }}
              >
                <Icon name="clock" size={19} color="#FBBF24" />
              </div>
              <div>
                <div style={{ ...styles.metricNum, color: "#FBBF24" }}>{stats.pendientes}</div>
                <div style={styles.metricLabel}>
                  {tr("Reclamos en Verificación", "Claims in Verification", "待审核认领申请")}
                </div>
              </div>
            </div>

            <div style={styles.metricItem} className="admin-ribbon-item">
              <div
                style={{
                  ...styles.metricIconBox,
                  background: "rgba(16, 185, 129, 0.16)",
                  color: "#10B981",
                }}
              >
                <Icon name="check" size={19} color="#10B981" />
              </div>
              <div>
                <div style={{ ...styles.metricNum, color: "#10B981" }}>{stats.aprobados}</div>
                <div style={styles.metricLabel}>
                  {tr("Puntos Aprobados", "Approved Points", "已批准商户/地点")}
                </div>
              </div>
            </div>

            <div style={styles.metricItem} className="admin-ribbon-item">
              <div
                style={{
                  ...styles.metricIconBox,
                  background: "rgba(56, 189, 248, 0.16)",
                  color: "#38BDF8",
                }}
              >
                <Icon name="globe" size={19} color="#38BDF8" />
              </div>
              <div>
                <div style={{ ...styles.metricNum, color: "#38BDF8" }}>{stats.totalPuntos}</div>
                <div style={styles.metricLabel}>
                  {tr("Total de Puntos Registrados", "Total Points Registered", "系统登记地点总计")}
                </div>
              </div>
            </div>
          </section>

          {/* 3. BARRA DE HERRAMIENTAS Y PESTAÑAS INTEGRADA */}
          <div style={styles.toolbar} className="admin-toolbar">
            <div style={styles.tabsGroup} className="admin-tabs">
              <button
                type="button"
                onClick={() => handleTabChange("pending")}
                style={{
                  ...styles.tabBtn,
                  background:
                    activeTab === "pending"
                      ? "linear-gradient(135deg, #146D9E 0%, #0D4E72 100%)"
                      : "rgba(255, 255, 255, 0.04)",
                  color: activeTab === "pending" ? "#FFD700" : "#94A3B8",
                  borderColor:
                    activeTab === "pending"
                      ? "rgba(255, 215, 0, 0.5)"
                      : "rgba(255, 255, 255, 0.1)",
                }}
                className="admin-tab-btn"
              >
                <Icon name="clock" size={14} style={{ marginRight: 6 }} />
                <span>
                  {tr("Reclamos Pendientes", "Pending Claims", "待审核认领")} ({reclamos.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("all")}
                style={{
                  ...styles.tabBtn,
                  background:
                    activeTab === "all"
                      ? "linear-gradient(135deg, #146D9E 0%, #0D4E72 100%)"
                      : "rgba(255, 255, 255, 0.04)",
                  color: activeTab === "all" ? "#FFD700" : "#94A3B8",
                  borderColor:
                    activeTab === "all"
                      ? "rgba(255, 215, 0, 0.5)"
                      : "rgba(255, 255, 255, 0.1)",
                }}
                className="admin-tab-btn"
              >
                <Icon name="globe" size={14} style={{ marginRight: 6 }} />
                <span>
                  {tr("Todos los Puntos", "All Points", "所有地点")} ({todosLosPuntos.length})
                </span>
              </button>
            </div>

            {/* Buscador Integrado */}
            <div style={styles.searchBox} className="admin-search-box">
              <span style={styles.searchIcon}>
                <Icon name="search" size={15} color="#94A3B8" />
              </span>
              <input
                type="text"
                placeholder={tr(
                  "Buscar punto por nombre, categoría...",
                  "Search point, category...",
                  "按名称、分类搜索地点..."
                )}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={styles.searchInput}
                className="admin-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  style={styles.searchClearBtn}
                  title="Limpiar búsqueda"
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={styles.pagination} className="admin-pagination">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{
                    ...styles.pageBtn,
                    opacity: currentPage === 1 ? 0.35 : 1,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                  className="admin-page-btn"
                >
                  <Icon name="chevronLeft" size={13} style={{ marginRight: 2 }} />
                  <span>{tr("Ant", "Prev", "上一页")}</span>
                </button>

                <span style={styles.pageIndicator} className="admin-page-indicator">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  style={{
                    ...styles.pageBtn,
                    opacity: currentPage === totalPages ? 0.35 : 1,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                  className="admin-page-btn"
                >
                  <span>{tr("Sig", "Next", "下一页")}</span>
                  <Icon name="chevronRight" size={13} style={{ marginLeft: 2 }} />
                </button>
              </div>
            )}
          </div>

          {/* 4. ÁREA DE CONTENIDO */}
          <div style={styles.contentArea} className="admin-content-area">
            {loadingData ? (
              <div style={styles.emptyState}>
                <div style={styles.spinner}></div>
                <p style={{ marginTop: 14, color: "#94A3B8", fontWeight: 700 }}>
                  {t("common.loading")}
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={styles.emptyCard} className="admin-empty-card">
                <div style={styles.emptyIconBox}>
                  <Icon name="search" size={32} color="#FFD700" />
                </div>
                <h3 style={{ margin: "10px 0 4px", fontSize: 16, color: "#FFFFFF" }}>
                  {searchTerm
                    ? tr(
                        "No se encontraron resultados",
                        "No matching points found",
                        "未找到符合条件的地点"
                      )
                    : tr("No hay registros en esta sección", "No items in this section", "此栏目暂无数据")}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#94A3B8", maxWidth: 420 }}>
                  {searchTerm
                    ? tr(
                        "Intenta cambiar los términos de búsqueda o limpiar el filtro actual.",
                        "Try different search terms or clear the current search.",
                        "请尝试更换搜索关键词或清除筛选条件。"
                      )
                    : tr(
                        "Cuando haya nuevos puntos o reclamos, aparecerán listados aquí.",
                        "When new points or claims are registered, they will appear here.",
                        "当有新的地点或认领申请时，将在此处列出。"
                      )}
                </p>
              </div>
            ) : activeTab === "pending" ? (
              /* TAB RECLAMOS PENDIENTES */
              <div style={styles.claimsStack} className="admin-claims-stack">
                {paginatedItems.map((item) => (
                  <div key={item.id} style={styles.claimCard} className="admin-claim-card">
                    {/* Header de la tarjeta */}
                    <div style={styles.claimHeader} className="admin-claim-header">
                      <div>
                        <div style={styles.claimCategoryBadge}>
                          {item.categoria || tr("Negocio", "Business", "商户")}
                        </div>
                        <h3 style={styles.claimTitle} className="admin-claim-title">
                          {item.nombre}
                        </h3>
                        <p style={styles.claimSubtitle} className="admin-claim-subtitle">
                          {tr("Creador del punto:", "Point creator:", "地点创建者：")}{" "}
                          <span style={{ fontWeight: 800, color: "#E2E8F0" }}>
                            {item.nombre_creador ||
                              tr("Comunidad", "Community", "社区")}
                          </span>
                        </p>
                      </div>

                      {/* Botones de Acción */}
                      <div style={styles.claimActions} className="admin-claim-actions">
                        <button
                          type="button"
                          onClick={() => handleAprobarReclamo(item.id, item.negocio_id)}
                          style={styles.approveBtn}
                          className="admin-approve-btn"
                        >
                          <Icon name="check" size={14} style={{ marginRight: 6 }} />
                          <span>
                            {tr("Aprobar Reclamo", "Approve Claim", "批准认领")}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRejectionTarget({
                              puntoId: item.id,
                              negocioId: item.negocio_id,
                              nombreNegocio: item.nombre,
                            });
                            setRejectionType("correction");
                            setRejectionReason("");
                          }}
                          style={styles.rejectBtn}
                          className="admin-reject-btn"
                        >
                          <Icon name="x" size={14} style={{ marginRight: 6 }} />
                          <span>{tr("Rechazar", "Reject", "驳回")}</span>
                        </button>
                      </div>
                    </div>

                    {/* Detalles comerciales del negocio */}
                    {item.negocios && (
                      <div style={styles.commercialBox} className="admin-commercial-box">
                        <h4 style={styles.commercialBoxTitle}>
                          <Icon name="briefcase" size={15} color="#FFD700" style={{ marginRight: 6 }} />
                          <span>
                            {tr(
                              "Información Comercial del Reclamante",
                              "Claiming Business Info",
                              "申请认领商户信息"
                            )}
                          </span>
                        </h4>

                        <div style={styles.commercialGrid} className="admin-commercial-grid">
                          <div style={styles.commercialCol}>
                            <p style={styles.detailRow}>
                              <strong style={{ color: "#FFFFFF" }}>
                                {tr("Nombre del Dueño:", "Owner Name:", "业主姓名：")}
                              </strong>{" "}
                              {item.negocios.perfiles?.nombre_completo || "N/A"}
                            </p>
                            <p style={styles.detailRow}>
                              <strong style={{ color: "#FFFFFF" }}>
                                {tr("Tipo de Negocio:", "Business Type:", "商户类型：")}
                              </strong>{" "}
                              {item.negocios.tipo || "N/A"}
                            </p>
                            <p style={styles.detailRow}>
                              <strong style={{ color: "#FFFFFF" }}>
                                {tr("Rango de Precios:", "Price Range:", "价格区间：")}
                              </strong>{" "}
                              {item.negocios.rango_precios || "N/A"}
                            </p>
                          </div>

                          <div style={styles.commercialCol}>
                            <p style={styles.detailRow}>
                              <strong style={{ color: "#FFFFFF" }}>
                                {tr("Teléfono:", "Telephone:", "固定电话：")}
                              </strong>{" "}
                              {item.negocios.telefono || "N/A"}
                            </p>
                            <p style={styles.detailRow}>
                              <strong style={{ color: "#FFFFFF" }}>WhatsApp:</strong>{" "}
                              {item.negocios.whatsapp ? (
                                <a
                                  href={`https://wa.me/${item.negocios.whatsapp.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={styles.waLink}
                                >
                                  {item.negocios.whatsapp} ↗
                                </a>
                              ) : (
                                "N/A"
                              )}
                            </p>
                            <p style={styles.detailRow}>
                              <strong style={{ color: "#FFFFFF" }}>
                                {tr("Servicios:", "Services:", "提供服务：")}
                              </strong>{" "}
                              {item.negocios.servicios
                                ? Object.keys(item.negocios.servicios)
                                    .filter((k) => item.negocios.servicios[k])
                                    .join(", ") || "N/A"
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        {item.negocios.descripcion && (
                          <p style={styles.commercialDesc} className="admin-commercial-desc">
                            <strong style={{ color: "#FFFFFF" }}>
                              {tr("Descripción Comercial:", "Commercial Description:", "商业描述：")}
                            </strong>{" "}
                            {item.negocios.descripcion}
                          </p>
                        )}

                        {/* Documentos de Verificación de Propiedad */}
                        {item.negocios?.datos_verificacion && (
                          <div style={styles.verifBox} className="admin-verif-box">
                            <h5 style={styles.verifTitle}>
                              <Icon name="shield" size={15} color="#38BDF8" style={{ marginRight: 6 }} />
                              <span>
                                {tr(
                                  "Documentos de Verificación Presentados por el Solicitante",
                                  "Verification Documents Submitted by Applicant",
                                  "申请人提交的验证文件"
                                )}
                              </span>
                            </h5>

                            <div style={styles.verifGrid} className="admin-verif-grid">
                              <p style={styles.detailRow}>
                                <strong style={{ color: "#FFFFFF" }}>
                                  {tr("Propietario Solicitante:", "Applicant Owner:", "申请业主：")}
                                </strong>{" "}
                                {item.negocios.datos_verificacion.solicitante_nombre || "N/A"}
                              </p>
                              <p style={styles.detailRow}>
                                <strong style={{ color: "#FFFFFF" }}>
                                  {tr("N° Cédula / ID / RUC:", "ID / Cedula / RUC:", "身份证/税号：")}
                                </strong>{" "}
                                {item.negocios.datos_verificacion.solicitante_cedula || "N/A"}
                              </p>
                              <p style={styles.detailRow}>
                                <strong style={{ color: "#FFFFFF" }}>
                                  {tr("Teléfono Contacto:", "Contact Phone:", "联系电话：")}
                                </strong>{" "}
                                {item.negocios.datos_verificacion.solicitante_telefono || "N/A"}{" "}
                                {item.negocios.datos_verificacion.solicitante_telefono && (
                                  <a
                                    href={`https://wa.me/${item.negocios.datos_verificacion.solicitante_telefono.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.waBadge}
                                  >
                                    WhatsApp ↗
                                  </a>
                                )}
                              </p>
                            </div>

                            {/* Botones de descarga / vista previa de archivos */}
                            <div style={styles.verifFilesRow} className="admin-verif-files-row">
                              {item.negocios.datos_verificacion.documento_cedula_url ? (
                                <a
                                  href={item.negocios.datos_verificacion.documento_cedula_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={styles.docBtn}
                                  className="admin-doc-btn"
                                >
                                  <Icon name="fileText" size={14} style={{ marginRight: 6 }} />
                                  <span>
                                    {tr(
                                      "Ver Cédula de Identidad (PDF/Imagen)",
                                      "View ID Card (PDF/Image)",
                                      "查看身份证件 (PDF/图片)"
                                    )}
                                  </span>
                                </a>
                              ) : (
                                <span style={styles.noDocText}>
                                  <Icon name="alertTriangle" size={13} style={{ marginRight: 4 }} />
                                  <span>
                                    {tr("Sin foto de cédula", "No ID photo", "无证件照片")}
                                  </span>
                                </span>
                              )}

                              {item.negocios.datos_verificacion.documento_propiedad_url && (
                                <a
                                  href={item.negocios.datos_verificacion.documento_propiedad_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={styles.propertyDocBtn}
                                  className="admin-property-doc-btn"
                                >
                                  <Icon name="fileText" size={14} style={{ marginRight: 6 }} />
                                  <span>
                                    {tr(
                                      "Ver Comprobante de Propiedad / Licencia",
                                      "View Property Proof / License",
                                      "查看产权证明 / 许可证"
                                    )}
                                  </span>
                                </a>
                              )}
                            </div>

                            {item.negocios.datos_verificacion.solicitud_notas && (
                              <p style={styles.notesBox} className="admin-notes-box">
                                <Icon name="clipboard" size={14} color="#FFD700" style={{ marginRight: 6, flexShrink: 0 }} />
                                <span>
                                  <strong>{tr("Notas del Solicitante:", "Applicant Notes:", "申请人留言：")}</strong>{" "}
                                  &ldquo;{item.negocios.datos_verificacion.solicitud_notas}&rdquo;
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* TAB TODOS LOS PUNTOS (TABLA UNIFICADA CON SCROLL RESPONSIVE) */
              <div style={styles.tableCard} className="admin-table-card">
                <div style={styles.tableScroll} className="admin-table-scroll">
                  <table style={styles.table} className="admin-table">
                    <thead>
                      <tr style={styles.tableHeadRow}>
                        <th style={styles.th}>{tr("Nombre", "Name", "名称")}</th>
                        <th style={styles.th}>{tr("Categoría", "Category", "分类")}</th>
                        <th style={styles.th}>{tr("Creador", "Creator", "创建者")}</th>
                        <th style={styles.th}>{tr("Estado", "Status", "状态")}</th>
                        <th style={styles.th}>{tr("Creado el", "Created At", "创建日期")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((p) => {
                        const statusColors = {
                          aprobado: "#10B981",
                          en_verificacion: "#FBBF24",
                          sin_reclamar: "#94A3B8",
                          rechazado: "#EF4444",
                        };
                        const statusColor = statusColors[p.estado] || "#CBD5E1";

                        return (
                          <tr key={p.id} style={styles.tableRow} className="admin-tr-hover">
                            <td style={{ ...styles.td, fontWeight: 750, color: "#FFFFFF" }}>
                              {p.nombre}
                            </td>
                            <td style={{ ...styles.td, color: "#E2E8F0" }}>{p.categoria || "—"}</td>
                            <td style={{ ...styles.td, color: "#94A3B8" }}>
                              {p.nombre_creador || tr("Comunidad", "Community", "社区")}
                            </td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.statusBadge,
                                  color: statusColor,
                                  background: `${statusColor}22`,
                                  borderColor: `${statusColor}55`,
                                }}
                              >
                                {p.estado === "aprobado"
                                  ? tr("Aprobado", "Approved", "已批准")
                                  : p.estado === "en_verificacion"
                                  ? tr("En Verificación", "In Verification", "审核中")
                                  : p.estado === "sin_reclamar"
                                  ? tr("Sin Reclamar", "Unclaimed", "未认领")
                                  : p.estado === "rechazado"
                                  ? tr("Rechazado", "Rejected", "已拒绝")
                                  : p.estado}
                              </span>
                            </td>
                            <td style={{ ...styles.td, color: "#94A3B8" }}>
                              {p.created_at
                                ? new Date(p.created_at).toLocaleDateString(
                                    lang === "en" ? "en-US" : lang === "zh" ? "zh-CN" : "es-ES"
                                  )
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL INTERACTIVO DE RECHAZO */}
      {rejectionTarget && (
        <div style={styles.modalOverlay} className="admin-modal-overlay">
          <div style={styles.modalCard} className="admin-modal-card">
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={styles.modalAlertIcon}>
                  <Icon name="alertTriangle" size={20} color="#FFD700" />
                </div>
                <h2 style={styles.modalTitle}>
                  {tr(
                    "Rechazar Reclamo de Negocio",
                    "Reject Business Claim",
                    "驳回商户认领申请"
                  )}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRejectionTarget(null)}
                style={styles.modalCloseBtn}
                title="Cerrar modal"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <p style={styles.modalDesc}>
              {tr(
                `Especifica por qué estás rechazando el reclamo para "${rejectionTarget.nombreNegocio}":`,
                `Specify why you are rejecting the claim for "${rejectionTarget.nombreNegocio}":`,
                `请说明驳回 "${rejectionTarget.nombreNegocio}" 认领申请的具体原因：`
              )}
            </p>

            {/* Opciones de tipo de rechazo */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Opción 1: Corrección */}
              <label
                style={{
                  ...styles.radioOption,
                  background:
                    rejectionType === "correction"
                      ? "rgba(255, 215, 0, 0.12)"
                      : "rgba(255, 255, 255, 0.04)",
                  borderColor:
                    rejectionType === "correction"
                      ? "rgba(255, 215, 0, 0.45)"
                      : "rgba(255, 255, 255, 0.1)",
                }}
              >
                <input
                  type="radio"
                  name="rejectionType"
                  value="correction"
                  checked={rejectionType === "correction"}
                  onChange={() => setRejectionType("correction")}
                  style={styles.radioInput}
                />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 750, color: "#FFFFFF" }}>
                    {tr(
                      "Solicitar Corrección (Mantener reclamo pendiente)",
                      "Request Correction (Keep pending claim)",
                      "请求修改（保持申请处于待处理）"
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, lineHeight: 1.4 }}>
                    {tr(
                      "El solicitante verá tus observaciones en su panel para que pueda corregir sus datos sin perder su solicitud.",
                      "The applicant will see your observations on their dashboard so they can fix their information.",
                      "申请业主将在控制台中查看到修改意见以便更正资料。"
                    )}
                  </div>
                </div>
              </label>

              {/* Opción 2: Liberar Punto */}
              <label
                style={{
                  ...styles.radioOption,
                  background:
                    rejectionType === "release"
                      ? "rgba(239, 68, 68, 0.12)"
                      : "rgba(255, 255, 255, 0.04)",
                  borderColor:
                    rejectionType === "release"
                      ? "rgba(239, 68, 68, 0.45)"
                      : "rgba(255, 255, 255, 0.1)",
                }}
              >
                <input
                  type="radio"
                  name="rejectionType"
                  value="release"
                  checked={rejectionType === "release"}
                  onChange={() => setRejectionType("release")}
                  style={{ ...styles.radioInput, accentColor: "#EF4444" }}
                />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 750, color: "#EF4444" }}>
                    {tr(
                      "Liberar punto (Fraude / Cancelar reclamo)",
                      "Release point (Fraud / Delete claim)",
                      "释放地点（欺诈/彻底取消申请）"
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, lineHeight: 1.4 }}>
                    {tr(
                      "Desvincula el punto de inmediato, devolviéndolo a estado 'sin reclamar' en el mapa. El negocio queda inactivo.",
                      "Immediately unlinks the point, returning it to unclaimed status on the map. Business is marked inactive.",
                      "立即解绑地点，将其恢复为地图上的“未认领”状态，商户将被标记为停用。"
                    )}
                  </div>
                </div>
              </label>
            </div>

            {/* Input del motivo */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <label style={{ fontSize: 12.5, fontWeight: 800, color: "#FFFFFF" }}>
                {tr("Motivo del Rechazo:", "Reason for Rejection:", "驳回原因：")}
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={tr(
                  "Ej: Por favor, adjunte un documento de cédula legible y proporcione un número de WhatsApp de contacto válido.",
                  "e.g. Please provide a clear ID photo and a valid contact WhatsApp number.",
                  "例如：请上传清晰的身份证件照片并提供有效的联系电话。"
                )}
                rows={4}
                style={styles.modalTextarea}
                className="admin-modal-textarea"
              />
            </div>

            {/* Botones de acción del Modal */}
            <div style={styles.modalActions} className="admin-modal-actions">
              <button
                type="button"
                onClick={() => setRejectionTarget(null)}
                disabled={submittingRejection}
                style={styles.modalCancelBtn}
                className="admin-modal-cancel"
              >
                {tr("Cancelar", "Cancel", "取消")}
              </button>

              <button
                type="button"
                onClick={handleConfirmarRechazo}
                disabled={submittingRejection}
                style={{
                  ...styles.modalConfirmBtn,
                  background:
                    rejectionType === "release"
                      ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                      : "linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)",
                  color: rejectionType === "release" ? "#FFFFFF" : "#0A192F",
                }}
                className="admin-modal-confirm"
              >
                {submittingRejection
                  ? tr("Procesando...", "Processing...", "处理中...")
                  : tr("Confirmar Rechazo", "Confirm Rejection", "确认驳回")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTILOS Y MEDIA QUERIES RESPONSIVOS (SAMSUNG GALAXY S24 ULTRA & MODERN MOBILES) */}
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -12px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .admin-toast-fade {
          animation: fadeInDown 0.25s ease-out forwards;
        }

        .admin-tr-hover:hover {
          background: rgba(255, 255, 255, 0.035);
        }

        /* Tablets y pantallas intermedias */
        @media (max-width: 900px) {
          .admin-ribbon {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          }
          .admin-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .admin-search-box {
            max-width: 100% !important;
            width: 100% !important;
          }
          .admin-pagination {
            justify-content: flex-end !important;
          }
        }

        /* Celulares modernos (Samsung Galaxy S24 Ultra ~384-412px, iPhone 15/16 Pro Max, Pixel) */
        @media (max-width: 640px) {
          .admin-main {
            padding: 82px 12px 36px !important;
            gap: 16px !important;
          }
          .admin-container {
            border-radius: 18px !important;
          }
          .admin-header {
            padding: 20px 14px 16px !important;
          }
          .admin-top-row {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .admin-membership-btn,
          .admin-refresh-btn {
            min-height: 42px !important;
            padding: 8px 12px !important;
            font-size: 12px !important;
          }
          .admin-h1 {
            font-size: 23px !important;
            line-height: 1.25 !important;
            margin: 10px 0 6px !important;
          }
          .admin-sub {
            font-size: 13px !important;
            line-height: 1.45 !important;
          }
          .admin-ribbon {
            grid-template-columns: 1fr !important;
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          .admin-ribbon-item {
            padding: 4px 0 !important;
          }
          .admin-toolbar {
            padding: 12px 14px !important;
            gap: 12px !important;
          }
          .admin-tabs {
            flex-direction: column !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .admin-tab-btn {
            width: 100% !important;
            justify-content: center !important;
            min-height: 44px !important;
            font-size: 13px !important;
          }
          .admin-search-box {
            width: 100% !important;
            min-height: 44px !important;
          }
          .admin-search-input {
            font-size: 13.5px !important;
            padding: 11px 36px 11px 36px !important;
          }
          .admin-pagination {
            justify-content: center !important;
            width: 100% !important;
            margin-top: 4px !important;
          }
          .admin-page-btn {
            min-height: 40px !important;
            padding: 8px 14px !important;
          }
          .admin-content-area {
            padding: 14px 12px 20px !important;
          }
          .admin-claim-card {
            padding: 16px 14px !important;
            border-radius: 16px !important;
          }
          .admin-claim-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
          }
          .admin-claim-actions {
            width: 100% !important;
            flex-direction: column !important;
            gap: 8px !important;
          }
          .admin-approve-btn,
          .admin-reject-btn {
            width: 100% !important;
            min-height: 44px !important;
            justify-content: center !important;
            font-size: 13.5px !important;
          }
          .admin-commercial-box {
            padding: 14px !important;
            border-radius: 14px !important;
          }
          .admin-commercial-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .admin-verif-box {
            padding: 12px !important;
            border-radius: 12px !important;
          }
          .admin-verif-grid {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
          }
          .admin-verif-files-row {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .admin-doc-btn,
          .admin-property-doc-btn {
            width: 100% !important;
            justify-content: center !important;
            min-height: 42px !important;
          }
          .admin-table-scroll {
            margin: 0 -4px;
            padding-bottom: 6px;
            -webkit-overflow-scrolling: touch;
          }
          .admin-table {
            min-width: 520px;
          }
          .admin-table th,
          .admin-table td {
            padding: 10px 8px !important;
            font-size: 12px !important;
          }
          .admin-modal-card {
            padding: 20px 16px !important;
            border-radius: 18px !important;
          }
          .admin-modal-actions {
            flex-direction: column !important;
          }
          .admin-modal-cancel,
          .admin-modal-confirm {
            width: 100% !important;
            min-height: 44px !important;
          }
        }

        /* Celulares ultra-compactos (≤ 380px) */
        @media (max-width: 380px) {
          .admin-main {
            padding: 76px 8px 30px !important;
          }
          .admin-h1 {
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
  loadingContainer: {
    minHeight: "100vh",
    background: "#070E18",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#E2E8F0",
    fontFamily: "var(--font-outfit), sans-serif",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(20, 109, 158, 0.25)",
    borderTopColor: "#FFD700",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite",
    margin: "0 auto 16px",
  },
  loadingText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: 700,
  },
  toastBanner: {
    position: "fixed",
    top: 84,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1100,
    color: "#FFFFFF",
    padding: "12px 24px",
    borderRadius: 16,
    fontWeight: 800,
    fontSize: 13.5,
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 14px 35px rgba(0, 0, 0, 0.35)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    backdropFilter: "blur(12px)",
    maxWidth: "90%",
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
    padding: "28px 28px 22px",
    background:
      "linear-gradient(180deg, rgba(20, 109, 158, 0.16) 0%, rgba(12, 21, 36, 0.8) 100%)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  membershipBtn: {
    padding: "9px 18px",
    borderRadius: 12,
    fontWeight: 900,
    fontSize: 12.5,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)",
    color: "#0A192F",
    boxShadow: "0 6px 18px rgba(245, 158, 11, 0.35)",
    border: "1.5px solid rgba(255, 215, 0, 0.7)",
  },
  refreshBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    borderRadius: 12,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#CBD5E1",
    fontSize: 12.5,
    fontWeight: 750,
    cursor: "pointer",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 14px",
    borderRadius: 999,
    background: "rgba(255, 215, 0, 0.12)",
    border: "1px solid rgba(255, 215, 0, 0.35)",
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: "0.08em",
    color: "#FFD700",
    marginBottom: 8,
  },
  h1: {
    margin: "6px 0",
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    color: "#FFFFFF",
  },
  goldText: {
    color: "#FFD700",
  },
  sub: {
    margin: 0,
    fontSize: 14,
    color: "#94A3B8",
    maxWidth: 780,
    lineHeight: 1.5,
  },
  metricsRibbon: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    padding: "16px 28px",
    background: "rgba(255, 255, 255, 0.02)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  },
  metricItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  metricIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  metricNum: {
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1.15,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: 750,
    color: "#94A3B8",
    marginTop: 2,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: "14px 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    flexWrap: "wrap",
  },
  tabsGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  tabBtn: {
    padding: "9px 16px",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 12.5,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    border: "1.5px solid",
    transition: "all 0.15s ease",
  },
  searchBox: {
    position: "relative",
    flex: 1,
    minWidth: 220,
    maxWidth: 380,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  },
  searchInput: {
    width: "100%",
    padding: "9px 34px 9px 36px",
    borderRadius: 12,
    border: "1.5px solid rgba(255, 255, 255, 0.12)",
    background: "rgba(255, 255, 255, 0.04)",
    fontSize: 13,
    fontWeight: 600,
    color: "#FFFFFF",
    outline: "none",
    boxSizing: "border-box",
  },
  searchClearBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94A3B8",
    display: "flex",
    alignItems: "center",
    padding: 3,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  pageBtn: {
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 750,
    borderRadius: 10,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#FFFFFF",
    display: "inline-flex",
    alignItems: "center",
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: 800,
    color: "#FFD700",
    background: "rgba(255, 215, 0, 0.1)",
    border: "1px solid rgba(255, 215, 0, 0.25)",
    padding: "6px 12px",
    borderRadius: 10,
  },
  contentArea: {
    padding: "24px 28px 30px",
  },
  emptyState: {
    padding: "60px 0",
    textAlign: "center",
  },
  emptyCard: {
    padding: "50px 20px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: 18,
    border: "1px dashed rgba(255, 255, 255, 0.1)",
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    background: "rgba(255, 215, 0, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  claimsStack: {
    display: "grid",
    gap: 18,
  },
  claimCard: {
    padding: "22px 24px",
    background: "rgba(255, 255, 255, 0.025)",
    borderRadius: 18,
    border: "1.5px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  claimHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 14,
  },
  claimCategoryBadge: {
    fontSize: 11,
    fontWeight: 850,
    background: "rgba(255, 215, 0, 0.15)",
    color: "#FFD700",
    border: "1px solid rgba(255, 215, 0, 0.3)",
    padding: "3px 10px",
    borderRadius: 8,
    textTransform: "uppercase",
    display: "inline-block",
    marginBottom: 6,
  },
  claimTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 850,
    color: "#FFFFFF",
    letterSpacing: "-0.01em",
  },
  claimSubtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#94A3B8",
  },
  claimActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  approveBtn: {
    padding: "10px 18px",
    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 12.5,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
  },
  rejectBtn: {
    padding: "10px 18px",
    background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 12.5,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
  },
  commercialBox: {
    padding: 18,
    background: "rgba(10, 25, 47, 0.65)",
    borderRadius: 16,
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  commercialBoxTitle: {
    margin: "0 0 12px",
    fontSize: 13.5,
    fontWeight: 850,
    color: "#FFD700",
    display: "flex",
    alignItems: "center",
  },
  commercialGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
    fontSize: 13,
    color: "#CBD5E1",
  },
  commercialCol: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  detailRow: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
  },
  waLink: {
    color: "#10B981",
    fontWeight: 800,
    textDecoration: "none",
    marginLeft: 4,
  },
  waBadge: {
    color: "#10B981",
    fontWeight: 800,
    textDecoration: "none",
    marginLeft: 6,
    fontSize: 11.5,
    background: "rgba(16, 185, 129, 0.15)",
    padding: "2px 8px",
    borderRadius: 6,
    border: "1px solid rgba(16, 185, 129, 0.3)",
    display: "inline-block",
  },
  commercialDesc: {
    margin: "12px 0 0",
    fontSize: 13,
    color: "#CBD5E1",
    borderTop: "1px dashed rgba(255, 255, 255, 0.1)",
    paddingTop: 10,
    lineHeight: 1.5,
  },
  verifBox: {
    marginTop: 14,
    padding: 16,
    background: "rgba(20, 109, 158, 0.12)",
    border: "1.5px solid rgba(56, 189, 248, 0.22)",
    borderRadius: 14,
  },
  verifTitle: {
    margin: "0 0 10px",
    fontSize: 13,
    fontWeight: 850,
    color: "#38BDF8",
    display: "flex",
    alignItems: "center",
  },
  verifGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 8,
    fontSize: 12.5,
    color: "#E2E8F0",
  },
  verifFilesRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  docBtn: {
    padding: "8px 14px",
    fontSize: 12,
    textDecoration: "none",
    fontWeight: 800,
    color: "#FFFFFF",
    background: "linear-gradient(135deg, #146D9E 0%, #0D4E72 100%)",
    borderRadius: 10,
    border: "1px solid rgba(56, 189, 248, 0.4)",
    display: "inline-flex",
    alignItems: "center",
  },
  propertyDocBtn: {
    padding: "8px 14px",
    fontSize: 12,
    textDecoration: "none",
    fontWeight: 800,
    color: "#FFD700",
    background: "rgba(255, 215, 0, 0.15)",
    borderRadius: 10,
    border: "1px solid rgba(255, 215, 0, 0.35)",
    display: "inline-flex",
    alignItems: "center",
  },
  noDocText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: 750,
    display: "inline-flex",
    alignItems: "center",
  },
  notesBox: {
    margin: "12px 0 0",
    fontSize: 12.5,
    color: "#94A3B8",
    fontStyle: "italic",
    borderTop: "1px dashed rgba(255, 255, 255, 0.1)",
    paddingTop: 8,
    display: "flex",
    alignItems: "flex-start",
    lineHeight: 1.45,
  },
  tableCard: {
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: 16,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  tableScroll: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: 13,
  },
  tableHeadRow: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.09)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  th: {
    padding: "14px 18px",
    fontWeight: 850,
    color: "#94A3B8",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  },
  tableRow: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    transition: "background 0.15s ease",
  },
  td: {
    padding: "14px 18px",
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 850,
    textTransform: "uppercase",
    padding: "3px 10px",
    borderRadius: 8,
    border: "1px solid",
    display: "inline-block",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.78)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
    padding: 20,
  },
  modalCard: {
    maxWidth: 520,
    width: "100%",
    background: "#0D1828",
    borderRadius: 22,
    border: "1.5px solid rgba(255, 215, 0, 0.35)",
    padding: 26,
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.65)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalAlertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "rgba(255, 215, 0, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 850,
    color: "#FFD700",
  },
  modalCloseBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94A3B8",
    display: "flex",
    alignItems: "center",
    padding: 4,
  },
  modalDesc: {
    margin: 0,
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 1.5,
  },
  radioOption: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "12px 14px",
    border: "1.5px solid",
    borderRadius: 14,
    cursor: "pointer",
  },
  radioInput: {
    marginTop: 3,
    accentColor: "#FFD700",
  },
  modalTextarea: {
    width: "100%",
    background: "rgba(10, 25, 47, 0.8)",
    border: "1.5px solid rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 500,
    outline: "none",
    resize: "none",
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    gap: 12,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    padding: "12px 14px",
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 750,
    cursor: "pointer",
  },
  modalConfirmBtn: {
    flex: 1,
    padding: "12px 14px",
    border: "none",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 850,
    cursor: "pointer",
  },
};
