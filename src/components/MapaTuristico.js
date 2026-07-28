"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './ui/LanguageToggle';
import Icon from './ui/Icon';

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

  // Manejar previsualización de ruta y ocultación del panel de direcciones de Mapbox
  useEffect(() => {
    const directionsPanel = document.querySelector('.mapboxgl-ctrl-directions');
    
    if (!selectedPoint) {
      setPreviewRouteInfo(null);
      if (directionsPanel && !isNavigatingRef.current) {
        directionsPanel.style.display = '';
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
      return;
    }

    if (directionsPanel) {
      directionsPanel.style.display = 'none';
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
    if (!selectedPoint) {
      setSelectedPointDetails(null);
      setPointReviews([]);
      setPointMenu([]);
      setIsFavorite(false);
      setFavoriteId(null);
      return;
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
    selectedPointRef.current = selectedPoint;

    if (selectedPoint) {
      // Si el usuario abre detalles, cancelamos cualquier animación inicial de aproximación
      if (cinematicTimeoutsRef.current.length > 0) {
        console.log('[Atlan] Cancelando animación cinematográfica inicial por apertura de punto');
        cinematicTimeoutsRef.current.forEach(t => clearTimeout(t));
        cinematicTimeoutsRef.current = [];
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

        const popupHTML = `
          <div style="color:#0f172a; min-width:210px; max-width:260px; font-family:var(--font-outfit), sans-serif; padding:6px 4px 2px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1.5px solid #f1f5f9; padding-bottom:6px;">
              <span style="font-size:10px; font-weight:800; text-transform:uppercase; color:${statusColor}; display:flex; align-items:center; gap:5px;">
                <span style="width:6px; height:6px; border-radius:50%; background-color:${statusColor}; display:inline-block; animation: pulse 2s infinite;"></span>
                ${statusText}
              </span>
              <span style="font-size:12px; font-weight:700; color:#475569;">${ratingText}</span>
            </div>
            <h3 style="margin:0 0 6px; font-size:15px; font-weight:850; color:#1e3a8a; line-height:1.2; letter-spacing:-0.01em;">${punto.nombre}</h3>
            <p style="margin:0 0 10px; font-size:12.5px; color:#475569; line-height:1.4;">${punto.descripcion || ''}</p>
            
            ${punto.negocio_rango_precios ? `
              <div style="margin-bottom:8px; font-size:11px; font-weight:600; color:#0f766e; background:#f0fdfa; padding:3px 6px; border-radius:4px; display:inline-block;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> ${punto.negocio_rango_precios}
              </div>
            ` : ''}

            <div style="font-size:11px; color:#94a3b8; margin-bottom:12px; border-top: 1px dashed #e2e8f0; padding-top:6px;">
              ${t('map.addedBy')}: <span style="font-weight:700; color:#334155;">${punto.nombre_creador || 'Equipo Atlan'}</span>
            </div>
            
            <button id="${btnId}" style="width:100%; padding:10px 14px; background:linear-gradient(135deg, #1a3a6e 0%, #10b981 100%); color:white; border:none; border-radius:10px; font-weight:800; font-size:12.5px; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px; box-shadow: 0 4px 12px rgba(16,185,129,0.3); transition:all 0.2s ease-in-out;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              ${t('map.startNavigation')}
            </button>

            <button id="${btnInfoId}" style="width:100%; margin-top:8px; padding:10px 14px; background:rgba(255,255,255,0.05); color:#1e3a8a; border:1px solid rgba(30,58,138,0.2); border-radius:10px; font-weight:850; font-size:12px; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s ease-in-out;">
              ℹ️ ${lang === 'en' ? 'Details & Booking' : 'Detalles y Reservas'}
            </button>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupHTML);

        el.addEventListener('click', () => {
          lugarDestinoRef.current = punto.nombre;
        });

        popup.on('open', () => {
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

  const buildManeuverList = (steps) => {
    const list = [];
    steps.forEach((step) => {
      if (!step.maneuver?.instruction) return;
      const [mLng, mLat] = step.maneuver.location;
      list.push({
        lng: mLng,
        lat: mLat,
        instruction: limpiarInstruccion(step.maneuver.instruction),
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
      const { error } = await supabase.from('puntos').insert([{
        nombre: newPointNombre,
        descripcion: newPointDesc,
        nombre_creador: userSession?.user?.user_metadata?.nombre_completo || newPointCreador || 'Turista Registrado',
        categoria: newPointCategoria,
        ubicacion: `POINT(${lng} ${lat})`,
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
      interactive: false,
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

        if (steps.length > 0) {
          const instr = steps[0].maneuver.instruction;
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

      {/* Cabecera flotante */}
      {!selectedPoint && (
        <div className="map-header" style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '700px',
        background: 'rgba(10, 15, 28, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="logoText" style={{ fontSize: '22px', fontWeight: '800', background: 'linear-gradient(135deg, #D4AF37 0%, #FFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'LC Mogi', var(--font-outfit), sans-serif" }}>
            atlan
          </span>
        </Link>

        {/* BUSCADOR GLOBAL */}
        <div style={{ flex: 1, margin: '0 20px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '6px 12px', gap: '8px' }}>
            <span style={{ color: '#94a3b8' }}><Icon name="search" size={16} /></span>
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search destinations...' : 'Buscar destinos...'}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowResults(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Resultados de búsqueda */}
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '45px',
              left: 0,
              right: 0,
              background: 'rgba(10, 15, 28, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              maxHeight: '220px',
              overflowY: 'auto',
              zIndex: 99,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '6px 0'
            }}>
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => selectSearchResult(p)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.2s',
                  }}
                  className="search-result-item"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '13.5px', fontWeight: '750', color: 'white' }}>{p.nombre}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}><Icon name="mapPin" size={11} /> {t(`addPoint.categories.${p.categoria || 'otro'}`)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/"
            style={{
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '750',
              fontSize: '12px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.25s ease'
            }}
          >
            <Icon name="home" size={14} /> {lang === 'en' ? 'Home' : 'Inicio'}
          </Link>

          <Link
            href="/comunidad"
            style={{
              padding: '8px 14px',
              background: 'rgba(255, 215, 0, 0.12)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: '#FFD700',
              borderRadius: '12px',
              fontWeight: '750',
              fontSize: '12px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.25s ease'
            }}
          >
            <Icon name="users" size={14} /> {lang === 'en' ? 'Community' : 'Comunidad'}
          </Link>

          <button
            onClick={activarLevantarPunto}
            style={{
              padding: '8px 16px',
              background: isAddingPoint ? '#ef4444' : 'linear-gradient(135deg, #D4AF37 0%, #b89324 100%)',
              color: isAddingPoint ? 'white' : '#0a0f1c',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 10px rgba(212, 175, 55, 0.25)',
              transition: 'all 0.25s ease'
            }}
          >
            ➕ {isAddingPoint ? t('common.cancel') : t('map.addPoint')}
          </button>
          <LanguageToggle variant="pill" />
        </div>
      </div>
      )}

      {/* Banner modo agregar punto */}
      {isAddingPoint && (
        <div style={{
          position: 'absolute',
          top: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          maxWidth: '450px',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '12px',
          fontWeight: '700',
          fontSize: '13px',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
          zIndex: 10,
          animation: 'pulse 1.5s infinite'
        }}>
          🎯 {t('addPoint.tapMap')}
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
            background: filtroCategoria === null ? 'var(--atlan-gold)' : 'rgba(10, 15, 28, 0.8)',
            color: filtroCategoria === null ? '#0a0f1c' : 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
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
                background: isSelected ? config.color : 'rgba(10, 15, 28, 0.8)',
                color: isSelected ? 'white' : '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
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
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(10, 15, 28, 0.65)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20
        }}>
          <div className="add-point-modal">
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800', color: 'var(--atlan-gold)' }}>
              <Icon name="mapPin" size={20} /> {t('addPoint.title')}
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#94a3b8' }}>
              {t('addPoint.subtitle')}
            </p>

            <form onSubmit={handleGuardarPunto} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Coordenadas informativas */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '10px', fontSize: '11px', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Icon name="mapPin" size={12} /> Coords: {tempPointCoords[1].toFixed(5)}, {tempPointCoords[0].toFixed(5)}
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '750', color: '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                  {t('addPoint.placeName')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('addPoint.placeNamePlaceholder')}
                  value={newPointNombre}
                  onChange={(e) => setNewPointNombre(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '750', color: '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                  {t('addPoint.yourName')}
                </label>
                <input
                  type="text"
                  placeholder={t('addPoint.yourNamePlaceholder')}
                  value={newPointCreador}
                  onChange={(e) => setNewPointCreador(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '750', color: '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                  {t('addPoint.category')} *
                </label>
                <select
                  value={newPointCategoria}
                  onChange={(e) => setNewPointCategoria(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', background: '#141b2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '13.5px' }}
                >
                  {Object.keys(CATEGORIAS_CONFIG).map((key) => (
                    <option key={key} value={key}>
                      {t(`addPoint.categories.${key}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '750', color: '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                  {t('addPoint.description')} *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder={t('addPoint.descriptionPlaceholder')}
                  value={newPointDesc}
                  onChange={(e) => setNewPointDesc(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '13.5px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setTempPointCoords(null); }}
                  style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPoint}
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}
                >
                  {isSubmittingPoint ? '...' : t('addPoint.submit')}
                </button>
              </div>
            </form>
          </div>
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

      {/* Panel de detalles */}
      {selectedPoint && (
        <div className="detail-sheet">
          {/* Cabecera del Panel */}
          <div style={{
            padding: '24px 20px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedPointDetails?.logo_url && (
                <img
                  src={selectedPointDetails.logo_url}
                  alt={selectedPoint.nombre}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              )}
              <div>
                {(() => {
                  let statusText = '';
                  let statusColor = '';
                  let statusBg = '';

                  if (selectedPoint.estado === 'en_verificacion') {
                    statusText = lang === 'en' ? 'Awaiting Verification' : 'En Espera de Verificación';
                    statusColor = '#f97316';
                    statusBg = 'rgba(249, 115, 22, 0.15)';
                  } else if (selectedPoint.estado === 'aprobado') {
                    statusText = lang === 'en' ? 'Verified Business' : 'Negocio Verificado';
                    statusColor = '#10b981';
                    statusBg = 'rgba(16, 185, 129, 0.15)';
                  } else {
                    const isClaimed = !!selectedPoint.negocio_id;
                    statusText = isClaimed ? t('map.claimed') : t('map.unclaimed');
                    statusColor = isClaimed ? '#10b981' : '#f59e0b';
                    statusBg = isClaimed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';
                  }

                  return (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      color: statusColor,
                      background: statusBg,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'inline-block',
                      marginBottom: '8px',
                      border: `1px solid ${statusColor}40`
                    }}>
                      {statusText}
                    </span>
                  );
                })()}
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '850', color: '#1A1A2E', lineHeight: '1.2' }}>
                  {selectedPoint.nombre}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#4A5568', fontWeight: '600' }}>
                  📍 {t(`addPoint.categories.${selectedPoint.category || 'otro'}`)}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Botón Favorito */}
              {userSession && (
                <button
                  onClick={handleToggleFavorite}
                  title={isFavorite ? (lang === 'en' ? 'Remove from Favorites' : 'Quitar de Favoritos') : (lang === 'en' ? 'Add to Favorites' : 'Guardar en Favoritos')}
                  style={{
                    background: isFavorite ? 'rgba(255, 215, 0, 0.18)' : 'rgba(20, 109, 158, 0.08)',
                    border: isFavorite ? '1.5px solid #FFD700' : '1.5px solid rgba(20, 109, 158, 0.12)',
                    color: isFavorite ? '#B8960E' : '#4A5568',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {isFavorite ? '★' : '☆'}
                </button>
              )}

              <button
                onClick={() => setSelectedPoint(null)}
                style={{
                  background: 'rgba(20, 109, 158, 0.08)',
                  border: '1.5px solid rgba(20, 109, 158, 0.12)',
                  color: '#1A1A2E',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Cuerpo Scrollable */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent'
          }}>
            {/* BOTÓN INICIAR VIAJE */}
            <button
              onClick={() => handleIniciarViaje(selectedPoint)}
              className="clay-btn-blue"
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '15px',
                color: '#FFFFFF',
                marginBottom: '4px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span>{lang === 'en' ? 'Start Trip' : 'Iniciar Viaje'}</span>
            </button>

            {/* BOTÓN RECLAMAR NEGOCIO (SOLO SI ESTÁ COMPLETAMENTE LIBRE / SIN RECLAMO PENDIENTE) */}
            {!selectedPoint.negocio_id && selectedPoint.estado === 'sin_reclamar' && (
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
                🏢 {lang === 'en' ? 'Are you the owner? Claim this business' : '¿Eres el dueño? Reclamar este negocio'}
              </Link>
            )}

            {/* Banner Informativo si está en verificación */}
            {selectedPoint.estado === 'en_verificacion' && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(230, 194, 0, 0.12)',
                border: '1.5px solid rgba(230, 194, 0, 0.3)',
                borderRadius: '14px',
                fontSize: '13px',
                color: '#B8960E',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>⏳</span>
                <div>
                  <strong style={{ color: '#1A1A2E' }}>
                    {lang === 'en' ? 'Claim Under Review' : 'Solicitud de Reclamo en Verificación'}
                  </strong>
                  <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '2px', lineHeight: 1.4 }}>
                    {lang === 'en' 
                      ? 'A owner verification claim is currently being evaluated by Atlan administration.' 
                      : 'Una solicitud de verificación de propiedad sobre este local se encuentra actualmente en revisión por la administración.'}
                  </div>
                </div>
              </div>
            )}
            {/* Descripción */}
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '800', color: '#1A1A2E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {lang === 'en' ? 'About' : 'Acerca de'}
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#4A5568', lineHeight: '1.6' }}>
                {selectedPoint.descripcion || (lang === 'en' ? 'No description available.' : 'Sin descripción disponible.')}
              </p>
            </div>

            {/* Galería de Fotos del Negocio */}
            {selectedPointDetails?.fotos && selectedPointDetails.fotos.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '750', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📸 {lang === 'en' ? 'Photos' : 'Fotos'}
                </h4>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.1) transparent'
                }}>
                  {selectedPointDetails.fotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${selectedPoint.nombre} - ${i + 1}`}
                      style={{
                        width: '180px',
                        height: '120px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Horarios del Negocio */}
            {selectedPointDetails?.servicios?.has_hours && selectedPointDetails?.horarios && (
              <div style={{ borderTop: '1px solid rgba(20, 109, 158, 0.08)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1A1A2E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⏰ {lang === 'en' ? 'Opening Hours' : 'Horarios de Atención'}
                  </h4>
                  {isBusinessOpenNow(selectedPointDetails.horarios) !== null && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '850',
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: isBusinessOpenNow(selectedPointDetails.horarios) ? 'rgba(23, 170, 74, 0.12)' : 'rgba(239,68,68,0.12)',
                      color: isBusinessOpenNow(selectedPointDetails.horarios) ? '#17AA4A' : '#ef4444',
                      border: `1px solid ${isBusinessOpenNow(selectedPointDetails.horarios) ? 'rgba(23, 170, 74, 0.25)' : 'rgba(239,68,68,0.25)'}`
                    }}>
                      {isBusinessOpenNow(selectedPointDetails.horarios)
                        ? (lang === 'en' ? 'Open Now' : 'Abierto Ahora')
                        : (lang === 'en' ? 'Closed' : 'Cerrado')}
                    </span>
                  )}
                </div>
                <div className="clay-card-static" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(selectedPointDetails.horarios).map(([day, info]) => {
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
                      <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: isToday ? '#1A1A2E' : '#4A5568', fontWeight: isToday ? '800' : '500' }}>
                        <span>{dayLabels[day]} {isToday && '•'}</span>
                        <span>
                          {info.abierto
                            ? `${info.apertura} - ${info.cierre}`
                            : (lang === 'en' ? 'Closed' : 'Cerrado')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Menú del Negocio */}
            {selectedPointDetails?.servicios?.has_menu && (
              <div style={{ borderTop: '1px solid rgba(20, 109, 158, 0.08)', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '800', color: '#1A1A2E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🍽️ {t('dashboard.menu')}
                </h4>
                {pointMenu.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#4A5568', fontStyle: 'italic' }}>
                    {lang === 'en' ? 'No menu items published yet.' : 'No hay platillos publicados aún.'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pointMenu.map((item) => (
                      <div key={item.id} className="clay-card-static" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {item.foto_url ? (
                            <img
                              src={item.foto_url}
                              alt={item.nombre}
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                objectFit: 'cover',
                                border: '1px solid rgba(20, 109, 158, 0.1)'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '10px',
                              background: '#F4F6F9',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              fontSize: '18px',
                              border: '1px solid rgba(20, 109, 158, 0.1)'
                            }}>
                              🍲
                            </div>
                          )}
                          <div>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1A1A2E' }}>{item.nombre}</p>
                            {item.descripcion && (
                              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#4A5568' }}>{item.descripcion}</p>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--atlan-gold-dark, #B8960E)' }}>
                          C$ {item.precio}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reservas directas */}
            {selectedPointDetails?.servicios?.has_lodging && (
              <div style={{ borderTop: '1px solid rgba(20, 109, 158, 0.08)', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '800', color: '#1A1A2E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🏨 {t('reservations.title')}
                </h4>

                {reservaSuccess ? (
                  <div className="clay-card-static" style={{ background: 'rgba(23, 170, 74, 0.10)', border: '1px solid #17AA4A', color: '#17AA4A', padding: '14px', textAlign: 'center', fontWeight: '700' }}>
                    🎉 {t('reservations.success')}
                  </div>
                ) : !userSession ? (
                  <div className="clay-card-static" style={{ padding: '14px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#4A5568', fontWeight: '600' }}>
                      🔑 {t('reservations.loginRequired')}
                    </p>
                    <a
                      href="/login"
                      className="clay-btn-gold"
                      style={{
                        display: 'inline-flex',
                        padding: '8px 18px',
                        fontSize: '12px',
                        textDecoration: 'none'
                      }}
                    >
                      {t('nav.login')}
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleCrearReserva} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '750', color: '#1A1A2E', display: 'block', marginBottom: '4px' }}>
                        {t('reservations.type')}
                      </label>
                      <select
                        value={reservaTipo}
                        onChange={(e) => setReservaTipo(e.target.value)}
                        className="clay-input"
                        style={{ padding: '10px 14px' }}
                      >
                        <option value="mesa">{t('reservations.types.mesa')}</option>
                        <option value="habitacion">{t('reservations.types.habitacion')}</option>
                        <option value="tour">{t('reservations.types.tour')}</option>
                        <option value="transporte">{t('reservations.types.transporte')}</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', fontWeight: '750', color: '#1A1A2E', display: 'block', marginBottom: '4px' }}>
                          {t('reservations.date')} / {t('reservations.time')}
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={reservaFechaHora}
                          onChange={(e) => setReservaFechaHora(e.target.value)}
                          className="clay-input"
                          style={{ padding: '9px 12px' }}
                        />
                      </div>
                      <div style={{ width: '90px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '750', color: '#1A1A2E', display: 'block', marginBottom: '4px' }}>
                          🧑‍🤝‍🧑 {t('reservations.people')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={reservaPersonas}
                          onChange={(e) => setReservaPersonas(e.target.value)}
                          className="clay-input"
                          style={{ padding: '9px 12px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '750', color: '#1A1A2E', display: 'block', marginBottom: '4px' }}>
                        📝 {t('reservations.notes')}
                      </label>
                      <textarea
                        rows="2"
                        value={reservaNotas}
                        onChange={(e) => setReservaNotas(e.target.value)}
                        placeholder="..."
                        className="clay-textarea"
                        style={{ padding: '10px 14px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReserva}
                      className="clay-btn-gold"
                      style={{ width: '100%', padding: '12px' }}
                    >
                      {isSubmittingReserva ? '...' : t('reservations.submit')}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Panel de Reseñas */}
            <div style={{ borderTop: '1px solid rgba(20, 109, 158, 0.08)', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: '800', color: '#1A1A2E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⭐ {t('reviews.title')}
              </h4>

              {/* Formulario de Reseña */}
              {!userSession ? (
                <div className="clay-card-static" style={{ padding: '14px', textAlign: 'center', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#4A5568', fontWeight: '600' }}>
                    🔑 {lang === 'en' ? 'Log in to write reviews & comments' : 'Inicia sesión para escribir reseñas y comentarios'}
                  </p>
                  <a
                    href="/login"
                    className="clay-btn-gold"
                    style={{
                      display: 'inline-flex',
                      padding: '8px 18px',
                      fontSize: '12px',
                      textDecoration: 'none'
                    }}
                  >
                    {t('nav.login')}
                  </a>
                </div>
              ) : (
                <form onSubmit={handleCrearResena} className="clay-card-static" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--atlan-gold-dark, #B8960E)' }}>
                    {t('reviews.writeReview')}
                  </p>

                  {reviewErrorMsg && (
                    <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', background: 'rgba(239,68,68,0.1)', padding: '8px 10px', borderRadius: '8px' }}>
                      ⚠ {reviewErrorMsg}
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '750', color: '#1A1A2E', display: 'block', marginBottom: '4px' }}>
                      👤 {t('reviews.yourName')}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!userSession}
                      value={newReviewNombre}
                      onChange={(e) => setNewReviewNombre(e.target.value)}
                      placeholder="Ej: Carlos"
                      className="clay-input"
                      style={{ padding: '9px 12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '750', color: '#1A1A2E', display: 'block', marginBottom: '4px' }}>
                      ⭐ {t('reviews.rating')}
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewEstrellas(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '22px',
                            cursor: 'pointer',
                            padding: 0,
                            color: star <= newReviewEstrellas ? '#B8960E' : 'rgba(20, 109, 158, 0.2)',
                            transition: 'transform 0.1s'
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '750', color: '#1A1A2E', display: 'block', marginBottom: '4px' }}>
                      💬 {t('reviews.yourComment')}
                    </label>
                    <textarea
                      required
                      rows="3"
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="..."
                      className="clay-textarea"
                      style={{ padding: '10px 14px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="clay-btn-green"
                    style={{ width: '100%', padding: '10px' }}
                  >
                    {isSubmittingReview ? '...' : t('reviews.submit')}
                  </button>
                </form>
              )}

              {/* Listado de Reseñas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pointReviews.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#4A5568', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                    {lang === 'en' ? 'No reviews yet. Be the first!' : 'No hay reseñas aún. ¡Sé el primero!'}
                  </p>
                ) : (
                  pointReviews.map((rev) => (
                    <div key={rev.id} className="clay-card-static" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#1A1A2E' }}>{rev.autor_nombre}</span>
                        <span style={{ fontSize: '12px', color: '#B8960E' }}>
                          {'★'.repeat(rev.estrellas)}{'☆'.repeat(5 - rev.estrellas)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#4A5568', lineHeight: '1.5' }}>{rev.comentario}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HUD Waze de Ruta */}
      {routeInfo && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '20px',
          background: 'rgba(10, 15, 28, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '10px 14px',
          width: '220px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 15px rgba(59, 130, 246, 0.15)',
          zIndex: 15,
          color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              🚗 {lang === 'en' ? 'Active Route' : 'Ruta Activa'}
            </span>
            <button
              onClick={() => {
                if (directionsRef.current) directionsRef.current.clean();
                setRouteInfo(null);
              }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '10px' }}>
            {routeInfo.destinationName}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Duration' : 'Tiempo'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#10b981' }}>
                {formatDurationDisplay(routeInfo.duration)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Distance' : 'Distancia'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--atlan-gold)' }}>
                {formatDistanceDisplay(routeInfo.distance)}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span>{lang === 'en' ? 'Arrival ETA:' : 'Llegada (ETA):'}</span>
            <span style={{ fontWeight: '800', color: 'white' }}>{routeInfo.eta}</span>
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
