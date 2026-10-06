"use client";

import React, { memo } from 'react';
import Image from 'next/image';
import styles from './lugares.module.css';
import { CATEGORIAS_CONFIG } from '@/lib/categories';
import { isBusinessOpenNow } from '@/lib/businessHours';
import { getPointImage } from '@/lib/imageUtils';

function PlaceCard({ place, onSelect, lang = 'es' }) {
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
              <span>✨</span>
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
            <span>📍</span>
            <span>{departamento}</span>
          </span>

          {ratingValue && Number(ratingValue) > 0 ? (
            <span className={styles.ratingPill}>
              <span>★</span>
              <span>{ratingValue}</span>
              {numReviews > 0 && (
                <span style={{ opacity: 0.75, fontWeight: 500, fontSize: '10.5px' }}>
                  ({numReviews})
                </span>
              )}
            </span>
          ) : (
            <span className={styles.ratingPill} style={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.1)' }}>
              <span>★</span>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>
                {lang === 'en' ? 'New' : 'Nuevo'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── Contenido de la Tarjeta ── */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle} title={place.nombre}>
          {place.nombre}
        </h3>

        {place.descripcion ? (
          <p className={styles.cardDescription}>{place.descripcion}</p>
        ) : (
          <p className={styles.cardDescription} style={{ fontStyle: 'italic', opacity: 0.6 }}>
            {lang === 'en' ? 'Explore this authentic destination in Nicaragua.' : 'Descubre este auténtico destino en Nicaragua.'}
          </p>
        )}

        <div className={styles.cardFooter}>
          <div className={styles.cardFooterMeta}>
            {priceRange && (
              <span className={styles.priceRangeBadge} title="Rango de precios">
                {priceRange}
              </span>
            )}
            {place.total_visitas > 0 && (
              <span title="Visitas registradas">
                👁️ {place.total_visitas}
              </span>
            )}
          </div>

          <span className={styles.detailsTrigger}>
            <span>{lang === 'en' ? 'View details' : 'Ver detalles'}</span>
            <span>→</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export default memo(PlaceCard);
