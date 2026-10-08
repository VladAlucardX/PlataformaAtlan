"use client";

import React from 'react';
import styles from './lugares.module.css';
import { CATEGORIAS_CONFIG } from '@/lib/categories';

export const DEPARTAMENTOS_LISTA = [
  "Todos",
  "Managua",
  "León",
  "Chinandega",
  "Granada",
  "Masaya",
  "Carazo",
  "Rivas",
  "Matagalpa",
  "Jinotega",
  "Estelí",
  "Madriz",
  "Nueva Segovia",
  "Boaco",
  "Chontales",
  "Río San Juan",
  "RACCN (Caribe Norte)",
  "RACCS (Caribe Sur)"
];

const CATEGORY_NAMES_ES = {
  todas: 'Todas',
  comideria: 'Comidería',
  restaurante: 'Restaurante',
  artesanal: 'Artesanal',
  playa: 'Playa',
  familiar: 'Familiar',
  hotel: 'Hotel',
  hostal: 'Hostal',
  transporte: 'Transporte',
  tour: 'Tour & Guías',
  tienda: 'Tienda',
  otro: 'Otro',
};

const CATEGORY_NAMES_EN = {
  todas: 'All',
  comideria: 'Local Eatery',
  restaurante: 'Restaurant',
  artesanal: 'Artisan',
  playa: 'Beach',
  familiar: 'Family',
  hotel: 'Hotel',
  hostal: 'Hostel',
  transporte: 'Transport',
  tour: 'Tour & Adventure',
  tienda: 'Store',
  otro: 'Other',
};

export default function PlacesFilters({
  search = '',
  onSearchChange,
  selectedDepartment = 'Todos',
  onDepartmentChange,
  selectedCategory = 'todas',
  onCategoryChange,
  totalCount = 0,
  hasActiveFilters = false,
  onResetFilters,
  lang = 'es',
}) {
  const isEn = lang === 'en';
  const categoryNames = isEn ? CATEGORY_NAMES_EN : CATEGORY_NAMES_ES;

  const categories = [
    { key: 'todas', label: categoryNames.todas, color: '#F59E0B' },
    ...Object.entries(CATEGORIAS_CONFIG).map(([key, config]) => ({
      key,
      label: categoryNames[key] || key.charAt(0).toUpperCase() + key.slice(1),
      color: config.color,
      svgFile: config.svgFile,
    })),
  ];

  return (
    <div className={styles.filtersSection}>
      <div className={styles.filtersCard}>
        {/* Fila Superior: Título "Lugares de Nicaragua" + Buscador + Selector Departamento */}
        <div className={styles.filtersTopRow}>
          <h1 className={styles.heroTitleInside}>
            {isEn ? "Places of Nicaragua" : "Lugares de Nicaragua"}
          </h1>

          <div className={styles.searchAndDeptRow}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={isEn ? "Search places, hotels, food..." : "Buscar lugares, negocios..."}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Buscar lugares"
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => onSearchChange('')}
                  title={isEn ? "Clear search" : "Limpiar búsqueda"}
                  aria-label="Limpiar búsqueda"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <div className={styles.deptSelectWrapper}>
              <span className={styles.deptSelectPin}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <select
                className={styles.deptSelect}
                value={selectedDepartment}
                onChange={(e) => onDepartmentChange(e.target.value)}
                aria-label="Filtrar por departamento"
              >
                {DEPARTAMENTOS_LISTA.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'Todos'
                      ? (isEn ? 'Todos los Departamentos' : 'Todos los Departamentos')
                      : dept}
                  </option>
                ))}
              </select>
              <span className={styles.deptSelectArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Fila: Chips de Categorías con scroll horizontal */}
        <div className={styles.categoryChipsWrapper}>
          <div className={styles.categoryChipsList} role="tablist" aria-label="Categorías">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.categoryChip} ${isActive ? styles.categoryChipActive : ''}`}
                  onClick={() => onCategoryChange(cat.key)}
                >
                  <span
                    className={styles.categoryChipDot}
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.svgFile ? (
                    <img
                      src={cat.svgFile}
                      alt=""
                      width={14}
                      height={14}
                      style={{
                        objectFit: 'contain',
                        filter: 'brightness(0) invert(1)',
                        opacity: isActive ? 1 : 0.9,
                      }}
                    />
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ display: 'inline-block', verticalAlign: 'middle', opacity: isActive ? 1 : 0.9 }}
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  )}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barra de Estadísticas y Filtros Activos */}
      <div className={styles.statsBar}>
        <div className={styles.resultsCount}>
          <span>{isEn ? "Showing" : "Mostrando"}</span>
          <span className={styles.resultsCountNumber}>{totalCount}</span>
          <span>{isEn ? (totalCount === 1 ? "place in Nicaragua" : "places in Nicaragua") : (totalCount === 1 ? "lugar de Nicaragua" : "lugares de Nicaragua")}</span>
        </div>

        {hasActiveFilters && (
          <div className={styles.activeFiltersGroup}>
            {selectedDepartment !== 'Todos' && (
              <span className={styles.filterBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{selectedDepartment}</span>
              </span>
            )}
            {selectedCategory !== 'todas' && (
              <span className={styles.filterBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span>{categoryNames[selectedCategory] || selectedCategory}</span>
              </span>
            )}
            {search.trim() !== '' && (
              <span className={styles.filterBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>&ldquo;{search}&rdquo;</span>
              </span>
            )}
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={onResetFilters}
            >
              {isEn ? "Clear filters ✕" : "Limpiar filtros ✕"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
