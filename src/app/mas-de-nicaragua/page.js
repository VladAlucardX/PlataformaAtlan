"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";
import DepartmentTabs from "@/components/ui/DepartmentTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { DEPARTAMENTOS_DATA } from "@/data/departamentos-data";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Mapeo de nombres en GeoJSON a slugs en la base de datos estática
const NOMBRES_A_SLUGS = {
  "Managua": "managua",
  "León": "leon",
  "Chinandega": "chinandega",
  "Granada": "granada",
  "Masaya": "masaya",
  "Carazo": "carazo",
  "Rivas": "rivas",
  "Matagalpa": "matagalpa",
  "Jinotega": "jinotega",
  "Estelí": "esteli",
  "Madriz": "madriz",
  "Nueva Segovia": "nueva-segovia",
  "Boaco": "boaco",
  "Chontales": "chontales",
  "Río San Juan": "rio-san-juan",
  "RACCN (Caribe Norte)": "raccn",
  "RACCS (Caribe Sur)": "raccs"
};

// Paleta de Colores Única y Distintiva para cada Departamento de Nicaragua
const COLOR_MATCH_EXPR = [
  "match",
  ["coalesce", ["get", "nombre"], ["get", "name_es"], ["get", "name"], ""],
  "Managua", "#FF5722",
  "León", "#E91E63",
  "Chinandega", "#FF9800",
  "Granada", "#3F51B5",
  "Masaya", "#9C27B0",
  "Carazo", "#00BCD4",
  "Rivas", "#009688",
  "Matagalpa", "#8D6E63",
  "Jinotega", "#2E7D32",
  "Estelí", "#F59E0B",
  "Madriz", "#D97706",
  "Nueva Segovia", "#8BC34A",
  "Boaco", "#673AB7",
  "Chontales", "#10B981",
  "Río San Juan", "#0284C7",
  "Rio San Juan", "#0284C7",
  "RACCN (Caribe Norte)", "#E11D48",
  "Atlántico Norte", "#E11D48",
  "RACCS (Caribe Sur)", "#EC4899",
  "Atlántico Sur", "#EC4899",
  "#FFD700" // fallback
];

// Estilos de Mapa Disponibles para Selección en Vivo
const MAP_STYLES = [
  { id: "outdoors", label: "Relieve Outdoors", uri: "mapbox://styles/mapbox/outdoors-v12", icon: "mountain" },
  { id: "dark", label: "Oscuro Premium", uri: "mapbox://styles/mapbox/dark-v11", icon: "moon" }
];

