"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";
import DepartmentTabs from "@/components/ui/DepartmentTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { DEPARTAMENTOS_DATA } from "@/data/departamentos-data";

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
            <span>Volver a la Enciclopedia</span>
          </Link>
        </div>
      </div>
    );
  }

  const regionColor = dept.region === "Pacífico" ? "#38BDF8" : dept.region === "Central" ? "#10B981" : "#F59E0B";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A192F", color: "#FFFFFF", fontFamily: "var(--font-outfit), sans-serif" }}>
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

      {/* Navegación por Pestañas */}
      <DepartmentTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Contenido de la Pestaña Seleccionada */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* 1. PESTAÑA HISTORIA */}
        {activeTab === "historia" && (
          <div className="animate-fade-in">
            <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: "24px", padding: "32px", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#FFD700", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                📜 Resumen Histórico de {dept.nombre}
              </h2>
              <p style={{ fontSize: "16px", lineHeight: "1.8", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                {dept.historia.resumen}
              </p>
            </div>

            {/* Timeline de Hitos */}
            {dept.historia.hitos && dept.historia.hitos.length > 0 && (
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#FFFFFF", marginBottom: "20px" }}>
                  ⏳ Hitos Históricos Fundamentales
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
                  {dept.historia.hitos.map((hito, idx) => (
                    <div key={idx} style={{
                      background: "linear-gradient(135deg, rgba(20, 109, 158, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)",
                      border: "1px solid rgba(20, 109, 158, 0.3)",
                      borderRadius: "18px",
                      padding: "20px"
                    }}>
                      <span style={{ fontSize: "22px", fontWeight: "900", color: "#FFD700", display: "block", marginBottom: "6px" }}>
                        {hito.año}
                      </span>
                      <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                        {hito.evento}
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              {dept.lugaresImportantes.map((lugar, idx) => (
                <div key={idx} style={{
                  background: "rgba(15, 23, 42, 0.75)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
                }}>
                  <div style={{
                    height: "160px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, rgba(20, 109, 158, 0.4) 0%, rgba(10, 25, 47, 0.8) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }}>
                    <span style={{ fontSize: "42px" }}>🏛️</span>
                  </div>

                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFD700", margin: "0 0 8px" }}>
                    {lugar.nombre}
                  </h3>
                  <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                    {lugar.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. PESTAÑA ACTIVIDADES */}
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
  );
}
