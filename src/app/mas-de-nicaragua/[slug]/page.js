"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";
import DepartmentTabs from "@/components/ui/DepartmentTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { DEPARTAMENTOS_DATA } from "@/data/departamentos-data";
import { getPointImage } from "@/lib/imageUtils";

export default function DepartamentoDetailPage() {
  const { t, lang } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [activeTab, setActiveTab] = useState("historia");

  const dept = DEPARTAMENTOS_DATA[slug];

  if (!dept) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0A192F", color: "#FFFFFF", display: "flex", flexDirection: "column" }}>
        <Navbar activePage="mas-de-nicaragua" />
        <div style={{ maxWidth: "600px", margin: "140px auto 60px", padding: "40px 20px", textAlign: "center", background: "rgba(15,23,42,0.8)", border: "1.5px dashed rgba(255,215,0,0.4)", borderRadius: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", margin: "0 0 10px" }}>
            Departamento No Encontrado
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "24px" }}>
            El departamento que buscas no existe o el enlace es incorrecto.
          </p>
          <Link
            href="/mas-de-nicaragua"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              background: "linear-gradient(135deg, #FFE033 0%, #FFD700 100%)",
              color: "#1A1A2E",
              fontWeight: "800",
              borderRadius: "14px",
              textDecoration: "none"
            }}
          >
            <Icon name="arrowLeft" size={16} color="#1A1A2E" />
            <span>Volver a Nicaragua Viva</span>
          </Link>
        </div>
      </div>
    );
  }

  const regionColor = dept.region === "Pacífico" ? "#38BDF8" : dept.region === "Central" ? "#10B981" : "#F59E0B";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A192F", color: "#FFFFFF", fontFamily: "var(--font-outfit), sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Fondo de 3 columnas compuestas: art4.png, art5.png, art3.jpeg */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden"
      }}>
        {/* Columna 1: art4.png */}
        <div style={{
          backgroundImage: "url('/images/art4.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100%",
          width: "100%"
        }} />
        {/* Columna 2: art5.png */}
        <div style={{
          backgroundImage: "url('/images/art5.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100%",
          width: "100%"
        }} />
        {/* Columna 3: art3.jpeg */}
        <div style={{
          backgroundImage: "url('/images/art3.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100%",
          width: "100%"
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar activePage="mas-de-nicaragua" />

      {/* Hero Header del Departamento */}
      <div style={{
        background: "linear-gradient(180deg, rgba(20, 109, 158, 0.35) 0%, rgba(10, 25, 47, 1) 100%)",
        padding: "100px 20px 30px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          
          {/* Breadcrumb Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "20px", flexWrap: "wrap" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Inicio</Link>
            <span>/</span>
            <Link href="/mas-de-nicaragua" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Más de Nicaragua</Link>
            <span>/</span>
            <span style={{ color: "#FFD700", fontWeight: "700" }}>{dept.nombre}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{
                  background: `${regionColor}25`,
                  border: `1px solid ${regionColor}60`,
                  color: regionColor,
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "800",
                  textTransform: "uppercase"
                }}>
                  Región {dept.region}
                </span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
                  📍 Cabecera: <strong>{dept.cabecera}</strong>
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(32px, 5vw, 54px)", fontWeight: "900", margin: "0 0 6px", color: "#FFFFFF" }}>
                {dept.nombre}
              </h1>

              <p style={{ fontSize: "clamp(16px, 2vw, 20px)", fontWeight: "700", color: "#FFD700", margin: "0 0 20px" }}>
                "{dept.apodo}"
              </p>
            </div>

            {/* Acciones Rápidas */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                href={`/mapa`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 20px",
                  background: "linear-gradient(135deg, #FFE033 0%, #FFD700 100%)",
                  color: "#1A1A2E",
                  fontWeight: "800",
                  fontSize: "13.5px",
                  borderRadius: "14px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(255, 215, 0, 0.3)"
                }}
              >
                <Icon name="map" size={16} color="#1A1A2E" />
                <span>Explorar en el Mapa</span>
              </Link>

              <Link
                href={`/departamentos`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 20px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  fontWeight: "800",
                  fontSize: "13.5px",
                  borderRadius: "14px",
                  textDecoration: "none"
                }}
              >
                <Icon name="star" size={16} color="#FFD700" />
                <span>Ver Ranking</span>
              </Link>
            </div>
          </div>

          {/* Ficha de Metadatos Rápidos */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginTop: "24px",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "18px",
            padding: "16px"
          }}>
            <div>
              <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "700" }}>Extensión Territorial</span>
              <span style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF" }}>{dept.extension}</span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "700" }}>Población Aprox.</span>
              <span style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF" }}>{dept.poblacion}</span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "700" }}>Fundación / Hito</span>
              <span style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF" }}>{dept.fundacion}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Galería Fotográfica del Departamento */}
      {((dept.imagenReferencia || dept.imagenCard) || (dept.galeria && dept.galeria.length > 0)) && (
        <div style={{
          background: "linear-gradient(180deg, rgba(10, 25, 47, 1) 0%, rgba(15, 23, 42, 0.95) 100%)",
          padding: "30px 20px 36px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: "18px", 
                fontWeight: "900", 
                color: "#FFFFFF", 
                display: "flex", 
                alignItems: "center", 
                gap: "10px",
                textShadow: "0 2px 8px rgba(0,0,0,0.8)"
              }}>
                📸 Galería Fotográfica de {dept.nombre}
              </h2>
              <span style={{
                fontSize: "11.5px",
                fontWeight: "700",
                color: "#CBD5E1",
                background: "rgba(255,255,255,0.08)",
                padding: "3px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.15)"
              }}>
                {(dept.galeria?.length || 0) + ((dept.imagenReferencia || dept.imagenCard) ? 1 : 0)} Fotos
              </span>
            </div>

            {/* Imagen de Referencia (1.1) */}
            {(dept.imagenReferencia || dept.imagenCard) && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: "800", color: "#FFD700", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <span>📌 Imagen de Referencia</span>
                </h3>
                <div style={{
                  position: "relative",
                  borderRadius: "18px",
                  overflow: "hidden",
                  height: "320px",
                  border: "2px solid rgba(236, 72, 153, 0.4)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                  background: "#0F172A"
                }}>
                  <img
                    src={dept.imagenReferencia || dept.imagenCard}
                    alt={`Imagen de Referencia de ${dept.nombre}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    loading="lazy"
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(10,25,47,0.8) 100%)" }} />
                  <span style={{
                    position: "absolute",
                    bottom: "16px",
                    left: "20px",
                    background: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
                    color: "#FFFFFF",
                    padding: "6px 16px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing: "0.5px",
                    boxShadow: "0 4px 14px rgba(236, 72, 153, 0.4)"
                  }}>
                    📸 Imagen de Referencia
                  </span>
                </div>
              </div>
            )}

            {/* Cuadrícula de fotos secundarias (2 a 6) */}
            {dept.galeria && dept.galeria.length > 0 && (
              <div>
                {(dept.imagenReferencia || dept.imagenCard) && (
                  <h3 style={{ fontSize: "13px", fontWeight: "800", color: "rgba(255,255,255,0.7)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <span>🖼️ Fotografías de Galería</span>
                  </h3>
                )}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "12px"
                }}>
                  {dept.galeria.map((imgSrc, idx) => (
                    <div 
                      key={idx}
                      style={{
                        position: "relative",
                        borderRadius: "14px",
                        overflow: "hidden",
                        aspectRatio: "16 / 10",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
                        background: "#0F172A"
                      }}
                    >
                      <img
                        src={imgSrc}
                        alt={`${dept.nombre} - Foto ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          transition: "transform 0.4s ease"
                        }}
                        loading="lazy"
                        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                      />
                      {/* Overlay degradado sutil inferior */}
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(10, 25, 47, 0.55) 100%)",
                        pointerEvents: "none"
                      }} />
                      <span style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "10px",
                        background: "rgba(10, 25, 47, 0.85)",
                        backdropFilter: "blur(6px)",
                        color: "#FFFFFF",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700"
                      }}>
                        {idx + 1}/{dept.galeria.length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <DepartmentTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Contenido de la Pestaña Seleccionada */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* 1. PESTAÑA HISTORIA */}
        {activeTab === "historia" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: "linear-gradient(135deg, rgba(28, 25, 20, 0.92) 0%, rgba(15, 23, 42, 0.95) 100%)", border: "1.5px solid rgba(255, 215, 0, 0.4)", borderRadius: "24px", padding: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#FFD700", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <img src="/images/managua catedral.svg" alt="Historia" style={{ width: "24px", height: "24px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                  <span>Resumen Histórico y Orígenes de {dept.nombre}</span>
                </h2>
                <span style={{ background: "rgba(255, 215, 0, 0.15)", border: "1px solid rgba(255, 215, 0, 0.4)", color: "#FFD700", padding: "5px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <img src="/images/edificio.svg" alt="Patrimonio" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                  <span>Patrimonio Histórico Nacional</span>
                </span>
              </div>

              <p style={{ fontSize: "16px", lineHeight: "1.8", color: "rgba(255,255,255,0.92)", margin: "0 0 20px" }}>
                {dept.historia.resumen}
              </p>

              {/* Origen Etimológico */}
              {dept.historia.origenEtimologico && (
                <div style={{ background: "rgba(255, 215, 0, 0.08)", border: "1px solid rgba(255, 215, 0, 0.25)", borderRadius: "16px", padding: "16px 20px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "900", color: "#FFD700", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", letterSpacing: "0.5px" }}>
                    <img src="/images/sombrero.svg" alt="Origen" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                    <span>Origen Etimológico y Raíces Indígenas</span>
                  </span>
                  <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.9)", lineHeight: "1.6" }}>
                    {dept.historia.origenEtimologico}
                  </p>
                </div>
              )}

              {/* Ficha de Datos Clave */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", paddingTop: "18px", borderTop: "1px dashed rgba(255, 215, 0, 0.25)" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "800", marginBottom: "3px" }}>Cabecera Histórica</span>
                  <span style={{ fontSize: "15px", fontWeight: "800", color: "#FFD700" }}>{dept.cabecera}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "800", marginBottom: "3px" }}>Fundación / Hito</span>
                  <span style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF" }}>{dept.fundacion}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "800", marginBottom: "3px" }}>Extensión Territorial</span>
                  <span style={{ fontSize: "15px", fontWeight: "800", color: "#38BDF8" }}>{dept.extension}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "800", marginBottom: "3px" }}>Región Geográfica</span>
                  <span style={{ fontSize: "15px", fontWeight: "800", color: "#10B981" }}>{dept.region}</span>
                </div>
              </div>
            </div>

            {/* Timeline de Hitos */}
            {dept.historia.hitos && dept.historia.hitos.length > 0 && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <Icon name="clock" size={20} color="#FFD700" />
                  <span>Línea de Tiempo e Hitos Fundamentales</span>
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
                  {dept.historia.hitos.map((hito, idx) => (
                    <div key={idx} style={{
                      background: "linear-gradient(135deg, rgba(20, 109, 158, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)",
                      border: "1px solid rgba(20, 109, 158, 0.35)",
                      borderRadius: "18px",
                      padding: "20px"
                    }}>
                      <span style={{ fontSize: "20px", fontWeight: "900", color: "#FFD700", display: "inline-block", background: "rgba(255, 215, 0, 0.12)", border: "1px solid rgba(255, 215, 0, 0.3)", padding: "2px 12px", borderRadius: "10px", marginBottom: "8px" }}>
                        {hito.año}
                      </span>
                      <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.88)", lineHeight: 1.6 }}>
                        {hito.evento}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personajes Ilustres */}
            {dept.historia.personajes && dept.historia.personajes.length > 0 && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFD700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <Icon name="award" size={20} color="#FFD700" />
                  <span>Personajes Ilustres y Héroes de la Historia</span>
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
                  {dept.historia.personajes.map((per, idx) => (
                    <div key={idx} style={{ background: "linear-gradient(135deg, rgba(30, 25, 15, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)", border: "1px solid rgba(255, 215, 0, 0.3)", borderRadius: "18px", padding: "20px" }}>
                      <span style={{ fontSize: "15px", fontWeight: "900", color: "#FFD700", display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <img src="/images/sombrero.svg" alt="Sombrero" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                        <span>{per.nombre}</span>
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#38BDF8", display: "block", marginBottom: "8px" }}>
                        {per.titulo}
                      </span>
                      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                        {per.aporte}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patrimonio Histórico Protegido */}
            {dept.historia.patrimonio && dept.historia.patrimonio.length > 0 && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#38BDF8", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <Icon name="landmark" size={20} color="#38BDF8" />
                  <span>Patrimonio Protegido, Templos y Sitios Arqueológicos</span>
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
                  {dept.historia.patrimonio.map((pat, idx) => (
                    <div key={idx} style={{ background: "linear-gradient(135deg, rgba(15, 30, 50, 0.85) 0%, rgba(10, 20, 35, 0.9) 100%)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "18px", padding: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "900", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px" }}>
                          <img src="/images/edificio.svg" alt="Patrimonio" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0) saturate(100%) invert(100%)" }} />
                          <span>{pat.sitio}</span>
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#10B981", background: "rgba(16, 185, 129, 0.15)", padding: "3px 10px", borderRadius: "8px" }}>
                          {pat.epoca}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                        {pat.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* 2. PESTAÑA ECONOMÍA */}
        {activeTab === "economia" && (
          <div className="animate-fade-in">
            <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: "24px", padding: "32px", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#38BDF8", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                💰 Dinámica Económica y Productiva
              </h2>
              <p style={{ fontSize: "16px", lineHeight: "1.8", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                {dept.economia.resumen}
              </p>
            </div>

            {/* Sectores Clave */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {dept.economia.sectores.map((sec, idx) => (
                <div key={idx} style={{
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  borderRadius: "20px",
                  padding: "24px"
                }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8", marginBottom: "14px" }}>
                    <Icon name="trendingUp" size={22} color="#38BDF8" />
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 8px" }}>
                    {sec.titulo}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                    {sec.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. PESTAÑA TURISMO */}
        {activeTab === "turismo" && (
          <div className="animate-fade-in">
            <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: "24px", padding: "32px", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#10B981", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                🏖️ Oferta Turística de {dept.nombre}
              </h2>
              <p style={{ fontSize: "16px", lineHeight: "1.8", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                {dept.turismo.resumen}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              {dept.turismo.atractivos.map((atr, idx) => (
                <div key={idx} style={{
                  background: "rgba(15, 23, 42, 0.75)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "20px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 10px" }}>
                      📍 {atr.nombre}
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                      {atr.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. PESTAÑA PASATIEMPOS Y CULTURA */}
        {activeTab === "pasatiempos" && (
          <div className="animate-fade-in">
            <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: "24px", padding: "32px", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#F59E0B", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                🎭 Pasatiempos, Tradiciones y Estilo de Vida
              </h2>
              <p style={{ fontSize: "16px", lineHeight: "1.8", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                {dept.pasatiempos.resumen}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {dept.pasatiempos.items.map((item, idx) => (
                <div key={idx} style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "16px",
                  padding: "18px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px"
                }}>
                  <div style={{ minWidth: "36px", height: "36px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B", fontWeight: "900" }}>
                    {idx + 1}
                  </div>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#FFFFFF" }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PESTAÑA LUGARES IMPORTANTES */}
        {activeTab === "lugares" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              📍 Sitios Emblemáticos Imperdibles
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {dept.lugaresImportantes.map((lugar, idx) => (
                <div key={idx} style={{
                  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)",
                  border: "1px solid rgba(255, 215, 0, 0.25)",
                  borderRadius: "18px",
                  padding: "20px 22px",
                  position: "relative",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.35)"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.6)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 24px rgba(255, 215, 0, 0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.25)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.35)";
                }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(255, 215, 0, 0.12)",
                      border: "1px solid rgba(255, 215, 0, 0.3)",
                      color: "#FFD700",
                      padding: "4px 12px",
                      borderRadius: "8px",
                      fontSize: "11.5px",
                      fontWeight: "800"
                    }}>
                      <Icon name="mapPin" size={13} color="#FFD700" />
                      <span>Sitio #{idx + 1}</span>
                    </span>

                    <img
                      src="/images/San Juan del sur.svg"
                      alt="Emblema"
                      style={{
                        width: "18px",
                        height: "18px",
                        objectFit: "contain",
                        opacity: 0.85,
                        filter: "brightness(0) saturate(100%) invert(84%) sepia(54%) saturate(988%) hue-rotate(359deg) brightness(104%) contrast(104%)"
                      }}
                    />
                  </div>

                  <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 8px", lineHeight: "1.3" }}>
                    {lugar.nombre}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>
                    {lugar.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. PESTAÑA GALERÍA */}
        {activeTab === "galeria" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Icon name="image" size={22} color="#EC4899" />
              <span>Galería Fotográfica de {dept.nombre}</span>
            </h2>

            {/* Grid de Galería Principal */}
            {dept.galeria && dept.galeria.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
                marginBottom: "32px"
              }}>
                {dept.galeria.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      borderRadius: "18px",
                      overflow: "hidden",
                      aspectRatio: "4 / 3",
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      background: "#0F172A",
                      cursor: "pointer",
                      transition: "transform 0.3s, box-shadow 0.3s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "scale(1.03)";
                      e.currentTarget.style.boxShadow = "0 12px 36px rgba(236, 72, 153, 0.3)";
                      e.currentTarget.style.borderColor = "rgba(236, 72, 153, 0.5)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    }}
                  >
                    <img
                      src={imgSrc}
                      alt={`${dept.nombre} - Foto ${idx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(10,25,47,0.6) 100%)" }} />
                    <span style={{
                      position: "absolute",
                      bottom: "12px",
                      right: "12px",
                      background: "rgba(10, 25, 47, 0.85)",
                      backdropFilter: "blur(8px)",
                      color: "#FFFFFF",
                      padding: "4px 12px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: "800",
                      border: "1px solid rgba(255,255,255,0.15)"
                    }}>
                      {idx + 1}/{dept.galeria.length}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Lugares Importantes con Imágenes */}
            {dept.lugaresImportantes && dept.lugaresImportantes.length > 0 && (
              <div>
                <h3 style={{ fontSize: "19px", fontWeight: "800", color: "#FFD700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon name="landmark" size={20} color="#FFD700" />
                  <span>Sitios Emblemáticos en Fotos</span>
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
                  {dept.lugaresImportantes.map((lugar, idx) => {
                    const siteImg = getPointImage(lugar);
                    return (
                      <div key={idx} style={{
                        background: "rgba(15, 23, 42, 0.85)",
                        border: "1px solid rgba(255,215,0,0.2)",
                        borderRadius: "18px",
                        overflow: "hidden",
                        transition: "transform 0.3s, border-color 0.3s"
                      }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "translateY(-3px)";
                          e.currentTarget.style.borderColor = "rgba(255,215,0,0.5)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = "rgba(255,215,0,0.2)";
                        }}
                      >
                        <div style={{ height: "160px", overflow: "hidden", position: "relative" }}>
                          <img
                            src={siteImg}
                            alt={lugar.nombre}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            loading="lazy"
                          />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(15,23,42,0.7) 100%)" }} />
                        </div>
                        <div style={{ padding: "16px 18px" }}>
                          <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#FFD700", margin: "0 0 6px" }}>
                            {lugar.nombre}
                          </h4>
                          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                            {lugar.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. PESTAÑA ACTIVIDADES */}
        {activeTab === "actividades" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              🎉 Fiestas Patronales, Eventos y Tradiciones
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {dept.actividades.map((act, idx) => (
                <div key={idx} style={{
                  background: "linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(15, 23, 42, 0.85) 100%)",
                  border: "1.5px solid rgba(255, 215, 0, 0.3)",
                  borderRadius: "20px",
                  padding: "24px"
                }}>
                  <span style={{
                    display: "inline-block",
                    background: "#FFD700",
                    color: "#0A192F",
                    padding: "4px 12px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    fontSize: "12px",
                    marginBottom: "12px"
                  }}>
                    📅 {act.fecha}
                  </span>

                  <h3 style={{ fontSize: "19px", fontWeight: "900", color: "#FFFFFF", margin: "0 0 8px" }}>
                    {act.nombre}
                  </h3>

                  <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                    {act.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
      </div>
    </div>
  );
}
