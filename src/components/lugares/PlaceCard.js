"use client";

import React, { memo } from 'react';
import Image from 'next/image';
import styles from './lugares.module.css';
import { CATEGORIAS_CONFIG } from '@/lib/categories';
import { isBusinessOpenNow } from '@/lib/businessHours';
import { getPointImage } from '@/lib/imageUtils';

function PlaceCard({ place, onSelect, onComoLlegar, lang = 'es' }) {
  if (!place) return null;

  const negocio = place.negocios || null;
  const imageSrc = getPointImage(place, negocio);

  // Categoría & Estilo
  const catKey = (place.categoria || 'otro').toLowerCase();
  const catConfig = CATEGORIAS_CONFIG[catKey] || CATEGORIAS_CONFIG.otro;

  // Horario (abierto / cerrado)
  const openStatus = isBusinessOpenNow(negocio?.horarios || place.horarios);

  // Rating
  const rawRating = negocio?.rating ?? place.rating;
  const numReviews = negocio?.num_reviews ?? place.num_reviews ?? 0;
  const ratingValue = rawRating !== null && rawRating !== undefined ? Number(rawRating).toFixed(1) : null;

  // Departamento
  const departamento = place.departamento || negocio?.departamento || 'Nicaragua';

  // Rango de precio
  const priceRange = negocio?.rango_precios || place.rango_precios;

  const handleClick = () => {
    if (onSelect) onSelect(place);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className={styles.placeCard}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${place.nombre}`}
    >
      {/* ── Media / Portada ── */}
      <div className={styles.cardMedia}>
        {imageSrc ? (
          <>
            <img
              src={imageSrc}
              alt={place.nombre}
              className={styles.cardImage}
              loading="lazy"
              onError={(e) => {
                // Si la imagen falla al cargar, ocultar y mostrar fallback
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className={styles.mediaOverlay} />
          </>
        ) : (
          <div className={styles.cardFallback}>
            {catConfig?.svgFile && (
              <img
                src={catConfig.svgFile}
                alt=""
                className={styles.fallbackWatermark}
                aria-hidden="true"
              />
            )}
            <div className={styles.fallbackBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
              </svg>
              <span>{lang === 'en' ? 'Photos Coming Soon' : 'Próximamente'}</span>
            </div>
          </div>
        )}

        {/* ── Badges Superiores ── */}
        <div className={styles.mediaTopBar}>
          <span
            className={styles.categoryBadge}
            style={{
              backgroundColor: `${catConfig.color}26`,
              borderColor: `${catConfig.color}66`,
              color: '#FFFFFF',
              border: `1px solid ${catConfig.color}88`,
            }}
          >
            {catConfig?.svgFile && (
              <img
                src={catConfig.svgFile}
                alt=""
                width={13}
                height={13}
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
            )}
            <span>{place.categoria || 'Lugar'}</span>
          </span>

          {openStatus !== null && (
            <span
              className={`${styles.openBadge} ${
                openStatus ? styles.openBadgeOpen : styles.openBadgeClosed
              }`}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: openStatus ? '#10B981' : '#EF4444',
                  boxShadow: openStatus ? '0 0 8px #10B981' : 'none',
                }}
              />
              <span>{openStatus ? (lang === 'en' ? 'Open' : 'Abierto') : (lang === 'en' ? 'Closed' : 'Cerrado')}</span>
            </span>
          )}
        </div>

        {/* ── Badges Inferiores (sobre foto) ── */}
        <div className={styles.mediaBottomBar}>
          <span className={styles.deptPill}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{departamento}</span>
          </span>

          {ratingValue && Number(ratingValue) > 0 ? (
            <span className={styles.ratingPill}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{ratingValue}</span>
              {numReviews > 0 && (
                <span style={{ opacity: 0.75, fontWeight: 500, fontSize: '10.5px' }}>
                  ({numReviews})
                </span>
              )}
            </span>
          ) : (
            <span className={styles.ratingPill} style={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.1)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>
                {lang === 'en' ? 'New' : 'Nuevo'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── Contenido de la Tarjeta ── */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle} title={negocio?.nombre || place.nombre}>
          {negocio?.nombre || place.nombre}
        </h3>

        {(negocio?.descripcion || place.descripcion) ? (
          <p className={styles.cardDescription}>{negocio?.descripcion || place.descripcion}</p>
        ) : (
          <p className={styles.cardDescription} style={{ fontStyle: 'italic', opacity: 0.6 }}>
            {lang === 'en' ? 'Explore this authentic destination in Nicaragua.' : 'Descubre este auténtico destino en Nicaragua.'}
          </p>
        )}

        <div className={styles.cardFooter}>
          <div className={styles.cardFooterMeta}>
            <span
              title={lang === 'en' ? 'Registered visits' : 'Visitas registradas'}
              className={styles.visitasBadge}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{place.total_visitas || 0}</span>
            </span>
          </div>

          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.comoLlegarBtn}
              onClick={(e) => {
                e.stopPropagation();
                if (onComoLlegar) {
                  onComoLlegar(place);
                } else {
                  window.location.href = `/mapa?id=${place.id}&ruta=1`;
                }
              }}
              title={lang === 'en' ? 'Get Directions' : 'Cómo llegar'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span>{lang === 'en' ? 'Directions' : 'Cómo llegar'}</span>
            </button>

            <span className={styles.detailsTrigger}>
              <span>{lang === 'en' ? 'Details' : 'Ver detalles'}</span>
              <span>→</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(PlaceCard);
