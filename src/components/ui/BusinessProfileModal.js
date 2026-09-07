"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useTranslation } from "@/hooks/useTranslation";

const formatPriceRange = (rango) => {
  if (!rango) return '';
  const str = String(rango).trim();
  if (str.includes('C$')) return str;
  const r = str.toLowerCase();
  if (r === '$' || r === 'economico' || r === 'económico') return 'Económico C$';
  if (r === '$$' || r === 'moderado') return 'Moderado C$';
  if (r === '$$$' || r === 'costoso') return 'Costoso C$';
  if (r === '$$$$' || r === 'lujoso') return 'Lujoso C$';
  return `${str} C$`;
};

export default function BusinessProfileModal({
  isOpen,
  onClose,
  point,
  details,
  reviews = [],
  menu = [],
  userSession,
  lang = 'es',
  t = (key) => key,
  tr: propTr,
  isFavorite,
  onToggleFavorite,
  onIniciarViaje,
  isBusinessOpenNow,
  // Reservas
  reservaTipo,
  setReservaTipo,
  reservaFechaHora,
  setReservaFechaHora,
  reservaPersonas,
  setReservaPersonas,
  reservaNotas,
  setReservaNotas,
  isSubmittingReserva,
  reservaSuccess,
  handleCrearReserva,
  // Reseñas
  newReviewNombre,
  setNewReviewNombre,
  newReviewEstrellas,
  setNewReviewEstrellas,
  newReviewComment,
  setNewReviewComment,
  isSubmittingReview,
  reviewErrorMsg,
  handleCrearResena
}) {
  const { tr: hookTr } = useTranslation();
  const tr = propTr || hookTr;
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'menu' | 'reservas' | 'reseñas'

  if (!isOpen || !point) return null;

  const servs = details?.servicios || point?.servicios || {};
  const canBook = Boolean(
    servs.has_online_booking === true ||
    details?.has_online_booking === true ||
    point?.has_online_booking === true ||
    servs.has_reservas === true ||
    details?.has_reservas === true ||
    point?.has_reservas === true ||
    details?.permite_reserva === true ||
    point?.permite_reserva === true ||
    details?.acepta_reservas === true ||
    point?.acepta_reservas === true
  );

  // Cálculo de promedio de calificaciones
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + Number(r.estrellas || 5), 0) / reviews.length).toFixed(1)
    : null;

  // Estilos de gradiente según la categoría
  const getCategoryTheme = (cat) => {
    const category = (cat || '').toLowerCase();
    if (category.includes('restaurante') || category.includes('comida') || category.includes('café') || category.includes('bar')) {
      return {
        cover: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #991B1B 100%)',
        accent: '#EF4444'
      };
    } else if (category.includes('hotel') || category.includes('hospedaje') || category.includes('hostal')) {
      return {
        cover: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1E40AF 100%)',
        accent: '#3B82F6'
      };
    } else if (category.includes('naturaleza') || category.includes('tour') || category.includes('aventura') || category.includes('parque')) {
      return {
        cover: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #065F46 100%)',
        accent: '#10B981'
      };
    } else if (category.includes('cultura') || category.includes('arte') || category.includes('museo')) {
      return {
        cover: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #5B21B6 100%)',
        accent: '#8B5CF6'
      };
    }
    return {
      cover: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #075985 100%)',
      accent: '#0EA5E9'
    };
  };

  const theme = getCategoryTheme(point.categoria);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(10, 25, 47, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          backgroundColor: '#F8FAFC',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA HERO ELEGANTE */}
        <div
          style={{
            position: 'relative',
            background: theme.gradient,
            padding: '24px 28px 0px 28px',
            color: '#FFFFFF',
            flexShrink: 0
          }}
        >
          {/* BOTONES ACCION SUPERIOR DERECHA */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 2 }}>
            {userSession && (
              <button
                onClick={onToggleFavorite}
                title={isFavorite ? tr('Quitar de Favoritos', 'Remove Favorite', '取消收藏') : tr('Guardar Favorito', 'Save Favorite', '收藏')}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  border: isFavorite ? '1.5px solid #FFD700' : '1px solid rgba(255,255,255,0.25)',
                  color: isFavorite ? '#FFD700' : '#FFFFFF',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Icon name={isFavorite ? 'heartFilled' : 'heart'} size={18} color={isFavorite ? '#FFD700' : '#FFFFFF'} />
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#FFFFFF',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Icon name="x" size={18} color="#FFFFFF" />
            </button>
          </div>

          {/* INFORMACION PRINCIPAL DEL NEGOCIO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingRight: '90px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              {/* BADGES */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {(() => {
                  let statusText = '';
                  let statusColor = '';
                  let statusBg = '';

                  if (point.estado === 'en_verificacion') {
                    statusText = tr('En Espera de Verificación', 'Awaiting Verification', '等待审核');
                    statusColor = '#FB923C';
                    statusBg = 'rgba(251, 146, 60, 0.2)';
                  } else if (point.estado === 'aprobado') {
                    statusText = tr('Negocio Verificado', 'Verified Business', '已认证商家');
                    statusColor = '#34D399';
                    statusBg = 'rgba(52, 211, 153, 0.2)';
                  } else {
                    const isClaimed = !!point.negocio_id;
                    statusText = isClaimed ? tr('Reclamado', 'Claimed', '已认领') : tr('Sin Reclamar', 'Unclaimed', '未认领');
                    statusColor = isClaimed ? '#34D399' : '#FBBF24';
                    statusBg = isClaimed ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)';
                  }

                  return (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: statusColor,
                        background: statusBg,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        border: `1px solid ${statusColor}40`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px'
                      }}
                    >
                      {statusText}
                    </span>
                  );
                })()}

                {point.categoria && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: theme.accent,
                      background: theme.accentLight,
                      padding: '3px 9px',
                      borderRadius: '6px',
                      border: `1px solid ${theme.accent}40`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px'
                    }}
                  >
                    {point.categoria}
                  </span>
                )}

                {/* Rango de Precios */}
                {details?.rango_precios && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#FFD700',
                      background: 'rgba(255, 215, 0, 0.15)',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {formatPriceRange(details.rango_precios)}
                  </span>
                )}
              </div>

              {/* TITULO */}
              <h2
                style={{
                  margin: '0 0 4px',
                  fontSize: '24px',
                  fontWeight: '900',
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px'
                }}
              >
                {point.nombre}
              </h2>

              {/* CALIFICACION Y RESEÑAS */}
              {avgRating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <Icon name="starFilled" size={15} color="#FFD700" />
                  <span style={{ fontWeight: '800', color: '#FFD700' }}>{avgRating}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                    ({reviews.length} {reviews.length === 1 ? tr('reseña', 'review', '条评价') : tr('reseñas', 'reviews', '条评价')})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* BARRA DE ACCION RAPIDA (BOTÓN INICIAR VIAJE) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <button
              onClick={() => {
                if (onIniciarViaje) {
                  onIniciarViaje(point);
                  onClose();
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              <span>{tr('Iniciar Viaje', 'Start Trip', '开始行程')}</span>
            </button>
          </div>

          {/* TAB BAR NAVEGACION INTEGRADO DENTRO DE CABECERA */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            {(() => {
              const showMenuTab = !!(servs.has_menu || menu.length > 0);

              const availableTabs = [
                { id: 'info', label: tr('Información', 'Information', '基本信息'), iconName: 'info' },
                ...(showMenuTab ? [{ id: 'menu', label: tr('Menú y Servicios', 'Menu & Services', '菜单与服务'), iconName: 'utensils', count: menu.length }] : []),
                ...(canBook ? [{ id: 'reservas', label: tr('Reservas', 'Reservations', '在线预订'), iconName: 'calendar' }] : []),
                { id: 'reseñas', label: tr('Reseñas', 'Reviews', '真实评价'), iconName: 'star', count: reviews.length }
              ];

              return availableTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '10px 18px',
                      fontSize: '13.5px',
                      fontWeight: isActive ? '800' : '600',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      background: isActive ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '3px solid #38BDF8' : '3px solid transparent',
                      borderRadius: '10px 10px 0 0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Icon name={tab.iconName} size={16} color={isActive ? '#38BDF8' : '#94A3B8'} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 7px',
                          borderRadius: '10px',
                          background: isActive ? '#0284C7' : 'rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF'
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              });
            })()}
          </div>
        </div>

        {/* CUERPO UNIFORME SEGÚN PESTAÑA ACTIVA */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(20, 109, 158, 0.2) transparent'
          }}
        >
          {/* PESTAÑA 1: INFORMACIÓN Y SECCIÓN DE INTERÉS TURÍSTICO */}
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* COLUMNA IZQUIERDA: Descripción & Interés Turístico */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Banner de Reclamo si está en verificación */}
                {point.estado === 'en_verificacion' && (
                  <div
                    style={{
                      padding: '14px 18px',
                      background: 'rgba(249, 115, 22, 0.1)',
                      border: '1.5px solid rgba(249, 115, 22, 0.3)',
                      borderRadius: '16px',
                      fontSize: '13.5px',
                      color: '#C2410C',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <Icon name="hourglass" size={24} color="#f97316" />
                    <div>
                      <strong style={{ color: '#1A1A2E' }}>
                        {tr('Solicitud de Reclamo en Verificación', 'Claim Under Review', '认领申请审核中')}
                      </strong>
                      <div style={{ fontSize: '12.5px', color: '#4A5568', marginTop: '2px', lineHeight: 1.4 }}>
                        {tr(
                          'Una solicitud de verificación de propiedad sobre este local se encuentra actualmente en revisión por la administración.',
                          'A owner verification claim is currently being evaluated by Atlan administration.',
                          '管理员正在审核此地点的所有者认领申请。'
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón Reclamar Negocio */}
                {!point.negocio_id && point.estado === 'sin_reclamar' && (
                  <Link
                    href="/dashboard"
                    className="clay-btn-gold no-sheen"
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      fontSize: '13.5px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Icon name="claim" size={18} color="#1A1A2E" />
                    <span>{tr('¿Eres el dueño? Reclamar este negocio', 'Are you the owner? Claim this business', '您是商家所有者？认领此地点')}</span>
                  </Link>
                )}

                {/* Descripción */}
                <div className="clay-card-static" style={{ padding: '20px', borderRadius: '18px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="info" size={15} color={theme.accent} />
                    <span>{tr('Acerca de este Destino', 'About this Destination', '关于此目的地')}</span>
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.65' }}>
                    {point.descripcion || tr('Sin descripción disponible para este destino.', 'No detailed description available for this place.', '暂无此目的地的详细描述。')}
                  </p>
                </div>

                {/* Consejos para Turistas / Información de Interés */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(20, 109, 158, 0.08) 100%)',
                    border: '1.5px solid rgba(255, 215, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#856404', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="compass" size={16} color="#B8960E" />
                    <span>{tr('Interés Turístico y Consejos', 'Tourist Tips & Information', '旅游提示与贴士')}</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Icon name="dollarSign" size={15} color="#16A34A" style={{ marginTop: '2px' }} />
                      <span>
                        <strong>{tr('Moneda & Pagos:', 'Payments & Currency:', '货币与支付：')}</strong>{' '}
                        {details?.servicios?.has_card_payment
                          ? tr('Aceptan pagos en efectivo y tarjeta (Córdobas / USD según negocio).', 'Cash and credit/debit cards accepted.', '支持现金及银行卡（根据商家接受科多巴/美元）。')
                          : tr('Pagos en efectivo (Córdobas / USD).', 'Cash payments accepted (Córdobas / USD).', '仅支持现金（科多巴/美元）。')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Icon name="shield" size={15} color="#2563EB" style={{ marginTop: '2px' }} />
                      <span><strong>{tr('Experiencia Verificada:', 'Visitor Experience:', '实地体验：')}</strong> {tr('Destino recomendado para familias, parejas y mochileros en Nicaragua.', 'Recommended destination for solo travelers, couples & families.', '推荐给尼加拉瓜的独行游客、情侣及家庭旅行。')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Icon name="mapPin" size={15} color="#E11D48" style={{ marginTop: '2px' }} />
                      <span><strong>{tr('Indicaciones de Llegada:', 'Navigation:', '导航指引：')}</strong> {tr('Ruta directa disponible. Toca el botón "Iniciar Viaje" para navegación activa.', 'Direct map route guidance available. Tap "Start Trip" above.', '提供路线导航。点击上方“开始行程”即可启动导航。')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: Horarios de Atención */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="clay-card-static" style={{ padding: '20px', borderRadius: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="clock" size={15} color={theme.accent} />
                      <span>{tr('Horarios de Atención', 'Opening Schedule', '营业时间')}</span>
                    </h4>
                    {isBusinessOpenNow && details?.horarios && isBusinessOpenNow(details.horarios) !== null && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '850',
                          textTransform: 'uppercase',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: isBusinessOpenNow(details.horarios) ? 'rgba(23, 170, 74, 0.12)' : 'rgba(239,68,68,0.12)',
                          color: isBusinessOpenNow(details.horarios) ? '#17AA4A' : '#ef4444',
                          border: `1px solid ${isBusinessOpenNow(details.horarios) ? 'rgba(23, 170, 74, 0.25)' : 'rgba(239,68,68,0.25)'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Icon name={isBusinessOpenNow(details.horarios) ? 'check' : 'x'} size={12} color={isBusinessOpenNow(details.horarios) ? '#17AA4A' : '#ef4444'} />
                        {isBusinessOpenNow(details.horarios)
                          ? tr('Abierto Ahora', 'Open Now', '营业中')
                          : tr('Cerrado', 'Closed', '已打烊')}
                      </span>
                    )}
                  </div>

                  {details?.horarios && Object.keys(details.horarios).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(() => {
                        const dayOrder = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 7 };
                        const sortedHorarios = Object.entries(details.horarios).sort(
                          ([dayA], [dayB]) => (dayOrder[dayA.toLowerCase()] || 99) - (dayOrder[dayB.toLowerCase()] || 99)
                        );

                        return sortedHorarios.map(([day, info]) => {
                          const dayLabels = {
                            lunes: tr('Lunes', 'Monday', '星期一'),
                            martes: tr('Martes', 'Tuesday', '星期二'),
                            miercoles: tr('Miércoles', 'Wednesday', '星期三'),
                            jueves: tr('Jueves', 'Thursday', '星期四'),
                            viernes: tr('Viernes', 'Friday', '星期五'),
                            sabado: tr('Sábado', 'Saturday', '星期六'),
                            domingo: tr('Domingo', 'Sunday', '星期日'),
                          };
                          const isToday = new Date().getDay() === {
                            domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6
                          }[day.toLowerCase()];

                          return (
                            <div
                              key={day}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '13px',
                                color: isToday ? '#0F172A' : '#64748B',
                                fontWeight: isToday ? '800' : '500',
                                padding: '5px 8px',
                                borderRadius: '8px',
                                background: isToday ? 'rgba(20, 109, 158, 0.08)' : 'transparent',
                                borderBottom: isToday ? 'none' : '1px dashed rgba(20, 109, 158, 0.08)'
                              }}
                            >
                              <span>{dayLabels[day.toLowerCase()] || day} {isToday && tr('• (Hoy)', '• (Today)', '• (今天)')}</span>
                              <span>
                                {info?.abierto
                                  ? `${info.apertura || ''} - ${info.cierre || ''}`
                                  : tr('Cerrado', 'Closed', '休息')}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
                      {tr('Consulte directamente para confirmación de horario exacto.', 'Regular business hours apply.', '具体营业时间请直接向商家核实。')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: MENÚ & SERVICIOS */}
          {activeTab === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="utensils" size={16} color={theme.accent} />
                <span>{tr('Platillos y Servicios', 'Menu & Services', '菜单与服务')}</span>
              </h4>

              {menu.length === 0 ? (
                <div
                  className="clay-card-static"
                  style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="utensils" size={28} color="#94A3B8" />
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748B', fontWeight: '600' }}>
                    {tr('No hay platillos o servicios publicados aún para este negocio.', 'No menu or services published yet.', '此商家尚未发布菜单或服务。')}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '16px'
                  }}
                >
                  {menu.map((item) => (
                    <div
                      key={item.id}
                      className="clay-card-static"
                      style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        opacity: item.disponible === false ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', gap: '14px' }}>
                        {item.foto_url ? (
                          <img
                            src={item.foto_url}
                            alt={item.nombre}
                            style={{
                              width: '58px',
                              height: '58px',
                              borderRadius: '14px',
                              objectFit: 'cover',
                              border: '1px solid rgba(20, 109, 158, 0.12)',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '58px',
                              height: '58px',
                              borderRadius: '14px',
                              background: '#F1F5F9',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              border: '1px solid rgba(20, 109, 158, 0.12)',
                              flexShrink: 0
                            }}
                          >
                            <Icon name="utensils" size={24} color="#94A3B8" />
                          </div>
                        )}

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{item.nombre}</p>
                            {item.disponible === false && (
                              <span style={{ fontSize: '10px', fontWeight: '800', color: '#EF4444', background: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>
                                {tr('Agotado', 'Unavailable', '暂无供应')}
                              </span>
                            )}
                          </div>
                          {item.descripcion && (
                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748B', lineHeight: 1.4 }}>
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(20, 109, 158, 0.08)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '850', color: '#B8960E' }}>
                          C$ {item.precio}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 3: RESERVAS EN VISTA ÚNICA DE 2 COLUMNAS */}
          {activeTab === 'reservas' && canBook && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(260px, 320px) 1fr',
                gap: '24px',
                alignItems: 'start'
              }}
            >
              {/* COLUMNA IZQUIERDA: Banner informativo de Reservas */}
              <div
                className="clay-card-static"
                style={{
                  padding: '22px 20px',
                  borderRadius: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  background: 'linear-gradient(135deg, rgba(20, 109, 158, 0.08) 0%, rgba(20, 109, 158, 0.02) 100%)',
                  border: '1px solid rgba(20, 109, 158, 0.18)'
                }}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'linear-gradient(135deg, #146D9E 0%, #0D496B 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(20, 109, 158, 0.3)' }}>
                  <Icon name="calendar" size={22} color="#FFFFFF" />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '850', color: '#0F172A' }}>
                    {tr('Reserva Directa', 'Direct Reservation', '直接预订')}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                    {tr(
                      'Reserva instantáneamente sin comisiones ni intermediarios. Tu solicitud llegará directamente al negocio.',
                      'Book instantly with no middleman fees. Confirmation sent directly to the business.',
                      '即时预订，无中介费用。您的请求将直接送达商家。'
                    )}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px dashed rgba(20,109,158,0.18)', fontSize: '12.5px', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <Icon name="checkCircle" size={15} color="#10B981" />
                    <span>{tr('Confirmación inmediata por el local', 'Immediate confirmation by venue', '商家即时确认')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <Icon name="shield" size={15} color="#2563EB" />
                    <span>{tr('Garantía de servicio Atlan', 'Atlan service guarantee', 'Atlan 服务保障')}</span>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: Formulario de Reserva compacto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reservaSuccess ? (
                  <div className="clay-card-static" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid #10B981', color: '#059669', padding: '24px', textAlign: 'center', fontWeight: '700', borderRadius: '18px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                      <Icon name="checkCircle" size={28} color="#10B981" />
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '850', color: '#047857' }}>{tr('¡Reserva enviada con éxito!', 'Reservation submitted successfully!', '预订申请已成功提交！')}</div>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#475569', fontWeight: 'normal' }}>
                      {tr('El negocio se pondrá en contacto contigo muy pronto para confirmar tu reserva.', 'The business will contact you shortly to confirm your booking.', '商家将很快联系您以确认预订。')}
                    </p>
                  </div>
                ) : !userSession ? (
                  <div className="clay-card-static" style={{ padding: '24px', textAlign: 'center', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
                    <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#475569', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Icon name="lock" size={17} color="#146D9E" />
                      <span>{tr('Inicia sesión para realizar reservas', 'Log in to make reservations', '登录后即可进行在线预订')}</span>
                    </p>
                    <a
                      href="/login"
                      style={{
                        display: 'inline-flex',
                        padding: '9px 22px',
                        fontSize: '13px',
                        fontWeight: '800',
                        textDecoration: 'none',
                        background: 'linear-gradient(135deg, #146D9E 0%, #0D496B 100%)',
                        color: '#FFFFFF',
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(20, 109, 158, 0.25)'
                      }}
                    >
                      {tr('Iniciar Sesión', 'Log In', '登录')}
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleCrearReserva} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                          <Icon name="tag" size={13} color="#146D9E" />
                          <span>{tr('Tipo de Reserva', 'Reservation Type', '预订类型')}</span>
                        </label>
                        <select
                          value={reservaTipo}
                          onChange={(e) => setReservaTipo(e.target.value)}
                          className="clay-select"
                          style={{ padding: '9.5px 12px', width: '100%', fontSize: '13px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                        >
                          <option value="mesa">{tr('Mesa / Restaurante', 'Table / Restaurant', '餐桌 / 餐厅')}</option>
                          <option value="habitacion">{tr('Habitación / Hospedaje', 'Room / Lodging', '客房 / 住宿')}</option>
                          <option value="tour">{tr('Tour / Actividad', 'Tour / Activity', '游览 / 活动')}</option>
                          <option value="otro">{tr('Otro Servicio', 'Other Service', '其他服务')}</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                          <Icon name="users" size={13} color="#146D9E" />
                          <span>{tr('Personas', 'People', '人数')}</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={reservaPersonas}
                          onChange={(e) => setReservaPersonas(Number(e.target.value))}
                          className="clay-input"
                          style={{ padding: '9.5px 12px', width: '100%', fontSize: '13px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <Icon name="calendar" size={13} color="#146D9E" />
                        <span>{tr('Fecha y Hora', 'Date & Time', '日期与时间')}</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={reservaFechaHora}
                        onChange={(e) => setReservaFechaHora(e.target.value)}
                        className="clay-input"
                        style={{ padding: '9.5px 12px', width: '100%', fontSize: '13px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <Icon name="fileText" size={13} color="#146D9E" />
                        <span>{tr('Notas especiales o peticiones', 'Special notes or requests', '特殊要求或备注')}</span>
                      </label>
                      <textarea
                        rows="2"
                        value={reservaNotas}
                        onChange={(e) => setReservaNotas(e.target.value)}
                        placeholder={tr('Indica preferencias de asientos, alergias, o detalles adicionales...', 'Indicate allergies, special seating preferences, etc.', '如有座位偏好、过敏或其他要求请在此说明...')}
                        className="clay-textarea"
                        style={{ padding: '10px 12px', width: '100%', fontSize: '13px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReserva}
                      style={{
                        width: '100%',
                        padding: '11.5px 16px',
                        fontSize: '13.5px',
                        fontWeight: '850',
                        color: '#FFFFFF',
                        background: 'linear-gradient(135deg, #146D9E 0%, #0D496B 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: isSubmittingReserva ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 14px rgba(20, 109, 158, 0.35)',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Icon name="calendar" size={16} color="#FFFFFF" />
                      <span>{isSubmittingReserva ? tr('Enviando...', 'Submitting...', '提交中...') : tr('Confirmar Reserva', 'Confirm Reservation', '确认预订')}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 4: RESEÑAS EN VISTA ÚNICA DE 2 COLUMNAS */}
          {activeTab === 'reseñas' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 360px) 1fr',
                gap: '24px',
                height: '100%',
                alignItems: 'start'
              }}
            >
              {/* COLUMNA IZQUIERDA: Formulario de Reseñas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="clay-card-static" style={{ padding: '22px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="edit" size={17} color="#146D9E" />
                    <span>{tr('Escribir una Reseña', 'Write a Review', '撰写评价')}</span>
                  </h4>

                  {!userSession ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                        {tr('Inicia sesión para calificar este lugar y compartir tu opinión.', 'Log in to write reviews & rate this place.', '登录后即可为此地点评分并分享体验。')}
                      </p>
                      <a
                        href="/login"
                        style={{
                          display: 'inline-flex',
                          padding: '9px 22px',
                          fontSize: '13px',
                          fontWeight: '800',
                          textDecoration: 'none',
                          background: 'linear-gradient(135deg, #146D9E 0%, #0D496B 100%)',
                          color: '#FFFFFF',
                          borderRadius: '10px',
                          boxShadow: '0 4px 12px rgba(20, 109, 158, 0.25)'
                        }}
                      >
                        {tr('Iniciar Sesión', 'Log In', '登录')}
                      </a>
                    </div>
                  ) : (
                    <form onSubmit={handleCrearResena} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {reviewErrorMsg && (
                        <div style={{ color: '#EF4444', fontSize: '12.5px', fontWeight: '600', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '9px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon name="alertTriangle" size={15} color="#EF4444" />
                          <span>{reviewErrorMsg}</span>
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '5px' }}>
                          {tr('Tu Nombre', 'Your Name', '您的称呼')}
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!!userSession}
                          value={newReviewNombre}
                          onChange={(e) => setNewReviewNombre(e.target.value)}
                          placeholder="Ej: Carlos"
                          className="clay-input"
                          style={{ padding: '9.5px 12px', width: '100%', fontSize: '13px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                          {tr('Calificación', 'Rating', '评分')}
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '2px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReviewEstrellas(star)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'transform 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              <Icon
                                name={star <= newReviewEstrellas ? 'starFilled' : 'star'}
                                size={24}
                                color={star <= newReviewEstrellas ? '#F59E0B' : '#CBD5E1'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '5px' }}>
                          {tr('Tu Comentario', 'Your Review', '您的评价')}
                        </label>
                        <textarea
                          required
                          rows="3"
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          placeholder={tr('Comparte tu experiencia en este lugar...', 'Share your experience at this place...', '分享您在此地点的体验...')}
                          className="clay-textarea"
                          style={{ padding: '10px 12px', width: '100%', fontSize: '13px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        style={{
                          width: '100%',
                          padding: '11px 16px',
                          fontSize: '13.5px',
                          fontWeight: '850',
                          color: '#FFFFFF',
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: isSubmittingReview ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                          transition: 'all 0.2s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Icon name="checkCircle" size={16} color="#FFFFFF" />
                        <span>{isSubmittingReview ? '...' : tr('Enviar Reseña', 'Submit Review', '提交评价')}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* COLUMNA DERECHA: Listado y Resumen de Reseñas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(20, 109, 158, 0.08) 0%, rgba(20, 109, 158, 0.03) 100%)',
                    padding: '13px 18px',
                    borderRadius: '14px',
                    border: '1px solid rgba(20, 109, 158, 0.15)'
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="star" size={16} color="#F59E0B" />
                    <span>{tr('Reseñas de la Comunidad', 'Community Reviews', '社区真实评价')}</span>
                  </h4>
                  {avgRating ? (
                    <div style={{ fontSize: '13.5px', fontWeight: '850', color: '#D97706', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icon name="starFilled" size={16} color="#F59E0B" />
                      <span>{avgRating} / 5.0 ({reviews.length})</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                      {tr('Sin calificaciones aún', 'No ratings yet', '暂无评分')}
                    </span>
                  )}
                </div>

                {/* Feed de Comentarios */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reviews.length === 0 ? (
                    <div
                      className="clay-card-static"
                      style={{
                        padding: '30px 20px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      <Icon name="messageCircle" size={32} color="#94A3B8" />
                      <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', fontStyle: 'italic' }}>
                        {tr('No hay reseñas aún. ¡Sé el primero en calificar este negocio!', 'No reviews yet. Be the first to review!', '暂无评价。快来成为第一个为此地点评价的人吧！')}
                      </p>
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="clay-card-static" style={{ padding: '16px 18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #146D9E 0%, #0D496B 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', boxShadow: '0 2px 6px rgba(20,109,158,0.25)' }}>
                              {rev.autor_nombre?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span>{rev.autor_nombre}</span>
                          </span>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Icon
                                key={s}
                                name={s <= rev.estrellas ? 'starFilled' : 'star'}
                                size={14}
                                color={s <= rev.estrellas ? '#F59E0B' : '#E2E8F0'}
                              />
                            ))}
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: '1.55' }}>{rev.comentario}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

