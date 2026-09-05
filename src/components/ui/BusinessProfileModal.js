"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';

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
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'menu' | 'reservas' | 'reseñas'

  if (!isOpen || !point) return null;

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

  const theme = getCategoryTheme(point.category);
  const phoneNum = details?.telefono || point?.telefono;
  const whatsappNum = details?.whatsapp || point?.whatsapp || phoneNum;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(10, 15, 28, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="business-profile-modal"
        style={{
          width: '100%',
          maxWidth: '960px',
          height: '85vh',
          maxHeight: '680px',
          minHeight: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* CABECERA RESALTADA CON FONDO ELEGANTE Y ESPACIO MAXIMIZADO */}
        <div
          style={{
            background: theme.cover,
            padding: '20px 24px 0px',
            position: 'relative',
            color: '#FFFFFF',
            flexShrink: 0,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}
        >
          {/* BOTONES ACCION SUPERIOR DERECHA */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 2 }}>
            {userSession && (
              <button
                onClick={onToggleFavorite}
                title={isFavorite ? (lang === 'en' ? 'Remove Favorite' : 'Quitar de Favoritos') : (lang === 'en' ? 'Save Favorite' : 'Guardar Favorito')}
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
            {details?.logo_url ? (
              <img
                src={details.logo_url}
                alt={point.nombre}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                  background: '#FFFFFF',
                  flexShrink: 0
                }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  fontWeight: '800',
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                  flexShrink: 0
                }}
              >
                {point.nombre?.charAt(0)?.toUpperCase() || <Icon name="building" size={28} color="#FFFFFF" />}
              </div>
            )}

            <div style={{ flex: 1, minWidth: '220px' }}>
              {/* BADGES */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                {(() => {
                  let statusText = '';
                  let statusColor = '';
                  let statusBg = '';

                  if (point.estado === 'en_verificacion') {
                    statusText = lang === 'en' ? 'Awaiting Verification' : 'En Espera de Verificación';
                    statusColor = '#FB923C';
                    statusBg = 'rgba(251, 146, 60, 0.2)';
                  } else if (point.estado === 'aprobado') {
                    statusText = lang === 'en' ? 'Verified Business' : 'Negocio Verificado';
                    statusColor = '#34D399';
                    statusBg = 'rgba(52, 211, 153, 0.2)';
                  } else {
                    const isClaimed = !!point.negocio_id;
                    statusText = isClaimed ? (t('map.claimed') || 'Reclamado') : (t('map.unclaimed') || 'Sin Reclamar');
                    statusColor = isClaimed ? '#34D399' : '#FBBF24';
                    statusBg = isClaimed ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)';
                  }

                  return (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        color: statusColor,
                        background: statusBg,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        border: `1px solid ${statusColor}50`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon name={point.estado === 'aprobado' ? 'checkCircle' : 'shield'} size={12} color={statusColor} />
                      {statusText}
                    </span>
                  );
                })()}

                {avgRating && (
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: '800',
                      color: '#FFD700',
                      background: 'rgba(255, 215, 0, 0.2)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 215, 0, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Icon name="starFilled" size={13} color="#FFD700" />
                    {avgRating} ({reviews.length})
                  </span>
                )}

                {details?.rango_precios && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#E2E8F0',
                      background: 'rgba(255, 255, 255, 0.15)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {details.rango_precios}
                  </span>
                )}
              </div>

              {/* TITULO RESALTADO */}
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#FFFFFF', lineHeight: '1.25', letterSpacing: '-0.3px' }}>
                {point.nombre}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#CBD5E1', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icon name="mapPin" size={14} color="#38BDF8" />
                <span>{t(`addPoint.categories.${point.category || 'otro'}`) || point.category}</span>
              </p>
            </div>

            {/* BOTON INICIAR VIAJE EN CABECERA */}
            <button
              onClick={() => onIniciarViaje(point)}
              style={{
                padding: '9px 16px',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '13px',
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
              <span>{lang === 'en' ? 'Start Trip' : 'Iniciar Viaje'}</span>
            </button>
          </div>

          {/* TAB BAR NAVEGACION INTEGRADO DENTRO DE CABECERA */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            {[
              { id: 'info', label: lang === 'en' ? 'Information' : 'Información', iconName: 'info' },
              { id: 'menu', label: lang === 'en' ? 'Menu & Services' : 'Menú y Servicios', iconName: 'utensils', count: menu.length },
              { id: 'reservas', label: lang === 'en' ? 'Reservations' : 'Reservas', iconName: 'calendar' },
              { id: 'reseñas', label: lang === 'en' ? 'Reviews' : 'Reseñas', iconName: 'star', count: reviews.length }
            ].map((tab) => {
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
            })}
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
                        {lang === 'en' ? 'Claim Under Review' : 'Solicitud de Reclamo en Verificación'}
                      </strong>
                      <div style={{ fontSize: '12.5px', color: '#4A5568', marginTop: '2px', lineHeight: 1.4 }}>
                        {lang === 'en'
                          ? 'A owner verification claim is currently being evaluated by Atlan administration.'
                          : 'Una solicitud de verificación de propiedad sobre este local se encuentra actualmente en revisión por la administración.'}
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
                    <span>{lang === 'en' ? 'Are you the owner? Claim this business' : '¿Eres el dueño? Reclamar este negocio'}</span>
                  </Link>
                )}

                {/* Descripción */}
                <div className="clay-card-static" style={{ padding: '20px', borderRadius: '18px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="info" size={15} color={theme.accent} />
                    <span>{lang === 'en' ? 'About this Destination' : 'Acerca de este Destino'}</span>
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.65' }}>
                    {point.descripcion || (lang === 'en' ? 'No detailed description available for this place.' : 'Sin descripción disponible para este destino.')}
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
                    <span>{lang === 'en' ? 'Tourist Tips & Information' : 'Interés Turístico y Consejos'}</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Icon name="dollarSign" size={15} color="#16A34A" style={{ marginTop: '2px' }} />
                      <span><strong>{lang === 'en' ? 'Accepted Currency:' : 'Moneda & Pagos:'}</strong> {lang === 'en' ? 'Nicaraguan Córdobas (NIO) & US Dollars (USD). Cash & Card accepted.' : 'Aceptan Córdobas (NIO) y Dólares (USD). Pagos en efectivo y tarjeta.'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Icon name="shield" size={15} color="#2563EB" style={{ marginTop: '2px' }} />
                      <span><strong>{lang === 'en' ? 'Visitor Experience:' : 'Experiencia Verificada:'}</strong> {lang === 'en' ? 'Recommended destination for solo travelers, couples & families.' : 'Destino recomendado para familias, parejas y mochileros en Nicaragua.'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Icon name="mapPin" size={15} color="#E11D48" style={{ marginTop: '2px' }} />
                      <span><strong>{lang === 'en' ? 'Navigation:' : 'Indicaciones de Llegada:'}</strong> {lang === 'en' ? 'Direct map route guidance available. Tap "Start Trip" above.' : 'Ruta directa disponible. Toca el botón "Iniciar Viaje" para navegación activa.'}</span>
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
                      <span>{lang === 'en' ? 'Opening Schedule' : 'Horarios de Atención'}</span>
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
                          ? (lang === 'en' ? 'Open Now' : 'Abierto Ahora')
                          : (lang === 'en' ? 'Closed' : 'Cerrado')}
                      </span>
                    )}
                  </div>

                  {details?.horarios && Object.keys(details.horarios).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(details.horarios).map(([day, info]) => {
                        const dayLabels = {
                          lunes: lang === 'en' ? 'Monday' : 'Lunes',
                          martes: lang === 'en' ? 'Tuesday' : 'Martes',
                          miercoles: lang === 'en' ? 'Wednesday' : 'Miércoles',
                          jueves: lang === 'en' ? 'Thursday' : 'Jueves',
                          viernes: lang === 'en' ? 'Friday' : 'Viernes',
                          sabado: lang === 'en' ? 'Saturday' : 'Sábado',
                          domingo: lang === 'en' ? 'Sunday' : 'Domingo',
                        };
                        const isToday = new Date().getDay() === {
                          domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6
                        }[day];

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
                            <span>{dayLabels[day] || day} {isToday && '• (Hoy)'}</span>
                            <span>
                              {info?.abierto
                                ? `${info.apertura || ''} - ${info.cierre || ''}`
                                : (lang === 'en' ? 'Closed' : 'Cerrado')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
                      {lang === 'en' ? 'Regular business hours apply.' : 'Consulte directamente para confirmación de horario exacto.'}
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
                <span>{t('dashboard.menu') || 'Platillos y Servicios'}</span>
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
                    {lang === 'en' ? 'No menu or services published yet.' : 'No hay platillos o servicios publicados aún para este negocio.'}
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
                                {lang === 'en' ? 'Unavailable' : 'Agotado'}
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
          {activeTab === 'reservas' && (
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
                  background: 'linear-gradient(135deg, rgba(20, 109, 158, 0.06) 0%, rgba(255, 215, 0, 0.08) 100%)',
                  border: '1.5px solid rgba(20, 109, 158, 0.15)'
                }}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: theme.cover, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="calendar" size={22} color="#FFFFFF" />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '850', color: '#0F172A' }}>
                    {t('reservations.title') || 'Reserva Directa'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                    {lang === 'en'
                      ? 'Book instantly with no middleman fees. Confirmation sent directly to the business.'
                      : 'Reserva instantáneamente sin comisiones ni intermediarios. Tu solicitud llegará directamente al negocio.'}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px dashed rgba(20,109,158,0.15)', fontSize: '12.5px', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="checkCircle" size={14} color="#16A34A" />
                    <span>Confirmación inmediata por el local</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="shield" size={14} color="#2563EB" />
                    <span>Garantía de servicio Atlan</span>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: Formulario de Reserva compacto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reservaSuccess ? (
                  <div className="clay-card-static" style={{ background: 'rgba(23, 170, 74, 0.10)', border: '1.5px solid #17AA4A', color: '#17AA4A', padding: '24px', textAlign: 'center', fontWeight: '700', borderRadius: '18px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Icon name="checkCircle" size={28} color="#16A34A" />
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '850' }}>{t('reservations.success') || '¡Reserva enviada con éxito!'}</div>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#475569', fontWeight: 'normal' }}>
                      {lang === 'en' ? 'The business will contact you shortly to confirm your booking.' : 'El negocio se pondrá en contacto contigo muy pronto para confirmar tu reserva.'}
                    </p>
                  </div>
                ) : !userSession ? (
                  <div className="clay-card-static" style={{ padding: '24px', textAlign: 'center', borderRadius: '18px' }}>
                    <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#475569', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Icon name="lock" size={16} color="#64748B" />
                      <span>{t('reservations.loginRequired') || 'Inicia sesión para realizar reservas'}</span>
                    </p>
                    <a
                      href="/login"
                      className="clay-btn-gold no-sheen"
                      style={{
                        display: 'inline-flex',
                        padding: '10px 24px',
                        fontSize: '13px',
                        textDecoration: 'none'
                      }}
                    >
                      {t('nav.login') || 'Iniciar Sesión'}
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleCrearReserva} className="clay-card-static" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px', borderRadius: '18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                          {t('reservations.type') || 'Tipo de Reserva'}
                        </label>
                        <select
                          value={reservaTipo}
                          onChange={(e) => setReservaTipo(e.target.value)}
                          className="clay-input"
                          style={{ padding: '9px 12px', width: '100%', fontSize: '13px' }}
                        >
                          <option value="mesa">{t('reservations.types.mesa') || 'Mesa / Restaurante'}</option>
                          <option value="habitacion">{t('reservations.types.habitacion') || 'Habitación / Hospedaje'}</option>
                          <option value="tour">{t('reservations.types.tour') || 'Tour / Excursión'}</option>
                          <option value="transporte">{t('reservations.types.transporte') || 'Transporte / Traslado'}</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <Icon name="users" size={13} color="#64748B" />
                          <span>{t('reservations.people') || 'N° Personas'}</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={reservaPersonas}
                          onChange={(e) => setReservaPersonas(e.target.value)}
                          className="clay-input"
                          style={{ padding: '9px 12px', width: '100%', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <Icon name="calendar" size={13} color="#64748B" />
                        <span>{t('reservations.date') || 'Fecha y Hora'}</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={reservaFechaHora}
                        onChange={(e) => setReservaFechaHora(e.target.value)}
                        className="clay-input"
                        style={{ padding: '9px 12px', width: '100%', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <Icon name="fileText" size={13} color="#64748B" />
                        <span>{t('reservations.notes') || 'Notas especiales o peticiones'}</span>
                      </label>
                      <textarea
                        rows="2"
                        value={reservaNotas}
                        onChange={(e) => setReservaNotas(e.target.value)}
                        placeholder={lang === 'en' ? 'Indicate allergies, special seating preferences, etc.' : 'Indica preferencias de asientos, alergias, o detalles adicionales...'}
                        className="clay-textarea"
                        style={{ padding: '9px 12px', width: '100%', fontSize: '12.5px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReserva}
                      className="clay-btn-gold no-sheen"
                      style={{ width: '100%', padding: '12px', fontSize: '13.5px', fontWeight: '800' }}
                    >
                      {isSubmittingReserva ? (lang === 'en' ? 'Submitting...' : 'Enviando...') : (t('reservations.submit') || 'Confirmar Reserva')}
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
                <div className="clay-card-static" style={{ padding: '20px', borderRadius: '18px' }}>
                  <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '800', color: '#B8960E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="edit" size={16} color="#B8960E" />
                    <span>{t('reviews.writeReview') || 'Escribir una Reseña'}</span>
                  </h4>

                  {!userSession ? (
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748B', lineHeight: '1.4' }}>
                        {lang === 'en' ? 'Log in to write reviews & rate this place.' : 'Inicia sesión para calificar este lugar y compartir tu opinión.'}
                      </p>
                      <a
                        href="/login"
                        className="clay-btn-gold no-sheen"
                        style={{
                          display: 'inline-flex',
                          padding: '8px 20px',
                          fontSize: '12.5px',
                          textDecoration: 'none'
                        }}
                      >
                        {t('nav.login') || 'Iniciar Sesión'}
                      </a>
                    </div>
                  ) : (
                    <form onSubmit={handleCrearResena} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {reviewErrorMsg && (
                        <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', background: 'rgba(239,68,68,0.1)', padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon name="alertTriangle" size={14} color="#ef4444" />
                          <span>{reviewErrorMsg}</span>
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                          {t('reviews.yourName') || 'Tu Nombre'}
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!!userSession}
                          value={newReviewNombre}
                          onChange={(e) => setNewReviewNombre(e.target.value)}
                          placeholder="Ej: Carlos"
                          className="clay-input"
                          style={{ padding: '9px 12px', width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                          {t('reviews.rating') || 'Calificación'}
                        </label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingTop: '2px' }}>
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
                            >
                              <Icon
                                name={star <= newReviewEstrellas ? 'starFilled' : 'star'}
                                size={24}
                                color={star <= newReviewEstrellas ? '#B8960E' : '#CBD5E1'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                          {t('reviews.yourComment') || 'Tu Comentario'}
                        </label>
                        <textarea
                          required
                          rows="3"
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          placeholder={lang === 'en' ? 'Share your experience at this place...' : 'Comparte tu experiencia en este lugar...'}
                          className="clay-textarea"
                          style={{ padding: '10px 12px', width: '100%', fontSize: '13px' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="clay-btn-green no-sheen"
                        style={{ width: '100%', padding: '11px', fontSize: '13px', fontWeight: '800' }}
                      >
                        {isSubmittingReview ? '...' : (t('reviews.submit') || 'Publicar Reseña')}
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
                    background: 'rgba(255, 215, 0, 0.08)',
                    padding: '12px 18px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 215, 0, 0.25)'
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="star" size={16} color="#B8960E" />
                    <span>{t('reviews.title') || 'Reseñas de la Comunidad'}</span>
                  </h4>
                  {avgRating ? (
                    <div style={{ fontSize: '13.5px', fontWeight: '850', color: '#B8960E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icon name="starFilled" size={15} color="#B8960E" />
                      <span>{avgRating} / 5.0 ({reviews.length})</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                      {lang === 'en' ? 'No ratings yet' : 'Sin calificaciones aún'}
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
                        gap: '10px'
                      }}
                    >
                      <Icon name="messageCircle" size={32} color="#CBD5E1" />
                      <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', fontStyle: 'italic' }}>
                        {lang === 'en' ? 'No reviews yet. Be the first to review!' : 'No hay reseñas aún. ¡Sé el primero en calificar este negocio!'}
                      </p>
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="clay-card-static" style={{ padding: '14px 18px', borderRadius: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: theme.cover, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                              {rev.autor_nombre?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span>{rev.autor_nombre}</span>
                          </span>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Icon
                                key={s}
                                name={s <= rev.estrellas ? 'starFilled' : 'star'}
                                size={13}
                                color={s <= rev.estrellas ? '#B8960E' : '#E2E8F0'}
                              />
                            ))}
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>{rev.comentario}</p>
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

