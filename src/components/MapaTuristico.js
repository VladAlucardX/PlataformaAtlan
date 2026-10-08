"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Supercluster from 'supercluster';
import { supabase } from '../lib/supabase';
import { obtenerDepartamentoPorCoordenadas } from '../lib/geoUtils';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './ui/LanguageToggle';
import Icon from './ui/Icon';
import BusinessProfileModal from './ui/BusinessProfileModal';
import { getPointImage, prefetchPointImages, isRealCustomUrl } from '../lib/imageUtils';
import { uploadMedia } from '../lib/storage';
import { validarImagenSegura } from '../lib/imageModeration';
import { CATEGORIAS_CONFIG } from '../lib/categories';
import { isBusinessOpenNow } from '../lib/businessHours';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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
  const destinationMarkerRef = useRef(null);
  const activePopupRef = useRef(null);
  const markersRef = useRef([]);  // Lista de marcadores cargados en el mapa
  const superclusterRef = useRef(null);
  const markersOnMapRef = useRef(new Map());
  const allLoadedPointsRef = useRef([]);
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
  const prevSelectedPointRef = useRef(null);
  const lastRecalculateTimeRef = useRef(0);
  const hasFlownInitialDescentRef = useRef(false);
  const previewRouteBoundsRef = useRef(null);
  const loadedPointIdRef = useRef(null);
  const currentBearingRef = useRef(0);
  const isClearingRoutesRef = useRef(false);


  // --- ESTADO DE REACT ---
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
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
  const [showAddPointOptionModal, setShowAddPointOptionModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tempPointCoords, setTempPointCoords] = useState(null);

  // Formulario nuevo punto
  const [newPointNombre, setNewPointNombre] = useState('');
  const [newPointCreador, setNewPointCreador] = useState('');
  const [newPointDesc, setNewPointDesc] = useState('');
  const [newPointCategoria, setNewPointCategoria] = useState('otro');
  const [isSubmittingPoint, setIsSubmittingPoint] = useState(false);
  const [newPointFotoFile, setNewPointFotoFile] = useState(null);
  const [newPointFotoPreview, setNewPointFotoPreview] = useState(null);
  const [isAnalyzingFoto, setIsAnalyzingFoto] = useState(false);
  const [fotoModerationError, setFotoModerationError] = useState('');

  const handleSeleccionarFotoPunto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFotoModerationError('');
    setIsAnalyzingFoto(true);

    try {
      const validacion = await validarImagenSegura(file);
      if (!validacion.esValida) {
        setFotoModerationError(validacion.razon || (lang === 'en' ? 'Inappropriate photo detected.' : 'Foto no apropiada.'));
        setNewPointFotoFile(null);
        setNewPointFotoPreview(null);
      } else {
        setNewPointFotoFile(file);
        setNewPointFotoPreview(URL.createObjectURL(file));
      }
    } catch (err) {
      console.error('[Atlan Moderacion] Error al validar imagen:', err);
    } finally {
      setIsAnalyzingFoto(false);
    }
  };

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

  const filterScrollRef = useRef(null);
  const searchContainerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Favoritos
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);

  // Búsqueda y HUD Waze
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [previewRouteInfo, setPreviewRouteInfo] = useState(null);

  // Escuchar clics fuera del buscador para ocultar resultados y restaurar categorías al hacer clic en el mapa
  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
        setIsSearchFocused(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutsideSearch);
    document.addEventListener('touchstart', handleClickOutsideSearch);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideSearch);
      document.removeEventListener('touchstart', handleClickOutsideSearch);
    };
  }, []);

  // --- Drag-to-scroll handlers para la barra de categorías ---
  const handleMouseDownFilterBar = (e) => {
    if (!filterScrollRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - filterScrollRef.current.offsetLeft;
    scrollLeftRef.current = filterScrollRef.current.scrollLeft;
  };

  const handleMouseLeaveFilterBar = () => {
    isDraggingRef.current = false;
  };

  const handleMouseUpFilterBar = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMoveFilterBar = (e) => {
    if (!isDraggingRef.current || !filterScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - filterScrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    filterScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

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
        lang === 'en' ? 'Sign In Required 🔒' : lang === 'zh' ? '需要登录 🔒' : 'Inicio de Sesión Requerido 🔒',
        lang === 'en' 
          ? 'Please log in as a tourist to save your visits and level up in department rankings!' 
          : lang === 'zh'
          ? '请以游客身份登录以记录您的访问并在省份排行榜中升级！'
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
        lang === 'en' ? 'Visit Recorded Successfully! 🏆' : lang === 'zh' ? '成功记录打卡！ 🏆' : '¡Visita Registrada con Éxito! 🏆',
        lang === 'en' ? `You added +1 visit in your passport to ${visitPromptData?.puntoNombre || 'this destination'}.` : lang === 'zh' ? `您的护照已增加打卡：${visitPromptData?.puntoNombre || '此目的地'}。` : `Has sumado +1 visita en tu pasaporte a ${visitPromptData?.puntoNombre || 'este destino'}.`
      );
    } catch (err) {
      console.error("Error registrando visita:", err);
      showNotification('error', lang === 'en' ? 'Registration Error' : lang === 'zh' ? '登记失败' : 'Error al Registrar', lang === 'en' ? 'Could not save the visit.' : lang === 'zh' ? '无法保存打卡记录。' : 'No se pudo guardar la visita.');
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

      const handleReFocusOrResize = () => {
        if (mapRef.current) {
          mapRef.current.stop();
          mapRef.current.resize();
          if (selectedPointRef.current && previewRouteBoundsRef.current) {
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            mapRef.current.fitBounds(previewRouteBoundsRef.current, {
              padding: isMobile
                ? { top: 90, bottom: 250, left: 35, right: 35 }
                : { top: 100, bottom: 100, left: 80, right: 80 },
              maxZoom: 15.5,
              duration: 0,
              pitch: 0,
              essential: true
            });
          }
        }
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('focus', handleReFocusOrResize);
      window.addEventListener('resize', handleReFocusOrResize);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          handleReFocusOrResize();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('focus', handleReFocusOrResize);
        window.removeEventListener('resize', handleReFocusOrResize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  // Animación del progreso de la pantalla de carga (0% -> 100% en 10 segundos exactos, números enteros del 0 al 100 sin decimales)
  useEffect(() => {
    let progress = 0;
    setLoadingProgress(0);
    const interval = setInterval(() => {
      progress += 1;
      if (progress >= 100) {
        progress = 100;
        setLoadingProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setIsMapLoading(false);
        }, 120);
      } else {
        setLoadingProgress(progress);
      }
    }, 100); // 100ms * 100 = 10,000ms (10 segundos exactos)

    return () => clearInterval(interval);
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
              <span>${lang === 'en' ? 'Plan Route (A ➔ B)' : lang === 'zh' ? '规划路线 (A ➔ B)' : 'Planificar Ruta (A ➔ B)'}</span>
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
        : lang === 'zh'
        ? { 'Traffic': '实时路况', 'Driving': '驾车', 'Walking': '步行', 'Cycling': '骑行' }
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
        originInput.setAttribute('placeholder', lang === 'en' ? 'Current Location' : lang === 'zh' ? '当前位置' : 'Ubicación actual');
      }
      if (destInput) {
        destInput.setAttribute('placeholder', lang === 'en' ? 'Search destination…' : lang === 'zh' ? '搜索目的地…' : 'Buscar destino…');
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
                    oInput.value = lang === 'en' ? 'Current Location' : lang === 'zh' ? '当前位置' : 'Ubicación actual';
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
    const puntoNorm = normalizarPunto(selectedPoint);

    if (!puntoNorm || puntoNorm.lng === undefined || puntoNorm.lat === undefined || isNaN(puntoNorm.lng) || isNaN(puntoNorm.lat)) {
      setPreviewRouteInfo(null);
      // Solo limpiar si no hay navegación en vivo ni simulación demo en curso
      if (!isNavigatingRef.current && !isDemoRunningRef.current) {
        actualizarMarcadorDestino(null);
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
      }
      renderizarMarcadoresVisibles();
      return;
    }

    // Trazar la trayectoria en la carretera y encuadrar (fitBounds) para centrar la ruta completa
    const fetchPreviewRoute = () => {
      const [oLng, oLat] = currentPosRef.current;
      actualizarPrevisualizacionRuta(oLng, oLat, puntoNorm.lng, puntoNorm.lat, true);
      actualizarMarcadorDestino(puntoNorm);
      renderizarMarcadoresVisibles();
    };

    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.resize();
      fetchPreviewRoute();
    }, 280);

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
    if (!selectedPoint) {
      loadedPointIdRef.current = null;
      setSelectedPointDetails(null);
      setPointReviews([]);
      setPointMenu([]);
      setIsFavorite(false);
      setFavoriteId(null);
      return;
    }

    // Si es un punto nuevo, resetear estados previos; si es el mismo punto al re-enfocar la pestaña, mantener la imagen y datos sin parpadeo
    const pointIdChanged = loadedPointIdRef.current !== selectedPoint.id;
    if (pointIdChanged) {
      loadedPointIdRef.current = selectedPoint.id;
      setSelectedPointDetails(null);
      setPointReviews([]);
      setPointMenu([]);
      setIsFavorite(false);
      setFavoriteId(null);
    }

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
    const wasSelected = prevSelectedPointRef.current;
    selectedPointRef.current = selectedPoint;

    if (selectedPoint) {
      prevSelectedPointRef.current = selectedPoint;
      if (!isNavigatingRef.current) {
        isInteractionPausedRef.current = false; // Resetear para permitir que la ruta se encuadre al seleccionar punto nuevo solo fuera de navegación
      }

      if (mapRef.current) {
        mapRef.current.stop(); // Detener de inmediato cualquier vuelo o animación activa
      }

      // Si el usuario abre detalles, cancelamos cualquier animación inicial de aproximación
      if (cinematicTimeoutsRef.current.length > 0) {
        console.log('[Atlan] Cancelando animación cinematográfica inicial por apertura de punto');
        cinematicTimeoutsRef.current.forEach(t => clearTimeout(t));
        cinematicTimeoutsRef.current = [];
      }
    } else {
      // Si se cierra el panel de detalles (de un punto previamente seleccionado),
      // realizar un zoom-out suavizado en la misma zona para seguir explorando otros puntos cercanos
      if (wasSelected) {
        const lastPoint = wasSelected;
        prevSelectedPointRef.current = null;

        // Solo ajustar cámara si NO estamos en navegación ni demo activo
        if (!isNavigatingRef.current && !isDemoRunningRef.current) {
          isInteractionPausedRef.current = false;
          if (mapRef.current && lastPoint && lastPoint.lng !== undefined && lastPoint.lat !== undefined) {
            mapRef.current.easeTo({
              center: [lastPoint.lng, lastPoint.lat],
              zoom: 14.2,
              pitch: 0,
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
              duration: 1200,
              essential: true
            });
          }
        }
      }

      // Solo mostrar el botón "Volver a centrar" si realmente hay una navegación o demo activa
      if ((isDemoRunningRef.current || routeInfo) && isNavigatingRef.current) {
        setShowRecenterBtn(true);
      } else {
        setShowRecenterBtn(false);
      }
    }
  }, [selectedPoint]);



  // --- HANDLERS DE RESERVAS Y RESEÑAS ---
  const handleCrearReserva = async (e) => {
    e.preventDefault();
    if (!userSession) return;
    setIsSubmittingReserva(true);

    try {
      let isoDate = reservaFechaHora;
      if (reservaFechaHora) {
        try {
          isoDate = new Date(reservaFechaHora).toISOString();
        } catch (_) {}
      }

      const insertPayload = {
        punto_id: selectedPoint?.id || null,
        negocio_id: selectedPoint?.negocio_id || null,
        cliente_id: userSession.user.id,
        fecha_hora: isoDate,
        num_personas: parseInt(reservaPersonas) || 1,
        notas: reservaNotas || '',
        tipo_reserva: reservaTipo || 'mesa',
        estado_reserva: 'pendiente'
      };

      const { error } = await supabase
        .from('reservas')
        .insert([insertPayload]);

      if (error) throw error;
      setReservaSuccess(true);
      setReservaFechaHora('');
      setReservaNotas('');
      setTimeout(() => setReservaSuccess(false), 4000);
    } catch (err) {
      console.error("Error reservando:", err);
      alert("Error al procesar reserva: " + (err.message || 'Intente nuevamente'));
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
          : lang === 'zh'
          ? '检测到不当用语，请修改您的评价。'
          : 'Contenido inapropiado detectado (palabras prohibidas). Por favor modifique su comentario.');
        setIsSubmittingReview(false);
        return;
      }

      const { error } = await supabase
        .from('resenas')
        .insert([{
          punto_id: selectedPoint.id,
          negocio_id: selectedPoint.negocio_id || null,
          autor_nombre: newReviewNombre || (lang === 'en' ? 'Anonymous' : lang === 'zh' ? '匿名用户' : 'Anónimo'),
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
      setReviewErrorMsg(lang === 'en' ? "Error submitting review." : lang === 'zh' ? "提交评价失败。" : "Error al enviar la reseña.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleIniciarViaje = (puntoParam = null) => {
    return iniciarSimulacionDemo(puntoParam);
  };


  const calculateETA = (durationSeconds) => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + durationSeconds);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDurationDisplay = (seconds) => {
    if (seconds < 60) return lang === 'en' ? '< 1 min' : lang === 'zh' ? '< 1分钟' : '< 1 min';
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

  const normalizarPunto = (punto) => {
    if (!punto) return null;
    let lng = punto.lng ?? punto.lon ?? punto.longitude;
    let lat = punto.lat ?? punto.latitude;

    if ((lng === undefined || lat === undefined || isNaN(lng) || isNaN(lat)) && punto.ubicacion && typeof punto.ubicacion === 'string') {
      const match = punto.ubicacion.match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
      if (match) {
        lng = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      } else if (/^[0-9a-fA-F]{42,}$/.test(punto.ubicacion.trim())) {
        try {
          const hex = punto.ubicacion.trim();
          const bytesLng = new Uint8Array(8);
          for (let i = 0; i < 8; i++) {
            bytesLng[i] = parseInt(hex.substr((9 + i) * 2, 2), 16);
          }
          lng = new DataView(bytesLng.buffer).getFloat64(0, true);

          const bytesLat = new Uint8Array(8);
          for (let i = 0; i < 8; i++) {
            bytesLat[i] = parseInt(hex.substr((17 + i) * 2, 2), 16);
          }
          lat = new DataView(bytesLat.buffer).getFloat64(0, true);
        } catch (_) {}
      }
    }

    const parsedLng = typeof lng === 'number' ? lng : parseFloat(lng);
    const parsedLat = typeof lat === 'number' ? lat : parseFloat(lat);

    return {
      ...punto,
      lng: !isNaN(parsedLng) ? parsedLng : punto.lng,
      lat: !isNaN(parsedLat) ? parsedLat : punto.lat,
    };
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
      const normalized = (data || []).map(normalizarPunto);
      setSearchResults(normalized);
      setShowResults(true);
    } catch (err) {
      console.warn("[Atlan Offline] Buscando en caché local debido a error de conexión:", err);
      const cached = localStorage.getItem('atlan_puntos_cercanos');
      if (cached) {
        const cachedPoints = JSON.parse(cached).map(normalizarPunto);
        const filtered = cachedPoints.filter(p =>
          p.nombre?.toLowerCase().includes(query.toLowerCase()) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(query.toLowerCase()))
        );
        setSearchResults(filtered);
        setShowResults(true);
      }
    }
  };

  const selectSearchResult = (rawPunto) => {
    const punto = normalizarPunto(rawPunto);
    setShowResults(false);
    setIsSearchFocused(false);
    setSearchQuery('');
    if (mapRef.current && punto && punto.lng !== undefined && punto.lat !== undefined && !isNaN(punto.lng) && !isNaN(punto.lat)) {
      mapRef.current.stop(); // Detener cualquier vuelo previo para que el mouse quede liberado
      cargarPuntosCercanos(punto.lng, punto.lat, filtroCategoria);
      setSelectedPoint(punto);
    }
  };

  // Auto-selección y búsqueda al ingresar desde enlace externo con ?spot= o ?lugar=
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const spotParam = params.get('spot') || params.get('lugar') || params.get('punto');
    if (spotParam) {
      const timer = setTimeout(() => {
        handleSearch(spotParam);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

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
        utterance.lang = lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : 'es-ES';
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

  // ── ESCALADO DINÁMICO ADAPTATIVO POR ZOOM (OPCIÓN A: 2 ESTADOS NÍTIDOS) ──
  const actualizarEscalaMarcadores = () => {
    if (!mapRef.current || !mapContainerRef.current) return;
    const z = mapRef.current.getZoom();
    
    // Transición en 2 Estados Nítidos:
    // Estado 1: Zoom >= 14 (Barrio/Calle) -> Escala 1.0 (38px completo con iconos e insignias)
    // Estado 2: Zoom 12 a 13.9 (Ciudad)   -> Escala 0.82 (31px cómodo, icono 100% nítido, sin micro-insignias)
    // Estado 3: Zoom < 12 (Departamental) -> Pasan a Clusters regionales
    let scale = 1.0;
    if (z < 14) {
      scale = z >= 12 ? 0.82 : 0.74;
    }

    mapContainerRef.current.style.setProperty('--marker-zoom-scale', scale.toFixed(2));
    if (z < 14) {
      mapContainerRef.current.classList.add('zoom-level-compact');
    } else {
      mapContainerRef.current.classList.remove('zoom-level-compact');
    }
  };

  // ── MARCADOR DE CLUSTER (SUPERCLUSTER ATLAN) ──
  const crearMarcadorCluster = (feature) => {
    const count = feature.properties.point_count;
    const clusterId = feature.properties.cluster_id;
    const [lng, lat] = feature.geometry.coordinates;

    const el = document.createElement('div');
    el.className = 'atlan-cluster-container';

    let sizeTier = 'sm';
    let sizePx = 38;
    if (count >= 50) {
      sizeTier = 'lg';
      sizePx = 52;
    } else if (count >= 15) {
      sizeTier = 'md';
      sizePx = 44;
    }

    const formattedCount = count > 999 ? (count / 1000).toFixed(1) + 'k' : count;

    el.innerHTML = `
      <div class="atlan-cluster-badge atlan-cluster-${sizeTier}" style="width:${sizePx}px; height:${sizePx}px;">
        ${sizeTier !== 'sm' ? '<div class="atlan-cluster-pulse-ring"></div>' : ''}
        <div class="atlan-cluster-inner">
          <span class="atlan-cluster-count">${formattedCount}</span>
        </div>
      </div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        if (!superclusterRef.current || !mapRef.current) return;
        const expansionZoom = superclusterRef.current.getClusterExpansionZoom(clusterId);
        mapRef.current.easeTo({
          center: [lng, lat],
          zoom: Math.min(Math.max(expansionZoom, 13.5), 17.5),
          duration: 600,
          essential: true
        });
      } catch (err) {
        console.warn('[Atlan] Error expandiendo cluster:', err);
      }
    });

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat]);

    return marker;
  };

  // ── MARCADOR INDIVIDUAL DE NEGOCIO / PUNTO ──
  const crearMarcadorPunto = (punto) => {
    const config = CATEGORIAS_CONFIG[punto.categoria] || CATEGORIAS_CONFIG.otro;

    // 1. Anclaje simétrico fijo en Mapbox (38px × 38px)
    const el = document.createElement('div');
    el.className = 'marker-custom-container';
    el.style.width = '38px';
    el.style.height = '38px';

    const inner = document.createElement('div');
    inner.className = 'marker-custom';
    inner.style.position = 'relative';
    inner.style.backgroundColor = config.color;
    inner.style.width = '38px';
    inner.style.height = '38px';
    inner.style.borderRadius = '50%';
    inner.style.display = 'flex';
    inner.style.justifyContent = 'center';
    inner.style.alignItems = 'center';
    inner.style.fontSize = '18px';
    inner.style.cursor = 'pointer';
    inner.style.transformOrigin = 'center center';
    inner.style.transform = 'translateY(0) scale(var(--marker-zoom-scale, 1))';
    inner.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
    inner.innerHTML = config.svgFile
      ? `<img src="${config.svgFile}" alt="${punto.categoria || 'categoria'}" style="width:20px;height:20px;object-fit:contain;filter:brightness(0) invert(1);" />`
      : config.svg;

    // Insignia de estado circular en la esquina
    const badge = document.createElement('div');
    badge.className = 'marker-status-badge';
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
      const isClaimed = !!punto.negocio_id;
      badge.style.backgroundColor = isClaimed ? '#10b981' : '#f59e0b';
      badge.innerHTML = isClaimed ? '✓' : '❓';
      badge.style.color = 'white';
      badge.style.fontWeight = isClaimed ? 'bold' : 'normal';
      inner.style.border = `2.5px solid ${isClaimed ? '#10b981' : '#f59e0b'}`;
      inner.style.boxShadow = `0 0 12px ${isClaimed ? 'rgba(16, 185, 129, 0.6)' : 'rgba(245, 158, 11, 0.5)'}`;
    }

    inner.appendChild(badge);
    el.appendChild(inner);

    // Elevación vertical directa con escala completa (38px) en hover
    el.addEventListener('mouseenter', () => {
      inner.style.transform = 'translateY(-5px) scale(1)';
      el.style.zIndex = '999';
    });
    el.addEventListener('mouseleave', () => {
      inner.style.transform = 'translateY(0) scale(var(--marker-zoom-scale, 1))';
      el.style.zIndex = 'auto';
    });

    // Estructura del Popup Premium
    const isClaimed = !!punto.negocio_id;
    const ratingText = punto.negocio_rating ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" style="display:inline-block;vertical-align:middle;color:#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${punto.negocio_rating}` : '';

    let statusText = '';
    let statusColor = '';

    if (punto.estado === 'en_verificacion') {
      statusText = lang === 'en' ? 'Pending Confirmation' : lang === 'zh' ? '待审核确认' : 'Pendiente de Confirmar';
      statusColor = '#f97316';
    } else if (punto.estado === 'aprobado') {
      statusText = lang === 'en' ? 'Confirmed' : lang === 'zh' ? '已确认' : 'Confirmado';
      statusColor = '#10b981';
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
                ${lang === 'en' ? 'Photos Coming Soon' : lang === 'zh' ? '照片即将上线' : 'PRÓXIMAMENTE'}
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
            🏷️ ${formatPriceRange(punto.negocio_rango_precios)}
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

          ${(() => {
            const puntoServs = punto.servicios || punto.detalles?.servicios || {};
            const puntoCanBook = Boolean(
              puntoServs.has_online_booking === true ||
              punto.has_online_booking === true ||
              punto.detalles?.has_online_booking === true ||
              puntoServs.has_reservas === true
            );
            const btnLabel = puntoCanBook 
              ? (lang === 'en' ? 'Details & Booking' : lang === 'zh' ? '详情与预订' : 'Detalles y Reservas')
              : (lang === 'en' ? 'View Details' : lang === 'zh' ? '查看详情' : 'Ver Detalles');
            return `
              <button id="${btnInfoId}" style="width:100%; box-sizing:border-box; margin:0 auto; padding:10px 14px; background:rgba(255,255,255,0.12); color:#FFFFFF; border:1px solid rgba(255,255,255,0.25); border-radius:12px; font-weight:800; font-size:12px; cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center;">
                <div style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; text-align:center; margin:0 auto;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span style="display:inline-block; text-align:center; line-height:1.2;">${btnLabel}</span>
                </div>
              </button>
            `;
          })()}
        </div>
      </div>
    `;

    const popup = new mapboxgl.Popup({ offset: [0, -14], anchor: 'bottom', closeButton: false }).setHTML(popupHTML);

    el.addEventListener('click', () => {
      lugarDestinoRef.current = punto.nombre;
      if (isNavigatingRef.current && (isDemoRunningRef.current || routeInfo)) {
        isInteractionPausedRef.current = true;
        setShowRecenterBtn(true);
      }
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

      if (mapRef.current) {
        mapRef.current.easeTo({
          center: [punto.lng, punto.lat],
          offset: [0, 240],
          duration: 500,
          essential: true
        });
      }

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
          popup.remove();
          handleIniciarViaje(punto);
        };
      }

      const btnInfo = document.getElementById(btnInfoId);
      if (btnInfo) {
        btnInfo.onclick = () => {
          if (isNavigatingRef.current && (isDemoRunningRef.current || routeInfo)) {
            isInteractionPausedRef.current = true;
            setShowRecenterBtn(true);
          }
          setSelectedPoint(punto);
          popup.remove();
        };
      }
    });

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([punto.lng, punto.lat])
      .setPopup(popup);

    return marker;
  };

  // ── MARCADOR EXCLUSIVO DE DESTINO (PUNTO B) ──
  const actualizarMarcadorDestino = (punto) => {
    if (!mapRef.current) return;

    if (!punto || punto.lng === undefined || punto.lat === undefined) {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
        destinationMarkerRef.current = null;
      }
      return;
    }

    const lng = Number(punto.lng);
    const lat = Number(punto.lat);
    if (isNaN(lng) || isNaN(lat)) return;

    const config = CATEGORIAS_CONFIG[punto.categoria] || CATEGORIAS_CONFIG.otro;

    if (!destinationMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'atlan-destination-pin-container';

      el.innerHTML = `
        <div class="atlan-destination-pulse-glow"></div>
        <div class="atlan-destination-pin">
          <div class="atlan-destination-pin-inner">
            ${config.svgFile
              ? `<img src="${config.svgFile}" alt="" style="width:18px;height:18px;object-fit:contain;filter:brightness(0) invert(1);" />`
              : '📍'}
          </div>
        </div>
        <div class="atlan-destination-label">
          <span class="atlan-destination-badge-b">B</span>
          <span style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${punto.nombre}</span>
        </div>
      `;

      destinationMarkerRef.current = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    } else {
      destinationMarkerRef.current.setLngLat([lng, lat]);
      const label = destinationMarkerRef.current.getElement().querySelector('.atlan-destination-label');
      if (label) {
        label.innerHTML = `
          <span class="atlan-destination-badge-b">B</span>
          <span style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${punto.nombre}</span>
        `;
      }
    }
  };

  // ── RENDERIZADO DIFERENCIAL DE MARCADORES Y CLUSTERS VISIBLES ──
  const renderizarMarcadoresVisibles = () => {
    if (!mapRef.current || !superclusterRef.current) return;

    try {
      // Verificar si hay una ruta o previsualización de viaje activa entre Punto A y Punto B
      const isRouteActive = Boolean(selectedPointRef.current || routeInfo || previewRouteInfo);
      const isActivelyNavigating = Boolean(isNavigatingRef.current || isDemoRunningRef.current);
      const isExploringManually = Boolean(isInteractionPausedRef.current);

      // Si hay un punto seleccionado / ruta, actualizar el marcador de destino (Punto B)
      const destPoint = selectedPointRef.current || (destinationRef.current ? {
        lng: destinationRef.current[0],
        lat: destinationRef.current[1],
        nombre: lugarDestinoRef.current || (lang === 'en' ? 'Destination' : lang === 'zh' ? '目的地' : 'Destino'),
        categoria: 'otro'
      } : null);

      if (destPoint) {
        actualizarMarcadorDestino(destPoint);
      } else {
        actualizarMarcadorDestino(null);
      }


      const bounds = mapRef.current.getBounds();
      const west = Math.max(-180, bounds.getWest());
      const south = Math.max(-85, bounds.getSouth());
      const east = Math.min(180, bounds.getEast());
      const north = Math.min(85, bounds.getNorth());
      const currentZoom = Math.floor(mapRef.current.getZoom());

      const clusters = superclusterRef.current.getClusters([west, south, east, north], currentZoom);

      const currentMarkersMap = markersOnMapRef.current;
      const nextMarkersMap = new Map();

      clusters.forEach((feature) => {
        const isCluster = Boolean(feature.properties && feature.properties.cluster);

        // Si la ruta está activa (Punto A ➔ Punto B), omitir burbujas de cluster agrupadas,
        // pero SÍ mantener visibles todos los negocios individuales para que el usuario pueda explorarlos libremente
        if (isRouteActive && isCluster) return;

        // Si este punto es el destino seleccionado y ya cuenta con el pin distintivo B, evitar duplicado
        if (destPoint && !isCluster && (feature.properties?.id === destPoint.id || (Number(feature.properties?.lng) === Number(destPoint.lng) && Number(feature.properties?.lat) === Number(destPoint.lat)))) {
          return;
        }

        const markerKey = isCluster
          ? `cluster_${feature.properties.cluster_id}`
          : `point_${feature.properties.id}`;

        if (currentMarkersMap.has(markerKey)) {
          nextMarkersMap.set(markerKey, currentMarkersMap.get(markerKey));
          currentMarkersMap.delete(markerKey);
          return;
        }

        if (isCluster) {
          const clusterMarker = crearMarcadorCluster(feature);
          clusterMarker.addTo(mapRef.current);
          nextMarkersMap.set(markerKey, clusterMarker);
        } else {
          const punto = feature.properties;
          const pointMarker = crearMarcadorPunto(punto);
          pointMarker.addTo(mapRef.current);
          nextMarkersMap.set(markerKey, pointMarker);
        }
      });

      // Limpiar los marcadores que salieron del encuadre
      currentMarkersMap.forEach((marker) => {
        marker.remove();
      });

      markersOnMapRef.current = nextMarkersMap;
      markersRef.current = Array.from(nextMarkersMap.values());
    } catch (err) {
      console.error('[Atlan] Error renderizando marcadores visibles:', err);
    }
  };

  // Cargar puntos desde Supabase
  const cargarPuntosCercanos = async (lon, lat, categoria = null) => {
    if (!mapRef.current) return;

    // Limpiar marcadores anteriores
    markersOnMapRef.current.forEach((marker) => marker.remove());
    markersOnMapRef.current.clear();
    markersRef.current = [];

    try {
      console.log(`[Atlan] Cargando puntos cercanos. Categoría: ${categoria || 'Todas'}`);

      let data = [];
      let error = null;

      try {
        const res = await supabase.rpc('buscar_puntos_cercanos', {
          user_lon: lon,
          user_lat: lat,
          radio_metros: 500000,
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
          const allCached = JSON.parse(cached).map(normalizarPunto);
          pointsToRender = categoria
            ? allCached.filter(p => p.categoria === categoria)
            : allCached;
        }
      } else {
        // Filtrar en JavaScript para mostrar también 'en_verificacion'
        const rawPoints = (data || []).map(normalizarPunto);
        pointsToRender = rawPoints.filter(p => (p.estado === 'aprobado' || p.estado === 'sin_reclamar' || p.estado === 'en_verificacion') && p.lng !== undefined && p.lat !== undefined && !isNaN(p.lng) && !isNaN(p.lat));
        if (pointsToRender.length > 0) {
          localStorage.setItem('atlan_puntos_cercanos', JSON.stringify(pointsToRender));
        }
      }

      if (pointsToRender.length === 0) {
        console.log('[Atlan] RPC sin resultados, cargando puntos directamente de la tabla...');
        try {
          const { data: tableData, error: tableError } = await supabase
            .from('puntos')
            .select('*');
          if (!tableError && tableData && tableData.length > 0) {
            const rawPoints = tableData.map(normalizarPunto);
            pointsToRender = rawPoints.filter(p =>
              (p.estado === 'aprobado' || p.estado === 'sin_reclamar' || p.estado === 'en_verificacion') &&
              p.lng !== undefined && p.lat !== undefined && !isNaN(p.lng) && !isNaN(p.lat)
            );
            if (categoria) {
              pointsToRender = pointsToRender.filter(p => p.categoria === categoria);
            }
          }
        } catch (fbErr) {
          console.error('[Atlan] Error en fallback de tabla puntos:', fbErr);
        }
      }

      allLoadedPointsRef.current = pointsToRender;

      const validPoints = pointsToRender.filter((p) => {
        const lng = Number(p.lng);
        const lat = Number(p.lat);
        return !isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0;
      });

      if (validPoints.length === 0) {
        console.log('[Atlan] No se encontraron puntos válidos.');
        superclusterRef.current = null;
        return;
      }

      // Convertir a GeoJSON Features para Supercluster
      const features = validPoints.map((punto) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(punto.lng), Number(punto.lat)],
        },
        properties: {
          ...punto,
          cluster: false,
        },
      }));

      const sc = new Supercluster({
        radius: 38,     // Radio fino: solo se agrupan si están casi superpuestos en pantalla
        maxZoom: 12,    // A partir de zoom 12.5 / 13 todos los puntos se muestran individuales en la ciudad
        minPoints: 2,   // Agrupar a partir de 2 negocios
      });
      sc.load(features);
      superclusterRef.current = sc;

      actualizarEscalaMarcadores();
      renderizarMarcadoresVisibles();
    } catch (err) {
      console.error('[Atlan] Error inesperado en cargarPuntosCercanos:', err);
    }
  };

  const actualizarPrevisualizacionRuta = async (oLng, oLat, dLng, dLat, isInitialFit = false) => {
    if (oLng === undefined || oLat === undefined || dLng === undefined || dLat === undefined || isNaN(oLng) || isNaN(oLat) || isNaN(dLng) || isNaN(dLat)) {
      return;
    }

    let coords = [];
    let routeDistance = 0;
    let routeDuration = 0;

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        coords = data.routes[0].geometry.coordinates;
        routeDistance = data.routes[0].distance;
        routeDuration = data.routes[0].duration;
      } else {
        // Fallback a driving estándar
        const fallbackUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
        const resFb = await fetch(fallbackUrl);
        const dataFb = await resFb.json();
        if (dataFb.routes && dataFb.routes.length > 0) {
          coords = dataFb.routes[0].geometry.coordinates;
          routeDistance = dataFb.routes[0].distance;
          routeDuration = dataFb.routes[0].duration;
        }
      }
    } catch (err) {
      console.warn('[Atlan] Error al consultar ruta de Mapbox:', err);
    }

    // Si la API no devuelve coordenadas, trazar línea de proyección directa
    if (coords.length === 0) {
      coords = [[oLng, oLat], [dLng, dLat]];
      routeDistance = calcDistanceMeters([oLng, oLat], [dLng, dLat]);
      routeDuration = (routeDistance / 1000) * 120;
    }

    const applyPreviewRouteData = () => {
      if (!mapRef.current) return;
      try {
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
      } catch (e) {
        console.warn('[Atlan] Error aplicando geometría a preview-route:', e);
      }
    };

    applyPreviewRouteData();
    setTimeout(applyPreviewRouteData, 450);
    setTimeout(applyPreviewRouteData, 1200);

    // Ajustar vista del mapa si es el fit inicial (Centrar trayectoria completa)
    if (coords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach(coord => bounds.extend(coord));
      previewRouteBoundsRef.current = bounds;

      if (isInitialFit && mapRef.current) {
        mapRef.current.stop();
        if (mapRef.current.resize) mapRef.current.resize();
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        mapRef.current.fitBounds(bounds, {
          padding: isMobile
            ? { top: 90, bottom: 250, left: 35, right: 35 }
            : { top: 100, bottom: 100, left: 80, right: 80 },
          maxZoom: 15.5,
          duration: isInitialFit ? 1800 : 0,
          pitch: 0,
          essential: true
        });
      }
    }

    setPreviewRouteInfo({
      distance: routeDistance,
      duration: routeDuration
    });
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

    if (typeof window !== 'undefined') {
      window.resetAtlanInactivityTimer?.();
      window.__atlanActiveNavigation = !!(isNavigatingRef.current || isDemoRunningRef.current);
    }

    if (mapRef.current) {
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'nav-arrow-pulsing';
        el.innerHTML = `
          <svg width="44" height="44" viewBox="0 0 24 24" fill="#0284c7" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 8px rgba(2, 132, 199, 0.7));">
            <path d="M12 2L4 20L12 17L20 20L12 2Z" fill="#00a8ff" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        `;
        userMarkerRef.current = new mapboxgl.Marker({
          element: el,
          rotationAlignment: 'map',
          pitchAlignment: 'map'
        })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLngLat([longitude, latitude]);
      }

      // Rotar el vehículo en la dirección exacta de la carretera
      if (userMarkerRef.current && bearing !== null && !isNaN(bearing)) {
        userMarkerRef.current.setRotation(bearing);
      }
    }

    if (bearing !== null && !isNaN(bearing)) {
      currentBearingRef.current = bearing;
    }

    if (isNavigatingRef.current && !isInteractionPausedRef.current && mapRef.current) {
      const opts = {
        center: [longitude, latitude],
        zoom: 16.5,
        pitch: 55,
        duration: 900,
        essential: true,
      };
      if (bearing !== null && !isNaN(bearing)) {
        opts.bearing = bearing;
      }
      mapRef.current.easeTo(opts);
    }

    // Rediseñar la trayectoria futura en tiempo real si el usuario cambia de ubicación fuera de navegación
    if (selectedPointRef.current && !isNavigatingRef.current) {
      actualizarPrevisualizacionRuta(longitude, latitude, selectedPointRef.current.lng, selectedPointRef.current.lat, false);
    }

    // Si estamos en viaje (navegación real) y no en demo:
    if (isNavigatingRef.current && !isDemoRunningRef.current) {
      // 1. Actualizar avisos de maniobras y progreso en el HUD con la posición GPS real
      checkDistanceAnnouncements(longitude, latitude);

      // 2. Verificar llegada al destino (< 35 metros)
      if (destinationRef.current) {
        const distDestino = calcDistanceMeters([longitude, latitude], destinationRef.current);
        if (distDestino < 35) {
          const destinoNombre = lugarDestinoRef.current || 'su destino';
          speakInstruction(t('map.arrived'), true);
          cancelarRutaActiva();
          setVisitPromptData({
            puntoId: null,
            puntoNombre: destinoNombre,
            distanciaKm: Math.round(distDestino / 100) / 10
          });
          setShowVisitPrompt(true);
          return;
        }
      }

      // 3. Verificar si el usuario se desvió para recalcular ruta (> 65 metros)
      if (rutaCoordenadasRef.current.length > 0) {
        const distALaRuta = calcularDistanciaMinimaALaRuta([longitude, latitude], rutaCoordenadasRef.current);
        const ahora = Date.now();

        if (distALaRuta > 65 && (ahora - lastRecalculateTimeRef.current) > 12000) {
          lastRecalculateTimeRef.current = ahora;
          speakInstruction(lang === 'en' ? 'Recalculating route' : lang === 'zh' ? '正在重新规划路线' : 'Recalculando ruta', true);
          
          if (destinationRef.current) {
            fetchRouteCoords([longitude, latitude], destinationRef.current);
          }
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
    t = t.replace(/en dirección (al?|hacia el?) (norte|sur|este|oeste)/gi, "recto");
    t = t.replace(/hacia el (norte|sur|este|oeste)/gi, "recto");
    t = t.replace(/dirígete (al|hacia el) (norte|sur|este|oeste)/gi, "siga recto");
    t = t.replace(/conduzca (al|hacia el) (norte|sur|este|oeste)/gi, "siga recto");
    t = t.replace(/\s*\.\s*$/g, "");
    t = t.replace(/\s+/g, " ").trim();
    if (t.toLowerCase() === 'conduzca' || t.toLowerCase() === 'conduzca.' || t.toLowerCase() === 'siga' || t.toLowerCase() === 'conduzca recto') {
      t = 'Siga recto';
    }
    return t;
  };

  const getManeuverIcon = (type = '', modifier = '', instruction = '') => {
    const mod = (modifier || '').toLowerCase();
    const typ = (type || '').toLowerCase();
    const text = (instruction || '').toLowerCase();

    // 1. Llegada al destino
    if (typ.includes('arrive') || typ.includes('destination') || text.includes('llegad') || text.includes('destino') || text.includes('arrived')) {
      return '🏁';
    }

    // 2. Rotonda / Glorieta
    if (typ.includes('roundabout') || typ.includes('rotary') || text.includes('rotonda') || text.includes('roundabout') || text.includes('glorieta')) {
      return '🔄';
    }

    // 3. Giro en U / Retorno
    if (mod.includes('uturn') || text.includes('vuelta en u') || text.includes('giro en u') || text.includes('retorno') || text.includes('u-turn')) {
      return '↩';
    }

    // 4. Giro pronunciado / agudo
    if (mod.includes('sharp right') || text.includes('giro pronunciado a la derecha') || text.includes('doble bruscamente a la derecha')) return '↳';
    if (mod.includes('sharp left') || text.includes('giro pronunciado a la izquierda') || text.includes('doble bruscamente a la izquierda')) return '↲';

    // 5. Giro a la derecha (normal o leve)
    if (
      mod.includes('right') ||
      text.includes('gire a la derecha') ||
      text.includes('vuelta a la derecha') ||
      text.includes('doble a la derecha') ||
      text.includes('doblar a la derecha') ||
      text.includes('turn right')
    ) {
      if (mod.includes('slight') || text.includes('leve')) return '↗';
      return '↱';
    }

    // 6. Giro a la izquierda (normal o leve)
    if (
      mod.includes('left') ||
      text.includes('gire a la izquierda') ||
      text.includes('vuelta a la izquierda') ||
      text.includes('doble a la izquierda') ||
      text.includes('doblar a la izquierda') ||
      text.includes('turn left')
    ) {
      if (mod.includes('slight') || text.includes('leve')) return '↖';
      return '↰';
    }

    // 7. Seguir recto por defecto
    return '⬆';
  };

  const getManeuverIconKey = (type = '', modifier = '', instruction = '') => {
    const mod = (modifier || '').toLowerCase();
    const typ = (type || '').toLowerCase();
    const text = (instruction || '').toLowerCase();
    
    if (typ.includes('arrive') || typ.includes('destination') || text.includes('llegad') || text.includes('destino') || text.includes('arrived')) return 'arrive';
    if (typ.includes('roundabout') || typ.includes('rotary') || text.includes('rotonda') || text.includes('roundabout') || text.includes('glorieta')) return 'roundabout';
    if (mod.includes('uturn') || text.includes('vuelta en u') || text.includes('giro en u') || text.includes('retorno') || text.includes('u-turn')) return 'uturn';
    if (mod.includes('sharp right') || text.includes('pronunciado a la derecha')) return 'sharp-right';
    if (mod.includes('sharp left') || text.includes('pronunciado a la izquierda')) return 'sharp-left';
    if (mod.includes('slight right') || text.includes('leve a la derecha')) return 'slight-right';
    if (mod.includes('slight left') || text.includes('leve a la izquierda')) return 'slight-left';
    if (mod.includes('right') || text.includes('derecha')) return 'turn-right';
    if (mod.includes('left') || text.includes('izquierda')) return 'turn-left';
    return 'straight';
  };

  const renderManeuverIcon = (key, size = 24, color = '#FFFFFF') => {
    const props = {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: { display: 'block' }
    };

    switch (key) {
      case 'arrive':
        return (
          <svg {...props}>
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
            <circle cx="12" cy="10" r="3" fill={color} />
          </svg>
        );
      case 'turn-right':
        return (
          <svg {...props}>
            <path d="M6 20v-8a4 4 0 0 1 4-4h8" />
            <polyline points="14 4 18 8 14 12" />
          </svg>
        );
      case 'turn-left':
        return (
          <svg {...props}>
            <path d="M18 20v-8a4 4 0 0 0-4-4H6" />
            <polyline points="10 4 6 8 10 12" />
          </svg>
        );
      case 'slight-right':
        return (
          <svg {...props}>
            <path d="M7 17L17 7" />
            <polyline points="10 7 17 7 17 14" />
          </svg>
        );
      case 'slight-left':
        return (
          <svg {...props}>
            <path d="M17 17L7 7" />
            <polyline points="14 7 7 7 7 14" />
          </svg>
        );
      case 'sharp-right':
        return (
          <svg {...props}>
            <path d="M6 19v-4a6 6 0 0 1 6-6h6" />
            <polyline points="14 5 18 9 14 13" />
          </svg>
        );
      case 'sharp-left':
        return (
          <svg {...props}>
            <path d="M18 19v-4a6 6 0 0 0-6-6H6" />
            <polyline points="10 5 6 9 10 13" />
          </svg>
        );
      case 'uturn':
        return (
          <svg {...props}>
            <path d="M18 20V10A6 6 0 0 0 6 10v6" />
            <polyline points="10 12 6 16 2 12" />
          </svg>
        );
      case 'roundabout':
        return (
          <svg {...props}>
            <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.7L21 8" />
            <polyline points="21 3 21 8 16 8" />
          </svg>
        );
      case 'straight':
      default:
        return (
          <svg {...props}>
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        );
    }
  };

  const buildManeuverList = (steps) => {
    const list = [];
    steps.forEach((step, idx) => {
      if (!step.maneuver?.instruction) return;
      const mType = (step.maneuver.type || '').toLowerCase();
      if (idx === 0 && (mType.includes('depart') || mType.includes('head')) && steps.length > 1) return;

      const [mLng, mLat] = step.maneuver.location;
      const mModifier = step.maneuver.modifier || '';
      const rawInstr = step.maneuver.instruction || '';
      const cleanInstr = limpiarInstruccion(rawInstr);
      const iconKey = getManeuverIconKey(mType, mModifier, cleanInstr || rawInstr);

      list.push({
        lng: mLng,
        lat: mLat,
        instruction: cleanInstr || rawInstr,
        type: mType,
        modifier: mModifier,
        iconKey: iconKey,
        icon: getManeuverIcon(mType, mModifier, cleanInstr || rawInstr),
        segmentDist: step.distance || 0,
        announcedFar: false,
        announcedMid: false,
        announcedClose: false,
        announcedArrive: false,
      });
    });

    if (list.length === 0 && steps.length > 0) {
      const step = steps[0];
      if (step.maneuver?.location) {
        const [mLng, mLat] = step.maneuver.location;
        const mType = (step.maneuver.type || '').toLowerCase();
        const mModifier = step.maneuver.modifier || '';
        const rawInstr = step.maneuver.instruction || '';
        const cleanInstr = limpiarInstruccion(rawInstr);
        list.push({
          lng: mLng,
          lat: mLat,
          instruction: cleanInstr || rawInstr,
          type: mType,
          modifier: mModifier,
          iconKey: getManeuverIconKey(mType, mModifier, cleanInstr || rawInstr),
          icon: getManeuverIcon(mType, mModifier, cleanInstr || rawInstr),
          segmentDist: step.distance || 0,
          announcedFar: false,
          announcedMid: false,
          announcedClose: false,
          announcedArrive: false,
        });
      }
    }

    return list;
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      const km = (meters / 1000).toFixed(1);
      return km.endsWith('.0') 
        ? `${parseInt(km)} ${lang === 'en' ? 'kilometers' : lang === 'zh' ? '公里' : 'kilómetros'}` 
        : `${km} ${lang === 'en' ? 'kilometers' : lang === 'zh' ? '公里' : 'kilómetros'}`;
    }
    const rounded = Math.round(meters / 50) * 50;
    return `${Math.max(50, rounded)} ${lang === 'en' ? 'meters' : lang === 'zh' ? '米' : 'metros'}`;
  };

  const checkDistanceAnnouncements = (currentLng, currentLat) => {
    const maneuvers = maneuversRef.current;
    if (!maneuvers || !maneuvers.length) {
      if (destinationRef.current) {
        const distDestino = calcDistanceMeters([currentLng, currentLat], destinationRef.current);
        setCurrentManeuver({
          instruction: lang === 'en' ? 'Continue to destination' : lang === 'zh' ? '继续前往目的地' : 'Continúe hacia el destino',
          distance: distDestino,
          distanceFormatted: formatDistanceDisplay(distDestino),
          iconKey: 'arrive',
          icon: '🏁',
          nextNext: null
        });
        setRouteInfo(prev => prev ? { ...prev, distance: distDestino } : prev);
      }
      return;
    }

    let next = maneuvers[0];
    if (!next) return;

    let dist = calcDistanceMeters([currentLng, currentLat], [next.lng, next.lat]);
    const now = Date.now();
    const silenceSec = (now - (lastAnnouncementTimeRef.current || 0)) / 1000;

    const isCloseToTurn = dist < 65;
    const isMovingAwayAfterApproach = next.lastDist !== undefined && dist > next.lastDist + 20 && next.lastDist < 150;
    const isCloserToNextStep = maneuvers.length > 1 && calcDistanceMeters([currentLng, currentLat], [maneuvers[1].lng, maneuvers[1].lat]) < dist;

    if ((isCloseToTurn || isMovingAwayAfterApproach || isCloserToNextStep) && maneuvers.length > 1) {
      if (!next.announcedArrive) {
        next.announcedArrive = true;
        speakInstruction(next.instruction, true);
        lastAnnouncementTimeRef.current = now;
      }
      maneuvers.shift();
      next = maneuvers[0];
      dist = calcDistanceMeters([currentLng, currentLat], [next.lng, next.lat]);
    } else {
      next.lastDist = dist;
    }

    const nextNext = maneuvers.length > 1 ? maneuvers[1] : null;
    const iconKey = next.iconKey || getManeuverIconKey(next.type, next.modifier, next.instruction);
    const nextNextIconKey = nextNext ? (nextNext.iconKey || getManeuverIconKey(nextNext.type, nextNext.modifier, nextNext.instruction)) : null;

    setCurrentManeuver({
      instruction: next.instruction,
      distance: dist,
      distanceFormatted: formatDistanceDisplay(dist),
      iconKey: iconKey,
      icon: next.icon || getManeuverIcon(next.type, next.modifier, next.instruction),
      nextNext: nextNext ? {
        instruction: nextNext.instruction,
        iconKey: nextNextIconKey,
      } : null
    });

    if (destinationRef.current) {
      const distDestino = calcDistanceMeters([currentLng, currentLat], destinationRef.current);
      setRouteInfo(prev => prev ? {
        ...prev,
        distance: distDestino,
        eta: calculateETA(Math.round((distDestino / 1000) * 120))
      } : prev);
    }

    if (dist < 300 && !next.announcedClose) {
      next.announcedClose = true;
      const msg = lang === 'en' ? `In ${formatDistance(dist)}, ${next.instruction}` : lang === 'zh' ? `${formatDistance(dist)}后，${next.instruction}` : `En ${formatDistance(dist)}, ${next.instruction.toLowerCase()}`;
      speakInstruction(msg, true);
      lastAnnouncementTimeRef.current = now;
      return;
    }

    if (dist < 600 && !next.announcedMid) {
      next.announcedMid = true;
      const msg = lang === 'en' ? `In ${formatDistance(dist)}, ${next.instruction}` : lang === 'zh' ? `${formatDistance(dist)}后，${next.instruction}` : `En ${formatDistance(dist)}, ${next.instruction.toLowerCase()}`;
      speakInstruction(msg, true);
      lastAnnouncementTimeRef.current = now;
      return;
    }

    if (dist < 2000 && !next.announcedFar) {
      next.announcedFar = true;
      const msg = lang === 'en' ? `In ${formatDistance(dist)}, ${next.instruction}` : lang === 'zh' ? `${formatDistance(dist)}后，${next.instruction}` : `En ${formatDistance(dist)}, ${next.instruction.toLowerCase()}`;
      speakInstruction(msg);
      lastAnnouncementTimeRef.current = now;
      return;
    }

    if (silenceSec >= 15 && dist > 500 && dist < 5000) {
      const msg = lang === 'en' ? `In ${formatDistance(dist)}, ${next.instruction}` : lang === 'zh' ? `${formatDistance(dist)}后，${next.instruction}` : `En ${formatDistance(dist)}, ${next.instruction.toLowerCase()}`;
      speakInstruction(msg);
      lastAnnouncementTimeRef.current = now;
    }
  };

  const fetchRouteCoords = async (origin, destination) => {
    if (!origin || !destination) return [];
    const [oLng, oLat] = origin;
    const [dLng, dLat] = destination;
    const directionsLang = lang === 'en' ? 'en' : lang === 'zh' ? 'zh' : 'es';

    let route = null;
    let coords = [];
    let steps = [];

    // 1. Intentar primero con driving-traffic para tener la ruta y tráfico en tiempo real
    try {
      const urlTraffic = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full&steps=true&language=${directionsLang}&access_token=${mapboxgl.accessToken}`;
      const resTraffic = await fetch(urlTraffic);
      const dataTraffic = await resTraffic.json();
      if (dataTraffic.routes && dataTraffic.routes.length > 0) {
        route = dataTraffic.routes[0];
        coords = route.geometry.coordinates;
        steps = route.legs[0]?.steps || [];
      }
    } catch (e) {
      console.warn('[Atlan] Error al consultar driving-traffic:', e);
    }

    // 2. Fallback con perfil driving estándar si driving-traffic no devuelve ruta
    if (!route || coords.length === 0) {
      try {
        const urlDriving = `https://api.mapbox.com/directions/v5/mapbox/driving/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full&steps=true&language=${directionsLang}&access_token=${mapboxgl.accessToken}`;
        const resDriving = await fetch(urlDriving);
        const dataDriving = await resDriving.json();
        if (dataDriving.routes && dataDriving.routes.length > 0) {
          route = dataDriving.routes[0];
          coords = route.geometry.coordinates;
          steps = route.legs[0]?.steps || [];
        }
      } catch (e) {
        console.warn('[Atlan] Error en fallback driving:', e);
      }
    }

    if (route && coords.length > 0) {
      rutaCoordenadasRef.current = coords;
      maneuversRef.current = buildManeuverList(steps);

      setRouteInfo({
        distance: route.distance,
        duration: route.duration,
        eta: calculateETA(route.duration),
        destinationName: lugarDestinoRef.current || (lang === 'en' ? 'Destination' : lang === 'zh' ? '目的地' : 'Destino')
      });

      // Configurar de inmediato la primera maniobra en el HUD (icono de giro, instrucción y distancia)
      if (maneuversRef.current && maneuversRef.current.length > 0) {
        const firstM = maneuversRef.current[0];
        const nextNextM = maneuversRef.current.length > 1 ? maneuversRef.current[1] : null;
        const initialDist = firstM.segmentDist || route.distance;

        setCurrentManeuver({
          type: firstM.type,
          modifier: firstM.modifier,
          instruction: firstM.instruction,
          distance: initialDist,
          distanceFormatted: formatDistanceDisplay(initialDist),
          iconKey: firstM.iconKey,
          icon: firstM.icon,
          nextNext: nextNextM ? {
            instruction: nextNextM.instruction,
            iconKey: nextNextM.iconKey,
          } : null
        });
      }

      // Dibujar o actualizar la trayectoria azul en el mapa mediante la capa 'preview-route'
      const applyRouteGeoJson = () => {
        if (mapRef.current) {
          try {
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
          } catch (e) {
            console.warn('[Atlan] Error aplicando geometría a preview-route:', e);
          }
        }
      };
      applyRouteGeoJson();
      setTimeout(applyRouteGeoJson, 200);
      setTimeout(applyRouteGeoJson, 600);

      return coords;
    }
    return [];
  };

  // ── INICIAR VIAJE (GPS REAL + HUD DE NAVEGACIÓN EN VIVO) ──
  const iniciarViajeCore = async (puntoParam = null) => {
    const puntoRaw = puntoParam || selectedPoint;
    const punto = normalizarPunto(puntoRaw);
    if (!punto || punto.lng === undefined || punto.lat === undefined || isNaN(punto.lng) || isNaN(punto.lat)) return;

    const [currLng, currLat] = currentPosRef.current;
    const isUserInCA = currLng >= -93.0 && currLng <= -77.0 && currLat >= 7.0 && currLat <= 19.0;

    if (!isUserInCA) {
      alert(lang === 'en'
        ? 'You are currently outside Central America. Plan your trip and visit us to use live GPS navigation!'
        : lang === 'zh'
        ? '您当前不在中美洲范围内。规划好行程并欢迎光临以使用实时GPS导航！'
        : 'Te encuentras fuera de Centroamérica. ¡Planifica tu viaje y visítanos para usar la navegación GPS en vivo!');
      return;
    }

    // 1. Cerrar popup activo en el mapa si lo hay
    if (activePopupRef.current) {
      try { activePopupRef.current.remove(); } catch (e) {}
      activePopupRef.current = null;
    }

    // 2. Cerrar hojas o modales de detalles
    setSelectedPoint(null);
    setShowFullProfileModal(false);
    setSelectedPointDetails(null);

    // 3. Detener demo si estuviese corriendo
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setIsDemoRunning(false);
    isDemoRunningRef.current = false;

    // 4. Configurar destino y referencias
    destinationRef.current = [Number(punto.lng), Number(punto.lat)];
    lugarDestinoRef.current = punto.nombre || (lang === 'en' ? 'Destination' : lang === 'zh' ? '目的地' : 'Destino');

    // 5. Activar estados de navegación limpia y Waze HUD
    isNavigatingRef.current = true;
    setIsNavigating(true);
    isInteractionPausedRef.current = false;
    setShowRecenterBtn(false);

    if (mapContainerRef.current) {
      mapContainerRef.current.classList.add('atlan-nav-clean-mode');
    }

    // 6. Colocar marcador de destino exclusivo (Punto B)
    actualizarMarcadorDestino(punto);

    // 7. Ocultar panel de direcciones si estuviese abierto
    setShowDirectionsPopup(false);
    const directionsPanel = document.querySelector('.mapboxgl-ctrl-directions');
    if (directionsPanel) {
      directionsPanel.classList.remove('directions-popup-active');
      directionsPanel.style.setProperty('display', 'none', 'important');
    }

    // 8. Síntesis de voz: bienvenida de inicio de viaje
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
    lastSpokenRef.current = '';
    speakInstruction(`${t('map.welcome')} ${t('map.routeTo')} ${punto.nombre}.`, true);
    lastAnnouncementTimeRef.current = Date.now();

    // 9. Consultar la ruta real y pasos a la API de Mapbox
    const coords = await fetchRouteCoords([currLng, currLat], [Number(punto.lng), Number(punto.lat)]);

    // 10. Orientar vehículo y cámara 3D hacia la carretera
    if (coords && coords.length > 0) {
      const initialBearing = coords.length > 1 ? calcBearing(coords[0], coords[1]) : 0;
      currentBearingRef.current = initialBearing;

      handlePositionUpdate(currLng, currLat, initialBearing);

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [currLng, currLat],
          zoom: 16.5,
          pitch: 55,
          bearing: initialBearing,
          speed: 1.1,
          curve: 1.15,
          essential: true
        });
      }
    } else {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [currLng, currLat],
          zoom: 16,
          pitch: 50,
          essential: true
        });
      }
    }
  };

  // ── CANCELAR RUTA ACTIVA Y RESTAURAR ESTADO NORMAL DEL MAPA ──
  const cancelarRutaActiva = () => {
    if (isClearingRoutesRef.current) return;
    isClearingRoutesRef.current = true;

    try {
      // 1. Detener demo si estuviera corriendo
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      setIsDemoRunning(false);
      isDemoRunningRef.current = false;

      // 2. Limpiar rutas de Mapbox Directions
      if (directionsRef.current) {
        try {
          directionsRef.current.removeRoutes();
        } catch (e) {}
      }

      // 3. Limpiar capa GeoJSON de previsualización de ruta
      if (mapRef.current && mapRef.current.isStyleLoaded()) {
        const source = mapRef.current.getSource('preview-route');
        if (source) {
          source.setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [] }
          });
        }
      }

      // 4. Limpiar datos y referencias de ruta, destino y puntos seleccionados
      rutaCoordenadasRef.current = [];
      setRouteInfo(null);
      setPreviewRouteInfo(null);
      setCurrentManeuver(null);
      setSelectedPoint(null);
      setShowFullProfileModal(false);
      setSelectedPointDetails(null);
      selectedPointRef.current = null;
      prevSelectedPointRef.current = null;
      destinationRef.current = null;
      lugarDestinoRef.current = '';
      isNavigatingRef.current = false;
      setIsNavigating(false);
      isInteractionPausedRef.current = false;
      setShowRecenterBtn(false);
      setShowDirectionsPopup(false);

      // 5. Quitar marcador B de destino
      actualizarMarcadorDestino(null);

      // 6. Restaurar vista limpia y paneles
      if (mapContainerRef.current) {
        mapContainerRef.current.classList.remove('atlan-nav-clean-mode');
      }
      const panel = document.querySelector('.mapboxgl-ctrl-directions');
      if (panel) {
        panel.classList.remove('directions-popup-active');
        panel.style.display = 'none';
      }

      // 7. Retornar cámara a plano cenital 2D estándar
      if (mapRef.current) {
        mapRef.current.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      }

      // 8. Re-renderizar todos los marcadores y clusters normalmente
      renderizarMarcadoresVisibles();
    } finally {
      setTimeout(() => {
        isClearingRoutesRef.current = false;
      }, 150);
    }
  };

  // Lógica del simulador demo
  const iniciarSimulacionDemo = async (puntoParam = null) => {
    if (demoIntervalRef.current) {
      cancelarRutaActiva();
      speakInstruction(t('map.demoFinished'), true);
      return;
    }

    const puntoRaw = puntoParam || selectedPoint || selectedPointRef.current;
    const punto = normalizarPunto(puntoRaw);

    if (punto && punto.lng !== undefined && punto.lat !== undefined) {
      destinationRef.current = [Number(punto.lng), Number(punto.lat)];
      lugarDestinoRef.current = punto.nombre || (lang === 'en' ? 'Destination' : lang === 'zh' ? '目的地' : 'Destino');
      selectedPointRef.current = punto;
      actualizarMarcadorDestino(punto);
    }

    if (!destinationRef.current) {
      speakInstruction(t('map.selectDestination'), true);
      return;
    }

    // 1. Cerrar popup activo en el mapa si lo hay
    if (activePopupRef.current) {
      try { activePopupRef.current.remove(); } catch (e) {}
      activePopupRef.current = null;
    }

    // 2. Cerrar hojas o modales de detalles
    setSelectedPoint(null);
    setShowFullProfileModal(false);
    setSelectedPointDetails(null);

    // Si la posición actual está fuera de Centroamérica (o aún no cargó), usar Managua para que la prueba funcione siempre
    let [currLng, currLat] = currentPosRef.current;
    const isUserInCA = currLng >= -93.0 && currLng <= -77.0 && currLat >= 7.0 && currLat <= 19.0;
    if (!isUserInCA) {
      currLng = -86.2504;
      currLat = 12.1364;
      currentPosRef.current = [currLng, currLat];
    }

    let coords = await fetchRouteCoords([currLng, currLat], destinationRef.current);
    if (!coords || coords.length === 0) {
      speakInstruction(t('map.noRoute'), true);
      return;
    }
    rutaCoordenadasRef.current = coords;

    // Asegurar trazado visible de la línea de ruta en el mapa
    const drawDemoRoute = () => {
      if (mapRef.current) {
        try {
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
        } catch (e) {}
      }
    };
    drawDemoRoute();
    setTimeout(drawDemoRoute, 300);
    setTimeout(drawDemoRoute, 800);

    if (directionsRef.current) {
      try {
        directionsRef.current.setOrigin([currLng, currLat]);
        directionsRef.current.setDestination(destinationRef.current);
      } catch (e) {}
    }

    setIsDemoRunning(true);
    isDemoRunningRef.current = true;
    isNavigatingRef.current = true;
    setIsNavigating(true);
    isInteractionPausedRef.current = false;
    setShowRecenterBtn(false);
    if (mapContainerRef.current) {
      mapContainerRef.current.classList.add('atlan-nav-clean-mode');
    }

    const panel = document.querySelector('.mapboxgl-ctrl-directions');
    if (panel) panel.style.display = 'none';

    const destino = lugarDestinoRef.current || 'su destino';
    speakInstruction(`${t('map.welcome')} ${t('map.routeTo')} ${destino}.`, true);
    lastAnnouncementTimeRef.current = Date.now();

    // Calcular orientación inicial hacia el primer segmento
    const initialBearing = coords.length > 1 ? calcBearing(coords[0], coords[1]) : 0;
    currentBearingRef.current = initialBearing;

    // Posicionar el vehículo y cámara 3D de inmediato en la salida
    handlePositionUpdate(coords[0][0], coords[0][1], initialBearing);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: coords[0],
        zoom: 16.5,
        pitch: 55,
        bearing: initialBearing,
        speed: 1.1,
        curve: 1.15,
        essential: true,
      });
    }

    let index = 0;
    setTimeout(() => {
      if (!isDemoRunningRef.current) return;

      demoIntervalRef.current = setInterval(() => {
        const pts = rutaCoordenadasRef.current;
        if (!pts || pts.length < 2) return;

        if ('speechSynthesis' in window && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        if (index >= pts.length - 1) {
          const destinoNombre = lugarDestinoRef.current || selectedPointRef.current?.nombre || 'su destino';
          const puntoId = selectedPointRef.current?.id || null;
          cancelarRutaActiva();
          speakInstruction(t('map.arrived'), true);

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
          if (gap >= 22) break;
          target++;
        }

        const bearing = calcBearing(pts[index], pts[target]);
        currentBearingRef.current = bearing;
        handlePositionUpdate(pts[target][0], pts[target][1], bearing);
        checkDistanceAnnouncements(pts[target][0], pts[target][1]);

        index = target;
      }, 1100);
    }, 1000);
  };

  // Activar modo agregar punto: abre modal selector de opciones (Ubicación actual vs Seleccionar en mapa)
  const activarLevantarPunto = () => {
    if (!userSession) {
      alert(lang === 'en' ? 'Please log in to add points to the map.' : lang === 'zh' ? '请登录以在地图上添加地点。' : 'Por favor, inicia sesión para levantar un punto en el mapa.');
      window.location.href = '/login';
      return;
    }
    if (isAddingPoint) {
      setIsAddingPoint(false);
      isAddingPointRef.current = false;
      if (mapRef.current) mapRef.current.getCanvas().style.cursor = '';
    } else {
      setShowAddPointOptionModal(true);
    }
  };

  // Opción 1: Usar Ubicación Actual (GPS)
  const handleUsarUbicacionActual = () => {
    setShowAddPointOptionModal(false);

    // 1. Respuesta instantánea con la mejor ubicación disponible en memoria o centro actual
    let initialCoords = currentPosRef.current;
    if (!initialCoords && mapRef.current) {
      const center = mapRef.current.getCenter();
      initialCoords = [center.lng, center.lat];
    }
    if (!initialCoords) {
      initialCoords = [-86.2504, 12.1364];
    }

    setTempPointCoords(initialCoords);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: initialCoords, zoom: 16.5, pitch: 0, essential: true });
    }
    setShowAddModal(true);

    // 2. Refinamiento en segundo plano vía GPS (hardware lock) sin bloquear la UI
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          currentPosRef.current = [lng, lat];
          setTempPointCoords([lng, lat]);
          if (mapRef.current) {
            mapRef.current.flyTo({ center: [lng, lat], zoom: 16.5, pitch: 0, essential: true });
          }
        },
        (err) => {
          console.warn('[Atlan] Error obteniendo GPS actual en background:', err);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  // Opción 2: Seleccionar en el Mapa (Crosshair cursor)
  const handleSeleccionarEnMapa = () => {
    setShowAddPointOptionModal(false);
    setIsAddingPoint(true);
    isAddingPointRef.current = true;
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = 'crosshair';
    speakInstruction(t('addPoint.tapMap'), true);
  };

  // Guardar nuevo punto en Supabase
  const handleGuardarPunto = async (e) => {
    e.preventDefault();
    if (!newPointNombre || !newPointCategoria || !tempPointCoords) return;

    if (fotoModerationError) {
      alert(fotoModerationError);
      return;
    }

    setIsSubmittingPoint(true);

    try {
      const [lng, lat] = tempPointCoords;
      const deptDetectado = await obtenerDepartamentoPorCoordenadas(lng, lat);

      let photoUrl = null;
      if (newPointFotoFile) {
        try {
          photoUrl = await uploadMedia(newPointFotoFile, 'puntos');
        } catch (uploadErr) {
          console.warn('[Atlan] Error subiendo foto a Supabase Storage:', uploadErr);
        }
      }

      const { error } = await supabase.from('puntos').insert([{
        nombre: newPointNombre,
        descripcion: newPointDesc,
        nombre_creador: userSession?.user?.user_metadata?.nombre_completo || newPointCreador || (lang === 'en' ? 'Registered Tourist' : lang === 'zh' ? '注册游客' : 'Turista Registrado'),
        categoria: newPointCategoria,
        ubicacion: `POINT(${lng} ${lat})`,
        departamento: deptDetectado,
        estado: 'sin_reclamar', // por defecto los del usuario están sin reclamar
        imagen_url: photoUrl || null,
        fotos_comunidad: photoUrl ? [photoUrl] : []
      }]);

      if (error) {
        console.error('[Atlan] Error insertando punto:', error);
        alert(lang === 'en' ? 'Could not save the place. Try again.' : lang === 'zh' ? '无法保存地点，请重试。' : 'No se pudo guardar el lugar. Reintente.');
      } else {
        setShowAddModal(false);
        setNewPointNombre('');
        setNewPointCreador('');
        setNewPointDesc('');
        setNewPointCategoria('otro');
        setNewPointFotoFile(null);
        setNewPointFotoPreview(null);
        setFotoModerationError('');
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
      maxPitch: 0,
      pitchWithRotate: false,
      touchPitch: false,
      projection: 'mercator',
      maxBounds: CENTRAL_AMERICA_BOUNDS, // Restringir memoria al área estrictamente necesaria
    });

    if (mapContainerRef.current) {
      actualizarEscalaMarcadores();
    }

    mapRef.current.on('dragstart', () => {
      if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      }
    });

    // 3. Cero retraso durante el zoom del mapa (.map-zooming)
    mapRef.current.on('zoomstart', () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.classList.add('map-zooming');
      }
    });

    mapRef.current.on('zoom', () => {
      if (mapContainerRef.current && !mapContainerRef.current.classList.contains('map-zooming')) {
        mapContainerRef.current.classList.add('map-zooming');
      }
      actualizarEscalaMarcadores();
    });

    mapRef.current.on('zoomend', () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.classList.remove('map-zooming');
      }
      actualizarEscalaMarcadores();
      renderizarMarcadoresVisibles();
    });

    mapRef.current.on('movestart', () => {
      if (typeof window !== 'undefined') {
        window.__atlanMapMoving = true;
        window.resetAtlanInactivityTimer?.();
      }
    });

    mapRef.current.on('moveend', () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.classList.remove('map-zooming');
      }
      if (typeof window !== 'undefined') {
        window.__atlanMapMoving = false;
        window.resetAtlanInactivityTimer?.();
      }
      renderizarMarcadoresVisibles();
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
          // 0. Ocultar todos los negocios, comercios y Puntos de Interés (POIs) predeterminados de Mapbox
          if (
            layer.id.includes('poi') ||
            layer.id.includes('transit') ||
            (layer['source-layer'] && (layer['source-layer'] === 'poi_label' || layer['source-layer'] === 'transit_label'))
          ) {
            mapRef.current.setLayoutProperty(layer.id, 'visibility', 'none');
            return;
          }

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

        if (!mapRef.current.getLayer('preview-route-casing')) {
          mapRef.current.addLayer({
            id: 'preview-route-casing',
            type: 'line',
            source: 'preview-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#024b75',
              'line-width': 10,
              'line-opacity': 0.95
            }
          });
        }

        if (!mapRef.current.getLayer('preview-route-layer')) {
          mapRef.current.addLayer({
            id: 'preview-route-layer',
            type: 'line',
            source: 'preview-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#0ea5e9', // Azul brillante de alta visibilidad para la ruta
              'line-width': 6.5,
              'line-opacity': 1
            }
          });
        }
      }

      // Cargar puntos inmediatamente al estar listo el mapa
      const center = currentPosRef.current || [-86.2504, 12.1364];
      cargarPuntosCercanos(center[0], center[1], filtroCategoria);
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
      // NO cancelar si la pantalla de carga todavía está activa — el usuario no debería poder interrumpir el vuelo inicial
      if (!hasFlownInitialDescentRef.current) return;

      if (cinematicTimeoutsRef.current.length > 0) {
        console.log('[Atlan] Cancelando animación cinematográfica por interacción del usuario (post-descenso)');
        cinematicTimeoutsRef.current.forEach(t => clearTimeout(t));
        cinematicTimeoutsRef.current = [];
      }
    };

    const pauseCamera = () => {
      clearCinematicTimeouts();

      if (!isNavigatingRef.current) return;

      isInteractionPausedRef.current = true;
      setShowRecenterBtn(true); // Mostrar el botón "Volver a centrar"

      // Al explorar libremente, quitar clase de conducción limpia para mostrar marcadores al instante
      if (mapContainerRef.current) {
        mapContainerRef.current.classList.remove('atlan-nav-clean-mode');
      }

      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };

    const handleUserGesture = (e) => {
      // Solo pausar si el evento proviene de un gesto físico real del usuario (mouse, touch, wheel)
      // y NUNCA por animaciones programáticas de Mapbox (flyTo, easeTo)
      if (!isNavigatingRef.current) return;
      if (e && e.originalEvent) {
        pauseCamera();
      }
    };

    // Escuchar únicamente gestos reales del usuario que indican que desea explorar manualmente
    mapRef.current.on('movestart', handleUserGesture);
    mapRef.current.on('dragstart', handleUserGesture);
    mapRef.current.on('touchstart', handleUserGesture);
    mapRef.current.on('wheel', handleUserGesture);
    mapRef.current.on('rotatestart', handleUserGesture);
    mapRef.current.on('pitchstart', handleUserGesture);

    // Controles nativos
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
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
      language: lang === 'en' ? 'en' : lang === 'zh' ? 'zh' : 'es',
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
          destinationName: lugarDestinoRef.current || (lang === 'en' ? 'Destination' : lang === 'zh' ? '目的地' : 'Destino')
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

          const rawInstr = firstStep.maneuver?.instruction || '';
          const iconKey = getManeuverIconKey(type, modifier, instr || rawInstr);
          const nextNextStep = maneuversRef.current.length > 1 ? maneuversRef.current[1] : null;

          setCurrentManeuver({
            type,
            modifier,
            instruction: instr,
            distance: dist,
            distanceFormatted: formatDistanceDisplay(dist),
            iconKey: iconKey,
            icon: getManeuverIcon(type, modifier, instr || rawInstr),
            nextNext: nextNextStep ? {
              instruction: nextNextStep.instruction,
              iconKey: nextNextStep.iconKey
            } : null
          });

          if (instr && instr !== lastSpokenRef.current) {
            lastSpokenRef.current = instr;
            setTimeout(() => speakInstruction(instr), 600);
          }
        }
      }
    });

    directions.on('clear', () => {
      if (isClearingRoutesRef.current) return;
      cancelarRutaActiva();
    });

    // Geolocalización nativa + web y vuelo descendente cinematográfico a los 8.0 segundos
    let watchId = null;
    let lastGpsCoords = null;

    // Registrar puente para recibir coordenadas GPS nativas desde la App Móvil Flutter (Hardware real del teléfono)
    window.updateNativeGPSPosition = (lng, lat, heading = 0) => {
      console.log('[Atlan Native GPS Bridge] Coordenadas hardware recibidas:', lng, lat, heading);
      if (lng === undefined || lat === undefined || isNaN(lng) || isNaN(lat)) return;
      handlePositionUpdate(lng, lat, heading);
    };

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (isDemoRunningRef.current) return;
          const { longitude, latitude, heading } = pos.coords;

          let bearing = null;
          if (heading !== null && heading !== undefined && !isNaN(heading) && heading >= 0) {
            bearing = heading;
          } else if (lastGpsCoords) {
            const distMoved = calcDistanceMeters([lastGpsCoords.lng, lastGpsCoords.lat], [longitude, latitude]);
            if (distMoved >= 2.5) {
              bearing = calcBearing([lastGpsCoords.lng, lastGpsCoords.lat], [longitude, latitude]);
            }
          }
          lastGpsCoords = { lng: longitude, lat: latitude };

          handlePositionUpdate(longitude, latitude, bearing);
        },
        (err) => {
          console.warn('[Atlan Web GPS Error]:', err);
        },
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
    }

    // A LOS 10.0 SEGUNDOS EXACTOS (cuando el contador de la pantalla de carga llega al 100%):
    const cinematicTimer = setTimeout(() => {
      console.log('[Atlan Cinematic] Timer 10s fired. mapRef:', !!mapRef.current, 'hasFlown:', hasFlownInitialDescentRef.current, 'pos:', currentPosRef.current);
      setIsMapLoading(false);

      if (hasFlownInitialDescentRef.current || !mapRef.current) {
        console.log('[Atlan Cinematic] Abortado — ya voló o sin mapa');
        return;
      }
      hasFlownInitialDescentRef.current = true;

      if (selectedPointRef.current) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('id') || params.get('punto') || (params.get('lat') && params.get('lng'))) return;

      const targetPos = currentPosRef.current || [-86.2504, 12.1364];
      console.log('[Atlan Cinematic] Iniciando vuelo parabólico hacia:', targetPos);
      cargarPuntosCercanos(targetPos[0], targetPos[1], filtroCategoria);

      // Retardo de 150ms para que la UI desvanezca la portada de carga y active el renderizado WebGL en WebView Android
      const descentTimer = setTimeout(() => {
        if (!mapRef.current || selectedPointRef.current) return;

        // Prevenir caídas de WebGL en Android WebView
        const canvas = mapRef.current.getCanvas();
        if (canvas && !canvas._atlanWebglGuard) {
          canvas._atlanWebglGuard = true;
          canvas.addEventListener('webglcontextlost', (e) => {
            console.warn('[Atlan WebGL] Previniendo caída de contexto GPU en móvil:', e);
            e.preventDefault();
          });
        }

        mapRef.current.resize();

        // FASE 1: Vuelo descendente 100% vertical y plano (pitch: 0, bearing: 0) desde el espacio hasta la posición GPS
        // Sin giros de picada ni inclinaciones. Súper fluido y liviano para la GPU en móvil.
        mapRef.current.flyTo({
          center: targetPos,
          zoom: 16.5,
          pitch: 0,
          bearing: 0,
          duration: 5500, // 5.5 segundos de zoom descendente vertical, pausado, fluido y cristalino
          curve: 1.6,
          essential: true,
        });
      }, 150);

      cinematicTimeoutsRef.current.push(descentTimer);
    }, 10000); // 10.0 segundos exactos — coincide con la pantalla de carga

    return () => {
      clearTimeout(cinematicTimer);
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
      cinematicTimeoutsRef.current.forEach(t => clearTimeout(t));
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      markersOnMapRef.current.forEach((m) => m.remove());
      markersOnMapRef.current.clear();
      markersRef.current = [];
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Centrar y cargar punto desde URL query
  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current) {
      const params = new URLSearchParams(window.location.search);
      const puntoId = params.get('id') || params.get('punto');
      const paramLat = params.get('lat');
      const paramLng = params.get('lng');
      const shouldAutoRoute = params.get('ruta') === '1' || params.get('iniciarRuta') === '1' || params.get('comoLlegar') === '1';

      if (puntoId || (paramLat && paramLng)) {
        hasFlownInitialDescentRef.current = true;

        const cargarPuntoDesdeURL = async () => {
          try {
            let targetLng = paramLng ? parseFloat(paramLng) : null;
            let targetLat = paramLat ? parseFloat(paramLat) : null;

            if (puntoId) {
              if (loadedPointIdRef.current === puntoId) return;
              loadedPointIdRef.current = puntoId;

              const { data: punto, error } = await supabase
                .from('puntos')
                .select('*')
                .eq('id', puntoId)
                .single();
              if (!error && punto) {
                const pNorm = normalizarPunto(punto);
                if (pNorm && pNorm.lng != null && pNorm.lat != null) {
                  targetLng = pNorm.lng;
                  targetLat = pNorm.lat;
                }

                if (targetLng != null && targetLat != null) {
                  cargarPuntosCercanos(targetLng, targetLat, filtroCategoria);

                  const puntoEstructura = {
                    id: punto.id,
                    nombre: punto.nombre,
                    descripcion: punto.descripcion,
                    categoria: punto.categoria,
                    lng: targetLng,
                    lat: targetLat,
                    negocio_id: punto.negocio_id,
                    nombre_creador: punto.nombre_creador,
                    estado: punto.estado,
                    fotos_comunidad: punto.fotos_comunidad,
                    departamento: punto.departamento
                  };
                  setSelectedPoint(puntoEstructura);
                  return;
                }
              }
            }

            if (targetLng != null && targetLat != null) {
              mapRef.current.flyTo({
                center: [targetLng, targetLat],
                zoom: 16.5,
                pitch: 0,
                speed: 0.85,
                essential: true
              });
              cargarPuntosCercanos(targetLng, targetLat, filtroCategoria);
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

  // Al concluir la pantalla de carga (10s), asegurar encuadre óptimo de la ruta y vista dividida
  useEffect(() => {
    if (!isMapLoading && mapRef.current) {
      if (selectedPointRef.current && previewRouteBoundsRef.current) {
        const timer = setTimeout(() => {
          if (!mapRef.current) return;
          mapRef.current.resize();
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          mapRef.current.fitBounds(previewRouteBoundsRef.current, {
            padding: isMobile
              ? { top: 90, bottom: 250, left: 35, right: 35 }
              : { top: 100, bottom: 100, left: 80, right: 80 },
            maxZoom: 15.5,
            duration: 1200,
            pitch: 0,
            essential: true
          });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [isMapLoading]);

  // Recargar marcadores al cambiar categoría
  const aplicarFiltro = (cat) => {
    setFiltroCategoria(cat);
    const center = mapRef.current ? [mapRef.current.getCenter().lng, mapRef.current.getCenter().lat] : currentPosRef.current;
    cargarPuntosCercanos(center[0], center[1], cat);
  };

  const handleRecenter = () => {
    isInteractionPausedRef.current = false;
    setShowRecenterBtn(false);

    // Al volver a centrar en modo navegación/demo, reactivar vista limpia
    if (mapContainerRef.current) {
      mapContainerRef.current.classList.add('atlan-nav-clean-mode');
    }

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: currentPosRef.current,
        zoom: 15.6,
        pitch: 50,
        bearing: currentBearingRef.current || 0,
        speed: 1.1,
        curve: 1.15,
        essential: true,
      });
    }
  };

  return (
    <div className={`map-page-wrapper ${selectedPoint ? 'has-selected-point' : ''}`} style={{ position: 'relative' }}>
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
          {lang === 'en' ? 'Offline Mode (Local Cache Active)' : lang === 'zh' ? '离线模式（本地缓存已激活）' : 'Modo Offline (Datos Locales Activos)'}
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
            {lang === 'en' ? 'Live and feel Nicaragua.' : lang === 'zh' ? '体验并感受尼加拉瓜。' : 'Vive y siente Nicaragua.'}
          </div>
        </div>

        {/* Mapa de Nicaragua (croquisnicaragua.svg con 17 departamentos) animado que se llena al 100% */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '16px 0' }}>
          <svg width="170" height="150" viewBox="0 0 1000 893" style={{ filter: 'drop-shadow(0px 0px 10px rgba(212, 175, 55, 0.35))' }}>
            <defs>
              <clipPath id="nicaragua-loading-clip">
                <rect x="0" y="0" width={loadingProgress * 10} height="893" style={{ transition: 'width 0.12s linear' }} />
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
            <g clipPath="url(#nicaragua-loading-clip)">
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
            {Math.round(loadingProgress)}%
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
          {lang === 'en' ? 'Preparing your Experience inside the Map...' : lang === 'zh' ? '正在准备地图体验...' : 'Preparando tu Experiencia dentro del Mapa.'}
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
            left: '20px',
            background: 'rgba(10, 15, 28, 0.92)',
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
                {lang === 'en' ? 'Distance' : lang === 'zh' ? '距离' : 'Distancia'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--atlan-gold)', marginTop: '2px' }}>
                {formatDistanceDisplay(previewRouteInfo.distance)}
              </div>
            </div>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {lang === 'en' ? 'Est. Time' : lang === 'zh' ? '预估时间' : 'Tiempo Est.'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
                {formatDurationDisplay(previewRouteInfo.duration)}
              </div>
            </div>
          </div>
        )}

      {/* Cabecera flotante con identidad visual Atlan ampliada */}
      {!selectedPoint && !isDemoRunning && !isNavigating && !routeInfo && (
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
          <div ref={searchContainerRef} style={{ flex: 1, margin: '0 24px', position: 'relative' }}>
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
                <img src="/images/lupa.svg" alt="Buscar" style={{ width: '18px', height: '18px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </span>
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search destinations, places, categories...' : lang === 'zh' ? '搜索目的地、景点、分类...' : 'Buscar destinos, lugares, categorías...'}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchQuery.trim()) setShowResults(true);
                }}
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
                  onClick={() => {
                    handleSearch('');
                    setShowResults(false);
                    setIsSearchFocused(false);
                  }}
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
                          {catConf.svgFile ? (
                            <img src={catConf.svgFile} alt={catKey} style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                          ) : (
                            <Icon name={catConf.icon} size={18} />
                          )}
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
              <img src="/images/home.svg" alt="Inicio" style={{ width: '16px', height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} /> <span className="mobile-hide-text">{lang === 'en' ? 'Home' : lang === 'zh' ? '首页' : 'Inicio'}</span>
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
              <img src="/images/comunidad.svg" alt="Comunidad" style={{ width: '16px', height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} /> <span className="mobile-hide-text">{lang === 'en' ? 'Community' : lang === 'zh' ? '社区' : 'Comunidad'}</span>
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
              {isAddingPoint ? (
                <Icon name="x" size={16} />
              ) : (
                <Icon name="mapPin" size={16} color={isAddingPoint ? "#FFFFFF" : "#0A192F"} />
              )} {isAddingPoint ? t('common.cancel') : t('map.addPoint')}
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
          animation: 'fadeInDownCenter 0.3s ease-out'
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
                {lang === 'en' ? 'Add Point Mode' : lang === 'zh' ? '添加标记模式' : 'Modo Levantar Punto'}
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

      {/* Panel de filtros (se oculta si hay punto seleccionado, ruta en curso, demo activa, o si se enfoca/usa el buscador) */}
      {!selectedPoint && !routeInfo && !isDemoRunning && !isNavigating && !isSearchFocused && !searchQuery.trim() && !showResults && (
        <div className="filter-bar-wrapper">
          <button
            type="button"
            className="web-category-trigger-btn"
            onClick={() => {
              if (filterScrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = filterScrollRef.current;
                const maxScroll = scrollWidth - clientWidth;
                if (scrollLeft >= maxScroll - 10) {
                  filterScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                  filterScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                }
              }
            }}
            title={lang === 'en' ? 'Explore categories' : lang === 'zh' ? '浏览分类' : 'Ver categorías'}
          >
            <span className="web-category-btn-content">
              <Icon name="grid" size={15} color="#FFD700" />
              <span className="web-category-btn-text">{lang === 'en' ? 'Categories' : lang === 'zh' ? '分类' : 'Categorías'}</span>
              <span className="web-category-arrow-anim">
                <Icon name="arrowRight" size={15} color="#FFD700" />
              </span>
            </span>
          </button>

          <div
            className="filter-bar"
            ref={filterScrollRef}
            onMouseDown={handleMouseDownFilterBar}
            onMouseLeave={handleMouseLeaveFilterBar}
            onMouseUp={handleMouseUpFilterBar}
            onMouseMove={handleMouseMoveFilterBar}
          >
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
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <img
                src="/images/remolino.svg"
                alt="Todas"
                style={{
                  width: '16px',
                  height: '16px',
                  objectFit: 'contain',
                  filter: filtroCategoria === null ? 'brightness(0)' : 'brightness(0) invert(1)'
                }}
              />
              <span>{t('map.allCategories')}</span>
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
                  <span>
                    {config.svgFile ? (
                      <img src={config.svgFile} alt={key} style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                    ) : (
                      <Icon name={config.icon} size={16} />
                    )}
                  </span>
                  <span>{t(`addPoint.categories.${key}`)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Selector de Opciones para Levantar Punto */}
      {showAddPointOptionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(10, 15, 28, 0.82)',
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
              setShowAddPointOptionModal(false);
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#0F172A',
              backgroundImage: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 28, 0.99) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.35)',
              borderRadius: '24px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 215, 0, 0.2)',
              padding: '24px',
              position: 'relative',
              animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              color: '#F8FAFC'
            }}
          >
            {/* Header del modal selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFD700',
                  boxShadow: '0 4px 14px rgba(255, 215, 0, 0.2)'
                }}>
                  <Icon name="mapPin" size={22} color="#FFD700" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#FFD700', letterSpacing: '-0.3px', fontFamily: 'var(--font-outfit)' }}>
                    {lang === 'en' ? 'Add New Place' : lang === 'zh' ? '添加新地点' : 'Levantar Nuevo Punto'}
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                    {lang === 'en' ? 'Choose how to define the place location' : lang === 'zh' ? '选择如何确定地点位置' : 'Elige cómo deseas definir la ubicación del destino'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPointOptionModal(false)}
                style={{
                  width: '30px',
                  height: '30px',
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
                <Icon name="x" size={15} />
              </button>
            </div>

            {/* Opciones de ubicación */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Opción 1: Usar Ubicación Actual */}
              <button
                type="button"
                onClick={handleUsarUbicacionActual}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 165, 0, 0.06) 100%)',
                  border: '1.5px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '16px',
                  color: '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  boxShadow: '0 4px 16px rgba(255, 215, 0, 0.15)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0A192F',
                  flexShrink: 0
                }}>
                  <Icon name="navigation" size={20} color="#0A192F" />
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#FFD700', marginBottom: '3px' }}>
                    {lang === 'en' ? 'Use My Current Location' : lang === 'zh' ? '使用我当前的位置' : 'Usar mi Ubicación Actual'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.3' }}>
                    {lang === 'en' ? 'Automatically uses your current GPS position.' : lang === 'zh' ? '自动定位您当前的 GPS 坐标。' : 'Toma automáticamente las coordenadas GPS donde te encuentras ahora mismo.'}
                  </div>
                </div>
              </button>

              {/* Opción 2: Seleccionar en el Mapa */}
              <button
                type="button"
                onClick={handleSeleccionarEnMapa}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(2, 132, 199, 0.06) 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '16px',
                  color: '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  boxShadow: '0 4px 16px rgba(56, 189, 248, 0.15)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0
                }}>
                  <Icon name="map" size={20} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#7DD3FC', marginBottom: '3px' }}>
                    {lang === 'en' ? 'Select Location on Map' : lang === 'zh' ? '在地图上选择位置' : 'Seleccionar en el Mapa'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.3' }}>
                    {lang === 'en' ? 'Tap anywhere on the map to place the marker.' : lang === 'zh' ? '在地图上点击以选择精确位置。' : 'Toca cualquier lugar del mapa para elegir la posición exacta del destino.'}
                  </div>
                </div>
              </button>
            </div>
          </div>
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
              maxWidth: '780px',
              maxHeight: '92vh',
              backgroundColor: '#0F172A',
              backgroundImage: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 28, 0.99) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '24px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 215, 0, 0.15)',
              padding: '20px 24px',
              overflowY: 'auto',
              position: 'relative',
              animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              color: '#F8FAFC'
            }}
          >
            {/* Header del modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFD700',
                  boxShadow: '0 4px 14px rgba(255, 215, 0, 0.2)'
                }}>
                  <Icon name="mapPin" size={20} color="#FFD700" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#FFD700', letterSpacing: '-0.3px', fontFamily: 'var(--font-outfit)' }}>
                    {t('addPoint.title')}
                  </h2>
                  <p style={{ margin: '1px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                    {t('addPoint.subtitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setTempPointCoords(null); }}
                style={{
                  width: '30px',
                  height: '30px',
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
                <Icon name="x" size={15} />
              </button>
            </div>

            <form onSubmit={handleGuardarPunto} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', alignItems: 'start' }}>
              
              {/* Columna Izquierda: Información del Lugar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '750', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <Icon name="tag" size={13} color="#FFD700" />
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
                      padding: '9px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '750', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <Icon name="user" size={13} color="#FFD700" />
                    {t('addPoint.yourName')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('addPoint.yourNamePlaceholder')}
                    value={newPointCreador}
                    onChange={(e) => setNewPointCreador(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '750', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <Icon name="layers" size={13} color="#FFD700" />
                    {t('addPoint.category')} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={newPointCategoria}
                    onChange={(e) => setNewPointCategoria(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: '#0F172A',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {Object.keys(CATEGORIAS_CONFIG).map((key) => (
                      <option key={key} value={key} style={{ background: '#0F172A', color: '#FFFFFF', padding: '6px' }}>
                        {t(`addPoint.categories.${key}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '750', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <Icon name="alignLeft" size={13} color="#FFD700" />
                    {t('addPoint.description')} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows="2"
                    placeholder={t('addPoint.descriptionPlaceholder')}
                    value={newPointDesc}
                    onChange={(e) => setNewPointDesc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '13px',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Columna Derecha: Ubicación, Foto y Botones de Acción */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Coordenadas informativas estilizadas */}
                <div style={{
                  background: 'rgba(255, 215, 0, 0.06)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '11.5px',
                  color: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }}></span>
                    <span style={{ fontWeight: '700', color: '#FFD700' }}>{lang === 'en' ? 'Selected Location' : lang === 'zh' ? '已选位置' : 'Ubicación seleccionada'}:</span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#CBD5E1', background: 'rgba(0,0,0,0.35)', padding: '2px 7px', borderRadius: '5px' }}>
                    {tempPointCoords[1].toFixed(5)}, {tempPointCoords[0].toFixed(5)}
                  </span>
                </div>

                {/* Sección de Adjuntar Foto del Lugar con Filtro de Seguridad */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '750', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                    <Icon name="camera" size={13} color="#FFD700" />
                    {lang === 'en' ? 'Place Photo (Camera / Gallery)' : lang === 'zh' ? '地点照片（相机 / 相册）' : 'Fotografía del Lugar (Cámara o Galería)'}
                  </label>

                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Icon name="shield" size={14} color="#10B981" />
                    <span>{lang === 'en' ? 'Active security filter: Upload clean place photos.' : lang === 'zh' ? '已启用内容安全过滤：请上传合规照片。' : 'Filtro activo: Sube fotos apropiadas (sin contenido explícito).'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Tomar Foto con Cámara */}
                    <label style={{
                      flex: 1,
                      padding: '8px 10px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px dashed rgba(56, 189, 248, 0.4)',
                      borderRadius: '10px',
                      color: '#7DD3FC',
                      fontWeight: '750',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      textAlign: 'center'
                    }}>
                      <Icon name="camera" size={14} color="#7DD3FC" />
                      <span>{lang === 'en' ? 'Take Photo' : lang === 'zh' ? '拍摄照片' : 'Tomar Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleSeleccionarFotoPunto}
                      />
                    </label>

                    {/* Subir desde Galería */}
                    <label style={{
                      flex: 1,
                      padding: '8px 10px',
                      background: 'rgba(255, 215, 0, 0.12)',
                      border: '1px dashed rgba(255, 215, 0, 0.4)',
                      borderRadius: '10px',
                      color: '#FFD700',
                      fontWeight: '750',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      textAlign: 'center'
                    }}>
                      <Icon name="image" size={14} color="#FFD700" />
                      <span>{lang === 'en' ? 'Gallery' : lang === 'zh' ? '相册' : 'Galería'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleSeleccionarFotoPunto}
                      />
                    </label>
                  </div>

                  {/* Indicador de Análisis de Moderación */}
                  {isAnalyzingFoto && (
                    <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '11px', height: '11px', border: '2px solid rgba(56,189,248,0.3)', borderTopColor: '#38BDF8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>{lang === 'en' ? 'Analyzing security filter...' : lang === 'zh' ? '正在分析内容安全...' : 'Analizando filtro de seguridad...'}</span>
                    </div>
                  )}

                  {/* Alerta de Rechazo por Moderación de Seguridad */}
                  {fotoModerationError && (
                    <div style={{ marginTop: '6px', padding: '7px 10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#FCA5A5', fontSize: '11.5px', lineHeight: '1.3' }}>
                      ⚠️ {fotoModerationError}
                    </div>
                  )}

                  {/* Vista previa de la foto aprobada */}
                  {newPointFotoPreview && !isAnalyzingFoto && !fotoModerationError && (
                    <div style={{ marginTop: '8px', position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.5)', background: '#000000' }}>
                      <img src={newPointFotoPreview} alt="Vista Previa Punto" style={{ width: '100%', maxHeight: '115px', objectFit: 'cover', display: 'block' }} />
                      
                      <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(6, 78, 59, 0.85)', backdropFilter: 'blur(6px)', border: '1px solid #10B981', padding: '2px 6px', borderRadius: '5px', fontSize: '10.5px', fontWeight: '800', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="shield" size={12} color="#10B981" />
                        <span>{lang === 'en' ? 'Safe Photo Verified' : lang === 'zh' ? '照片已验证' : 'Foto Aprobada y Segura'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setNewPointFotoFile(null);
                          setNewPointFotoPreview(null);
                          setFotoModerationError('');
                        }}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '50%',
                          color: '#FFFFFF',
                          width: '22px',
                          height: '22px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Botones de Acción */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setTempPointCoords(null);
                      setNewPointFotoFile(null);
                      setNewPointFotoPreview(null);
                      setFotoModerationError('');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: '#CBD5E1',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Icon name="x" size={14} />
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPoint}
                    style={{
                      flex: 1.2,
                      padding: '10px 14px',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#0A192F',
                      fontWeight: '900',
                      fontSize: '13px',
                      cursor: isSubmittingPoint ? 'not-allowed' : 'pointer',
                      opacity: isSubmittingPoint ? 0.7 : 1,
                      boxShadow: '0 4px 14px rgba(255, 215, 0, 0.3)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Icon name="check" size={14} color="#0A192F" />
                    {isSubmittingPoint ? (lang === 'en' ? 'Saving...' : lang === 'zh' ? '保存中...' : 'Guardando...') : t('addPoint.saveBtn')}
                  </button>
                </div>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* Botón Flotante Trazar Ruta (Oculto en web y móvil según preferencia visual, manteniendo funcionalidad interna) */}
      <div
        id="btn-trazar-ruta"
        onClick={() => setShowDirectionsPopup((prev) => !prev)}
        style={{ display: 'none' }}
        aria-hidden="true"
      />



      {/* Botón Volver a centrar (Waze-style) */}
      {!selectedPoint && showRecenterBtn && (isDemoRunning || routeInfo || isNavigating) && (
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
          {lang === 'en' ? 'Re-center' : lang === 'zh' ? '重新居中' : 'Volver a centrar'}
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
              { key: 'has_parking', label: lang === 'en' ? 'Parking' : lang === 'zh' ? '停车场' : 'Parqueo', icon: 'parking' },
              { key: 'has_pets', label: 'Pet Friendly', icon: 'pet' },
              { key: 'has_card_payment', label: lang === 'en' ? 'Cards' : lang === 'zh' ? '刷卡支付' : 'Tarjetas', icon: 'creditCard' },
              { key: 'has_accessibility', label: lang === 'en' ? 'Accessible' : lang === 'zh' ? '无障碍设施' : 'Accesibilidad', icon: 'accessibility' },
              { key: 'has_delivery', label: 'Delivery', icon: 'delivery' },
              { key: 'has_ac', label: 'A/C', icon: 'ac' },
              { key: 'has_live_music', label: lang === 'en' ? 'Live Music' : lang === 'zh' ? '现场音乐' : 'Música en Vivo', icon: 'music' },
            ].filter(s => !!servs[s.key]);

            const avgRating = pointReviews.length > 0
              ? (pointReviews.reduce((acc, r) => acc + Number(r.estrellas || 5), 0) / pointReviews.length).toFixed(1)
              : null;

            const getCategoryIconName = (category) => {
              const cat = (category || '').toLowerCase();
              if (cat.includes('restaurante') || cat.includes('comida') || cat.includes('gastronom') || cat.includes('café') || cat.includes('bar') || cat.includes('comideria') || cat.includes('comidería')) {
                return 'utensils';
              }
              if (cat.includes('hotel') || cat.includes('hospedaje') || cat.includes('hostal') || cat.includes('alojamiento')) {
                return 'hotel';
              }
              if (cat.includes('naturaleza') || cat.includes('tour') || cat.includes('aventura') || cat.includes('parque') || cat.includes('playa')) {
                return 'mountain';
              }
              if (cat.includes('cultura') || cat.includes('arte') || cat.includes('museo') || cat.includes('teatro')) {
                return 'palette';
              }
              if (cat.includes('tienda') || cat.includes('comercio') || cat.includes('super') || cat.includes('compras') || cat.includes('mercado')) {
                return 'store';
              }
              return 'store';
            };

            return (
              <>
                {/* CABECERA SUPERIOR EN AZUL NAVBAR (#146D9E) CON EL NOMBRE DEL NEGOCIO Y SU ICONO DE CATEGORÍA */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #146D9E 0%, #0D496B 100%)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 4px 14px rgba(20, 109, 158, 0.25)'
                  }}
                >
                  {/* IZQUIERDA: ICONO DE CATEGORÍA + NOMBRE DEL NEGOCIO DESTACADO EN LETRAS BLANCAS MÁS GRANDES */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.22)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                      }}
                    >
                      <Icon name={getCategoryIconName(selectedPoint.category)} size={24} color="#FFFFFF" />
                    </div>

                    <h2
                      style={{
                        margin: 0,
                        fontSize: '27px',
                        fontWeight: '900',
                        color: '#FFFFFF',
                        lineHeight: '1.18',
                        letterSpacing: '0.4px',
                        wordBreak: 'break-word',
                        textShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
                      }}
                    >
                      {selectedPoint.nombre}
                    </h2>
                  </div>

                  {/* DERECHA: BOTONES DE ACCIÓN FLOTANTES (FAVORITO Y CERRAR X) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {userSession && (
                      <button
                        onClick={handleToggleFavorite}
                        title={isFavorite ? (lang === 'en' ? 'Remove Favorite' : lang === 'zh' ? '取消收藏' : 'Quitar de Favoritos') : (lang === 'en' ? 'Save Favorite' : lang === 'zh' ? '收藏地点' : 'Guardar Favorito')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(8px)',
                          border: isFavorite ? '1.5px solid #FFD700' : '1px solid rgba(255,255,255,0.4)',
                          color: isFavorite ? '#FFD700' : '#FFFFFF',
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Icon name={isFavorite ? 'heartFilled' : 'heart'} size={16} color={isFavorite ? '#FFD700' : '#FFFFFF'} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedPoint(null);
                        setShowFullProfileModal(false);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        color: '#FFFFFF',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Icon name="x" size={16} color="#FFFFFF" />
                    </button>
                  </div>
                </div>

                {/* DATOS Y ESTRUCTURA PRINCIPAL ABAJO DE LA CABECERA */}
                <div style={{ padding: '12px 18px 14px', position: 'relative' }}>
                  {/* LÍNEA DE CATEGORÍA, PRECIO Y HORARIO DESTACADO EN UNA SOLA LÍNEA */}
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: 'rgba(20, 109, 158, 0.07)',
                      border: '1px solid rgba(20, 109, 158, 0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#1E293B', fontWeight: '700' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748B', fontWeight: '600' }}>
                        <Icon name="mapPin" size={14} color="#64748B" />
                        {t(`addPoint.categories.${selectedPoint.category || 'otro'}`)}
                      </span>

                      {selectedPointDetails?.rango_precios && (
                        <>
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <span style={{ color: '#0F172A' }}>
                            <strong>{lang === 'en' ? 'Price' : lang === 'zh' ? '价格' : 'Precio'}:</strong> {formatPriceRange(selectedPointDetails.rango_precios)}
                          </span>
                        </>
                      )}

                      {selectedPointDetails?.horarios && Object.keys(selectedPointDetails.horarios).length > 0 && (() => {
                        const daysEnToEs = { 0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado' };
                        const dayNamesEs = { domingo: 'Domingo', lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado' };
                        const dayNamesEn = { domingo: 'Sunday', lunes: 'Monday', martes: 'Tuesday', miercoles: 'Wednesday', thursday: 'Thursday', viernes: 'Friday', sabado: 'Saturday' };
                        const dayNamesZh = { domingo: '周日', lunes: '周一', martes: '周二', miercoles: '周三', jueves: '周四', viernes: '周五', sabado: '周六' };
                        const now = new Date();
                        const currentDayKey = daysEnToEs[now.getDay()];
                        const todayInfo = selectedPointDetails.horarios[currentDayKey];

                        const dayLabel = lang === 'en' ? dayNamesEn[currentDayKey] : lang === 'zh' ? dayNamesZh[currentDayKey] : dayNamesEs[currentDayKey];
                        const hoursStr = todayInfo?.abierto
                          ? `${todayInfo.apertura || ''} - ${todayInfo.cierre || ''}`
                          : (lang === 'en' ? 'Closed' : lang === 'zh' ? '休息' : 'Cerrado');

                        return (
                          <>
                            <span style={{ color: '#CBD5E1' }}>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1E293B' }}>
                              <Icon name="clock" size={14} color="#146D9E" />
                              <strong>{lang === 'en' ? 'Hours' : lang === 'zh' ? '营业时间' : 'Horario'}:</strong> {dayLabel} • ({lang === 'en' ? 'Today' : lang === 'zh' ? '今日' : 'Hoy'}) {hoursStr}
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    {selectedPointDetails?.horarios && isBusinessOpenNow(selectedPointDetails.horarios) !== null && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '850',
                          textTransform: 'uppercase',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          backgroundColor: isBusinessOpenNow(selectedPointDetails.horarios) ? 'rgba(23, 170, 74, 0.12)' : 'rgba(239,68,68,0.12)',
                          color: isBusinessOpenNow(selectedPointDetails.horarios) ? '#17AA4A' : '#ef4444',
                          border: `1px solid ${isBusinessOpenNow(selectedPointDetails.horarios) ? 'rgba(23, 170, 74, 0.25)' : 'rgba(239,68,68,0.25)'}`,
                          flexShrink: 0
                        }}
                      >
                        {isBusinessOpenNow(selectedPointDetails.horarios) ? (lang === 'en' ? 'Open' : lang === 'zh' ? '营业中' : 'Abierto') : (lang === 'en' ? 'Closed' : lang === 'zh' ? '已打烊' : 'Cerrado')}
                      </span>
                    )}
                  </div>

                  {/* 2 COLUMNAS ABAJO: IZQUIERDA (CUADRO DE IMAGEN MUCHO MÁS GRANDE CON INFO SUPERPUESTA) / DERECHA (LOS 2 BOTONES) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '12px', alignItems: 'stretch' }}>
                    {/* COLUMNA 1: CUADRO CON LA IMAGEN DEL NEGOCIO Y SUS BADGES/INFO */}
                    <div
                      style={{
                        height: '150px',
                        borderRadius: '18px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '2px solid rgba(226, 232, 240, 0.9)',
                        boxShadow: '0 8px 22px rgba(0,0,0,0.12)',
                        background: coverGradient
                      }}
                    >
                      {heroImg ? (
                        <img
                          src={heroImg}
                          alt={selectedPoint.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontSize: '44px',
                            fontWeight: '800'
                          }}
                        >
                          {selectedPoint.nombre?.charAt(0)?.toUpperCase() || <Icon name="building" size={44} color="#FFFFFF" />}
                        </div>
                      )}

                      {/* DEGRADADO OSCURO INFERIOR PARA LEER LA INFORMACIÓN SUPERPUESTA */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 40%, rgba(15,23,42,0.85) 100%)',
                          pointerEvents: 'none'
                        }}
                      />

                      {/* INFORMACIÓN SUPERPUESTA DENTRO DEL CUADRO DE LA IMAGEN */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          right: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          zIndex: 2
                        }}
                      >
                        {/* Badge de Verificado / Estado */}
                        {(() => {
                          let statusText = '';
                          let statusColor = '';

                          if (selectedPoint.estado === 'en_verificacion') {
                            statusText = lang === 'en' ? 'Verifying' : lang === 'zh' ? '审核中' : 'En Verificación';
                            statusColor = '#FF9D42';
                          } else if (selectedPoint.estado === 'aprobado') {
                            statusText = lang === 'en' ? 'Verified' : lang === 'zh' ? '已认证' : 'Verificado';
                            statusColor = '#34D399';
                          } else {
                            const isClaimed = !!selectedPoint.negocio_id;
                            statusText = isClaimed ? t('map.claimed') : t('map.unclaimed');
                            statusColor = isClaimed ? '#34D399' : '#FBBF24';
                          }

                          return (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                color: statusColor,
                                background: 'rgba(15, 23, 42, 0.78)',
                                backdropFilter: 'blur(6px)',
                                padding: '3px 6.5px',
                                borderRadius: '7px',
                                border: `1px solid ${statusColor}45`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Icon name={selectedPoint.estado === 'aprobado' ? 'checkCircle' : 'shield'} size={9.5} color={statusColor} />
                              {statusText}
                            </span>
                          );
                        })()}

                        {/* Rating Overlay */}
                        {avgRating && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: '800',
                              color: '#FFD700',
                              background: 'rgba(15, 23, 42, 0.78)',
                              backdropFilter: 'blur(6px)',
                              padding: '3px 6px',
                              borderRadius: '7px',
                              border: '1px solid rgba(255, 215, 0, 0.4)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Icon name="starFilled" size={9.5} color="#FFD700" />
                            {avgRating} ({pointReviews.length})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* COLUMNA 2: A LA PAR, LOS DOS BOTONES NEÓN ADAPTADOS CON TEXTO E ICONOS MÁS GRANDES */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '150px' }}>
                      {/* BOTÓN 1: INICIAR VIAJE */}
                      <button
                        onClick={() => handleIniciarViaje(selectedPoint)}
                        className="neon-btn-dark-hero"
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span
                          style={{
                            fontSize: '15.5px',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            color: '#FFFFFF',
                            textTransform: 'uppercase'
                          }}
                        >
                          {lang === 'en' ? 'Start Trip' : lang === 'zh' ? '出发' : 'Iniciar Viaje'}
                        </span>
                      </button>

                      {/* BOTÓN 2: MOSTRAR MÁS (VERDE ESMERALDA #17AA4A) */}
                      <button
                        onClick={() => setShowFullProfileModal(true)}
                        className="neon-btn-green-hero"
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <span
                          className="neon-sign-text-white-bg"
                          style={{
                            fontSize: '15.5px',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            color: '#FFFFFF',
                            textTransform: 'uppercase',
                            WebkitTextStroke: '1px #000000',
                            paintOrder: 'stroke fill',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
                          }}
                        >
                          {lang === 'en' ? 'Show More' : lang === 'zh' ? '查看更多' : 'Mostrar más'}
                        </span>
                        <img src="/images/more.svg" alt="Mostrar más" style={{ width: '22px', height: '22px', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CUERPO SCROLLABLE DEL PANEL */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0 18px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(20,109,158,0.1) transparent'
                }}>
                  {/* CHIPS DE AMENIDADES RÁPIDAS */}
                  {activeServiceList.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {activeServiceList.map((s) => (
                        <span
                          key={s.key}
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#334155',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            padding: '3.5px 8px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Icon name={s.icon} size={11} color={accentColor} />
                          <span>{s.label}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* TARJETA DE VISTA PREVIA RESUMIDA */}
                  <div className="clay-card-static" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>


                    {/* Descripción rápida (Acerca de) */}
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon name="info" size={13} color="#64748B" />
                        <span>{lang === 'en' ? 'About' : lang === 'zh' ? '简介' : 'Acerca de'}</span>
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
                        {selectedPoint.descripcion || (lang === 'en' ? 'No description available.' : lang === 'zh' ? '暂无简介。' : 'Sin descripción disponible.')}
                      </p>
                    </div>

                    {/* BARRA DE CONTACTO DIRECTO Y REDES SOCIALES (UBICADA SUPERIOR ABAJO DE ACERCA DE) */}
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
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(20, 109, 158, 0.04)', border: '1px solid rgba(20, 109, 158, 0.12)', padding: '8px 10px', borderRadius: '12px' }}>
                          {whatsapp && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Contactar por WhatsApp"
                              style={{
                                padding: '7px 12px',
                                borderRadius: '9px',
                                background: '#22C55E',
                                border: '1px solid #16A34A',
                                color: '#FFFFFF',
                                fontSize: '12.5px',
                                fontWeight: '850',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                flex: '1 1 auto',
                                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)'
                              }}
                            >
                              <Icon name="whatsapp" size={15} color="#FFFFFF" />
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

                    {/* GALERÍA DE 6 ESPACIOS (3 COLUMNAS X 2 FILAS) CON TAMAÑO COMPACTO */}
                    {(() => {
                      const allPointPhotos = selectedPointDetails?.fotos || selectedPoint?.fotos_comunidad || (Array.isArray(selectedPoint?.fotos) ? selectedPoint.fotos : []);
                      return (
                        <div>
                          <h4 style={{ margin: '0 0 8px', fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Icon name="image" size={13} color="#64748B" />
                            <span>{lang === 'en' ? 'Photos & Media' : lang === 'zh' ? '照片相册' : 'Galería de Fotos'} ({allPointPhotos.length}/6)</span>
                          </h4>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {[0, 1, 2, 3, 4, 5].map((index) => {
                              const photoUrl = allPointPhotos[index];

                          if (photoUrl) {
                            return (
                              <div
                                key={index}
                                onClick={() => setPreviewPhotoModal(photoUrl)}
                                style={{
                                  height: '80px',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  border: '1px solid rgba(20, 109, 158, 0.12)',
                                  boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
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
                                height: '80px',
                                borderRadius: '12px',
                                border: '1.5px dashed rgba(20, 109, 158, 0.22)',
                                background: 'rgba(20, 109, 158, 0.03)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                padding: '6px',
                                textAlign: 'center'
                              }}
                            >
                              <Icon name="image" size={18} color="#94A3B8" />
                              <span style={{ fontSize: '10px', fontWeight: '750', color: '#94A3B8', lineHeight: '1.1' }}>
                                {lang === 'en' ? 'Coming Soon' : lang === 'zh' ? '敬请期待' : 'Próximamente'}
                              </span>
                            </div>
                            );
                          })}
                        </div>
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
                      <span>{lang === 'en' ? 'Claim this business' : lang === 'zh' ? '您是店主？认领此商户' : '¿Eres el dueño? Reclamar este negocio'}</span>
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

      {/* HUD Waze de Ruta — Diseño Premium con Maniobra Integrada y Soporte Responsivo Móvil Arriba */}
      {routeInfo && (
        <div className="atlan-nav-hud-card">
          {/* Cabecera con maniobra actual estilo Waze / Google Maps */}
          {currentManeuver && (
            <div className="atlan-nav-hud-maneuver">
              <div className="atlan-nav-hud-maneuver-main">
                <div className="atlan-nav-hud-icon-wrap">
                  {renderManeuverIcon(currentManeuver.iconKey, 28, '#FFFFFF')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="atlan-nav-hud-dist">
                    <span>{currentManeuver.distanceFormatted || formatDistanceDisplay(routeInfo.distance)}</span>
                  </div>
                  <div className="atlan-nav-hud-instr">
                    {currentManeuver.instruction || ''}
                  </div>
                </div>
              </div>

              {/* Siguiente paso ("Luego...") estilo Waze / Google Maps */}
              {currentManeuver.nextNext && (
                <div className="atlan-nav-hud-next">
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85, fontWeight: '800' }}>
                    {lang === 'en' ? 'Then' : lang === 'zh' ? '然后' : 'Luego'}:
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {renderManeuverIcon(currentManeuver.nextNext.iconKey, 16, '#FFFFFF')}
                  </div>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentManeuver.nextNext.instruction}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cuerpo del HUD */}
          <div className="atlan-nav-hud-body">
            {/* Header: label + botón cerrar */}
            <div className="atlan-nav-hud-header">
              <span className="atlan-nav-hud-label">
                🚗 {lang === 'en' ? 'Active Route' : lang === 'zh' ? '导航中路线' : 'Ruta Activa'}
              </span>
              <button
                onClick={cancelarRutaActiva}
                className="atlan-nav-hud-close"
                title="Cerrar ruta"
              >
                ✕
              </button>
            </div>

            {/* Nombre del destino */}
            <div className="atlan-nav-hud-dest">
              📍 {routeInfo.destinationName}
            </div>

            {/* Grid / Fila: Tiempo / Distancia */}
            <div className="atlan-nav-hud-stats">
              <div className="atlan-nav-hud-stat-box stat-time">
                <div className="stat-label">
                  {lang === 'en' ? 'Duration' : lang === 'zh' ? '时长' : 'Tiempo'}
                </div>
                <div className="stat-val val-green">
                  {formatDurationDisplay(routeInfo.duration)}
                </div>
              </div>
              <div className="atlan-nav-hud-stat-box stat-dist">
                <div className="stat-label">
                  {lang === 'en' ? 'Distance' : lang === 'zh' ? '距离' : 'Distancia'}
                </div>
                <div className="stat-val val-gold">
                  {formatDistanceDisplay(routeInfo.distance)}
                </div>
              </div>
            </div>

            {/* ETA */}
            <div className="atlan-nav-hud-eta">
              <span>{lang === 'en' ? 'Arrival ETA:' : lang === 'zh' ? '预计到达时间：' : 'Llegada (ETA):'}</span>
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
              {lang === 'en' ? 'You Reached Your Destination!' : lang === 'zh' ? '您已到达目的地！' : '¡Llegaste a tu Destino!'}
            </h3>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              {lang === 'en' 
                ? <>You traveled more than <strong>1 km</strong> and arrived at <strong>{visitPromptData?.puntoNombre || 'your destination'}</strong>. Would you like to record this visit in your Atlan achievements passport?</>
                : lang === 'zh'
                ? <>您已行驶超过 <strong>1 公里</strong> 并已到达 <strong>{visitPromptData?.puntoNombre || '您的目的地'}</strong>。是否将此次打卡记录保存到您的 Atlan 成就护照中？</>
                : <>Has recorrido más de <strong>1 km</strong> y arribado a <strong>{visitPromptData?.puntoNombre || 'tu destino'}</strong>. ¿Deseas registrar esta visita en tu pasaporte de logros Atlan?</>}
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
                {lang === 'en' ? 'Skip' : lang === 'zh' ? '跳过' : 'Omitir'}
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
                {isSubmittingVisit 
                  ? (lang === 'en' ? 'Recording...' : lang === 'zh' ? '正在记录...' : 'Registrando...') 
                  : (lang === 'en' ? '🎯 Mark as Visited (+1 Visit)' : lang === 'zh' ? '🎯 标记为已打卡 (+1 打卡)' : '🎯 Marcar como Visitado (+1 Visita)')}
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
