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

// CATÁLOGO OFICIAL DE DESTINOS TURÍSTICOS Y LUGARES EN EL MAPA DE NICARAGUA
const CATALOGO_DESTINOS_MAPA = [
  // León
  { id: "dest-1", nombre: "Volcán Cerro Negro", categoria: "Sandboarding", icono: "🌋", deptSlug: "leon", departamento: "León", imagen: "/images/galeria-departamentos/leon/1.1.jpg", desc: "Ascenso directo al volcán más joven de Centroamérica y descenso en tabla sobre arena volcánica." },
  { id: "dest-2", nombre: "Catedral de León", categoria: "Patrimonio UNESCO", icono: "🏛️", deptSlug: "leon", departamento: "León", imagen: "/images/galeria-departamentos/leon/2.jpg", desc: "La catedral más grande de Centroamérica. Recorrido por sus cúpulas blancas y cripta colonial." },
  { id: "dest-3", nombre: "Volcán Telica (Lava Nocturna)", categoria: "Senderismo", icono: "🔥", deptSlug: "leon", departamento: "León", imagen: "/images/galeria-departamentos/leon/3.jpg", desc: "Excursión nocturna a la cumbre para contemplar la lava incandescente en el cráter activo." },
  { id: "dest-4", nombre: "Ruinas de León Viejo", categoria: "Historia UNESCO", icono: "🏛️", deptSlug: "leon", departamento: "León", imagen: "/images/galeria-departamentos/leon/4.jpg", desc: "Primer asentamiento colonial de León destruido por el volcán Momotombo en 1610." },
  { id: "dest-5", nombre: "Playa Las Peñitas & Poneloya", categoria: "Playa & Surf", icono: "🏖️", deptSlug: "leon", departamento: "León", imagen: "/images/galeria-departamentos/leon/5.jpg", desc: "Playas del Pacífico leonés famosas por sus puestas de sol, surf y reserva de manglares Isla Juan Venado." },
  { id: "dest-6", nombre: "Volcán Momotombo", categoria: "Montañismo", icono: "⛰️", deptSlug: "leon", departamento: "León", imagen: "/images/galeria-departamentos/leon/6.jpg", desc: "Ascenso técnico y desafiante al majestuoso cono perfecto del volcán Momotombo." },

  // Granada
  { id: "dest-7", nombre: "Isletas de Granada", categoria: "Naturaleza & Náutica", icono: "🏝️", deptSlug: "granada", departamento: "Granada", imagen: "/images/galeria-departamentos/granada/1.1.jpg", desc: "Travesía en lancha o kayak por las 365 islas de origen volcánico en el Lago Cocibolca." },
  { id: "dest-8", nombre: "Reserva Volcán Mombacho", categoria: "Ecoturismo", icono: "🌿", deptSlug: "granada", departamento: "Granada", imagen: "/images/galeria-departamentos/granada/2.jpg", desc: "Sendero por el bosque nuboso, cráteres extintos y vistas espectaculares de Granada." },
  { id: "dest-9", nombre: "Catedral de Granada & Centro Histórico", categoria: "Cultura e Historia", icono: "🏛️", deptSlug: "granada", departamento: "Granada", imagen: "/images/galeria-departamentos/granada/3.jpg", desc: "Recorrido por la arquitectura colonial, parque central e iglesia de la Merced." },

  // Masaya
  { id: "dest-10", nombre: "Parque Nacional Volcán Masaya", categoria: "Lava Nocturna", icono: "🔥", deptSlug: "masaya", departamento: "Masaya", imagen: "/images/galeria-departamentos/masaya/1.1.jpg", desc: "Observación directa del cráter Santiago y el impresionante lago de lava ardiente." },
  { id: "dest-11", nombre: "Mirador de Catarina & Laguna de Apoyo", categoria: "Ecoturismo", icono: "💧", deptSlug: "masaya", departamento: "Masaya", imagen: "/images/galeria-departamentos/masaya/2.jpg", desc: "Vistas panorámicas hacia la laguna cratérica de agua cristalina y mercados de artesanía." },
  { id: "dest-12", nombre: "Mercado de Artesanías de Masaya", categoria: "Gastronomía & Arte", icono: "🎭", deptSlug: "masaya", departamento: "Masaya", imagen: "/images/galeria-departamentos/masaya/3.jpg", desc: "Epicentro de la cultura artesanal, hamacas de hilo, madera tallada y bailes folclóricos." },

  // Rivas & Ometepe
  { id: "dest-13", nombre: "Isla de Ometepe (Concepción & Maderas)", categoria: "Ecoturismo & Volcanes", icono: "🌋", deptSlug: "rivas", departamento: "Rivas", imagen: "/images/galeria-departamentos/rivas/1.1.jpg", desc: "Mítica isla en forma de ocho formada por dos majestuosos volcanes en medio del lago." },
  { id: "dest-14", nombre: "Playa San Juan del Sur", categoria: "Playa & Surf", icono: "🏖️", deptSlug: "rivas", departamento: "Rivas", imagen: "/images/galeria-departamentos/rivas/2.jpg", desc: "Bahía costera icónica, centro del surf centroamericano y avistamiento de tortugas en La Flor." },
  { id: "dest-15", nombre: "Reserva Ojo de Agua", categoria: "Manantial Natural", icono: "💧", deptSlug: "rivas", departamento: "Rivas", imagen: "/images/galeria-departamentos/rivas/3.jpg", desc: "Piscinas naturales de agua volcánica medicinal rodeadas de exuberante selva tropical." },

  // Managua
  { id: "dest-16", nombre: "Puerto Salvador Allende & Malecón", categoria: "Turismo Urbano", icono: "🏛️", deptSlug: "managua", departamento: "Managua", imagen: "/images/departamentos/managua-hero.png", desc: "Malecón histórico a orillas del Lago Xolotlán con restaurantes y paseos en barco." },
  { id: "dest-17", nombre: "Reserva Laguna de Tiscapa", categoria: "Patrimonio & Ecoturismo", icono: "⛰️", deptSlug: "managua", departamento: "Managua", imagen: "/images/departamentos/managua-tiscapa.png", desc: "Mirador con la silueta de Sandino y laguna cratérica en el corazón de Managua." },

  // Matagalpa & Jinotega
  { id: "dest-18", nombre: "Reserva Selva Negra & Ruta del Café", categoria: "Agroturismo & Montaña", icono: "🌿", deptSlug: "matagalpa", departamento: "Matagalpa", imagen: "/images/departamentos/matagalpa-hero.png", desc: "Caminatas en el bosque de nebliselva y recorrido por haciendas cafetaleras tradicionales." },
  { id: "dest-19", nombre: "Cascada Blanca & Peñas Blancas", categoria: "Senderismo & Cascadas", icono: "💧", deptSlug: "matagalpa", departamento: "Matagalpa", imagen: "/images/departamentos/matagalpa-cascada.png", desc: "Imponentes saltos de agua y macizo boscoso de la Reserva de Biósfera Bosawás." },

  // Río San Juan & RACS
  { id: "dest-20", nombre: "Fortaleza de El Castillo & Río San Juan", categoria: "Historia & Selva", icono: "🏛️", deptSlug: "rio-san-juan", departamento: "Río San Juan", imagen: "/images/departamentos/rio-san-juan-fortaleza.png", desc: "Fortaleza colonial española a orillas del histórico río e itinerario a la Reserva Indio Maíz." },
  { id: "dest-21", nombre: "Corn Island (Little & Big Corn)", categoria: "Caribe & Buceo", icono: "🏖️", deptSlug: "raccs", departamento: "RACCS", imagen: "/images/departamentos/corn-island.png", desc: "Paraíso caribeño de agua turquesa, arrecifes de coral y cultura garífuna/creole." }
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

  // Filtros del catálogo de lugares en Tab 3
  const [searchDestinoQuery, setSearchDestinoQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("Todos");

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

  const toggleDestinoMapa = (destObj) => {
    const exists = guiaDestinosMapa.some(d => d.id === destObj.id || d.nombre.toLowerCase().trim() === destObj.nombre.toLowerCase().trim());
    let updated;
    if (exists) {
      updated = guiaDestinosMapa.filter(d => d.id !== destObj.id && d.nombre.toLowerCase().trim() !== destObj.nombre.toLowerCase().trim());
    } else {
      updated = [...guiaDestinosMapa, destObj];
    }
    setGuiaDestinosMapa(updated);

    // Guardar inmediatamente en LocalStorage / Supabase
    try {
      localStorage.setItem("atlan_guia_profile_global", JSON.stringify({ ...perfil, destinos_mapa: updated }));
    } catch (e) {}
    if (user?.id) {
      supabase.from("guias_turisticos").upsert({
        id: user.id,
        destinos_mapa: updated,
      }).then();
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

        // Cargar datos de guía desde Supabase o caché LocalStorage
        let gData = null;
        try {
          const { data } = await supabase
            .from("guias_turisticos")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();
          gData = data;
        } catch (e) {}

        let savedLocal = null;
        try {
          const rawLocal = localStorage.getItem("atlan_guia_profile_global") ||
            localStorage.getItem("atlan_guia_profile_" + currentUser.id) ||
            localStorage.getItem("atlan_guia_profile_carlos");
          if (rawLocal) savedLocal = JSON.parse(rawLocal);
        } catch (e) {}

        const activeData = gData || savedLocal;

        if (activeData) {
          if (activeData.departamento_principal) setGuiaDeptPrincipal(activeData.departamento_principal);
          if (activeData.especialidad) setGuiaEspecialidad(activeData.especialidad);
          if (activeData.idiomas) setGuiaIdiomas(activeData.idiomas);
          if (activeData.experiencia_anios) setGuiaExperiencia(activeData.experiencia_anios);
          if (activeData.tarifa_aprox) setGuiaTarifa(activeData.tarifa_aprox);
          if (activeData.biografia !== undefined) setGuiaBiografia(activeData.biografia);
          if (activeData.whatsapp || activeData.telefono_contacto) setGuiaWhatsapp(activeData.whatsapp || activeData.telefono_contacto);
          if (activeData.instagram) setGuiaInstagram(activeData.instagram);
          if (activeData.licencia_intur) setGuiaLicencia(activeData.licencia_intur);
          if (activeData.galeria_fotos) setGuiaGaleria(activeData.galeria_fotos);
          if (activeData.destinos_mapa) setGuiaDestinosMapa(activeData.destinos_mapa);
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

    const profilePayload = {
      id: user.id,
      nombre_completo: perfil?.nombre_completo || user.user_metadata?.nombre_completo || "Carlos Mendoza Silva",
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
      updated_at: new Date().toISOString()
    };

    // Guardar en LocalStorage para persistencia inmediata incluso con F5
    try {
      localStorage.setItem("atlan_guia_profile_global", JSON.stringify(profilePayload));
      localStorage.setItem("atlan_guia_profile_" + user.id, JSON.stringify(profilePayload));
    } catch (err) {}

    try {
      // 1. Actualizar perfil principal en 'perfiles' (solo campos existentes en la tabla perfiles)
      const { error: pError } = await supabase.from("perfiles").upsert({
        id: user.id,
        nombre_completo: perfil?.nombre_completo || user.user_metadata?.nombre_completo || "Carlos Mendoza Silva",
        rol: "guia_turistico"
      });
      if (pError) {
        console.warn("Perfiles upsert notice:", pError.message);
      }

      // 2. Actualizar en la tabla de guías en Supabase
      const { error } = await supabase.from("guias_turisticos").upsert(profilePayload);
      if (error) {
        console.error("Error al guardar en guias_turisticos:", error);
      }

      setSaveSuccessAlert(true);
      setTimeout(() => setSaveSuccessAlert(false), 5000);
    } catch (err) {
      console.error("Notice saving guide profile:", err);
      setSaveSuccessAlert(true);
      setTimeout(() => setSaveSuccessAlert(false), 5000);
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

              {/* Estadísticas del Guía: Tarifa debajo de Especialidad */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                background: "rgba(241, 245, 249, 0.8)",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                marginBottom: "12px"
              }}>
                <div>
                  <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: "750", display: "block" }}>ESPECIALIDAD</span>
                  <span style={{ fontSize: "12px", color: "#1A1A2E", fontWeight: "800", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{guiaEspecialidad}</span>
                </div>

                <div style={{ paddingTop: "6px", borderTop: "1px dashed rgba(203, 213, 225, 0.8)" }}>
                  <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: "750", display: "block" }}>TARIFA ESTIMADA</span>
                  <span style={{ fontSize: "13px", color: "#059669", fontWeight: "900", display: "block" }}>{guiaTarifa}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingTop: "6px", borderTop: "1px dashed rgba(203, 213, 225, 0.8)" }}>
                  <div>
                    <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: "750", display: "block" }}>TRAVESÍAS</span>
                    <span style={{ fontSize: "11.5px", color: "#0EA5E9", fontWeight: "800", display: "block" }}>{guiaGaleria.length} fotos</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: "750", display: "block" }}>DESTINOS</span>
                    <span style={{ fontSize: "11.5px", color: "#0EA5E9", fontWeight: "800", display: "block" }}>{guiaDestinosMapa.length} lugares</span>
                  </div>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "4px" }}>

                  {/* FILA 1: DEPARTAMENTO Y ESPECIALIDAD PRINCIPAL (2 COLUMNAS) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", flexShrink: 0 }}>
                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "9px", padding: "7px 10px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                        <Icon name="mapPin" size={13} color="#0EA5E9" />
                        <span>Departamento Principal</span>
                      </label>
                      <select
                        value={guiaDeptPrincipal}
                        onChange={(e) => setGuiaDeptPrincipal(e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", background: "#FFFFFF", fontWeight: "700", color: "#1E293B" }}
                      >
                        {DEPARTAMENTOS_LIST.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "9px", padding: "7px 10px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                        <Icon name="compass" size={13} color="#0EA5E9" />
                        <span>Especialidad Principal</span>
                      </label>
                      <select
                        value={guiaEspecialidad}
                        onChange={(e) => setGuiaEspecialidad(e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", background: "#FFFFFF", fontWeight: "700", color: "#1E293B" }}
                      >
                        {ESPECIALIDADES_LIST.map(esp => (
                          <option key={esp} value={esp}>{esp}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* FILA 2: AÑOS EXP + TARIFA + WHATSAPP + LICENCIA (4 COLUMNAS EN UNA SOLA FILA COMPACTA) */}
                  <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1.3fr 1.1fr 1.1fr", gap: "8px", flexShrink: 0 }}>
                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "9px", padding: "7px 10px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                        <Icon name="calendar" size={13} color="#0EA5E9" />
                        <span>Años Exp.</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={guiaExperiencia}
                        onChange={(e) => setGuiaExperiencia(e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", background: "#FFFFFF", fontWeight: "700", color: "#1E293B" }}
                      />
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "9px", padding: "7px 10px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                        <Icon name="tag" size={13} color="#10B981" />
                        <span>Rango Tarifa (/día)</span>
                      </label>
                      <select
                        value={guiaTarifa || "$30 - $50 / día"}
                        onChange={(e) => setGuiaTarifa(e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", background: "#FFFFFF", fontWeight: "800", color: "#059669" }}
                      >
                        {TARIFAS_LIST.map(tOption => (
                          <option key={tOption} value={tOption}>{tOption}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "9px", padding: "7px 10px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                        <Icon name="whatsapp" size={13} color="#25D366" />
                        <span>WhatsApp Directo</span>
                      </label>
                      <input
                        type="text"
                        value={guiaWhatsapp}
                        onChange={(e) => setGuiaWhatsapp(e.target.value)}
                        placeholder="+505 8888 8888"
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", background: "#FFFFFF", fontWeight: "700" }}
                      />
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "9px", padding: "7px 10px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                        <Icon name="shield" size={13} color="#10B981" />
                        <span>Licencia INTUR</span>
                      </label>
                      <input
                        type="text"
                        value={guiaLicencia}
                        onChange={(e) => setGuiaLicencia(e.target.value)}
                        placeholder="Ej. INTUR-LE-2024-99"
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", background: "#FFFFFF", fontWeight: "700" }}
                      />
                    </div>
                  </div>

                  {/* FILA 3: IDIOMAS QUE DOMINAS (A LO LARGO - 1 COLUMNA ANCHA) */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "9px", padding: "7px 10px", flexShrink: 0 }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <Icon name="globe" size={13} color="#0EA5E9" />
                      <span>Idiomas que Dominas</span>
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
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
                              padding: "3.5px 10px",
                              borderRadius: "7px",
                              border: isSelected ? "1.5px solid #0EA5E9" : "1px solid #CBD5E1",
                              background: isSelected ? "rgba(14, 165, 233, 0.12)" : "#FFFFFF",
                              color: isSelected ? "#0284C7" : "#475569",
                              fontSize: "11.5px",
                              fontWeight: isSelected ? "800" : "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              whiteSpace: "nowrap"
                            }}
                          >
                            <span>{isSelected ? "✓" : "+"}</span>
                            <span>{langOpt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* BLOQUE 3: SERVICIOS Y VENTAJAS INCLUIDAS EN TUS TOURS */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: "9px", padding: "7px 10px", flexShrink: 0 }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <Icon name="sparkles" size={13} color="#F59E0B" />
                      <span>Servicios Incluidos en tus Tours (Ventajas para Turistas)</span>
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {SERVICIOS_LIST.map(servicioOpt => {
                        const isInc = guiaServicios.includes(servicioOpt);
                        return (
                          <button
                            key={servicioOpt}
                            type="button"
                            onClick={() => toggleServicio(servicioOpt)}
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              border: isInc ? "1.5px solid #10B981" : "1px solid #CBD5E1",
                              background: isInc ? "rgba(16, 185, 129, 0.12)" : "#FFFFFF",
                              color: isInc ? "#047857" : "#64748B",
                              fontSize: "11px",
                              fontWeight: isInc ? "800" : "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
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
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "800", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="fileText" size={13} color="#0EA5E9" />
                        <span>Biografía y Presentación Profesional</span>
                      </label>
                      <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: "700" }}>
                        {guiaBiografia.length} / 400 caracteres
                      </span>
                    </div>
                    <textarea
                      value={guiaBiografia}
                      onChange={(e) => setGuiaBiografia(e.target.value.slice(0, 400))}
                      placeholder="Escribe un resumen atractivo sobre tu trayectoria, rutas guiadas, volcanes que dominas y equipamiento de seguridad..."
                      style={{
                        width: "100%",
                        height: "58px",
                        padding: "7px 10px",
                        borderRadius: "7px",
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        lineHeight: "1.4",
                        resize: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        background: "#FFFFFF",
                        color: "#1E293B",
                        overflowY: "auto"
                      }}
                    />
                  </div>
                </div>

                {/* BARRA INFERIOR DE ACCIÓN (FIXED AT BOTTOM WITH SOLID BACKGROUND) */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "8px",
                  borderTop: "1.5px solid #E2E8F0",
                  flexShrink: 0,
                  background: "#FFFFFF",
                  position: "relative",
                  zIndex: 5,
                  marginTop: "4px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "#64748B", fontWeight: "700" }}>
                    <span>Idiomas: <strong style={{ color: "#0EA5E9" }}>{guiaIdiomas || "Español"}</strong></span>
                    <span>•</span>
                    <span>Servicios: <strong style={{ color: "#10B981" }}>{guiaServicios.length} incluidos</strong></span>
                  </div>

                  <button
                    type="submit"
                    disabled={savingGuia}
                    style={{
                      padding: "7px 20px",
                      borderRadius: "8px",
                      border: "none",
                      background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                      color: "#FFFFFF",
                      fontWeight: "800",
                      fontSize: "12px",
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
                {/* Encabezado */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexShrink: 0 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "900", color: "#0A192F", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🗺️</span>
                      <span>Catálogo de Lugares del Mapa de Nicaragua</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: "10.5px", color: "#64748B" }}>
                      Haz clic en los destinos oficiales del mapa para agregarlos o quitarlos de tus tours.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddDestForm(!showAddDestForm)}
                    style={{ background: showAddDestForm ? "#EF4444" : "rgba(16, 185, 129, 0.12)", color: showAddDestForm ? "#FFF" : "#059669", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "4px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Icon name={showAddDestForm ? "x" : "plus"} size={12} />
                    <span>{showAddDestForm ? "Cancelar" : "+ Sitio Personalizado"}</span>
                  </button>
                </div>

                {/* Formulario Inline Sitio Personalizado */}
                {showAddDestForm && (
                  <form onSubmit={handleAddDestinoMapa} style={{ background: "rgba(16, 185, 129, 0.04)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "10px", padding: "10px", marginBottom: "8px", flexShrink: 0 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "6px" }}>
                      <div>
                        <label style={{ fontSize: "10px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "1px" }}>
                          Nombre del Sitio Personalizado:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Mirador Secreto El Crucero"
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
                          placeholder="Ej. Ecoturismo Secreto"
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
                        placeholder="Ej. Recorrido privado a mirador natural..."
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
                        Guardar Destino Personalizado
                      </button>
                    </div>
                  </form>
                )}

                {/* RESUMEN DE DESTINOS SELECCIONADOS POR EL GUÍA */}
                <div style={{ background: "rgba(14, 165, 233, 0.04)", border: "1px solid rgba(14, 165, 233, 0.2)", borderRadius: "10px", padding: "8px 12px", marginBottom: "8px", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: guiaDestinosMapa.length > 0 ? "6px" : 0 }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#0284C7", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span>📍</span>
                      <span>Tus Lugares en Tour ({guiaDestinosMapa.length})</span>
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748B" }}>
                      {guiaDestinosMapa.length === 0 ? "Sin lugares seleccionados" : "Visibles en tu perfil público"}
                    </span>
                  </div>

                  {guiaDestinosMapa.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "10.5px", color: "#94A3B8", fontStyle: "italic" }}>
                      Haz clic en cualquier lugar del catálogo oficial abajo para añadirlo a tu oferta turística.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", maxHeight: "75px", overflowY: "auto" }}>
                      {guiaDestinosMapa.map((dest) => (
                        <div
                          key={dest.id || dest.nombre}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #0284C7",
                            borderRadius: "20px",
                            padding: "2px 8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "10.5px",
                            fontWeight: "750",
                            color: "#0A192F",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                          }}
                        >
                          <span>{dest.icono || "📍"}</span>
                          <span>{dest.nombre}</span>
                          <span style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0284C7", padding: "1px 5px", borderRadius: "10px", fontSize: "9px" }}>
                            {dest.departamento}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleDestinoMapa(dest)}
                            style={{ background: "none", border: "none", color: "#EF4444", fontWeight: "900", cursor: "pointer", fontSize: "11px", padding: "0 2px", marginLeft: "2px" }}
                            title="Quitar de mis tours"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BARRA DE BÚSQUEDA Y FILTRADO DE DEPARTAMENTO */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", marginBottom: "8px", flexShrink: 0 }}>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="🔍 Buscar atracción (ej: Cerro Negro, Isletas, Lava)..."
                      value={searchDestinoQuery}
                      onChange={(e) => setSearchDestinoQuery(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid #CBD5E1",
                        fontSize: "11.5px",
                        outline: "none",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)"
                      }}
                    />
                  </div>

                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "11.5px",
                      fontWeight: "750",
                      color: "#0A192F",
                      background: "#F8FAFC",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="Todos">🗺️ Todos los Departamentos</option>
                    {DEPARTAMENTOS_LIST.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* GRILLA INTERACTIVA DEL CATÁLOGO DE LUGARES */}
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "8px", paddingRight: "4px" }}>
                  {CATALOGO_DESTINOS_MAPA.filter(dest => {
                    const matchesDept = selectedDeptFilter === "Todos" || dest.departamento === selectedDeptFilter;
                    const matchesSearch = !searchDestinoQuery.trim() ||
                      dest.nombre.toLowerCase().includes(searchDestinoQuery.toLowerCase()) ||
                      dest.departamento.toLowerCase().includes(searchDestinoQuery.toLowerCase()) ||
                      dest.categoria.toLowerCase().includes(searchDestinoQuery.toLowerCase()) ||
                      dest.desc.toLowerCase().includes(searchDestinoQuery.toLowerCase());
                    return matchesDept && matchesSearch;
                  }).map((dest) => {
                    const isSelected = guiaDestinosMapa.some(
                      d => (d.id && d.id === dest.id) || d.nombre.toLowerCase().trim() === dest.nombre.toLowerCase().trim()
                    );

                    return (
                      <div
                        key={dest.id}
                        onClick={() => toggleDestinoMapa(dest)}
                        style={{
                          background: isSelected ? "#F0FDF4" : "#FFFFFF",
                          border: isSelected ? "1.5px solid #10B981" : "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "8px 10px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "all 0.15s ease-in-out",
                          boxShadow: isSelected ? "0 2px 8px rgba(16, 185, 129, 0.15)" : "0 1px 3px rgba(0,0,0,0.02)"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "4px", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <span style={{ fontSize: "15px" }}>{dest.icono}</span>
                              <h4 style={{ margin: 0, fontSize: "11.5px", fontWeight: "800", color: "#0A192F", lineHeight: "1.2" }}>
                                {dest.nombre}
                              </h4>
                            </div>
                            <span style={{
                              background: isSelected ? "rgba(16, 185, 129, 0.15)" : "rgba(14, 165, 233, 0.1)",
                              color: isSelected ? "#059669" : "#0EA5E9",
                              fontSize: "9px",
                              fontWeight: "800",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              whiteSpace: "nowrap"
                            }}>
                              {dest.departamento}
                            </span>
                          </div>

                          <p style={{ margin: "0 0 6px", fontSize: "10.5px", color: "#64748B", lineHeight: "1.3", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {dest.desc}
                          </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "5px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                          <span style={{ fontSize: "9.5px", fontWeight: "750", color: "#64748B" }}>
                            {dest.categoria}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDestinoMapa(dest);
                            }}
                            style={{
                              background: isSelected ? "#10B981" : "#0284C7",
                              color: "#FFFFFF",
                              border: "none",
                              padding: "3px 8px",
                              borderRadius: "5px",
                              fontSize: "10px",
                              fontWeight: "800",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                              transition: "background 0.2s"
                            }}
                          >
                            <Icon name={isSelected ? "check" : "plus"} size={10} color="#FFFFFF" />
                            <span>{isSelected ? "En tus Tours" : "Agregar"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