export default function MasDeNicaraguaPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const selectedFeatureIdRef = useRef(null);

  const [hoveredDept, setHoveredDept] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("Todos");
  const [currentStyleUri, setCurrentStyleUri] = useState("mapbox://styles/mapbox/outdoors-v12");

  // Estado Modal Nivel 1: Tarjeta Preview
  const [selectedDeptForPreview, setSelectedDeptForPreview] = useState(null);

  // Estado Modal Nivel 2: Modal Completo con Pestañas
  const [selectedDeptForDetails, setSelectedDeptForDetails] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState("historia");

  const deptsList = Object.values(DEPARTAMENTOS_DATA);

  // Función para cerrar preview y desmarcar departamento en el mapa
  const handleClosePreview = () => {
    setSelectedDeptForPreview(null);
    if (selectedFeatureIdRef.current !== null && mapRef.current) {
      try {
        mapRef.current.setFeatureState(
          { source: "nicaragua-departments", id: selectedFeatureIdRef.current },
          { selected: false }
        );
      } catch (_) {}
      selectedFeatureIdRef.current = null;
    }
  };

  // Función para cambiar estilo del mapa en vivo
  const handleChangeMapStyle = (uri) => {
    setCurrentStyleUri(uri);
    if (mapRef.current) {
      mapRef.current.setStyle(uri);
    }
  };

  // Carga y configuración de fuentes/capas GeoJSON en el estilo de mapa
  const loadMapLayers = (map) => {
    if (!map) return;

    try {
      const styleLayers = map.getStyle().layers || [];
      styleLayers.forEach((layer) => {
        if (
          layer.id.startsWith("road") ||
          layer.id.startsWith("bridge") ||
          layer.id.startsWith("tunnel") ||
          layer.id.includes("admin") ||
          layer.id.includes("boundary") ||
          (layer.type === "symbol" && layer.id !== "dept-labels")
        ) {
          map.setLayoutProperty(layer.id, "visibility", "none");
        }
      });
    } catch (_) {}

    if (!map.getSource("nicaragua-departments")) {
      map.addSource("nicaragua-departments", {
        type: "geojson",
        data: "/nicaragua-departments.json"
      });
    }

    if (!map.getSource("nicaragua-dept-centroids")) {
      map.addSource("nicaragua-dept-centroids", {
        type: "geojson",
        data: "/nicaragua-department-centroids.json"
      });
    }

    // Capa de Aura/Resplandor Neón para el Departamento Seleccionado
    if (!map.getLayer("dept-glow")) {
      map.addLayer({
        id: "dept-glow",
        type: "line",
        source: "nicaragua-departments",
        paint: {
          "line-color": COLOR_MATCH_EXPR,
          "line-width": [
            "case",
            ["to-boolean", ["feature-state", "selected"]], 14,
            0
          ],
          "line-blur": 8,
          "line-opacity": [
            "case",
            ["to-boolean", ["feature-state", "selected"]], 0.85,
            0
          ],
          "line-width-transition": { duration: 350, delay: 0 },
          "line-opacity-transition": { duration: 350, delay: 0 }
        }
      });
    }

    // Capa de Relleno Interactivo con Transición Suave de Color
    if (!map.getLayer("dept-fill")) {
      map.addLayer({
        id: "dept-fill",
        type: "fill",
        source: "nicaragua-departments",
        paint: {
          "fill-color": [
            "case",
            ["to-boolean", ["feature-state", "selected"]], COLOR_MATCH_EXPR,
            ["to-boolean", ["feature-state", "hover"]], COLOR_MATCH_EXPR,
            "#146D9E"
          ],
          "fill-color-transition": { duration: 300, delay: 0 },
          "fill-opacity": [
            "case",
            ["to-boolean", ["feature-state", "selected"]], 0.88,
            ["to-boolean", ["feature-state", "hover"]], 0.68,
            0.28
          ],
          "fill-opacity-transition": { duration: 300, delay: 0 }
        }
      });
    }

    // Capa de Borde Adaptativo con Halo Blanco en Selección
    if (!map.getLayer("dept-borders")) {
      map.addLayer({
        id: "dept-borders",
        type: "line",
        source: "nicaragua-departments",
        paint: {
          "line-color": [
            "case",
            ["to-boolean", ["feature-state", "selected"]], "#FFFFFF",
            ["to-boolean", ["feature-state", "hover"]], COLOR_MATCH_EXPR,
            "#FFD700"
          ],
          "line-color-transition": { duration: 300, delay: 0 },
          "line-width": [
            "case",
            ["to-boolean", ["feature-state", "selected"]], 4.0,
            ["to-boolean", ["feature-state", "hover"]], 2.8,
            1.5
          ],
          "line-width-transition": { duration: 300, delay: 0 },
          "line-opacity": 0.95
        }
      });
    }

    if (!map.getLayer("dept-labels")) {
      map.addLayer({
        id: "dept-labels",
        type: "symbol",
        source: "nicaragua-dept-centroids",
        layout: {
          "text-field": ["get", "nombre"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5, 10.5,
            8, 14,
            12, 17
          ],
          "text-allow-overlap": true,
          "text-anchor": "center"
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": "#0A192F",
          "text-halo-width": 2
        }
      });
    }
  };

  // Inicialización del Mapa Mapbox GL 100% Estático
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: currentStyleUri,
      center: [-85.15, 12.80],
      zoom: 6.60,
      minZoom: 6.60,
      maxZoom: 6.60,
      pitch: 0,
      projection: "mercator",
      maxBounds: [[-88.5, 9.8], [-81.5, 15.5]],
      scrollZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      dragRotate: false,
      dragPan: false,
      touchZoomRotate: false,
      touchPitch: false
    });

    mapRef.current = map;

    map.on("style.load", () => {
      loadMapLayers(map);
    });

    map.on("load", () => {
      let hoveredId = null;

      // Eventos Hover
      map.on("mousemove", "dept-fill", (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredId !== null && hoveredId !== undefined) {
            try {
              map.setFeatureState({ source: "nicaragua-departments", id: hoveredId }, { hover: false });
            } catch (_) {}
          }

          const feat = e.features[0];
          hoveredId = feat.id !== undefined ? feat.id : (feat.properties && feat.properties.id);
          const deptName = feat.properties ? (feat.properties.nombre || feat.properties.name) : null;
          setHoveredDept(deptName);
          map.getCanvas().style.cursor = "pointer";

          if (hoveredId !== null && hoveredId !== undefined) {
            try {
              map.setFeatureState({ source: "nicaragua-departments", id: hoveredId }, { hover: true });
            } catch (_) {}
          }
        }
      });

      map.on("mouseleave", "dept-fill", () => {
        if (hoveredId !== null && hoveredId !== undefined) {
          try {
            map.setFeatureState({ source: "nicaragua-departments", id: hoveredId }, { hover: false });
          } catch (_) {}
        }
        hoveredId = null;
        setHoveredDept(null);
        map.getCanvas().style.cursor = "";
      });

      // Evento Clic en Departamento -> Animación de Selección Neón (Mapa Estático)
      map.on("click", "dept-fill", (e) => {
        if (e.features && e.features.length > 0) {
          const feat = e.features[0];
          const featId = feat.id !== undefined ? feat.id : (feat.properties && feat.properties.id);
          const name = feat.properties ? (feat.properties.nombre || feat.properties.name) : null;
          const slug = NOMBRES_A_SLUGS[name];

          // Desmarcar el departamento previamente seleccionado
          if (selectedFeatureIdRef.current !== null && selectedFeatureIdRef.current !== undefined) {
            try {
              map.setFeatureState(
                { source: "nicaragua-departments", id: selectedFeatureIdRef.current },
                { selected: false }
              );
            } catch (_) {}
          }

          // Marcar el departamento actual como seleccionado (ilumina aura neón y silueta)
          if (featId !== null && featId !== undefined) {
            selectedFeatureIdRef.current = featId;
            try {
              map.setFeatureState(
                { source: "nicaragua-departments", id: featId },
                { selected: true }
              );
            } catch (_) {}
          }

          if (slug && DEPARTAMENTOS_DATA[slug]) {
            const dept = DEPARTAMENTOS_DATA[slug];
            setSelectedDeptForPreview(dept);
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
      <Navbar activePage="mas-de-nicaragua" />

      {/* Hero Header */}
      <div style={{
        background: "linear-gradient(180deg, rgba(20, 109, 158, 0.25) 0%, rgba(10, 25, 47, 1) 100%)",
        padding: "85px 20px 8px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
      }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{
            fontSize: "clamp(18px, 3.2vw, 34px)",
            fontWeight: "900",
            color: "#FFFFFF",
            margin: "0",
            lineHeight: 1.2,
            whiteSpace: "nowrap"
          }}>
            Enciclopedia Viva de sus <span style={{ color: "#FFD700" }}>17 departamentos</span>
          </h1>
        </div>
      </div>

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "15px 20px 60px" }}>

        {/* Mapa Protagonista Principal */}
        <section>
          <div style={{
            background: "rgba(15, 23, 42, 0.85)",
            border: "2px solid rgba(255, 215, 0, 0.25)",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            position: "relative"
          }}>
            {/* Header de Controles del Mapa (Fijo sin desplazamientos) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon name="map" size={22} color="#FFD700" />
                <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "900", color: "#FFFFFF" }}>
                  Selecciona un Departamento
                </h2>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                {/* Selector en Vivo de Estilo de Mapa */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.3)", padding: "3px 6px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {MAP_STYLES.map((st) => {
                    const isSelected = currentStyleUri === st.uri;
                    return (
                      <button
                        key={st.id}
                        onClick={() => handleChangeMapStyle(st.uri)}
                        title={`Cambiar a ${st.label}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "5px 10px",
                          borderRadius: "10px",
                          border: isSelected ? "1.5px solid #FFD700" : "1px solid transparent",
                          background: isSelected ? "rgba(255, 215, 0, 0.22)" : "transparent",
                          color: isSelected ? "#FFD700" : "rgba(255,255,255,0.7)",
                          fontWeight: "800",
                          fontSize: "11.5px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <Icon name={st.icon} size={13} color={isSelected ? "#FFD700" : "rgba(255,255,255,0.7)"} />
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Filtros Rápidos de Regiones para Enfoque en el Mapa */}
                <div style={{ display: "flex", gap: "6px" }}>
                  {[
                    { name: "Todos", center: [-85.1, 12.8], zoom: 6.1 },
                    { name: "Pacífico", icon: "waves", center: [-86.3, 12.1], zoom: 6.1 },
                    { name: "Central", icon: "mountain", center: [-85.5, 12.9], zoom: 6.1 },
                    { name: "Caribe", icon: "island", center: [-84.0, 13.5], zoom: 6.1 }
                  ].map((reg) => {
                    const isActive = selectedRegion === reg.name;
                    return (
                      <button
                        key={reg.name}
                        onClick={() => {
                          setSelectedRegion(reg.name);
                          if (mapRef.current) {
                            mapRef.current.flyTo({ center: reg.center, zoom: reg.zoom, duration: 800 });
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 14px",
                          borderRadius: "12px",
                          border: isActive ? "1.5px solid #FFD700" : "1px solid rgba(255,255,255,0.15)",
                          background: isActive ? "rgba(255, 215, 0, 0.22)" : "rgba(255,255,255,0.05)",
                          color: isActive ? "#FFD700" : "rgba(255,255,255,0.75)",
                          fontWeight: "800",
                          fontSize: "12.5px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {reg.icon && <Icon name={reg.icon} size={14} color={isActive ? "#FFD700" : "rgba(255,255,255,0.75)"} />}
                        <span>{reg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contenedor del Mapa Protagonista */}
            <div style={{ position: "relative", width: "100%", height: "620px", borderRadius: "20px", overflow: "hidden" }}>
              <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

              {/* Insignia Flotante Estática del Departamento Bajo el Cursor (sin mover la cabecera) */}
              {hoveredDept && (
                <div style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  background: "rgba(10, 25, 47, 0.9)",
                  border: "1.5px solid #FFD700",
                  color: "#FFD700",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontWeight: "900",
                  fontSize: "13px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                  zIndex: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backdropFilter: "blur(8px)"
                }}>
                  <Icon name="mapPin" size={14} color="#FFD700" />
                  <span>{hoveredDept}</span>
                </div>
              )}

              {/* MODAL NIVEL 1: Tarjeta Preview Flotante sobre el Mapa */}
              {selectedDeptForPreview && (
                <div style={{
                  position: "absolute",
                  bottom: "24px",
                  right: "24px",
                  maxWidth: "360px",
                  width: "calc(100% - 48px)",
                  background: "rgba(10, 25, 47, 0.95)",
                  backdropFilter: "blur(18px)",
                  border: "2px solid #FFD700",
                  borderRadius: "22px",
                  padding: "20px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
                  zIndex: 20,
                  animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}>
                  {/* Botón Cerrar */}
                  <button
                    onClick={handleClosePreview}
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      background: "rgba(255,255,255,0.12)",
                      border: "none",
                      color: "#FFFFFF",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "900",
                      fontSize: "14px"
                    }}
                  >
                    ✕
                  </button>

                  {/* Header de la Tarjeta Preview con SVG Icon de Región */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: selectedDeptForPreview.region === "Pacífico" ? "rgba(56, 189, 248, 0.2)" : selectedDeptForPreview.region === "Central" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                      border: `1px solid ${selectedDeptForPreview.region === "Pacífico" ? "#38BDF8" : selectedDeptForPreview.region === "Central" ? "#10B981" : "#F59E0B"}`,
                      color: selectedDeptForPreview.region === "Pacífico" ? "#38BDF8" : selectedDeptForPreview.region === "Central" ? "#10B981" : "#F59E0B",
                      padding: "3px 10px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: "800",
                      textTransform: "uppercase"
                    }}>
                      <Icon
                        name={selectedDeptForPreview.region === "Pacífico" ? "waves" : selectedDeptForPreview.region === "Central" ? "mountain" : "island"}
                        size={13}
                        color={selectedDeptForPreview.region === "Pacífico" ? "#38BDF8" : selectedDeptForPreview.region === "Central" ? "#10B981" : "#F59E0B"}
                      />
                      <span>Región {selectedDeptForPreview.region}</span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
                      <Icon name="mapPin" size={13} color="rgba(255,255,255,0.7)" />
                      <span>{selectedDeptForPreview.cabecera}</span>
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 2px", fontSize: "22px", fontWeight: "900", color: "#FFFFFF" }}>
                    {selectedDeptForPreview.nombre}
                  </h3>
                  <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: "700", color: "#FFD700" }}>
                    "{selectedDeptForPreview.apodo}"
                  </p>

                  {/* Metadatos Rápidos */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "12px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "700" }}>Extensión</span>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF" }}>{selectedDeptForPreview.extension}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "700" }}>Población</span>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF" }}>{selectedDeptForPreview.poblacion}</span>
                    </div>
                  </div>

                  {/* Botón para Abrir Modal Completo */}
                  <button
                    onClick={() => {
                      setSelectedDeptForDetails(selectedDeptForPreview);
                      setModalActiveTab("historia");
                    }}
                    style={{
                      width: "100%",
                      padding: "13px 18px",
                      background: "linear-gradient(135deg, #FFE033 0%, #FFD700 100%)",
                      color: "#1A1A2E",
                      fontWeight: "900",
                      fontSize: "14px",
                      borderRadius: "14px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 6px 20px rgba(255, 215, 0, 0.4)",
                      transition: "transform 0.2s"
                    }}
                  >
                    <span>Ver Historia y Pestañas ➔</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* MODAL NIVEL 2: Modal Completo con Pestañas sobre el Mapa */}
      {selectedDeptForDetails && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundColor: "rgba(10, 25, 47, 0.92)",
          backdropFilter: "blur(14px)",
          overflowY: "auto",
          padding: "30px 16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start"
        }}>
          <div style={{
            maxWidth: "1200px",
            width: "100%",
            background: "rgba(15, 23, 42, 0.96)",
            border: "2px solid rgba(255, 215, 0, 0.35)",
            borderRadius: "28px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
            overflow: "hidden",
            margin: "20px auto"
          }}>
            {/* Header del Modal Completo */}
            <div style={{
              background: "linear-gradient(180deg, rgba(20, 109, 158, 0.4) 0%, rgba(15, 23, 42, 1) 100%)",
              padding: "30px 24px 20px",
              position: "relative",
              borderBottom: "1px solid rgba(255,255,255,0.1)"
            }}>
              {/* Botón de Cierre */}
              <button
                onClick={() => setSelectedDeptForDetails(null)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: "14px",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>Cerrar</span>
                <span>✕</span>
              </button>

              {/* Titular e Info */}
              <div style={{ maxWidth: "1000px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: selectedDeptForDetails.region === "Pacífico" ? "rgba(56, 189, 248, 0.25)" : selectedDeptForDetails.region === "Central" ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)",
                    border: `1px solid ${selectedDeptForDetails.region === "Pacífico" ? "#38BDF8" : selectedDeptForDetails.region === "Central" ? "#10B981" : "#F59E0B"}`,
                    color: selectedDeptForDetails.region === "Pacífico" ? "#38BDF8" : selectedDeptForDetails.region === "Central" ? "#10B981" : "#F59E0B",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "800",
                    textTransform: "uppercase"
                  }}>
                    <Icon
                      name={selectedDeptForDetails.region === "Pacífico" ? "waves" : selectedDeptForDetails.region === "Central" ? "mountain" : "island"}
                      size={14}
                      color={selectedDeptForDetails.region === "Pacífico" ? "#38BDF8" : selectedDeptForDetails.region === "Central" ? "#10B981" : "#F59E0B"}
                    />
                    <span>Región {selectedDeptForDetails.region}</span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>
                    <Icon name="mapPin" size={14} color="rgba(255,255,255,0.8)" />
                    <span>Cabecera: <strong>{selectedDeptForDetails.cabecera}</strong></span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#FFD700", fontWeight: "700" }}>
                    <Icon name="clock" size={14} color="#FFD700" />
                    <span>Fundación / Hito: <strong>{selectedDeptForDetails.fundacion}</strong></span>
                  </span>
                </div>

                <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: "900", margin: "0 0 2px", color: "#FFFFFF" }}>
                  {selectedDeptForDetails.nombre}
                </h2>
                <p style={{ fontSize: "15px", fontWeight: "700", color: "#FFD700", margin: 0 }}>
                  "{selectedDeptForDetails.apodo}"
                </p>
              </div>
            </div>

            {/* Selector de Pestañas */}
            <DepartmentTabs activeTab={modalActiveTab} onSelectTab={setModalActiveTab} />

            {/* Cuerpo del Modal con Contenido de la Pestaña Seleccionada */}
            <div style={{ padding: "30px 24px" }}>

              {/* 1. HISTORIA */}
              {modalActiveTab === "historia" && (
                <div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "24px", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#FFD700", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon name="book" size={22} color="#FFD700" />
                      <span>Resumen Histórico de {selectedDeptForDetails.nombre}</span>
                    </h3>
                    <p style={{ fontSize: "15px", lineHeight: "1.7", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                      {selectedDeptForDetails.historia.resumen}
                    </p>
                  </div>

                  {selectedDeptForDetails.historia.hitos && selectedDeptForDetails.historia.hitos.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon name="clock" size={20} color="#FFD700" />
                        <span>Hitos Históricos Fundamentales</span>
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                        {selectedDeptForDetails.historia.hitos.map((hito, idx) => (
                          <div key={idx} style={{
                            background: "linear-gradient(135deg, rgba(20, 109, 158, 0.25) 0%, rgba(15, 23, 42, 0.8) 100%)",
                            border: "1px solid rgba(20, 109, 158, 0.35)",
                            borderRadius: "16px",
                            padding: "16px"
                          }}>
                            <span style={{ fontSize: "20px", fontWeight: "900", color: "#FFD700", display: "block", marginBottom: "4px" }}>
                              {hito.año}
                            </span>
                            <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                              {hito.evento}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. ECONOMÍA */}
              {modalActiveTab === "economia" && (
                <div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "24px", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#38BDF8", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon name="trendingUp" size={22} color="#38BDF8" />
                      <span>Dinámica Económica y Productiva</span>
                    </h3>
                    <p style={{ fontSize: "15px", lineHeight: "1.7", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                      {selectedDeptForDetails.economia.resumen}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                    {selectedDeptForDetails.economia.sectores.map((sec, idx) => (
                      <div key={idx} style={{
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid rgba(56, 189, 248, 0.25)",
                        borderRadius: "18px",
                        padding: "20px"
                      }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8", marginBottom: "12px" }}>
                          <Icon name="trendingUp" size={20} color="#38BDF8" />
                        </div>
                        <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 6px" }}>
                          {sec.titulo}
                        </h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                          {sec.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. TURISMO */}
              {modalActiveTab === "turismo" && (
                <div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "24px", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#10B981", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon name="compass" size={22} color="#10B981" />
                      <span>Oferta Turística de {selectedDeptForDetails.nombre}</span>
                    </h3>
                    <p style={{ fontSize: "15px", lineHeight: "1.7", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                      {selectedDeptForDetails.turismo.resumen}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    {selectedDeptForDetails.turismo.atractivos.map((atr, idx) => (
                      <div key={idx} style={{
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        borderRadius: "18px",
                        padding: "20px"
                      }}>
                        <h4 style={{ fontSize: "17px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon name="mapPin" size={16} color="#10B981" />
                          <span>{atr.nombre}</span>
                        </h4>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                          {atr.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. PASATIEMPOS Y CULTURA */}
              {modalActiveTab === "pasatiempos" && (
                <div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "24px", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#F59E0B", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon name="music" size={22} color="#F59E0B" />
                      <span>Pasatiempos, Tradiciones y Estilo de Vida</span>
                    </h3>
                    <p style={{ fontSize: "15px", lineHeight: "1.7", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                      {selectedDeptForDetails.pasatiempos.resumen}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {selectedDeptForDetails.pasatiempos.items.map((item, idx) => (
                      <div key={idx} style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(245, 158, 11, 0.2)",
                        borderRadius: "14px",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px"
                      }}>
                        <div style={{ minWidth: "32px", height: "32px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B", fontWeight: "900", fontSize: "13px" }}>
                          {idx + 1}
                        </div>
                        <p style={{ margin: 0, fontSize: "14.5px", fontWeight: "600", color: "#FFFFFF" }}>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. LUGARES IMPORTANTES */}
              {modalActiveTab === "lugares" && (
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#FFFFFF", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon name="landmark" size={22} color="#FFD700" />
                    <span>Sitios Emblemáticos Imperdibles</span>
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    {selectedDeptForDetails.lugaresImportantes.map((lugar, idx) => (
                      <div key={idx} style={{
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "18px",
                        padding: "20px"
                      }}>
                        <div style={{
                          height: "120px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, rgba(20, 109, 158, 0.4) 0%, rgba(10, 25, 47, 0.8) 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "14px",
                          border: "1px solid rgba(255,255,255,0.1)"
                        }}>
                          <Icon name="landmark" size={38} color="#FFD700" />
                        </div>

                        <h4 style={{ fontSize: "17px", fontWeight: "800", color: "#FFD700", margin: "0 0 6px" }}>
                          {lugar.nombre}
                        </h4>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                          {lugar.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. ACTIVIDADES */}
              {modalActiveTab === "actividades" && (
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#FFFFFF", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon name="party" size={22} color="#FFD700" />
                    <span>Fiestas Patronales, Eventos y Tradiciones</span>
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
                    {selectedDeptForDetails.actividades.map((act, idx) => (
                      <div key={idx} style={{
                        background: "linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(15, 23, 42, 0.85) 100%)",
                        border: "1.5px solid rgba(255, 215, 0, 0.3)",
                        borderRadius: "18px",
                        padding: "20px"
                      }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#FFD700",
                          color: "#0A192F",
                          padding: "3px 10px",
                          borderRadius: "8px",
                          fontWeight: "900",
                          fontSize: "11px",
                          marginBottom: "10px"
                        }}>
                          <Icon name="calendar" size={12} color="#0A192F" />
                          <span>{act.fecha}</span>
                        </span>

                        <h4 style={{ fontSize: "17px", fontWeight: "900", color: "#FFFFFF", margin: "0 0 6px" }}>
                          {act.nombre}
                        </h4>

                        <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                          {act.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div style={{
              padding: "16px 24px",
              background: "rgba(10, 25, 47, 0.95)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <button
                onClick={() => {
                  const dept = selectedDeptForDetails;
                  setSelectedDeptForDetails(null);
                  setSelectedDeptForPreview(dept);
                  if (mapContainerRef.current) {
                    mapContainerRef.current.scrollIntoView({ behavior: "smooth" });
                  }
                  if (mapRef.current && dept.coordenadas) {
                    mapRef.current.flyTo({ center: dept.coordenadas, zoom: 8, duration: 1000 });
                  }
                }}
                style={{
                  background: "rgba(255, 215, 0, 0.15)",
                  border: "1px solid rgba(255, 215, 0, 0.4)",
                  color: "#FFD700",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Icon name="map" size={15} color="#FFD700" />
                <span>Volver al Mapa</span>
              </button>

              <button
                onClick={() => setSelectedDeptForDetails(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#FFFFFF",
                  padding: "8px 20px",
                  borderRadius: "12px",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}


