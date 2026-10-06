"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import styles from './businessProfileModal.module.css';
import { useTranslation } from "@/hooks/useTranslation";
import { getPointImage } from "@/lib/imageUtils";
import { CATEGORIAS_CONFIG } from "@/lib/categories";

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
  const [previewPhoto, setPreviewPhoto] = useState(null);

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
    : (details?.rating || point?.rating ? Number(details?.rating || point?.rating).toFixed(1) : null);

  // Imagen del lugar/negocio
  const coverImage = getPointImage(point, details);

  // Configuración de categoría
  const catKey = (point.categoria || 'otro').toLowerCase();
  const catConfig = CATEGORIAS_CONFIG[catKey] || CATEGORIAS_CONFIG.otro;

  // Estilos temáticos según la categoría
  const getCategoryTheme = (cat) => {
    const category = (cat || '').toLowerCase();
    if (category.includes('restaurante') || category.includes('comida') || category.includes('comider') || category.includes('café') || category.includes('bar')) {
      return {
        cover: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #7F1D1D 100%)',
        accent: '#EF4444',
      };
    } else if (category.includes('hotel') || category.includes('hospedaje') || category.includes('hostal')) {
      return {
        cover: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #1E3A8A 100%)',
        accent: '#3B82F6',
      };
    } else if (category.includes('naturaleza') || category.includes('tour') || category.includes('aventura') || category.includes('parque') || category.includes('playa')) {
      return {
        cover: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #064E3B 100%)',
        accent: '#10B981',
      };
    } else if (category.includes('cultura') || category.includes('arte') || category.includes('museo') || category.includes('artesanal')) {
      return {
        cover: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #4C1D95 100%)',
        accent: '#8B5CF6',
      };
    }
    return {
      cover: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #0C4A6E 100%)',
      accent: '#0EA5E9',
    };
  };

  const theme = getCategoryTheme(point.categoria);

  // Galería de fotos (si existen en el negocio o punto)
  const allPhotos = [
    ...(Array.isArray(details?.fotos) ? details.fotos : []),
    ...(Array.isArray(point?.fotos_comunidad) ? point.fotos_comunidad : []),
    ...(Array.isArray(point?.fotos) ? point.fotos : [])
  ].filter(Boolean);

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* ── CABECERA HERO ELEGANTE Y DE ALTO CONTRASTE ── */}
        <header className={styles.heroHeader} style={{ background: theme.cover }}>
          {/* Fondo sutil con foto si existe */}
          {coverImage && (
            <div
              className={styles.heroBackdrop}
              style={{ backgroundImage: `url(${coverImage})` }}
            />
          )}
          <div className={styles.heroOverlay} />

          <div className={styles.heroContent}>
            {/* Fila Superior: Badges + Botones de Acción */}
            <div className={styles.heroTopRow}>
              <div className={styles.heroMainInfo}>
                {/* Badges de Estado, Categoría y Precio */}
                <div className={styles.badgesRow}>
                  {(() => {
                    let statusText = '';
                    let statusColor = '#34D399';
                    let statusBg = 'rgba(16, 185, 129, 0.22)';
                    let statusBorder = 'rgba(16, 185, 129, 0.55)';

                    if (point.estado === 'en_verificacion') {
                      statusText = tr('En Espera de Verificación', 'Awaiting Verification', '等待审核');
                      statusColor = '#FBBF24';
                      statusBg = 'rgba(245, 158, 11, 0.25)';
                      statusBorder = 'rgba(245, 158, 11, 0.6)';
                    } else if (point.estado === 'aprobado') {
                      statusText = tr('Negocio Verificado', 'Verified Business', '已认证商家');
                      statusColor = '#34D399';
                      statusBg = 'rgba(16, 185, 129, 0.22)';
                      statusBorder = 'rgba(16, 185, 129, 0.55)';
                    } else {
                      const isClaimed = !!point.negocio_id;
                      statusText = isClaimed ? tr('Reclamado', 'Claimed', '已认领') : tr('Sin Reclamar', 'Unclaimed', '未认领');
                      statusColor = isClaimed ? '#34D399' : '#CBD5E1';
                      statusBg = isClaimed ? 'rgba(16, 185, 129, 0.22)' : 'rgba(148, 163, 184, 0.2)';
                      statusBorder = isClaimed ? 'rgba(16, 185, 129, 0.55)' : 'rgba(148, 163, 184, 0.4)';
                    }

                    return (
                      <span
                        className={styles.statusBadge}
                        style={{
                          color: statusColor,
                          backgroundColor: statusBg,
                          border: `1.5px solid ${statusBorder}`,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: statusColor,
                          }}
                        />
                        <span>{statusText}</span>
                      </span>
                    );
                  })()}

                  {point.categoria && (
                    <span className={styles.categoryBadge}>
                      {catConfig?.svgFile && (
                        <img
                          src={catConfig.svgFile}
                          alt=""
                          width={13}
                          height={13}
                          style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                        />
                      )}
                      <span>{point.categoria}</span>
                    </span>
                  )}

                  {details?.rango_precios && (
                    <span className={styles.priceBadge}>
                      {formatPriceRange(details.rango_precios)}
                    </span>
                  )}

                  {point.departamento && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '4px 9px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#E2E8F0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>📍</span>
                      <span>{point.departamento}</span>
                    </span>
                  )}
                </div>

                {/* Título Principal Cristalino */}
                <h2 className={styles.placeTitle}>
                  {point.nombre}
                </h2>

                {/* Calificación y Ubicación */}
                <div className={styles.heroMetaRow}>
                  {avgRating ? (
                    <div className={styles.ratingSnippet}>
                      <Icon name="starFilled" size={15} color="#FFD700" />
                      <span>{avgRating}</span>
                      <span className={styles.reviewsCount}>
                        ({reviews.length} {reviews.length === 1 ? tr('reseña', 'review', '条评价') : tr('reseñas', 'reviews', '条评价')})
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: '#94A3B8', fontSize: '12.5px' }}>
                      ★ {tr('Nuevo en Atlan', 'New on Atlan', '新入驻')}
                    </span>
                  )}

                  {point.ubicacion && (
                    <span style={{ opacity: 0.8, fontSize: '12.5px' }}>
                      • {point.ubicacion}
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de Acción (Favorito + Cerrar) */}
              <div className={styles.heroActionsGroup}>
                {userSession && (
                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    title={isFavorite ? tr('Quitar de Favoritos', 'Remove Favorite', '取消收藏') : tr('Guardar Favorito', 'Save Favorite', '收藏')}
                    className={styles.actionCircleBtn}
                    style={{
                      borderColor: isFavorite ? '#FFD700' : 'rgba(255, 255, 255, 0.25)',
                      color: isFavorite ? '#FFD700' : '#FFFFFF',
                    }}
                    aria-label="Favorito"
                  >
                    <Icon name={isFavorite ? 'heartFilled' : 'heart'} size={18} color={isFavorite ? '#FFD700' : '#FFFFFF'} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className={styles.actionCircleBtn}
                  title={tr('Cerrar', 'Close', '关闭')}
                  aria-label="Cerrar modal"
                >
                  <Icon name="x" size={18} color="#FFFFFF" />
                </button>
              </div>
            </div>

            {/* Botón Iniciar Viaje */}
            <button
              type="button"
              onClick={() => {
                if (onIniciarViaje) {
                  onIniciarViaje(point);
                  onClose();
                }
              }}
              className={styles.startTripBtn}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span>{tr('Iniciar Viaje', 'Start Trip', '开始行程')}</span>
            </button>

            {/* Pestañas de Navegación de Alto Contraste */}
            <nav className={styles.tabsBar} aria-label="Secciones del perfil">
              {(() => {
                const showMenuTab = Boolean(servs.has_menu || menu.length > 0);

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
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
                    >
                      <Icon name={tab.iconName} size={16} color={isActive ? '#38BDF8' : '#CBD5E1'} />
                      <span>{tab.label}</span>
                      {typeof tab.count === 'number' && tab.count > 0 && (
                        <span className={styles.tabBadge}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </nav>
          </div>
        </header>

        {/* ── CUERPO EXPANDIDO Y ESPACIOSO ── */}
        <div className={styles.modalBody}>
          {/* PESTAÑA 1: INFORMACIÓN GENERAL */}
          {activeTab === 'info' && (
            <div className={styles.infoGrid}>
              {/* COLUMNA IZQUIERDA: Descripción & Interés Turístico */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Banner de Verificación */}
                {point.estado === 'en_verificacion' && (
                  <div className={styles.claimAlert}>
                    <Icon name="hourglass" size={24} color="#D97706" />
                    <div>
                      <h4 className={styles.claimAlertTitle}>
                        {tr('Solicitud de Reclamo en Verificación', 'Claim Under Review', '认领申请审核中')}
                      </h4>
                      <p className={styles.claimAlertText}>
                        {tr(
                          'Una solicitud de verificación de propiedad sobre este local se encuentra actualmente en revisión por la administración de Atlan.',
                          'A business ownership verification claim is currently being evaluated by Atlan administrators.',
                          '管理员正在审核此地点的所有者认领申请。'
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botón Reclamar Negocio si está sin reclamar */}
                {!point.negocio_id && point.estado === 'sin_reclamar' && (
                  <Link
                    href="/dashboard"
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      fontSize: '13.5px',
                      fontWeight: '800',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)',
                      color: '#0F172A',
                      borderRadius: '14px',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    <Icon name="claim" size={18} color="#0F172A" />
                    <span>{tr('¿Eres el dueño? Reclamar este negocio', 'Are you the owner? Claim this business', '您是商家所有者？认领此地点')}</span>
                  </Link>
                )}

                {/* Acerca de este Destino */}
                <div className={styles.contentCard}>
                  <h4 className={styles.cardTitle}>
                    <Icon name="info" size={16} color={theme.accent} />
                    <span>{tr('Acerca de este Destino', 'About this Destination', '关于此目的地')}</span>
                  </h4>
                  <p className={styles.cardDescription}>
                    {point.descripcion || tr(
                      'Este destino cuenta con gran reconocimiento en la región. Visítalo para disfrutar de su atención, gastronomía y ambiente característico.',
                      'A notable local destination in Nicaragua. Visit to experience its distinct service, hospitality, and offerings.',
                      '这是尼加拉瓜当地深受欢迎的目的地，欢迎前往体验独特的文化、美食与服务。'
                    )}
                  </p>
                </div>

                {/* Interés Turístico y Consejos */}
                <div className={styles.tipsCard}>
                  <h4 className={styles.cardTitle}>
                    <Icon name="compass" size={16} color="#B8960E" />
                    <span>{tr('Interés Turístico y Consejos', 'Tourist Tips & Information', '旅游提示与贴士')}</span>
                  </h4>
                  <div className={styles.tipsList}>
                    <div className={styles.tipItem}>
                      <div className={styles.tipIconWrapper} style={{ background: 'rgba(22, 163, 74, 0.12)' }}>
                        <Icon name="dollarSign" size={15} color="#16A34A" />
                      </div>
                      <div>
                        <span className={styles.tipLabel}>{tr('Moneda & Pagos:', 'Payments & Currency:', '货币与支付：')} </span>
                        <span>
                          {details?.servicios?.has_card_payment
                            ? tr('Aceptan pagos en efectivo y tarjeta (Córdobas / USD).', 'Cash and card payments accepted (Córdobas / USD).', '支持现金及银行卡（科多巴/美元）。')
                            : tr('Pagos en efectivo (Córdobas / USD según negocio).', 'Cash payments accepted (Córdobas / USD).', '仅支持现金（科多巴/美元）。')}
                        </span>
                      </div>
                    </div>

                    <div className={styles.tipItem}>
                      <div className={styles.tipIconWrapper} style={{ background: 'rgba(37, 99, 235, 0.12)' }}>
                        <Icon name="shield" size={15} color="#2563EB" />
                      </div>
                      <div>
                        <span className={styles.tipLabel}>{tr('Experiencia Verificada:', 'Visitor Experience:', '实地体验：')} </span>
                        <span>{tr('Destino recomendado para familias, parejas y turistas en Nicaragua.', 'Recommended destination for solo travelers, couples & families.', '推荐给尼加拉瓜的独行游客、情侣及家庭旅行。')}</span>
                      </div>
                    </div>

                    <div className={styles.tipItem}>
                      <div className={styles.tipIconWrapper} style={{ background: 'rgba(225, 29, 72, 0.12)' }}>
                        <Icon name="mapPin" size={15} color="#E11D48" />
                      </div>
                      <div>
                        <span className={styles.tipLabel}>{tr('Indicaciones de Ruta:', 'Navigation Guidance:', '路线指引：')} </span>
                        <span>{tr('Navegación GPS directa disponible. Toca el botón "Iniciar Viaje" arriba para guiarte en el mapa.', 'Direct GPS route available. Tap "Start Trip" above for turn-by-turn guidance.', '提供GPS导航。点击上方“开始行程”即可开启地图指引。')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Galería de Fotos si tiene fotos adicionales */}
                {allPhotos.length > 0 && (
                  <div className={styles.contentCard}>
                    <h4 className={styles.cardTitle}>
                      <Icon name="camera" size={16} color="#0284C7" />
                      <span>{tr('Fotos y Galería', 'Photo Gallery', '照片图库')} ({allPhotos.length})</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                      {allPhotos.slice(0, 6).map((imgUrl, idx) => (
                        <div
                          key={`photo-${idx}`}
                          onClick={() => setPreviewPhoto(imgUrl)}
                          style={{
                            aspectRatio: '1',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid #E2E8F0',
                            position: 'relative'
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* COLUMNA DERECHA: Horarios + Servicios y Contacto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Horarios de Atención */}
                <div className={styles.contentCard}>
                  <div className={styles.scheduleHeader}>
                    <h4 className={styles.cardTitle}>
                      <Icon name="clock" size={16} color={theme.accent} />
                      <span>{tr('Horarios de Atención', 'Opening Schedule', '营业时间')}</span>
                    </h4>
                    {isBusinessOpenNow && details?.horarios && isBusinessOpenNow(details.horarios) !== null && (
                      <span
                        className={`${styles.openBadgePill} ${
                          isBusinessOpenNow(details.horarios)
                            ? styles.openBadgePillOpen
                            : styles.openBadgePillClosed
                        }`}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isBusinessOpenNow(details.horarios) ? '#10B981' : '#EF4444',
                          }}
                        />
                        <span>
                          {isBusinessOpenNow(details.horarios)
                            ? tr('Abierto Ahora', 'Open Now', '营业中')
                            : tr('Cerrado', 'Closed', '已打烊')}
                        </span>
                      </span>
                    )}
                  </div>

                  {details?.horarios && Object.keys(details.horarios).length > 0 ? (
                    <div className={styles.scheduleList}>
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
                              className={`${styles.scheduleRow} ${isToday ? styles.scheduleRowToday : ''}`}
                            >
                              <span>
                                {dayLabels[day.toLowerCase()] || day}{' '}
                                {isToday && (
                                  <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '11px', marginLeft: '4px' }}>
                                    • {tr('Hoy', 'Today', '今天')}
                                  </span>
                                )}
                              </span>
                              <span className={info?.abierto ? styles.scheduleHoursOpen : styles.scheduleHoursClosed}>
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
                    <div className={styles.scheduleEmptyNotice}>
                      <Icon name="clock" size={20} color="#64748B" />
                      <div>
                        <h5 className={styles.scheduleEmptyTitle}>
                          {tr('Horarios no registrados', 'Schedule not specified', '未登记具体营业时间')}
                        </h5>
                        <p className={styles.scheduleEmptyText}>
                          {tr(
                            'Consulte directamente con el local para confirmación de horarios o visítelo durante su atención habitual.',
                            'Please check directly with the venue for exact hours or visit during regular daytime hours.',
                            '具体营业时间请直接向商家核实，或于日间正常时段前往。'
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Servicios y Amenidades si el negocio las declara */}
                {(servs.has_wifi || servs.has_card_payment || servs.has_parking || servs.has_pet_friendly || servs.has_ac || servs.has_reservas) && (
                  <div className={styles.contentCard}>
                    <h4 className={styles.cardTitle}>
                      <Icon name="sparkles" size={16} color="#F59E0B" />
                      <span>{tr('Servicios y Comodidades', 'Amenities & Services', '配套服务与设施')}</span>
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {servs.has_wifi && (
                        <span style={{ fontSize: '12.5px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#F1F5F9', color: '#1E293B', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          📶 Wi-Fi
                        </span>
                      )}
                      {servs.has_ac && (
                        <span style={{ fontSize: '12.5px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#F1F5F9', color: '#1E293B', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          ❄️ {tr('Aire Acondicionado', 'Air Conditioning', '空调')}
                        </span>
                      )}
                      {servs.has_parking && (
                        <span style={{ fontSize: '12.5px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#F1F5F9', color: '#1E293B', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          🚗 {tr('Estacionamiento', 'Parking', '停车场')}
                        </span>
                      )}
                      {servs.has_card_payment && (
                        <span style={{ fontSize: '12.5px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#F1F5F9', color: '#1E293B', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          💳 {tr('Acepta Tarjeta', 'Cards Accepted', '刷卡支付')}
                        </span>
                      )}
                      {servs.has_pet_friendly && (
                        <span style={{ fontSize: '12.5px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#F1F5F9', color: '#1E293B', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          🐾 Pet Friendly
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 2: MENÚ & SERVICIOS */}
          {activeTab === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h4 className={styles.cardTitle} style={{ fontSize: '14px' }}>
                <Icon name="utensils" size={17} color={theme.accent} />
                <span>{tr('Platillos y Servicios', 'Menu & Services', '菜单与服务')}</span>
              </h4>

              {menu.length === 0 ? (
                <div
                  className={styles.contentCard}
                  style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="utensils" size={28} color="#94A3B8" />
                  </div>
                  <p style={{ margin: 0, fontSize: '14.5px', color: '#475569', fontWeight: '600' }}>
                    {tr('No hay platillos o servicios publicados aún para este negocio.', 'No menu or services published yet.', '此商家尚未发布菜单或服务。')}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px'
                  }}
                >
                  {menu.map((item) => (
                    <div
                      key={item.id}
                      className={styles.contentCard}
                      style={{
                        padding: '16px 18px',
                        justifyContent: 'space-between',
                        opacity: item.disponible === false ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', gap: '14px' }}>
                        {item.foto_url ? (
                          <img
                            src={item.foto_url}
                            alt={item.nombre}
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                              border: '1px solid #E2E8F0',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '12px',
                              background: '#F1F5F9',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              border: '1px solid #E2E8F0',
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
                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748B', lineHeight: 1.45 }}>
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '10px', marginTop: '10px' }}>
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

          {/* PESTAÑA 3: RESERVAS DIRECTAS */}
          {activeTab === 'reservas' && canBook && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                alignItems: 'start'
              }}
            >
              {/* Información de Reservas */}
              <div
                className={styles.contentCard}
                style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.06) 0%, rgba(2, 132, 199, 0.02) 100%)',
                  border: '1.5px solid rgba(2, 132, 199, 0.25)'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
                  <Icon name="calendar" size={22} color="#FFFFFF" />
                </div>
                <div>
                  <h4 className={styles.cardTitle} style={{ fontSize: '15px' }}>
                    {tr('Reserva Directa', 'Direct Reservation', '直接预订')}
                  </h4>
                  <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: '#475569', lineHeight: '1.55' }}>
                    {tr(
                      'Reserva instantáneamente sin comisiones ni intermediarios. Tu solicitud llegará directamente al negocio.',
                      'Book directly with no hidden fees. Confirmation is handled straight by the venue.',
                      '即时预订，无中介费用。您的请求将直接送达商家。'
                    )}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px dashed rgba(2, 132, 199, 0.2)', fontSize: '13px', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                    <Icon name="checkCircle" size={16} color="#10B981" />
                    <span>{tr('Confirmación directa por el negocio', 'Immediate confirmation by venue', '商家即时确认')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                    <Icon name="shield" size={16} color="#2563EB" />
                    <span>{tr('Garantía de servicio Atlan', 'Atlan service guarantee', 'Atlan 服务保障')}</span>
                  </div>
                </div>
              </div>

              {/* Formulario de Reserva */}
              <div className={styles.contentCard}>
                {reservaSuccess ? (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                      <Icon name="checkCircle" size={30} color="#10B981" />
                    </div>
                    <div style={{ fontSize: '16.5px', fontWeight: '850', color: '#047857' }}>
                      {tr('¡Reserva enviada con éxito!', 'Reservation submitted successfully!', '预订申请已成功提交！')}
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                      {tr('El negocio se pondrá en contacto contigo muy pronto para confirmar tu reserva.', 'The business will contact you shortly to confirm your booking.', '商家将很快联系您以确认预订。')}
                    </p>
                  </div>
                ) : !userSession ? (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 16px', fontSize: '14.5px', color: '#334155', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Icon name="lock" size={18} color="#0284C7" />
                      <span>{tr('Inicia sesión para realizar reservas', 'Log in to make reservations', '登录后即可进行在线预订')}</span>
                    </p>
                    <a
                      href="/login"
                      style={{
                        display: 'inline-flex',
                        padding: '10px 24px',
                        fontSize: '13.5px',
                        fontWeight: '800',
                        textDecoration: 'none',
                        background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                      }}
                    >
                      {tr('Iniciar Sesión', 'Log In', '登录')}
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleCrearReserva} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                          <Icon name="tag" size={13} color="#0284C7" />
                          <span>{tr('Tipo de Reserva', 'Reservation Type', '预订类型')}</span>
                        </label>
                        <select
                          value={reservaTipo}
                          onChange={(e) => setReservaTipo(e.target.value)}
                          style={{ padding: '10px 12px', width: '100%', fontSize: '13.5px', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', color: '#0F172A' }}
                        >
                          <option value="mesa">{tr('Mesa / Restaurante', 'Table / Restaurant', '餐桌 / 餐厅')}</option>
                          <option value="habitacion">{tr('Habitación / Hospedaje', 'Room / Lodging', '客房 / 住宿')}</option>
                          <option value="tour">{tr('Tour / Actividad', 'Tour / Activity', '游览 / 活动')}</option>
                          <option value="otro">{tr('Otro Servicio', 'Other Service', '其他服务')}</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                          <Icon name="users" size={13} color="#0284C7" />
                          <span>{tr('Personas', 'People', '人数')}</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={reservaPersonas}
                          onChange={(e) => setReservaPersonas(Number(e.target.value))}
                          style={{ padding: '10px 12px', width: '100%', fontSize: '13.5px', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', color: '#0F172A' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <Icon name="calendar" size={13} color="#0284C7" />
                        <span>{tr('Fecha y Hora', 'Date & Time', '日期与时间')}</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={reservaFechaHora}
                        onChange={(e) => setReservaFechaHora(e.target.value)}
                        style={{ padding: '10px 12px', width: '100%', fontSize: '13.5px', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', color: '#0F172A' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <Icon name="edit" size={13} color="#0284C7" />
                        <span>{tr('Notas o Peticiones Especiales', 'Special Requests', '备注与特殊需求')}</span>
                      </label>
                      <textarea
                        rows="3"
                        value={reservaNotas}
                        onChange={(e) => setReservaNotas(e.target.value)}
                        placeholder={tr('Ej: Mesa al aire libre, celebración de cumpleaños...', 'Ex: Outdoor table, anniversary...', '例：靠窗座位、生日庆祝...')}
                        style={{ padding: '10px 12px', width: '100%', fontSize: '13.5px', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', color: '#0F172A' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReserva}
                      style={{
                        padding: '12px 18px',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#FFFFFF',
                        background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: isSubmittingReserva ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isSubmittingReserva ? tr('Enviando...', 'Submitting...', '提交中...') : tr('Confirmar Solicitud de Reserva', 'Submit Reservation Request', '确认提交预订')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 4: RESEÑAS DE LA COMUNIDAD */}
          {activeTab === 'reseñas' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                alignItems: 'start'
              }}
            >
              {/* Formulario de Reseñas */}
              <div className={styles.contentCard}>
                <h4 className={styles.cardTitle}>
                  <Icon name="edit" size={16} color="#0284C7" />
                  <span>{tr('Escribir una Reseña', 'Write a Review', '撰写评价')}</span>
                </h4>

                {!userSession ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                      {tr('Inicia sesión para calificar este lugar y compartir tu experiencia.', 'Log in to rate this place and share your feedback.', '登录后即可为此地点评分并分享体验。')}
                    </p>
                    <a
                      href="/login"
                      style={{
                        display: 'inline-flex',
                        padding: '10px 24px',
                        fontSize: '13.5px',
                        fontWeight: '800',
                        textDecoration: 'none',
                        background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
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
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '5px' }}>
                        {tr('Tu Nombre', 'Your Name', '您的称呼')}
                      </label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(userSession)}
                        value={newReviewNombre}
                        onChange={(e) => setNewReviewNombre(e.target.value)}
                        placeholder="Ej: Carlos"
                        style={{ padding: '10px 12px', width: '100%', fontSize: '13.5px', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', color: '#0F172A' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
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
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
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
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '5px' }}>
                        {tr('Tu Comentario', 'Your Review', '您的评价')}
                      </label>
                      <textarea
                        required
                        rows="3"
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder={tr('Comparte tu experiencia en este lugar...', 'Share your experience at this place...', '分享您在此地点的体验...')}
                        style={{ padding: '10px 12px', width: '100%', fontSize: '13.5px', borderRadius: '10px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', color: '#0F172A' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
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

              {/* Listado de Reseñas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    border: '1.5px solid #E2E8F0',
                  }}
                >
                  <h4 className={styles.cardTitle}>
                    <Icon name="star" size={16} color="#F59E0B" />
                    <span>{tr('Reseñas de la Comunidad', 'Community Reviews', '社区真实评价')}</span>
                  </h4>
                  {avgRating ? (
                    <div style={{ fontSize: '14px', fontWeight: '850', color: '#D97706', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icon name="starFilled" size={16} color="#F59E0B" />
                      <span>{avgRating} / 5.0 ({reviews.length})</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {tr('Sin calificaciones aún', 'No ratings yet', '暂无评分')}
                    </span>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div
                    className={styles.contentCard}
                    style={{
                      padding: '36px 20px',
                      textAlign: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Icon name="messageCircle" size={32} color="#94A3B8" />
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
                      {tr('No hay reseñas aún. ¡Sé el primero en calificar este negocio!', 'No reviews yet. Be the first to review!', '暂无评价。快来成为第一个为此地点评价的人吧！')}
                    </p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className={styles.contentCard} style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
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
                      <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>{rev.comentario}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox para fotos ampliadas si se hace clic en la galería */}
      {previewPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            backgroundColor: 'rgba(7, 11, 20, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '88vh' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhoto}
              alt=""
              style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: '16px', objectFit: 'contain' }}
            />
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <Icon name="x" size={18} color="#0F172A" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
