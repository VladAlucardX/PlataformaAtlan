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

  // Modo de Ranking: 'global' | 'propio'
  const [rankingMode, setRankingMode] = useState('global');

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
      center: [-85.1, 12.9], // Centro exacto para encuadrar Nicaragua
      zoom: 6.0,
      minZoom: 5.8, // Límite de zoom alejado idéntico a la imagen por defecto
      maxZoom: 14,
      pitch: 0,
      projection: 'mercator',
      maxBounds: [[-88.5, 10.0], [-81.5, 15.5]],
      scrollZoom: false,       // Desactivar zoom manual con rueda de mouse
      doubleClickZoom: false,  // Desactivar zoom manual con doble clic
      boxZoom: false,          // Desactivar zoom manual con caja
      dragRotate: false,       // Desactivar rotación
      touchZoomRotate: false,  // Desactivar pellizco zoom en pantallas táctiles
      keyboard: false          // Desactivar controles de teclado
    });

    mapRef.current = map;

    map.on('load', () => {
      // Ocultar carreteras y líneas para dejar un mapa 100% liso y limpio
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

      // Capa Relleno Interactivo de Departamentos
      map.addLayer({
        id: 'dept-fill',
        type: 'fill',
        source: 'nicaragua-departments',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#FFD700',
            '#146D9E'
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.55,
            0.22
          ]
        }
      });

      // Capa Línea de Borde de Departamentos
      map.addLayer({
        id: 'dept-borders',
        type: 'line',
        source: 'nicaragua-departments',
        paint: {
          'line-color': '#146D9E',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      // Capa de Nombres Únicos de los 17 Departamentos (Siempre Visibles en Blanco con Delineado Negro)
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
          'text-ignore-placement': true,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#000000',
          'text-halo-width': 1.8,
          'text-halo-blur': 0.5
        }
      });

      let hoveredId = null;

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

      // Evento Clic en Departamento
      map.on('click', 'dept-fill', (e) => {
        if (e.features.length > 0) {
          const name = e.features[0].properties.nombre || e.features[0].properties.name;
          if (name) {
            setSelectedDept(name);
            
            // Encuadrar departamento en pantalla
            const bounds = new mapboxgl.LngLatBounds();
            const geometry = e.features[0].geometry;
            if (geometry.type === 'Polygon') {
              geometry.coordinates[0].forEach(coord => bounds.extend(coord));
            } else if (geometry.type === 'MultiPolygon') {
              geometry.coordinates.forEach(poly => {
                poly[0].forEach(coord => bounds.extend(coord));
              });
            }
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { padding: 80, duration: 1200, essential: true });
            }
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

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "100px 20px 60px 20px" }}>
        
        {/* Encabezado Principal */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "clamp(24px, 4.5vw, 42px)", fontWeight: "900", letterSpacing: "-0.02em", color: "#FFFFFF", margin: 0, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            Ranking de Lugares visitados en los distintos Departamentos de <span style={{ color: "#FFD700" }}>Nicaragua</span>
          </h1>
        </div>

        {/* Banner de Logros y Gamificación del Usuario */}
        {userSession && (
          <div style={{ background: "linear-gradient(135deg, rgba(20, 109, 158, 0.25) 0%, rgba(10, 25, 47, 0.6) 100%)", border: "1.5px solid rgba(20, 109, 158, 0.4)", borderRadius: "20px", padding: "20px 24px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #FFE033 0%, #FFD700 100%)", display: "flex", alignItems: "center", fontStyle: "normal", justifyContent: "center", fontSize: "24px", color: "#1A1A2E", boxShadow: "0 4px 12px rgba(255,215,0,0.4)" }}>
                🎖️
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#FFFFFF" }}>
                  Tu Registro de Turista Atlan
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                  {userVisitsCount > 0 
                    ? `Has completado ${userVisitsCount} visita(s) verificada(s) por GPS.` 
                    : 'Navega a un destino (> 1 km) para registrar tu primera visita verificada.'}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "8px 16px", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: "700" }}>Visitas GPS</span>
                <span style={{ fontSize: "18px", fontWeight: "900", color: "#FFD700" }}>{userVisitsCount}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "8px 16px", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: "700" }}>Rango</span>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#38BDF8" }}>
                  {userVisitsCount >= 10 ? '👑 Leyenda' : userVisitsCount >= 5 ? '🧭 Mochilero' : '🧳 Turista'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Layout Principal: Mapa Interactivo + Lista de Ranking */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", alignItems: "start" }}>

          {/* Columna Izquierda: Mapa de Departamentos Mapbox */}
          <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "2px solid rgba(255, 255, 255, 0.12)", borderRadius: "24px", padding: "16px", backdropFilter: "blur(16px)", position: "sticky", top: "100px", boxShadow: "0 16px 36px rgba(0,0,0,0.4)" }}>
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

            {/* Selector de Departamento en Dropdown (Ubicado debajo de Mapa de Departamentos) */}
            <div style={{ marginBottom: "14px" }}>
              <select 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", background: "#0A192F", border: "1.5px solid rgba(20, 109, 158, 0.5)", borderRadius: "12px", color: "#FFFFFF", fontWeight: "700", fontSize: "13.5px", cursor: "pointer", outline: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
              >
                {DEPARTAMENTOS_LISTA.map(d => (
                  <option key={d} value={d}>{d === "Todos" ? "🗺️ Todos los Departamentos" : `📍 ${d}`}</option>
                ))}
              </select>
            </div>

            {/* Contenedor del Mapa Mapbox */}
            <div ref={mapContainerRef} style={{ width: "100%", height: "420px", borderRadius: "18px", overflow: "hidden", position: "relative" }} />
          </div>

          {/* Columna Derecha: Ranking Top Lugares */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: "#FFFFFF" }}>
                {selectedDept === "Todos" 
                  ? (rankingMode === 'global' ? '🌟 Lugares Más Visitados en Nicaragua' : '👤 Mis Lugares Más Visitados')
                  : (rankingMode === 'global' ? `📍 Más Visitados en ${selectedDept}` : `👤 Mis Visitas en ${selectedDept}`)}
              </h2>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "10px" }}>
                {rankingData.length} Destinos
              </span>
            </div>

            {/* Selector de Modo: Ranking Global vs Ranking Propio */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
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
                  gap: "6px",
                  boxShadow: rankingMode === 'global' ? "0 4px 14px rgba(255,215,0,0.2)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                🌐 Ranking Global
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
                  gap: "6px",
                  boxShadow: rankingMode === 'propio' ? "0 4px 14px rgba(56,189,248,0.2)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                👤 Ranking Propio
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ width: "40px", height: "40px", border: "4px solid rgba(255,215,0,0.2)", borderTopColor: "#FFD700", borderRadius: "50%", margin: "0 auto 16px auto", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Cargando ranking de destinos...</p>
              </div>
            ) : rankingMode === 'propio' && !userSession ? (
              <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1.5px dashed rgba(56, 189, 248, 0.4)", borderRadius: "20px", padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔒</div>
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
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏕️</div>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {rankingData.map((lugar, idx) => {
                  const pos = idx + 1;
                  const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`;
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
                        borderRadius: "18px",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        boxShadow: pos === 1 ? "0 8px 24px rgba(255,215,0,0.15)" : "0 4px 12px rgba(0,0,0,0.2)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {/* Medalla o Posición */}
                        <div style={{ minWidth: "38px", height: "38px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: pos <= 3 ? "20px" : "14px", fontWeight: "900", color: medalColor }}>
                          {medal}
                        </div>

                        {/* Info del Lugar */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#FFFFFF" }}>
                              {lugar.nombre}
                            </h3>
                            <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", background: "rgba(56, 189, 248, 0.15)", color: "#38BDF8", padding: "2px 6px", borderRadius: "6px" }}>
                              {lugar.categoria}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "12px" }}>
                            <span>📍 {lugar.departamento || 'Nicaragua'}</span>
                            <span>⭐ {lugar.negocio_rating || '5.0'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Contador de Visitas y Acción */}
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                        <div style={{
                          background: rankingMode === 'propio' ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 215, 0, 0.12)",
                          border: rankingMode === 'propio' ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(255, 215, 0, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "10px",
                          color: rankingMode === 'propio' ? "#38BDF8" : "#FFD700",
                          fontWeight: "800",
                          fontSize: "12px"
                        }}>
                          {rankingMode === 'propio' ? `🎯 ${countVisits} ${countVisits === 1 ? 'visita' : 'visitas'}` : `👁️ ${countVisits} visitas`}
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
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
