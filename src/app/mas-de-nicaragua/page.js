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
import { getPointImage } from "@/lib/imageUtils";

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
  const [modalActiveTab, setModalActiveTab] = useState("galeria");

  // Estado del Lightbox de Galería de Imágenes
  const [lightboxIndex, setLightboxIndex] = useState(null);

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
          "line-color": "#FFFFFF",
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
      center: [-85.10, 12.90],
      zoom: 4.40,
      minZoom: 3.2,
      maxZoom: 9.0,
      pitch: 0,
      projection: "mercator",
      maxBounds: [[-90.0, 7.0], [-80.0, 18.0]],
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
      map.resize();
      try {
        map.flyTo({ center: [-85.10, 12.90], zoom: 4.40, duration: 0 });
      } catch (_) {}
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
    <div style={{ minHeight: "100vh", backgroundColor: "#0A192F", color: "#FFFFFF", fontFamily: "var(--font-outfit), sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Fondo Panorámico de la Página (Frame 9.png) */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: "url('/images/Frame 9.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: 0,
        pointerEvents: "none"
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar activePage="mas-de-nicaragua" />

        <main style={{
        maxWidth: "1310px",
        width: "100%",
        margin: "0 auto",
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "95px 12px 20px"
      }}>

        {/* Mapa Protagonista Principal */}
        <section style={{ width: "100%" }}>
          <div style={{
            background: "rgba(15, 23, 42, 0.85)",
            border: "2px solid rgba(255, 215, 0, 0.3)",
            borderRadius: "22px",
            padding: "8px 10px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Header Elegante y Compacto de 1 Sola Fila */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  background: "rgba(10, 25, 47, 0.95)",
                  border: "1.5px solid #FFD700",
                  borderRadius: "10px",
                  padding: "5px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 0 16px rgba(255, 215, 0, 0.25)"
                }}>
                  <img src="/images/Nicaragua croquis.svg" alt="Nicaragua" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                  <span style={{ fontSize: "14px", fontWeight: "900", color: "#FFD700", letterSpacing: "0.6px", textShadow: "0 0 8px rgba(255, 215, 0, 0.4)" }}>
                    Enciclopedia Viva
                  </span>
                </div>
                <span style={{ fontSize: "17.5px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "0.4px" }}>
                  17 Departamentos de{" "}
                  <span style={{
                    fontSize: "18.5px",
                    fontWeight: "900",
                    background: "linear-gradient(180deg, #0055D4 0%, #0066FF 33%, #FFFFFF 33%, #FFFFFF 66%, #0066FF 66%, #0055D4 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "inline-block",
                    letterSpacing: "0.8px",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.9))"
                  }}>
                    Nicaragua
                  </span>
                </span>
              </div>

              {/* Filtros Rápidos de Regiones con Estilo Neón */}
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { name: "Todos", center: [-85.10, 12.90], zoom: 4.40 },
                  { name: "Pacífico", icon: "waves", center: [-86.3, 12.25], zoom: 5.20 },
                  { name: "Central", icon: "mountain", center: [-85.5, 12.95], zoom: 5.20 },
                  { name: "Caribe", icon: "island", center: [-84.0, 13.55], zoom: 4.90 }
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
                        gap: "5px",
                        padding: "5px 12px",
                        borderRadius: "10px",
                        border: isActive ? "1.5px solid #FFD700" : "1px solid rgba(255,255,255,0.15)",
                        background: isActive ? "linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(245, 158, 11, 0.25) 100%)" : "rgba(255,255,255,0.06)",
                        color: isActive ? "#FFD700" : "rgba(255,255,255,0.8)",
                        fontWeight: "800",
                        fontSize: "12px",
                        cursor: "pointer",
                        boxShadow: isActive ? "0 0 12px rgba(255, 215, 0, 0.35)" : "none",
                        transition: "all 0.2s"
                      }}
                    >
                      {reg.icon && <Icon name={reg.icon} size={13} color={isActive ? "#FFD700" : "rgba(255,255,255,0.75)"} />}
                      <span>{reg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contenedor del Mapa Protagonista Maximizado */}
            <div style={{ position: "relative", width: "100%", height: "clamp(530px, 75vh, 670px)", borderRadius: "18px", overflow: "hidden" }}>
              <div ref={mapContainerRef} style={{ width: "100%", height: "100%", borderRadius: "18px", overflow: "hidden" }} />

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
                  <img src="/images/Ubicacion.svg" alt="Ubicación" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                  <span>{hoveredDept}</span>
                </div>
              )}

              {/* MODAL NIVEL 1: Tarjeta Preview Flotante sobre el Mapa */}
              {selectedDeptForPreview && (
                <div style={{
                  position: "absolute",
                  bottom: "20px",
                  right: "20px",
                  maxWidth: "380px",
                  width: "calc(100% - 40px)",
                  background: "rgba(10, 25, 47, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: selectedDeptForPreview.region === "Pacífico" ? "1.5px solid #00F2FE" : selectedDeptForPreview.region === "Central" ? "1.5px solid #10B981" : "1.5px solid #F59E0B",
                  borderRadius: "22px",
                  boxShadow: selectedDeptForPreview.region === "Pacífico" ? "0 0 25px rgba(0, 242, 254, 0.35), 0 20px 50px rgba(0,0,0,0.85)" : selectedDeptForPreview.region === "Central" ? "0 0 25px rgba(16, 185, 129, 0.35), 0 20px 50px rgba(0,0,0,0.85)" : "0 0 25px rgba(245, 158, 11, 0.35), 0 20px 50px rgba(0,0,0,0.85)",
                  zIndex: 20,
                  overflow: "hidden",
                  animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}>
                  {/* Hero Thumbnail con Imagen Emblemática del Departamento */}
                  <div style={{ position: "relative", width: "100%", height: "135px", overflow: "hidden" }}>
                    <img
                      src={selectedDeptForPreview.imagenReferencia || selectedDeptForPreview.imagen || "/images/Frame 9.png"}
                      alt={selectedDeptForPreview.nombre}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {/* Sombra Degradada sobre la Imagen */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10, 25, 47, 1) 0%, rgba(10, 25, 47, 0.4) 55%, rgba(0,0,0,0.3) 100%)" }} />

                    {/* Badge de Región sobre la Foto */}
                    <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 2 }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(10, 25, 47, 0.85)",
                        backdropFilter: "blur(10px)",
                        border: `1.5px solid ${selectedDeptForPreview.region === "Pacífico" ? "#00F2FE" : selectedDeptForPreview.region === "Central" ? "#10B981" : "#F59E0B"}`,
                        color: selectedDeptForPreview.region === "Pacífico" ? "#00F2FE" : selectedDeptForPreview.region === "Central" ? "#10B981" : "#F59E0B",
                        padding: "4px 10px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: "900",
                        textTransform: "uppercase"
                      }}>
                        <Icon
                          name={selectedDeptForPreview.region === "Pacífico" ? "waves" : selectedDeptForPreview.region === "Central" ? "mountain" : "island"}
                          size={13}
                          color={selectedDeptForPreview.region === "Pacífico" ? "#00F2FE" : selectedDeptForPreview.region === "Central" ? "#10B981" : "#F59E0B"}
                        />
                        <span>Región {selectedDeptForPreview.region}</span>
                      </span>
                    </div>

                    {/* Botón Cerrar ✕ Flotante sobre la Foto */}
                    <button
                      onClick={handleClosePreview}
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "rgba(0, 0, 0, 0.6)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        color: "#FFFFFF",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "900",
                        fontSize: "13px",
                        zIndex: 2,
                        transition: "background 0.2s"
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.8)"; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)"; }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Cuerpo de la Tarjeta Preview */}
                  <div style={{ padding: "0 18px 18px", marginTop: "-12px", position: "relative", zIndex: 3 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 style={{ margin: "0", fontSize: "23px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "-0.3px" }}>
                        {selectedDeptForPreview.nombre}
                      </h3>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.85)", fontWeight: "700" }}>
                        <img src="/images/Ubicacion.svg" alt="Ubicación" style={{ width: "14px", height: "14px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                        <span>{selectedDeptForPreview.cabecera}</span>
                      </span>
                    </div>

                    <p style={{ margin: "2px 0 14px", fontSize: "13px", fontWeight: "700", color: "#FFD700", opacity: 0.95 }}>
                      "{selectedDeptForPreview.apodo}"
                    </p>

                    {/* Metadatos Rápidos en Cristal Esmerilado */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      background: "rgba(255,255,255,0.06)",
                      backdropFilter: "blur(12px)",
                      padding: "10px 12px",
                      borderRadius: "14px",
                      marginBottom: "16px",
                      border: "1px solid rgba(255,255,255,0.12)"
                    }}>
                      <div>
                        <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>📏 Extensión</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "900", color: "#FFFFFF" }}>{selectedDeptForPreview.extension}</span>
                      </div>
                      <div>
                        <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>👥 Población</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "900", color: "#FFFFFF" }}>{selectedDeptForPreview.poblacion}</span>
                      </div>
                    </div>

                    {/* Botón para Abrir Modal Completo */}
                    <button
                      onClick={() => {
                        setSelectedDeptForDetails(selectedDeptForPreview);
                        setModalActiveTab("galeria");
                      }}
                      style={{
                        width: "100%",
                        padding: "13px 18px",
                        background: "linear-gradient(135deg, #FFE033 0%, #FFD700 100%)",
                        color: "#0F172A",
                        fontWeight: "900",
                        fontSize: "14.5px",
                        borderRadius: "14px",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "0 0 20px rgba(255, 215, 0, 0.45)",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                      <span>Ver Historia y Pestañas ➔</span>
                    </button>
                  </div>
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
          backgroundColor: "#0A192F",
          padding: "60px 20px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden"
        }}>
          {/* Capa de Fondo Izquierda en Pantalla: Frame 15 con dibujo original en el extremo izquierdo */}
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "50%",
            backgroundImage: "url('/images/Frame 15.png')",
            backgroundSize: "cover",
            backgroundPosition: "left center",
            backgroundRepeat: "no-repeat",
            pointerEvents: "none",
            zIndex: 0
          }} />

          {/* Capa de Fondo Derecha en Pantalla: Frame 15 reflejado en el extremo derecho */}
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "50%",
            backgroundImage: "url('/images/Frame 15.png')",
            backgroundSize: "cover",
            backgroundPosition: "left center",
            backgroundRepeat: "no-repeat",
            transform: "scaleX(-1)",
            pointerEvents: "none",
            zIndex: 0
          }} />

          {/* Overlay cristalino para mantener la imagen Frame 15 100% nítida y en su estado original (sin blur ni distorsión) */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.15)",
            pointerEvents: "none",
            zIndex: 0
          }} />

          {/* Tarjeta Modal General (Ancho 1160px, altura centrada 600px / 84vh) */}
          <div style={{
            maxWidth: "1160px",
            width: "100%",
            height: "600px",
            maxHeight: "84vh",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 1,
            background: "rgba(15, 23, 42, 0.97)",
            border: "1.5px solid rgba(255, 215, 0, 0.35)",
            borderRadius: "24px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.85)",
            overflow: "hidden"
          }}>
            {/* Header del Modal Completo Restaurado */}
            <div style={{
              background: "linear-gradient(180deg, rgba(20, 109, 158, 0.4) 0%, rgba(15, 23, 42, 1) 100%)",
              padding: "14px 20px 10px",
              position: "relative",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              flexShrink: 0
            }}>
              {/* Botón de Cierre */}
              <button
                onClick={() => setSelectedDeptForDetails(null)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "16px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  padding: "6px 14px",
                  borderRadius: "12px",
                  fontWeight: "800",
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(236, 72, 153, 0.6)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
              >
                <span>Cerrar</span>
                <span>✕</span>
              </button>

              {/* Titular e Info */}
              <div style={{ maxWidth: "950px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: selectedDeptForDetails.region === "Pacífico" ? "rgba(56, 189, 248, 0.25)" : selectedDeptForDetails.region === "Central" ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)",
                    border: `1px solid ${selectedDeptForDetails.region === "Pacífico" ? "#38BDF8" : selectedDeptForDetails.region === "Central" ? "#10B981" : "#F59E0B"}`,
                    color: selectedDeptForDetails.region === "Pacífico" ? "#38BDF8" : selectedDeptForDetails.region === "Central" ? "#10B981" : "#F59E0B",
                    padding: "3px 10px",
                    borderRadius: "10px",
                    fontSize: "11.5px",
                    fontWeight: "800",
                    textTransform: "uppercase"
                  }}>
                    <Icon
                      name={selectedDeptForDetails.region === "Pacífico" ? "waves" : selectedDeptForDetails.region === "Central" ? "mountain" : "island"}
                      size={13}
                      color={selectedDeptForDetails.region === "Pacífico" ? "#38BDF8" : selectedDeptForDetails.region === "Central" ? "#10B981" : "#F59E0B"}
                    />
                    <span>Región {selectedDeptForDetails.region}</span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>
                    <img src="/images/Ubicacion.svg" alt="Ubicación" style={{ width: "15px", height: "15px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                    <span>Cabecera: <strong>{selectedDeptForDetails.cabecera}</strong></span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12.5px", color: "#FFD700", fontWeight: "700" }}>
                    <Icon name="clock" size={13} color="#FFD700" />
                    <span>Fundación / Hito: <strong>{selectedDeptForDetails.fundacion}</strong></span>
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: "900", margin: 0, color: "#FFFFFF" }}>
                    {selectedDeptForDetails.nombre}
                  </h2>
                  <p style={{ fontSize: "14px", fontWeight: "700", color: "#FFD700", margin: 0 }}>
                    "{selectedDeptForDetails.apodo}"
                  </p>
                </div>
              </div>
            </div>

            {/* Selector de Pestañas Compacto */}
            <DepartmentTabs activeTab={modalActiveTab} onSelectTab={setModalActiveTab} isModal={true} />

            {/* Cuerpo del Modal Scrollable Interno */}
            <div style={{ padding: "18px 20px", flex: 1, overflowY: "auto" }}>

              {/* 1. HISTORIA */}
              {modalActiveTab === "historia" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px", alignItems: "start" }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "18px" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#FFD700", margin: "0 0 10px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src="/images/managua catedral.svg" alt="Historia" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) saturate(100%) invert(84%) sepia(54%) saturate(988%) hue-rotate(359deg) brightness(104%) contrast(104%)" }} />
                      <span>Resumen Histórico de {selectedDeptForDetails.nombre}</span>
                    </h3>
                    <p style={{ fontSize: "14px", lineHeight: "1.65", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                      {selectedDeptForDetails.historia.resumen}
                    </p>
                  </div>

                  {selectedDeptForDetails.historia.hitos && selectedDeptForDetails.historia.hitos.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon name="clock" size={16} color="#FFD700" />
                        <span>Hitos Históricos Fundamentales</span>
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                        {selectedDeptForDetails.historia.hitos.map((hito, idx) => (
                          <div key={idx} style={{
                            background: "linear-gradient(135deg, rgba(20, 109, 158, 0.25) 0%, rgba(15, 23, 42, 0.8) 100%)",
                            border: "1px solid rgba(20, 109, 158, 0.35)",
                            borderRadius: "14px",
                            padding: "14px"
                          }}>
                            <span style={{ fontSize: "18px", fontWeight: "900", color: "#FFD700", display: "block", marginBottom: "2px" }}>
                              {hito.año}
                            </span>
                            <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.45 }}>
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
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "18px", marginBottom: "18px" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#38BDF8", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src="/images/cacao.svg" alt="Economía" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) saturate(100%) invert(73%) sepia(35%) saturate(1637%) hue-rotate(170deg) brightness(102%) contrast(97%)" }} />
                      <span>Dinámica Económica y Productiva</span>
                    </h3>
                    <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                      {selectedDeptForDetails.economia.resumen}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                    {selectedDeptForDetails.economia.sectores.map((sec, idx) => (
                      <div key={idx} style={{
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid rgba(56, 189, 248, 0.25)",
                        borderRadius: "16px",
                        padding: "16px"
                      }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8", marginBottom: "10px" }}>
                          <img src="/images/cacao.svg" alt="Sector" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) saturate(100%) invert(73%) sepia(35%) saturate(1637%) hue-rotate(170deg) brightness(102%) contrast(97%)" }} />
                        </div>
                        <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 4px" }}>
                          {sec.titulo}
                        </h4>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.45 }}>
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
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "18px", marginBottom: "18px" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#10B981", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src="/images/playa.svg" alt="Turismo" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) saturate(100%) invert(67%) sepia(38%) saturate(972%) hue-rotate(113deg) brightness(97%) contrast(90%)" }} />
                      <span>Oferta Turística de {selectedDeptForDetails.nombre}</span>
                    </h3>
                    <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                      {selectedDeptForDetails.turismo.resumen}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                    {selectedDeptForDetails.turismo.atractivos.map((atr, idx) => (
                      <div key={idx} style={{
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        borderRadius: "16px",
                        padding: "16px"
                      }}>
                        <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon name="mapPin" size={14} color="#10B981" />
                          <span>{atr.nombre}</span>
                        </h4>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.8)", lineHeight: 1.45 }}>
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
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "18px", marginBottom: "18px" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#F59E0B", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src="/images/Volcan.svg" alt="Pasatiempos" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) saturate(100%) invert(70%) sepia(50%) saturate(1500%) hue-rotate(1deg) brightness(100%) contrast(100%)" }} />
                      <span>Pasatiempos, Tradiciones y Estilo de Vida</span>
                    </h3>
                    <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                      {selectedDeptForDetails.pasatiempos.resumen}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                    {selectedDeptForDetails.pasatiempos.items.map((item, idx) => (
                      <div key={idx} style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(245, 158, 11, 0.2)",
                        borderRadius: "14px",
                        padding: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                        <div style={{ minWidth: "28px", height: "28px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B", fontWeight: "900", fontSize: "12px" }}>
                          {idx + 1}
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#FFFFFF", lineHeight: 1.4 }}>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. LUGARES IMPORTANTES Y ACTIVIDADES (COMBINADO) */}
              {(modalActiveTab === "lugares" || modalActiveTab === "actividades") && (
                <div>
                  {/* Subsección 1: Sitios Emblemáticos Imperdibles */}
                  {selectedDeptForDetails.lugaresImportantes && selectedDeptForDetails.lugaresImportantes.length > 0 && (
                    <div style={{ marginBottom: "28px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#FFD700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <img src="/images/San Juan del sur.svg" alt="Lugares" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) saturate(100%) invert(84%) sepia(54%) saturate(988%) hue-rotate(359deg) brightness(104%) contrast(104%)" }} />
                        <span>Sitios Emblemáticos Imperdibles</span>
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                        {selectedDeptForDetails.lugaresImportantes.map((lugar, idx) => (
                          <div key={idx} style={{
                            background: "linear-gradient(135deg, rgba(28, 25, 23, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)",
                            border: "1px solid rgba(255, 215, 0, 0.35)",
                            borderRadius: "16px",
                            padding: "16px 18px",
                            position: "relative",
                            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.4)"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.7)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 10px 24px rgba(255, 215, 0, 0.18)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.35)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.4)";
                          }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(180, 130, 0, 0.3) 100%)",
                                border: "1px solid rgba(255, 215, 0, 0.4)",
                                color: "#FFD700",
                                padding: "3px 10px",
                                borderRadius: "8px",
                                fontSize: "11px",
                                fontWeight: "800"
                              }}>
                                <Icon name="mapPin" size={12} color="#FFD700" />
                                <span>Sitio #{idx + 1}</span>
                              </span>

                              <img
                                src="/images/San Juan del sur.svg"
                                alt="Emblema"
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  objectFit: "contain",
                                  opacity: 0.9,
                                  filter: "brightness(0) saturate(100%) invert(84%) sepia(54%) saturate(988%) hue-rotate(359deg) brightness(104%) contrast(104%)"
                                }}
                              />
                            </div>

                            <h5 style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 6px", lineHeight: "1.35" }}>
                              {lugar.nombre}
                            </h5>
                            <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                              {lugar.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subsección 2: Fiestas Patronales, Eventos y Tradiciones (Estilo Rubí Coral) */}
                  {selectedDeptForDetails.actividades && selectedDeptForDetails.actividades.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#F43F5E", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <img src="/images/caña.svg" alt="Actividades" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) saturate(100%) invert(43%) sepia(85%) saturate(2250%) hue-rotate(327deg) brightness(97%) contrast(94%)" }} />
                        <span>Fiestas Patronales, Eventos y Tradiciones</span>
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                        {selectedDeptForDetails.actividades.map((act, idx) => (
                          <div key={idx} style={{
                            background: "linear-gradient(135deg, rgba(45, 15, 25, 0.85) 0%, rgba(20, 10, 20, 0.95) 100%)",
                            border: "1px solid rgba(244, 63, 94, 0.4)",
                            borderRadius: "16px",
                            padding: "16px 18px",
                            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.4)"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "rgba(244, 63, 94, 0.7)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 10px 24px rgba(244, 63, 94, 0.2)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "rgba(244, 63, 94, 0.4)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.4)";
                          }}
                          >
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
                              color: "#FFFFFF",
                              padding: "3px 10px",
                              borderRadius: "8px",
                              fontWeight: "900",
                              fontSize: "11px",
                              marginBottom: "10px",
                              boxShadow: "0 2px 8px rgba(244, 63, 94, 0.35)"
                            }}>
                              <Icon name="calendar" size={12} color="#FFFFFF" />
                              <span>{act.fecha}</span>
                            </span>

                            <h5 style={{ fontSize: "15.5px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 6px", lineHeight: "1.35" }}>
                              {act.nombre}
                            </h5>

                            <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                              {act.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. GALERÍA DE IMÁGENES */}
              {modalActiveTab === "galeria" && (
                <div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "18px",
                    alignItems: "start"
                  }}>
                    {/* Columna Izquierda: Galería Fotográfica de [Departamento] */}
                    {(selectedDeptForDetails.imagenReferencia || selectedDeptForDetails.imagenCard) && (
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(236, 72, 153, 0.3)", borderRadius: "18px", padding: "14px" }}>
                        <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#FFD700", margin: "0 0 10px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          <img src="/images/masaaya.svg" alt="Masaya" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) saturate(100%) invert(84%) sepia(54%) saturate(988%) hue-rotate(359deg) brightness(104%) contrast(104%)" }} />
                          <span>Galería Fotográfica de {selectedDeptForDetails.nombre}</span>
                        </h4>
                        <div
                          onClick={() => setLightboxIndex(-1)}
                          style={{
                            width: "100%",
                            height: "288px",
                            borderRadius: "14px",
                            overflow: "hidden",
                            position: "relative",
                            cursor: "pointer",
                            border: "1.5px solid rgba(236, 72, 153, 0.4)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                            background: "#0F172A"
                          }}
                        >
                          <img
                            src={selectedDeptForDetails.imagenReferencia || selectedDeptForDetails.imagenCard}
                            alt={`Galería Fotográfica de ${selectedDeptForDetails.nombre}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s" }}
                            loading="lazy"
                            onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                          />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(10,25,47,0.7) 100%)" }} />
                        </div>
                      </div>
                    )}

                    {/* Columna Derecha: Grid de Galería (Fotos 2 a 7) */}
                    {selectedDeptForDetails.galeria && selectedDeptForDetails.galeria.length > 0 && (
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "14px" }}>
                        <h4 style={{ fontSize: "12px", fontWeight: "800", color: "rgba(255,255,255,0.8)", margin: "0 0 10px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          <img src="/images/masaaya.svg" alt="Galería" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(0.85)" }} />
                          <span>Fotografías de Galería</span>
                        </h4>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                          gap: "10px"
                        }}>
                          {selectedDeptForDetails.galeria.map((imgSrc, idx) => (
                            <div
                              key={idx}
                              onClick={() => setLightboxIndex(idx)}
                              style={{
                                position: "relative",
                                borderRadius: "12px",
                                overflow: "hidden",
                                cursor: "pointer",
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                                height: "139px",
                                background: "#0F172A",
                                transition: "transform 0.25s, box-shadow 0.25s"
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = "scale(1.04)";
                                e.currentTarget.style.borderColor = "rgba(236, 72, 153, 0.6)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                              }}
                            >
                              <img
                                src={imgSrc}
                                alt={`${selectedDeptForDetails.nombre} - Foto ${idx + 1}`}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                loading="lazy"
                              />
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(10,25,47,0.6) 100%)" }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
              alignItems: "center",
              gap: "12px"
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

              <span style={{
                fontSize: "11.5px",
                color: "rgba(255, 255, 255, 0.65)",
                fontWeight: "600",
                textAlign: "center"
              }}>
                Fuente y créditos de las Imágenes: INTUR, Mapa Nacional de Turismo.
              </span>
            </div>

          </div>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN: Visor de Imágenes Expandido */}
      {lightboxIndex !== null && selectedDeptForDetails && (() => {
        // Construir el arreglo de todas las imágenes disponibles para navegar
        const allImages = [];
        const heroImg = selectedDeptForDetails.imagenReferencia || selectedDeptForDetails.imagenCard;
        if (heroImg) {
          allImages.push({ src: heroImg, label: "Fotografía 1" });
        }
        if (selectedDeptForDetails.galeria) {
          selectedDeptForDetails.galeria.forEach((src, i) => {
            allImages.push({ src, label: `Fotografía ${heroImg ? i + 2 : i + 1}` });
          });
        }

        const hasHero = !!heroImg;
        // Calcular el índice real (lightboxIndex === -1 -> foto de referencia -> index 0)
        const currentIdx = lightboxIndex === -1 ? 0 : (hasHero ? lightboxIndex + 1 : lightboxIndex);
        const currentImage = allImages[currentIdx];
        if (!currentImage) return null;

        const goPrev = () => {
          const newIdx = currentIdx <= 0 ? allImages.length - 1 : currentIdx - 1;
          setLightboxIndex(hasHero ? newIdx - 1 : newIdx);
        };
        const goNext = () => {
          const newIdx = currentIdx >= allImages.length - 1 ? 0 : currentIdx + 1;
          setLightboxIndex(hasHero ? newIdx - 1 : newIdx);
        };

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              backgroundColor: "rgba(0, 0, 0, 0.95)",
              backdropFilter: "blur(20px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeInUp 0.25s ease-out"
            }}
            onClick={() => setLightboxIndex(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setLightboxIndex(null);
              if (e.key === "ArrowLeft") { e.stopPropagation(); goPrev(); }
              if (e.key === "ArrowRight") { e.stopPropagation(); goNext(); }
            }}
            tabIndex={0}
            ref={(el) => el && el.focus()}
          >
            {/* Header del Lightbox */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
              zIndex: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon name="image" size={18} color="#EC4899" />
                <span style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: "800" }}>
                  {selectedDeptForDetails.nombre}
                </span>
                <span style={{
                  background: "rgba(236, 72, 153, 0.8)",
                  color: "#FFFFFF",
                  padding: "3px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: "800"
                }}>
                  {currentIdx + 1} / {allImages.length}
                </span>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#FFFFFF",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  fontSize: "18px",
                  transition: "background 0.2s"
                }}
              >
                ✕
              </button>
            </div>

            {/* Imagen Principal del Lightbox */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              <img
                src={currentImage.src}
                alt={`${selectedDeptForDetails.nombre} - ${currentImage.label}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  borderRadius: "12px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.8)"
                }}
              />
            </div>

            {/* Flechas de Navegación */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  style={{
                    position: "absolute",
                    left: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(8px)",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    color: "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    fontWeight: "900",
                    transition: "background 0.2s, transform 0.2s",
                    zIndex: 10
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(236, 72, 153, 0.6)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                >
                  <Icon name="chevronLeft" size={24} color="#FFFFFF" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  style={{
                    position: "absolute",
                    right: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(8px)",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    color: "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    fontWeight: "900",
                    transition: "background 0.2s, transform 0.2s",
                    zIndex: 10
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(236, 72, 153, 0.6)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                >
                  <Icon name="chevronRight" size={24} color="#FFFFFF" />
                </button>
              </>
            )}

            {/* Label de la Imagen Actual */}
            <div style={{
              position: "absolute",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(10, 25, 47, 0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "8px 20px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <Icon name="camera" size={14} color="#EC4899" />
              <span style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: "700" }}>
                {currentImage.label}
              </span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                — {selectedDeptForDetails.nombre}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Estilos CSS para hover de galería */}
      <style jsx>{`
        .gallery-expand-icon {
          opacity: 0 !important;
          transition: opacity 0.25s;
        }
        div:hover > .gallery-expand-icon {
          opacity: 1 !important;
        }
      `}</style>

      </div>
    </div>
  );
}


