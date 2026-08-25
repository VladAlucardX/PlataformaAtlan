"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { obtenerDepartamentoPorCoordenadas } from '../lib/geoUtils';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './ui/LanguageToggle';
import Icon from './ui/Icon';
import BusinessProfileModal from './ui/BusinessProfileModal';
import { getPointImage, prefetchPointImages, isRealCustomUrl } from '../lib/imageUtils';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// SVG icon helper for map markers (returns HTML string for innerHTML)
const svgIcon = (path, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle">${path}</svg>`;

// Configuración de categorías (colores e íconos)
const CATEGORIAS_CONFIG = {
  comideria: { color: '#ff6b6b', icon: 'utensils', svg: svgIcon('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>') },
  restaurante: { color: '#ff9233', icon: 'soup', svg: svgIcon('<path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z"/><path d="M7 21h10"/>') },
  artesanal: { color: '#8a2be2', icon: 'palette', svg: svgIcon('<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>') },
  playa: { color: '#00bfff', icon: 'umbrella', svg: svgIcon('<path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"/>') },
  familiar: { color: '#4caf50', icon: 'family', svg: svgIcon('<circle cx="8" cy="5" r="3"/><circle cx="16" cy="5" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/><path d="M13 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/>') },
  hotel: { color: '#e040fb', icon: 'hotel', svg: svgIcon('<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="M9 22v-4h6v4"/><rect x="8" y="6" width="3" height="3" rx=".5"/><rect x="13" y="6" width="3" height="3" rx=".5"/>') },
  hostal: { color: '#9c27b0', icon: 'homeAlt', svg: svgIcon('<path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z"/><path d="M10 21v-6h4v6"/>') },
  transporte: { color: '#607d8b', icon: 'car', svg: svgIcon('<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a1 1 0 0 0-.8.4L1.74 11l-1.58.86a1 1 0 0 0-.16.99V16h3"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>') },
  tour: { color: '#009688', icon: 'mountain', svg: svgIcon('<path d="M8 3l4 8 5-5 5 15H2L8 3z"/>') },
  tienda: { color: '#795548', icon: 'shoppingBag', svg: svgIcon('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>') },
  otro: { color: '#ffc107', icon: 'mapPin', svg: svgIcon('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>') }
};

export default function MapaTuristico() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const mapContainerRef = useRef(null);

  // --- REFS PRINCIPALES ---
  const mapRef = useRef(null);
  const directionsRef = useRef(null);
  const rutaCoordenadasRef = useRef([]);
  const demoIntervalRef = useRef(null);
  const userMarkerRef = useRef(null);
  const activePopupRef = useRef(null);
  const markersRef = useRef([]);  // Lista de marcadores cargados en el mapa
  const currentPosRef = useRef([-86.2504, 12.1364]);  // Managua, Nicaragua
  const isNavigatingRef = useRef(false);
  const isInteractionPausedRef = useRef(false);
  const interactionTimeoutRef = useRef(null);
  const lugarDestinoRef = useRef('');
  const destinationRef = useRef(null);
  const isMutedRef = useRef(false);
  const lastSpokenRef = useRef('');
  const maneuversRef = useRef([]);
  const isDemoRunningRef = useRef(false);
  const lastAnnouncementTimeRef = useRef(0);
  const isAddingPointRef = useRef(false);
  const cinematicTimeoutsRef = useRef([]);
  const selectedPointRef = useRef(null);
  const lastRecalculateTimeRef = useRef(0);


  // --- ESTADO DE REACT ---
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [showRecenterBtn, setShowRecenterBtn] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showDirectionsPopup, setShowDirectionsPopup] = useState(false);
  const [currentManeuver, setCurrentManeuver] = useState(null);

  // Agregar Punto
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tempPointCoords, setTempPointCoords] = useState(null);

  // Formulario nuevo punto
  const [newPointNombre, setNewPointNombre] = useState('');
  const [newPointCreador, setNewPointCreador] = useState('');
  const [newPointDesc, setNewPointDesc] = useState('');
  const [newPointCategoria, setNewPointCategoria] = useState('otro');
  const [isSubmittingPoint, setIsSubmittingPoint] = useState(false);

  // --- ESTADOS PANEL DETALLES LATERAL ---
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedPointDetails, setSelectedPointDetails] = useState(null);
  const [showFullProfileModal, setShowFullProfileModal] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState(null);
  const [pointReviews, setPointReviews] = useState([]);
  const [pointMenu, setPointMenu] = useState([]);
  const [userSession, setUserSession] = useState(null);

  // Reservas
  const [reservaFechaHora, setReservaFechaHora] = useState('');
  const [reservaPersonas, setReservaPersonas] = useState(1);
  const [reservaNotas, setReservaNotas] = useState('');
  const [reservaTipo, setReservaTipo] = useState('mesa');
  const [isSubmittingReserva, setIsSubmittingReserva] = useState(false);
  const [reservaSuccess, setReservaSuccess] = useState(false);

  // Reseñas
  const [newReviewNombre, setNewReviewNombre] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewEstrellas, setNewReviewEstrellas] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  // Favoritos
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);

  // Búsqueda y HUD Waze
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [previewRouteInfo, setPreviewRouteInfo] = useState(null);

  // Registro de Visitas GPS > 1 km
  const [showVisitPrompt, setShowVisitPrompt] = useState(false);
  const [visitPromptData, setVisitPromptData] = useState(null);
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState(null);

  const showNotification = (type, title, message) => {
    setNotificationBanner({ type, title, message });
    setTimeout(() => {
      setNotificationBanner(null);
    }, 4500);
  };

  const handleConfirmarVisitaGPS = async () => {
    if (!userSession?.user) {
      showNotification(
        'warning',
        'Inicio de Sesión Requerido 🔒',
        lang === 'en' 
          ? 'Please log in as a tourist to save your visits and level up in department rankings!' 
          : '¡Inicia sesión como turista para guardar tus visitas y subir en el ranking por departamentos!'
      );
      setTimeout(() => router.push('/login'), 1800);
      return;
    }

    setIsSubmittingVisit(true);
    try {
      let targetPuntoId = visitPromptData?.puntoId;

      // Buscar por nombre si no había ID directo
      if (!targetPuntoId && visitPromptData?.puntoNombre) {
        const { data: found } = await supabase
          .from('puntos')
          .select('id')
          .ilike('nombre', `%${visitPromptData.puntoNombre}%`)
          .limit(1)
          .maybeSingle();
        if (found) targetPuntoId = found.id;
      }

      if (targetPuntoId) {
        const { error } = await supabase.rpc('registrar_visita_turista', {
          p_punto_id: targetPuntoId,
          p_usuario_id: userSession.user.id,
          p_distancia_km: parseFloat(visitPromptData.distanciaKm) || 1.5
        });

        if (error) throw error;
      }

      setShowVisitPrompt(false);
      showNotification(
        'success',
        '¡Visita Registrada con Éxito! 🏆',
        `Has sumado +1 visita en tu pasaporte a ${visitPromptData?.puntoNombre || 'este destino'}.`
      );
    } catch (err) {
      console.error("Error registrando visita:", err);
      showNotification('error', 'Error al Registrar', 'No se pudo guardar la visita.');
    } finally {
      setIsSubmittingVisit(false);
    }
  };

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Redimensionar el mapa cuando se abra o cierre el panel de detalles (Split-Screen)
  useEffect(() => {
    if (mapRef.current) {
      const intervals = [50, 150, 300, 450];
      intervals.forEach(delay => {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        }, delay);
      });
    }
  }, [selectedPoint]);

  // Control de visibilidad del PopUp de Direcciones (Punto A y B)
  useEffect(() => {
    const updatePanelVisibility = () => {
      const directionsPanel = document.querySelector('.mapboxgl-ctrl-directions');
      if (!directionsPanel) return;

      // Agregar cabecera flotante con título y botón cerrar ✕ al panel de Mapbox
      if (!directionsPanel.querySelector('.directions-popup-header')) {
        const header = document.createElement('div');
        header.className = 'directions-popup-header';
        header.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255, 215, 0, 0.15); border-bottom: 1px solid rgba(255, 215, 0, 0.3);">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 13.5px; color: #FFD700;">
              <span>🧭</span>
              <span>${lang === 'en' ? 'Plan Route (A ➔ B)' : 'Planificar Ruta (A ➔ B)'}</span>
            </div>
            <button id="close-directions-popup-btn" type="button" style="background: rgba(255, 255, 255, 0.2); border: none; color: #FFFFFF; width: 26px; height: 26px; border-radius: 50%; cursor: pointer; font-size: 13px; font-weight: bold; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
              ✕
            </button>
          </div>
        `;
        directionsPanel.insertBefore(header, directionsPanel.firstChild);

        const closeBtn = header.querySelector('#close-directions-popup-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            setShowDirectionsPopup(false);
          });
        }
      }

      // ── Traducir las etiquetas del selector de perfil (Traffic, Driving, Walking, Cycling) ──
      const profileLabels = directionsPanel.querySelectorAll('.mapbox-directions-profile label');
      const translations = lang === 'en'
        ? { 'Traffic': 'Traffic', 'Driving': 'Driving', 'Walking': 'Walking', 'Cycling': 'Cycling' }
        : { 'Traffic': 'Tráfico', 'Driving': 'Auto', 'Walking': 'A Pie', 'Cycling': 'Bici' };
      profileLabels.forEach((label) => {
        const text = label.textContent.trim();
        if (translations[text]) {
          label.textContent = translations[text];
        }
      });

      // ── Configurar placeholders e inputs de Origen (A) y Destino (B) ──
      const originInput = directionsPanel.querySelector('.mapbox-directions-origin input');
      const destInput = directionsPanel.querySelector('.mapbox-directions-destination input');

      if (originInput) {
        originInput.setAttribute('placeholder', lang === 'en' ? 'Current Location' : 'Ubicación actual');
      }
      if (destInput) {
        destInput.setAttribute('placeholder', lang === 'en' ? 'Search destination…' : 'Buscar destino…');
      }

      if (showDirectionsPopup) {
        directionsPanel.classList.add('directions-popup-active');
        directionsPanel.style.setProperty('display', 'block', 'important');
        if (directionsRef.current) {
          try {
            // Auto-rellenar origen con ubicación actual
            if (originInput && currentPosRef.current) {
              const [cLng, cLat] = currentPosRef.current;
              if (!originInput.value || originInput.value.includes(',')) {
                directionsRef.current.setOrigin([cLng, cLat]);
                // Reemplazar coordenadas visibles con "Ubicación actual"
                setTimeout(() => {
                  const oInput = directionsPanel.querySelector('.mapbox-directions-origin input');
                  if (oInput && oInput.value && oInput.value.match(/^-?\d/)) {
                    oInput.value = lang === 'en' ? 'Current Location' : 'Ubicación actual';
                  }
                }, 300);
              }
            }

            // Auto-rellenar destino con nombre del punto seleccionado
            if (destInput && selectedPointRef.current && destinationRef.current) {
              if (!destInput.value || destInput.value.match(/^-?\d/)) {
                directionsRef.current.setDestination(destinationRef.current);
                setTimeout(() => {
                  const dInput = directionsPanel.querySelector('.mapbox-directions-destination input');
                  if (dInput && selectedPointRef.current) {
                    dInput.value = selectedPointRef.current.nombre || lugarDestinoRef.current || '';
                  }
                }, 300);
              }
            }
          } catch (e) {}
        }
      } else {
        directionsPanel.classList.remove('directions-popup-active');
        directionsPanel.style.setProperty('display', 'none', 'important');
      }
    };

    updatePanelVisibility();
    const intervalId = setInterval(updatePanelVisibility, 200);
    return () => clearInterval(intervalId);
  }, [showDirectionsPopup]);

  // Manejar previsualización de ruta al seleccionar punto
  useEffect(() => {
    if (!selectedPoint) {
      setPreviewRouteInfo(null);
      if (mapRef.current && mapRef.current.isStyleLoaded()) {
        const source = mapRef.current.getSource('preview-route');
        if (source) {
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          });
        }
      }
      return;
    }

    const fetchPreviewRoute = () => {
      const [oLng, oLat] = currentPosRef.current;
      actualizarPrevisualizacionRuta(oLng, oLat, selectedPoint.lng, selectedPoint.lat);
    };

    // Dar un breve delay para asegurar que el mapa y los estilos estén listos
    const timer = setTimeout(() => {
      fetchPreviewRoute();
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedPoint]);

  // --- EFECTOS DE SESIÓN Y DETALLES DEL PUNTO ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      if (session?.user?.user_metadata?.nombre_completo) {
        setNewReviewNombre(session.user.user_metadata.nombre_completo);
      }
    }).catch(async (err) => {
      console.warn("[Atlan] Fallo al recuperar sesión (token inválido). Limpiando almacenamiento:", err);
      try {
        await supabase.auth.signOut();
      } catch (_) { }
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      setUserSession(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      if (session?.user?.user_metadata?.nombre_completo) {
        setNewReviewNombre(session.user.user_metadata.nombre_completo);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Resetear inmediatamente estados previos para evitar fuga de información entre puntos
    setSelectedPointDetails(null);
    setPointReviews([]);
    setPointMenu([]);
    setIsFavorite(false);
    setFavoriteId(null);

    if (!selectedPoint) return;

    const loadPointDetails = async () => {
      const cacheKey = `atlan_point_details_${selectedPoint.id}`;

      try {
        // 1. Cargar reseñas
        const { data: reviewsData, error: revErr } = await supabase
          .from('resenas')
          .select('*')
          .eq('punto_id', selectedPoint.id)
          .order('created_at', { ascending: false });

        if (revErr) throw revErr;
        const reviews = reviewsData || [];
        setPointReviews(reviews);

        let biz = null;
        let menu = [];

        // 2. Cargar negocio asociado si existe
        if (selectedPoint.negocio_id) {
          const { data: bizData, error: bizErr } = await supabase
            .from('negocios')
            .select('*')
            .eq('id', selectedPoint.negocio_id)
            .single();

          if (bizErr) throw bizErr;
          biz = bizData;
          setSelectedPointDetails(biz);

          if (bizData?.servicios?.has_menu) {
            const { data: menuData, error: menuErr } = await supabase
              .from('menu_items')
              .select('*')
              .eq('negocio_id', selectedPoint.negocio_id);
            if (menuErr) throw menuErr;
            menu = menuData || [];
            setPointMenu(menu);
          }
        }

        // Guardar en caché local
        localStorage.setItem(cacheKey, JSON.stringify({
          reviews,
          biz,
          menu
        }));

      } catch (err) {
        console.warn("[Atlan Offline] Error cargando detalles online, intentando caché local:", err);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setPointReviews(parsed.reviews || []);
          setSelectedPointDetails(parsed.biz || null);
          setPointMenu(parsed.menu || []);
        }
      }

      // 3. Verificar favorito
      if (userSession?.user) {
        try {
          const { data: favData, error: favError } = await supabase
            .from('favoritos')
            .select('id')
            .eq('usuario_id', userSession.user.id)
            .eq('punto_id', selectedPoint.id)
            .maybeSingle();

          if (!favError && favData) {
            setIsFavorite(true);
            setFavoriteId(favData.id);
            localStorage.setItem(`atlan_fav_${selectedPoint.id}`, JSON.stringify({ isFav: true, id: favData.id }));
          } else {
            setIsFavorite(false);
            setFavoriteId(null);
            localStorage.removeItem(`atlan_fav_${selectedPoint.id}`);
          }
        } catch (err) {
          console.warn("[Atlan Offline] Error al verificar favorito en red, usando cache local:", err);
          const cachedFav = localStorage.getItem(`atlan_fav_${selectedPoint.id}`);
          if (cachedFav) {
            const parsed = JSON.parse(cachedFav);
            setIsFavorite(parsed.isFav);
            setFavoriteId(parsed.id);
          } else {
            setIsFavorite(false);
            setFavoriteId(null);
          }
        }
      } else {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    };

    loadPointDetails();
  }, [selectedPoint, userSession]);

  const handleToggleFavorite = async () => {
    if (!userSession) return;
    try {
      if (isFavorite && favoriteId) {
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('id', favoriteId);
        if (error) throw error;
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const { data, error } = await supabase
          .from('favoritos')
          .insert({
            usuario_id: userSession.user.id,
            punto_id: selectedPoint.id
          })
          .select('id')
          .single();
        if (error) throw error;
        setIsFavorite(true);
        setFavoriteId(data.id);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  // Sincronizar el ref del punto seleccionado y controlar el recentrado de navegación
  useEffect(() => {
    selectedPointRef.current = selectedPoint;

    if (selectedPoint) {
      // Si el usuario abre detalles, cancelamos cualquier animación inicial de aproximación
      if (cinematicTimeoutsRef.current.length > 0) {
        console.log('[Atlan] Cancelando animación cinematográfica inicial por apertura de punto');
        cinematicTimeoutsRef.current.forEach(t => clearTimeout(t));
        cinematicTimeoutsRef.current = [];
      }

      // Centrar suavemente la cámara con margen adaptativo según el dispositivo
      if (mapRef.current) {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        mapRef.current.easeTo({
          center: [selectedPoint.lng, selectedPoint.lat],
          padding: isMobile
            ? { top: 180, bottom: 260, left: 20, right: 20 }
            : { top: 140, bottom: 80, left: 380, right: 40 },
          duration: 600,
          essential: true
        });
      }
    } else if (isNavigatingRef.current) {
      // Si se cierra el panel de detalles y estamos en navegación activa,
      // reanudamos el centrado de la cámara de manera inmediata.
      isInteractionPausedRef.current = false;
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: currentPosRef.current,
          zoom: 16.5,
          pitch: 60,
          speed: 0.85,  // Velocidad óptima para renderizado
          curve: 1.1,   // Trayectoria plana para transiciones fluidas
          essential: true
        });
      }
    }
  }, [selectedPoint]);

  // Simular progreso de carga de 0 a 100 en 5 segundos
  useEffect(() => {
    if (isMapLoading) {
      setLoadingProgress(0);
      const startTime = Date.now();
      const duration = 5000; // 5 segundos

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(Math.round((elapsed / duration) * 100), 100);
        setLoadingProgress(progress);

        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [isMapLoading]);

  // --- HANDLERS DE RESERVAS Y RESEÑAS ---
  const handleCrearReserva = async (e) => {
    e.preventDefault();
    if (!userSession) return;
    setIsSubmittingReserva(true);

    try {
      const { error } = await supabase
        .from('reservas')
        .insert([{
          lugar_id: selectedPoint.id,
          negocio_id: selectedPoint.negocio_id,
          cliente_id: userSession.user.id,
          fecha_hora: reservaFechaHora,
          num_personas: parseInt(reservaPersonas),
          notas: reservaNotas,
          tipo_reserva: reservaTipo,
          estado_reserva: 'pendiente'
        }]);

      if (error) throw error;
      setReservaSuccess(true);
      setReservaFechaHora('');
      setReservaNotas('');
      setTimeout(() => setReservaSuccess(false), 4000);
    } catch (err) {
      console.error("Error reservando:", err);
      alert("Error al procesar reserva.");
    } finally {
      setIsSubmittingReserva(false);
    }
  };

  const handleCrearResena = async (e) => {
    e.preventDefault();
    if (!newReviewComment) return;
    setIsSubmittingReview(true);
    setReviewErrorMsg('');

    try {
      // Filtrar usando la función RPC verificar_contenido
      const { data: verifResult, error: verifError } = await supabase
        .rpc('verificar_contenido', { texto: newReviewComment });

      if (verifError) throw verifError;

      if (!verifResult) {
        setReviewErrorMsg(lang === 'en'
          ? 'Inappropriate language detected. Please review your comment.'
          : 'Contenido inapropiado detectado (palabras prohibidas). Por favor modifique su comentario.');
        setIsSubmittingReview(false);
        return;
      }

      const { error } = await supabase
        .from('resenas')
        .insert([{
          punto_id: selectedPoint.id,
          negocio_id: selectedPoint.negocio_id || null,
          autor_nombre: newReviewNombre || (lang === 'en' ? 'Anonymous' : 'Anónimo'),
          autor_id: userSession?.user?.id || null,
          estrellas: newReviewEstrellas,
          comentario: newReviewComment,
          aprobada: true
        }]);

      if (error) throw error;

      setNewReviewComment('');

      // Recargar comentarios localmente
      const { data: updatedReviews } = await supabase
        .from('resenas')
        .select('*')
        .eq('punto_id', selectedPoint.id)
        .order('created_at', { ascending: false });
      setPointReviews(updatedReviews || []);

    } catch (err) {
      console.error("Error al reseñar:", err);
      setReviewErrorMsg("Error al enviar la reseña.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleIniciarViaje = (punto) => {
    const [currLng, currLat] = currentPosRef.current;
    const isUserInCA = currLng >= -93.0 && currLng <= -77.0 && currLat >= 7.0 && currLat <= 19.0;

    if (!isUserInCA) {
      alert(lang === 'en'
        ? 'You are currently outside Central America. Plan your trip and visit us to use live GPS navigation!'
        : 'Te encuentras fuera de Centroamérica. ¡Planifica tu viaje y visítanos para usar la navegación GPS en vivo!');
      return;
    }

    // Limpiar cualquier ruta o previsualización previa para evitar confusión de múltiples líneas
    if (directionsRef.current) {
      try {
        directionsRef.current.removeRoutes();
      } catch (e) {}
    }
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      const source = mapRef.current.getSource('preview-route');
      if (source) {
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
      }
    }
    setPreviewRouteInfo(null);

    lugarDestinoRef.current = punto.nombre;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
    lastSpokenRef.current = '';
    speakInstruction(`${t('map.welcome')} ${t('map.routeTo')} ${punto.nombre}.`, true);

    isNavigatingRef.current = true;
    isInteractionPausedRef.current = false;

    destinationRef.current = [punto.lng, punto.lat];
    rutaCoordenadasRef.current = [];

    if (directionsRef.current) {
      directionsRef.current.setOrigin([currLng, currLat]);
      directionsRef.current.setDestination([punto.lng, punto.lat]);
    }

    mapRef.current.flyTo({
      center: [currLng, currLat],
      zoom: 16.5,
      pitch: 60,
      speed: 0.9,
      curve: 1.1,
      essential: true
    });

    // Cerrar la hoja de detalles al iniciar el viaje
    setSelectedPoint(null);
  };

  const isBusinessOpenNow = (horarios) => {
    if (!horarios || Object.keys(horarios).length === 0) return null;
    const daysEnToEs = { 0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado' };
    const now = new Date();
    const currentDay = daysEnToEs[now.getDay()];
    const diaInfo = horarios[currentDay];
    if (!diaInfo || !diaInfo.abierto) return false;
    const [apHour, apMin] = diaInfo.apertura.split(':').map(Number);
    const [ciHour, ciMin] = diaInfo.cierre.split(':').map(Number);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const apTime = apHour * 60 + apMin;
    const ciTime = ciHour * 60 + ciMin;
    const currTime = currentHour * 60 + currentMin;
    if (ciTime < apTime) return currTime >= apTime || currTime <= ciTime;
    return currTime >= apTime && currTime <= ciTime;
  };

  const calculateETA = (durationSeconds) => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + durationSeconds);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDurationDisplay = (seconds) => {
    if (seconds < 60) return lang === 'en' ? '< 1 min' : '< 1 min';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const formatDistanceDisplay = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const calcRemainingRouteDistance = (pts, currentIndex) => {
    let dist = 0;
    for (let i = currentIndex; i < pts.length - 1; i++) {
      dist += calcDistanceMeters(pts[i], pts[i + 1]);
    }
    return dist;
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('buscar_puntos_por_nombre', {
        query_text: query
      });
      if (error) throw error;
      setSearchResults(data || []);
      setShowResults(true);
    } catch (err) {
      console.warn("[Atlan Offline] Buscando en caché local debido a error de conexión:", err);
      const cached = localStorage.getItem('atlan_puntos_cercanos');
      if (cached) {
        const cachedPoints = JSON.parse(cached);
        const filtered = cachedPoints.filter(p =>
          p.nombre.toLowerCase().includes(query.toLowerCase()) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(query.toLowerCase()))
        );
        setSearchResults(filtered);
        setShowResults(true);
      }
    }
  };

  const selectSearchResult = (punto) => {
    setShowResults(false);
    setSearchQuery('');
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [punto.lng, punto.lat],
        zoom: 16.5,
        pitch: 45,
        speed: 0.85,    // Velocidad optimizada para permitir la descarga de tiles en segundo plano
        curve: 1.15,    // Trayectoria más plana que evita un zoom-out excesivo y recarga de texturas
        essential: true
      });
      cargarPuntosCercanos(punto.lng, punto.lat, filtroCategoria);
      setSelectedPoint(punto);
    }
  };

  // Utilidades de voz
  const speakInstruction = (text, interrupt = false) => {
    if (!('speechSynthesis' in window)) return;
    if (isMutedRef.current) return;

    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    if (window.speechSynthesis.speaking && !interrupt) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 2500);

    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'en' ? 'en-US' : 'es-ES';
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[Atlan] speakInstruction exception:', err);
      }
    }, 100);
  };

  const toggleMute = () => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
  };

  // Cargar puntos desde Supabase
  const cargarPuntosCercanos = async (lon, lat, categoria = null) => {
    if (!mapRef.current) return;

    // Limpiar marcadores anteriores de puntos turísticos
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    try {
      console.log(`[Atlan] Cargando puntos cercanos. Categoría: ${categoria || 'Todas'}`);

      let data = [];
      let error = null;

      try {
        const res = await supabase.rpc('buscar_puntos_cercanos', {
          user_lon: lon,
          user_lat: lat,
          radio_metros: 60000,
          filtro_categoria: categoria || null,
          filtro_estado: null // No filtramos por estado en BD para recibir 'aprobado' y 'sin_reclamar'
        });
        data = res.data;
        error = res.error;
      } catch (netErr) {
        error = netErr;
      }

      let pointsToRender = [];

      if (error) {
        console.warn('[Atlan Offline] Error cargando puntos online, intentando caché local:', error);
        const cached = localStorage.getItem('atlan_puntos_cercanos');
        if (cached) {
          const allCached = JSON.parse(cached);
          pointsToRender = categoria
            ? allCached.filter(p => p.categoria === categoria)
            : allCached;
        }
      } else {
        // Filtrar en JavaScript para mostrar también 'en_verificacion'
        const rawPoints = data || [];
        pointsToRender = rawPoints.filter(p => p.estado === 'aprobado' || p.estado === 'sin_reclamar' || p.estado === 'en_verificacion');
        if (pointsToRender.length > 0) {
          localStorage.setItem('atlan_puntos_cercanos', JSON.stringify(pointsToRender));
        }
      }

      if (pointsToRender.length === 0) {
        console.log('[Atlan] No se encontraron puntos en el área.');
        return;
      }

      pointsToRender.forEach((punto) => {
        const config = CATEGORIAS_CONFIG[punto.categoria] || CATEGORIAS_CONFIG.otro;

        // Crear contenedor HTML para el marcador personalizado
        const el = document.createElement('div');
        el.className = 'marker-custom-container';

        // Elemento interno visual (evita que las transiciones de CSS interfieran con el posicionamiento transform de Mapbox)
        const inner = document.createElement('div');
        inner.className = 'marker-custom';
        inner.style.backgroundColor = config.color;
        inner.style.width = '38px';
        inner.style.height = '38px';
        inner.style.borderRadius = '50%';
        inner.style.display = 'flex';
        inner.style.justifyContent = 'center';
        inner.style.alignItems = 'center';
        inner.style.fontSize = '18px';
        inner.style.cursor = 'pointer';
        inner.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        inner.style.position = 'relative'; // Asegura contexto de posicionamiento para la insignia
        inner.innerHTML = config.svg;

        // Crear insignia de estado circular en la esquina
        const badge = document.createElement('div');
        badge.style.position = 'absolute';
        badge.style.bottom = '-4px';
        badge.style.right = '-4px';
        badge.style.width = '18px';
        badge.style.height = '18px';
        badge.style.borderRadius = '50%';
        badge.style.display = 'flex';
        badge.style.justifyContent = 'center';
        badge.style.alignItems = 'center';
        badge.style.fontSize = '10px';
        badge.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        badge.style.border = '1.5px solid white';
        badge.style.zIndex = '10';

        if (punto.estado === 'en_verificacion') {
          badge.style.backgroundColor = '#f97316'; // Naranja
          badge.innerHTML = '⏳';
          inner.style.border = '2.5px solid #f97316';
          inner.style.boxShadow = '0 0 12px rgba(249, 115, 22, 0.6)';
          inner.classList.add('pulse-marker-orange');
        } else if (punto.estado === 'aprobado') {
          badge.style.backgroundColor = '#10b981'; // Verde
          badge.innerHTML = '✓';
          badge.style.color = 'white';
          badge.style.fontWeight = 'bold';
          inner.style.border = '2.5px solid #10b981';
          inner.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.6)';
        } else {
          // Sin reclamar / Estado por defecto
          const isClaimed = !!punto.negocio_id;
          badge.style.backgroundColor = isClaimed ? '#10b981' : '#f59e0b'; // Verde / Amber
          badge.innerHTML = isClaimed ? '✓' : '❓';
          badge.style.color = 'white';
          badge.style.fontWeight = isClaimed ? 'bold' : 'normal';
          inner.style.border = `2.5px solid ${isClaimed ? '#10b981' : '#f59e0b'}`;
          inner.style.boxShadow = `0 0 12px ${isClaimed ? 'rgba(16, 185, 129, 0.6)' : 'rgba(245, 158, 11, 0.5)'}`;
        }

        inner.appendChild(badge);
        el.appendChild(inner);

        // Efectos interactivos al pasar el mouse
        el.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.2) translateY(-2px)';
          el.style.zIndex = '999';
        });
        el.addEventListener('mouseleave', () => {
          inner.style.transform = 'scale(1) translateY(0)';
          el.style.zIndex = 'auto';
        });

        // Estructura del Popup Premium
        const isClaimed = !!punto.negocio_id;
        const ratingText = punto.negocio_rating ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" style="display:inline-block;vertical-align:middle;color:#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${punto.negocio_rating}` : '';

        let statusText = '';
        let statusColor = '';

        if (punto.estado === 'en_verificacion') {
          statusText = lang === 'en' ? 'Pending Confirmation' : 'Pendiente de Confirmar';
          statusColor = '#f97316'; // Naranja
        } else if (punto.estado === 'aprobado') {
          statusText = lang === 'en' ? 'Confirmed' : 'Confirmado';
          statusColor = '#10b981'; // Verde
        } else {
          statusText = isClaimed ? t('map.claimed') : t('map.unclaimed');
          statusColor = isClaimed ? '#10b981' : '#f59e0b';
        }

        const btnId = `btn-nav-${punto.id}`;
        const btnInfoId = `btn-info-${punto.id}`;
        const pointImg = getPointImage(punto);

        const popupHTML = `
          <div style="color:#FFFFFF; width:100%; font-family:var(--font-outfit), system-ui, sans-serif; box-sizing:border-box; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; margin:0; padding:0;">
            <div id="popup-img-container-${punto.id}" style="width:100%; box-sizing:border-box;">
              ${pointImg ? `
                <div style="width:100%; height:110px; border-radius:12px; overflow:hidden; margin-bottom:10px; position:relative; background:#0a192f; border:1px solid rgba(255,255,255,0.15); box-sizing:border-box;">
                  <img src="${pointImg}" alt="${punto.nombre}" style="width:100%; height:100%; object-fit:cover; display:block;" loading="eager" />
                  <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0) 25%, rgba(10,25,47,0.75) 100%);"></div>
                </div>
              ` : `
                <div style="width:100%; height:110px; border-radius:12px; overflow:hidden; margin-bottom:10px; position:relative; background:linear-gradient(135deg, rgba(20,109,158,0.22) 0%, rgba(10,25,47,0.85) 100%); border:1.5px dashed rgba(255,215,0,0.35); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; box-sizing:border-box; padding:8px;">
                  <div style="width:34px; height:34px; border-radius:50%; background:rgba(255,215,0,0.12); border:1px solid rgba(255,215,0,0.3); display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(255,215,0,0.2);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <span style="font-size:10.5px; font-weight:850; color:#FFD700; letter-spacing:0.5px; text-transform:uppercase; background:rgba(255,215,0,0.15); padding:2px 10px; border-radius:8px; border:0.5px solid rgba(255,215,0,0.4);">
                    ${lang === 'en' ? 'Photos Coming Soon' : 'PRÓXIMAMENTE'}
                  </span>
                </div>
              `}
            </div>
            <!-- Status & Rating Header (Centered Pill) -->
            <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.18); padding-bottom:8px; width:100%; box-sizing:border-box;">
              <span style="font-size:10.5px; font-weight:800; text-transform:uppercase; color:${statusColor === '#10b981' ? '#34D399' : (statusColor === '#f59e0b' ? '#FBBF24' : statusColor)}; display:inline-flex; align-items:center; gap:6px; letter-spacing:0.3px; background:rgba(255,255,255,0.08); padding:3px 10px; border-radius:10px;">
                <span style="width:7px; height:7px; border-radius:50%; background-color:${statusColor === '#10b981' ? '#34D399' : (statusColor === '#f59e0b' ? '#FBBF24' : statusColor)}; display:inline-block; box-shadow:0 0 6px ${statusColor};"></span>
                ${statusText}
              </span>
              ${ratingText ? `<span style="font-size:11.5px; font-weight:800; color:#FFD700; background:rgba(255,215,0,0.18); padding:3px 8px; border-radius:10px; border:0.5px solid rgba(255,215,0,0.4);">${ratingText}</span>` : ''}
            </div>

            <!-- Title & Category Badge (Centered) -->
            <div style="margin-bottom:8px; text-align:center; width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
              <h3 style="margin:0 0 5px; font-size:16.5px; font-weight:850; color:#FFFFFF; line-height:1.25; letter-spacing:-0.2px; font-family:var(--font-outfit); text-align:center; width:100%;">
                ${punto.nombre}
              </h3>
              <span style="display:inline-block; font-size:10.5px; font-weight:750; color:#FFD700; text-transform:uppercase; letter-spacing:0.5px; background:rgba(255, 215, 0, 0.12); padding:3px 10px; border-radius:8px; border:1px solid rgba(255, 215, 0, 0.3); margin:0 auto; text-align:center;">
                ${t(`addPoint.categories.${punto.categoria}`) || punto.categoria || 'Turismo'}
              </span>
            </div>

            <!-- Description -->
            <p style="margin:0 0 10px; font-size:12.5px; color:#E2E8F0; line-height:1.45; text-align:center; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; width:100%;">
              ${punto.descripcion || ''}
            </p>
            
            ${punto.negocio_rango_precios ? `
              <div style="margin-bottom:10px; font-size:11px; font-weight:750; color:#2DD4BF; background:rgba(45,212,191,0.15); border:1px solid rgba(45,212,191,0.35); padding:4px 9px; border-radius:8px; display:inline-block; text-align:center; margin:0 auto;">
                🏷️ ${punto.negocio_rango_precios}
              </div>
            ` : ''}

            <!-- Added By Footer -->
            <div style="font-size:11px; color:rgba(255,255,255,0.7); margin-bottom:12px; border-top:1px dashed rgba(255,255,255,0.18); padding-top:8px; text-align:center; width:100%;">
              ${t('map.addedBy')}: <span style="font-weight:750; color:#FFD700;">${punto.nombre_creador || 'Equipo Atlan'}</span>
            </div>
            
            <!-- Centered Action Buttons Container -->
            <div style="display:flex; flex-direction:column; gap:8px; width:100%; box-sizing:border-box; align-items:center; justify-content:center;">
              <button id="${btnId}" style="width:100%; box-sizing:border-box; margin:0 auto; padding:11px 14px; background:#FFD700; color:#0A192F; border:none; border-radius:12px; font-weight:900; font-size:13px; cursor:pointer; box-shadow:0 4px 16px rgba(255,215,0,0.4); transition:all 0.2s ease; display:flex; align-items:center; justify-content:center;">
                <div style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; text-align:center; margin:0 auto;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A192F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; display:inline-block; vertical-align:middle;"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                  <span style="display:inline-block; text-align:center; line-height:1.2;">${t('map.startNavigation')}</span>
                </div>
              </button>

              <button id="${btnInfoId}" style="width:100%; box-sizing:border-box; margin:0 auto; padding:10px 14px; background:rgba(255,255,255,0.12); color:#FFFFFF; border:1px solid rgba(255,255,255,0.25); border-radius:12px; font-weight:800; font-size:12px; cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center;">
                <div style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; text-align:center; margin:0 auto;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span style="display:inline-block; text-align:center; line-height:1.2;">${lang === 'en' ? 'Details & Booking' : 'Detalles y Reservas'}</span>
                </div>
              </button>
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: [0, -14], anchor: 'bottom', closeButton: false }).setHTML(popupHTML);

        el.addEventListener('click', () => {
          lugarDestinoRef.current = punto.nombre;
          if (mapRef.current) {
            mapRef.current.easeTo({
              center: [punto.lng, punto.lat],
              offset: [0, 240],
              duration: 500,
              essential: true
            });
          }
        });

        popup.on('open', async () => {
          activePopupRef.current = popup;

          // Autocentrar la cámara desplazando el punto 240px abajo para ubicar la tarjeta exactamente en el centro de pantalla
          if (mapRef.current) {
            mapRef.current.easeTo({
              center: [punto.lng, punto.lat],
              offset: [0, 240],
              duration: 500,
              essential: true
            });
          }

          // Si el punto pertenece a un negocio y aún no tiene foto/logo en el punto, consultar la tabla negocios
          if (punto.negocio_id && !getPointImage(punto)) {
            try {
              const { data: bizData } = await supabase
                .from('negocios')
                .select('logo_url, fotos')
                .eq('id', punto.negocio_id)
                .maybeSingle();

              if (bizData) {
                const fetchedImg = (bizData.fotos && bizData.fotos.length > 0 && isRealCustomUrl(bizData.fotos[0]))
                  ? bizData.fotos[0]
                  : (isRealCustomUrl(bizData.logo_url) ? bizData.logo_url : null);

                if (fetchedImg) {
                  punto.logo_url = fetchedImg;
                  punto.imagen_url = fetchedImg;

                  const imgContainer = document.getElementById(`popup-img-container-${punto.id}`);
                  if (imgContainer) {
                    imgContainer.innerHTML = `
                      <div style="width:100%; height:110px; border-radius:12px; overflow:hidden; margin-bottom:10px; position:relative; background:#0a192f; border:1px solid rgba(255,255,255,0.15); box-sizing:border-box;">
                        <img src="${fetchedImg}" alt="${punto.nombre}" style="width:100%; height:100%; object-fit:cover; display:block;" loading="eager" />
                        <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0) 25%, rgba(10,25,47,0.75) 100%);"></div>
                      </div>
                    `;
                  }
                }
              }
            } catch (e) {
              console.warn('[Atlan] Error cargando foto/logo de negocio en popup:', e);
            }
          }

          const btn = document.getElementById(btnId);
          if (btn) {
            btn.onclick = () => {
              const [currLng, currLat] = currentPosRef.current;
              const isUserInCA = currLng >= -93.0 && currLng <= -77.0 && currLat >= 7.0 && currLat <= 19.0;

              if (!isUserInCA) {
                alert(lang === 'en'
                  ? 'You are currently outside Central America. Plan your trip and visit us to use live GPS navigation!'
                  : 'Te encuentras fuera de Centroamérica. ¡Planifica tu viaje y visítanos para usar la navegación GPS en vivo!');
                return; // Detener navegación intercontinental
              }

              lugarDestinoRef.current = punto.nombre;

              if ('speechSynthesis' in window) {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
              }
              lastSpokenRef.current = '';
              speakInstruction(`${t('map.welcome')} ${t('map.routeTo')} ${punto.nombre}.`, true);

              isNavigatingRef.current = true;
              isInteractionPausedRef.current = false;

              destinationRef.current = [punto.lng, punto.lat];
              rutaCoordenadasRef.current = [];

              if (directionsRef.current) {
                directionsRef.current.setOrigin([currLng, currLat]);
                directionsRef.current.setDestination([punto.lng, punto.lat]);
              }

              mapRef.current.flyTo({
                center: [currLng, currLat],
                zoom: 16.5,
                pitch: 60,
                speed: 0.9,
                curve: 1.1,
                essential: true
              });

              // Cerrar la notificación (popup) al iniciar la ruta
              popup.remove();
            };
          }

          const btnInfo = document.getElementById(btnInfoId);
          if (btnInfo) {
            btnInfo.onclick = () => {
              setSelectedPoint(punto);
              popup.remove();
            };
          }
        });

        if (!mapRef.current) return;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([punto.lng, punto.lat])
          .setPopup(popup);

        if (mapRef.current) {
          marker.addTo(mapRef.current);
          markersRef.current.push(marker);
        }
      });
    } catch (err) {
      console.error('[Atlan] Error inesperado en cargarPuntosCercanos:', err);
    }
  };

  const actualizarPrevisualizacionRuta = async (oLng, oLat, dLng, dLat) => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates;

        if (mapRef.current && mapRef.current.isStyleLoaded()) {
          const source = mapRef.current.getSource('preview-route');
          if (source) {
            source.setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coords
              }
            });
          }
        }

        // Encuadrar la trayectoria en la pantalla para ver inicio (A) y fin (B) automáticamente
        if (mapRef.current && coords.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          coords.forEach(coord => bounds.extend(coord));
          mapRef.current.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            duration: 1200,
            essential: true
          });
        }

        setPreviewRouteInfo({
          distance: route.distance,
          duration: route.duration
        });
      }
    } catch (err) {
      console.error("Error updating preview route:", err);
    }
  };

  // Actualización de posición (GPS real + Demo)
  const calcularDistanciaMinimaALaRuta = (posUsuario, coordenadasRuta) => {
    if (!coordenadasRuta || coordenadasRuta.length === 0) return 99999;
    let minDist = 99999;
    for (let i = 0; i < coordenadasRuta.length; i++) {
      const dist = calcDistanceMeters(posUsuario, coordenadasRuta[i]);
      if (dist < minDist) {
        minDist = dist;
      }
    }
    return minDist;
  };

  const handlePositionUpdate = (longitude, latitude, bearing = null) => {
    currentPosRef.current = [longitude, latitude];

    if (mapRef.current) {
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'nav-arrow-pulsing';
        el.innerHTML = `
          <svg width="46" height="46" viewBox="0 0 24 24" fill="#007cbf" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 6px rgba(0,124,191,0.6));">
            <path d="M12 2L4 20L12 17L20 20L12 2Z" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
          </svg>
        `;
        userMarkerRef.current = new mapboxgl.Marker({ element: el, rotationAlignment: 'viewport' })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLngLat([longitude, latitude]);
      }
    }

    if (directionsRef.current) {
      directionsRef.current.setOrigin([longitude, latitude]);
    }

    if (isNavigatingRef.current && !isInteractionPausedRef.current && mapRef.current) {
      const opts = {
        center: [longitude, latitude],
        zoom: 16.5,
        pitch: 60,
        duration: 1800,
        essential: true,
        padding: { top: 180 },
      };
      if (bearing !== null) opts.bearing = bearing;
      mapRef.current.easeTo(opts);
    }

    // Rediseñar la trayectoria futura en tiempo real si el usuario cambia de ubicación
    if (selectedPointRef.current && !isNavigatingRef.current) {
      actualizarPrevisualizacionRuta(longitude, latitude, selectedPointRef.current.lng, selectedPointRef.current.lat);
    }

    // Si estamos en viaje (navegación real) y no en demo, verificar si el usuario se desvió para recalcular ruta
    if (isNavigatingRef.current && !isDemoRunningRef.current && rutaCoordenadasRef.current.length > 0) {
      const distALaRuta = calcularDistanciaMinimaALaRuta([longitude, latitude], rutaCoordenadasRef.current);
      const ahora = Date.now();

      if (distALaRuta > 65 && (ahora - lastRecalculateTimeRef.current) > 12000) {
        lastRecalculateTimeRef.current = ahora;
        speakInstruction(lang === 'en' ? 'Recalculating route' : 'Recalculando ruta', true);
        
        if (directionsRef.current && destinationRef.current) {
          directionsRef.current.setOrigin([longitude, latitude]);
          directionsRef.current.setDestination(destinationRef.current);
        }
      }
    }
  };

  const calcBearing = ([lng1, lat1], [lng2, lat2]) => {
    const toRad = Math.PI / 180;
    const toDeg = 180 / Math.PI;
    const dLng = (lng2 - lng1) * toRad;
    const y = Math.sin(dLng) * Math.cos(lat2 * toRad);
    const x = Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad)
      - Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos(dLng);
    return (Math.atan2(y, x) * toDeg + 360) % 360;
  };

  const calcDistanceMeters = ([lng1, lat1], [lng2, lat2]) => {
    const R = 6371000;
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLng = (lng2 - lng1) * toRad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const limpiarInstruccion = (texto) => {
    if (!texto) return "";
    let t = texto;
    t = t.replace(/\b(\d+)\s*k\b/gi, "$1 km");
    t = t.replace(/\b(\d+)\s*km\b/gi, "$1 km");
    t = t.replace(/en dirección al? (oeste|este|norte|sur)/gi, "");
    t = t.replace(/hacia el (oeste|este|norte|sur)/gi, "");
    t = t.replace(/vuelta al oeste/gi, "da vuelta a la derecha");
    t = t.replace(/vuelta al este/gi, "da vuelta a la izquierda");
    t = t.replace(/vuelta al norte/gi, "siga recto");
    t = t.replace(/vuelta al sur/gi, "siga recto");
    t = t.replace(/\s+/g, " ").trim();
    return t;
  };

  const getManeuverIcon = (type, modifier) => {
    const mod = (modifier || '').toLowerCase();
    const typ = (type || '').toLowerCase();

    if (typ.includes('arrive') || typ.includes('destination')) return '🏁';
    if (typ.includes('roundabout') || typ.includes('rotary')) return '🔄';
    if (mod.includes('sharp right')) return '↳';
    if (mod.includes('sharp left')) return '↲';
    if (mod.includes('slight right') || mod.includes('right')) return '↱';
    if (mod.includes('slight left') || mod.includes('left')) return '↰';
    if (mod.includes('uturn')) return '↩';
    return '⬆';
  };

  const buildManeuverList = (steps) => {
    const list = [];
    steps.forEach((step) => {
      if (!step.maneuver?.instruction) return;
      const [mLng, mLat] = step.maneuver.location;
      const mType = step.maneuver.type || '';
      const mModifier = step.maneuver.modifier || '';
      list.push({
        lng: mLng,
        lat: mLat,
        instruction: limpiarInstruccion(step.maneuver.instruction),
        type: mType,
        modifier: mModifier,
        icon: getManeuverIcon(mType, mModifier),
        segmentDist: step.distance || 0,
        announcedFar: false,
        announcedMid: false,
        announcedClose: false,
        announcedArrive: false,
      });
    });
    return list;
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      const km = (meters / 1000).toFixed(1);
      return km.endsWith('.0') ? `${parseInt(km)} ${lang === 'en' ? 'kilometers' : 'kilómetros'}` : `${km} ${lang === 'en' ? 'kilometers' : 'kilómetros'}`;
    }
    const rounded = Math.round(meters / 50) * 50;
    return `${Math.max(50, rounded)} ${lang === 'en' ? 'meters' : 'metros'}`;
  };

  const checkDistanceAnnouncements = (currentLng, currentLat) => {
    const maneuvers = maneuversRef.current;
    if (!maneuvers.length) return;

    const next = maneuvers[0];
    if (!next) return;

    const dist = calcDistanceMeters([currentLng, currentLat], [next.lng, next.lat]);
    const now = Date.now();
    const silenceSec = (now - lastAnnouncementTimeRef.current) / 1000;

    // Actualizar maniobra y distancia actual para el indicador de giro estilo Waze
    setCurrentManeuver({
      instruction: next.instruction,
      distance: dist,
      distanceFormatted: formatDistanceDisplay(dist),
      icon: next.icon || getManeuverIcon(next.type, next.modifier)
    });

    if (dist < 50 && !next.announcedArrive) {
      next.announcedArrive = true;
      speakInstruction(next.instruction, true);
      lastAnnouncementTimeRef.current = now;
      maneuvers.shift();
      return;
    }

    if (dist < 300 && !next.announcedClose) {
      next.announcedClose = true;
      const msg = lang === 'en' ? `In ${formatDistance(dist)}, ${next.instruction}` : `En ${formatDistance(dist)}, ${next.instruction.toLowerCase()}`;
      speakInstruction(msg, true);
      lastAnnouncementTimeRef.current = now;
      return;
    }

    if (dist < 600 && !next.announcedMid) {
      next.announcedMid = true;
      const msg = lang === 'en' ? `In ${formatDistance(dist)}, ${next.instruction}` : `En ${formatDistance(dist)}, ${next.instruction.toLowerCase()}`;
      speakInstruction(msg, true);
      lastAnnouncementTimeRef.current = now;
      return;
    }

    if (dist < 2000 && !next.announcedFar) {
      next.announcedFar = true;
      const msg = lang === 'en' ? `In ${formatDistance(dist)}, ${next.instruction}` : `En ${formatDistance(dist)}, ${next.instruction.toLowerCase()}`;
      speakInstruction(msg);
      lastAnnouncementTimeRef.current = now;
      return;
    }

    if (silenceSec >= 12 && dist > 300 && dist < 5000) {
      const msg = lang === 'en' ? `Continue straight. In ${formatDistance(dist)}, ${next.instruction}` : `Continúe recto. En ${formatDistance(dist)}, ${next.instruction.toLowerCase()}`;
      speakInstruction(msg);
      lastAnnouncementTimeRef.current = now;
    }
  };

  const fetchRouteCoords = async (origin, destination) => {
    const [oLng, oLat] = origin;
    const [dLng, dLat] = destination;
    const directionsLang = lang === 'en' ? 'en' : 'es';
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full&steps=true&language=${directionsLang}&access_token=${mapboxgl.accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.length > 0) {
      const route = data.routes[0];
      const coords = route.geometry.coordinates;
      const steps = route.legs[0]?.steps || [];
      rutaCoordenadasRef.current = coords;
      maneuversRef.current = buildManeuverList(steps);

      setRouteInfo({
        distance: route.distance,
        duration: route.duration,
        eta: calculateETA(route.duration),
        destinationName: lugarDestinoRef.current || (lang === 'en' ? 'Destination' : 'Destino')
      });

      return coords;
    }
    return [];
  };

  // Lógica del simulador demo
  const iniciarSimulacionDemo = async () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
      isDemoRunningRef.current = false;
      setIsDemoRunning(false);
      isNavigatingRef.current = false;
      setShowRecenterBtn(false);
      setRouteInfo(null);
      const panel = document.querySelector('.mapboxgl-ctrl-directions');
      if (panel) panel.style.display = '';
      speakInstruction(t('map.demoFinished'), true);
      return;
    }

    if (!destinationRef.current) {
      speakInstruction(t('map.selectDestination'), true);
      return;
    }

    let coords = rutaCoordenadasRef.current;

    if (!coords || coords.length === 0) {
      coords = await fetchRouteCoords(currentPosRef.current, destinationRef.current);
      rutaCoordenadasRef.current = coords;
    }

    if (!coords || coords.length === 0) {
      speakInstruction(t('map.noRoute'), true);
      return;
    }

    setIsDemoRunning(true);
    isDemoRunningRef.current = true;
    isNavigatingRef.current = true;
    isInteractionPausedRef.current = false;

    const panel = document.querySelector('.mapboxgl-ctrl-directions');
    if (panel) panel.style.display = 'none';

    const destino = lugarDestinoRef.current || 'su destino';
    speakInstruction(`${t('map.welcome')} ${t('map.routeTo')} ${destino}.`, true);
    lastAnnouncementTimeRef.current = Date.now();

    let index = 0;
    setTimeout(() => {
      if (!isDemoRunningRef.current) return;

      demoIntervalRef.current = setInterval(() => {
        const pts = rutaCoordenadasRef.current;

        if ('speechSynthesis' in window && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        if (index >= pts.length - 1) {
          clearInterval(demoIntervalRef.current);
          demoIntervalRef.current = null;
          isDemoRunningRef.current = false;
          setIsDemoRunning(false);
          isNavigatingRef.current = false;
          setShowRecenterBtn(false);
          setRouteInfo(null);
          if (panel) panel.style.display = '';
          speakInstruction(t('map.arrived'), true);

          // Disparar modal de confirmación de visita (tanto en Demo como en GPS real)
          const destinoNombre = lugarDestinoRef.current || selectedPointRef.current?.nombre || 'su destino';
          const puntoId = selectedPointRef.current?.id || null;

          setVisitPromptData({
            puntoId: puntoId,
            puntoNombre: destinoNombre,
            distanciaKm: 2.4
          });
          setShowVisitPrompt(true);
          return;
        }

        let target = index + 1;
        while (target < pts.length - 1) {
          const gap = calcDistanceMeters(pts[index], pts[target]);
          if (gap >= 50) break;
          target++;
        }

        const current = pts[index];
        const next = pts[target];
        const bearing = calcBearing(current, next);

        handlePositionUpdate(next[0], next[1], bearing);
        checkDistanceAnnouncements(next[0], next[1]);

        // Calcular distancia y tiempo restante
        const remainingDist = calcRemainingRouteDistance(pts, target);
        const totalDist = routeInfo?.distance || remainingDist || 1;
        const totalDuration = routeInfo?.duration || (totalDist / 11) || 1;
        const speed = totalDist / totalDuration;
        const remainingDuration = speed > 0 ? remainingDist / speed : 0;

        setRouteInfo({
          distance: remainingDist,
          duration: remainingDuration,
          eta: calculateETA(remainingDuration),
          destinationName: lugarDestinoRef.current || (lang === 'en' ? 'Destination' : 'Destino')
        });

        index = target;
      }, 2000);
    }, 4000);
  };

  // Activar modo agregar punto
  const activarLevantarPunto = () => {
    if (!userSession) {
      alert(lang === 'en' ? 'Please log in to add points to the map.' : 'Por favor, inicia sesión para levantar un punto en el mapa.');
      window.location.href = '/login';
      return;
    }
    if (isAddingPoint) {
      setIsAddingPoint(false);
      isAddingPointRef.current = false;
      if (mapRef.current) mapRef.current.getCanvas().style.cursor = '';
    } else {
      setIsAddingPoint(true);
      isAddingPointRef.current = true;
      if (mapRef.current) mapRef.current.getCanvas().style.cursor = 'crosshair';
      speakInstruction(t('addPoint.tapMap'), true);
    }
  };

  // Guardar nuevo punto en Supabase
  const handleGuardarPunto = async (e) => {
    e.preventDefault();
    if (!newPointNombre || !newPointCategoria || !tempPointCoords) return;

    setIsSubmittingPoint(true);

    try {
      const [lng, lat] = tempPointCoords;
      const deptDetectado = await obtenerDepartamentoPorCoordenadas(lng, lat);
      const { error } = await supabase.from('puntos').insert([{
        nombre: newPointNombre,
        descripcion: newPointDesc,
        nombre_creador: userSession?.user?.user_metadata?.nombre_completo || newPointCreador || 'Turista Registrado',
        categoria: newPointCategoria,
        ubicacion: `POINT(${lng} ${lat})`,
        departamento: deptDetectado,
        estado: 'sin_reclamar' // por defecto los del usuario están sin reclamar
      }]);

      if (error) {
        console.error('[Atlan] Error insertando punto:', error);
        alert(lang === 'en' ? 'Could not save the place. Try again.' : 'No se pudo guardar el lugar. Reintente.');
      } else {
        setShowAddModal(false);
        setNewPointNombre('');
        setNewPointCreador('');
        setNewPointDesc('');
        setNewPointCategoria('otro');
        setTempPointCoords(null);

        speakInstruction(t('addPoint.success'), true);
        alert(t('addPoint.success'));

        // Recargar puntos locales
        cargarPuntosCercanos(currentPosRef.current[0], currentPosRef.current[1], filtroCategoria);
      }
    } catch (err) {
      console.error('[Atlan] Error inesperado guardando punto:', err);
    } finally {
      setIsSubmittingPoint(false);
    }
  };

  // Inicializar Mapbox
  // Límites estrictos de Centroamérica (desde Guatemala hasta Panamá)
  const CENTRAL_AMERICA_BOUNDS = [[-93.0, 7.0], [-77.0, 19.0]];

  useEffect(() => {
    if (mapRef.current) return;

    // Precalentar los recursos compartidos de Mapbox (Web Workers) para acelerar inicialización y renderizado
    if (typeof window !== 'undefined' && mapboxgl.prewarm) {
      mapboxgl.prewarm();
    }

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12?optimize=true',
      center: [-85.0, 13.0], // Centro de Centroamérica
      zoom: 5.5,
      pitch: 0,
      projection: 'mercator',
      maxBounds: CENTRAL_AMERICA_BOUNDS, // Restringir memoria al área estrictamente necesaria
    });

    mapRef.current.on('dragstart', () => {
      if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      }
    });

    mapRef.current.on('load', () => {

      // Ocultar etiquetas, carreteras y divisiones departamentales de países vecinos (Costa Rica, Honduras, El Salvador, etc.)
      // mostrando únicamente elementos pertenecientes a Nicaragua ('NI')
      try {
        const styleLayers = mapRef.current.getStyle().layers || [];
        const nicaraguaFilter = ['any',
          ['==', ['get', 'iso_3166_1'], 'NI'],
          ['==', ['get', 'iso_3166_1'], 'NIC']
        ];

        styleLayers.forEach((layer) => {
          // 1. Filtrar etiquetas de texto (ciudades, países, nombres de lugares)
          if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
            const existingFilter = mapRef.current.getFilter(layer.id);
            if (existingFilter) {
              mapRef.current.setFilter(layer.id, ['all', existingFilter, nicaraguaFilter]);
            } else {
              mapRef.current.setFilter(layer.id, nicaraguaFilter);
            }
          }
          // 2. Filtrar divisiones administrativas de departamentos/estados (admin-1, admin-2, etc.)
          if (layer.id.includes('admin-1') || layer.id.includes('admin-2') || layer.id.includes('admin-3') || layer.id.includes('boundary')) {
            const existingFilter = mapRef.current.getFilter(layer.id);
            if (existingFilter) {
              mapRef.current.setFilter(layer.id, ['all', existingFilter, nicaraguaFilter]);
            } else {
              mapRef.current.setFilter(layer.id, nicaraguaFilter);
            }
          }
          // 3. Filtrar carreteras, puentes y túneles (road, bridge, tunnel)
          if (layer.id.startsWith('road') || layer.id.startsWith('bridge') || layer.id.startsWith('tunnel') || (layer['source-layer'] && layer['source-layer'] === 'road')) {
            const existingFilter = mapRef.current.getFilter(layer.id);
            if (existingFilter) {
              mapRef.current.setFilter(layer.id, ['all', existingFilter, nicaraguaFilter]);
            } else {
              mapRef.current.setFilter(layer.id, nicaraguaFilter);
            }
          }
        });
      } catch (err) {
        console.warn('[Atlan] Error al filtrar elementos por país:', err);
      }

      // Cargar la capa del borde externo (croquis) de Nicaragua
      if (mapRef.current) {
        try {
          mapRef.current.addSource('nicaragua-boundary', {
            type: 'geojson',
            data: '/nicaragua-boundary.json'
          });

          // Resplandor neón en azul Atlan (#146D9E) dinámico según nivel de zoom
          mapRef.current.addLayer({
            id: 'nicaragua-border-glow',
            type: 'line',
            source: 'nicaragua-boundary',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#146D9E',
              'line-width': [
                'interpolate',
                ['exponential', 1.2],
                ['zoom'],
                5, 2.5,
                8, 5.0,
                12, 10.0,
                16, 16.0
              ],
              'line-blur': [
                'interpolate',
                ['linear'],
                ['zoom'],
                5, 2.0,
                8, 4.0,
                12, 6.0
              ],
              'line-opacity': 0.65
            }
          });

          // Línea principal del croquis externo de Nicaragua (#146D9E) dinámica según nivel de zoom
          mapRef.current.addLayer({
            id: 'nicaragua-border-main',
            type: 'line',
            source: 'nicaragua-boundary',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#146D9E',
              'line-width': [
                'interpolate',
                ['exponential', 1.2],
                ['zoom'],
                5, 1.0,
                8, 2.0,
                12, 3.5,
                16, 5.0
              ],
              'line-opacity': 0.95
            }
          });
        } catch (borderErr) {
          console.warn('[Atlan] Error cargando borde externo de Nicaragua:', borderErr);
        }
      }

      // Estilización premium de carreteras
      const roadStyles = [
        ['road-motorway', '#F5A623', 7],
        ['road-motorway-link', '#F5A623', 5],
        ['road-trunk', '#F9C950', 6],
        ['road-trunk-link', '#F9C950', 4.5],
        ['road-primary', '#FFFFFF', 5],
        ['road-primary-link', '#FFFFFF', 3.5],
        ['road-secondary', '#FFFFFF', 4],
        ['road-secondary-link', '#FFFFFF', 3],
        ['road-street', '#F5F7FA', 3],
        ['road-street-low', '#F5F7FA', 2],
      ];
      roadStyles.forEach(([id, color, width]) => {
        if (mapRef.current.getLayer(id)) {
          mapRef.current.setPaintProperty(id, 'line-color', color);
          mapRef.current.setPaintProperty(id, 'line-width', width);
        }
      });

      const casingStyles = [
        ['road-motorway-casing', '#A0620A', 10],
        ['road-trunk-casing', '#A07C0A', 8.5],
        ['road-primary-casing', '#8A94A8', 7],
        ['road-secondary-casing', '#9AA4B8', 6],
      ];
      casingStyles.forEach(([id, color, width]) => {
        if (mapRef.current.getLayer(id)) {
          mapRef.current.setPaintProperty(id, 'line-color', color);
          mapRef.current.setPaintProperty(id, 'line-width', width);
        }
      });

      // Fuente y Capa de Previsualización de Trayectoria (Trayectoria Futura)
      if (mapRef.current) {
        mapRef.current.addSource('preview-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });

        mapRef.current.addLayer({
          id: 'preview-route-layer',
          type: 'line',
          source: 'preview-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#146D9E', // Color azul océano de Atlan para la ruta
            'line-width': 6,
            'line-opacity': 0.85
          }
        });
      }
    });

    // Click en el mapa (agregar punto)
    mapRef.current.on('click', (e) => {
      if (isAddingPointRef.current) {
        const { lng, lat } = e.lngLat;
        setTempPointCoords([lng, lat]);
        setShowAddModal(true);
        setIsAddingPoint(false);
        isAddingPointRef.current = false;
        mapRef.current.getCanvas().style.cursor = '';
      }
    });

    const clearCinematicTimeouts = () => {
      if (cinematicTimeoutsRef.current.length > 0) {
        console.log('[Atlan] Cancelando animación cinematográfica inicial por interacción del usuario');
        cinematicTimeoutsRef.current.forEach(t => clearTimeout(t));
        cinematicTimeoutsRef.current = [];
      }
    };

    const pauseCamera = () => {
      // Cancelar animaciones cinematográficas si el usuario interactúa con el mapa
      clearCinematicTimeouts();

      if (!isNavigatingRef.current) return;

      // Si ya está pausada la interacción, no hacemos nada más
      if (isInteractionPausedRef.current) return;

      isInteractionPausedRef.current = true;
      setShowRecenterBtn(true); // Mostrar el botón "Volver a centrar"

      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
    const handleMoveStart = (e) => {
      if (e.originalEvent) {
        pauseCamera();
      }
    };
    mapRef.current.on('movestart', handleMoveStart);
    mapRef.current.on('dragstart', pauseCamera);
    mapRef.current.on('touchstart', pauseCamera);
    mapRef.current.on('wheel', pauseCamera);

    // Controles nativos
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
      showUserLocation: false,
    });
    mapRef.current.addControl(geolocate, 'top-right');
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Directions
    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/driving-traffic',
      interactive: false, // Restringir navegación estrictamente entre puntos registrados (Punto A -> Punto B)
      language: lang === 'en' ? 'en' : 'es',
      controls: { inputs: true, instructions: true, profileSwitcher: true },
    });
    mapRef.current.addControl(directions, 'top-left');
    directionsRef.current = directions;

    directions.on('route', (e) => {
      if (isDemoRunningRef.current) return;

      if (e.route && e.route.length > 0 && e.route[0].geometry?.coordinates) {
        const route = e.route[0];
        const coords = route.geometry.coordinates;
        const steps = route.legs[0]?.steps || [];

        rutaCoordenadasRef.current = coords;
        maneuversRef.current = buildManeuverList(steps);

        setRouteInfo({
          distance: route.distance,
          duration: route.duration,
          eta: calculateETA(route.duration),
          destinationName: lugarDestinoRef.current || (lang === 'en' ? 'Destination' : 'Destino')
        });

        // Ocultar la ventana gigante de búsqueda/pasos al trazar la ruta automáticamente
        setShowDirectionsPopup(false);
        const directionsPanel = document.querySelector('.mapboxgl-ctrl-directions');
        if (directionsPanel) {
          directionsPanel.classList.remove('directions-popup-active');
          directionsPanel.style.setProperty('display', 'none', 'important');
        }

        if (steps.length > 0) {
          const firstStep = steps[0];
          const type = firstStep.maneuver?.type || '';
          const modifier = firstStep.maneuver?.modifier || '';
          const instr = limpiarInstruccion(firstStep.maneuver?.instruction || '');
          const dist = firstStep.distance || route.distance;

          setCurrentManeuver({
            type,
            modifier,
            instruction: instr,
            distance: dist,
            distanceFormatted: formatDistanceDisplay(dist),
            icon: getManeuverIcon(type, modifier)
          });

          if (instr && instr !== lastSpokenRef.current) {
            lastSpokenRef.current = instr;
            setTimeout(() => speakInstruction(instr), 600);
          }
        }
      }
    });

    directions.on('clear', () => {
      rutaCoordenadasRef.current = [];
      setRouteInfo(null);
      setCurrentManeuver(null);
    });

    // Geolocalización y animaciones de inicio
    let isFirstPosition = true;
    let watchId = null;

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (isDemoRunningRef.current) return;

          const { longitude, latitude } = pos.coords;
          handlePositionUpdate(longitude, latitude);

          if (isFirstPosition && mapRef.current) {
            isFirstPosition = false;

            // Cargar marcadores iniciales en base a la ubicación detectada
            cargarPuntosCercanos(longitude, latitude, filtroCategoria);

            // Detectar si el usuario está dentro de Centroamérica
            const isInCentralAmerica = longitude >= -93.0 && longitude <= -77.0 && latitude >= 7.0 && latitude <= 19.0;

            // Esperar 2.5 segundos para que los tiles iniciales carguen por completo en segundo plano
            setTimeout(() => {
              setIsMapLoading(false);

              if (!mapRef.current) return;

              // Si viene de un punto específico por URL, no hacemos la animación inicial de geolocalización
              const params = new URLSearchParams(window.location.search);
              if (params.get('id')) {
                return;
              }

              if (!isInCentralAmerica) {
                // Usuario fuera de Centroamérica: levantar los límites del mapa para que pueda ver su ubicación
                console.log('[Atlan] Usuario fuera de Centroamérica, levantando límites del mapa');
                mapRef.current.setMaxBounds(null);
                mapRef.current.flyTo({
                  center: [longitude, latitude],
                  zoom: 14,
                  pitch: 45,
                  speed: 0.25,
                  curve: 1.8,
                  essential: true,
                });
                cinematicTimeoutsRef.current = [];
              } else {
                // Vuelo parabólico plano (top-down) para evitar cargar el horizonte 3D en movimiento y evitar distorsión
                mapRef.current.flyTo({
                  center: [longitude, latitude],
                  zoom: 14.8, // Zoom ligeramente más bajo para evitar forzar texturas extremas
                  pitch: 0, // Volar en plano consume muchísima menos memoria y evita que se deforme la malla
                  bearing: 0,
                  speed: 0.25, // Velocidad súper lenta
                  curve: 1.8,  // Curva alta (sube mucho hacia el espacio antes de caer)
                  essential: true,
                });

                // Una vez que aterrice suavemente, inclinamos la cámara para revelar el 3D
                mapRef.current.once('moveend', () => {
                  if (mapRef.current) {
                    mapRef.current.easeTo({
                      pitch: 60, // Inclinación final épica para ver los edificios y el horizonte
                      duration: 2500, // 2.5 segundos inclinando la cámara lentamente
                      essential: true
                    });
                  }
                });

                cinematicTimeoutsRef.current = [];
              }
            }, 5000); // 5 segundos de retraso para carga de texturas y estilos
          }
        },
        (err) => {
          console.error('[Atlan] GPS error:', err);
          setIsMapLoading(false);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      setIsMapLoading(false);
    }

    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
      cinematicTimeoutsRef.current.forEach(t => clearTimeout(t));
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Centrar y cargar punto desde URL query
  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current) {
      const params = new URLSearchParams(window.location.search);
      const puntoId = params.get('id');
      if (puntoId) {
        const cargarPuntoDesdeURL = async () => {
          try {
            const { data: punto, error } = await supabase
              .from('puntos')
              .select('*')
              .eq('id', puntoId)
              .single();
            if (!error && punto) {
              const match = punto.ubicacion.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
              if (match) {
                const lng = parseFloat(match[1]);
                const lat = parseFloat(match[2]);

                // Centrar mapa de inmediato
                mapRef.current.flyTo({
                  center: [lng, lat],
                  zoom: 16.5,
                  pitch: 45,
                  speed: 0.85,
                  essential: true
                });

                cargarPuntosCercanos(lng, lat, filtroCategoria);

                const puntoEstructura = {
                  id: punto.id,
                  nombre: punto.nombre,
                  descripcion: punto.descripcion,
                  categoria: punto.categoria,
                  lng,
                  lat,
                  negocio_id: punto.negocio_id,
                  nombre_creador: punto.nombre_creador,
                  estado: punto.estado
                };
                setSelectedPoint(puntoEstructura);
              }
            }
          } catch (err) {
            console.error("Error loading point from URL query:", err);
          }
        };

        if (mapRef.current.loaded()) {
          cargarPuntoDesdeURL();
        } else {
          mapRef.current.once('load', cargarPuntoDesdeURL);
        }
      }
    }
  }, [mapRef.current]);

  // Recargar marcadores al cambiar categoría
  const aplicarFiltro = (cat) => {
    setFiltroCategoria(cat);
    cargarPuntosCercanos(currentPosRef.current[0], currentPosRef.current[1], cat);
  };

  const handleRecenter = () => {
    isInteractionPausedRef.current = false;
    setShowRecenterBtn(false);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: currentPosRef.current,
        zoom: 16.5,
        pitch: 60,
        speed: 0.9,
        curve: 1.15,
        essential: true,
      });
      cargarPuntosCercanos(currentPosRef.current[0], currentPosRef.current[1], filtroCategoria);
    }
  };

  return (
    <div className="map-page-wrapper" style={{ position: 'relative' }}>
      {/* Indicador Offline */}
      {!isOnline && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(7, 11, 20, 0.9)',
          border: '1px solid #D4AF37',
          borderRadius: '24px',
          padding: '8px 16px',
          color: '#cbd5e1',
          fontSize: '12px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(212,175,55,0.2)',
          zIndex: 9999,
          fontFamily: "'LC Mogi', var(--font-outfit), sans-serif",
          backdropFilter: 'blur(8px)',
          animation: 'pulse 2s infinite ease-in-out'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D4AF37', display: 'inline-block' }}></span>
          {lang === 'en' ? 'Offline Mode (Local Cache Active)' : 'Modo Offline (Datos Locales Activos)'}
        </div>
      )}
      {/* Pantalla de Carga Premium */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0f1c',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          opacity: isMapLoading ? 1 : 0,
          visibility: isMapLoading ? 'visible' : 'hidden',
          transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.8s',
        }}
      >
        {/* Logo/Emblema Atlan */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="loaderTitle" style={{
            fontSize: 'clamp(48px, 8vw, 64px)',
            fontWeight: '900',
            color: 'var(--atlan-gold)',
            letterSpacing: '0.05em',
            textShadow: '0 4px 20px rgba(0,0,0,0.6)',
            marginBottom: '8px',
            fontFamily: "'LC Mogi', var(--font-outfit), system-ui, sans-serif",
            lineHeight: 1,
            animation: 'pulse 2s infinite ease-in-out'
          }}>
            atlan
          </div>
          <div className="loaderSubtitle" style={{
            fontSize: 'clamp(14px, 2.5vw, 18px)',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: '600',
            fontFamily: "'Delight', var(--font-inter), sans-serif",
            marginTop: '8px',
            WebkitTextStroke: '0.5px rgba(0,0,0,0.5)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)'
          }}>
            Nicaragua Turismo
          </div>
        </div>

        {/* Mapa de Nicaragua (croquisnicaragua.svg con 17 departamentos) animado que se llena al 100% */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '16px 0' }}>
          <svg width="170" height="150" viewBox="0 0 1000 893" style={{ filter: 'drop-shadow(0px 0px 10px rgba(212, 175, 55, 0.35))' }}>
            <defs>
              <clipPath id="nicaragua-loading-clip">
                <rect x="0" y="0" width={loadingProgress * 10} height="893" />
              </clipPath>
            </defs>

            {/* Silueta de fondo (17 Departamentos de croquisnicaragua.svg) */}
            <g id="features-loading-bg" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(212, 175, 55, 0.25)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M558.8 808.8l-10.4-6-15.7-5.4-24.6-9.1-9-3.8-16.4-6.1-7.5-6.8 43.9-90.6 3.3-5.7 0.5-0.6 0.8-0.7 2.8-1.4 3.7-2.6 1.6-0.9 1.2-0.5 0.9 0.3 0.4 0.2 0.9-0.1 3.4-1.3 1.1-0.7 0.6-0.4 0.6-1.1 0.9-1.1 1.3-1.4 0.2-0.3 0.2-0.4 0.3-0.4 0.7-0.9 0.4-0.5 0.2-0.8 0-0.2 0.5-1.2 2.7-4.3 7.9-1.7 4.6-3 12.1-11.2 0.6-0.9 0.8-0.3 1-0.1 13.5 0.1 3.7-0.6 0.8 0 1.6 0.4 0.7 0.1 2.8-0.3 0.6 0.1 0.7 0.1 0.9 0.4 2 0.4 7.1 0.3 3.7 12.9 2.7 5 1.5 1.3 1.2 1.2 0.4 1.2-0.2 2.3 0.3 4.8 1.9 4.8 1.9 5.8-0.1 1.6-0.3 2-1.8 4.3-2.6 9-0.6 3.6 0 2.5 1.3 7.2 0.7 7.2 12.2 4.5 5.3 3.3 14.6 9.1 2.8 2.9 1.1 2.5 0.2 2.3 0.3 2.4 1.4 2.9 1.7 1.7 1.7 1.2 8.6 4.5 7.2 5.2 5.2 5.2 1.6 2.1 3.7 6.2 1 1.1 0.7 0.5 0.6 0 0.6 0.1 0.7 0.3 1.2 0.7 0.5 0.2 1 0.3 1.4 0.5 0.5 0.1 0.5 0 1.8-0.2 1.2 0 0.5 0 1.2 0.3 3 1.2 2.3 0.8 5.8-0.8 1.2 0.1 0.6 0.4-0.2 1 0 0.6 0.1 0.4 0.2 0.4 2 2.1 1.8 1.5 1 0.5 0.7 0.1 1.6-0.8 1.2-0.3 0.4-0.1 0.8-0.5 0.4-0.3 0.9-0.5 0.7-0.2 1.3-0.3 1.1 0.2 1.8 0.7 0.8 0.1 0.7 0 0.4-0.3 0.5-0.1 0.4-0.2 0.4-0.3 1.5-0.6 1.7-0.2 0.9-0.2 2.6-1.3 0.5 0.2 0.3 0.3 0.1 0.6-0.3 3.4 0 0.6 0.2 1 0.2 0.5 0.6 0.8 0.6 0.6 0.3 0.4 0.2 0.4 0 0.6 0.1 1.2 0.1 0.7 0.3 0.8 0.8 0.9 0.6 0.4 0.6 0 0.4-0.2 0.4-0.2 0.4-0.3 1.3 0 2.1 0.2 7.2 1.4 1.4 0.4 0.4 0.3 0.6 0.6 3.4 4.4 2.6 4.4 4.8 5.1 3.1 2.5 1.5 4 3.2-0.6-0.7-2 1.4 0.4 1.5 3.2 0.4 0.2 0.3 1.1-0.5 2.5 1.8 1 0.1 4.1 1.7 6.6-0.5 5.1-6.5 3.3-12 2.9-1 0.2-12.1 4.6-3.8 4.5-0.7 0.4-5-1-1.2 0.4-2.6 1.8-1.7 0.3-1.8-0.2-1.2-0.6-11-8.8-0.9-3.2-2-1.4-2.5 0.5-2.1 2.1-3.2-0.7-4.5 2.9-2.2-2.2-1.3 0-2.1 1.6-2.1-0.8-3.4-3.3-2.2 0.4-1.6-0.3-1.3-0.2-2.9 0-2 1.5-1-1.3-4-3.2-0.4-0.7-0.8-0.8-0.3-1 0.8-1.5 0.7-0.5 2.6-1.3-0.7-4.5-3.2-2.7-3.5-1.8-1.6-1.8-1.9-1.3-8.6-3.3-1.9-1.8-0.5-1.3-2.4-3.1-0.9-1.4-0.3-2.3 0-1.9-0.4-1.4-1.8-0.9-1.5 1-9.9 6.4-1.7 0.8-2-0.2-2-0.8-1.6-0.9-1.6-1.4-4.2-5.2-0.7-0.5-0.9-0.5-1-0.4-1-0.3-9.1-4-4.2-1.4-4 0.2-3.2-0.4-6.9-5.1-3.3-1.4-5.7 1.4-13.6 9-18.9 12.5z" id="NISJ" name="Rio San Juan" />
              <path d="M807.2 418.1l-3.4 0.5-9.2-0.6-7.4 0.3-3.4-1.1-18-10.5-13.8-10.1-0.8-0.8-0.5-0.8-0.2-1 0.1-1.1 0.4-1.1 0.7-1 3.4-4.3 0.7-1.1 0.4-1.1 0.1-1.1-0.7-0.8-1.4-0.8-3.1-0.8-1.9-0.8-1.5-0.9-1.8-0.8-3.6-0.5-14.8-0.6-2.8-0.3-0.7-0.5-2-0.3 1.1 2.2 0.2 1.9-0.7 0.8-1.7-1.1-1.3 0-1.6 1-0.9-0.1-1.2-0.9-1.5 4-2.2 0.5-2.8-1.1-3.5-0.7 0.9 1 1 1.9 0.6 0.9-2.9-0.6-4.4 1.3-1.6-0.7-1.2-0.3-1-1.2-0.7-1.3-3.6-11.2-0.5-0.9-1.4-0.4-2.5 0.4-11 3.1-1.8 0-2.2-0.6-1.2-0.8-1.2-0.6-1-0.2-1.3-0.2-1.2 0.1-1.4 0.4-1.9 1.3-2.3 2.5-2.3 0.8-3.6 0.5-25.6 0.1-47.3 5.8-3.4-5.1-18.3-23.3-1.1-1.9-0.6-0.7-0.8-0.2-16.6 15.5-1.6 0.7-2.9 0.3-12.1-0.3-6.1 0.6-4.7 2.8-2.4 3.3-1.5 3.4-2.1 6.6-2.3 4.7-1.6 1.9-1.8 1.3-5.2 2.5-4.8 1.2-2-0.3-5.6-2.4-1.3-1.8-2.2-0.3-0.3-0.4-0.3-1.7-0.3-0.6-0.7-0.4-2.5-1.3-1.4-1-0.8-0.2-0.6 0-1 0.3-1.1 0.1-0.6 0-0.5-0.1-0.5-0.2-0.4-0.2-5.2-4.9-1-0.8-0.9-0.5-2.5-1-3.6-3.6-9.3-12.6-3.9-8.6 0.1-6.7 1-2.4 5.7-5.1 9.9-6.5 2.1-1.7 0.6-1.4 0.2-1.8-0.1-0.9 0.1-3.4 1.9-5.9-0.2-1.8-0.9-2.5-1.3-2.1-1.4-3.2-0.2-1.7 0.3-1.2 1.9-1.2 1.3-1.5 1.5-2.3 1.6-4.5 0.9-1.7 0.9-1.1 14.7-2 0.4-0.1 22.4-14 0.7-0.2 17.5 8.1 0.8-0.4 0.9-0.9 23.3-37.4 11.1-18.8 1.7-3.7 0.4-2.2-1.7-6.9 0.6-8.8 4-21.6 0.3-4.6-0.5-2.6-16.4-1.1-1.3-0.3-0.9-0.6-2.7-3.2-3-2.9-3.5-4.5-0.5-1.4-0.1-1.2 0.4-1.3 1.4-2.6 0.2-0.9-0.2-4.1 0.3-1.2 2-3.6 0.4-1.8-0.3-1.5-0.7-1.2-0.8-0.7-2.7-1.5-2.5-2-0.3-0.4-0.1-0.6 0.1-1.8-0.1-1.6 0.1-1.1 0.4-2 0-0.8 0-1.1 0.3-1.2 1-2.7-0.1-1.2-0.3-1.2-0.4-0.8-0.4-0.7-0.6-0.5-0.5-0.3-1.3-0.3-0.9-0.1 0.2-0.6-4.7 0 1.1-1.5 4-3.8-5.2-3.7-1-1.8 2.9-0.8 1-0.5 0.6-1.1 0.9-7 1.6-3 2.5-2.4 0.4-0.2 2.9-1.9 3.3-2.4 8.4-8.2 3-1.7 10.9-2 4.9-0.2 4.7 1.4 4 3 2.7 4.5-0.5 0.5-1.5 1.9-0.1 0.4 3.7 0.4 0.5 2.3-0.2 2.5 3.7 2.6 2 3.2 2.7 6.5 3.4-2.1 3.5 0.4 7.1 3.1 4.1 0.9 13.4 0.4-0.7 1.3-0.5 3.7 2.8-0.9 1.9 1.1 1.9 1.7 2.8 0.8 2.1-0.6 4.7-2.6 6.8-2.5 3.4-4.1 2.6-4.8 2.4-3.6 1.8 1.8 1.3 4.9 1.4 1.1 2.8 0.2 4.4 1 2 0.2 3.8-2 0.9-4.2-0.9-8.9 1-2.2 2.3-0.2 2.5 0.9 1.7 0.9 1.4 1.2 4.3 4.7 2.3 0.9 2.7-0.2 4.4-1.3 1.1-0.6 0.8-0.9 0.9-0.8 1.7-0.4 1.5 0.3 0.9 0.4 0.7 0.1 1.3-0.8 0-1.4-1.6-1.6-1.3-1.7-2.1-4.5 2-1.6 1.3-0.1 4.2 2.6 0.5 0.9 0.7 0.7 1.9 0.2 3.1-0.1 1 0.6 0.3 1.4 3.2 0.4 18.1-1-1-1.5 0.1-1.8 0.9-4.3 2.2 1.2 3 3.2 2.3 0.6-0.2-0.8-0.9-1.7 1.3 0.5 0.7 0.2 0.7 0.5 1 1.3 2.2-2 3.3-1.8 3.6-1.2 3.4 0-1.4-1-0.9-0.9-1.3-2.2 10.2-0.7 3.8-1.4-0.4-3 2.4-0.1 1.8 0.2 1.4 0.9 0.7 1.6 1.4 0-1.8-5.4 0.7-2.2 3.4-1.6 3.7-0.5 4 0.2 3.4 1 1.6 2 1.3 0 0.8-2.3 0.4-2.5 0.9-2.1 4.5-1.7 4.6-3.7 2.6-0.7-0.3-0.7-0.5-1.4-0.4-0.5 2.7 0.8 1 0.5-0.6-2.6 0.3-2.2 1-0.8 1.8 1.7 0.1-2.9 0.3-1.2 1-1.2-1.3-1.9 0.7-0.9 1.8-0.2 2.4 0.4 1 0.9 2.2 3.5 1.7 0.9 4.3-0.5 3.7-2.2 2.9-3.2 1.7-3.3 2.3 1.8 2.4 1 1.9 1.2 0.9 2.5 2.8-1.9 3.2-0.2 8 0.9-2.1 1.1-0.2 1 1.4 0.9 2.2 0.9 0.7-0.1 8.2 0.1 4.8-2.2 2.6-0.5 6.1 0.3 2.5-0.4-1.4 2-3.3 1.6-1.7 1.7-2.7-3.2-2.2 2.3-1.8 4-1.3 2.1-2.4 1.2-2.2 2.7-1.6 3.2-0.7 2.6-0.5 0.9-2.3 2.3-1 1.4-0.4 1.8-0.4 4.1-0.4 1.8-1.5 2.4-2.2 1.7-6.3 2.5 0.4-1.1 0.5-0.9 1.6-1.9 0 1.5 0.6-1.1 0.4-0.9 0.1-0.9 0-1.3-1.4 0.9-0.6 0.2-1.6-1.1 0-1.1 2.2-1.1 2.1-0.2 1.8 0.6 1.4 1.8-0.1-3.5-2-4.9-0.5-3.9-1.2-3.8-2.6-0.6-2.9 1.1-2.2 1.4-3.6 3.4-8.1 10.5-2 4.5 1.8-1.9 0.6-0.9 2.6 2.1 2 7.7 1.2 1.8 2.4 1.4 2.6 2.6 2.8 0.9 2.8-3.5-1.3-1.2-3.4-2.1-1.5-0.6 2-1.2 2.2 0.7 1.9 1.8 1.5 2.6-0.1-4.3 1.3-1.4 1.6 1.7 7.2 33.2 0.4 1 1.7 3.6 1.5 9 8.9 25.9 1 7.5-0.9 6.4-5 12-15.2 24.6-6.6 8-0.9 3.2-1.3 2.3-8.7 6.1-3.7 5.2-2.6 6.1-4.4 17.5-7 23.8-4.4 21.5 0.3 9.3-0.8 4.5 0 3.6-3.8 9.3-3.3 12.5-2 24.2 0.3 4.6 1.3 2.6-1.3 1.2 1 2.3 6.1 37.2z m139.7-260.6l3-1.5 2.4 0 1.6 1.6 0.6 3.1-1.2 5.2-3.4 1.6-9.7-0.9-0.8-0.1 0.7 0 0.1 0 0.4-0.1 0.2-0.4 0-0.8 2.9-1.6 1.2-2.2 0.7-2.1 1.3-1.8z" id="NIAN" name="Atlántico Norte" />
              <path d="M533.4 121.8l0.9 0.1 1.3 0.3 0.5 0.3 0.6 0.5 0.4 0.7 0.4 0.8 0.3 1.2 0.1 1.2-1 2.7-0.3 1.2 0 1.1 0 0.8-0.4 2-0.1 1.1 0.1 1.6-0.1 1.8 0.1 0.6 0.3 0.4 2.5 2 2.7 1.5 0.8 0.7 0.7 1.2 0.3 1.5-0.4 1.8-2 3.6-0.3 1.2 0.2 4.1-0.2 0.9-1.4 2.6-0.4 1.3 0.1 1.2 0.5 1.4 3.5 4.5 3 2.9 2.7 3.2 0.9 0.6 1.3 0.3 16.4 1.1 0.5 2.6-0.3 4.6-4 21.6-0.6 8.8 1.7 6.9-0.4 2.2-1.7 3.7-11.1 18.8-23.3 37.4-0.9 0.9-0.8 0.4-17.5-8.1-0.7 0.2-22.4 14-0.4 0.1-14.7 2-0.9 1.1-0.9 1.7-1.6 4.5-1.5 2.3-1.3 1.5-1.9 1.2-0.3 1.2 0.2 1.7 1.4 3.2 1.3 2.1 0.9 2.5 0.2 1.8-1.9 5.9-0.1 3.4 0.1 0.9-0.2 1.8-0.6 1.4-2.1 1.7-9.9 6.5-5.7 5.1-1 2.4-0.1 6.7-10.2 6.7-3.6 1.4-4.3 0-3.8 2.6-2.6 3-2.7 4.3-3.2 5.5-13.3 15.8-6.9 6-2 1.1-8.5 7.4-10.4 9.8-4 2.9-1.8 0.6-2.4 0.3-6.6-0.2-2.2 0.3-0.9 0.5-2.4 2.9-6.3-4.8-2.9-2.9-2.6-1.6-1.7-0.7-2.5 0.1-0.9-0.1-2.9-3.5-8-4.7-13.8-13.9-1.3-2-1.2-2.6 2.1-3.6 0.6-3.1-0.5-2.4 2.7-7.8-1.7-8.1 0.1-4 0.5-3.2 1-2.9 1.6-2.8 6.7-7.2 3-2.7 2.9-0.5 2.6-0.1 2.3 1 1.7-2.1 7.1-5.7 1.8-2.1 1.8-2.2 2-0.8 1.9 2.4 1.8-0.8 9.6-0.8 3.2 0.2 2 1.2 1.6 1.4 1.7 0.9 2.4-0.3 1.3-0.9 3.1-4.4 4.1-3.1 3.3-1.7 2.1-2.4-0.4-11.2 0.6-4.7 1.7-4.4 5.3-9.1 0.8-2.3 0.5-2.5 0.3-8.9 1.1-3.1 1.8-2.2 4.4-2.7 0.1 0.1 0.4-0.4 1.3-1.2 1.5-3 0.4-2.9-1-2.2-2.8-0.9-0.7-1.6 0.8-3.7 1.8-5.6 0.2-4.2 0.9-1 1.9 0.4 3.3 0.3 2.3-1.1 3.7-3.3 1.6 0.5 1.1 0-0.1-0.9 0.3-0.2 0.5 0 0.6-0.2-0.6-2 6.4-2 1.8-1.8 1.7-2.6 4-1.4 1.6-0.3 3-0.5 3.4-1.1 1.8-2.6 0.4-3 1-2.5 6.6-1.9 3.1-1.8 4.8-3.7 2.1-2.7 2-3.6 1.5-3.6 1.4-4.8 1.7-3 2.1-2.8 1.8-1.7 0.8-0.1 2 0.3 0.7-0.2 0.5-0.6 0.6-1.4 1.3-1.6 0.7-1.2 1-1.1 1.7-0.4 4.4-2.2 1.9-0.4 6.9 0 4.6-0.8 4.6-1.5 3.7-2.3 2.1-3.2-0.1-4.3-2.4-3.7-3.3-3-2.9-2 5-3.9 0.2-1.2-0.4-2.9 0.2-1.2 4.2-4.5 0.7-1.2 0.4-9.6 0.7-5.2 1.5-2.7 3.3 0.8 3 3.3 3.1 2.3 3.9-1.8 6.5-6.6 1.1-2.6z" id="NIJI" name="Jinotega" />
              <path d="M401.5 269l-4.4 2.7-1.8 2.2-1.1 3.1-0.3 8.9-0.5 2.5-0.8 2.3-5.3 9.1-1.7 4.4-0.6 4.7 0.4 11.2-2.1 2.4-3.3 1.7-4.1 3.1-3.1 4.4-1.3 0.9-2.4 0.3-1.7-0.9-1.6-1.4-2-1.2-3.2-0.2-9.6 0.8-1.8 0.8-1.9-2.4-2 0.8-1.8 2.2-5.5-6.7-4.1-7.2-1.8-2.3-1.5-1.5-6.3-5.2-3.6 1.2-4 1.6-0.5 0.9-0.6 1.2-1.1 5.4-1.7 2-5.5-2.5-3.6-2.2-2.8-0.8-2.2-0.3-7.6 1-5.9 0.1-10.2-3.4-13.2-0.2-1.8 0.2-4.1 1.1-1.9 1.8-2.9 1.4-2.2-2-2.1-1.2-3.1-1.2-2-1.4-1.7-1.8-0.8-1.6-3.6-5.4-12.8-2.4-4.1-0.1-0.8 0.7-0.6 0.6-1.4 1.9-1.5 1.1-0.8-0.5-0.7-1-0.3-1.7 0.5-10.1 0.2-3.2 0.4-2.7 0.3-1.1 0.9-0.8 2.1-1.5 4.1-2.1 3.9-0.3 8 1 14.9-2.9 7.3-0.4 6 3.4 3.3 0.9 2.6-0.9 2.5-1.3 2.7-0.3 2.9 2.9 1.1 0.8 1.7 0.6 1.3 0.2 9.4-0.6 3.4-0.9 2.7-1.3 2.2-2.4 1-2.9 1.5-5.6 2.9-4.6 12-12.9 6.3-10 1.9-1.2 2.2-0.9 2.2-1.1 2.1-2.3 1.4-2.4 0.7-1.8 0.9-1.7 2.1-1.8 2.5-1.3 14-2.1 0 2.1-2 4 0.5 5 13 9.5 3.9 5.2 1.3 1.2 2.5 0.9 1.7-0.4 1.7-0.7 2.5-0.1 4 1.7 2.1 3.3 1.8 3.9 3 3.5 4 1.5 4.3-0.2 3.7 0.3 2.5 2.8 0.3 0.1z" id="NINS" name="Nueva Segovia" />
              <path d="M220.1 373.7l0.2 0.4 3.5 0.7 1.1 0.8 0.5 1.6 0.2 1.4-0.1 1.1-0.2 1.1-0.2 0.4-1.7 5.4-1.9 1.7-0.2 0.2-0.5 1.7-0.6 5.9 2.1 11.2 1.8 6.4 3.9 9 2.5 4 2.3 5.3 1.7 22.7-0.6 5.9-2.3 5.3-3.2 2-1.5 0.6-2.6 0.6-13.2 1.8-2 1.1-1.3 1.3-2.6 4.9-3.5 4.3-3.6 1.6-4.5 4.9-4.6 5.1-3.6 3.4-0.7 1.2-1.4 3.7-3.7 6-9.5 9.9-1.8 1.1-3.1 1.8-3.1 1.4-9 1-4.1 2.4-0.3-0.3-2.4-1.9-2.5-0.8-1.6-1.2-4.1-7.9-1.2 0 1.9 7-3-2.6-4.8-6.1-3.5-3.4-2.3-1-11.4-8.9-1.5-1.6-0.9-1.9-1-3.3-0.5 1.1-1.4 1.7-0.6 1-20.1-23.5-2.4-4.9 0.8 0.9 0.8 0.5 2.2 1.2 0-1.2-0.9-0.3-1.6-1.1 0-1.1-0.5-1.9-3.1-2.6-4.1-2.3-3.7-0.9 0 1.1 4.9 3.2 2.5 2.4 0.1 2.1-1.9-0.2-2.7-2.1-4-4-21.5-12.9-4.5-4-2.7-4.7 0-5.5 3.4-6.5 5.2-4.5 5.3-3.4 3.8-4.1 0.9-7.3 1.2 0-0.5 4.1-0.7 1.1 2.1 0 2.5 0.3 2.1 0.7 0.9 0.9 0.8 0.5 4.7 4 1.1 0.7 3.4 4.4 0.8 0.7 2.3 1.4 0.6 0.5 0.2 1.2-0.4 2.9 0.2 1.2 6 6 7.8 1.7 18.9-1.2 0-1.4-9.6 0.2-4.8-0.5-2-1.7 1.8-3 8.9-4.4 1.2-0.9 42-2.7 2.7 0.3 4.3 2.6 2.1 0.2 1-3.1 3.8-1.9 4.7-2.9 2.1-2.3 4.3-6.7 1-0.9 2.7-1.3 1-1 0.5-1.8-0.8-0.7-1-0.5-0.4-1.1 1.5-9.9-0.3-0.5-1.4-3-0.3-1.1 0.3-0.5 1.3-5.3 1.3-2.6 1.5-1.8 8.8-7.6 2.4-1.7 3-0.8 3.1 0.2 10.6 5.3 1.7 0.5 1.7-0.5 1.3-0.9z" id="NICI" name="Chinandega" />
              <path d="M343.5 331.4l-1.8 2.1-7.1 5.7-1.7 2.1-2.3-1-2.6 0.1-2.9 0.5-3 2.7-6.7 7.2-1.5-2.5-1.8-4.2-0.7-1.2-3.5-1.1-10.2 0.5-14 4.5-7.8 1.3-7.8-3.7-2.7-1.3-1.9-0.6-4.9 0.7-7.3 6.4-7.5 13.2-1.6 3.3-3.4 4.9-15.4 15.6 1.7-5.4 0.2-0.4 0.2-1.1 0.1-1.1-0.2-1.4-0.5-1.6-1.1-0.8-3.5-0.7-0.2-0.4 1.4-0.9 2.5-2.3 1.4-2.5 0.4-2.9-1.1-5.4-0.4-1.1-1.3-2.4-1.2-1.1-1.2-0.3-1.1-0.5-0.7-1.9 0.3-2.7 2.3-5.2 0.3-3-5.9-22.6-0.1-3.2 1.1-6-0.1-3-0.7-1.2-1.6-1.3 1.5-1.1 1.4-1.9 0.6-0.6 0.8-0.7 4.1 0.1 12.8 2.4 3.6 5.4 0.8 1.6 1.7 1.8 2 1.4 3.1 1.2 2.1 1.2 2.2 2 2.9-1.4 1.9-1.8 4.1-1.1 1.8-0.2 13.2 0.2 10.2 3.4 5.9-0.1 7.6-1 2.2 0.3 2.8 0.8 3.6 2.2 5.5 2.5 1.7-2 1.1-5.4 0.6-1.2 0.5-0.9 4-1.6 3.6-1.2 6.3 5.2 1.5 1.5 1.8 2.3 4.1 7.2 5.5 6.7z" id="NIMD" name="Madriz" />
              <path d="M558.8 808.8l-4.3 1.6-4.2-0.5-29.6-11-26.3-9.8-6.6-2.4-24.8-9.2-18.5-6.9-5.9-3.4-5.2-4.6-5.3-2.8-6.1 2.6-5.1 7-3.4 7.3-4.4 7.2-0.1 0-9.2-3.8-3.5-0.6-2.6-1.4-1.5-3.3-1.7-6.8-3.3-5-19.6-22-1.6-1.2-0.8-0.4-2.9-2-0.6-0.8-6.3-1.8-2.9-2.6-6.1-7.5-4.9-2.6-6.3-6.6-7.9-4.6-2.7-2.4-0.7-1.5-1.6-5 0-0.1 5.3-9.7 1.2-2.3 0.6-0.7 6.4-4.3 4.3 1.1 1.4-0.2 0.6-0.6 5.1-2.6 0.7-0.5 2-3.3 2.9-6.2 0.5-0.5 0.5-0.3 0.5-0.1 0.3 0.1 0.9 0.2 0.8 0.5 0.7 0.7 1.8 1.9 0.9 0.3 8.1-2.1 6-1.8 68.1 0.3 77.2 9.2-43.9 90.6 7.5 6.8 16.4 6.1 9 3.8 24.6 9.1 15.7 5.4 10.4 6z" id="NIRI" name="Rivas" />
              <path d="M772.6 809.5l-3.1-2.5-4.8-5.1-2.6-4.4-3.4-4.4-0.6-0.6-0.4-0.3-1.4-0.4-7.2-1.4-2.1-0.2-1.3 0-0.4 0.3-0.4 0.2-0.4 0.2-0.6 0-0.6-0.4-0.8-0.9-0.3-0.8-0.1-0.7-0.1-1.2 0-0.6-0.2-0.4-0.3-0.4-0.6-0.6-0.6-0.8-0.2-0.5-0.2-1 0-0.6 0.3-3.4-0.1-0.6-0.3-0.3-0.5-0.2-2.6 1.3-0.9 0.2-1.7 0.2-1.5 0.6-0.4 0.3-0.4 0.2-0.5 0.1-0.4 0.3-0.7 0-0.8-0.1-1.8-0.7-1.1-0.2-1.3 0.3-0.7 0.2-0.9 0.5-0.4 0.3-0.8 0.5-0.4 0.1-1.2 0.3-1.6 0.8-0.7-0.1-1-0.5-1.8-1.5-2-2.1-0.2-0.4-0.1-0.4 0-0.6 0.2-1-0.6-0.4-1.2-0.1-5.8 0.8-2.3-0.8-3-1.2-1.2-0.3-0.5 0-1.2 0-1.8 0.2-0.5 0-0.5-0.1-1.4-0.5-1-0.3-0.5-0.2-1.2-0.7-0.7-0.3-0.6-0.1-0.6 0-0.7-0.5-1-1.1-3.7-6.2-1.6-2.1-5.2-5.2-7.2-5.2-8.6-4.5-1.7-1.2-1.7-1.7-1.4-2.9-0.3-2.4-0.2-2.3-1.1-2.5-2.8-2.9-14.6-9.1-5.3-3.3-12.2-4.5-0.7-7.2-1.3-7.2 0-2.5 0.6-3.6 2.6-9 1.8-4.3 0.3-2 0.1-1.6-1.9-5.8-1.9-4.8-0.3-4.8 0.2-2.3-0.4-1.2-1.2-1.2-1.5-1.3-2.7-5-3.7-12.9-1-3.2-1.3-2.4-0.2-0.6-0.1-0.8 1.4-1.3 7.2-3-23.4-11.3-1.3-1.9-11.6-29.4-2.5-11.2-0.2-6.2 1.1-4.2-0.5-2.8-6.5-11.6-1.1-1.2-1.3-1.1-1.3-1.4-1.3-2.2-1-3.1-0.8-6.1 0.3-3.1 0.5-2.4 1-2.5 0.3-1.1-0.4-1.3-1.2-1.9-2.4-2.4-3.8-5.8-4-9-1.1-1.8-5.3-4.9-4.4-6.4-1-1-2.1-1.1-0.2-0.6-0.1-0.9 0.6-2.9-0.3-3.4-0.8-2.4-1.6-3-1.1-1.3-1.1-1-1.6-0.9-1.5-2.3-0.9-0.4-5.3-4.1-3.4-1.8-3.5 0.1-3.5 3.1-0.9 2.3-0.7 5.2-0.8 2.8-0.5-0.1-1.5 1-1.3 1.1 0 0.6-0.6 0.3-2.4 2.4 1.8 3 0.2 2.8-1.4 1.4-3.1-0.9-4.8-10.3-1.4-6.3-0.8-2.1-1.8-3.6-0.2-1.8 0.4-1.8 0.7-1.5 1.2-1.2 1.6-0.9 2.7-0.2 2 0.3 2.2 0.1 1.8-0.6 2.1-1.9 0.6-1.8 0-3 0.6-0.9 1.9-0.3 1.5 0.4 3.3 0.9 2 0.3 2.2-0.1 2.6-0.5 5-1.5 1.8-0.2 10.9 1.9 2.4 0.7 0.7-0.8 2.2-1.5 1.2-1 1.8-2.9 1.3-3.1 3.7 0.7 4.2-2.8 3.8-3.7 2.7-1.9 2.2-0.2 3.5-1 2.5-0.1 2.3 0.6 1.1 0.8 1 0.1 1.9-1.5 1.1-0.4 0.7 0.2 0.6-0.2 0.3-2.8 0.8-1.9 0.2-0.6 0.2-2.7 1.2-6.3 0.7-1.6 3.9-4.3 0.1-0.1 1.2-0.9 0.7-0.5 0.1-0.1-0.5-0.1-0.4 0.1-0.6 0.1-0.4 0.2-2 1.2-0.6 0.1-0.5 0.1-0.6 0-0.6-0.1-0.5-0.2-0.4-0.2-0.4-0.3-0.6-0.7-0.5-0.7-2.6-5.5-1.2-3.7-0.2-0.4-1.4-1.9-0.8-0.6-0.4-0.2-0.4-0.2-0.5-0.1-0.5-0.2-0.4-0.3-1.3-1.2-0.4-0.2-0.4-0.2 0.6-1.3 0.6-1 7.9-10.6 47.3-5.8 25.6-0.1 3.6-0.5 2.3-0.8 2.3-2.5 1.9-1.3 1.4-0.4 1.2-0.1 1.3 0.2 1 0.2 1.2 0.6 1.2 0.8 2.2 0.6 1.8 0 11-3.1 2.5-0.4 1.4 0.4 0.5 0.9 3.6 11.2 0.7 1.3 1 1.2 1.2 0.3 1.6 0.7 4.4-1.3 2.9 0.6-0.6-0.9-1-1.9-0.9-1 3.5 0.7 2.8 1.1 2.2-0.5 1.5-4 1.2 0.9 0.9 0.1 1.6-1 1.3 0 1.7 1.1 0.7-0.8-0.2-1.9-1.1-2.2 2 0.3 0.7 0.5 2.8 0.3 14.8 0.6 3.6 0.5 1.8 0.8 1.5 0.9 1.9 0.8 3.1 0.8 1.4 0.8 0.7 0.8-0.1 1.1-0.4 1.1-0.7 1.1-3.4 4.3-0.7 1-0.4 1.1-0.1 1.1 0.2 1 0.5 0.8 0.8 0.8 13.8 10.1 18 10.5 3.4 1.1 7.4-0.3 9.2 0.6 3.4-0.5 4 24.5-6.1 49.5 0 11 0.6 1.8 2.6 5.4 1.8 6 5.1 7.2 1.2 4.6-0.4 5.8-2 3-3.7 1.3-5.9 0.2-4.5 0.9-4.5 1.7-4.3 0.7-3.7-2 1.4-1.4 3.8-2.7 1.1-1.2 0.1-2.2-0.7-2.9-1.1-2.6-4-3.6 0.3-12.3-0.9-4.7 0.7-0.3 0.2-0.1 0.1-0.1 0.4-0.7 1.1 0 6.5 2.1 4.5-5.8 1.6-8.5-2.4-5.7 0-1.4 1.5-1.8 0.7-2.5 0.3-10.5 0.3-0.4 0.7-0.6 0.9-1 0.6-1.3-0.7-5-3.5-3-4.9-1.2-4.7 0.4-3.8 2.2-1.6 3.5 0.1 3.8 1.4 3.3 4.1 2.2 0.4 0.3-0.1 0.7 0.4 3.2 0.2 1.3 0.8 1.3 0.9 0.5 0.7 0.7 0.2 2 0 3.1-0.4 1.3-0.9 1.5 0.7 0.9 1.9 2.9-5.7 3.4-9.8 8.2-5.9 2.5-7.9 0.9-3.3 1.1-1.4 2.4 0 9.8 0.2 0.2 0.7-0.4 1.6 0.1 2.2 0.5 1.5-0.1 1.2 0.4 1.5 1.8 1.2 8.4-0.7 4-1.3 3.8-0.6 3.5 1.4 3.5 3.4 1.6 5.7-1.2 1 2.9-0.2 1.9-1 3.6-0.2 2.2 0.4 1.1 0.9-1.7 2.9-9.6 1.1-2.4 1.6-1 3.6 0.5 0.8 1.5-8.6 17.2-4 22.2 1.3 24 1.4 4.1-1.3 0.7-1.3 0.5 0.7-3.8-1.3-3.2-4.6-5.7-1.9-4.8 1.6-2 2.7-1.8 1.4-4.4-0.9-3.1-2.4-3.7-3.3-3.2-3.4-1.6-5.6 0.6 0.3 2.8 2.9 1.7 2.4-2.5 1.4 0 3.1 3.2 1.2 2 0.5 2.5-0.6 3.1-2.8 4.1-0.3 3-1 3.6-3.3 0.1-7.6-2.3-1 0.6 2.3 1.4 4.5 1.8 1 1.5 0.8 2 0.4 2.3 0.1 2.5-0.3 1.7-1.7 3.4-0.3 1.4 0.3 1 0.6 1.1 0.4 1.2-0.2 1.2-1 1.2-1 0.5-1 0.4-0.6 0.5-3.4 4.4-1.1 0.7-1.6 0.6-1.8 1.3-1.5 1.7-0.8 1.6 2.4 1.7 3 2.6 2.5 2.9 1.5 3.6 1.4 1 1.8 0.7 1.8 0.2 2.7-0.3 0.2-0.9-0.7-1.2-0.3-1.4 1.2-3.7 1-1.9 1.7-0.7 3-0.1 1.8 1.5 8.5 34.2 0.4 6.6-0.1 2.4-0.2 1.4-0.7 1.2-1.5 1.4-0.3-0.6-2.6 0.6-2.6 0.8-0.2 0.4-1.4 0.7-1.8 2.7-1.7 0.6-2.2 0-1.8 0.3-1.5 0.7-1.5 1.4-1.9 5.8-1.8 8.8-2.4 6.6-3.9-0.6-1.2 0-5.8 7.4-1.7 2.9-0.9 3.2 0 18.9 5.6 24.5 4 9.8 5.5 8.5 1.8 4.6 4.3 7.1 1.6 1.4 3.3 2.1 1.3 3.6z m-1.4-174.8l-1.4-5-0.4-6.8 1.3-5.9 3.7-2.6 0.3 0 0.2 0.2 0.1 0.3-0.1 0.6-1.2 2-1.3 3-0.9 3.4-0.3 3.1 1 6.8 0.1 2.5-1.1-1.6z m123.2-49.7l-0.4-4.1 1.8-3.3 2.5-1.4 2.1 1.7-0.7 1.3-5.3 5.8z" id="NIAS" name="Atlántico Sur" />
              <path d="M149 526l4.1-2.4 9-1 3.1-1.4 3.1-1.8 1.8-1.1 9.5-9.9 3.7-6 1.4-3.7 0.7-1.2 3.6-3.4 4.6-5.1 4.5-4.9 3.6-1.6 3.5-4.3 2.6-4.9 1.3-1.3 2-1.1 13.2-1.8 2.6-0.6 1.5-0.6 3.2-2 2.3-5.3 0.6-5.9-1.7-22.7-2.3-5.3-2.5-4-3.9-9-1.8-6.4 3.2-1.3 1.8-0.1 2.4 0 2.9 1 3.6 1.8 2.1-0.2 3.8-0.8 12.1-4.1 10.2-2.2 2.2 0.6 1.4 0.7 3.3 3.4 4.9 8 1.8 2.6 1 1.6 1.3 4.7-0.4 5.9-4.1 7.2-0.2 2.1 0 1.6 1.9 3.3 6.1 3.1 22.5 6.6-0.6 4.6-2.1 18.7-1.9 16.5-7.2 4.5-2.7 2.5-1.5 2.1-0.5 1.1-0.2 0.9 0 0.7-0.3 1.9 0 0.7 0.1 0.5 0 0.9-0.3 1.2-1.1 3.3-0.2 0.9 0.1 0.5 0.4 0.9 0.2 0.5 1.7 2.5 0.1 0.1 1 0.9 0.3 0.4 0.1 0.5 0 1.1 0.1 0.7 0.3 0.7-0.3 0.5-0.7 0.9-17.9 17.7-12.2 12.4-2.6 3.6-0.3 2.9 0 13.3 0.3 1.3 0.5 1.1 0.7 0.6 0.9 0.6 1.2 1.4 0.3 3.3-2.4 5.2-3.5 4.2-6.9 5.3-1.1 0.5-0.5 0-2.6-0.5-2.6-1-0.4-0.1-0.4 0-0.5 0.1-0.5 0.1-2.8 1-1.3 0.3-0.6 0.3-0.5 0.3-0.3 0.4-0.2 0.4 0 0.6 0.1 0.5 0.3 1 1.2 2.6 0.9 1.1 0.2 0.4 0.2 0.6 0 0.5-0.1 0.5-0.8 1.4-0.6 0.7-4.6 3.3-3.5-4.4-6.9-12-6.5-17.7-1.8-2.8-4.5-4-37.6-23-2.3-2.9-10.3-6-5.6-6-12.7-5.8-0.5-4.3 2.1 2.8 3.6 2.4 4.2 1.7 4 0.8-4.2-4.7z" id="NILE" name="León" />
              <path d="M231.5 611.9l4.6-3.3 0.6-0.7 0.8-1.4 0.1-0.5 0-0.5-0.2-0.6-0.2-0.4-0.9-1.1-1.2-2.6-0.3-1-0.1-0.5 0-0.6 0.2-0.4 0.3-0.4 0.5-0.3 0.6-0.3 1.3-0.3 2.8-1 0.5-0.1 0.5-0.1 0.4 0 0.4 0.1 2.6 1 2.6 0.5 0.5 0 1.1-0.5 6.9-5.3 3.5-4.2 2.4-5.2-0.3-3.3-1.2-1.4-0.9-0.6-0.7-0.6-0.5-1.1-0.3-1.3 0-13.3 0.3-2.9 2.6-3.6 12.2-12.4 17.9-17.7 0.7-0.9 0.3-0.5-0.3-0.7-0.1-0.7 0-1.1-0.1-0.5-0.3-0.4-1-0.9-0.1-0.1-1.7-2.5-0.2-0.5-0.4-0.9-0.1-0.5 0.2-0.9 1.1-3.3 0.3-1.2 0-0.9-0.1-0.5 0-0.7 0.3-1.9 0-0.7 0.2-0.9 0.5-1.1 1.5-2.1 2.7-2.5 7.2-4.5 31.1 6.9 3.3 1.1 2.7 2.5 2.8 3.2 2 1.6 1.8 1.2 11.3 4.4 3 0.6-1.1 3.3 0.7 6.3 0.9 2.7 1.2 2.1 2.4 3.1 4.6 5.1 0.6 1 0.2 1.2-0.3 3.7-0.1 3.1 0.3 1.4 0.6 0.9 16.1 15.2 0.3 0.7-0.3 1.1-3 4.6-1 5.2-3.2-1.4-1.4 0-1.5 0.5-5.8 4.2-15.4 7-3.2-0.9-1-0.5-0.4-0.2-0.5 0-3.2 0.4-6.2 2.6-5.4 0.9-3.3 2.5-11.1 11 0.6 2.4 2.6 2.8 1 1.4 0.5 1.1-0.2 4.2-2.1 3.3-1 1.2-1.1 1.1-1.5 0.8-1.7 0.4-1.4 0.2-2.2-0.6-1.3-0.6-5-3.9-4.3 5.4-2.2 3.3-11.5 9.4-3.5 5.8-1.4 1.3-4.9 3.7-1.9 2.8-2.3 2.2-0.7 0.4-1 0.3-2.1 0.6-1.1 0.1-1.5 0.1-1.8 1.1-4.6 4.5-2.5-3.1-4.9-11.1-2-1.6-1.8-1-4.8-4.9-2.9-4.1-3.1-5.9-0.6-2.8-0.9-2.6-2.1-2.2-4.5-3.5-0.8-1z" id="NIMN" name="Managua" />
              <path d="M335.8 684.9l-6.4 4.3-0.6 0.7-1.2 2.3-5.3 9.7 0 0.1-0.2-0.6-5.6-2.5-6.9-6.7-16.8-7.4-2.9-2.1-2.4-2.9-2.1-5.9-21.9-16.8-1.1-1.4 4.6-4.5 1.8-1.1 1.5-0.1 1.1-0.1 2.1-0.6 1-0.3 0.7-0.4 2.3-2.2 1.9-2.8 4.9-3.7 1.4-1.3 3.5-5.8 11.5-9.4 2.2-3.3 2 2.4 16.7 6.7 5.4 2.6 2.4 3.3 0.4 0.5 9.8 2.9 1.5 0.5-0.8 1.9-3.8 6.9-1 4.7 0.6 4.6 0.8 3.2 0 2.1-0.4 1.7-2.2 3-1.7 3.5-0.8 5.8 0.3 2.7 0.4 1.7 3.3 4.1z" id="NICA" name="Carazo" />
              <path d="M444.9 354.5l3.9 8.6 9.3 12.6 3.6 3.6 2.5 1 0.9 0.5 1 0.8 5.2 4.9 0.4 0.2 0.5 0.2 0.5 0.1 0.6 0 1.1-0.1 1-0.3 0.6 0 0.8 0.2 1.4 1 2.5 1.3 0.7 0.4 0.3 0.6 0.3 1.7 0.3 0.4 2.2 0.3 1.3 1.8 5.6 2.4 2 0.3 4.8-1.2 5.2-2.5 1.8-1.3 1.6-1.9 2.3-4.7 2.1-6.6 1.5-3.4 2.4-3.3 4.7-2.8 6.1-0.6 12.1 0.3 2.9-0.3 1.6-0.7 16.6-15.5 0.8 0.2 0.6 0.7 1.1 1.9 18.3 23.3 3.4 5.1-7.9 10.6-0.6 1-0.6 1.3 0.4 0.2 0.4 0.2 1.3 1.2 0.4 0.3 0.5 0.2 0.5 0.1 0.4 0.2 0.4 0.2 0.8 0.6 1.4 1.9 0.2 0.4 1.2 3.7 2.6 5.5 0.5 0.7 0.6 0.7 0.4 0.3 0.4 0.2 0.5 0.2 0.6 0.1 0.6 0 0.5-0.1 0.6-0.1 2-1.2 0.4-0.2 0.6-0.1 0.4-0.1 0.5 0.1-0.1 0.1-0.7 0.5-1.2 0.9-0.1 0.1-3.9 4.3-0.7 1.6-1.2 6.3-0.2 2.7-0.2 0.6-0.8 1.9-0.3 2.8-0.6 0.2-0.7-0.2-1.1 0.4-1.9 1.5-1-0.1-1.1-0.8-2.3-0.6-2.5 0.1-3.5 1-2.2 0.2-2.7 1.9-3.8 3.7-4.2 2.8-3.7-0.7-1.3 3.1-1.8 2.9-1.2 1-2.2 1.5-0.7 0.8-2.4-0.7-10.9-1.9-1.8 0.2-5 1.5-2.6 0.5-2.2 0.1-2-0.3-3.3-0.9-1.5-0.4-1.9 0.3-0.6 0.9 0 3-0.6 1.8-2.1 1.9-1.8 0.6-2.2-0.1-2-0.3-2.7 0.2-1.6 0.9-1.2 1.2-0.7 1.5-0.4 1.8 0.2 1.8 1.8 3.6 0.8 2.1 1.4 6.3 4.8 10.3 0.1 2-0.2 1.8-0.5 1.5-0.7 1.2-1.2 0-0.9-0.8-1.7-1.2-1.7-0.6-0.7 0.7-0.6 1.8-1.2-0.3-5.7-6.5-2-0.3-3.2 2.1-1.2 0 1-4.8 0.2-0.5-1.3-1-2.9-0.2-3.5-1.9-6-2.1-1.3-0.6-0.6-1.8-1.6-1.9-1.8-1.5-1.6-0.5-1.1-0.3-1.4 1.1-0.3 0.4-0.3 0.7-0.4 0.9-0.6 0.7-0.3 0.3-0.8 0.5-0.8 0.4-1.5 0.5-0.4 0.2-0.4 0.3-0.2 0.5-1 0.3-1.8 0.2-11.8-0.6-0.6 0.1-0.5 0.2-0.3 0.3-0.3 0.4-2.4 4.8-0.5 0.7-0.7 0.3-1.1 0.2-3.6 0-0.8 0.2-1.7 0.8-3.7 0.7-2.2 0.5-2.2 1.8-0.7 0.4-0.6 0-1-0.6-3-0.6-2.4-0.6-31.8 6.6-3 1.6-3.2 6.7-8.8 4.9-1 0.8-5.4 5-3-0.6-11.3-4.4-1.8-1.2-2-1.6-2.8-3.2-2.7-2.5-3.3-1.1-31.1-6.9 1.9-16.5 2.1-18.7 0.6-4.6 1-6.8 2.9-6.1 0.6-0.8 1.5-1.3 4-2.4 2.2-0.7 4.7-1 2.3-0.9 1.5-1 0.8-1 0.5-1.1 1.2-4.8 6.9-9.5 0.9 0.1 2.5-0.1 1.7 0.7 2.6 1.6 2.9 2.9 6.3 4.8 2.4-2.9 0.9-0.5 2.2-0.3 6.6 0.2 2.4-0.3 1.8-0.6 4-2.9 10.4-9.8 8.5-7.4 2-1.1 6.9-6 13.3-15.8 3.2-5.5 2.7-4.3 2.6-3 3.8-2.6 4.3 0 3.6-1.4 10.2-6.7z" id="NIMT" name="Matagalpa" />
              <path d="M504.9 488.2l3.1 0.9 1.4-1.4-0.2-2.8-1.8-3 2.4-2.4 0.6-0.3 0-0.6 1.3-1.1 1.5-1 0.5 0.1 0.8-2.8 0.7-5.2 0.9-2.3 3.5-3.1 3.5-0.1 3.4 1.8 5.3 4.1 0.9 0.4 1.5 2.3 1.6 0.9 1.1 1 1.1 1.3 1.6 3 0.8 2.4 0.3 3.4-0.6 2.9 0.1 0.9 0.2 0.6 2.1 1.1 1 1-2.3 4.7-7 10.3-0.7 1.4-0.5 1.6-0.3 2.1-0.1 6.9-0.5 2.1-0.9 2.1-3.1 3.9-2 2-2.7 2-5.4 2.7-2.6 0.4-1.1 0.1-1.9-0.3-1.9 0.5-2.8 1.1-10.7 7.4-2.2 1.2-7.5 2.6-9.9 1.1-13.2 2.4-7.8-0.4-5.4-0.1-4.5-0.7-2-0.1-2.6 0.8-6.9 3.4-4.8 3.5-0.8 0.8-1.5 2.1-0.4 0.9-0.2 1.2 0.1 4.5 0.4 3.4 0 1.3-0.4 1.3-3.7 8.5-0.2 0.3-0.2 0.3-0.3 0.4-1.7 2.8-0.9 1.8-3 18.8-13.8 1-9.8-13.8-5-4.4-2.9-1.1-1.6-1.2-0.9-1.2-0.3-1.4-0.3-2.8-1.2-3.6 1-5.2 3-4.6 0.3-1.1-0.3-0.7-16.1-15.2-0.6-0.9-0.3-1.4 0.1-3.1 0.3-3.7-0.2-1.2-0.6-1-4.6-5.1-2.4-3.1-1.2-2.1-0.9-2.7-0.7-6.3 1.1-3.3 5.4-5 1-0.8 8.8-4.9 3.2-6.7 3-1.6 31.8-6.6 2.4 0.6 3 0.6 1 0.6 0.6 0 0.7-0.4 2.2-1.8 2.2-0.5 3.7-0.7 1.7-0.8 0.8-0.2 3.6 0 1.1-0.2 0.7-0.3 0.5-0.7 2.4-4.8 0.3-0.4 0.3-0.3 0.5-0.2 0.6-0.1 11.8 0.6 1.8-0.2 1-0.3 0.2-0.5 0.4-0.3 0.4-0.2 1.5-0.5 0.8-0.4 0.8-0.5 0.3-0.3 0.6-0.7 0.4-0.9 0.3-0.7 0.3-0.4 1.4-1.1 1.1 0.3 1.6 0.5 1.8 1.5 1.6 1.9 0.6 1.8 1.3 0.6 6 2.1 3.5 1.9 2.9 0.2 1.3 1-0.2 0.5-1 4.8 1.2 0 3.2-2.1 2 0.3 5.7 6.5 1.2 0.3 0.6-1.8 0.7-0.7 1.7 0.6 1.7 1.2 0.9 0.8 1.2 0 0.7-1.2 0.5-1.5 0.2-1.8-0.1-2z" id="NIBO" name="Boaco" />
              <path d="M609.7 637.8l-7.1-0.3-2-0.4-0.9-0.4-0.7-0.1-0.6-0.1-2.8 0.3-0.7-0.1-1.6-0.4-0.8 0-3.7 0.6-13.5-0.1-1 0.1-0.8 0.3-0.6 0.9-12.1 11.2-4.6 3-7.9 1.7-2.7 4.3-0.5 1.2 0 0.2-0.2 0.8-0.4 0.5-0.7 0.9-0.3 0.4-0.2 0.4-0.2 0.3-1.3 1.4-0.9 1.1-0.6 1.1-0.6 0.4-1.1 0.7-3.4 1.3-0.9 0.1-0.4-0.2-0.9-0.3-1.2 0.5-1.6 0.9-3.7 2.6-2.8 1.4-0.8 0.7-0.5 0.6-3.3 5.7-77.2-9.2-24.5-68.5 3-18.8 0.9-1.8 1.7-2.8 0.3-0.4 0.2-0.3 0.2-0.3 3.7-8.5 0.4-1.3 0-1.3-0.4-3.4-0.1-4.5 0.2-1.2 0.4-0.9 1.5-2.1 0.8-0.8 4.8-3.5 6.9-3.4 2.6-0.8 2 0.1 4.5 0.7 5.4 0.1 7.8 0.4 13.2-2.4 9.9-1.1 7.5-2.6 2.2-1.2 10.7-7.4 2.8-1.1 1.9-0.5 1.9 0.3 1.1-0.1 2.6-0.4 5.4-2.7 2.7-2 2-2 3.1-3.9 0.9-2.1 0.5-2.1 0.1-6.9 0.3-2.1 0.5-1.6 0.7-1.4 7-10.3 2.3-4.7 4.4 6.4 5.3 4.9 1.1 1.8 4 9 3.8 5.8 2.4 2.4 1.2 1.9 0.4 1.3-0.3 1.1-1 2.5-0.5 2.4-0.3 3.1 0.8 6.1 1 3.1 1.3 2.2 1.3 1.4 1.3 1.1 1.1 1.2 6.5 11.6 0.5 2.8-1.1 4.2 0.2 6.2 2.5 11.2 11.6 29.4 1.3 1.9 23.4 11.3-7.2 3-1.4 1.3 0.1 0.8 0.2 0.6 1.3 2.4 1 3.2z" id="NICO" name="Chontales" />
              <path d="M315.4 350.8l-1.6 2.8-1 2.9-0.5 3.2-0.1 4 1.7 8.1-2.7 7.8 0.5 2.4-0.6 3.1-2.1 3.6 1.2 2.6 1.3 2 13.8 13.9 8 4.7 2.9 3.5-6.9 9.5-1.2 4.8-0.5 1.1-0.8 1-1.5 1-2.3 0.9-4.7 1-2.2 0.7-4 2.4-1.5 1.3-0.6 0.8-2.9 6.1-1 6.8-22.5-6.6-6.1-3.1-1.9-3.3 0-1.6 0.2-2.1 4.1-7.2 0.4-5.9-1.3-4.7-1-1.6-1.8-2.6-4.9-8-3.3-3.4-1.4-0.7-2.2-0.6-10.2 2.2-12.1 4.1-3.8 0.8-2.1 0.2-3.6-1.8-2.9-1-2.4 0-1.8 0.1-3.2 1.3-2.1-11.2 0.6-5.9 0.5-1.7 0.2-0.2 1.9-1.7 15.4-15.6 3.4-4.9 1.6-3.3 7.5-13.2 7.3-6.4 4.9-0.7 1.9 0.6 2.7 1.3 7.8 3.7 7.8-1.3 14-4.5 10.2-0.5 3.5 1.1 0.7 1.2 1.8 4.2 1.5 2.5z" id="NIES" name="Estelí" />
              <path d="M441.9 671.8l-68.1-0.3-6 1.8-8.1 2.1-0.9-0.3-1.8-1.9-0.7-0.7-0.8-0.5-0.9-0.2-0.3-0.1-0.5 0.1-0.5 0.3-0.5 0.5-2.9 6.2-2 3.3-0.7 0.5-5.1 2.6-0.6 0.6-1.4 0.2-4.3-1.1-3.3-4.1-0.4-1.7-0.3-2.7 0.8-5.8 1.7-3.5 2.2-3 0.4-1.7 0-2.1-0.8-3.2-0.6-4.6 1-4.7 3.8-6.9 0.8-1.9 3.6-7.8 1.7-3.9 0.6-1.4 6.6-14.7 7.4-16.3-0.6-2.9-6.1-6.9 15.4-7 5.8-4.2 1.5-0.5 1.4 0 3.2 1.4 1.2 3.6 0.3 2.8 0.3 1.4 0.9 1.2 1.6 1.2 2.9 1.1 5 4.4 9.8 13.8 13.8-1 24.5 68.5z" id="NIGR" name="Granada" />
              <path d="M302.9 620.1l4.3-5.4 5 3.9 1.3 0.6 2.2 0.6 1.4-0.2 1.7-0.4 1.5-0.8 1.1-1.1 1-1.2 2.1-3.3 0.2-4.2-0.5-1.1-1-1.4-2.6-2.8-0.6-2.4 11.1-11 3.3-2.5 5.4-0.9 6.2-2.6 3.2-0.4 0.5 0 0.4 0.2 1 0.5 3.2 0.9 6.1 6.9 0.6 2.9-7.4 16.3-6.6 14.7-0.6 1.4-1.7 3.9-3.6 7.8-1.5-0.5-9.8-2.9-0.4-0.5-2.4-3.3-5.4-2.6-16.7-6.7-2-2.4z" id="NIMS" name="Masaya" />
            </g>

            {/* Silueta activa (revelada dinámicamente con clipPath al progresar la carga) */}
            <g clipPath="url(#nicaragua-loading-clip)" style={{ transition: 'clip-path 0.1s linear' }}>
              <g id="features-loading-active" fill="rgba(212, 175, 55, 0.15)" stroke="var(--atlan-gold)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M558.8 808.8l-10.4-6-15.7-5.4-24.6-9.1-9-3.8-16.4-6.1-7.5-6.8 43.9-90.6 3.3-5.7 0.5-0.6 0.8-0.7 2.8-1.4 3.7-2.6 1.6-0.9 1.2-0.5 0.9 0.3 0.4 0.2 0.9-0.1 3.4-1.3 1.1-0.7 0.6-0.4 0.6-1.1 0.9-1.1 1.3-1.4 0.2-0.3 0.2-0.4 0.3-0.4 0.7-0.9 0.4-0.5 0.2-0.8 0-0.2 0.5-1.2 2.7-4.3 7.9-1.7 4.6-3 12.1-11.2 0.6-0.9 0.8-0.3 1-0.1 13.5 0.1 3.7-0.6 0.8 0 1.6 0.4 0.7 0.1 2.8-0.3 0.6 0.1 0.7 0.1 0.9 0.4 2 0.4 7.1 0.3 3.7 12.9 2.7 5 1.5 1.3 1.2 1.2 0.4 1.2-0.2 2.3 0.3 4.8 1.9 4.8 1.9 5.8-0.1 1.6-0.3 2-1.8 4.3-2.6 9-0.6 3.6 0 2.5 1.3 7.2 0.7 7.2 12.2 4.5 5.3 3.3 14.6 9.1 2.8 2.9 1.1 2.5 0.2 2.3 0.3 2.4 1.4 2.9 1.7 1.7 1.7 1.2 8.6 4.5 7.2 5.2 5.2 5.2 1.6 2.1 3.7 6.2 1 1.1 0.7 0.5 0.6 0 0.6 0.1 0.7 0.3 1.2 0.7 0.5 0.2 1 0.3 1.4 0.5 0.5 0.1 0.5 0 1.8-0.2 1.2 0 0.5 0 1.2 0.3 3 1.2 2.3 0.8 5.8-0.8 1.2 0.1 0.6 0.4-0.2 1 0 0.6 0.1 0.4 0.2 0.4 2 2.1 1.8 1.5 1 0.5 0.7 0.1 1.6-0.8 1.2-0.3 0.4-0.1 0.8-0.5 0.4-0.3 0.9-0.5 0.7-0.2 1.3-0.3 1.1 0.2 1.8 0.7 0.8 0.1 0.7 0 0.4-0.3 0.5-0.1 0.4-0.2 0.4-0.3 1.5-0.6 1.7-0.2 0.9-0.2 2.6-1.3 0.5 0.2 0.3 0.3 0.1 0.6-0.3 3.4 0 0.6 0.2 1 0.2 0.5 0.6 0.8 0.6 0.6 0.3 0.4 0.2 0.4 0 0.6 0.1 1.2 0.1 0.7 0.3 0.8 0.8 0.9 0.6 0.4 0.6 0 0.4-0.2 0.4-0.2 0.4-0.3 1.3 0 2.1 0.2 7.2 1.4 1.4 0.4 0.4 0.3 0.6 0.6 3.4 4.4 2.6 4.4 4.8 5.1 3.1 2.5 1.5 4 3.2-0.6-0.7-2 1.4 0.4 1.5 3.2 0.4 0.2 0.3 1.1-0.5 2.5 1.8 1 0.1 4.1 1.7 6.6-0.5 5.1-6.5 3.3-12 2.9-1 0.2-12.1 4.6-3.8 4.5-0.7 0.4-5-1-1.2 0.4-2.6 1.8-1.7 0.3-1.8-0.2-1.2-0.6-11-8.8-0.9-3.2-2-1.4-2.5 0.5-2.1 2.1-3.2-0.7-4.5 2.9-2.2-2.2-1.3 0-2.1 1.6-2.1-0.8-3.4-3.3-2.2 0.4-1.6-0.3-1.3-0.2-2.9 0-2 1.5-1-1.3-4-3.2-0.4-0.7-0.8-0.8-0.3-1 0.8-1.5 0.7-0.5 2.6-1.3-0.7-4.5-3.2-2.7-3.5-1.8-1.6-1.8-1.9-1.3-8.6-3.3-1.9-1.8-0.5-1.3-2.4-3.1-0.9-1.4-0.3-2.3 0-1.9-0.4-1.4-1.8-0.9-1.5 1-9.9 6.4-1.7 0.8-2-0.2-2-0.8-1.6-0.9-1.6-1.4-4.2-5.2-0.7-0.5-0.9-0.5-1-0.4-1-0.3-9.1-4-4.2-1.4-4 0.2-3.2-0.4-6.9-5.1-3.3-1.4-5.7 1.4-13.6 9-18.9 12.5z" id="NISJ" name="Rio San Juan" />
                <path d="M807.2 418.1l-3.4 0.5-9.2-0.6-7.4 0.3-3.4-1.1-18-10.5-13.8-10.1-0.8-0.8-0.5-0.8-0.2-1 0.1-1.1 0.4-1.1 0.7-1 3.4-4.3 0.7-1.1 0.4-1.1 0.1-1.1-0.7-0.8-1.4-0.8-3.1-0.8-1.9-0.8-1.5-0.9-1.8-0.8-3.6-0.5-14.8-0.6-2.8-0.3-0.7-0.5-2-0.3 1.1 2.2 0.2 1.9-0.7 0.8-1.7-1.1-1.3 0-1.6 1-0.9-0.1-1.2-0.9-1.5 4-2.2 0.5-2.8-1.1-3.5-0.7 0.9 1 1 1.9 0.6 0.9-2.9-0.6-4.4 1.3-1.6-0.7-1.2-0.3-1-1.2-0.7-1.3-3.6-11.2-0.5-0.9-1.4-0.4-2.5 0.4-11 3.1-1.8 0-2.2-0.6-1.2-0.8-1.2-0.6-1-0.2-1.3-0.2-1.2 0.1-1.4 0.4-1.9 1.3-2.3 2.5-2.3 0.8-3.6 0.5-25.6 0.1-47.3 5.8-3.4-5.1-18.3-23.3-1.1-1.9-0.6-0.7-0.8-0.2-16.6 15.5-1.6 0.7-2.9 0.3-12.1-0.3-6.1 0.6-4.7 2.8-2.4 3.3-1.5 3.4-2.1 6.6-2.3 4.7-1.6 1.9-1.8 1.3-5.2 2.5-4.8 1.2-2-0.3-5.6-2.4-1.3-1.8-2.2-0.3-0.3-0.4-0.3-1.7-0.3-0.6-0.7-0.4-2.5-1.3-1.4-1-0.8-0.2-0.6 0-1 0.3-1.1 0.1-0.6 0-0.5-0.1-0.5-0.2-0.4-0.2-5.2-4.9-1-0.8-0.9-0.5-2.5-1-3.6-3.6-9.3-12.6-3.9-8.6 0.1-6.7 1-2.4 5.7-5.1 9.9-6.5 2.1-1.7 0.6-1.4 0.2-1.8-0.1-0.9 0.1-3.4 1.9-5.9-0.2-1.8-0.9-2.5-1.3-2.1-1.4-3.2-0.2-1.7 0.3-1.2 1.9-1.2 1.3-1.5 1.5-2.3 1.6-4.5 0.9-1.7 0.9-1.1 14.7-2 0.4-0.1 22.4-14 0.7-0.2 17.5 8.1 0.8-0.4 0.9-0.9 23.3-37.4 11.1-18.8 1.7-3.7 0.4-2.2-1.7-6.9 0.6-8.8 4-21.6 0.3-4.6-0.5-2.6-16.4-1.1-1.3-0.3-0.9-0.6-2.7-3.2-3-2.9-3.5-4.5-0.5-1.4-0.1-1.2 0.4-1.3 1.4-2.6 0.2-0.9-0.2-4.1 0.3-1.2 2-3.6 0.4-1.8-0.3-1.5-0.7-1.2-0.8-0.7-2.7-1.5-2.5-2-0.3-0.4-0.1-0.6 0.1-1.8-0.1-1.6 0.1-1.1 0.4-2 0-0.8 0-1.1 0.3-1.2 1-2.7-0.1-1.2-0.3-1.2-0.4-0.8-0.4-0.7-0.6-0.5-0.5-0.3-1.3-0.3-0.9-0.1 0.2-0.6-4.7 0 1.1-1.5 4-3.8-5.2-3.7-1-1.8 2.9-0.8 1-0.5 0.6-1.1 0.9-7 1.6-3 2.5-2.4 0.4-0.2 2.9-1.9 3.3-2.4 8.4-8.2 3-1.7 10.9-2 4.9-0.2 4.7 1.4 4 3 2.7 4.5-0.5 0.5-1.5 1.9-0.1 0.4 3.7 0.4 0.5 2.3-0.2 2.5 3.7 2.6 2 3.2 2.7 6.5 3.4-2.1 3.5 0.4 7.1 3.1 4.1 0.9 13.4 0.4-0.7 1.3-0.5 3.7 2.8-0.9 1.9 1.1 1.9 1.7 2.8 0.8 2.1-0.6 4.7-2.6 6.8-2.5 3.4-4.1 2.6-4.8 2.4-3.6 1.8 1.8 1.3 4.9 1.4 1.1 2.8 0.2 4.4 1 2 0.2 3.8-2 0.9-4.2-0.9-8.9 1-2.2 2.3-0.2 2.5 0.9 1.7 0.9 1.4 1.2 4.3 4.7 2.3 0.9 2.7-0.2 4.4-1.3 1.1-0.6 0.8-0.9 0.9-0.8 1.7-0.4 1.5 0.3 0.9 0.4 0.7 0.1 1.3-0.8 0-1.4-1.6-1.6-1.3-1.7-2.1-4.5 2-1.6 1.3-0.1 4.2 2.6 0.5 0.9 0.7 0.7 1.9 0.2 3.1-0.1 1 0.6 0.3 1.4 3.2 0.4 18.1-1-1-1.5 0.1-1.8 0.9-4.3 2.2 1.2 3 3.2 2.3 0.6-0.2-0.8-0.9-1.7 1.3 0.5 0.7 0.2 0.7 0.5 1 1.3 2.2-2 3.3-1.8 3.6-1.2 3.4 0-1.4-1-0.9-0.9-1.3-2.2 10.2-0.7 3.8-1.4-0.4-3 2.4-0.1 1.8 0.2 1.4 0.9 0.7 1.6 1.4 0-1.8-5.4 0.7-2.2 3.4-1.6 3.7-0.5 4 0.2 3.4 1 1.6 2 1.3 0 0.8-2.3 0.4-2.5 0.9-2.1 4.5-1.7 4.6-3.7 2.6-0.7-0.3-0.7-0.5-1.4-0.4-0.5 2.7 0.8 1 0.5-0.6-2.6 0.3-2.2 1-0.8 1.8 1.7 0.1-2.9 0.3-1.2 1-1.2-1.3-1.9 0.7-0.9 1.8-0.2 2.4 0.4 1 0.9 2.2 3.5 1.7 0.9 4.3-0.5 3.7-2.2 2.9-3.2 1.7-3.3 2.3 1.8 2.4 1 1.9 1.2 0.9 2.5 2.8-1.9 3.2-0.2 8 0.9-2.1 1.1-0.2 1 1.4 0.9 2.2 0.9 0.7-0.1 8.2 0.1 4.8-2.2 2.6-0.5 6.1 0.3 2.5-0.4-1.4 2-3.3 1.6-1.7 1.7-2.7-3.2-2.2 2.3-1.8 4-1.3 2.1-2.4 1.2-2.2 2.7-1.6 3.2-0.7 2.6-0.5 0.9-2.3 2.3-1 1.4-0.4 1.8-0.4 4.1-0.4 1.8-1.5 2.4-2.2 1.7-6.3 2.5 0.4-1.1 0.5-0.9 1.6-1.9 0 1.5 0.6-1.1 0.4-0.9 0.1-0.9 0-1.3-1.4 0.9-0.6 0.2-1.6-1.1 0-1.1 2.2-1.1 2.1-0.2 1.8 0.6 1.4 1.8-0.1-3.5-2-4.9-0.5-3.9-1.2-3.8-2.6-0.6-2.9 1.1-2.2 1.4-3.6 3.4-8.1 10.5-2 4.5 1.8-1.9 0.6-0.9 2.6 2.1 2 7.7 1.2 1.8 2.4 1.4 2.6 2.6 2.8 0.9 2.8-3.5-1.3-1.2-3.4-2.1-1.5-0.6 2-1.2 2.2 0.7 1.9 1.8 1.5 2.6-0.1-4.3 1.3-1.4 1.6 1.7 7.2 33.2 0.4 1 1.7 3.6 1.5 9 8.9 25.9 1 7.5-0.9 6.4-5 12-15.2 24.6-6.6 8-0.9 3.2-1.3 2.3-8.7 6.1-3.7 5.2-2.6 6.1-4.4 17.5-7 23.8-4.4 21.5 0.3 9.3-0.8 4.5 0 3.6-3.8 9.3-3.3 12.5-2 24.2 0.3 4.6 1.3 2.6-1.3 1.2 1 2.3 6.1 37.2z m139.7-260.6l3-1.5 2.4 0 1.6 1.6 0.6 3.1-1.2 5.2-3.4 1.6-9.7-0.9-0.8-0.1 0.7 0 0.1 0 0.4-0.1 0.2-0.4 0-0.8 2.9-1.6 1.2-2.2 0.7-2.1 1.3-1.8z" id="NIAN" name="Atlántico Norte" />
                <path d="M533.4 121.8l0.9 0.1 1.3 0.3 0.5 0.3 0.6 0.5 0.4 0.7 0.4 0.8 0.3 1.2 0.1 1.2-1 2.7-0.3 1.2 0 1.1 0 0.8-0.4 2-0.1 1.1 0.1 1.6-0.1 1.8 0.1 0.6 0.3 0.4 2.5 2 2.7 1.5 0.8 0.7 0.7 1.2 0.3 1.5-0.4 1.8-2 3.6-0.3 1.2 0.2 4.1-0.2 0.9-1.4 2.6-0.4 1.3 0.1 1.2 0.5 1.4 3.5 4.5 3 2.9 2.7 3.2 0.9 0.6 1.3 0.3 16.4 1.1 0.5 2.6-0.3 4.6-4 21.6-0.6 8.8 1.7 6.9-0.4 2.2-1.7 3.7-11.1 18.8-23.3 37.4-0.9 0.9-0.8 0.4-17.5-8.1-0.7 0.2-22.4 14-0.4 0.1-14.7 2-0.9 1.1-0.9 1.7-1.6 4.5-1.5 2.3-1.3 1.5-1.9 1.2-0.3 1.2 0.2 1.7 1.4 3.2 1.3 2.1 0.9 2.5 0.2 1.8-1.9 5.9-0.1 3.4 0.1 0.9-0.2 1.8-0.6 1.4-2.1 1.7-9.9 6.5-5.7 5.1-1 2.4-0.1 6.7-10.2 6.7-3.6 1.4-4.3 0-3.8 2.6-2.6 3-2.7 4.3-3.2 5.5-13.3 15.8-6.9 6-2 1.1-8.5 7.4-10.4 9.8-4 2.9-1.8 0.6-2.4 0.3-6.6-0.2-2.2 0.3-0.9 0.5-2.4 2.9-6.3-4.8-2.9-2.9-2.6-1.6-1.7-0.7-2.5 0.1-0.9-0.1-2.9-3.5-8-4.7-13.8-13.9-1.3-2-1.2-2.6 2.1-3.6 0.6-3.1-0.5-2.4 2.7-7.8-1.7-8.1 0.1-4 0.5-3.2 1-2.9 1.6-2.8 6.7-7.2 3-2.7 2.9-0.5 2.6-0.1 2.3 1 1.7-2.1 7.1-5.7 1.8-2.1 1.8-2.2 2-0.8 1.9 2.4 1.8-0.8 9.6-0.8 3.2 0.2 2 1.2 1.6 1.4 1.7 0.9 2.4-0.3 1.3-0.9 3.1-4.4 4.1-3.1 3.3-1.7 2.1-2.4-0.4-11.2 0.6-4.7 1.7-4.4 5.3-9.1 0.8-2.3 0.5-2.5 0.3-8.9 1.1-3.1 1.8-2.2 4.4-2.7 0.1 0.1 0.4-0.4 1.3-1.2 1.5-3 0.4-2.9-1-2.2-2.8-0.9-0.7-1.6 0.8-3.7 1.8-5.6 0.2-4.2 0.9-1 1.9 0.4 3.3 0.3 2.3-1.1 3.7-3.3 1.6 0.5 1.1 0-0.1-0.9 0.3-0.2 0.5 0 0.6-0.2-0.6-2 6.4-2 1.8-1.8 1.7-2.6 4-1.4 1.6-0.3 3-0.5 3.4-1.1 1.8-2.6 0.4-3 1-2.5 6.6-1.9 3.1-1.8 4.8-3.7 2.1-2.7 2-3.6 1.5-3.6 1.4-4.8 1.7-3 2.1-2.8 1.8-1.7 0.8-0.1 2 0.3 0.7-0.2 0.5-0.6 0.6-1.4 1.3-1.6 0.7-1.2 1-1.1 1.7-0.4 4.4-2.2 1.9-0.4 6.9 0 4.6-0.8 4.6-1.5 3.7-2.3 2.1-3.2-0.1-4.3-2.4-3.7-3.3-3-2.9-2 5-3.9 0.2-1.2-0.4-2.9 0.2-1.2 4.2-4.5 0.7-1.2 0.4-9.6 0.7-5.2 1.5-2.7 3.3 0.8 3 3.3 3.1 2.3 3.9-1.8 6.5-6.6 1.1-2.6z" id="NIJI" name="Jinotega" />
                <path d="M401.5 269l-4.4 2.7-1.8 2.2-1.1 3.1-0.3 8.9-0.5 2.5-0.8 2.3-5.3 9.1-1.7 4.4-0.6 4.7 0.4 11.2-2.1 2.4-3.3 1.7-4.1 3.1-3.1 4.4-1.3 0.9-2.4 0.3-1.7-0.9-1.6-1.4-2-1.2-3.2-0.2-9.6 0.8-1.8 0.8-1.9-2.4-2 0.8-1.8 2.2-5.5-6.7-4.1-7.2-1.8-2.3-1.5-1.5-6.3-5.2-3.6 1.2-4 1.6-0.5 0.9-0.6 1.2-1.1 5.4-1.7 2-5.5-2.5-3.6-2.2-2.8-0.8-2.2-0.3-7.6 1-5.9 0.1-10.2-3.4-13.2-0.2-1.8 0.2-4.1 1.1-1.9 1.8-2.9 1.4-2.2-2-2.1-1.2-3.1-1.2-2-1.4-1.7-1.8-0.8-1.6-3.6-5.4-12.8-2.4-4.1-0.1-0.8 0.7-0.6 0.6-1.4 1.9-1.5 1.1-0.8-0.5-0.7-1-0.3-1.7 0.5-10.1 0.2-3.2 0.4-2.7 0.3-1.1 0.9-0.8 2.1-1.5 4.1-2.1 3.9-0.3 8 1 14.9-2.9 7.3-0.4 6 3.4 3.3 0.9 2.6-0.9 2.5-1.3 2.7-0.3 2.9 2.9 1.1 0.8 1.7 0.6 1.3 0.2 9.4-0.6 3.4-0.9 2.7-1.3 2.2-2.4 1-2.9 1.5-5.6 2.9-4.6 12-12.9 6.3-10 1.9-1.2 2.2-0.9 2.2-1.1 2.1-2.3 1.4-2.4 0.7-1.8 0.9-1.7 2.1-1.8 2.5-1.3 14-2.1 0 2.1-2 4 0.5 5 13 9.5 3.9 5.2 1.3 1.2 2.5 0.9 1.7-0.4 1.7-0.7 2.5-0.1 4 1.7 2.1 3.3 1.8 3.9 3 3.5 4 1.5 4.3-0.2 3.7 0.3 2.5 2.8 0.3 0.1z" id="NINS" name="Nueva Segovia" />
                <path d="M220.1 373.7l0.2 0.4 3.5 0.7 1.1 0.8 0.5 1.6 0.2 1.4-0.1 1.1-0.2 1.1-0.2 0.4-1.7 5.4-1.9 1.7-0.2 0.2-0.5 1.7-0.6 5.9 2.1 11.2 1.8 6.4 3.9 9 2.5 4 2.3 5.3 1.7 22.7-0.6 5.9-2.3 5.3-3.2 2-1.5 0.6-2.6 0.6-13.2 1.8-2 1.1-1.3 1.3-2.6 4.9-3.5 4.3-3.6 1.6-4.5 4.9-4.6 5.1-3.6 3.4-0.7 1.2-1.4 3.7-3.7 6-9.5 9.9-1.8 1.1-3.1 1.8-3.1 1.4-9 1-4.1 2.4-0.3-0.3-2.4-1.9-2.5-0.8-1.6-1.2-4.1-7.9-1.2 0 1.9 7-3-2.6-4.8-6.1-3.5-3.4-2.3-1-11.4-8.9-1.5-1.6-0.9-1.9-1-3.3-0.5 1.1-1.4 1.7-0.6 1-20.1-23.5-2.4-4.9 0.8 0.9 0.8 0.5 2.2 1.2 0-1.2-0.9-0.3-1.6-1.1 0-1.1-0.5-1.9-3.1-2.6-4.1-2.3-3.7-0.9 0 1.1 4.9 3.2 2.5 2.4 0.1 2.1-1.9-0.2-2.7-2.1-4-4-21.5-12.9-4.5-4-2.7-4.7 0-5.5 3.4-6.5 5.2-4.5 5.3-3.4 3.8-4.1 0.9-7.3 1.2 0-0.5 4.1-0.7 1.1 2.1 0 2.5 0.3 2.1 0.7 0.9 0.9 0.8 0.5 4.7 4 1.1 0.7 3.4 4.4 0.8 0.7 2.3 1.4 0.6 0.5 0.2 1.2-0.4 2.9 0.2 1.2 6 6 7.8 1.7 18.9-1.2 0-1.4-9.6 0.2-4.8-0.5-2-1.7 1.8-3 8.9-4.4 1.2-0.9 42-2.7 2.7 0.3 4.3 2.6 2.1 0.2 1-3.1 3.8-1.9 4.7-2.9 2.1-2.3 4.3-6.7 1-0.9 2.7-1.3 1-1 0.5-1.8-0.8-0.7-1-0.5-0.4-1.1 1.5-9.9-0.3-0.5-1.4-3-0.3-1.1 0.3-0.5 1.3-5.3 1.3-2.6 1.5-1.8 8.8-7.6 2.4-1.7 3-0.8 3.1 0.2 10.6 5.3 1.7 0.5 1.7-0.5 1.3-0.9z" id="NICI" name="Chinandega" />
                <path d="M343.5 331.4l-1.8 2.1-7.1 5.7-1.7 2.1-2.3-1-2.6 0.1-2.9 0.5-3 2.7-6.7 7.2-1.5-2.5-1.8-4.2-0.7-1.2-3.5-1.1-10.2 0.5-14 4.5-7.8 1.3-7.8-3.7-2.7-1.3-1.9-0.6-4.9 0.7-7.3 6.4-7.5 13.2-1.6 3.3-3.4 4.9-15.4 15.6 1.7-5.4 0.2-0.4 0.2-1.1 0.1-1.1-0.2-1.4-0.5-1.6-1.1-0.8-3.5-0.7-0.2-0.4 1.4-0.9 2.5-2.3 1.4-2.5 0.4-2.9-1.1-5.4-0.4-1.1-1.3-2.4-1.2-1.1-1.2-0.3-1.1-0.5-0.7-1.9 0.3-2.7 2.3-5.2 0.3-3-5.9-22.6-0.1-3.2 1.1-6-0.1-3-0.7-1.2-1.6-1.3 1.5-1.1 1.4-1.9 0.6-0.6 0.8-0.7 4.1 0.1 12.8 2.4 3.6 5.4 0.8 1.6 1.7 1.8 2 1.4 3.1 1.2 2.1 1.2 2.2 2 2.9-1.4 1.9-1.8 4.1-1.1 1.8-0.2 13.2 0.2 10.2 3.4 5.9-0.1 7.6-1 2.2 0.3 2.8 0.8 3.6 2.2 5.5 2.5 1.7-2 1.1-5.4 0.6-1.2 0.5-0.9 4-1.6 3.6-1.2 6.3 5.2 1.5 1.5 1.8 2.3 4.1 7.2 5.5 6.7z" id="NIMD" name="Madriz" />
                <path d="M558.8 808.8l-4.3 1.6-4.2-0.5-29.6-11-26.3-9.8-6.6-2.4-24.8-9.2-18.5-6.9-5.9-3.4-5.2-4.6-5.3-2.8-6.1 2.6-5.1 7-3.4 7.3-4.4 7.2-0.1 0-9.2-3.8-3.5-0.6-2.6-1.4-1.5-3.3-1.7-6.8-3.3-5-19.6-22-1.6-1.2-0.8-0.4-2.9-2-0.6-0.8-6.3-1.8-2.9-2.6-6.1-7.5-4.9-2.6-6.3-6.6-7.9-4.6-2.7-2.4-0.7-1.5-1.6-5 0-0.1 5.3-9.7 1.2-2.3 0.6-0.7 6.4-4.3 4.3 1.1 1.4-0.2 0.6-0.6 5.1-2.6 0.7-0.5 2-3.3 2.9-6.2 0.5-0.5 0.5-0.3 0.5-0.1 0.3 0.1 0.9 0.2 0.8 0.5 0.7 0.7 1.8 1.9 0.9 0.3 8.1-2.1 6-1.8 68.1 0.3 77.2 9.2-43.9 90.6 7.5 6.8 16.4 6.1 9 3.8 24.6 9.1 15.7 5.4 10.4 6z" id="NIRI" name="Rivas" />
                <path d="M772.6 809.5l-3.1-2.5-4.8-5.1-2.6-4.4-3.4-4.4-0.6-0.6-0.4-0.3-1.4-0.4-7.2-1.4-2.1-0.2-1.3 0-0.4 0.3-0.4 0.2-0.4 0.2-0.6 0-0.6-0.4-0.8-0.9-0.3-0.8-0.1-0.7-0.1-1.2 0-0.6-0.2-0.4-0.3-0.4-0.6-0.6-0.6-0.8-0.2-0.5-0.2-1 0-0.6 0.3-3.4-0.1-0.6-0.3-0.3-0.5-0.2-2.6 1.3-0.9 0.2-1.7 0.2-1.5 0.6-0.4 0.3-0.4 0.2-0.5 0.1-0.4 0.3-0.7 0-0.8-0.1-1.8-0.7-1.1-0.2-1.3 0.3-0.7 0.2-0.9 0.5-0.4 0.3-0.8 0.5-0.4 0.1-1.2 0.3-1.6 0.8-0.7-0.1-1-0.5-1.8-1.5-2-2.1-0.2-0.4-0.1-0.4 0-0.6 0.2-1-0.6-0.4-1.2-0.1-5.8 0.8-2.3-0.8-3-1.2-1.2-0.3-0.5 0-1.2 0-1.8 0.2-0.5 0-0.5-0.1-1.4-0.5-1-0.3-0.5-0.2-1.2-0.7-0.7-0.3-0.6-0.1-0.6 0-0.7-0.5-1-1.1-3.7-6.2-1.6-2.1-5.2-5.2-7.2-5.2-8.6-4.5-1.7-1.2-1.7-1.7-1.4-2.9-0.3-2.4-0.2-2.3-1.1-2.5-2.8-2.9-14.6-9.1-5.3-3.3-12.2-4.5-0.7-7.2-1.3-7.2 0-2.5 0.6-3.6 2.6-9 1.8-4.3 0.3-2 0.1-1.6-1.9-5.8-1.9-4.8-0.3-4.8 0.2-2.3-0.4-1.2-1.2-1.2-1.5-1.3-2.7-5-3.7-12.9-1-3.2-1.3-2.4-0.2-0.6-0.1-0.8 1.4-1.3 7.2-3-23.4-11.3-1.3-1.9-11.6-29.4-2.5-11.2-0.2-6.2 1.1-4.2-0.5-2.8-6.5-11.6-1.1-1.2-1.3-1.1-1.3-1.4-1.3-2.2-1-3.1-0.8-6.1 0.3-3.1 0.5-2.4 1-2.5 0.3-1.1-0.4-1.3-1.2-1.9-2.4-2.4-3.8-5.8-4-9-1.1-1.8-5.3-4.9-4.4-6.4-1-1-2.1-1.1-0.2-0.6-0.1-0.9 0.6-2.9-0.3-3.4-0.8-2.4-1.6-3-1.1-1.3-1.1-1-1.6-0.9-1.5-2.3-0.9-0.4-5.3-4.1-3.4-1.8-3.5 0.1-3.5 3.1-0.9 2.3-0.7 5.2-0.8 2.8-0.5-0.1-1.5 1-1.3 1.1 0 0.6-0.6 0.3-2.4 2.4 1.8 3 0.2 2.8-1.4 1.4-3.1-0.9-4.8-10.3-1.4-6.3-0.8-2.1-1.8-3.6-0.2-1.8 0.4-1.8 0.7-1.5 1.2-1.2 1.6-0.9 2.7-0.2 2 0.3 2.2 0.1 1.8-0.6 2.1-1.9 0.6-1.8 0-3 0.6-0.9 1.9-0.3 1.5 0.4 3.3 0.9 2 0.3 2.2-0.1 2.6-0.5 5-1.5 1.8-0.2 10.9 1.9 2.4 0.7 0.7-0.8 2.2-1.5 1.2-1 1.8-2.9 1.3-3.1 3.7 0.7 4.2-2.8 3.8-3.7 2.7-1.9 2.2-0.2 3.5-1 2.5-0.1 2.3 0.6 1.1 0.8 1 0.1 1.9-1.5 1.1-0.4 0.7 0.2 0.6-0.2 0.3-2.8 0.8-1.9 0.2-0.6 0.2-2.7 1.2-6.3 0.7-1.6 3.9-4.3 0.1-0.1 1.2-0.9 0.7-0.5 0.1-0.1-0.5-0.1-0.4 0.1-0.6 0.1-0.4 0.2-2 1.2-0.6 0.1-0.5 0.1-0.6 0-0.6-0.1-0.5-0.2-0.4-0.2-0.4-0.3-0.6-0.7-0.5-0.7-2.6-5.5-1.2-3.7-0.2-0.4-1.4-1.9-0.8-0.6-0.4-0.2-0.4-0.2-0.5-0.1-0.5-0.2-0.4-0.3-1.3-1.2-0.4-0.2-0.4-0.2 0.6-1.3 0.6-1 7.9-10.6 47.3-5.8 25.6-0.1 3.6-0.5 2.3-0.8 2.3-2.5 1.9-1.3 1.4-0.4 1.2-0.1 1.3 0.2 1 0.2 1.2 0.6 1.2 0.8 2.2 0.6 1.8 0 11-3.1 2.5-0.4 1.4 0.4 0.5 0.9 3.6 11.2 0.7 1.3 1 1.2 1.2 0.3 1.6 0.7 4.4-1.3 2.9 0.6-0.6-0.9-1-1.9-0.9-1 3.5 0.7 2.8 1.1 2.2-0.5 1.5-4 1.2 0.9 0.9 0.1 1.6-1 1.3 0 1.7 1.1 0.7-0.8-0.2-1.9-1.1-2.2 2 0.3 0.7 0.5 2.8 0.3 14.8 0.6 3.6 0.5 1.8 0.8 1.5 0.9 1.9 0.8 3.1 0.8 1.4 0.8 0.7 0.8-0.1 1.1-0.4 1.1-0.7 1.1-3.4 4.3-0.7 1-0.4 1.1-0.1 1.1 0.2 1 0.5 0.8 0.8 0.8 13.8 10.1 18 10.5 3.4 1.1 7.4-0.3 9.2 0.6 3.4-0.5 4 24.5-6.1 49.5 0 11 0.6 1.8 2.6 5.4 1.8 6 5.1 7.2 1.2 4.6-0.4 5.8-2 3-3.7 1.3-5.9 0.2-4.5 0.9-4.5 1.7-4.3 0.7-3.7-2 1.4-1.4 3.8-2.7 1.1-1.2 0.1-2.2-0.7-2.9-1.1-2.6-4-3.6 0.3-12.3-0.9-4.7 0.7-0.3 0.2-0.1 0.1-0.1 0.4-0.7 1.1 0 6.5 2.1 4.5-5.8 1.6-8.5-2.4-5.7 0-1.4 1.5-1.8 0.7-2.5 0.3-10.5 0.3-0.4 0.7-0.6 0.9-1 0.6-1.3-0.7-5-3.5-3-4.9-1.2-4.7 0.4-3.8 2.2-1.6 3.5 0.1 3.8 1.4 3.3 4.1 2.2 0.4 0.3-0.1 0.7 0.4 3.2 0.2 1.3 0.8 1.3 0.9 0.5 0.7 0.7 0.2 2 0 3.1-0.4 1.3-0.9 1.5 0.7 0.9 1.9 2.9-5.7 3.4-9.8 8.2-5.9 2.5-7.9 0.9-3.3 1.1-1.4 2.4 0 9.8 0.2 0.2 0.7-0.4 1.6 0.1 2.2 0.5 1.5-0.1 1.2 0.4 1.5 1.8 1.2 8.4-0.7 4-1.3 3.8-0.6 3.5 1.4 3.5 3.4 1.6 5.7-1.2 1 2.9-0.2 1.9-1 3.6-0.2 2.2 0.4 1.1 0.9-1.7 2.9-9.6 1.1-2.4 1.6-1 3.6 0.5 0.8 1.5-8.6 17.2-4 22.2 1.3 24 1.4 4.1-1.3 0.7-1.3 0.5 0.7-3.8-1.3-3.2-4.6-5.7-1.9-4.8 1.6-2 2.7-1.8 1.4-4.4-0.9-3.1-2.4-3.7-3.3-3.2-3.4-1.6-5.6 0.6 0.3 2.8 2.9 1.7 2.4-2.5 1.4 0 3.1 3.2 1.2 2 0.5 2.5-0.6 3.1-2.8 4.1-0.3 3-1 3.6-3.3 0.1-7.6-2.3-1 0.6 2.3 1.4 4.5 1.8 1 1.5 0.8 2 0.4 2.3 0.1 2.5-0.3 1.7-1.7 3.4-0.3 1.4 0.3 1 0.6 1.1 0.4 1.2-0.2 1.2-1 1.2-1 0.5-1 0.4-0.6 0.5-3.4 4.4-1.1 0.7-1.6 0.6-1.8 1.3-1.5 1.7-0.8 1.6 2.4 1.7 3 2.6 2.5 2.9 1.5 3.6 1.4 1 1.8 0.7 1.8 0.2 2.7-0.3 0.2-0.9-0.7-1.2-0.3-1.4 1.2-3.7 1-1.9 1.7-0.7 3-0.1 1.8 1.5 8.5 34.2 0.4 6.6-0.1 2.4-0.2 1.4-0.7 1.2-1.5 1.4-0.3-0.6-2.6 0.6-2.6 0.8-0.2 0.4-1.4 0.7-1.8 2.7-1.7 0.6-2.2 0-1.8 0.3-1.5 0.7-1.5 1.4-1.9 5.8-1.8 8.8-2.4 6.6-3.9-0.6-1.2 0-5.8 7.4-1.7 2.9-0.9 3.2 0 18.9 5.6 24.5 4 9.8 5.5 8.5 1.8 4.6 4.3 7.1 1.6 1.4 3.3 2.1 1.3 3.6z m-1.4-174.8l-1.4-5-0.4-6.8 1.3-5.9 3.7-2.6 0.3 0 0.2 0.2 0.1 0.3-0.1 0.6-1.2 2-1.3 3-0.9 3.4-0.3 3.1 1 6.8 0.1 2.5-1.1-1.6z m123.2-49.7l-0.4-4.1 1.8-3.3 2.5-1.4 2.1 1.7-0.7 1.3-5.3 5.8z" id="NIAS" name="Atlántico Sur" />
                <path d="M149 526l4.1-2.4 9-1 3.1-1.4 3.1-1.8 1.8-1.1 9.5-9.9 3.7-6 1.4-3.7 0.7-1.2 3.6-3.4 4.6-5.1 4.5-4.9 3.6-1.6 3.5-4.3 2.6-4.9 1.3-1.3 2-1.1 13.2-1.8 2.6-0.6 1.5-0.6 3.2-2 2.3-5.3 0.6-5.9-1.7-22.7-2.3-5.3-2.5-4-3.9-9-1.8-6.4 3.2-1.3 1.8-0.1 2.4 0 2.9 1 3.6 1.8 2.1-0.2 3.8-0.8 12.1-4.1 10.2-2.2 2.2 0.6 1.4 0.7 3.3 3.4 4.9 8 1.8 2.6 1 1.6 1.3 4.7-0.4 5.9-4.1 7.2-0.2 2.1 0 1.6 1.9 3.3 6.1 3.1 22.5 6.6-0.6 4.6-2.1 18.7-1.9 16.5-7.2 4.5-2.7 2.5-1.5 2.1-0.5 1.1-0.2 0.9 0 0.7-0.3 1.9 0 0.7 0.1 0.5 0 0.9-0.3 1.2-1.1 3.3-0.2 0.9 0.1 0.5 0.4 0.9 0.2 0.5 1.7 2.5 0.1 0.1 1 0.9 0.3 0.4 0.1 0.5 0 1.1 0.1 0.7 0.3 0.7-0.3 0.5-0.7 0.9-17.9 17.7-12.2 12.4-2.6 3.6-0.3 2.9 0 13.3 0.3 1.3 0.5 1.1 0.7 0.6 0.9 0.6 1.2 1.4 0.3 3.3-2.4 5.2-3.5 4.2-6.9 5.3-1.1 0.5-0.5 0-2.6-0.5-2.6-1-0.4-0.1-0.4 0-0.5 0.1-0.5 0.1-2.8 1-1.3 0.3-0.6 0.3-0.5 0.3-0.3 0.4-0.2 0.4 0 0.6 0.1 0.5 0.3 1 1.2 2.6 0.9 1.1 0.2 0.4 0.2 0.6 0 0.5-0.1 0.5-0.8 1.4-0.6 0.7-4.6 3.3-3.5-4.4-6.9-12-6.5-17.7-1.8-2.8-4.5-4-37.6-23-2.3-2.9-10.3-6-5.6-6-12.7-5.8-0.5-4.3 2.1 2.8 3.6 2.4 4.2 1.7 4 0.8-4.2-4.7z" id="NILE" name="León" />
                <path d="M231.5 611.9l4.6-3.3 0.6-0.7 0.8-1.4 0.1-0.5 0-0.5-0.2-0.6-0.2-0.4-0.9-1.1-1.2-2.6-0.3-1-0.1-0.5 0-0.6 0.2-0.4 0.3-0.4 0.5-0.3 0.6-0.3 1.3-0.3 2.8-1 0.5-0.1 0.5-0.1 0.4 0 0.4 0.1 2.6 1 2.6 0.5 0.5 0 1.1-0.5 6.9-5.3 3.5-4.2 2.4-5.2-0.3-3.3-1.2-1.4-0.9-0.6-0.7-0.6-0.5-1.1-0.3-1.3 0-13.3 0.3-2.9 2.6-3.6 12.2-12.4 17.9-17.7 0.7-0.9 0.3-0.5-0.3-0.7-0.1-0.7 0-1.1-0.1-0.5-0.3-0.4-1-0.9-0.1-0.1-1.7-2.5-0.2-0.5-0.4-0.9-0.1-0.5 0.2-0.9 1.1-3.3 0.3-1.2 0-0.9-0.1-0.5 0-0.7 0.3-1.9 0-0.7 0.2-0.9 0.5-1.1 1.5-2.1 2.7-2.5 7.2-4.5 31.1 6.9 3.3 1.1 2.7 2.5 2.8 3.2 2 1.6 1.8 1.2 11.3 4.4 3 0.6-1.1 3.3 0.7 6.3 0.9 2.7 1.2 2.1 2.4 3.1 4.6 5.1 0.6 1 0.2 1.2-0.3 3.7-0.1 3.1 0.3 1.4 0.6 0.9 16.1 15.2 0.3 0.7-0.3 1.1-3 4.6-1 5.2-3.2-1.4-1.4 0-1.5 0.5-5.8 4.2-15.4 7-3.2-0.9-1-0.5-0.4-0.2-0.5 0-3.2 0.4-6.2 2.6-5.4 0.9-3.3 2.5-11.1 11 0.6 2.4 2.6 2.8 1 1.4 0.5 1.1-0.2 4.2-2.1 3.3-1 1.2-1.1 1.1-1.5 0.8-1.7 0.4-1.4 0.2-2.2-0.6-1.3-0.6-5-3.9-4.3 5.4-2.2 3.3-11.5 9.4-3.5 5.8-1.4 1.3-4.9 3.7-1.9 2.8-2.3 2.2-0.7 0.4-1 0.3-2.1 0.6-1.1 0.1-1.5 0.1-1.8 1.1-4.6 4.5-2.5-3.1-4.9-11.1-2-1.6-1.8-1-4.8-4.9-2.9-4.1-3.1-5.9-0.6-2.8-0.9-2.6-2.1-2.2-4.5-3.5-0.8-1z" id="NIMN" name="Managua" />
                <path d="M335.8 684.9l-6.4 4.3-0.6 0.7-1.2 2.3-5.3 9.7 0 0.1-0.2-0.6-5.6-2.5-6.9-6.7-16.8-7.4-2.9-2.1-2.4-2.9-2.1-5.9-21.9-16.8-1.1-1.4 4.6-4.5 1.8-1.1 1.5-0.1 1.1-0.1 2.1-0.6 1-0.3 0.7-0.4 2.3-2.2 1.9-2.8 4.9-3.7 1.4-1.3 3.5-5.8 11.5-9.4 2.2-3.3 2 2.4 16.7 6.7 5.4 2.6 2.4 3.3 0.4 0.5 9.8 2.9 1.5 0.5-0.8 1.9-3.8 6.9-1 4.7 0.6 4.6 0.8 3.2 0 2.1-0.4 1.7-2.2 3-1.7 3.5-0.8 5.8 0.3 2.7 0.4 1.7 3.3 4.1z" id="NICA" name="Carazo" />
                <path d="M444.9 354.5l3.9 8.6 9.3 12.6 3.6 3.6 2.5 1 0.9 0.5 1 0.8 5.2 4.9 0.4 0.2 0.5 0.2 0.5 0.1 0.6 0 1.1-0.1 1-0.3 0.6 0 0.8 0.2 1.4 1 2.5 1.3 0.7 0.4 0.3 0.6 0.3 1.7 0.3 0.4 2.2 0.3 1.3 1.8 5.6 2.4 2 0.3 4.8-1.2 5.2-2.5 1.8-1.3 1.6-1.9 2.3-4.7 2.1-6.6 1.5-3.4 2.4-3.3 4.7-2.8 6.1-0.6 12.1 0.3 2.9-0.3 1.6-0.7 16.6-15.5 0.8 0.2 0.6 0.7 1.1 1.9 18.3 23.3 3.4 5.1-7.9 10.6-0.6 1-0.6 1.3 0.4 0.2 0.4 0.2 1.3 1.2 0.4 0.3 0.5 0.2 0.5 0.1 0.4 0.2 0.4 0.2 0.8 0.6 1.4 1.9 0.2 0.4 1.2 3.7 2.6 5.5 0.5 0.7 0.6 0.7 0.4 0.3 0.4 0.2 0.5 0.2 0.6 0.1 0.6 0 0.5-0.1 0.6-0.1 2-1.2 0.4-0.2 0.6-0.1 0.4-0.1 0.5 0.1-0.1 0.1-0.7 0.5-1.2 0.9-0.1 0.1-3.9 4.3-0.7 1.6-1.2 6.3-0.2 2.7-0.2 0.6-0.8 1.9-0.3 2.8-0.6 0.2-0.7-0.2-1.1 0.4-1.9 1.5-1-0.1-1.1-0.8-2.3-0.6-2.5 0.1-3.5 1-2.2 0.2-2.7 1.9-3.8 3.7-4.2 2.8-3.7-0.7-1.3 3.1-1.8 2.9-1.2 1-2.2 1.5-0.7 0.8-2.4-0.7-10.9-1.9-1.8 0.2-5 1.5-2.6 0.5-2.2 0.1-2-0.3-3.3-0.9-1.5-0.4-1.9 0.3-0.6 0.9 0 3-0.6 1.8-2.1 1.9-1.8 0.6-2.2-0.1-2-0.3-2.7 0.2-1.6 0.9-1.2 1.2-0.7 1.5-0.4 1.8 0.2 1.8 1.8 3.6 0.8 2.1 1.4 6.3 4.8 10.3 0.1 2-0.2 1.8-0.5 1.5-0.7 1.2-1.2 0-0.9-0.8-1.7-1.2-1.7-0.6-0.7 0.7-0.6 1.8-1.2-0.3-5.7-6.5-2-0.3-3.2 2.1-1.2 0 1-4.8 0.2-0.5-1.3-1-2.9-0.2-3.5-1.9-6-2.1-1.3-0.6-0.6-1.8-1.6-1.9-1.8-1.5-1.6-0.5-1.1-0.3-1.4 1.1-0.3 0.4-0.3 0.7-0.4 0.9-0.6 0.7-0.3 0.3-0.8 0.5-0.8 0.4-1.5 0.5-0.4 0.2-0.4 0.3-0.2 0.5-1 0.3-1.8 0.2-11.8-0.6-0.6 0.1-0.5 0.2-0.3 0.3-0.3 0.4-2.4 4.8-0.5 0.7-0.7 0.3-1.1 0.2-3.6 0-0.8 0.2-1.7 0.8-3.7 0.7-2.2 0.5-2.2 1.8-0.7 0.4-0.6 0-1-0.6-3-0.6-2.4-0.6-31.8 6.6-3 1.6-3.2 6.7-8.8 4.9-1 0.8-5.4 5-3-0.6-11.3-4.4-1.8-1.2-2-1.6-2.8-3.2-2.7-2.5-3.3-1.1-31.1-6.9 1.9-16.5 2.1-18.7 0.6-4.6 1-6.8 2.9-6.1 0.6-0.8 1.5-1.3 4-2.4 2.2-0.7 4.7-1 2.3-0.9 1.5-1 0.8-1 0.5-1.1 1.2-4.8 6.9-9.5 0.9 0.1 2.5-0.1 1.7 0.7 2.6 1.6 2.9 2.9 6.3 4.8 2.4-2.9 0.9-0.5 2.2-0.3 6.6 0.2 2.4-0.3 1.8-0.6 4-2.9 10.4-9.8 8.5-7.4 2-1.1 6.9-6 13.3-15.8 3.2-5.5 2.7-4.3 2.6-3 3.8-2.6 4.3 0 3.6-1.4 10.2-6.7z" id="NIMT" name="Matagalpa" />
                <path d="M504.9 488.2l3.1 0.9 1.4-1.4-0.2-2.8-1.8-3 2.4-2.4 0.6-0.3 0-0.6 1.3-1.1 1.5-1 0.5 0.1 0.8-2.8 0.7-5.2 0.9-2.3 3.5-3.1 3.5-0.1 3.4 1.8 5.3 4.1 0.9 0.4 1.5 2.3 1.6 0.9 1.1 1 1.1 1.3 1.6 3 0.8 2.4 0.3 3.4-0.6 2.9 0.1 0.9 0.2 0.6 2.1 1.1 1 1-2.3 4.7-7 10.3-0.7 1.4-0.5 1.6-0.3 2.1-0.1 6.9-0.5 2.1-0.9 2.1-3.1 3.9-2 2-2.7 2-5.4 2.7-2.6 0.4-1.1 0.1-1.9-0.3-1.9 0.5-2.8 1.1-10.7 7.4-2.2 1.2-7.5 2.6-9.9 1.1-13.2 2.4-7.8-0.4-5.4-0.1-4.5-0.7-2-0.1-2.6 0.8-6.9 3.4-4.8 3.5-0.8 0.8-1.5 2.1-0.4 0.9-0.2 1.2 0.1 4.5 0.4 3.4 0 1.3-0.4 1.3-3.7 8.5-0.2 0.3-0.2 0.3-0.3 0.4-1.7 2.8-0.9 1.8-3 18.8-13.8 1-9.8-13.8-5-4.4-2.9-1.1-1.6-1.2-0.9-1.2-0.3-1.4-0.3-2.8-1.2-3.6 1-5.2 3-4.6 0.3-1.1-0.3-0.7-16.1-15.2-0.6-0.9-0.3-1.4 0.1-3.1 0.3-3.7-0.2-1.2-0.6-1-4.6-5.1-2.4-3.1-1.2-2.1-0.9-2.7-0.7-6.3 1.1-3.3 5.4-5 1-0.8 8.8-4.9 3.2-6.7 3-1.6 31.8-6.6 2.4 0.6 3 0.6 1 0.6 0.6 0 0.7-0.4 2.2-1.8 2.2-0.5 3.7-0.7 1.7-0.8 0.8-0.2 3.6 0 1.1-0.2 0.7-0.3 0.5-0.7 2.4-4.8 0.3-0.4 0.3-0.3 0.5-0.2 0.6-0.1 11.8 0.6 1.8-0.2 1-0.3 0.2-0.5 0.4-0.3 0.4-0.2 1.5-0.5 0.8-0.4 0.8-0.5 0.3-0.3 0.6-0.7 0.4-0.9 0.3-0.7 0.3-0.4 1.4-1.1 1.1 0.3 1.6 0.5 1.8 1.5 1.6 1.9 0.6 1.8 1.3 0.6 6 2.1 3.5 1.9 2.9 0.2 1.3 1-0.2 0.5-1 4.8 1.2 0 3.2-2.1 2 0.3 5.7 6.5 1.2 0.3 0.6-1.8 0.7-0.7 1.7 0.6 1.7 1.2 0.9 0.8 1.2 0 0.7-1.2 0.5-1.5 0.2-1.8-0.1-2z" id="NIBO" name="Boaco" />
                <path d="M609.7 637.8l-7.1-0.3-2-0.4-0.9-0.4-0.7-0.1-0.6-0.1-2.8 0.3-0.7-0.1-1.6-0.4-0.8 0-3.7 0.6-13.5-0.1-1 0.1-0.8 0.3-0.6 0.9-12.1 11.2-4.6 3-7.9 1.7-2.7 4.3-0.5 1.2 0 0.2-0.2 0.8-0.4 0.5-0.7 0.9-0.3 0.4-0.2 0.4-0.2 0.3-1.3 1.4-0.9 1.1-0.6 1.1-0.6 0.4-1.1 0.7-3.4 1.3-0.9 0.1-0.4-0.2-0.9-0.3-1.2 0.5-1.6 0.9-3.7 2.6-2.8 1.4-0.8 0.7-0.5 0.6-3.3 5.7-77.2-9.2-24.5-68.5 3-18.8 0.9-1.8 1.7-2.8 0.3-0.4 0.2-0.3 0.2-0.3 3.7-8.5 0.4-1.3 0-1.3-0.4-3.4-0.1-4.5 0.2-1.2 0.4-0.9 1.5-2.1 0.8-0.8 4.8-3.5 6.9-3.4 2.6-0.8 2 0.1 4.5 0.7 5.4 0.1 7.8 0.4 13.2-2.4 9.9-1.1 7.5-2.6 2.2-1.2 10.7-7.4 2.8-1.1 1.9-0.5 1.9 0.3 1.1-0.1 2.6-0.4 5.4-2.7 2.7-2 2-2 3.1-3.9 0.9-2.1 0.5-2.1 0.1-6.9 0.3-2.1 0.5-1.6 0.7-1.4 7-10.3 2.3-4.7 4.4 6.4 5.3 4.9 1.1 1.8 4 9 3.8 5.8 2.4 2.4 1.2 1.9 0.4 1.3-0.3 1.1-1 2.5-0.5 2.4-0.3 3.1 0.8 6.1 1 3.1 1.3 2.2 1.3 1.4 1.3 1.1 1.1 1.2 6.5 11.6 0.5 2.8-1.1 4.2 0.2 6.2 2.5 11.2 11.6 29.4 1.3 1.9 23.4 11.3-7.2 3-1.4 1.3 0.1 0.8 0.2 0.6 1.3 2.4 1 3.2z" id="NICO" name="Chontales" />
                <path d="M315.4 350.8l-1.6 2.8-1 2.9-0.5 3.2-0.1 4 1.7 8.1-2.7 7.8 0.5 2.4-0.6 3.1-2.1 3.6 1.2 2.6 1.3 2 13.8 13.9 8 4.7 2.9 3.5-6.9 9.5-1.2 4.8-0.5 1.1-0.8 1-1.5 1-2.3 0.9-4.7 1-2.2 0.7-4 2.4-1.5 1.3-0.6 0.8-2.9 6.1-1 6.8-22.5-6.6-6.1-3.1-1.9-3.3 0-1.6 0.2-2.1 4.1-7.2 0.4-5.9-1.3-4.7-1-1.6-1.8-2.6-4.9-8-3.3-3.4-1.4-0.7-2.2-0.6-10.2 2.2-12.1 4.1-3.8 0.8-2.1 0.2-3.6-1.8-2.9-1-2.4 0-1.8 0.1-3.2 1.3-2.1-11.2 0.6-5.9 0.5-1.7 0.2-0.2 1.9-1.7 15.4-15.6 3.4-4.9 1.6-3.3 7.5-13.2 7.3-6.4 4.9-0.7 1.9 0.6 2.7 1.3 7.8 3.7 7.8-1.3 14-4.5 10.2-0.5 3.5 1.1 0.7 1.2 1.8 4.2 1.5 2.5z" id="NIES" name="Estelí" />
                <path d="M441.9 671.8l-68.1-0.3-6 1.8-8.1 2.1-0.9-0.3-1.8-1.9-0.7-0.7-0.8-0.5-0.9-0.2-0.3-0.1-0.5 0.1-0.5 0.3-0.5 0.5-2.9 6.2-2 3.3-0.7 0.5-5.1 2.6-0.6 0.6-1.4 0.2-4.3-1.1-3.3-4.1-0.4-1.7-0.3-2.7 0.8-5.8 1.7-3.5 2.2-3 0.4-1.7 0-2.1-0.8-3.2-0.6-4.6 1-4.7 3.8-6.9 0.8-1.9 3.6-7.8 1.7-3.9 0.6-1.4 6.6-14.7 7.4-16.3-0.6-2.9-6.1-6.9 15.4-7 5.8-4.2 1.5-0.5 1.4 0 3.2 1.4 1.2 3.6 0.3 2.8 0.3 1.4 0.9 1.2 1.6 1.2 2.9 1.1 5 4.4 9.8 13.8 13.8-1 24.5 68.5z" id="NIGR" name="Granada" />
                <path d="M302.9 620.1l4.3-5.4 5 3.9 1.3 0.6 2.2 0.6 1.4-0.2 1.7-0.4 1.5-0.8 1.1-1.1 1-1.2 2.1-3.3 0.2-4.2-0.5-1.1-1-1.4-2.6-2.8-0.6-2.4 11.1-11 3.3-2.5 5.4-0.9 6.2-2.6 3.2-0.4 0.5 0 0.4 0.2 1 0.5 3.2 0.9 6.1 6.9 0.6 2.9-7.4 16.3-6.6 14.7-0.6 1.4-1.7 3.9-3.6 7.8-1.5-0.5-9.8-2.9-0.4-0.5-2.4-3.3-5.4-2.6-16.7-6.7-2-2.4z" id="NIMS" name="Masaya" />
              </g>
            </g>
          </svg>

          {/* Porcentaje numérico */}
          <div className="loaderText" style={{
            fontSize: '20px',
            fontWeight: '800',
            color: 'var(--atlan-gold)',
            fontFamily: "'Delight', var(--font-inter), sans-serif",
            letterSpacing: '0.05em',
            marginTop: '8px',
            textShadow: '0 0 10px rgba(212, 175, 55, 0.4)'
          }}>
            {loadingProgress}%
          </div>
        </div>

        {/* Barra de progreso horizontal */}
        <div style={{
          width: '200px',
          height: '4px',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <div style={{
            height: '100%',
            width: `${loadingProgress}%`,
            backgroundColor: 'var(--atlan-gold)',
            boxShadow: '0 0 8px var(--atlan-gold)',
            transition: 'width 0.1s linear'
          }} />
        </div>

        <div className="loaderDesc" style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '0.1em',
          fontWeight: '550',
          textTransform: 'uppercase',
          fontFamily: "'Delight', var(--font-inter), sans-serif"
        }}>
          {lang === 'en' ? 'Preparing map experience...' : 'Preparando experiencia de mapa...'}
        </div>
      </div>

      {/* PANEL IZQUIERDO: Mapa y Elementos Flotantes */}
      <div 
        className="map-pane"
        style={{
          flex: typeof window !== 'undefined' && window.innerWidth > 768 && selectedPoint 
            ? '1 1 50%' 
            : '1 1 100%'
        }}
      >
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* CUADRO FLOTANTE PREVISUALIZACIÓN DE VIAJE (TRAYECTORIA) */}
        {selectedPoint && previewRouteInfo && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 15, 28, 0.9)',
            border: '1.5px solid var(--atlan-gold)',
            borderRadius: '16px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.25)',
            zIndex: 40,
            color: 'white',
            fontFamily: 'var(--font-outfit), sans-serif',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.3s ease',
            whiteSpace: 'nowrap'
          }}>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {lang === 'en' ? 'Distance' : 'Distancia'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--atlan-gold)', marginTop: '2px' }}>
                {formatDistanceDisplay(previewRouteInfo.distance)}
              </div>
            </div>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {lang === 'en' ? 'Est. Time' : 'Tiempo Est.'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
                {formatDurationDisplay(previewRouteInfo.duration)}
              </div>
            </div>
          </div>
        )}

      {/* Cabecera flotante con identidad visual Atlan ampliada */}
      {!selectedPoint && (
        <div className="map-header" style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '95%',
          maxWidth: '1150px',
          background: '#0A192F',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '2.5px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '26px',
          padding: '14px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          boxShadow: '0 16px 40px -4px rgba(0, 0, 0, 0.5), 0 0 25px rgba(20, 109, 158, 0.25)'
        }}>
          {/* Brand Logo igual al Navbar */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <img
              src="/mapaicono.png"
              alt="Logo Atlan"
              style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
            />
            <span className="logoText" style={{ fontSize: '26px', fontWeight: '900', color: '#FFD700', letterSpacing: '-0.5px' }}>
              atlan
            </span>
          </Link>

          {/* BUSCADOR GLOBAL GRANDE, AMPLIO Y DESTACADO */}
          <div style={{ flex: 1, margin: '0 24px', position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1.5px solid rgba(255, 215, 0, 0.35)',
              borderRadius: '18px',
              padding: '11px 20px',
              gap: '12px',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 4px 14px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease'
            }}>
              <span style={{ color: '#FFD700', display: 'flex', alignItems: 'center' }}>
                <Icon name="search" size={20} />
              </span>
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search destinations, places, categories...' : 'Buscar destinos, lugares, categorías...'}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowResults(true)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: '600',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Resultados de búsqueda Espaciosos y Elegantes */}
            {showResults && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '58px',
                left: 0,
                right: 0,
                background: '#0A192F',
                backdropFilter: 'blur(24px)',
                border: '2px solid rgba(255, 215, 0, 0.4)',
                borderRadius: '20px',
                maxHeight: '350px',
                overflowY: 'auto',
                zIndex: 99,
                boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 20px rgba(255, 215, 0, 0.15)',
                padding: '8px 0'
              }}>
                {searchResults.map((p) => {
                  const catKey = (p.categoria || 'otro').toLowerCase();
                  const catConf = CATEGORIAS_CONFIG[catKey] || CATEGORIAS_CONFIG['otro'];
                  return (
                    <div
                      key={p.id}
                      onClick={() => selectSearchResult(p)}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.2s ease',
                      }}
                      className="search-result-item"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.12)';
                        e.currentTarget.style.paddingLeft = '24px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.paddingLeft = '20px';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: catConf.color + '22',
                          border: `1.5px solid ${catConf.color}55`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: catConf.color,
                          flexShrink: 0
                        }}>
                          <Icon name={catConf.icon} size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.2' }}>{p.nombre}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span><Icon name="mapPin" size={12} color="#FFD700" /> {p.departamento || 'Nicaragua'}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '3px 8px', borderRadius: '6px' }}>
                          {t(`addPoint.categories.${catKey}`)}
                        </span>
                        <span style={{ color: '#FFD700', fontWeight: '900', fontSize: '14px' }}>➔</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acciones derecha */}
          <div className="map-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <Link
              href="/"
              style={{
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#FFFFFF',
                borderRadius: '14px',
                fontWeight: '750',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.25s ease'
              }}
            >
              <Icon name="home" size={15} /> <span className="mobile-hide-text">{lang === 'en' ? 'Home' : 'Inicio'}</span>
            </Link>

            <Link
              href="/comunidad"
              style={{
                padding: '10px 16px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38BDF8',
                borderRadius: '14px',
                fontWeight: '750',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.25s ease'
              }}
            >
              <Icon name="users" size={15} /> <span className="mobile-hide-text">{lang === 'en' ? 'Community' : 'Comunidad'}</span>
            </Link>

            <button
              onClick={activarLevantarPunto}
              style={{
                padding: '10px 18px',
                background: isAddingPoint ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: isAddingPoint ? '#FFFFFF' : '#0A192F',
                border: isAddingPoint ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255, 215, 0, 0.8)',
                borderRadius: '14px',
                fontWeight: '900',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isAddingPoint ? '0 4px 16px rgba(239, 68, 68, 0.4)' : '0 4px 16px rgba(255, 215, 0, 0.4)',
                transition: 'all 0.25s ease'
              }}
            >
              <Icon name={isAddingPoint ? "x" : "plus"} size={16} /> {isAddingPoint ? t('common.cancel') : t('map.addPoint')}
            </button>
            <LanguageToggle variant="pill" />
          </div>
        </div>
      )}

      {/* Banner modo agregar punto */}
      {isAddingPoint && (
        <div style={{
          position: 'absolute',
          top: '85px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '460px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(10, 15, 28, 0.96) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 215, 0, 0.45)',
          borderRadius: '18px',
          padding: '12px 18px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.2)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          animation: 'fadeInDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(255, 215, 0, 0.15)',
              border: '1px solid rgba(255, 215, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFD700',
              flexShrink: 0
            }}>
              <Icon name="mapPin" size={20} color="#FFD700" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#FFD700', letterSpacing: '0.2px' }}>
                {lang === 'en' ? 'Add Point Mode' : 'Modo Levantar Punto'}
              </div>
              <div style={{ fontSize: '12px', color: '#CBD5E1', fontWeight: '500' }}>
                {t('addPoint.tapMap')}
              </div>
            </div>
          </div>
          <button
            onClick={activarLevantarPunto}
            style={{
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#F87171',
              borderRadius: '10px',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon name="x" size={13} /> {t('common.cancel')}
          </button>
        </div>
      )}

      {/* Panel de filtros */}
      {!selectedPoint && !routeInfo && !isDemoRunning && (
        <div className="filter-bar">
        {/* Píldora "Todas" */}
        <button
          onClick={() => aplicarFiltro(null)}
          style={{
            flexShrink: 0,
            padding: '8px 16px',
            background: filtroCategoria === null ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : '#0A192F',
            color: filtroCategoria === null ? '#0A192F' : '#FFFFFF',
            border: filtroCategoria === null ? '1px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            fontWeight: '800',
            fontSize: '12.5px',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            boxShadow: filtroCategoria === null ? '0 4px 12px rgba(255,215,0,0.3)' : '0 4px 10px rgba(0,0,0,0.25)',
            transition: 'all 0.2s'
          }}
        >
          🌍 {t('map.allCategories')}
        </button>

        {Object.entries(CATEGORIAS_CONFIG).map(([key, config]) => {
          const isSelected = filtroCategoria === key;
          return (
            <button
              key={key}
              onClick={() => aplicarFiltro(key)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                background: isSelected ? config.color : '#0A192F',
                color: isSelected ? '#FFFFFF' : '#E2E8F0',
                border: isSelected ? `1.5px solid ${config.color}` : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                fontWeight: '750',
                fontSize: '12.5px',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                boxShadow: isSelected ? `0 4px 14px ${config.color}55` : '0 4px 10px rgba(0,0,0,0.25)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span><Icon name={config.icon} size={16} /></span>
              <span>{t(`addPoint.categories.${key}`)}</span>
            </button>
          );
        })}
      </div>
      )}

      {/* Modal agregar punto */}
      {showAddModal && tempPointCoords && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(10, 15, 28, 0.78)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999,
            animation: 'fadeIn 0.25s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setTempPointCoords(null);
            }
          }}
        >
          <div
            className="add-point-modal"
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              backgroundColor: '#0F172A',
              backgroundImage: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 28, 0.99) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '24px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 215, 0, 0.15)',
              padding: '24px',
              overflowY: 'auto',
              position: 'relative',
              animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              color: '#F8FAFC'
            }}
          >
            {/* Header del modal */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFD700',
                  boxShadow: '0 4px 14px rgba(255, 215, 0, 0.2)'
                }}>
                  <Icon name="mapPin" size={24} color="#FFD700" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#FFD700', letterSpacing: '-0.3px', fontFamily: 'var(--font-outfit)' }}>
                    {t('addPoint.title')}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#94A3B8' }}>
                    {t('addPoint.subtitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setTempPointCoords(null); }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleGuardarPunto} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Coordenadas informativas estilizadas */}
              <div style={{
                background: 'rgba(255, 215, 0, 0.06)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                padding: '10px 14px',
                borderRadius: '14px',
                fontSize: '12px',
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}></span>
                  <span style={{ fontWeight: '700', color: '#FFD700' }}>{lang === 'en' ? 'Selected Location' : 'Ubicación seleccionada'}:</span>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#CBD5E1', background: 'rgba(0,0,0,0.35)', padding: '3px 8px', borderRadius: '6px' }}>
                  {tempPointCoords[1].toFixed(5)}, {tempPointCoords[0].toFixed(5)}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '750', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Icon name="tag" size={14} color="#FFD700" />
                  {t('addPoint.placeName')} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('addPoint.placeNamePlaceholder')}
                  value={newPointNombre}
                  onChange={(e) => setNewPointNombre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '13.5px',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FFD700';
                    e.target.style.boxShadow = '0 0 12px rgba(255, 215, 0, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '750', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Icon name="user" size={14} color="#FFD700" />
                  {t('addPoint.yourName')}
                </label>
                <input
                  type="text"
                  placeholder={t('addPoint.yourNamePlaceholder')}
                  value={newPointCreador}
                  onChange={(e) => setNewPointCreador(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '13.5px',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FFD700';
                    e.target.style.boxShadow = '0 0 12px rgba(255, 215, 0, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '750', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Icon name="layers" size={14} color="#FFD700" />
                  {t('addPoint.category')} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={newPointCategoria}
                  onChange={(e) => setNewPointCategoria(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FFD700';
                    e.target.style.boxShadow = '0 0 12px rgba(255, 215, 0, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {Object.keys(CATEGORIAS_CONFIG).map((key) => (
                    <option key={key} value={key} style={{ background: '#0F172A', color: '#FFFFFF', padding: '8px' }}>
                      {t(`addPoint.categories.${key}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '750', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Icon name="alignLeft" size={14} color="#FFD700" />
                  {t('addPoint.description')} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder={t('addPoint.descriptionPlaceholder')}
                  value={newPointDesc}
                  onChange={(e) => setNewPointDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '13.5px',
                    resize: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FFD700';
                    e.target.style.boxShadow = '0 0 12px rgba(255, 215, 0, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setTempPointCoords(null); }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    color: '#CBD5E1',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Icon name="x" size={15} />
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPoint}
                  style={{
                    flex: 1.2,
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    border: 'none',
                    borderRadius: '14px',
                    color: '#0A192F',
                    fontWeight: '900',
                    fontSize: '13.5px',
                    cursor: isSubmittingPoint ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 18px rgba(255, 215, 0, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.25s ease',
                    opacity: isSubmittingPoint ? 0.7 : 1
                  }}
                >
                  {isSubmittingPoint ? (
                    <>
                      <Icon name="hourglass" size={16} /> ...
                    </>
                  ) : (
                    <>
                      <Icon name="checkCircle" size={16} />
                      {t('addPoint.submit')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOTÓN ÚNICO FLOTANTE / BURBUJA CIRCULAR DE GIRO (ESTILO WAZE / GOOGLE MAPS) */}
      {!selectedPoint && (
        <div
          onClick={() => setShowDirectionsPopup((prev) => !prev)}
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '20px',
            zIndex: 40,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          title={showDirectionsPopup ? (lang === 'en' ? 'Close route panel' : 'Cerrar panel de ruta') : (lang === 'en' ? 'Open route planner' : 'Trazar o ver ruta')}
        >
          {routeInfo && !showDirectionsPopup ? (
            /* MODO NAVEGACIÓN ACTIVA: Círculo de giro + Insignia de distancia */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#0A192F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: '900',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.4)',
                border: '2.5px solid #FFFFFF',
                transition: 'transform 0.2s ease',
              }}>
                {currentManeuver?.icon || '⬆'}
              </div>
              <span style={{
                background: '#0A192F',
                color: '#FFD700',
                border: '1.5px solid #FFD700',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '900',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap'
              }}>
                {currentManeuver?.distanceFormatted || formatDistanceDisplay(routeInfo.distance)}
              </span>
            </div>
          ) : (
            /* MODO INICIAL: Botón flotante "Trazar Ruta" */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: showDirectionsPopup ? '#EF4444' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: showDirectionsPopup ? '#FFFFFF' : '#0A192F',
              border: showDirectionsPopup ? '2px solid #EF4444' : '2px solid #FFFFFF',
              borderRadius: '25px',
              padding: '10px 18px',
              fontWeight: '900',
              fontSize: '13.5px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              transition: 'all 0.25s ease'
            }}>
              <span>🧭</span>
              <span>{showDirectionsPopup ? (lang === 'en' ? 'Close Route' : 'Cerrar Ruta') : (lang === 'en' ? 'Route A-B' : 'Trazar Ruta')}</span>
            </div>
          )}
        </div>
      )}

      {/* Botón 🚗 Demo */}
      {!selectedPoint && (
        <button
          className="btn-demo"
          onClick={iniciarSimulacionDemo}
        style={{
          position: 'absolute',
          bottom: '100px',
          right: '20px',
          backgroundColor: isDemoRunning ? '#f59e0b' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          padding: '11px 18px',
          fontWeight: '700',
          fontSize: '14px',
          letterSpacing: '0.3px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.25s ease',
        }}
      >
        🚗 {isDemoRunning ? t('map.demoStop') : t('map.demo')}
      </button>
      )}

      {/* Botón Volver a centrar (Waze-style) */}
      {!selectedPoint && showRecenterBtn && (
        <button
          onClick={handleRecenter}
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(10, 15, 28, 0.9)',
            color: 'var(--atlan-gold)',
            border: '1.5px solid var(--atlan-gold-light)',
            borderRadius: '30px',
            padding: '12px 24px',
            fontWeight: '700',
            fontSize: '14px',
            letterSpacing: '0.5px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.2)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
          }}
          className="recenter-btn animate-scale-in"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          {lang === 'en' ? 'Re-center' : 'Volver a centrar'}
        </button>
      )}

      {/* Botón Silenciar / Voz */}
      {!selectedPoint && (
        <button
          onClick={toggleMute}
          title={isMuted ? t('map.unmute') : t('map.mute')}
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '20px',
          backgroundColor: isMuted ? '#ef4444' : '#10b981',
          color: 'white',
          border: isSpeaking && !isMuted ? '3px solid white' : 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: isSpeaking && !isMuted
            ? '0 0 20px 6px rgba(16,185,129,0.85)'
            : '0 4px 12px rgba(0,0,0,0.3)',
          transform: isSpeaking && !isMuted ? 'scale(1.15)' : 'scale(1)',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.3s ease',
        }}
      >
        {isMuted ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
      )}

      </div>

      {/* Panel de detalles resumido en el mapa */}
      {selectedPoint && (
        <div className="detail-sheet" style={{ overflow: 'hidden', padding: 0 }}>
          {(() => {
            const cat = (selectedPoint.category || '').toLowerCase();
            let coverGradient = 'linear-gradient(135deg, #146D9E 0%, #0D496B 100%)';
            let accentColor = '#146D9E';

            if (cat.includes('restaurante') || cat.includes('comida') || cat.includes('café') || cat.includes('bar')) {
              coverGradient = 'linear-gradient(135deg, #FF6B6B 0%, #D93838 100%)';
              accentColor = '#D93838';
            } else if (cat.includes('hotel') || cat.includes('hospedaje') || cat.includes('hostal')) {
              coverGradient = 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)';
              accentColor = '#1D4ED8';
            } else if (cat.includes('naturaleza') || cat.includes('tour') || cat.includes('aventura')) {
              coverGradient = 'linear-gradient(135deg, #10B981 0%, #047857 100%)';
              accentColor = '#047857';
            } else if (cat.includes('cultura') || cat.includes('arte') || cat.includes('museo')) {
              coverGradient = 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)';
              accentColor = '#6D28D9';
            }

            const heroImg = getPointImage(selectedPoint, selectedPointDetails);

            // Servicios activos
            const servs = selectedPointDetails?.servicios || {};
            const activeServiceList = [
              { key: 'has_wifi', label: 'WiFi', icon: 'wifi' },
              { key: 'has_parking', label: lang === 'en' ? 'Parking' : 'Parqueo', icon: 'parking' },
              { key: 'has_pets', label: 'Pet Friendly', icon: 'pet' },
              { key: 'has_card_payment', label: lang === 'en' ? 'Cards' : 'Tarjetas', icon: 'creditCard' },
              { key: 'has_accessibility', label: lang === 'en' ? 'Accessible' : 'Accesibilidad', icon: 'accessibility' },
              { key: 'has_delivery', label: 'Delivery', icon: 'delivery' },
              { key: 'has_ac', label: 'A/C', icon: 'ac' },
              { key: 'has_live_music', label: lang === 'en' ? 'Live Music' : 'Música en Vivo', icon: 'music' },
            ].filter(s => !!servs[s.key]);

            const avgRating = pointReviews.length > 0
              ? (pointReviews.reduce((acc, r) => acc + Number(r.estrellas || 5), 0) / pointReviews.length).toFixed(1)
              : null;

            return (
              <>
                {/* PORTADA / HERO COVER DEL NEGOCIO */}
                <div
                  style={{
                    height: heroImg ? '150px' : '120px',
                    background: heroImg ? `url(${heroImg}) center/cover no-repeat` : coverGradient,
                    position: 'relative',
                    flexShrink: 0
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: heroImg
                        ? 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(10,15,28,0.7) 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)'
                    }}
                  />

                  {!heroImg && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#FFD700',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        background: 'rgba(255, 215, 0, 0.15)',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 215, 0, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {lang === 'en' ? 'Photos Coming Soon' : 'PRÓXIMAMENTE'}
                      </span>
                    </div>
                  )}

                  {/* ACCIONES SUPERIORES FLOTANTES */}
                  <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', gap: '8px', zIndex: 2 }}>
                    {userSession && (
                      <button
                        onClick={handleToggleFavorite}
                        title={isFavorite ? (lang === 'en' ? 'Remove Favorite' : 'Quitar de Favoritos') : (lang === 'en' ? 'Save Favorite' : 'Guardar Favorito')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(8px)',
                          border: isFavorite ? '1.5px solid #FFD700' : '1px solid rgba(255,255,255,0.5)',
                          color: isFavorite ? '#B8960E' : '#475569',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        <Icon name={isFavorite ? 'heartFilled' : 'heart'} size={17} color={isFavorite ? '#B8960E' : '#475569'} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedPoint(null);
                        setShowFullProfileModal(false);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.5)',
                        color: '#1E293B',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <Icon name="x" size={17} color="#1E293B" />
                    </button>
                  </div>
                </div>

                {/* DATOS PRINCIPALES NEGOCIO */}
                <div style={{ padding: '0 20px 14px', position: 'relative', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '8px' }}>
                    {selectedPointDetails?.logo_url ? (
                      <img
                        src={selectedPointDetails.logo_url}
                        alt={selectedPoint.nombre}
                        style={{
                          width: '76px',
                          height: '76px',
                          borderRadius: '20px',
                          objectFit: 'cover',
                          border: '3.5px solid #FFFFFF',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
                          background: '#FFFFFF',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '76px',
                          height: '76px',
                          borderRadius: '20px',
                          background: coverGradient,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '30px',
                          fontWeight: '800',
                          border: '3.5px solid #FFFFFF',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
                          flexShrink: 0
                        }}
                      >
                        {selectedPoint.nombre?.charAt(0)?.toUpperCase() || <Icon name="building" size={32} color="#FFFFFF" />}
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        {(() => {
                          let statusText = '';
                          let statusColor = '';
                          let statusBg = '';

                          if (selectedPoint.estado === 'en_verificacion') {
                            statusText = lang === 'en' ? 'Awaiting Verification' : 'En Verificación';
                            statusColor = '#f97316';
                            statusBg = 'rgba(249, 115, 22, 0.12)';
                          } else if (selectedPoint.estado === 'aprobado') {
                            statusText = lang === 'en' ? 'Verified' : 'Verificado';
                            statusColor = '#10b981';
                            statusBg = 'rgba(16, 185, 129, 0.12)';
                          } else {
                            const isClaimed = !!selectedPoint.negocio_id;
                            statusText = isClaimed ? t('map.claimed') : t('map.unclaimed');
                            statusColor = isClaimed ? '#10b981' : '#f59e0b';
                            statusBg = isClaimed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)';
                          }

                          return (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              color: statusColor,
                              background: statusBg,
                              padding: '2.5px 7.5px',
                              borderRadius: '6px',
                              border: `1px solid ${statusColor}35`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Icon name={selectedPoint.estado === 'aprobado' ? 'checkCircle' : 'shield'} size={11} color={statusColor} />
                              {statusText}
                            </span>
                          );
                        })()}

                        {avgRating && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            color: '#B8960E',
                            background: 'rgba(255, 215, 0, 0.18)',
                            padding: '2.5px 6.5px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Icon name="starFilled" size={12} color="#B8960E" />
                            {avgRating} ({pointReviews.length})
                          </span>
                        )}
                      </div>

                      <h2 style={{ margin: 0, fontSize: '21px', fontWeight: '850', color: '#0F172A', lineHeight: '1.25' }}>
                        {selectedPoint.nombre}
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="mapPin" size={13} color="#64748B" />
                        <span>{t(`addPoint.categories.${selectedPoint.category || 'otro'}`)}</span>
                        {selectedPointDetails?.rango_precios && (
                          <span style={{ color: '#0F172A', fontWeight: '800', marginLeft: '4px' }}>• {selectedPointDetails.rango_precios}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CUERPO SCROLLABLE DEL PANEL */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0 20px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(20,109,158,0.1) transparent'
                }}>
                  {/* BOTONES DE ACCIÓN: CARTEL NEÓN OSCURO (INICIAR VIAJE) Y CARTEL NEÓN AMARILLO (MOSTRAR MÁS) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={() => handleIniciarViaje(selectedPoint)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(20, 109, 158, 0.12)',
                        color: '#146D9E',
                        border: '1.5px solid rgba(20, 109, 158, 0.25)',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(20, 109, 158, 0.08)'
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#146D9E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                      <span style={{ fontWeight: '800', fontSize: '13px', color: '#146D9E' }}>
                        {lang === 'en' ? 'Start Trip' : 'Iniciar Viaje'}
                      </span>
                    </button>

                    <button
                      onClick={() => setShowFullProfileModal(true)}
                      className="neon-map-btn-yellow"
                      style={{
                        width: '100%',
                        padding: '8px 6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <span
                        className="neon-sign-text-white-bg"
                        style={{
                          fontSize: '16px',
                          fontWeight: '900',
                          letterSpacing: '0.4px',
                          color: '#FFFFFF',
                          textTransform: 'uppercase',
                          WebkitTextStroke: '1.2px #000000',
                          paintOrder: 'stroke fill'
                        }}
                      >
                        {lang === 'en' ? 'Show More' : 'Mostrar más'}
                      </span>
                      <img src="/images/more.svg" alt="Mostrar más" style={{ width: '24px', height: '24px' }} />
                    </button>
                  </div>

                  {/* CHIPS DE AMENIDADES RÁPIDAS */}
                  {activeServiceList.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                      {activeServiceList.map((s) => (
                        <span
                          key={s.key}
                          style={{
                            fontSize: '11.5px',
                            fontWeight: '700',
                            color: '#334155',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            padding: '4px 9px',
                            borderRadius: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Icon name={s.icon} size={12} color={accentColor} />
                          <span>{s.label}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* TARJETA DE VISTA PREVIA RESUMIDA */}
                  <div className="clay-card-static" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Indicador de abierto/cerrado */}
                    {selectedPointDetails?.servicios?.has_hours && selectedPointDetails?.horarios && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Icon name="clock" size={13} color="#64748B" />
                          <span>{lang === 'en' ? 'Status' : 'Horario'}</span>
                        </span>
                        {isBusinessOpenNow(selectedPointDetails.horarios) !== null && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '850',
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: isBusinessOpenNow(selectedPointDetails.horarios) ? 'rgba(23, 170, 74, 0.12)' : 'rgba(239,68,68,0.12)',
                            color: isBusinessOpenNow(selectedPointDetails.horarios) ? '#17AA4A' : '#ef4444',
                            border: `1px solid ${isBusinessOpenNow(selectedPointDetails.horarios) ? 'rgba(23, 170, 74, 0.25)' : 'rgba(239,68,68,0.25)'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Icon name={isBusinessOpenNow(selectedPointDetails.horarios) ? 'check' : 'x'} size={11} color={isBusinessOpenNow(selectedPointDetails.horarios) ? '#17AA4A' : '#ef4444'} />
                            {isBusinessOpenNow(selectedPointDetails.horarios)
                              ? (lang === 'en' ? 'Open Now' : 'Abierto Ahora')
                              : (lang === 'en' ? 'Closed' : 'Cerrado')}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Descripción rápida (Acerca de) */}
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon name="info" size={13} color="#64748B" />
                        <span>{lang === 'en' ? 'About' : 'Acerca de'}</span>
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#475569',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {selectedPoint.descripcion || (lang === 'en' ? 'No description available.' : 'Sin descripción disponible.')}
                      </p>
                    </div>

                    {/* GALERÍA DE 6 ESPACIOS (3 COLUMNAS X 2 FILAS) CON PLACEHOLDER PRÓXIMAMENTE */}
                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon name="image" size={13} color="#64748B" />
                        <span>{lang === 'en' ? 'Photos & Media' : 'Galería de Fotos'} ({selectedPointDetails?.fotos?.length || 0}/6)</span>
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                          const photoUrl = selectedPointDetails?.fotos?.[index];

                          if (photoUrl) {
                            return (
                              <div
                                key={index}
                                onClick={() => setPreviewPhotoModal(photoUrl)}
                                style={{
                                  height: '70px',
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                  border: '1px solid rgba(20, 109, 158, 0.12)',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                <img
                                  src={photoUrl}
                                  alt={`Foto ${index + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            );
                          }

                          return (
                            <div
                              key={index}
                              style={{
                                height: '70px',
                                borderRadius: '10px',
                                border: '1.5px dashed rgba(20, 109, 158, 0.22)',
                                background: 'rgba(20, 109, 158, 0.03)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                                padding: '4px',
                                textAlign: 'center'
                              }}
                            >
                              <Icon name="image" size={17} color="#94A3B8" />
                              <span style={{ fontSize: '9.5px', fontWeight: '750', color: '#94A3B8', lineHeight: '1.1' }}>
                                {lang === 'en' ? 'Coming Soon' : 'Próximamente'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* BARRA DE CONTACTO DIRECTO Y REDES SOCIALES (JUSTO DEBAJO DE LAS IMÁGENES) */}
                    {(() => {
                      const phone = selectedPointDetails?.telefono;
                      const whatsapp = selectedPointDetails?.whatsapp;
                      const facebook = selectedPointDetails?.facebook;
                      const instagram = selectedPointDetails?.instagram;
                      const tiktok = selectedPointDetails?.tiktok;
                      const website = selectedPointDetails?.website;

                      const hasAnyContact = phone || whatsapp || facebook || instagram || tiktok || website;

                      if (!hasAnyContact) return null;

                      const formatUrl = (val, prefix) => {
                        if (!val) return null;
                        if (val.startsWith('http://') || val.startsWith('https://')) return val;
                        return `${prefix}${val.replace(/^@/, '')}`;
                      };

                      const waUrl = whatsapp ? (whatsapp.startsWith('http') ? whatsapp : `https://wa.me/${whatsapp.replace(/\D/g, '')}`) : null;
                      const fbUrl = formatUrl(facebook, 'https://facebook.com/');
                      const igUrl = formatUrl(instagram, 'https://instagram.com/');
                      const ttUrl = formatUrl(tiktok, 'https://tiktok.com/@');
                      const webUrl = website ? (website.startsWith('http') ? website : `https://${website}`) : null;

                      return (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px dashed rgba(20, 109, 158, 0.12)', paddingTop: '10px', marginTop: '2px' }}>
                          {whatsapp && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Contactar por WhatsApp"
                              style={{
                                padding: '7px 12px',
                                borderRadius: '10px',
                                background: 'rgba(34, 197, 94, 0.14)',
                                border: '1.5px solid rgba(34, 197, 94, 0.35)',
                                color: '#15803D',
                                fontSize: '12.5px',
                                fontWeight: '850',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                flex: '1 1 auto'
                              }}
                            >
                              <Icon name="whatsapp" size={15} color="#16A34A" />
                              <span>WhatsApp ({whatsapp})</span>
                            </a>
                          )}

                          {fbUrl && (
                            <a
                              href={fbUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Facebook"
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '9px',
                                background: 'rgba(24, 119, 242, 0.12)',
                                border: '1.5px solid rgba(24, 119, 242, 0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Icon name="facebook" size={16} color="#1877F2" />
                            </a>
                          )}

                          {igUrl && (
                            <a
                              href={igUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Instagram"
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '9px',
                                background: 'rgba(228, 64, 95, 0.12)',
                                border: '1.5px solid rgba(228, 64, 95, 0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Icon name="instagram" size={16} color="#E4405F" />
                            </a>
                          )}

                          {ttUrl && (
                            <a
                              href={ttUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="TikTok"
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '9px',
                                background: 'rgba(15, 23, 42, 0.08)',
                                border: '1.5px solid rgba(15, 23, 42, 0.2)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Icon name="tiktok" size={16} color="#0F172A" />
                            </a>
                          )}

                          {webUrl && (
                            <a
                              href={webUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Sitio Web"
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '9px',
                                background: 'rgba(20, 109, 158, 0.12)',
                                border: '1.5px solid rgba(20, 109, 158, 0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Icon name="globe" size={16} color="#146D9E" />
                            </a>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* BOTÓN RECLAMAR NEGOCIO SI APLICA */}
                  {!selectedPoint.negocio_id && selectedPoint.estado === 'sin_reclamar' && (
                    <Link
                      href="/dashboard"
                      style={{
                        padding: '10px 14px',
                        fontSize: '12.5px',
                        color: '#B8960E',
                        background: 'rgba(255, 215, 0, 0.1)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Icon name="claim" size={14} color="#B8960E" />
                      <span>{lang === 'en' ? 'Claim this business' : '¿Eres el dueño? Reclamar este negocio'}</span>
                    </Link>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Modal Lightbox de Vista Previa de Imagen Agrandada */}
      {previewPhotoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            backgroundColor: 'rgba(10, 15, 28, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div style={{ position: 'relative', maxWidth: '92vw', maxHeight: '88vh' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhotoModal}
              alt="Foto ampliada"
              style={{
                maxWidth: '92vw',
                maxHeight: '88vh',
                borderRadius: '18px',
                objectFit: 'contain',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                border: '2px solid rgba(255,255,255,0.2)'
              }}
            />
            <button
              onClick={() => setPreviewPhotoModal(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                background: '#FFFFFF',
                border: 'none',
                color: '#0F172A',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                transition: 'transform 0.2s'
              }}
            >
              <Icon name="x" size={18} color="#0F172A" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Perfil Completo Multi-pestaña */}
      <BusinessProfileModal
        isOpen={showFullProfileModal}
        onClose={() => setShowFullProfileModal(false)}
        point={selectedPoint}
        details={selectedPointDetails}
        reviews={pointReviews}
        menu={pointMenu}
        userSession={userSession}
        lang={lang}
        t={t}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        onIniciarViaje={handleIniciarViaje}
        isBusinessOpenNow={isBusinessOpenNow}
        reservaTipo={reservaTipo}
        setReservaTipo={setReservaTipo}
        reservaFechaHora={reservaFechaHora}
        setReservaFechaHora={setReservaFechaHora}
        reservaPersonas={reservaPersonas}
        setReservaPersonas={setReservaPersonas}
        reservaNotas={reservaNotas}
        setReservaNotas={setReservaNotas}
        isSubmittingReserva={isSubmittingReserva}
        reservaSuccess={reservaSuccess}
        handleCrearReserva={handleCrearReserva}
        newReviewNombre={newReviewNombre}
        setNewReviewNombre={setNewReviewNombre}
        newReviewEstrellas={newReviewEstrellas}
        setNewReviewEstrellas={setNewReviewEstrellas}
        newReviewComment={newReviewComment}
        setNewReviewComment={setNewReviewComment}
        isSubmittingReview={isSubmittingReview}
        reviewErrorMsg={reviewErrorMsg}
        handleCrearResena={handleCrearResena}
      />

      {/* HUD Waze de Ruta — Diseño Premium con Maniobra Integrada */}
      {routeInfo && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '16px',
          background: 'linear-gradient(145deg, rgba(10, 18, 35, 0.92) 0%, rgba(8, 14, 28, 0.96) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 215, 0, 0.25)',
          borderRadius: '18px',
          padding: '0',
          width: '260px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.1)',
          zIndex: 15,
          color: 'white',
          overflow: 'hidden',
        }}>
          {/* Cabecera con maniobra actual */}
          {currentManeuver && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.08) 100%)',
              borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#0A192F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '900',
                boxShadow: '0 4px 14px rgba(255, 215, 0, 0.4)',
              }}>
                {currentManeuver.icon || '⬆'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#FFD700',
                  marginBottom: '2px',
                }}>
                  {currentManeuver.distanceFormatted || formatDistanceDisplay(routeInfo.distance)}
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: '1.3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {currentManeuver.instruction || ''}
                </div>
              </div>
            </div>
          )}

          {/* Cuerpo del HUD */}
          <div style={{ padding: '10px 14px 12px' }}>
            {/* Header: label + botón cerrar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                🚗 {lang === 'en' ? 'Active Route' : 'Ruta Activa'}
              </span>
              <button
                onClick={() => {
                  if (directionsRef.current) directionsRef.current.clean();
                  setRouteInfo(null);
                  setCurrentManeuver(null);
                }}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
              >
                ✕
              </button>
            </div>

            {/* Nombre del destino */}
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '10px' }}>
              📍 {routeInfo.destinationName}
            </div>

            {/* Grid: Tiempo / Distancia */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', padding: '6px 8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                  {lang === 'en' ? 'Duration' : 'Tiempo'}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#10b981' }}>
                  {formatDurationDisplay(routeInfo.duration)}
                </div>
              </div>
              <div style={{ background: 'rgba(255, 215, 0, 0.06)', borderRadius: '10px', padding: '6px 8px', border: '1px solid rgba(255, 215, 0, 0.12)' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                  {lang === 'en' ? 'Distance' : 'Distancia'}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#FFD700' }}>
                  {formatDistanceDisplay(routeInfo.distance)}
                </div>
              </div>
            </div>

            {/* ETA */}
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              <span>{lang === 'en' ? 'Arrival ETA:' : 'Llegada (ETA):'}</span>
              <span style={{ fontWeight: '800', color: 'white' }}>{routeInfo.eta}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Claymórfico de Registro de Visita GPS (> 1 km) */}
      {showVisitPrompt && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 25, 47, 0.75)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #102A45 0%, #0A192F 100%)',
            border: '2px solid #FFD700',
            borderRadius: '24px',
            padding: '32px 28px',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,215,0,0.3)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFE033 0%, #FFD700 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', margin: '0 auto 16px auto',
              boxShadow: '0 8px 20px rgba(255,215,0,0.4)'
            }}>
              🏆
            </div>
            <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", margin: "0 0 10px 0" }}>
              ¡Llegaste a tu Destino!
            </h3>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              Has recorrido más de <strong>1 km</strong> y arribado a <strong>{visitPromptData?.puntoNombre || 'tu destino'}</strong>. ¿Deseas registrar esta visita en tu pasaporte de logros Atlan?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setShowVisitPrompt(false)}
                style={{
                  padding: "12px 20px", background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)", borderRadius: "14px",
                  color: "#FFFFFF", fontWeight: "700", cursor: "pointer"
                }}
              >
                Omitir
              </button>
              <button
                onClick={handleConfirmarVisitaGPS}
                disabled={isSubmittingVisit}
                style={{
                  padding: "12px 24px", background: "linear-gradient(135deg, #FFE033 0%, #FFD700 100%)",
                  border: "none", borderRadius: "14px", color: "#1A1A2E",
                  fontWeight: "900", fontSize: "14px", cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(255,215,0,0.4)"
                }}
              >
                {isSubmittingVisit ? 'Registrando...' : '🎯 Marcar como Visitado (+1 Visita)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Flotante 3D Claymórfico de Notificaciones */}
      {notificationBanner && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '20px',
          zIndex: 10000,
          background: notificationBanner.type === 'success'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(6, 78, 59, 0.95) 100%)'
            : notificationBanner.type === 'warning'
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(120, 53, 15, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(127, 29, 29, 0.95) 100%)',
          color: '#FFFFFF',
          padding: '16px 22px',
          borderRadius: '20px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(16px)',
          maxWidth: '380px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{ fontSize: '26px' }}>
            {notificationBanner.type === 'success' ? '🏆' : notificationBanner.type === 'warning' ? '🔒' : '⚠️'}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#FFFFFF' }}>
              {notificationBanner.title}
            </h4>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.3' }}>
              {notificationBanner.message}
            </p>
          </div>
          <button
            onClick={() => setNotificationBanner(null)}
            style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
