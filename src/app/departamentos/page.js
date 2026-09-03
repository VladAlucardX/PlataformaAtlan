"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Navbar from '../../components/ui/Navbar';
import Icon from '../../components/ui/Icon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { obtenerDepartamentoPorCoordenadas } from '../../lib/geoUtils';
import Link from 'next/link';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const DEPARTAMENTOS_LISTA = [
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

export default function DepartamentosPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const hoveredSpanRef = useRef(null);
  const currentHoveredDeptRef = useRef(null);
  const selectedDeptRef = useRef("Todos");

  const [selectedDept, setSelectedDept] = useState("Todos");
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userVisitsCount, setUserVisitsCount] = useState(0);

  // Sesión centralizada desde AuthContext
  const { session: userSession, perfil } = useAuth();

  // Modo de Ranking: 'global' | 'propio' y Límite de Paginación Top 5
  const [rankingMode, setRankingMode] = useState('global');
  const [visibleCount, setVisibleCount] = useState(5);

  // Sincronizar ref del departamento seleccionado
  useEffect(() => {
    selectedDeptRef.current = selectedDept;
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      actualizarCapasSeleccion(mapRef.current, selectedDept);
    }
  }, [selectedDept]);

  const actualizarCapasSeleccion = (map, dept) => {
    try {
      const targetName = dept && dept !== "Todos" ? dept : "___NONE___";
      const matchFilter = ['==', ['coalesce', ['get', 'nombre'], ['get', 'name_es'], ['get', 'name'], ''], targetName];
      map.setFilter('dept-selected-fill', matchFilter);
      map.setFilter('dept-selected-borders', matchFilter);
      map.setFilter('dept-selected-glow', matchFilter);
    } catch (_) {}
  };

  // Cargar visitas del usuario cuando la sesión cambia
  useEffect(() => {
    if (userSession?.user) {
      cargarVisitasUsuario(userSession.user.id);
    } else {
      setUserVisitsCount(0);
    }
  }, [userSession?.user?.id]);

  const cargarVisitasUsuario = async (userId) => {
    try {
      const { count, error } = await supabase
        .from('visitas_puntos')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', userId);
      if (!error && count !== null) {
        setUserVisitsCount(count);
      }
    } catch (e) {
      console.warn("Error cargando visitas del usuario:", e);
    }
  };

  // Obtener nombre del rango de turista
  const getTouristBadgeLabel = () => {
    if (!userSession) return "Turista";
    if (perfil?.es_premium || perfil?.suscripcion_activa || perfil?.rol === "turista_deacachimba" || perfil?.es_pago) {
      return "Turista Deacachimba";
    }
    return "Turista Tuani";
  };

  // Corregir departamento de cada lugar usando detección por coordenadas (GeoJSON polygons)
  const corregirYFiltrarDepartamentos = async (data, dept) => {
    if (!data || data.length === 0) return [];

    const corrected = await Promise.all(data.map(async (lugar) => {
      if (lugar.lat != null && lugar.lng != null) {
        const lng = typeof lugar.lng === 'string' ? parseFloat(lugar.lng) : lugar.lng;
        const lat = typeof lugar.lat === 'string' ? parseFloat(lugar.lat) : lugar.lat;
        if (!isNaN(lng) && !isNaN(lat)) {
          try {
            const deptReal = await obtenerDepartamentoPorCoordenadas(lng, lat);
            if (deptReal && deptReal !== lugar.departamento) {
              supabase
                .from('puntos')
                .update({ departamento: deptReal })
                .eq('id', lugar.id)
                .then(({ error }) => {
                  if (error) console.warn('[Atlan] No se pudo auto-corregir departamento para:', lugar.nombre, error);
                });
              return { ...lugar, departamento: deptReal };
            }
          } catch (_) {}
        }
      }
      return lugar;
    }));

    if (dept && dept !== "Todos") {
      return corrected.filter(lugar => lugar.departamento === dept);
    }
    return corrected;
  };

  // Cargar datos de ranking según el departamento seleccionado y el modo (Global vs Propio)
  const cargarRanking = async (dept, mode = rankingMode) => {
    setLoading(true);
    try {
      if (mode === 'propio') {
        if (!userSession?.user) {
          setRankingData([]);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.rpc('obtener_ranking_propio', {
          p_usuario_id: userSession.user.id,
          p_departamento: null
        });
        if (error) throw error;
        const resultado = await corregirYFiltrarDepartamentos(data || [], dept);
        setRankingData(resultado);
      } else {
        const { data, error } = await supabase.rpc('obtener_ranking_lugares', {
          p_departamento: null
        });
        if (error) throw error;
        const resultado = await corregirYFiltrarDepartamentos(data || [], dept);
        setRankingData(resultado);
      }
    } catch (err) {
      console.warn("[Atlan] Fallo en RPC ranking, buscando en tabla puntos:", err);
      try {
        let query = supabase
          .from('puntos')
          .select('*')
          .order('total_visitas', { ascending: false })
          .limit(50);

        const { data: fallbackData } = await query;
        const resultado = await corregirYFiltrarDepartamentos(fallbackData || [], dept);
        setRankingData(resultado);
      } catch (fErr) {
        console.error("Error fallback ranking:", fErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setVisibleCount(5);
    cargarRanking(selectedDept, rankingMode);

    if (selectedDept === "Todos" && mapRef.current) {
      mapRef.current.flyTo({
        center: [-85.10, 12.75],
        zoom: 6.25,
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
    }
  }, [selectedDept, rankingMode, userSession]);

  // Mapbox GL Map con Relleno Ultra Sutil (0.05) y Bordes Delgados (#0A192F 1.0px)
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12?optimize=true',
      center: [-85.10, 12.75],
      zoom: 6.25,
      minZoom: 5.8,
      maxZoom: 7.8,
      pitch: 0,
      projection: 'mercator',
      maxBounds: [[-88.5, 9.8], [-81.5, 15.5]],
      scrollZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      dragRotate: false,
      dragPan: false,
      touchZoomRotate: false,
      keyboard: false
    });

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const EMPTY_FILTER = ['==', ['coalesce', ['get', 'nombre'], ['get', 'name_es'], ['get', 'name'], ''], '___NONE___'];

    // Limpieza instantánea: solo se invoca al salir del contenedor HTML del mapa
    const forceClearHoverNow = () => {
      currentHoveredDeptRef.current = null;
      if (mapRef.current && mapRef.current.isStyleLoaded()) {
        try {
          mapRef.current.setFilter('dept-hover-fill', EMPTY_FILTER);
          mapRef.current.setFilter('dept-hover-borders', EMPTY_FILTER);
        } catch (_) {}
      }
      if (hoveredSpanRef.current) {
        hoveredSpanRef.current.style.display = "none";
      }
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = '';
      }
    };

    // ÚNICO punto de limpieza: salida del contenedor HTML (no del canvas de Mapbox)
    const containerElement = mapContainerRef.current;
    containerElement?.addEventListener('mouseleave', forceClearHoverNow);

    map.on('load', () => {
      try {
        const styleLayers = map.getStyle().layers || [];
        styleLayers.forEach((layer) => {
          if (
            layer.id.startsWith('road') ||
            layer.id.startsWith('bridge') ||
            layer.id.startsWith('tunnel') ||
            layer.id.includes('admin') ||
            layer.id.includes('boundary') ||
            layer.type === 'symbol'
          ) {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        });
      } catch (_) {}

      map.addSource('nicaragua-departments', {
        type: 'geojson',
        data: '/nicaragua-departments.json'
      });

      map.addSource('nicaragua-dept-centroids', {
        type: 'geojson',
        data: '/nicaragua-department-centroids.json'
      });

      const COLOR_MATCH_EXPR = [
        'match',
        ['coalesce', ['get', 'nombre'], ['get', 'name_es'], ['get', 'name'], ''],
        'Managua', '#FF5722',
        'León', '#E91E63',
        'Chinandega', '#FF9800',
        'Granada', '#3F51B5',
        'Masaya', '#9C27B0',
        'Carazo', '#00BCD4',
        'Rivas', '#009688',
        'Matagalpa', '#8D6E63',
        'Jinotega', '#2E7D32',
        'Estelí', '#F59E0B',
        'Madriz', '#D97706',
        'Nueva Segovia', '#8BC34A',
        'Boaco', '#673AB7',
        'Chontales', '#10B981',
        'Río San Juan', '#0284C7',
        'Rio San Juan', '#0284C7',
        'RACCN (Caribe Norte)', '#E11D48',
        'Atlántico Norte', '#E11D48',
        'RACCS (Caribe Sur)', '#EC4899',
        'Atlántico Sur', '#EC4899',
        '#38BDF8'
      ];

      // 1. Capa Relleno Base (Polígonos Estáticos Ultra Sutiles)
      map.addLayer({
        id: 'dept-fill-base',
        type: 'fill',
        source: 'nicaragua-departments',
        paint: {
          'fill-color': '#146D9E',
          'fill-opacity': 0.05
        }
      });

      // 2. Capa Bordes Base (Líneas Blancas Muy Sutiles - 1.0px)
      map.addLayer({
        id: 'dept-borders-base',
        type: 'line',
        source: 'nicaragua-departments',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 1.0,
          'line-opacity': 0.92
        }
      });

      // 3. Capa Hover Relleno
      map.addLayer({
        id: 'dept-hover-fill',
        type: 'fill',
        source: 'nicaragua-departments',
        paint: {
          'fill-color': COLOR_MATCH_EXPR,
          'fill-opacity': 0.65
        },
        filter: EMPTY_FILTER
      });

      // 4. Capa Hover Borde Blanco
      map.addLayer({
        id: 'dept-hover-borders',
        type: 'line',
        source: 'nicaragua-departments',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 2.4,
          'line-opacity': 0.95
        },
        filter: EMPTY_FILTER
      });

      // 5. Capa Selección Resplandor (Glow)
      map.addLayer({
        id: 'dept-selected-glow',
        type: 'line',
        source: 'nicaragua-departments',
        paint: {
          'line-color': COLOR_MATCH_EXPR,
          'line-width': 14,
          'line-blur': 8,
          'line-opacity': 0.85
        },
        filter: EMPTY_FILTER
      });

      // 6. Capa Selección Relleno
      map.addLayer({
        id: 'dept-selected-fill',
        type: 'fill',
        source: 'nicaragua-departments',
        paint: {
          'fill-color': COLOR_MATCH_EXPR,
          'fill-opacity': 0.88
        },
        filter: EMPTY_FILTER
      });

      // 7. Capa Selección Borde Blanco Grueso
      map.addLayer({
        id: 'dept-selected-borders',
        type: 'line',
        source: 'nicaragua-departments',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 3.8,
          'line-opacity': 1.0
        },
        filter: EMPTY_FILTER
      });

      // 8. Etiquetas de Texto
      map.addLayer({
        id: 'dept-labels',
        type: 'symbol',
        source: 'nicaragua-dept-centroids',
        layout: {
          'text-field': ['get', 'nombre'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 11,
            8, 14.5,
            12, 17.5
          ],
          'text-allow-overlap': true,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#0A192F',
          'text-halo-width': 2
        }
      });

      actualizarCapasSeleccion(map, selectedDeptRef.current);

      // ESTRATEGIA ANTI-PARPADEO DEFINITIVA:
      // - mouseenter en dept-fill-base: cambiar highlight al nuevo departamento
      // - El océano/agua NO dispara NINGÚN evento ni cambio de filtro
      // - SOLO se limpia al salir del contenedor HTML del mapa (mouseleave DOM)
      // Esto elimina el parpadeo al 100% porque jamás se ejecuta setFilter en la zona del océano.

      map.on('mouseenter', 'dept-fill-base', (e) => {
        if (e.features && e.features.length > 0) {
          const feat = e.features[0];
          const deptName = feat.properties ? (feat.properties.nombre || feat.properties.name || feat.properties.name_es) : null;

          if (deptName && deptName !== currentHoveredDeptRef.current) {
            currentHoveredDeptRef.current = deptName;

            const hoverFilter = ['==', ['coalesce', ['get', 'nombre'], ['get', 'name_es'], ['get', 'name'], ''], deptName];
            try {
              map.setFilter('dept-hover-fill', hoverFilter);
              map.setFilter('dept-hover-borders', hoverFilter);
            } catch (_) {}

            if (hoveredSpanRef.current) {
              if (deptName !== selectedDeptRef.current) {
                hoveredSpanRef.current.textContent = deptName;
                hoveredSpanRef.current.style.display = "inline-block";
              } else {
                hoveredSpanRef.current.style.display = "none";
              }
            }
          }
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      // mousemove SOLO dentro de dept-fill-base para detectar cambio entre departamentos
      map.on('mousemove', 'dept-fill-base', (e) => {
        if (e.features && e.features.length > 0) {
          const feat = e.features[0];
          const deptName = feat.properties ? (feat.properties.nombre || feat.properties.name || feat.properties.name_es) : null;

          if (deptName && deptName !== currentHoveredDeptRef.current) {
            currentHoveredDeptRef.current = deptName;

            const hoverFilter = ['==', ['coalesce', ['get', 'nombre'], ['get', 'name_es'], ['get', 'name'], ''], deptName];
            try {
              map.setFilter('dept-hover-fill', hoverFilter);
              map.setFilter('dept-hover-borders', hoverFilter);
            } catch (_) {}

            if (hoveredSpanRef.current) {
              if (deptName !== selectedDeptRef.current) {
                hoveredSpanRef.current.textContent = deptName;
                hoveredSpanRef.current.style.display = "inline-block";
              } else {
                hoveredSpanRef.current.style.display = "none";
              }
            }
          }
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      // NO hay mouseleave en dept-fill-base
      // NO hay mousemove global
      // El hover se limpia ÚNICAMENTE al salir del contenedor HTML (línea 286)

      map.on('click', 'dept-fill-base', (e) => {
        if (e.features && e.features.length > 0) {
          const feat = e.features[0];
          const name = feat.properties ? (feat.properties.nombre || feat.properties.name || feat.properties.name_es) : null;

          if (name) {
            setSelectedDept(name);
          }
        }
      });
    });

    return () => {
      containerElement?.removeEventListener('mouseleave', forceClearHoverNow);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ height: "100vh", maxHeight: "100vh", overflow: "hidden", background: "radial-gradient(ellipse at 50% 35%, #102A45 0%, #0A192F 60%, #061120 100%)", color: "#FFFFFF", fontFamily: "var(--font-outfit), sans-serif", position: "relative" }}>
      <Navbar activePage="departamentos" session={userSession} perfil={perfil} />

      {/* Contenedor Principal Ajustado al 100vh Sin Scroll Vertical de Página */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "75px 20px 14px 20px", height: "100vh", maxHeight: "100vh", display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative", zIndex: 1, overflow: "hidden" }}>
        
        {/* Encabezado Compacto con la palabra Nicaragua pintada con la Bandera (Azul - Blanco - Azul) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "16px", flexWrap: "wrap", flexShrink: 0 }}>
          <div>
            <h1 style={{ 
              fontSize: "clamp(18px, 2.2vw, 26px)", 
              fontWeight: "900", 
              letterSpacing: "0.2px", 
              color: "#FFFFFF", 
              margin: 0, 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              flexWrap: "wrap"
            }}>
              <span style={{ textShadow: "0 2px 10px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.8)" }}>
                Ranking de Lugares más visitados en
              </span>
              <span style={{
                background: "linear-gradient(180deg, #0072CE 0%, #0072CE 33%, #FFFFFF 34%, #FFFFFF 66%, #0072CE 67%, #0072CE 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "900",
                fontSize: "1.3em",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.9)) drop-shadow(0 0 2px rgba(0,0,0,0.8))",
                padding: "0 2px",
                display: "inline-block"
              }}>
                Nicaragua
              </span>
            </h1>
          </div>

          {/* Banner Compacto de Logros del Usuario con gueguense.svg y Nivel (Turista Tuani / Turista Deacachimba / Turista) */}
          {userSession && (
            <div style={{ background: "rgba(255, 255, 255, 0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "12px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <img src="/images/gueguense.svg" alt="Güegüense" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                <span style={{ fontSize: "12.5px", fontWeight: "800", color: "#FFFFFF" }}>
                  <span>{perfil?.nombre_completo || perfil?.nombre || userSession?.user?.user_metadata?.nombre_completo || 'Turista'}</span>: <span style={{ color: "#38BDF8" }}>{userVisitsCount}</span> {userVisitsCount === 1 ? 'visita' : 'visitas'}
                </span>
              </div>

              <span style={{ fontSize: "11px", fontWeight: "800", background: "rgba(255, 255, 255, 0.12)", color: "#FFFFFF", padding: "2px 8px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.25)", display: "flex", alignItems: "center", gap: "4px" }}>
                <img src="/images/perfil.svg" alt="Turista" style={{ width: "12px", height: "12px", filter: "brightness(0) invert(0.9)" }} />
                <span>{getTouristBadgeLabel()}</span>
              </span>
            </div>
          )}
        </div>

        {/* Layout Principal Flexible en 2 Columnas Estrictas (Paneles Traslúcidos de Cristal) */}
        <div style={{ flex: 1, minHeight: 0, maxHeight: "100%", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "18px", alignItems: "stretch", overflow: "hidden" }}>

          {/* Columna Izquierda: Mapa de Departamentos Traslúcido (Azul Navbar) */}
          <div style={{ background: "rgba(10, 25, 47, 0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.14)", borderRadius: "20px", padding: "14px", boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", height: "100%", maxHeight: "100%", minHeight: 0, boxSizing: "border-box", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", padding: "0 2px", flexShrink: 0 }}>
              
              {/* Título de la Columna */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "6px" }}>
                  <img src="/images/Ubicacion.svg" alt="Mapa" style={{ width: "16px", height: "16px", filter: "brightness(0) invert(1)" }} />
                  <span>Mapa de Departamentos</span>
                </span>
              </div>

              {/* Señalizador de Departamento Seleccionado o Sobrevolado */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {selectedDept && selectedDept !== "Todos" && (
                  <span style={{ fontSize: "11.5px", fontWeight: "800", background: "rgba(56, 189, 248, 0.2)", color: "#38BDF8", padding: "3px 9px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.4)", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 2px 8px rgba(56, 189, 248, 0.2)" }}>
                    <img src="/images/Ubicacion.svg" alt="Señalizador" style={{ width: "13px", height: "13px", filter: "brightness(0) saturate(100%) invert(67%) sepia(85%) saturate(1800%) hue-rotate(170deg)" }} />
                    <span>{selectedDept}</span>
                  </span>
                )}

                {/* Badge DOM Directo para Hover sin Re-render de React */}
                <span 
                  ref={hoveredSpanRef} 
                  style={{ 
                    display: "none", 
                    fontSize: "11px", 
                    fontWeight: "800", 
                    background: "rgba(255, 255, 255, 0.15)", 
                    color: "#E2E8F0", 
                    padding: "2px 8px", 
                    borderRadius: "6px", 
                    border: "1px solid rgba(255,255,255,0.25)" 
                  }} 
                />
              </div>
            </div>

            {/* Selector de Departamento en Dropdown Traslúcido */}
            <div style={{ marginBottom: "10px", flexShrink: 0 }}>
              <select 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", background: "rgba(10, 25, 47, 0.85)", border: "1px solid rgba(255, 255, 255, 0.18)", borderRadius: "10px", color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer", outline: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
              >
                {DEPARTAMENTOS_LISTA.map(d => (
                  <option key={d} value={d} style={{ background: "#0A192F", color: "#FFFFFF" }}>{d === "Todos" ? "Todos los Departamentos" : d}</option>
                ))}
              </select>
            </div>

            {/* Contenedor del Mapa Mapbox Flexible Fijo */}
            <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0, maxHeight: "100%", width: "100%", borderRadius: "14px", overflow: "hidden", position: "relative", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
          </div>

          {/* Columna Derecha: Ranking Top Lugares (Panel Traslúcido Azul Navbar con Tortuga de Fondo) */}
          <div style={{ background: "rgba(10, 25, 47, 0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.14)", borderRadius: "20px", padding: "14px", boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", height: "100%", maxHeight: "100%", minHeight: 0, boxSizing: "border-box", overflow: "hidden", position: "relative" }}>
            
            {/* Elemento Decorativo: Tortuga SVG Agrandada al Fondo del Panel Derecho */}
            <div
              style={{
                position: "absolute",
                top: "52%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(580px, 115%)",
                height: "min(580px, 115%)",
                pointerEvents: "none",
                zIndex: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.42
              }}
            >
              <img
                src="/images/tortuga.svg"
                alt="Tortuga Atlan"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: "brightness(0) invert(0.95) drop-shadow(0 0 25px rgba(56, 189, 248, 0.5)) drop-shadow(0 0 50px rgba(2, 132, 199, 0.35))"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px", flexShrink: 0, position: "relative", zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#FFFFFF", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                {selectedDept === "Todos" 
                  ? (rankingMode === 'global' ? 'Lugares Más Visitados' : 'Mis Lugares Más Visitados')
                  : (rankingMode === 'global' ? `Más Visitados en ${selectedDept}` : `Mis Visitas en ${selectedDept}`)}
              </h2>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#CBD5E1", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}>
                {rankingData.length} Destinos
              </span>
            </div>

            {/* Selector de Modo con SVGs Personalizados: Clic en Ranking Global resetea departamento a Todos */}
            <div style={{ 
              display: "flex", 
              gap: "6px", 
              marginBottom: "12px", 
              flexShrink: 0, 
              position: "relative", 
              zIndex: 1,
              background: "rgba(3, 14, 33, 0.75)",
              padding: "4px",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
            }}>
              {/* Botón Ranking Global */}
              <button
                onClick={() => {
                  setRankingMode('global');
                  setSelectedDept("Todos");
                  setVisibleCount(5);
                }}
                style={{
                  flex: 1,
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: rankingMode === 'global' ? "1px solid rgba(255, 255, 255, 0.45)" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: rankingMode === 'global' 
                    ? "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)" 
                    : "rgba(255, 255, 255, 0.05)",
                  color: rankingMode === 'global' ? "#FFFFFF" : "#CBD5E1",
                  fontWeight: "800",
                  fontSize: "13.5px",
                  letterSpacing: "0.3px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  textShadow: rankingMode === 'global' ? "0 1px 3px rgba(0, 0, 0, 0.5)" : "0 1px 2px rgba(0, 0, 0, 0.4)",
                  boxShadow: rankingMode === 'global' ? "0 4px 14px rgba(14, 165, 233, 0.45)" : "none",
                  transition: "all 0.25s ease"
                }}
              >
                <img 
                  src="/images/croquisnicaragua.svg" 
                  alt="Ranking Global" 
                  style={{ 
                    width: "19px", 
                    height: "19px", 
                    objectFit: "contain", 
                    filter: rankingMode === 'global' ? "brightness(0) invert(1)" : "brightness(0) invert(0.75)" 
                  }} 
                />
                <span>Ranking Global</span>
              </button>

              {/* Botón Ranking Propio */}
              <button
                onClick={() => setRankingMode('propio')}
                style={{
                  flex: 1,
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: rankingMode === 'propio' ? "1px solid rgba(255, 255, 255, 0.45)" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: rankingMode === 'propio' 
                    ? "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)" 
                    : "rgba(255, 255, 255, 0.05)",
                  color: rankingMode === 'propio' ? "#FFFFFF" : "#CBD5E1",
                  fontWeight: "800",
                  fontSize: "13.5px",
                  letterSpacing: "0.3px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  textShadow: rankingMode === 'propio' ? "0 1px 3px rgba(0, 0, 0, 0.5)" : "0 1px 2px rgba(0, 0, 0, 0.4)",
                  boxShadow: rankingMode === 'propio' ? "0 4px 14px rgba(14, 165, 233, 0.45)" : "none",
                  transition: "all 0.25s ease"
                }}
              >
                <img 
                  src="/images/perfil.svg" 
                  alt="Ranking Propio" 
                  style={{ 
                    width: "17px", 
                    height: "17px", 
                    objectFit: "contain", 
                    filter: rankingMode === 'propio' ? "brightness(0) invert(1)" : "brightness(0) invert(0.75)" 
                  }} 
                />
                <span>Ranking Propio</span>
              </button>
            </div>

            {/* Contenedor desplazable con Scroll Interno Exclusivo y Tarjetas Traslúcidas */}
            <div className="dept-tabs-scroll" style={{ flex: 1, minHeight: 0, maxHeight: "100%", overflowY: "auto", paddingRight: "4px", display: "flex", flexDirection: "column", gap: "8px", position: "relative", zIndex: 1 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: "36px", height: "36px", border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#FFFFFF", borderRadius: "50%", margin: "0 auto 12px auto", animation: "spin 1s linear infinite" }} />
                  <p style={{ color: "#CBD5E1", fontSize: "13px" }}>Cargando ranking de destinos...</p>
                </div>
              ) : rankingMode === 'propio' && !userSession ? (
                <div style={{ background: "rgba(10, 20, 38, 0.75)", backdropFilter: "blur(10px)", border: "1px dashed rgba(56, 189, 248, 0.5)", borderRadius: "16px", padding: "24px 16px", textAlign: "center" }}>
                  <div style={{ marginBottom: "10px", display: "flex", justifyContent: "center" }}>
                    <img src="/images/perfil.svg" alt="Perfil" style={{ width: "32px", height: "32px", filter: "brightness(0) saturate(100%) invert(67%) sepia(85%) saturate(1800%) hue-rotate(170deg)" }} />
                  </div>
                  <h3 style={{ margin: "0 0 6px 0", fontSize: "15.5px", fontWeight: "800", color: "#FFFFFF" }}>Inicia sesión como turista</h3>
                  <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#E2E8F0", lineHeight: "1.4" }}>
                    Inicia sesión para ver tu historial personalizado de los lugares que has visitado en Nicaragua.
                  </p>
                  <Link
                    href="/login"
                    style={{
                      display: "inline-block", padding: "9px 18px", background: "linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)",
                      borderRadius: "10px", color: "#FFFFFF", fontWeight: "800", textDecoration: "none", fontSize: "13px",
                      boxShadow: "0 4px 12px rgba(56, 189, 248, 0.3)"
                    }}
                  >
                    Iniciar Sesión
                  </Link>
                </div>
              ) : rankingData.length === 0 ? (
                <div style={{ background: "rgba(10, 20, 38, 0.75)", backdropFilter: "blur(10px)", border: "1px dashed rgba(255, 255, 255, 0.25)", borderRadius: "16px", padding: "30px 16px", textAlign: "center" }}>
                  <div style={{ marginBottom: "10px", display: "flex", justifyContent: "center" }}>
                    <img src="/images/Ubicacion.svg" alt="Brújula" style={{ width: "30px", height: "30px", filter: "brightness(0) invert(0.9)" }} />
                  </div>
                  <h3 style={{ margin: "0 0 6px 0", fontSize: "15.5px", fontWeight: "800", color: "#FFFFFF" }}>
                    {rankingMode === 'propio' ? 'Aún no has registrado visitas' : 'Aún no hay visitas registradas'}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#CBD5E1", lineHeight: "1.4" }}>
                    {rankingMode === 'propio' 
                      ? `Visita un destino en ${selectedDept === "Todos" ? "Nicaragua" : selectedDept} y márcalo en el mapa para sumarlo a tu ranking propio.`
                      : `Sé el primer turista en explorar y marcar visitas en ${selectedDept === "Todos" ? "Nicaragua" : selectedDept}.`}
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                    {rankingData.slice(0, visibleCount).map((lugar, idx) => {
                      const pos = idx + 1;
                      const countVisits = rankingMode === 'propio' ? (lugar.mis_visitas || 1) : (lugar.total_visitas || 0);

                      // Formato estándar a 1 decimal para todas las calificaciones (ej. 5.0)
                      const formattedRating = (lugar.negocio_rating != null && !isNaN(parseFloat(lugar.negocio_rating)))
                        ? parseFloat(lugar.negocio_rating).toFixed(1)
                        : '5.0';

                      return (
                        <div 
                          key={lugar.id}
                          style={{ 
                            background: pos === 1 
                              ? "linear-gradient(135deg, rgba(22, 48, 82, 0.78) 0%, rgba(10, 26, 50, 0.82) 100%)"
                              : "rgba(10, 25, 47, 0.65)", 
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            border: pos === 1 ? "1px solid rgba(255, 215, 0, 0.55)" : "1px solid rgba(255, 255, 255, 0.18)",
                            borderRadius: "14px",
                            padding: "11px 14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            boxShadow: pos === 1 ? "0 6px 20px rgba(255, 215, 0, 0.15)" : "0 3px 8px rgba(0,0,0,0.3)",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            {/* Píldora de Posición: Lugar 1 (Oro), Lugar 2 (Plata), Lugar 3 (Cobre) */}
                            <div style={{ 
                              minWidth: "62px", 
                              padding: "5px 8px", 
                              borderRadius: "8px", 
                              background: pos === 1 
                                ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" 
                                : pos === 2 
                                ? "linear-gradient(135deg, rgba(226, 232, 240, 0.3) 0%, rgba(148, 163, 184, 0.2) 100%)" 
                                : pos === 3 
                                ? "linear-gradient(135deg, rgba(217, 119, 6, 0.45) 0%, rgba(180, 83, 9, 0.3) 100%)" 
                                : "rgba(255, 255, 255, 0.08)", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              fontSize: "11.5px", 
                              fontWeight: "900", 
                              color: pos === 1 ? "#FFFFFF" : pos === 2 ? "#F8FAFC" : pos === 3 ? "#FDBA74" : "#CBD5E1", 
                              border: pos === 1 
                                ? "1px solid rgba(255, 255, 255, 0.5)" 
                                : pos === 2 
                                ? "1px solid rgba(226, 232, 240, 0.45)" 
                                : pos === 3 
                                ? "1px solid rgba(249, 115, 22, 0.5)" 
                                : "1px solid rgba(255, 255, 255, 0.18)",
                              flexShrink: 0,
                              textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                              boxShadow: pos === 1 
                                ? "0 2px 8px rgba(245, 158, 11, 0.35)" 
                                : "none"
                            }}>
                              Lugar {pos}
                            </div>

                            {/* Info del Lugar */}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap", overflow: "hidden" }}>
                                <h3 style={{ 
                                  margin: 0, 
                                  fontSize: "14px", 
                                  fontWeight: "800", 
                                  color: "#FFFFFF", 
                                  whiteSpace: "nowrap", 
                                  overflow: "hidden", 
                                  textOverflow: "ellipsis",
                                  letterSpacing: "0.2px",
                                  textShadow: "0 1px 3px rgba(0,0,0,0.8)"
                                }}>
                                  {lugar.nombre}
                                </h3>
                                <span style={{ 
                                  fontSize: "9.5px", 
                                  fontWeight: "800", 
                                  textTransform: "uppercase", 
                                  background: "rgba(56, 189, 248, 0.22)", 
                                  color: "#7DD3FC", 
                                  border: "1px solid rgba(56, 189, 248, 0.35)",
                                  padding: "2px 6px", 
                                  borderRadius: "5px", 
                                  flexShrink: 0 
                                }}>
                                  {lugar.categoria}
                                </span>
                              </div>

                              {/* Departamento con Ubicacion.svg y Rating estandarizado a 1 decimal (ej. 5.0) */}
                              <p style={{ margin: "3px 0 0 0", fontSize: "11.5px", color: "#E2E8F0", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <img src="/images/Ubicacion.svg" alt="Ubicación" style={{ width: "13px", height: "13px", filter: "brightness(0) invert(0.95)", flexShrink: 0 }} />
                                  <span style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}>{lugar.departamento || 'Nicaragua'}</span>
                                </span>

                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                    <img 
                                      src="/images/flor.svg" 
                                      alt="Rating Flor" 
                                      style={{ 
                                        width: "15px", 
                                        height: "15px", 
                                        objectFit: "contain",
                                        filter: "drop-shadow(0 0 3px rgba(255, 215, 0, 0.95)) drop-shadow(0 0 1px #000)" 
                                      }} 
                                    />
                                  </span>
                                  <span style={{ fontWeight: "800", color: "#FBBF24", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{formattedRating}</span>
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Contador de Visitas con perfil.svg y Acción */}
                          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                            <div style={{
                              background: rankingMode === 'propio' ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.16)",
                              border: rankingMode === 'propio' ? "1px solid rgba(56, 189, 248, 0.45)" : "1px solid rgba(255, 255, 255, 0.25)",
                              padding: "4px 9px",
                              borderRadius: "7px",
                              color: rankingMode === 'propio' ? "#7DD3FC" : "#FFFFFF",
                              fontWeight: "800",
                              fontSize: "11.5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              textShadow: "0 1px 2px rgba(0,0,0,0.6)"
                            }}>
                              <img 
                                src="/images/perfil.svg" 
                                alt="Visitas" 
                                style={{ 
                                  width: "13px", 
                                  height: "13px", 
                                  filter: rankingMode === 'propio' 
                                    ? "brightness(0) saturate(100%) invert(67%) sepia(85%) saturate(1800%) hue-rotate(170deg)" 
                                    : "brightness(0) invert(1)" 
                                }} 
                              />
                              <span>{countVisits} {countVisits === 1 ? 'visita' : 'visitas'}</span>
                            </div>
                            <Link 
                              href={`/?lat=${lugar.lat}&lng=${lugar.lng}&punto=${lugar.id}`}
                              style={{ 
                                fontSize: "11px", 
                                fontWeight: "800", 
                                color: "#38BDF8", 
                                textDecoration: "none",
                                textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px"
                              }}
                            >
                              Ir al Mapa ➔
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botón de Cargar Más Destinos con el SVG `more.svg` */}
                  {rankingData.length > visibleCount && (
                    <button
                      onClick={() => setVisibleCount(prev => prev + 5)}
                      style={{
                        width: "100%",
                        padding: "9px 14px",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px dashed rgba(255, 255, 255, 0.25)",
                        color: "#FFFFFF",
                        fontWeight: "800",
                        fontSize: "12.5px",
                        cursor: "pointer",
                        textAlign: "center",
                        marginTop: "2px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <img src="/images/more.svg" alt="Más destinos" style={{ width: "16px", height: "16px", filter: "brightness(0) invert(1)" }} />
                      <span>Cargar Más Destinos (+{Math.min(5, rankingData.length - visibleCount)})</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
