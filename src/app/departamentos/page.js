"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Navbar from '../../components/ui/Navbar';
import Icon from '../../components/ui/Icon';
import { supabase } from '../../lib/supabase';
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
  const [selectedDept, setSelectedDept] = useState("Todos");
  const [hoveredDept, setHoveredDept] = useState(null);
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSession, setUserSession] = useState(null);
  const [userVisitsCount, setUserVisitsCount] = useState(0);

  // Modo de Ranking: 'global' | 'propio' y Límite de Paginación Top 5
  const [rankingMode, setRankingMode] = useState('global');
  const [visibleCount, setVisibleCount] = useState(5);

  // Cargar sesión del usuario
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      if (session?.user) {
        cargarVisitasUsuario(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      if (session?.user) {
        cargarVisitasUsuario(session.user.id);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

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

  // Cargar datos de ranking según el departamento seleccionado y el modo (Global vs Propio)
  const cargarRanking = async (dept, mode = rankingMode) => {
    setLoading(true);
    try {
      const paramDept = (dept === "Todos" || !dept) ? null : dept;

      if (mode === 'propio') {
        if (!userSession?.user) {
          setRankingData([]);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.rpc('obtener_ranking_propio', {
          p_usuario_id: userSession.user.id,
          p_departamento: paramDept
        });
        if (error) throw error;
        setRankingData(data || []);
      } else {
        const { data, error } = await supabase.rpc('obtener_ranking_lugares', {
          p_departamento: paramDept
        });
        if (error) throw error;
        setRankingData(data || []);
      }
    } catch (err) {
      console.warn("[Atlan] Fallo en RPC ranking, buscando en tabla puntos:", err);
      try {
        let query = supabase
          .from('puntos')
          .select('*')
          .order('total_visitas', { ascending: false })
          .limit(20);

        if (dept && dept !== "Todos") {
          query = query.ilike('departamento', `%${dept}%`);
        }

        const { data: fallbackData } = await query;
        setRankingData(fallbackData || []);
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
        center: [-85.1, 12.9],
        zoom: 6.0,
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
    }
  }, [selectedDept, rankingMode, userSession]);

  // Inicializar Mapbox GL Map con GeoJSON de Departamentos
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12?optimize=true',
      center: [-85.15, 12.80], // Centro exacto para encuadrar Nicaragua fija
      zoom: 6.20,
      minZoom: 6.20,
      maxZoom: 6.20,
      pitch: 0,
      projection: 'mercator',
      maxBounds: [[-88.5, 9.8], [-81.5, 15.5]],
      scrollZoom: false,       // Desactivar zoom manual
      doubleClickZoom: false,  // Desactivar zoom por doble clic
      boxZoom: false,
      dragRotate: false,
      dragPan: false,          // Mapa 100% fijo sin desplazamientos
      touchZoomRotate: false,
      keyboard: false
    });

    mapRef.current = map;

    map.on('load', () => {
      // Ocultar carreteras y líneas para mapa pulcro
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

      // Cargar GeoJSON de Departamentos
      map.addSource('nicaragua-departments', {
        type: 'geojson',
        data: '/nicaragua-departments.json'
      });

      // Cargar GeoJSON de Centroides para Etiquetas Únicas
      map.addSource('nicaragua-dept-centroids', {
        type: 'geojson',
        data: '/nicaragua-department-centroids.json'
      });

      // Capa Relleno Interactivo de Departamentos (Colores y Resplandor Estilo Más de Nicaragua)
      map.addLayer({
        id: 'dept-fill',
        type: 'fill',
        source: 'nicaragua-departments',
        paint: {
          'fill-color': [
            'case',
            ['to-boolean', ['feature-state', 'selected']], '#7C3AED',
            ['to-boolean', ['feature-state', 'hover']], '#FFD700',
            '#146D9E'
          ],
          'fill-opacity': [
            'case',
            ['to-boolean', ['feature-state', 'selected']], 0.75,
            ['to-boolean', ['feature-state', 'hover']], 0.55,
            0.28
          ]
        }
      });

      // Capa Línea de Borde de Departamentos (Bordes Dorado / Blanco Neón)
      map.addLayer({
        id: 'dept-borders',
        type: 'line',
        source: 'nicaragua-departments',
        paint: {
          'line-color': [
            'case',
            ['to-boolean', ['feature-state', 'selected']], '#FFFFFF',
            ['to-boolean', ['feature-state', 'hover']], '#FFD700',
            '#FFD700'
          ],
          'line-width': [
            'case',
            ['to-boolean', ['feature-state', 'selected']], 3.5,
            ['to-boolean', ['feature-state', 'hover']], 2.5,
            1.5
          ],
          'line-opacity': 0.95
        }
      });

      // Capa de Nombres Únicos de Departamentos
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
            5, 10.5,
            8, 13.5,
            12, 16.5
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

      let hoveredId = null;
      let selectedId = null;

      // Eventos Hover
      map.on('mousemove', 'dept-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredId !== null && hoveredId !== undefined) {
            try {
              map.setFeatureState({ source: 'nicaragua-departments', id: hoveredId }, { hover: false });
            } catch (_) {}
          }
          const feat = e.features[0];
          hoveredId = feat.id !== undefined ? feat.id : (feat.properties && feat.properties.id);
          const deptName = feat.properties ? (feat.properties.nombre || feat.properties.name) : null;
          setHoveredDept(deptName);
          map.getCanvas().style.cursor = 'pointer';

          if (hoveredId !== null && hoveredId !== undefined) {
            try {
              map.setFeatureState({ source: 'nicaragua-departments', id: hoveredId }, { hover: true });
            } catch (_) {}
          }
        }
      });

      map.on('mouseleave', 'dept-fill', () => {
        if (hoveredId !== null && hoveredId !== undefined) {
          try {
            map.setFeatureState({ source: 'nicaragua-departments', id: hoveredId }, { hover: false });
          } catch (_) {}
        }
        hoveredId = null;
        setHoveredDept(null);
        map.getCanvas().style.cursor = '';
      });

      // Evento Clic en Departamento (Fijo sin zoom al hacer clic)
      map.on('click', 'dept-fill', (e) => {
        if (e.features.length > 0) {
          const feat = e.features[0];
          const name = feat.properties ? (feat.properties.nombre || feat.properties.name) : null;
          const newId = feat.id !== undefined ? feat.id : (feat.properties && feat.properties.id);

          if (selectedId !== null && selectedId !== undefined) {
            try {
              map.setFeatureState({ source: 'nicaragua-departments', id: selectedId }, { selected: false });
            } catch (_) {}
          }

          selectedId = newId;

          if (selectedId !== null && selectedId !== undefined) {
            try {
              map.setFeatureState({ source: 'nicaragua-departments', id: selectedId }, { selected: true });
            } catch (_) {}
          }

          if (name) {
            setSelectedDept(name);
          }
        }
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A192F", color: "#FFFFFF", fontFamily: "var(--font-outfit), sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "85px 20px 40px 20px" }}>
        
        {/* Encabezado Principal en Una Sola Línea */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h1 style={{ fontSize: "clamp(18px, 3.2vw, 32px)", fontWeight: "900", letterSpacing: "-0.01em", color: "#FFFFFF", margin: 0, whiteSpace: "nowrap" }}>
            Ranking de Lugares más visitados en <span style={{ color: "#FFD700" }}>Nicaragua</span>
          </h1>
        </div>

        {/* Banner Compacto de Logros del Usuario */}
        {userSession && (
          <div style={{ background: "linear-gradient(135deg, rgba(20, 109, 158, 0.25) 0%, rgba(10, 25, 47, 0.6) 100%)", border: "1.5px solid rgba(20, 109, 158, 0.4)", borderRadius: "14px", padding: "10px 18px", marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Icon name="shield" size={18} color="#FFD700" />
              <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#FFFFFF" }}>
                Registro Turista Atlan: <span style={{ color: "#FFD700" }}>{userVisitsCount}</span> {userVisitsCount === 1 ? 'visita verificada' : 'visitas verificadas'}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "800", background: "rgba(56, 189, 248, 0.18)", color: "#38BDF8", padding: "3px 10px", borderRadius: "10px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                {userVisitsCount >= 10 ? '👑 Leyenda' : userVisitsCount >= 5 ? '🧭 Mochilero' : '🧳 Turista'}
              </span>
            </div>
          </div>
        )}

        {/* Layout Principal: Mapa Interactivo Neón + Lista de Ranking */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", alignItems: "start" }}>

          {/* Columna Izquierda: Mapa de Departamentos Estilo Neón */}
          <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "2px solid rgba(255, 215, 0, 0.25)", borderRadius: "24px", padding: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", position: "sticky", top: "90px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", padding: "0 4px" }}>
              <span style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="mapPin" size={16} color="#FFD700" /> Mapa de Departamentos
              </span>
              {hoveredDept && (
                <span style={{ fontSize: "12px", fontWeight: "700", background: "#FFD700", color: "#1A1A2E", padding: "2px 8px", borderRadius: "8px" }}>
                  {hoveredDept}
                </span>
              )}
            </div>

            {/* Selector de Departamento en Dropdown */}
            <div style={{ marginBottom: "14px" }}>
              <select 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", background: "#0A192F", border: "1.5px solid rgba(20, 109, 158, 0.5)", borderRadius: "12px", color: "#FFFFFF", fontWeight: "700", fontSize: "13.5px", cursor: "pointer", outline: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
              >
                {DEPARTAMENTOS_LISTA.map(d => (
                  <option key={d} value={d}>{d === "Todos" ? "Todos los Departamentos" : d}</option>
                ))}
              </select>
            </div>

            {/* Contenedor del Mapa Mapbox */}
            <div ref={mapContainerRef} style={{ width: "100%", height: "420px", borderRadius: "18px", overflow: "hidden", position: "relative" }} />
          </div>

          {/* Columna Derecha: Ranking Top Lugares (Alineada con el mapa) */}
          <div style={{ display: "flex", flexDirection: "column", height: "510px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#FFFFFF" }}>
                {selectedDept === "Todos" 
                  ? (rankingMode === 'global' ? 'Lugares Más Visitados' : 'Mis Lugares Más Visitados')
                  : (rankingMode === 'global' ? `Más Visitados en ${selectedDept}` : `Mis Visitas en ${selectedDept}`)}
              </h2>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.08)", padding: "3px 8px", borderRadius: "10px" }}>
                {rankingData.length} Destinos
              </span>
            </div>

            {/* Selector de Modo con Iconos SVG: Ranking Global vs Ranking Propio */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <button
                onClick={() => setRankingMode('global')}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "14px",
                  border: rankingMode === 'global' ? "1.5px solid #FFD700" : "1px solid rgba(255,255,255,0.15)",
                  background: rankingMode === 'global'
                    ? "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(10, 25, 47, 0.8) 100%)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: rankingMode === 'global' ? "#FFD700" : "rgba(255,255,255,0.7)",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  boxShadow: rankingMode === 'global' ? "0 4px 14px rgba(255,215,0,0.2)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                <Icon name="globe" size={15} color={rankingMode === 'global' ? "#FFD700" : "rgba(255,255,255,0.7)"} />
                <span>Ranking Global</span>
              </button>

              <button
                onClick={() => setRankingMode('propio')}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "14px",
                  border: rankingMode === 'propio' ? "1.5px solid #38BDF8" : "1px solid rgba(255,255,255,0.15)",
                  background: rankingMode === 'propio'
                    ? "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(10, 25, 47, 0.8) 100%)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: rankingMode === 'propio' ? "#38BDF8" : "rgba(255,255,255,0.7)",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  boxShadow: rankingMode === 'propio' ? "0 4px 14px rgba(56,189,248,0.2)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                <Icon name="user" size={15} color={rankingMode === 'propio' ? "#38BDF8" : "rgba(255,255,255,0.7)"} />
                <span>Ranking Propio</span>
              </button>
            </div>

            {/* Contenedor desplazable con Scroll Interno + Paginación Top 5 */}
            <div className="dept-tabs-scroll" style={{ flex: 1, overflowY: "auto", paddingRight: "4px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ width: "40px", height: "40px", border: "4px solid rgba(255,215,0,0.2)", borderTopColor: "#FFD700", borderRadius: "50%", margin: "0 auto 16px auto", animation: "spin 1s linear infinite" }} />
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Cargando ranking de destinos...</p>
                </div>
              ) : rankingMode === 'propio' && !userSession ? (
                <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1.5px dashed rgba(56, 189, 248, 0.4)", borderRadius: "20px", padding: "32px 20px", textAlign: "center" }}>
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
                    <Icon name="lock" size={32} color="#38BDF8" />
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#FFFFFF" }}>Inicia sesión como turista</h3>
                  <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>
                    Inicia sesión para ver tu historial personalizado de los lugares que has visitado en Nicaragua.
                  </p>
                  <Link
                    href="/login"
                    style={{
                      display: "inline-block", padding: "10px 20px", background: "linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)",
                      borderRadius: "12px", color: "#FFFFFF", fontWeight: "800", textDecoration: "none", fontSize: "13.5px"
                    }}
                  >
                    Iniciar Sesión
                  </Link>
                </div>
              ) : rankingData.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: "20px", padding: "40px 20px", textAlign: "center" }}>
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
                    <Icon name="compass" size={32} color="#FFD700" />
                  </div>
                  <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#FFFFFF" }}>
                    {rankingMode === 'propio' ? 'Aún no has registrado visitas' : 'Aún no hay visitas registradas'}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                    {rankingMode === 'propio' 
                      ? `Visita un destino en ${selectedDept === "Todos" ? "Nicaragua" : selectedDept} y márcalo en el mapa para sumarlo a tu ranking propio.`
                      : `Sé el primer turista en explorar y marcar visitas en ${selectedDept === "Todos" ? "Nicaragua" : selectedDept}.`}
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {rankingData.slice(0, visibleCount).map((lugar, idx) => {
                      const pos = idx + 1;
                      const medalColor = pos === 1 ? '#FFD700' : pos === 2 ? '#C0C0C0' : pos === 3 ? '#CD7F32' : 'rgba(255,255,255,0.6)';
                      const countVisits = rankingMode === 'propio' ? (lugar.mis_visitas || 1) : (lugar.total_visitas || 0);

                      return (
                        <div 
                          key={lugar.id}
                          style={{ 
                            background: pos === 1 
                              ? "linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)"
                              : "rgba(15, 23, 42, 0.7)", 
                            border: pos === 1 ? "1.5px solid rgba(255, 215, 0, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "16px",
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            boxShadow: pos === 1 ? "0 8px 24px rgba(255,215,0,0.15)" : "0 4px 12px rgba(0,0,0,0.2)",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {/* Medalla SVG o Número de Posición */}
                            <div style={{ minWidth: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "900", color: medalColor }}>
                              {pos <= 3 ? <Icon name="sparkles" size={pos === 1 ? 18 : 16} color={medalColor} /> : `#${pos}`}
                            </div>

                            {/* Info del Lugar */}
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
                                <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: "800", color: "#FFFFFF" }}>
                                  {lugar.nombre}
                                </h3>
                                <span style={{ fontSize: "9.5px", fontWeight: "800", textTransform: "uppercase", background: "rgba(56, 189, 248, 0.15)", color: "#38BDF8", padding: "2px 5px", borderRadius: "5px" }}>
                                  {lugar.categoria}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: "11.5px", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><Icon name="mapPin" size={12} color="#FFD700" /> {lugar.departamento || 'Nicaragua'}</span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><Icon name="starFilled" size={12} color="#FFD700" /> {lugar.negocio_rating || '5.0'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Contador de Visitas y Acción */}
                          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                            <div style={{
                              background: rankingMode === 'propio' ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 215, 0, 0.12)",
                              border: rankingMode === 'propio' ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(255, 215, 0, 0.3)",
                              padding: "3px 8px",
                              borderRadius: "8px",
                              color: rankingMode === 'propio' ? "#38BDF8" : "#FFD700",
                              fontWeight: "800",
                              fontSize: "11.5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              {rankingMode === 'propio' ? (
                                <>
                                  <Icon name="checkCircle" size={12} color="#38BDF8" />
                                  <span>{countVisits} {countVisits === 1 ? 'visita' : 'visitas'}</span>
                                </>
                              ) : (
                                <>
                                  <Icon name="users" size={12} color="#FFD700" />
                                  <span>{countVisits} visitas</span>
                                </>
                              )}
                            </div>
                            <Link 
                              href={`/?lat=${lugar.lat}&lng=${lugar.lng}&punto=${lugar.id}`}
                              style={{ fontSize: "11px", fontWeight: "800", color: "#38BDF8", textDecoration: "none" }}
                            >
                              Ir al Mapa ➔
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {rankingData.length > visibleCount && (
                    <button
                      onClick={() => setVisibleCount(prev => prev + 5)}
                      style={{
                        width: "100%",
                        padding: "11px 16px",
                        borderRadius: "14px",
                        background: "rgba(255, 215, 0, 0.12)",
                        border: "1.5px dashed rgba(255, 215, 0, 0.4)",
                        color: "#FFD700",
                        fontWeight: "800",
                        fontSize: "13px",
                        cursor: "pointer",
                        textAlign: "center",
                        marginTop: "4px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      ✨ Cargar Más Destinos (+{Math.min(5, rankingData.length - visibleCount)})
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
