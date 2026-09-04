"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";
import { uploadMedia } from "@/lib/storage";

const DEPARTAMENTOS_LIST = [
  "León", "Granada", "Rivas", "Masaya", "Matagalpa", "Jinotega", "Estelí",
  "Managua", "Chinandega", "Carazo", "Madriz", "Nueva Segovia", "Boaco",
  "Chontales", "Río San Juan", "RACCN", "RACCS"
];

const ESPECIALIDADES_LIST = [
  "Senderismo y Volcanes",
  "Cultura e Historia",
  "Avistamiento de Aves",
  "Ecoturismo Integral",
  "Gastronomía Tradicional",
  "Deportes Acuáticos & Surf",
  "Fotografía de Naturaleza"
];

export default function PerfilGuiaPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const { session: authSession, perfil: authPerfil, loading: authLoading } = useAuth();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab activa ("info" | "galeria" | "mapa_destinos")
  const [activeTab, setActiveTab] = useState("info");

  // Form states del guía
  const [guiaDeptPrincipal, setGuiaDeptPrincipal] = useState("León");
  const [guiaEspecialidad, setGuiaEspecialidad] = useState("Senderismo y Volcanes");
  const [guiaIdiomas, setGuiaIdiomas] = useState("Español, Inglés");
  const [guiaExperiencia, setGuiaExperiencia] = useState(5);
  const [guiaTarifa, setGuiaTarifa] = useState("$25 - $40 / día");
  const [guiaBiografia, setGuiaBiografia] = useState("");
  const [guiaWhatsapp, setGuiaWhatsapp] = useState("");
  const [guiaInstagram, setGuiaInstagram] = useState("");
  const [guiaLicencia, setGuiaLicencia] = useState("");
  const [guiaGaleria, setGuiaGaleria] = useState([]);
  const [guiaDestinosMapa, setGuiaDestinosMapa] = useState([]);

  // Form states para agregar nuevo destino de mapa
  const [showAddDestForm, setShowAddDestForm] = useState(false);
  const [newDestNombre, setNewDestNombre] = useState("");
  const [newDestCategoria, setNewDestCategoria] = useState("Senderismo");
  const [newDestIcono, setNewDestIcono] = useState("🌋");
  const [newDestDept, setNewDestDept] = useState("León");
  const [newDestDesc, setNewDestDesc] = useState("");

  const [uploadingTravesiaFoto, setUploadingTravesiaFoto] = useState(false);
  const [savingGuia, setSavingGuia] = useState(false);
  const [saveSuccessAlert, setSaveSuccessAlert] = useState(false);
  const travesiaFotoInputRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!authSession) {
      router.push("/login");
      return;
    }

    const fetchGuiaData = async () => {
      try {
        setSession(authSession);
        const currentUser = authSession.user;
        setUser(currentUser);

        let perfilData = authPerfil;
        if (!perfilData) {
          const { data } = await supabase
            .from("perfiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();
          perfilData = data;
        }
        setPerfil(perfilData);

        // Cargar datos de guía desde Supabase
        const { data: gData } = await supabase
          .from("guias_turisticos")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (gData) {
          setGuiaDeptPrincipal(gData.departamento_principal || "León");
          setGuiaEspecialidad(gData.especialidad || "Senderismo y Volcanes");
          setGuiaIdiomas(gData.idiomas || "Español, Inglés");
          setGuiaExperiencia(gData.experiencia_anios || 5);
          setGuiaTarifa(gData.tarifa_aprox || "$25 - $40 / día");
          setGuiaBiografia(gData.biografia || "");
          setGuiaWhatsapp(gData.whatsapp || gData.telefono_contacto || "");
          setGuiaInstagram(gData.instagram || "");
          setGuiaLicencia(gData.licencia_intur || "");
          setGuiaGaleria(gData.galeria_fotos || []);
          setGuiaDestinosMapa(gData.destinos_mapa || []);
        } else {
          // Prepopulado inicial si coincide con guía de prueba (ej: Carlos Mendoza Silva)
          const nameLower = (perfilData?.nombre_completo || currentUser.user_metadata?.nombre_completo || "").toLowerCase();
          if (nameLower.includes("carlos") && nameLower.includes("mendoza")) {
            setGuiaDeptPrincipal("León");
            setGuiaEspecialidad("Senderismo y Volcanes");
            setGuiaIdiomas("Español, Inglés");
            setGuiaExperiencia(8);
            setGuiaTarifa("$30 - $50 / día");
            setGuiaWhatsapp("+505 8899 1122");
            setGuiaInstagram("@carlos_volcano_tours");
            setGuiaLicencia("INTUR-LE-2018-941");
            setGuiaBiografia("Guía nativo de León con más de 8 años guiando excursiones al Cerro Negro (Sandboarding), Volcán Momotombo y Telica. Especialista en vulcanología de la Cordillera de los Maribios y primeros auxilios de montaña.");
            setGuiaGaleria([
              "/images/galeria-departamentos/leon/1.1.jpg",
              "/images/galeria-departamentos/leon/2.jpg",
              "/images/galeria-departamentos/leon/3.jpg",
              "/images/galeria-departamentos/leon/4.jpg"
            ]);
            setGuiaDestinosMapa([
              { id: "dest-1", nombre: "Volcán Cerro Negro", categoria: "Sandboarding", icono: "🌋", deptSlug: "leon", departamento: "León", imagen: "/images/galeria-departamentos/leon/1.1.jpg", desc: "Ascenso directo al volcán más joven de Centroamérica y vertiginoso descenso en tabla de sandboard sobre arena volcánica." },
              { id: "dest-2", nombre: "Catedral de León", categoria: "Patrimonio UNESCO", icono: "🏛️", deptSlug: "leon", departamento: "León", imagen: "/images/galeria-departamentos/leon/2.jpg", desc: "La catedral más grande de Centroamérica. Recorrido histórico por sus cúpulas blancas y cripta colonial." },
              { id: "dest-3", nombre: "Volcán Telica (Lava Nocturna)", categoria: "Senderismo", icono: "🔥", deptSlug: "leon", departamento: "León", imagen: "/images/galeria-departamentos/leon/3.jpg", desc: "Excursión nocturna a la cumbre para contemplar la lava incandescente en las profundidades del cráter activo." }
            ]);
          } else {
            setGuiaBiografia("Guía turístico apasionado por mostrar las maravillas naturales, volcanes y cultura colonial de Nicaragua.");
          }
        }
      } catch (err) {
        console.warn("Notice: fetch profile/guide info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuiaData();
  }, [authSession, authLoading, authPerfil, router]);

  const handleUploadTravesiaFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingTravesiaFoto(true);
    try {
      const publicUrl = await uploadMedia(file, "galeria_guias");
      const updatedGaleria = [...guiaGaleria, publicUrl];
      setGuiaGaleria(updatedGaleria);

      if (user?.id) {
        await supabase.from("guias_turisticos").upsert({
          id: user.id,
          galeria_fotos: updatedGaleria,
        });
      }
    } catch (err) {
      console.error("Error uploading tour photo:", err);
      alert(lang === "en" ? "Failed to upload photo" : "Error al subir la foto de travesía");
    } finally {
      setUploadingTravesiaFoto(false);
    }
  };

  const handleRemoveTravesiaFoto = (indexToRemove) => {
    const updated = guiaGaleria.filter((_, idx) => idx !== indexToRemove);
    setGuiaGaleria(updated);
    if (user?.id) {
      supabase.from("guias_turisticos").upsert({
        id: user.id,
        galeria_fotos: updated,
      }).then();
    }
  };

  const handleAddDestinoMapa = (e) => {
    e.preventDefault();
    if (!newDestNombre.trim()) return;
    const newDest = {
      id: "dest-" + Date.now(),
      nombre: newDestNombre.trim(),
      categoria: newDestCategoria,
      icono: newDestIcono,
      deptSlug: newDestDept.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"),
      departamento: newDestDept,
      desc: newDestDesc.trim() || "Punto de interés turístico guiado."
    };
    const updated = [...guiaDestinosMapa, newDest];
    setGuiaDestinosMapa(updated);
    if (user?.id) {
      supabase.from("guias_turisticos").upsert({
        id: user.id,
        destinos_mapa: updated,
      }).then();
    }
    setNewDestNombre("");
    setNewDestDesc("");
    setShowAddDestForm(false);
  };

  const handleRemoveDestinoMapa = (destId) => {
    const updated = guiaDestinosMapa.filter(d => d.id !== destId);
    setGuiaDestinosMapa(updated);
    if (user?.id) {
      supabase.from("guias_turisticos").upsert({
        id: user.id,
        destinos_mapa: updated,
      }).then();
    }
  };

  const handleSaveGuiaProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingGuia(true);
    setSaveSuccessAlert(false);
    try {
      const { error } = await supabase.from("guias_turisticos").upsert({
        id: user.id,
        nombre_completo: perfil?.nombre_completo || user.user_metadata?.nombre_completo || "Guía Atlan",
        avatar_url: perfil?.avatar_url || user.user_metadata?.avatar_url || "/images/perfil.svg",
        departamento_principal: guiaDeptPrincipal,
        especialidad: guiaEspecialidad,
        idiomas: guiaIdiomas,
        experiencia_anios: Number(guiaExperiencia),
        tarifa_aprox: guiaTarifa,
        biografia: guiaBiografia,
        telefono_contacto: guiaWhatsapp,
        whatsapp: guiaWhatsapp,
        instagram: guiaInstagram,
        licencia_intur: guiaLicencia,
        galeria_fotos: guiaGaleria,
        destinos_mapa: guiaDestinosMapa,
        activo: true,
      });

      if (error) throw error;

      setSaveSuccessAlert(true);
      setTimeout(() => setSaveSuccessAlert(false), 4000);
    } catch (err) {
      console.error("Error saving guide profile:", err);
      alert(lang === "en" ? "Error updating guide profile" : "Error al guardar el perfil de guía: " + (err.message || ""));
    } finally {
      setSavingGuia(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--atlan-bg-primary)" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(14, 165, 233, 0.2)", borderTopColor: "#0EA5E9", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--atlan-bg-primary)",
      color: "var(--atlan-text-primary)",
      paddingBottom: "60px",
      fontFamily: "var(--font-outfit), sans-serif",
      position: "relative"
    }}>
      <Navbar activePage="guias" session={session} perfil={perfil} />

      {/* CONTENEDOR PRINCIPAL */}
      <div style={{
        maxWidth: "1320px",
        margin: "85px auto 0",
        padding: "0 24px",
        position: "relative",
        zIndex: 1
      }}>
        
        {/* BANNER ENCABEZADO PANEL DE GUÍA */}
        <div style={{
          background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)",
          borderRadius: "24px",
          padding: "24px 28px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 12px 30px rgba(10, 25, 47, 0.25)",
          border: "2px solid rgba(255, 255, 255, 0.95)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(2, 132, 199, 0.1) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(56, 189, 248, 0.3)"
            }}>
              <Icon name="compass" size={28} color="#38BDF8" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <span style={{ background: "rgba(14, 165, 233, 0.2)", color: "#38BDF8", fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "6px" }}>
                  PANEL DE GUÍA TURÍSTICO
                </span>
                {guiaLicencia && (
                  <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "6px" }}>
                    ✓ CERTIFICADO INTUR
                  </span>
                )}
              </div>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "900", color: "#FFFFFF" }}>
                {perfil?.nombre_completo || "Guía Turístico Atlan"}
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#94A3B8" }}>
                {lang === "en" ? "Manage your tour info, map destinations, and expedition gallery." : "Gestiona tu información de guía, lugares en el mapa y fotos que verán los turistas."}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/guias"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "9px 16px",
                borderRadius: "12px",
                fontSize: "12.5px",
                fontWeight: "750",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Icon name="globe" size={14} />
              <span>{lang === "en" ? "View Public Guide Directory" : "Ver Directorio de Guías"}</span>
            </Link>
            
            <Link
              href="/perfil"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "9px 16px",
                borderRadius: "12px",
                fontSize: "12.5px",
                fontWeight: "750",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Icon name="user" size={14} />
              <span>{lang === "en" ? "My Personal Account" : "Mi Cuenta Personal"}</span>
            </Link>
          </div>
        </div>

        {/* ALERTA GUARDADO ÉXITO */}
        {saveSuccessAlert && (
          <div style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1.5px solid #10B981",
            color: "#10B981",
            padding: "12px 18px",
            borderRadius: "14px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13.5px",
            fontWeight: "800"
          }}>
            <Icon name="checkCircle" size={18} color="#10B981" />
            <span>{lang === "en" ? "Guide profile updated successfully!" : "¡Perfil de Guía Turístico guardado y actualizado con éxito!"}</span>
          </div>
        )}

        {/* LAYOUT DE 2 COLUMNAS (TARJETA LATERAL 310px + DASHBOARD PESTAÑAS 1FR) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "310px 1fr",
          gap: "28px",
          alignItems: "start"
        }}>
          
          {/* COLUMNA IZQUIERDA: RESUMEN DEL PERFIL DEL GUÍA */}
          <div>
            <div style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              border: "2px solid rgba(255, 255, 255, 0.95)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
              overflow: "hidden",
              padding: "24px",
              textAlign: "center"
            }}>
              <div style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: perfil?.avatar_url
                  ? `url(${perfil.avatar_url}) center/cover`
                  : "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                margin: "0 auto 12px",
                border: "3.5px solid #0EA5E9",
                boxShadow: "0 6px 18px rgba(14, 165, 233, 0.25)"
              }} />

              <h3 style={{ margin: "0 0 2px", fontSize: "18px", fontWeight: "900", color: "#1A1A2E" }}>
                {perfil?.nombre_completo || "Guía Atlan"}
              </h3>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(14, 165, 233, 0.1)", color: "#0EA5E9", fontSize: "11.5px", fontWeight: "800", padding: "3px 10px", borderRadius: "12px", marginBottom: "14px" }}>
                <Icon name="mapPin" size={12} color="#0EA5E9" />
                <span>{guiaDeptPrincipal}</span>
              </div>

              {/* Estadísticas Rápidas del Guía */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(30, 41, 59, 0.04)", padding: "12px", borderRadius: "14px", marginBottom: "16px", textAlign: "left" }}>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: "700", display: "block" }}>ESPECIALIDAD</span>
                  <span style={{ fontSize: "12px", color: "#1A1A2E", fontWeight: "800" }}>{guiaEspecialidad}</span>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: "700", display: "block" }}>TARIFA</span>
                  <span style={{ fontSize: "12px", color: "#10B981", fontWeight: "800" }}>{guiaTarifa}</span>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: "700", display: "block" }}>FOTOS DE TRAVESÍAS</span>
                  <span style={{ fontSize: "12px", color: "#0EA5E9", fontWeight: "800" }}>{guiaGaleria.length} fotos</span>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: "700", display: "block" }}>DESTINOS MAPA</span>
                  <span style={{ fontSize: "12px", color: "#0EA5E9", fontWeight: "800" }}>{guiaDestinosMapa.length} lugares</span>
                </div>
              </div>

              {/* WhatsApp rápido */}
              {guiaWhatsapp && (
                <a
                  href={`https://wa.me/${guiaWhatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px",
                    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                    color: "#FFFFFF",
                    fontWeight: "800",
                    fontSize: "12.5px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(37, 211, 102, 0.25)"
                  }}
                >
                  <Icon name="whatsapp" size={16} color="#FFFFFF" />
                  <span>WhatsApp: {guiaWhatsapp}</span>
                </a>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: PESTAÑAS Y DASHBOARD DE CONFIGURACIÓN */}
          <div>
            {/* PESTAÑAS DE ADMINISTRACIÓN */}
            <div style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              flexWrap: "wrap"
            }}>
              <button
                onClick={() => setActiveTab("info")}
                style={{
                  padding: "10px 16px",
                  borderRadius: "14px",
                  border: "none",
                  background: activeTab === "info" ? "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)" : "#FFFFFF",
                  color: activeTab === "info" ? "#FFFFFF" : "#1A1A2E",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: activeTab === "info" ? "0 4px 14px rgba(14, 165, 233, 0.3)" : "0 2px 8px rgba(0,0,0,0.05)"
                }}
              >
                <Icon name="user" size={15} color={activeTab === "info" ? "#FFFFFF" : "#0EA5E9"} />
                <span>1. Datos del Guía</span>
              </button>

              <button
                onClick={() => setActiveTab("galeria")}
                style={{
                  padding: "10px 16px",
                  borderRadius: "14px",
                  border: "none",
                  background: activeTab === "galeria" ? "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)" : "#FFFFFF",
                  color: activeTab === "galeria" ? "#FFFFFF" : "#1A1A2E",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: activeTab === "galeria" ? "0 4px 14px rgba(14, 165, 233, 0.3)" : "0 2px 8px rgba(0,0,0,0.05)"
                }}
              >
                <Icon name="image" size={15} color={activeTab === "galeria" ? "#FFFFFF" : "#0EA5E9"} />
                <span>2. Fotos de Travesías ({guiaGaleria.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("mapa_destinos")}
                style={{
                  padding: "10px 16px",
                  borderRadius: "14px",
                  border: "none",
                  background: activeTab === "mapa_destinos" ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" : "#FFFFFF",
                  color: activeTab === "mapa_destinos" ? "#FFFFFF" : "#1A1A2E",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: activeTab === "mapa_destinos" ? "0 4px 14px rgba(16, 185, 129, 0.3)" : "0 2px 8px rgba(0,0,0,0.05)"
                }}
              >
                <span>🗺️</span>
                <span>3. Lugares en el Mapa ({guiaDestinosMapa.length})</span>
              </button>
            </div>

            {/* CONTENIDO PESTAÑA 1: DATOS E INFORMACIÓN DEL GUÍA */}
            {activeTab === "info" && (
              <form onSubmit={handleSaveGuiaProfile} style={{
                background: "#FFFFFF",
                borderRadius: "24px",
                border: "2px solid rgba(255, 255, 255, 0.95)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "900", color: "#0A192F" }}>
                  Información y Credenciales del Guía Turístico
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                      Departamento Principal de Operación:
                    </label>
                    <select
                      value={guiaDeptPrincipal}
                      onChange={(e) => setGuiaDeptPrincipal(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                    >
                      {DEPARTAMENTOS_LIST.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                      Especialidad Principal:
                    </label>
                    <select
                      value={guiaEspecialidad}
                      onChange={(e) => setGuiaEspecialidad(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                    >
                      {ESPECIALIDADES_LIST.map(esp => (
                        <option key={esp} value={esp}>{esp}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                      Idiomas que hablas:
                    </label>
                    <input
                      type="text"
                      value={guiaIdiomas}
                      onChange={(e) => setGuiaIdiomas(e.target.value)}
                      placeholder="Español, Inglés, Francés..."
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                      Años de Experiencia:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={guiaExperiencia}
                      onChange={(e) => setGuiaExperiencia(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                      Tarifa Aprox (/día):
                    </label>
                    <input
                      type="text"
                      value={guiaTarifa}
                      onChange={(e) => setGuiaTarifa(e.target.value)}
                      placeholder="$30 - $50 / día"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                      Número de WhatsApp de Contacto:
                    </label>
                    <input
                      type="text"
                      value={guiaWhatsapp}
                      onChange={(e) => setGuiaWhatsapp(e.target.value)}
                      placeholder="+505 8888 8888"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                      Número de Licencia INTUR (Opcional):
                    </label>
                    <input
                      type="text"
                      value={guiaLicencia}
                      onChange={(e) => setGuiaLicencia(e.target.value)}
                      placeholder="Ej. INTUR-LE-2024-99"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                    Biografía y Presentación para Turistas:
                  </label>
                  <textarea
                    rows={4}
                    value={guiaBiografia}
                    onChange={(e) => setGuiaBiografia(e.target.value)}
                    placeholder="Describe tus especialidades, volcanes que recorres, equipamiento de seguridad y lo que incluye tu guía..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13px", resize: "none" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button
                    type="submit"
                    disabled={savingGuia}
                    style={{
                      padding: "11px 24px",
                      borderRadius: "12px",
                      border: "none",
                      background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                      color: "#FFFFFF",
                      fontWeight: "800",
                      fontSize: "13.5px",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(14, 165, 233, 0.3)"
                    }}
                  >
                    {savingGuia ? "Guardando..." : "Guardar Información de Guía"}
                  </button>
                </div>
              </form>
            )}

            {/* CONTENIDO PESTAÑA 2: FOTOS DE TRAVESÍAS */}
            {activeTab === "galeria" && (
              <div style={{
                background: "#FFFFFF",
                borderRadius: "24px",
                border: "2px solid rgba(255, 255, 255, 0.95)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                padding: "24px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "900", color: "#0A192F" }}>
                      Galería de Fotos de Travesías y Excursiones
                    </h3>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>
                      Las fotos que subas aparecerán en la tira lateral de tu tarjeta y en tu modal público.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={travesiaFotoInputRef}
                    accept="image/*"
                    onChange={handleUploadTravesiaFoto}
                    style={{ display: "none" }}
                  />

                  <button
                    type="button"
                    onClick={() => !uploadingTravesiaFoto && travesiaFotoInputRef.current?.click()}
                    disabled={uploadingTravesiaFoto}
                    style={{ background: "#0284C7", color: "#FFF", border: "none", padding: "8px 16px", borderRadius: "10px", fontSize: "12.5px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Icon name="plus" size={14} />
                    <span>{uploadingTravesiaFoto ? "Subiendo..." : "Agregar Foto de Travesía"}</span>
                  </button>
                </div>

                {guiaGaleria.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(14, 165, 233, 0.04)", border: "1.5px dashed rgba(14, 165, 233, 0.3)", borderRadius: "16px" }}>
                    <Icon name="image" size={36} color="#94A3B8" />
                    <p style={{ fontSize: "13px", color: "#64748B", fontWeight: "700", marginTop: "8px" }}>
                      Aún no has subido fotos de tus travesías.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
                    {guiaGaleria.map((url, idx) => (
                      <div key={idx} style={{ position: "relative", width: "100%", height: "120px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
                        <img src={url} alt={`Travesía ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveTravesiaFoto(idx)}
                          style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(239, 68, 68, 0.9)", color: "#FFF", border: "none", width: "26px", height: "26px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Eliminar foto"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTENIDO PESTAÑA 3: LUGARES Y DESTINOS DE TOURS EN EL MAPA */}
            {activeTab === "mapa_destinos" && (
              <div style={{
                background: "#FFFFFF",
                borderRadius: "24px",
                border: "2px solid rgba(255, 255, 255, 0.95)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                padding: "24px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "900", color: "#0A192F", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🗺️</span>
                      <span>Lugares y Destinos de Tours en el Mapa</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>
                      Agrega los sitios turísticos exactos donde realizas tours para que los turistas los vean en tu tarjeta y perfil.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddDestForm(!showAddDestForm)}
                    style={{ background: "#10B981", color: "#FFF", border: "none", padding: "8px 16px", borderRadius: "10px", fontSize: "12.5px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Icon name={showAddDestForm ? "x" : "plus"} size={14} />
                    <span>{showAddDestForm ? "Cancelar" : "Agregar Nuevo Destino"}</span>
                  </button>
                </div>

                {/* Formulario Inline para Agregar Nuevo Destino */}
                {showAddDestForm && (
                  <form onSubmit={handleAddDestinoMapa} style={{ background: "rgba(16, 185, 129, 0.05)", border: "1.5px solid rgba(16, 185, 129, 0.25)", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                          Nombre del Sitio o Destino:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Volcán Cerro Negro"
                          value={newDestNombre}
                          onChange={(e) => setNewDestNombre(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                          Departamento:
                        </label>
                        <select
                          value={newDestDept}
                          onChange={(e) => setNewDestDept(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                        >
                          {DEPARTAMENTOS_LIST.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                          Categoría del Tour:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Sandboarding / Senderismo"
                          value={newDestCategoria}
                          onChange={(e) => setNewDestCategoria(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                          Ícono o Emoji:
                        </label>
                        <select
                          value={newDestIcono}
                          onChange={(e) => setNewDestIcono(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                        >
                          <option value="🌋">🌋 Volcán</option>
                          <option value="🏛️">🏛️ Historia / Cultura</option>
                          <option value="🏝️">🏝️ Isla / Náutica</option>
                          <option value="⛰️">⛰️ Montañismo</option>
                          <option value="🌿">🌿 Ecoturismo</option>
                          <option value="🦜">🦜 Avistamiento Aves</option>
                          <option value="🏖️">🏖️ Playa / Surf</option>
                          <option value="💧">💧 Manantial / Cascada</option>
                          <option value="🔥">🔥 Lava Nocturna</option>
                          <option value="🎭">🎭 Artesanía / Gastronomía</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                        Descripción Corta del Tour en este lugar:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Ascenso y vertiginoso descenso en tabla de sandboard sobre arena volcánica..."
                        value={newDestDesc}
                        onChange={(e) => setNewDestDesc(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="submit"
                        disabled={!newDestNombre.trim()}
                        style={{ background: "#10B981", color: "#FFF", border: "none", padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "800", cursor: "pointer" }}
                      >
                        Guardar Destino de Mapa
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de Destinos Creados */}
                {guiaDestinosMapa.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(16, 185, 129, 0.04)", border: "1.5px dashed rgba(16, 185, 129, 0.3)", borderRadius: "16px" }}>
                    <span style={{ fontSize: "36px" }}>🗺️</span>
                    <p style={{ fontSize: "13px", color: "#64748B", fontWeight: "700", marginTop: "8px" }}>
                      Aún no has agregado destinos de mapa a tu perfil de guía.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                    {guiaDestinosMapa.map((dest) => (
                      <div
                        key={dest.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1.5px solid rgba(16, 185, 129, 0.25)",
                          borderRadius: "14px",
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "20px" }}>{dest.icono}</span>
                              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#0A192F" }}>{dest.nombre}</h4>
                            </div>
                            <span style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0EA5E9", fontSize: "10.5px", fontWeight: "800", padding: "2px 8px", borderRadius: "6px" }}>
                              {dest.departamento}
                            </span>
                          </div>
                          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748B", lineHeight: "1.4" }}>
                            {dest.desc}
                          </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#10B981" }}>{dest.categoria}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDestinoMapa(dest.id)}
                            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: "750", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <Icon name="trash" size={12} />
                            <span>Quitar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
