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

const TARIFAS_LIST = [
  "$15 - $25 / día",
  "$25 - $40 / día",
  "$30 - $50 / día",
  "$50 - $75 / día",
  "$75 - $100 / día",
  "$100+ / día"
];

const IDIOMAS_OPCIONES = [
  "Español",
  "Inglés",
  "Francés",
  "Alemán",
  "Italiano",
  "Portugués"
];

const SERVICIOS_LIST = [
  "Equipamiento de Seguridad",
  "Primeros Auxilios de Montaña",
  "Transporte Incluido",
  "Fotos & Videos de Travesía",
  "Entradas a Áreas Protegidas",
  "Tours Privados / Personalizados",
  "Snacks & Hidratación",
  "Atención a Grupos Grandes"
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
  const [guiaTarifa, setGuiaTarifa] = useState("$30 - $50 / día");
  const [guiaServicios, setGuiaServicios] = useState([
    "Equipamiento de Seguridad",
    "Primeros Auxilios de Montaña",
    "Fotos & Videos de Travesía"
  ]);

  const toggleIdioma = (langName) => {
    const currentArray = guiaIdiomas
      ? guiaIdiomas.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    let updated;
    if (currentArray.includes(langName)) {
      updated = currentArray.filter(l => l !== langName);
      if (updated.length === 0) updated = ["Español"];
    } else {
      updated = [...currentArray, langName];
    }
    setGuiaIdiomas(updated.join(", "));
  };

  const toggleServicio = (servicioName) => {
    if (guiaServicios.includes(servicioName)) {
      setGuiaServicios(guiaServicios.filter(s => s !== servicioName));
    } else {
      setGuiaServicios([...guiaServicios, servicioName]);
    }
  };
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
        <div style={{ width: "36px", height: "36px", border: "3px solid rgba(14, 165, 233, 0.2)", borderTopColor: "#0EA5E9", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh",
      maxHeight: "100vh",
      background: "var(--atlan-bg-primary, #F8FAFC)",
      color: "var(--atlan-text-primary, #1E293B)",
      fontFamily: "var(--font-outfit), sans-serif",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      <Navbar activePage="guias" session={session} perfil={perfil} />

      {/* CONTENEDOR PRINCIPAL CERO SCROLL (100% SINGLE VIEWPORT) */}
      <div style={{
        flex: 1,
        maxWidth: "1400px",
        width: "100%",
        margin: "64px auto 0",
        padding: "10px 16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        overflow: "hidden"
      }}>
        
        {/* BANNER + PESTAÑAS INTEGRADAS EN UNA SOLA BARRA COMPACTA */}
        <div style={{
          background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)",
          borderRadius: "14px",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "nowrap",
          boxShadow: "0 6px 20px rgba(10, 25, 47, 0.18)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          flexShrink: 0
        }}>
          {/* LADO IZQUIERDO: TÍTULO E IDENTIDAD GUÍA */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(2, 132, 199, 0.1) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              flexShrink: 0
            }}>
              <Icon name="compass" size={18} color="#38BDF8" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ background: "rgba(14, 165, 233, 0.2)", color: "#38BDF8", fontSize: "9.5px", fontWeight: "800", padding: "1px 5px", borderRadius: "4px" }}>
                  PANEL GUÍA
                </span>
                {guiaLicencia && (
                  <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontSize: "9.5px", fontWeight: "800", padding: "1px 5px", borderRadius: "4px" }}>
                    ✓ INTUR
                  </span>
                )}
              </div>
              <h1 style={{ margin: 0, fontSize: "15px", fontWeight: "900", color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {perfil?.nombre_completo || "Guía Turístico Atlan"}
              </h1>
            </div>
          </div>

          {/* CENTRO: PESTAÑAS DENTRO DEL BANNER */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(255, 255, 255, 0.08)",
            padding: "3px",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.12)"
          }}>
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              style={{
                padding: "5px 11px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "info" ? "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)" : "transparent",
                color: activeTab === "info" ? "#FFFFFF" : "rgba(255,255,255,0.75)",
                fontWeight: "800",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.2s"
              }}
            >
              <Icon name="user" size={12} color={activeTab === "info" ? "#FFFFFF" : "rgba(255,255,255,0.75)"} />
              <span>1. Datos del Guía</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("galeria")}
              style={{
                padding: "5px 11px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "galeria" ? "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)" : "transparent",
                color: activeTab === "galeria" ? "#FFFFFF" : "rgba(255,255,255,0.75)",
                fontWeight: "800",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.2s"
              }}
            >
              <Icon name="image" size={12} color={activeTab === "galeria" ? "#FFFFFF" : "rgba(255,255,255,0.75)"} />
              <span>2. Fotos ({guiaGaleria.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("mapa_destinos")}
              style={{
                padding: "5px 11px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "mapa_destinos" ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" : "transparent",
                color: activeTab === "mapa_destinos" ? "#FFFFFF" : "rgba(255,255,255,0.75)",
                fontWeight: "800",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.2s"
              }}
            >
              <span style={{ fontSize: "11px" }}>🗺️</span>
              <span>3. Lugares ({guiaDestinosMapa.length})</span>
            </button>
          </div>

          {/* LADO DERECHO: ENLACES RÁPIDOS */}
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <Link
              href="/guias"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "5px 10px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: "750",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Icon name="globe" size={12} />
              <span>Directorio</span>
            </Link>

            <Link
              href="/perfil"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "5px 10px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: "750",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Icon name="user" size={12} />
              <span>Mi Perfil</span>
            </Link>
          </div>
        </div>

        {/* ALERTA DE ÉXITO */}
        {saveSuccessAlert && (
          <div style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1.5px solid #10B981",
            color: "#10B981",
            padding: "6px 12px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11.5px",
            fontWeight: "800",
            flexShrink: 0
          }}>
            <Icon name="checkCircle" size={14} color="#10B981" />
            <span>¡Perfil de Guía Turístico guardado y actualizado con éxito!</span>
          </div>
        )}

        {/* CONTENEDOR DE 2 COLUMNAS (ALTO EXACTO PARA FITEAR EN 1 SCREEN SIN SCROLL) */}
        <div style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "12px",
          alignItems: "stretch"
        }}>
          {/* COLUMNA IZQUIERDA: TARJETA RESUMEN GUÍA */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1.5px solid rgba(226, 232, 240, 0.8)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box"
          }}>
            <div>
              <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: perfil?.avatar_url
                    ? `url(${perfil.avatar_url}) center/cover`
                    : "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                  margin: "0 auto 8px",
                  border: "3px solid #0EA5E9",
                  boxShadow: "0 4px 14px rgba(14, 165, 233, 0.25)",
                  position: "relative"
                }}>
                  <div style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "#10B981",
                    border: "2px solid #FFFFFF"
                  }} title="Guía en línea" />
                </div>

                <h3 style={{ margin: "0 0 4px", fontSize: "15.5px", fontWeight: "900", color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {perfil?.nombre_completo || "Carlos Mendoza Silva"}
                </h3>

                <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(14, 165, 233, 0.1)", color: "#0EA5E9", fontSize: "11px", fontWeight: "800", padding: "3px 10px", borderRadius: "10px", marginBottom: "6px" }}>
                  <Icon name="mapPin" size={12} color="#0EA5E9" />
                  <span>{guiaDeptPrincipal}</span>
                </div>
              </div>

              {/* Grid 2x2 de Estadísticas */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                background: "rgba(241, 245, 249, 0.8)",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                marginBottom: "12px"
              }}>
                <div>
                  <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: "750", display: "block" }}>ESPECIALIDAD</span>
                  <span style={{ fontSize: "11.5px", color: "#1A1A2E", fontWeight: "800", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{guiaEspecialidad}</span>
                </div>
                <div>
                  <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: "750", display: "block" }}>TARIFA</span>
                  <span style={{ fontSize: "11.5px", color: "#10B981", fontWeight: "800", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{guiaTarifa}</span>
                </div>
                <div>
                  <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: "750", display: "block" }}>TRAVESÍAS</span>
                  <span style={{ fontSize: "11.5px", color: "#0EA5E9", fontWeight: "800", display: "block" }}>{guiaGaleria.length} fotos</span>
                </div>
                <div>
                  <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: "750", display: "block" }}>DESTINOS</span>
                  <span style={{ fontSize: "11.5px", color: "#0EA5E9", fontWeight: "800", display: "block" }}>{guiaDestinosMapa.length} lugares</span>
                </div>
              </div>

              {/* Distinctive INTUR badge */}
              {guiaLicencia && (
                <div style={{
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px"
                }}>
                  <Icon name="checkCircle" size={16} color="#10B981" />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: "10px", color: "#059669", fontWeight: "800", display: "block" }}>LICENCIA INTUR</span>
                    <span style={{ fontSize: "11.5px", color: "#065F46", fontWeight: "700", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{guiaLicencia}</span>
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp Acción */}
            {guiaWhatsapp && (
              <a
                href={`https://wa.me/${guiaWhatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  width: "100%",
                  padding: "9px 12px",
                  background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                  color: "#FFFFFF",
                  fontWeight: "800",
                  fontSize: "12px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  boxShadow: "0 3px 12px rgba(37, 211, 102, 0.25)",
                  boxSizing: "border-box"
                }}
              >
                <Icon name="whatsapp" size={15} color="#FFFFFF" />
                <span>WhatsApp: {guiaWhatsapp}</span>
              </a>
            )}
          </div>

          {/* COLUMNA DERECHA: PANEL DE CONTENIDO DE LA PESTAÑA ACTIVA */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1.5px solid rgba(226, 232, 240, 0.8)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            overflow: "hidden"
          }}>
            {/* PESTAÑA 1: DATOS DEL GUÍA */}
            {activeTab === "info" && (
              <form onSubmit={handleSaveGuiaProfile} style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                gap: "10px",
                boxSizing: "border-box",
                justifyContent: "space-between"
              }}>
                {/* ENCABEZADO DE LA SECCIÓN DE CONFIGURACIÓN */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, paddingBottom: "6px", borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: "#0A192F", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon name="edit" size={18} color="#0EA5E9" />
                      <span>Configuración del Perfil de Guía Turístico</span>
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#64748B" }}>
                      Información visible para los turistas en el directorio público y mapa interactivo.
                    </p>
                  </div>
                  <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Icon name="checkCircle" size={14} color="#10B981" />
                    <span>Perfil Verificado INTUR</span>
                  </div>
                </div>

                {/* CONTENIDO PRINCIPAL EN BLOQUES TIPO TARJETAS DASHBOARD */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0 }}>

                  {/* BLOQUE 1: DATOS CLAVE DE OPERACIÓN (2 FILAS X 2 COLUMNAS - TARIFA ABAJO DE ESPECIALIDAD!) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "9px 12px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Icon name="mapPin" size={14} color="#0EA5E9" />
                        <span>Departamento Principal</span>
                      </label>
                      <select
                        value={guiaDeptPrincipal}
                        onChange={(e) => setGuiaDeptPrincipal(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "7px", border: "1px solid #CBD5E1", fontSize: "12.5px", background: "#FFFFFF", fontWeight: "700", color: "#1E293B" }}
                      >
                        {DEPARTAMENTOS_LIST.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "9px 12px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Icon name="compass" size={14} color="#0EA5E9" />
                        <span>Especialidad Principal</span>
                      </label>
                      <select
                        value={guiaEspecialidad}
                        onChange={(e) => setGuiaEspecialidad(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "7px", border: "1px solid #CBD5E1", fontSize: "12.5px", background: "#FFFFFF", fontWeight: "700", color: "#1E293B" }}
                      >
                        {ESPECIALIDADES_LIST.map(esp => (
                          <option key={esp} value={esp}>{esp}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "9px 12px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Icon name="calendar" size={14} color="#0EA5E9" />
                        <span>Años de Experiencia</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={guiaExperiencia}
                        onChange={(e) => setGuiaExperiencia(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "7px", border: "1px solid #CBD5E1", fontSize: "12.5px", background: "#FFFFFF", fontWeight: "700", color: "#1E293B" }}
                      />
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "9px 12px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Icon name="tag" size={14} color="#10B981" />
                        <span>Rango de Tarifa (/día)</span>
                      </label>
                      <select
                        value={
                          TARIFAS_LIST.find(t => guiaTarifa && guiaTarifa.includes(t.split(" ")[0])) || guiaTarifa || "$30 - $50 / día"
                        }
                        onChange={(e) => setGuiaTarifa(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "7px", border: "1px solid #CBD5E1", fontSize: "12.5px", background: "#FFFFFF", fontWeight: "800", color: "#059669" }}
                      >
                        {TARIFAS_LIST.map(tOption => (
                          <option key={tOption} value={tOption}>{tOption}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* BLOQUE 2: IDIOMAS Y CONTACTO */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: "10px" }}>
                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "9px 12px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                        <Icon name="globe" size={14} color="#0EA5E9" />
                        <span>Idiomas que Dominas</span>
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {IDIOMAS_OPCIONES.map(langOpt => {
                          const isSelected = guiaIdiomas
                            ? guiaIdiomas.split(",").map(s => s.trim()).includes(langOpt)
                            : langOpt === "Español";
                          return (
                            <button
                              key={langOpt}
                              type="button"
                              onClick={() => toggleIdioma(langOpt)}
                              style={{
                                padding: "4px 9px",
                                borderRadius: "8px",
                                border: isSelected ? "1.5px solid #0EA5E9" : "1px solid #CBD5E1",
                                background: isSelected ? "rgba(14, 165, 233, 0.12)" : "#FFFFFF",
                                color: isSelected ? "#0284C7" : "#475569",
                                fontSize: "11.5px",
                                fontWeight: isSelected ? "800" : "600",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <span>{isSelected ? "✓" : "+"}</span>
                              <span>{langOpt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "9px 12px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Icon name="whatsapp" size={14} color="#25D366" />
                        <span>WhatsApp Directo</span>
                      </label>
                      <input
                        type="text"
                        value={guiaWhatsapp}
                        onChange={(e) => setGuiaWhatsapp(e.target.value)}
                        placeholder="+505 8888 8888"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "7px", border: "1px solid #CBD5E1", fontSize: "12.5px", background: "#FFFFFF", fontWeight: "700" }}
                      />
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "9px 12px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Icon name="shield" size={14} color="#10B981" />
                        <span>Licencia INTUR</span>
                      </label>
                      <input
                        type="text"
                        value={guiaLicencia}
                        onChange={(e) => setGuiaLicencia(e.target.value)}
                        placeholder="Ej. INTUR-LE-2024-99"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "7px", border: "1px solid #CBD5E1", fontSize: "12.5px", background: "#FFFFFF", fontWeight: "700" }}
                      />
                    </div>
                  </div>

                  {/* BLOQUE 3: SERVICIOS Y VENTAJAS INCLUIDAS EN TUS TOURS */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "9px 12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                      <Icon name="sparkles" size={14} color="#F59E0B" />
                      <span>Servicios Incluidos en tus Tours (Ventajas para Turistas)</span>
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {SERVICIOS_LIST.map(servicioOpt => {
                        const isInc = guiaServicios.includes(servicioOpt);
                        return (
                          <button
                            key={servicioOpt}
                            type="button"
                            onClick={() => toggleServicio(servicioOpt)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "8px",
                              border: isInc ? "1.5px solid #10B981" : "1px solid #CBD5E1",
                              background: isInc ? "rgba(16, 185, 129, 0.12)" : "#FFFFFF",
                              color: isInc ? "#047857" : "#64748B",
                              fontSize: "11.5px",
                              fontWeight: isInc ? "800" : "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              transition: "all 0.15s"
                            }}
                          >
                            <span>{isInc ? "✓" : "+"}</span>
                            <span>{servicioOpt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* BLOQUE 4: BIOGRAFÍA Y PRESENTACIÓN */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "80px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="fileText" size={14} color="#0EA5E9" />
                        <span>Biografía y Presentación Profesional</span>
                      </label>
                      <span style={{ fontSize: "10.5px", color: "#94A3B8", fontWeight: "700" }}>
                        {guiaBiografia.length} / 400 caracteres
                      </span>
                    </div>
                    <textarea
                      value={guiaBiografia}
                      onChange={(e) => setGuiaBiografia(e.target.value.slice(0, 400))}
                      placeholder="Escribe un resumen atractivo sobre tu trayectoria, rutas guiadas, volcanes que dominas y equipamiento de seguridad..."
                      style={{
                        width: "100%",
                        flex: 1,
                        minHeight: "65px",
                        padding: "8px 11px",
                        borderRadius: "8px",
                        border: "1px solid #CBD5E1",
                        fontSize: "12.5px",
                        lineHeight: "1.45",
                        resize: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        background: "#FFFFFF",
                        color: "#1E293B"
                      }}
                    />
                  </div>
                </div>

                {/* BARRA INFERIOR DE ACCIÓN */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px solid rgba(226, 232, 240, 0.8)", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11.5px", color: "#64748B", fontWeight: "700" }}>
                    <span>Idiomas: <strong style={{ color: "#0EA5E9" }}>{guiaIdiomas || "Español"}</strong></span>
                    <span>•</span>
                    <span>Servicios: <strong style={{ color: "#10B981" }}>{guiaServicios.length} incluidos</strong></span>
                  </div>

                  <button
                    type="submit"
                    disabled={savingGuia}
                    style={{
                      padding: "8px 22px",
                      borderRadius: "9px",
                      border: "none",
                      background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                      color: "#FFFFFF",
                      fontWeight: "800",
                      fontSize: "12.5px",
                      cursor: "pointer",
                      boxShadow: "0 3px 12px rgba(14, 165, 233, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Icon name="checkCircle" size={14} color="#FFFFFF" />
                    <span>{savingGuia ? "Guardando..." : "Guardar Cambios del Perfil"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* PESTAÑA 2: FOTOS TRAVESÍAS */}
            {activeTab === "galeria" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "900", color: "#0A192F" }}>
                      Galería de Fotos de Travesías y Excursiones
                    </h3>
                    <p style={{ margin: 0, fontSize: "10.5px", color: "#64748B" }}>
                      Fotos visibles para turistas en tu tarjeta y perfil.
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
                    style={{ background: "#0284C7", color: "#FFF", border: "none", padding: "5px 12px", borderRadius: "7px", fontSize: "11.5px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Icon name="plus" size={12} />
                    <span>{uploadingTravesiaFoto ? "Subiendo..." : "Agregar Foto"}</span>
                  </button>
                </div>

                {guiaGaleria.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(14, 165, 233, 0.03)", border: "1.5px dashed rgba(14, 165, 233, 0.25)", borderRadius: "12px" }}>
                    <Icon name="image" size={28} color="#94A3B8" />
                    <p style={{ fontSize: "11.5px", color: "#64748B", fontWeight: "700", marginTop: "4px" }}>
                      Aún no has subido fotos de tus travesías.
                    </p>
                  </div>
                ) : (
                  <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px", paddingRight: "4px" }}>
                    {guiaGaleria.map((url, idx) => (
                      <div key={idx} style={{ position: "relative", width: "100%", height: "85px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
                        <img src={url} alt={`Travesía ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveTravesiaFoto(idx)}
                          style={{ position: "absolute", top: "3px", right: "3px", background: "rgba(239, 68, 68, 0.9)", color: "#FFF", border: "none", width: "20px", height: "20px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Eliminar foto"
                        >
                          <Icon name="x" size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: LUGARES EN EL MAPA */}
            {activeTab === "mapa_destinos" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "900", color: "#0A192F", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>🗺️</span>
                      <span>Lugares y Destinos de Tours en el Mapa</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: "10.5px", color: "#64748B" }}>
                      Sitios donde ofreces tus servicios guiados.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddDestForm(!showAddDestForm)}
                    style={{ background: "#10B981", color: "#FFF", border: "none", padding: "5px 12px", borderRadius: "7px", fontSize: "11.5px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Icon name={showAddDestForm ? "x" : "plus"} size={12} />
                    <span>{showAddDestForm ? "Cancelar" : "Agregar Destino"}</span>
                  </button>
                </div>

                {/* Form Inline Agregar Destino */}
                {showAddDestForm && (
                  <form onSubmit={handleAddDestinoMapa} style={{ background: "rgba(16, 185, 129, 0.04)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "10px", padding: "10px", marginBottom: "8px", flexShrink: 0 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "6px" }}>
                      <div>
                        <label style={{ fontSize: "10px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "1px" }}>
                          Nombre del Sitio:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Volcán Cerro Negro"
                          value={newDestNombre}
                          onChange={(e) => setNewDestNombre(e.target.value)}
                          style={{ width: "100%", padding: "4px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "11px" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "10px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "1px" }}>
                          Departamento:
                        </label>
                        <select
                          value={newDestDept}
                          onChange={(e) => setNewDestDept(e.target.value)}
                          style={{ width: "100%", padding: "4px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "11px" }}
                        >
                          {DEPARTAMENTOS_LIST.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "6px" }}>
                      <div>
                        <label style={{ fontSize: "10px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "1px" }}>
                          Categoría:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Sandboarding"
                          value={newDestCategoria}
                          onChange={(e) => setNewDestCategoria(e.target.value)}
                          style={{ width: "100%", padding: "4px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "11px" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "10px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "1px" }}>
                          Ícono:
                        </label>
                        <select
                          value={newDestIcono}
                          onChange={(e) => setNewDestIcono(e.target.value)}
                          style={{ width: "100%", padding: "4px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "11px" }}
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

                    <div style={{ marginBottom: "6px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "1px" }}>
                        Descripción Corta:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Ascenso y descenso en tabla de sandboard..."
                        value={newDestDesc}
                        onChange={(e) => setNewDestDesc(e.target.value)}
                        style={{ width: "100%", padding: "4px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "11px" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="submit"
                        disabled={!newDestNombre.trim()}
                        style={{ background: "#10B981", color: "#FFF", border: "none", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                      >
                        Guardar Destino
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista Destinos Creados */}
                {guiaDestinosMapa.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(16, 185, 129, 0.03)", border: "1.5px dashed rgba(16, 185, 129, 0.25)", borderRadius: "12px" }}>
                    <span style={{ fontSize: "24px" }}>🗺️</span>
                    <p style={{ fontSize: "11.5px", color: "#64748B", fontWeight: "700", marginTop: "4px" }}>
                      Aún no has agregado destinos de mapa a tu perfil de guía.
                    </p>
                  </div>
                ) : (
                  <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px", paddingRight: "4px" }}>
                    {guiaDestinosMapa.map((dest) => (
                      <div
                        key={dest.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          borderRadius: "10px",
                          padding: "8px 10px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "4px", marginBottom: "2px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ fontSize: "14px" }}>{dest.icono}</span>
                              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "800", color: "#0A192F" }}>{dest.nombre}</h4>
                            </div>
                            <span style={{ background: "rgba(14, 165, 233, 0.12)", color: "#0EA5E9", fontSize: "9.5px", fontWeight: "800", padding: "1px 5px", borderRadius: "4px" }}>
                              {dest.departamento}
                            </span>
                          </div>
                          <p style={{ margin: "0 0 4px", fontSize: "10.5px", color: "#64748B", lineHeight: "1.3" }}>
                            {dest.desc}
                          </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                          <span style={{ fontSize: "9.5px", fontWeight: "700", color: "#10B981" }}>{dest.categoria}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDestinoMapa(dest.id)}
                            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "750", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                          >
                            <Icon name="trash" size={10} />
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

