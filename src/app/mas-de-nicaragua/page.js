"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";
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

export default function MasDeNicaraguaPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [hoveredDept, setHoveredDept] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("Todos");

  const deptsList = Object.values(DEPARTAMENTOS_DATA);

  const filteredDepts = selectedRegion === "Todos" 
    ? deptsList 
    : deptsList.filter(d => d.region === selectedRegion);

  // Inicialización del Mapa Mapbox GL
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12?optimize=true",
      center: [-85.1, 12.9],
      zoom: 6.0,
      minZoom: 5.5,
      maxZoom: 12,
      pitch: 0,
      projection: "mercator",
      maxBounds: [[-88.5, 9.8], [-81.5, 15.5]],
      scrollZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      dragRotate: false,
      touchZoomRotate: false
    });

    mapRef.current = map;

    map.on("load", () => {
      // Ocultar capas innecesarias para dejar un mapa limpio
      try {
        const styleLayers = map.getStyle().layers || [];
        styleLayers.forEach((layer) => {
          if (
            layer.id.startsWith("road") ||
            layer.id.startsWith("bridge") ||
            layer.id.startsWith("tunnel") ||
            layer.id.includes("admin") ||
            layer.id.includes("boundary") ||
            layer.type === "symbol"
          ) {
            map.setLayoutProperty(layer.id, "visibility", "none");
          }
        });
      } catch (_) {}

      // Cargar GeoJSON de Departamentos y Centroides
      map.addSource("nicaragua-departments", {
        type: "geojson",
        data: "/nicaragua-departments.json"
      });

      map.addSource("nicaragua-dept-centroids", {
        type: "geojson",
        data: "/nicaragua-department-centroids.json"
      });

      // Capa de Relleno Interactivo
      map.addLayer({
        id: "dept-fill",
        type: "fill",
        source: "nicaragua-departments",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#FFD700",
            "#146D9E"
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.65,
            0.25
          ]
        }
      });

      // Capa de Borde
      map.addLayer({
        id: "dept-borders",
        type: "line",
        source: "nicaragua-departments",
        paint: {
          "line-color": "#FFD700",
          "line-width": 2,
          "line-opacity": 0.8
        }
      });

      // Etiquetas con nombres de Departamentos
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

      // Evento Clic -> Navegar a /mas-de-nicaragua/[slug]
      map.on("click", "dept-fill", (e) => {
        if (e.features && e.features.length > 0) {
          const name = e.features[0].properties.nombre || e.features[0].properties.name;
          const slug = NOMBRES_A_SLUGS[name];
          if (slug) {
            router.push(`/mas-de-nicaragua/${slug}`);
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
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A192F", color: "#FFFFFF", fontFamily: "var(--font-outfit), sans-serif" }}>
      <Navbar activePage="mas-de-nicaragua" />

      {/* Hero Header */}
      <div style={{
        background: "linear-gradient(180deg, rgba(20, 109, 158, 0.25) 0%, rgba(10, 25, 47, 1) 100%)",
        padding: "110px 20px 40px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 215, 0, 0.15)",
            border: "1px solid rgba(255, 215, 0, 0.35)",
            padding: "6px 16px",
            borderRadius: "30px",
            color: "#FFD700",
            fontSize: "13px",
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "16px"
          }}>
            <Icon name="book" size={16} color="#FFD700" />
            <span>{t("nicaragua.title") || "Más de Nicaragua"}</span>
          </div>

          <h1 style={{
            fontSize: "clamp(30px, 5vw, 52px)",
            fontWeight: "900",
            color: "#FFFFFF",
            margin: "0 0 16px",
            lineHeight: 1.15
          }}>
            Enciclopedia Viva de los <span style={{ color: "#FFD700" }}>17 Departamentos</span>
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "rgba(255, 255, 255, 0.8)",
            margin: "0 auto 28px",
            lineHeight: 1.6,
            maxWidth: "750px"
          }}>
            {t("nicaragua.subtitle") || "Explora la historia, cultura, economía y belleza de cada departamento de nuestro país."}
          </p>

          {/* Badges estadísticos */}
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "10px 20px", borderRadius: "14px", textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "20px", fontWeight: "900", color: "#FFD700" }}>17</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: "700" }}>Departamentos</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "10px 20px", borderRadius: "14px", textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "20px", fontWeight: "900", color: "#38BDF8" }}>153</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: "700" }}>Municipios</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "10px 20px", borderRadius: "14px", textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "20px", fontWeight: "900", color: "#10B981" }}>3</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: "700" }}>Regiones</span>
            </div>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Sección 1: Mapa Interactivo de Nicaragua */}
        <section style={{ marginBottom: "50px" }}>
          <div style={{
            background: "rgba(15, 23, 42, 0.8)",
            border: "2px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon name="map" size={20} color="#FFD700" />
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#FFFFFF" }}>
                  Mapa Interactivo — Haz Clic en un Departamento
                </h2>
              </div>
              {hoveredDept && (
                <div style={{
                  background: "#FFD700",
                  color: "#0A192F",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontWeight: "800",
                  fontSize: "13px"
                }}>
                  📍 {hoveredDept}
                </div>
              )}
            </div>

            <div ref={mapContainerRef} style={{ width: "100%", height: "460px", borderRadius: "18px", overflow: "hidden" }} />
          </div>
        </section>

        {/* Sección 2: Grid de Tarjetas de Departamentos */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "900", color: "#FFFFFF" }}>
                Explorar Departamentos
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
                Selecciona una región o haz clic en cualquier tarjeta para ver su historia y detalles completos
              </p>
            </div>

            {/* Filtros de Región */}
            <div style={{ display: "flex", gap: "8px" }}>
              {["Todos", "Pacífico", "Central", "Caribe"].map((reg) => {
                const isActive = selectedRegion === reg;
                return (
                  <button
                    key={reg}
                    onClick={() => setSelectedRegion(reg)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "12px",
                      border: isActive ? "1.5px solid #FFD700" : "1px solid rgba(255,255,255,0.15)",
                      background: isActive ? "rgba(255, 215, 0, 0.2)" : "rgba(255,255,255,0.05)",
                      color: isActive ? "#FFD700" : "rgba(255,255,255,0.7)",
                      fontWeight: "750",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {reg === "Pacífico" && "🌊 "}
                    {reg === "Central" && "⛰️ "}
                    {reg === "Caribe" && "🏝️ "}
                    {reg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "24px"
          }}>
            {filteredDepts.map((dept) => {
              const regionColor = dept.region === "Pacífico" ? "#38BDF8" : dept.region === "Central" ? "#10B981" : "#F59E0B";
              const regionIcon = dept.region === "Pacífico" ? "🌊" : dept.region === "Central" ? "⛰️" : "🏝️";

              return (
                <Link
                  key={dept.slug}
                  href={`/mas-de-nicaragua/${dept.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1.5px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "20px",
                    padding: "20px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
                  }}
                  className="dept-card-hover"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.5)";
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow = "0 16px 32px rgba(255, 215, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
                  }}
                  >
                    <div>
                      {/* Header Card */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <span style={{
                          background: `${regionColor}20`,
                          border: `1px solid ${regionColor}50`,
                          color: regionColor,
                          padding: "4px 10px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "800",
                          textTransform: "uppercase"
                        }}>
                          {regionIcon} Región {dept.region}
                        </span>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "600" }}>
                          📍 {dept.cabecera}
                        </span>
                      </div>

                      {/* Nombre y Apodo */}
                      <h3 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: "900", color: "#FFFFFF" }}>
                        {dept.nombre}
                      </h3>
                      <p style={{ margin: "0 0 14px", fontSize: "12.5px", fontWeight: "700", color: "#FFD700" }}>
                        "{dept.apodo}"
                      </p>

                      {/* Stats Rápidos */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "12px", marginBottom: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div>
                          <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "700" }}>Extensión</span>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF" }}>{dept.extension}</span>
                        </div>
                        <div>
                          <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "700" }}>Población</span>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF" }}>{dept.poblacion}</span>
                        </div>
                      </div>

                      {/* Resumen corto */}
                      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {dept.historia.resumen}
                      </p>
                    </div>

                    {/* Botón Acción */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(255,255,255,0.08)"
                    }}>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#FFD700", display: "flex", alignItems: "center", gap: "6px" }}>
                        Ver Historia y Pestañas ➔
                      </span>
                      <Icon name="chevronRight" size={16} color="#FFD700" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
