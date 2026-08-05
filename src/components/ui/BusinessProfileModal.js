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
  const [selectedPhoto, setSelectedPhoto] = useState(null);

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
        cover: 'linear-gradient(135deg, #FF6B6B 0%, #D93838 100%)',
        accent: '#D93838'
      };
    } else if (category.includes('hotel') || category.includes('hospedaje') || category.includes('hostal')) {
      return {
        cover: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        accent: '#1D4ED8'
      };
    } else if (category.includes('naturaleza') || category.includes('tour') || category.includes('aventura') || category.includes('parque')) {
      return {
        cover: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
        accent: '#047857'
      };
    } else if (category.includes('cultura') || category.includes('arte') || category.includes('museo')) {
      return {
        cover: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        accent: '#6D28D9'
      };
    }
    return {
      cover: 'linear-gradient(135deg, #146D9E 0%, #0D496B 100%)',
      accent: '#146D9E'
    };
  };

  const theme = getCategoryTheme(point.category);
  const heroPhoto = details?.fotos && details.fotos.length > 0 ? details.fotos[0] : null;

  // Servicios activos en el negocio
  const servs = details?.servicios || {};
  const activeServiceList = [
    { key: 'has_wifi', label: lang === 'en' ? 'Free Wi-Fi' : 'WiFi Gratis', icon: 'wifi' },
    { key: 'has_parking', label: lang === 'en' ? 'Parking' : 'Estacionamiento', icon: 'parking' },
    { key: 'has_pets', label: lang === 'en' ? 'Pet Friendly' : 'Mascotas Bienvenidas', icon: 'pet' },
    { key: 'has_card_payment', label: lang === 'en' ? 'Card Payment' : 'Pagos con Tarjeta', icon: 'creditCard' },
    { key: 'has_accessibility', label: lang === 'en' ? 'Accessible' : 'Accesibilidad', icon: 'accessibility' },
    { key: 'has_delivery', label: lang === 'en' ? 'Delivery' : 'Envíos / Delivery', icon: 'delivery' },
    { key: 'has_ac', label: lang === 'en' ? 'A/C' : 'Aire Acondicionado', icon: 'ac' },
    { key: 'has_live_music', label: lang === 'en' ? 'Live Music' : 'Música en Vivo', icon: 'music' },
  ].filter(s => !!servs[s.key]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(10, 15, 28, 0.8)',
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
          maxWidth: '880px',
          maxHeight: '92vh',
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
        {/* BANNER COVER HERO DE CABECERA */}
        <div
          style={{
            height: heroPhoto ? '140px' : '90px',
            background: heroPhoto ? `url(${heroPhoto}) center/cover no-repeat` : theme.cover,
            position: 'relative',
            flexShrink: 0
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: heroPhoto
                ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(10,15,28,0.75) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.25) 100%)'
            }}
          />

          {/* BOTONES SUPERIORES FLOTANTES */}
          <div style={{ position: 'absolute', top: '14px', right: '16px', display: 'flex', gap: '8px', zIndex: 2 }}>
            {userSession && (
              <button
                onClick={onToggleFavorite}
                title={isFavorite ? (lang === 'en' ? 'Remove Favorite' : 'Quitar de Favoritos') : (lang === 'en' ? 'Save Favorite' : 'Guardar Favorito')}
                style={{
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: isFavorite ? '1.5px solid #FFD700' : '1px solid rgba(255,255,255,0.4)',
                  color: isFavorite ? '#B8960E' : '#475569',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s'
                }}
              >
                <Icon name={isFavorite ? 'heartFilled' : 'heart'} size={18} color={isFavorite ? '#B8960E' : '#475569'} />
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#1E293B',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s'
              }}
            >
              <Icon name="x" size={18} color="#1E293B" />
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL CABECERA */}
        <div
          style={{
            padding: '0 28px 16px',
            borderBottom: '1px solid rgba(20, 109, 158, 0.1)',
            background: '#FFFFFF',
            position: 'relative',
            marginTop: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              {details?.logo_url ? (
                <img
                  src={details.logo_url}
                  alt={point.nombre}
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '20px',
                    objectFit: 'cover',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    background: '#FFFFFF'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '20px',
                    background: theme.cover,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '30px',
                    fontWeight: '800',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                  }}
                >
                  {point.nombre?.charAt(0)?.toUpperCase() || <Icon name="building" size={32} color="#FFFFFF" />}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  {(() => {
                    let statusText = '';
                    let statusColor = '';
                    let statusBg = '';

                    if (point.estado === 'en_verificacion') {
                      statusText = lang === 'en' ? 'Awaiting Verification' : 'En Espera de Verificación';
                      statusColor = '#f97316';
                      statusBg = 'rgba(249, 115, 22, 0.12)';
                    } else if (point.estado === 'aprobado') {
                      statusText = lang === 'en' ? 'Verified Business' : 'Negocio Verificado';
                      statusColor = '#10b981';
                      statusBg = 'rgba(16, 185, 129, 0.12)';
                    } else {
                      const isClaimed = !!point.negocio_id;
                      statusText = isClaimed ? (t('map.claimed') || 'Reclamado') : (t('map.unclaimed') || 'Sin Reclamar');
                      statusColor = isClaimed ? '#10b981' : '#f59e0b';
                      statusBg = isClaimed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)';
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
                          border: `1px solid ${statusColor}40`,
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
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#B8960E',
                        background: 'rgba(255, 215, 0, 0.18)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon name="starFilled" size={13} color="#B8960E" />
                      {avgRating} ({reviews.length})
                    </span>
                  )}

                  {details?.rango_precios && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#1E293B',
                        background: '#F1F5F9',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      {details.rango_precios}
                    </span>
                  )}
                </div>

                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '850', color: '#0F172A', lineHeight: '1.2' }}>
                  {point.nombre}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Icon name="mapPin" size={14} color="#64748B" />
                  <span>{t(`addPoint.categories.${point.category || 'otro'}`) || point.category}</span>
                </p>
              </div>
            </div>

            {/* BOTÓN DE INICIAR VIAJE */}
            <button
              onClick={() => onIniciarViaje(point)}
              className="neon-map-btn-dark"
              style={{
                padding: '9px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px'
              }}
            >
              <span
                className="neon-sign-text"
                style={{
                  fontSize: '15px',
                  fontWeight: '900',
                  letterSpacing: '0.5px',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  WebkitTextStroke: '1px #FFD700',
                  paintOrder: 'stroke fill'
                }}
              >
                {lang === 'en' ? 'Start Trip' : 'Iniciar Viaje'}
              </span>
              <img src="/images/ir.svg" alt="Ir" style={{ width: '22px', height: '22px', filter: 'brightness(0) invert(1)' }} />
            </button>
          </div>

          {/* NAVEGACIÓN MULTI-PESTAÑA CON ICONOS SVG */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              borderBottom: '1px solid rgba(20, 109, 158, 0.1)',
              paddingBottom: '2px',
              marginTop: '20px',
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
                    color: isActive ? theme.accent : '#64748B',
                    background: isActive ? 'rgba(20, 109, 158, 0.08)' : 'transparent',
                    border: 'none',
                    borderBottom: isActive ? `2.5px solid ${theme.accent}` : '2.5px solid transparent',
                    borderRadius: '10px 10px 0 0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon name={tab.iconName} size={16} color={isActive ? theme.accent : '#64748B'} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        background: isActive ? theme.accent : 'rgba(100, 116, 139, 0.15)',
                        color: isActive ? '#FFFFFF' : '#64748B'
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

        {/* CUERPO SCROLLABLE SEGÚN PESTAÑA ACTIVA */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(20, 109, 158, 0.2) transparent'
          }}
        >
          {/* PESTAÑA 1: INFORMACIÓN */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                  className="clay-btn-gold"
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
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="info" size={15} color={theme.accent} />
                  <span>{lang === 'en' ? 'About this Business' : 'Acerca de este Negocio'}</span>
                </h4>
                <p style={{ margin: 0, fontSize: '14.5px', color: '#475569', lineHeight: '1.65' }}>
                  {point.descripcion || (lang === 'en' ? 'No description available.' : 'Sin descripción disponible.')}
                </p>
              </div>

              {/* Horarios de Atención */}
              {details?.horarios && Object.keys(details.horarios).length > 0 && (
                <div style={{ borderTop: '1px solid rgba(20, 109, 158, 0.1)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="clock" size={15} color={theme.accent} />
                      <span>{lang === 'en' ? 'Opening Hours' : 'Horarios de Atención'}</span>
                    </h4>
                    {isBusinessOpenNow && isBusinessOpenNow(details.horarios) !== null && (
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
                  <div className="clay-card-static" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                            fontSize: '13.5px',
                            color: isToday ? '#1E293B' : '#64748B',
                            fontWeight: isToday ? '800' : '500',
                            padding: '4px 0',
                            borderBottom: '1px dashed rgba(20, 109, 158, 0.08)'
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
                </div>
              )}
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

          {/* PESTAÑA 3: RESERVAS */}
          {activeTab === 'reservas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '580px', margin: '0 auto', width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '850', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Icon name="calendar" size={20} color={theme.accent} />
                  <span>{t('reservations.title') || 'Reserva Directa'}</span>
                </h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B' }}>
                  {lang === 'en' ? 'Reserve your spot directly with this business' : 'Reserva directamente con este establecimiento sin intermediarios'}
                </p>
              </div>

              {reservaSuccess ? (
                <div className="clay-card-static" style={{ background: 'rgba(23, 170, 74, 0.10)', border: '1.5px solid #17AA4A', color: '#17AA4A', padding: '24px', textAlign: 'center', fontWeight: '700', borderRadius: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Icon name="checkCircle" size={28} color="#16A34A" />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '850' }}>{t('reservations.success') || '¡Reserva enviada con éxito!'}</div>
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#475569', fontWeight: 'normal' }}>
                    {lang === 'en' ? 'The business will contact you shortly to confirm your booking.' : 'El negocio se pondrá en contacto contigo muy pronto para confirmar tu reserva.'}
                  </p>
                </div>
              ) : !userSession ? (
                <div className="clay-card-static" style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#475569', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Icon name="lock" size={16} color="#64748B" />
                    <span>{t('reservations.loginRequired') || 'Inicia sesión para realizar reservas'}</span>
                  </p>
                  <a
                    href="/login"
                    className="clay-btn-gold"
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
                <form onSubmit={handleCrearReserva} className="clay-card-static" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                      {t('reservations.type') || 'Tipo de Reserva'}
                    </label>
                    <select
                      value={reservaTipo}
                      onChange={(e) => setReservaTipo(e.target.value)}
                      className="clay-input"
                      style={{ padding: '11px 14px', width: '100%' }}
                    >
                      <option value="mesa">{t('reservations.types.mesa') || 'Mesa / Restaurante'}</option>
                      <option value="habitacion">{t('reservations.types.habitacion') || 'Habitación / Hospedaje'}</option>
                      <option value="tour">{t('reservations.types.tour') || 'Tour / Excursión'}</option>
                      <option value="transporte">{t('reservations.types.transporte') || 'Transporte / Traslado'}</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <Icon name="calendar" size={14} color="#64748B" />
                        <span>{t('reservations.date') || 'Fecha y Hora'}</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={reservaFechaHora}
                        onChange={(e) => setReservaFechaHora(e.target.value)}
                        className="clay-input"
                        style={{ padding: '10px 12px', width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <Icon name="users" size={14} color="#64748B" />
                        <span>{t('reservations.people') || 'Personas'}</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={reservaPersonas}
                        onChange={(e) => setReservaPersonas(e.target.value)}
                        className="clay-input"
                        style={{ padding: '10px 12px', width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                      <Icon name="fileText" size={14} color="#64748B" />
                      <span>{t('reservations.notes') || 'Notas especiales o peticiones'}</span>
                    </label>
                    <textarea
                      rows="3"
                      value={reservaNotas}
                      onChange={(e) => setReservaNotas(e.target.value)}
                      placeholder={lang === 'en' ? 'Indicate allergies, special seating preferences, etc.' : 'Indica preferencias de asientos, alergias, o detalles adicionales...'}
                      className="clay-textarea"
                      style={{ padding: '12px 14px', width: '100%' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReserva}
                    className="clay-btn-gold"
                    style={{ width: '100%', padding: '14px', fontSize: '14px', fontWeight: '800' }}
                  >
                    {isSubmittingReserva ? (lang === 'en' ? 'Submitting...' : 'Enviando...') : (t('reservations.submit') || 'Confirmar Reserva')}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* PESTAÑA 4: RESEÑAS */}
          {activeTab === 'reseñas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="star" size={16} color="#B8960E" />
                  <span>{t('reviews.title') || 'Reseñas de la Comunidad'}</span>
                </h4>
                {avgRating && (
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#B8960E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Icon name="starFilled" size={15} color="#B8960E" />
                    <span>Calificación promedio: {avgRating} / 5.0</span>
                  </div>
                )}
              </div>

              {/* Formulario de Reseña */}
              {!userSession ? (
                <div className="clay-card-static" style={{ padding: '18px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '13.5px', color: '#475569', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Icon name="lock" size={16} color="#64748B" />
                    <span>{lang === 'en' ? 'Log in to write reviews & comments' : 'Inicia sesión para escribir reseñas y comentarios'}</span>
                  </p>
                  <a
                    href="/login"
                    className="clay-btn-gold"
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
                <form onSubmit={handleCrearResena} className="clay-card-static" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#B8960E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="edit" size={16} color="#B8960E" />
                    <span>{t('reviews.writeReview') || 'Escribir una Reseña'}</span>
                  </p>

                  {reviewErrorMsg && (
                    <div style={{ color: '#ef4444', fontSize: '12.5px', fontWeight: '600', background: 'rgba(239,68,68,0.1)', padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="alertTriangle" size={16} color="#ef4444" />
                      <span>{reviewErrorMsg}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingTop: '4px' }}>
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
                              transition: 'transform 0.1s ease'
                            }}
                          >
                            <Icon
                              name={star <= newReviewEstrellas ? 'starFilled' : 'star'}
                              size={22}
                              color={star <= newReviewEstrellas ? '#B8960E' : '#CBD5E1'}
                            />
                          </button>
                        ))}
                      </div>
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
                      style={{ padding: '11px 14px', width: '100%' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="clay-btn-green"
                    style={{ width: '100%', padding: '12px', fontSize: '13.5px', fontWeight: '800' }}
                  >
                    {isSubmittingReview ? '...' : (t('reviews.submit') || 'Publicar Reseña')}
                  </button>
                </form>
              )}

              {/* Listado de Reseñas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {reviews.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                    {lang === 'en' ? 'No reviews yet. Be the first!' : 'No hay reseñas aún. ¡Sé el primero en calificar este negocio!'}
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="clay-card-static" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon name="user" size={14} color="#64748B" />
                          <span>{rev.autor_nombre}</span>
                        </span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Icon
                              key={s}
                              name={s <= rev.estrellas ? 'starFilled' : 'star'}
                              size={14}
                              color={s <= rev.estrellas ? '#B8960E' : '#E2E8F0'}
                            />
                          ))}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: '1.55' }}>{rev.comentario}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
