"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './lugares.module.css';
import PlacesFilters from './PlacesFilters';
import PlaceCard from './PlaceCard';
import PlaceCardSkeleton from './PlaceCardSkeleton';
import BusinessProfileModal from '@/components/ui/BusinessProfileModal';
import { fetchPlaces, fetchPlaceById, PAGE_SIZE } from '@/lib/placesApi';
import { usePointDetail } from '@/hooks/usePointDetail';
import { isBusinessOpenNow } from '@/lib/businessHours';
import { prefetchPointImages } from '@/lib/imageUtils';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function LugaresExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const { t, tr, lang } = useTranslation();

  // Estados de filtros
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [selectedCat, setSelectedCat] = useState('todas');

  // Estados de datos
  const [places, setPlaces] = useState([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Estado para el modal de detalle
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Hook centralizado para el perfil completo del punto
  const pointDetail = usePointDetail(selectedPoint, session, lang);

  // Debounce para el input de búsqueda (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Carga inicial o recarga por cambio de filtros
  const loadPlaces = useCallback(async (reset = false) => {
    const targetPage = reset ? 0 : page;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await fetchPlaces({
        page: targetPage,
        pageSize: PAGE_SIZE,
        departamento: selectedDept,
        categoria: selectedCat,
        search: debouncedSearch,
      });

      if (reset) {
        const seen = new Set();
        const uniquePlaces = (result.places || []).filter((p) => {
          if (!p?.id || seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        setPlaces(uniquePlaces);
        setPage(0);
      } else {
        setPlaces((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const newPlaces = (result.places || []).filter((p) => {
            if (!p?.id || seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
          return [...prev, ...newPlaces];
        });
      }

      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);

      // Precargar imágenes en background
      prefetchPointImages(result.places);
    } catch (err) {
      console.error('[LugaresExplorer] Error cargando lugares:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, selectedDept, selectedCat, debouncedSearch]);

  // Reaccionar a cambios de filtros
  useEffect(() => {
    loadPlaces(true);
  }, [selectedDept, selectedCat, debouncedSearch]);

  // Manejar deep link desde URL (?lugar=ID o ?id=ID)
  useEffect(() => {
    const lugarId = searchParams.get('lugar') || searchParams.get('id');
    if (!lugarId) return;

    let isMounted = true;
    (async () => {
      try {
        const place = await fetchPlaceById(lugarId);
        if (isMounted && place) {
          setSelectedPoint(place);
          setModalOpen(true);
        }
      } catch (err) {
        console.error('[LugaresExplorer] Error al abrir lugar por ID:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Cargar más lugares
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const result = await fetchPlaces({
        page: nextPage,
        pageSize: PAGE_SIZE,
        departamento: selectedDept,
        categoria: selectedCat,
        search: debouncedSearch,
      });

      setPlaces((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const newPlaces = (result.places || []).filter((p) => {
          if (!p?.id || seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        return [...prev, ...newPlaces];
      });
      setPage(nextPage);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      prefetchPointImages(result.places);
    } catch (err) {
      console.error('[LugaresExplorer] Error al cargar más lugares:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Abrir modal de detalle
  const handleSelectPlace = (place) => {
    setSelectedPoint(place);
    setModalOpen(true);
    // Actualizar URL de manera limpia sin recargar la página
    window.history.replaceState(null, '', `/lugares?lugar=${place.id}`);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPoint(null);
    window.history.replaceState(null, '', '/lugares');
  };

  // Restablecer filtros
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedDept('Todos');
    setSelectedCat('todas');
  };

  const hasActiveFilters = Boolean(
    selectedDept !== 'Todos' ||
    selectedCat !== 'todas' ||
    debouncedSearch.trim() !== ''
  );

  return (
    <div className={styles.pageContainer}>
      {/* ── Filtros y Buscador ── */}
      <PlacesFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        selectedDepartment={selectedDept}
        onDepartmentChange={setSelectedDept}
        selectedCategory={selectedCat}
        onCategoryChange={setSelectedCat}
        totalCount={totalCount}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        lang={lang}
      />

      {/* ── Cuadrícula de Lugares ── */}
      <main className={styles.placesGrid} aria-live="polite">
        {loading ? (
          // Mostrar 12 esqueletos mientras carga
          Array.from({ length: 12 }).map((_, idx) => (
            <PlaceCardSkeleton key={`skeleton-${idx}`} />
          ))
        ) : places.length > 0 ? (
          places.map((place, idx) => (
            <PlaceCard
              key={place.id || `place-${idx}`}
              place={place}
              onSelect={handleSelectPlace}
              onComoLlegar={(pt) => {
                router.push(`/mapa?id=${pt.id}&ruta=1`);
              }}
              lang={lang}
            />
          ))
        ) : (
          <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
            <svg
              className={styles.emptyIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            <h2 className={styles.emptyTitle}>
              {lang === 'en' ? 'No places found' : 'No se encontraron lugares'}
            </h2>
            <p className={styles.emptyText}>
              {lang === 'en'
                ? 'Try adjusting your search criteria or clearing selected department and category filters.'
                : 'Intenta ajustar tus criterios de búsqueda o restablecer los filtros de departamento y categoría.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className={styles.resetFiltersBtn}
                onClick={handleResetFilters}
              >
                <span>{lang === 'en' ? 'Reset all filters' : 'Restablecer todos los filtros'}</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* ── Paginación / Cargar Más ── */}
      {!loading && hasMore && (
        <div className={styles.paginationWrapper}>
          <button
            type="button"
            className={styles.loadMoreBtn}
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(0,0,0,0.2)',
                    borderTopColor: '#000',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>{lang === 'en' ? 'Loading places...' : 'Cargando lugares...'}</span>
              </>
            ) : (
              <>
                <span>{lang === 'en' ? 'Load more places' : 'Cargar más lugares'}</span>
                <span>↓</span>
              </>
            )}
          </button>
          <span className={styles.loadMoreProgress}>
            {lang === 'en'
              ? `Showing ${places.length} of ${totalCount} places`
              : `Mostrando ${places.length} de ${totalCount} lugares`}
          </span>
        </div>
      )}

      {/* ── Modal de Perfil Completo ── */}
      {selectedPoint && (
        <BusinessProfileModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          point={selectedPoint}
          details={pointDetail.details}
          reviews={pointDetail.reviews}
          menu={pointDetail.menu}
          userSession={session}
          lang={lang}
          t={t}
          tr={tr}
          isFavorite={pointDetail.isFavorite}
          onToggleFavorite={pointDetail.handleToggleFavorite}
          onIniciarViaje={(pt) => {
            // Redirige al mapa enfocando este punto para ver ruta
            router.push(`/mapa?id=${pt.id}`);
          }}
          isBusinessOpenNow={isBusinessOpenNow}
          // Reservas
          reservaTipo={pointDetail.reservaTipo}
          setReservaTipo={pointDetail.setReservaTipo}
          reservaFechaHora={pointDetail.reservaFechaHora}
          setReservaFechaHora={pointDetail.setReservaFechaHora}
          reservaPersonas={pointDetail.reservaPersonas}
          setReservaPersonas={pointDetail.setReservaPersonas}
          reservaNotas={pointDetail.reservaNotas}
          setReservaNotas={pointDetail.setReservaNotas}
          isSubmittingReserva={pointDetail.isSubmittingReserva}
          reservaSuccess={pointDetail.reservaSuccess}
          handleCrearReserva={pointDetail.handleCrearReserva}
          // Reseñas
          newReviewNombre={pointDetail.newReviewNombre}
          setNewReviewNombre={pointDetail.setNewReviewNombre}
          newReviewEstrellas={pointDetail.newReviewEstrellas}
          setNewReviewEstrellas={pointDetail.setNewReviewEstrellas}
          newReviewComment={pointDetail.newReviewComment}
          setNewReviewComment={pointDetail.setNewReviewComment}
          isSubmittingReview={pointDetail.isSubmittingReview}
          reviewErrorMsg={pointDetail.reviewErrorMsg}
          handleCrearResena={pointDetail.handleCrearResena}
        />
      )}
    </div>
  );
}
