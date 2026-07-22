"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import Navbar from "@/components/ui/Navbar";
import { uploadMedia } from "@/lib/storage";

export default function DashboardPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  // Estados del usuario y carga
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [misNegocios, setMisNegocios] = useState([]);
  const [negocio, setNegocio] = useState(null);

  // Estados de navegación interna (Pestañas)
  const [activeTab, setActiveTab] = useState("overview"); // overview | general | excentricidades | menu | reservas | resenas | horarios

  // Horarios de atención
  const [horarios, setHorarios] = useState({
    lunes: { abierto: true, apertura: "08:00", cierre: "17:00" },
    martes: { abierto: true, apertura: "08:00", cierre: "17:00" },
    miercoles: { abierto: true, apertura: "08:00", cierre: "17:00" },
    jueves: { abierto: true, apertura: "08:00", cierre: "17:00" },
    viernes: { abierto: true, apertura: "08:00", cierre: "17:00" },
    sabado: { abierto: true, apertura: "09:00", cierre: "14:00" },
    domingo: { abierto: false, apertura: "08:00", cierre: "17:00" }
  });

  // Formularios y edición
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [rangoPrecios, setRangoPrecios] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Estados para Imágenes (Supabase Storage)
  const [logoUrl, setLogoUrl] = useState("");
  const [fotos, setFotos] = useState([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Excentricidades (Checklist dinámico)
  const [hasMenu, setHasMenu] = useState(false);
  const [hasHours, setHasHours] = useState(false);
  const [hasLodging, setHasLodging] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);

  // Menú (menu_items)
  const [menuItems, setMenuItems] = useState([]);
  const [newPlatoNombre, setNewPlatoNombre] = useState("");
  const [newPlatoPrecio, setNewPlatoPrecio] = useState("");
  const [newPlatoDesc, setNewPlatoDesc] = useState("");
  const [newPlatoFotoUrl, setNewPlatoFotoUrl] = useState("");
  const [uploadingPlatoFoto, setUploadingPlatoFoto] = useState(false);
  const [isAddingPlato, setIsAddingPlato] = useState(false);

  // Reservas
  const [reservas, setReservas] = useState([]);

  // Reseñas
  const [resenas, setResenas] = useState([]);

  // Reclamar punto
  const [puntosDisponibles, setPuntosDisponibles] = useState([]);
  const [isClaiming, setIsClaiming] = useState(false);

  // Estado del punto geográfico asociado
  const [puntoAsociado, setPuntoAsociado] = useState(null);
  const [loadingPunto, setLoadingPunto] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session: activeSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !activeSession) {
          router.push("/login");
          return;
        }

        setSession(activeSession);
        const currentUser = activeSession.user;
        setUser(currentUser);

        // Perfil
        const { data: perfilData } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        setPerfil(perfilData);

        // Cargar datos de negocio (si el usuario ya tiene uno o va a reclamar/crear)
        await loadNegocioData(currentUser.id);
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const loadNegocioData = async (userId) => {
    const { data: negociosData } = await supabase
      .from("negocios")
      .select("*")
      .eq("dueno_id", userId);

    if (negociosData && negociosData.length > 0) {
      setMisNegocios(negociosData);
      
      // Auto-seleccionar si solo tiene 1
      if (negociosData.length === 1) {
        selectNegocio(negociosData[0]);
      } else {
        // Mantiene null si hay varios para mostrar el selector
        setNegocio(null);
      }
    } else {
      setMisNegocios([]);
      setNegocio(null);
      // Si no tiene negocio, cargar puntos libres para reclamar
      const { data: puntosLibres } = await supabase
        .from("puntos")
        .select("*")
        .eq("estado", "sin_reclamar")
        .is("negocio_id", null);
      setPuntosDisponibles(puntosLibres || []);
    }
  };

  const selectNegocio = (negocioData) => {
    setNegocio(negocioData);
    setNombre(negocioData.nombre || "");
    setDescripcion(negocioData.descripcion || "");
    setTelefono(negocioData.telefono || "");
    setWhatsapp(negocioData.whatsapp || "");
    setRangoPrecios(negocioData.rango_precios || "");
    setLogoUrl(negocioData.logo_url || "");
    setFotos(negocioData.fotos || []);

    // Horarios
    const hr = negocioData.horarios || {};
    setHorarios({
      lunes: hr.lunes || { abierto: true, apertura: "08:00", cierre: "17:00" },
      martes: hr.martes || { abierto: true, apertura: "08:00", cierre: "17:00" },
      miercoles: hr.miercoles || { abierto: true, apertura: "08:00", cierre: "17:00" },
      jueves: hr.jueves || { abierto: true, apertura: "08:00", cierre: "17:00" },
      viernes: hr.viernes || { abierto: true, apertura: "08:00", cierre: "17:00" },
      sabado: hr.sabado || { abierto: true, apertura: "09:00", cierre: "14:00" },
      domingo: hr.domingo || { abierto: false, apertura: "08:00", cierre: "17:00" }
    });

    // Servicios (excentricidades)
    const serv = negocioData.servicios || {};
    setHasMenu(!!serv.has_menu);
    setHasHours(!!serv.has_hours);
    setHasLodging(!!serv.has_lodging);
    setHasTransport(!!serv.has_transport);

    // Cargar detalles asociados
    if (serv.has_menu) loadMenuItems(negocioData.id);
    if (serv.has_lodging) loadReservas(negocioData.id);
    loadResenas(negocioData.id);
    loadPuntoAsociado(negocioData.id);
    setActiveTab("overview");
  };

  const loadMenuItems = async (negocioId) => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("negocio_id", negocioId);
    setMenuItems(data || []);
  };

  const loadReservas = async (negocioId) => {
    const { data } = await supabase
      .from("reservas")
      .select(`
        *,
        perfiles:cliente_id (nombre_completo)
      `)
      .eq("negocio_id", negocioId)
      .order("fecha_hora", { ascending: false });
    setReservas(data || []);
  };

  const loadResenas = async (negocioId) => {
    const { data } = await supabase
      .from("resenas")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("created_at", { ascending: false });
    setResenas(data || []);
  };

  const loadPuntoAsociado = async (negocioId) => {
    setLoadingPunto(true);
    try {
      const { data, error } = await supabase
        .from("puntos")
        .select("id, estado, nombre")
        .eq("negocio_id", negocioId)
        .maybeSingle();

      if (error) throw error;
      setPuntoAsociado(data || null);
    } catch (err) {
      console.error("Error loading associated point:", err);
      setPuntoAsociado(null);
    } finally {
      setLoadingPunto(false);
    }
  };

  const handleResubmitClaim = async () => {
    if (!negocio || !puntoAsociado) return;
    setIsResubmitting(true);
    try {
      // 1. Limpiar motivo_rechazo en el negocio y asegurar que se guarden los cambios actuales de edición
      const { error: errorNegocio } = await supabase
        .from("negocios")
        .update({ 
          motivo_rechazo: null,
          nombre,
          descripcion,
          telefono,
          whatsapp,
          rango_precios: rangoPrecios
        })
        .eq("id", negocio.id);

      if (errorNegocio) throw errorNegocio;

      // 2. Cambiar el punto a 'en_verificacion'
      const { error: errorPunto } = await supabase
        .from("puntos")
        .update({ estado: "en_verificacion" })
        .eq("id", puntoAsociado.id);

      if (errorPunto) throw errorPunto;

      alert(lang === "en" 
        ? "Resubmitted successfully! It is now pending verification again." 
        : "¡Reenviado con éxito! Ahora está pendiente de verificación nuevamente.");

      // Recargar datos
      await loadNegocioData(user.id);
      
      const { data: updatedNegocio } = await supabase
        .from("negocios")
        .select("*")
        .eq("id", negocio.id)
        .single();
      if (updatedNegocio) {
        selectNegocio(updatedNegocio);
      }
    } catch (err) {
      console.error("Error resubmitting claim:", err);
      alert(lang === "en" ? "Error resubmitting claim." : "Error al reenviar el reclamo.");
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleCancelClaim = async () => {
    if (!negocio || !puntoAsociado) return;
    if (!confirm(lang === "en" 
      ? "Are you sure you want to cancel this claim? This will release the point on the map and remove this business draft." 
      : "¿Está seguro de cancelar este reclamo? Esto liberará el punto en el mapa y eliminará este borrador de negocio.")) return;

    setIsResubmitting(true);
    try {
      // 1. Liberar el punto en la base de datos
      const { error: errorPunto } = await supabase
        .from("puntos")
        .update({ 
          negocio_id: null,
          estado: "sin_reclamar" 
        })
        .eq("id", puntoAsociado.id);

      if (errorPunto) throw errorPunto;

      // 2. Eliminar el negocio local
      const { error: errorNegocio } = await supabase
        .from("negocios")
        .delete()
        .eq("id", negocio.id);

      if (errorNegocio) {
        // Fallback: si no se puede eliminar por restricciones FK, al menos desvincular
        await supabase
          .from("negocios")
          .update({ dueno_id: null, activo: false })
          .eq("id", negocio.id);
      }

      alert(lang === "en" ? "Claim canceled successfully." : "Reclamo cancelado con éxito.");
      setNegocio(null);
      setPuntoAsociado(null);
      await loadNegocioData(user.id);
    } catch (err) {
      console.error("Error canceling claim:", err);
      alert(lang === "en" ? "Error canceling claim." : "Error al cancelar el reclamo.");
    } finally {
      setIsResubmitting(false);
    }
  };

  // Reclamar un punto geográfico
  const handleReclamarPunto = async (puntoId) => {
    setIsClaiming(true);
    try {
      const puntoSeleccionado = puntosDisponibles.find(p => p.id === puntoId);
      if (!puntoSeleccionado) return;

      // 1. Crear el negocio asociado
      const { data: nuevoNegocio, error: negocioError } = await supabase
        .from("negocios")
        .insert([{
          dueno_id: user.id,
          nombre: puntoSeleccionado.nombre,
          descripcion: puntoSeleccionado.descripcion,
          tipo: puntoSeleccionado.categoria || "otro",
          servicios: { has_menu: false, has_hours: false, has_lodging: false, has_transport: false },
          activo: false // Requiere verificación presencial
        }])
        .select()
        .single();

      if (negocioError) throw negocioError;

      // Actualizar rol del usuario a 'dueno'
      await supabase.from("perfiles").update({ rol: "dueno" }).eq("id", user.id);

      // 2. Asociar el punto al negocio y actualizar estado a 'en_verificacion'
      const { error: puntoError } = await supabase
        .from("puntos")
        .update({
          negocio_id: nuevoNegocio.id,
          estado: "en_verificacion" // en espera de verificación presencial
        })
        .eq("id", puntoId);

      if (puntoError) throw puntoError;

      alert(lang === "en" 
        ? "Claim requested successfully! Personal verification required." 
        : "¡Reclamo solicitado con éxito! Se requiere verificación presencial.");
      
      await loadNegocioData(user.id);
    } catch (err) {
      console.error("Error al reclamar:", err);
      alert("Error al procesar el reclamo.");
    } finally {
      setIsClaiming(false);
    }
  };

  // Crear un nuevo negocio usando GPS
  const handleCrearNuevoNegocioGPS = async (e) => {
    if (e) e.preventDefault();
    setIsClaiming(true);
    
    if (!navigator.geolocation) {
      alert(lang === "en" ? "Geolocation is not supported by your browser." : "La geolocalización no es soportada por tu navegador.");
      setIsClaiming(false);
      return;
    }

    alert(lang === "en" ? "We will request your location to place the business on the map." : "Solicitaremos tu ubicación para ubicar el negocio en el mapa.");

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { longitude, latitude } = position.coords;
        
        // 1. Crear negocio
        const { data: nuevoNegocio, error: negocioError } = await supabase
          .from("negocios")
          .insert([{
            dueno_id: user.id,
            nombre: "Mi Nuevo Negocio",
            tipo: "otro",
            servicios: { has_menu: false, has_hours: false, has_lodging: false, has_transport: false },
            activo: false
          }])
          .select()
          .single();

        if (negocioError) throw negocioError;

        // Actualizar rol del usuario a 'dueno'
        await supabase.from("perfiles").update({ rol: "dueno" }).eq("id", user.id);

        // 2. Crear punto geográfico con la ubicación GPS exacta
        const { error: puntoError } = await supabase
          .from("puntos")
          .insert([{
            negocio_id: nuevoNegocio.id,
            nombre: "Mi Nuevo Negocio",
            categoria: "otro",
            ubicacion: `POINT(${longitude} ${latitude})`,
            estado: "en_verificacion",
            nombre_creador: perfil?.nombre_completo || "Propietario"
          }]);

        if (puntoError) throw puntoError;

        alert(lang === "en" ? "Business created at your current location!" : "¡Negocio creado en tu ubicación actual!");
        await loadNegocioData(user.id);
      } catch (err) {
        console.error("Error al crear negocio con GPS:", err);
        alert(lang === "en" ? `Error creating business: ${err.message || err}` : `Error al crear negocio: ${err.message || err}`);
      } finally {
        setIsClaiming(false);
      }
    }, (error) => {
      console.error("GPS Error:", error);
      alert(lang === "en" ? "Could not get your location. Please check browser permissions." : "No se pudo obtener tu ubicación. Verifica los permisos de tu navegador.");
      setIsClaiming(false);
    }, { enableHighAccuracy: true });
  };

  const handleIrAlMapaParaMarcar = () => {
    router.push("/mapa");
  };

  // Guardar datos generales del negocio
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Limpiar datos nulos u opcionales
      const payload = {
        nombre: nombre || null,
        descripcion: descripcion || null,
        telefono: telefono || null,
        whatsapp: whatsapp || null,
        rango_precios: rangoPrecios || null,
        logo_url: logoUrl || null,
        fotos: fotos || []
      };

      const { data, error } = await supabase
        .from("negocios")
        .update(payload)
        .eq("id", negocio.id)
        .select();

      if (error) throw error;
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando negocio (completo):", err);
      alert(`Error al guardar: ${err.message || err.details || JSON.stringify(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar excentricidades (checklist)
  const handleSaveExcentricidades = async () => {
    setIsSaving(true);
    try {
      const servicios = {
        has_menu: hasMenu,
        has_hours: hasHours,
        has_lodging: hasLodging,
        has_transport: hasTransport
      };

      const { error } = await supabase
        .from("negocios")
        .update({ servicios })
        .eq("id", negocio.id);

      if (error) throw error;

      // Actualizar estado local del negocio
      setNegocio({ ...negocio, servicios });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando excentricidades:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar horarios
  const handleSaveHorarios = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const { error } = await supabase
        .from("negocios")
        .update({ horarios })
        .eq("id", negocio.id);

      if (error) throw error;
      setNegocio({ ...negocio, horarios });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando horarios:", err);
      alert("Error al guardar horarios.");
    } finally {
      setIsSaving(false);
    }
  };

  // Subida de imágenes a Supabase Storage
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadMedia(file, "negocios/logos");
      setLogoUrl(url);
      if (negocio?.id) {
        await supabase
          .from("negocios")
          .update({ logo_url: url })
          .eq("id", negocio.id);
      }
    } catch (err) {
      console.error("Error al subir logo:", err);
      alert(lang === "en" ? "Error uploading logo" : "Error al subir el logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const url = await uploadMedia(file, "negocios/fotos");
      const updatedFotos = [...fotos, url];
      setFotos(updatedFotos);
      if (negocio?.id) {
        await supabase
          .from("negocios")
          .update({ fotos: updatedFotos })
          .eq("id", negocio.id);
      }
    } catch (err) {
      console.error("Error al subir foto:", err);
      alert(lang === "en" ? "Error uploading photo" : "Error al subir la foto");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleRemoveFoto = async (urlToRemove) => {
    const updatedFotos = fotos.filter(url => url !== urlToRemove);
    setFotos(updatedFotos);
    if (negocio?.id) {
      await supabase
        .from("negocios")
        .update({ fotos: updatedFotos })
        .eq("id", negocio.id);
    }
  };

  const handlePlatoFotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPlatoFoto(true);
    try {
      const url = await uploadMedia(file, "negocios/menu");
      setNewPlatoFotoUrl(url);
    } catch (err) {
      console.error("Error al subir foto del platillo:", err);
      alert(lang === "en" ? "Error uploading menu photo" : "Error al subir la foto del platillo");
    } finally {
      setUploadingPlatoFoto(false);
    }
  };

  // Menú: Agregar plato
  const handleAddPlato = async (e) => {
    e.preventDefault();
    if (!newPlatoNombre || !newPlatoPrecio) return;
    setIsAddingPlato(true);

    try {
      const { error } = await supabase
        .from("menu_items")
        .insert([{
          negocio_id: negocio.id,
          nombre: newPlatoNombre,
          precio: parseFloat(newPlatoPrecio),
          descripcion: newPlatoDesc,
          foto_url: newPlatoFotoUrl,
          disponible: true
        }]);

      if (error) throw error;

      setNewPlatoNombre("");
      setNewPlatoPrecio("");
      setNewPlatoDesc("");
      setNewPlatoFotoUrl("");
      loadMenuItems(negocio.id);
    } catch (err) {
      console.error("Error agregando plato:", err);
    } finally {
      setIsAddingPlato(false);
    }
  };

  // Menú: Eliminar plato
  const handleDeletePlato = async (id) => {
    try {
      await supabase.from("menu_items").delete().eq("id", id);
      loadMenuItems(negocio.id);
    } catch (err) {
      console.error("Error eliminando plato:", err);
    }
  };

  // Reservas: Cambiar estado
  const handleUpdateReservaStatus = async (reservaId, newStatus) => {
    try {
      await supabase
        .from("reservas")
        .update({ estado_reserva: newStatus })
        .eq("id", reservaId);
      loadReservas(negocio.id);
    } catch (err) {
      console.error("Error actualizando reserva:", err);
    }
  };

  // Desconexión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="skeleton-loader" style={{ width: "80px", height: "80px", borderRadius: "50%" }}></div>
        <p style={{ color: "#6B7280", marginTop: "16px", fontWeight: "700" }}>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, position: "relative", overflow: "hidden" }} className="dashboard-container">
      {/* Orbes de luz ambientales de fondo */}
      <div style={{
        position: "absolute", top: "-5%", right: "-5%", width: "650px", height: "650px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,215,0,0.40) 0%, rgba(255,215,0,0.12) 50%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none", zIndex: 0
      }} />
      <div style={{
        position: "absolute", bottom: "-5%", left: "-5%", width: "550px", height: "550px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(20,109,158,0.32) 0%, rgba(20,109,158,0.08) 50%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none", zIndex: 0
      }} />
      <div style={{
        position: "absolute", top: "35%", left: "50%", transform: "translateX(-50%)", width: "450px", height: "450px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(23,170,74,0.28) 0%, transparent 70%)",
        filter: "blur(45px)", pointerEvents: "none", zIndex: 0
      }} />
      <Navbar activePage="dashboard" session={session} perfil={perfil} onLogout={handleLogout} />

      {/* CASO A: EL DUEÑO NO TIENE NEGOCIOS */}
      {misNegocios.length === 0 ? (
        <div style={styles.noNegocioContainer} className="glass-card animate-fade-in-up">
          <h2 style={{ fontSize: "24px", color: "var(--atlan-gold)", fontWeight: "800", marginBottom: "8px" }}>
            {lang === "en" ? "Claim or Register Your Business" : "Reclama o Registra tu Negocio"}
          </h2>
          <p style={{ color: "#4A5568", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
            {lang === "en" 
              ? "You can claim a point that a tourist previously added to the map, or register a new one." 
              : "Puedes reclamar un punto que un turista haya agregado previamente al mapa, o registrar uno nuevo."}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
            {/* Opción 1: Reclamar */}
            <div style={styles.claimSection}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1A1A2E", marginBottom: "12px" }}>
                🏷️ {lang === "en" ? "Unclaimed Points Nearby" : "Puntos sin Reclamar Disponibles"}
              </h3>
              {puntosDisponibles.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#9CA3AF" }}>
                  {lang === "en" ? "No unclaimed points found." : "No se hallaron puntos sin reclamar en este momento."}
                </p>
              ) : (
                <div style={styles.pointsList}>
                  {puntosDisponibles.map((p) => (
                    <div key={p.id} style={styles.pointRow}>
                      <div>
                        <div style={{ fontWeight: "750", fontSize: "13.5px" }}>{p.nombre}</div>
                        <div style={{ fontSize: "11px", color: "#4A5568" }}>{p.categoria}</div>
                      </div>
                      <button
                        onClick={() => handleReclamarPunto(p.id)}
                        disabled={isClaiming}
                        style={styles.claimBtn}
                      >
                        {lang === "en" ? "Claim" : "Reclamar"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opción 2: Registrar Nuevo */}
            <div style={{ borderTop: "1px dashed rgba(20, 109, 158, 0.12)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1A1A2E", marginBottom: "4px" }}>
                ✨ {lang === "en" ? "Register New Business" : "Registrar Nuevo Negocio"}
              </h3>
              
              <button onClick={handleCrearNuevoNegocioGPS} disabled={isClaiming} style={{...styles.createBtn, background: "rgba(23, 170, 74,0.15)", color: "#1FCC5C", border: "1px solid rgba(23, 170, 74,0.3)"}}>
                📍 {lang === "en" ? "Use My Current GPS Location" : "Usar mi ubicación actual (GPS)"}
              </button>

              <button onClick={handleIrAlMapaParaMarcar} disabled={isClaiming} style={{...styles.createBtn, background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)"}}>
                🗺️ {lang === "en" ? "Mark manually on the map" : "Marcar punto manualmente en el mapa"}
              </button>
            </div>
          </div>
        </div>
      ) : !negocio ? (
        /* CASO B: SELECTOR DE NEGOCIOS */
        <div style={{...styles.dashboardOverviewLayout, marginTop: "40px"}} className="animate-fade-in-up">
          <div style={styles.overviewHeader}>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#1A1A2E" }}>
              {lang === "en" ? "My Businesses" : "Mis Negocios"}
            </h2>
            <p style={{ color: "var(--atlan-text-secondary)", marginTop: "4px" }}>
              {lang === "en" ? "Select a business to manage:" : "Selecciona un negocio para administrar:"}
            </p>
          </div>
          <div style={{ ...styles.overviewGrid, marginTop: "24px" }}>
            {misNegocios.map(n => (
              <button key={n.id} onClick={() => selectNegocio(n)} style={styles.dashboardCard} className="hover-card">
                <div style={{ ...styles.cardIcon, background: "rgba(255, 215, 0,0.1)", color: "var(--atlan-gold)" }}>🏢</div>
                <h3 style={styles.cardTitle}>{n.nombre}</h3>
                <p style={styles.cardDesc}>{n.tipo || "Otro"}</p>
                <div style={{ marginTop: "12px", fontSize: "11px", fontWeight: "800", color: n.activo ? "#17AA4A" : "#E6A800" }}>
                  {n.activo ? (lang === "en" ? "VERIFIED" : "VERIFICADO") : (lang === "en" ? "PENDING" : "PENDIENTE")}
                </div>
              </button>
            ))}
            <button onClick={handleCrearNuevoNegocioGPS} disabled={isClaiming} style={{ ...styles.dashboardCard, border: "2px dashed rgba(23, 170, 74,0.4)", background: "transparent", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="hover-card">
              <div style={{ fontSize: "32px", color: "#17AA4A", marginBottom: "8px" }}>📍</div>
              <h3 style={{...styles.cardTitle, color: "#17AA4A"}}>{lang === "en" ? "Add Business here (GPS)" : "Agregar Negocio Aquí (GPS)"}</h3>
            </button>

            <button onClick={handleIrAlMapaParaMarcar} disabled={isClaiming} style={{ ...styles.dashboardCard, border: "2px dashed rgba(59,130,246,0.4)", background: "transparent", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="hover-card">
              <div style={{ fontSize: "32px", color: "#60a5fa", marginBottom: "8px" }}>🗺️</div>
              <h3 style={{...styles.cardTitle, color: "#60a5fa"}}>{lang === "en" ? "Add manually on map" : "Agregar en el mapa manualmente"}</h3>
            </button>
          </div>
        </div>
      ) : (
        /* CASO C: EL DUEÑO YA SELECCIONÓ UN NEGOCIO ASOCIADO */
        <div style={activeTab === "overview" ? styles.dashboardOverviewLayout : styles.dashboardDetailLayout}>
          {activeTab === "overview" ? (
            <div style={styles.overviewContainer} className="animate-fade-in-up">
              <div style={styles.overviewHeader}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#1A1A2E" }}>
                      {lang === "en" ? "Welcome," : "Bienvenido,"} {perfil?.nombre_completo || "Propietario"}
                    </h2>
                    <p style={{ color: "var(--atlan-text-secondary)", marginTop: "4px" }}>
                      {lang === "en" ? "What would you like to manage today for" : "¿Qué deseas gestionar hoy para"} <strong style={{ color: "var(--atlan-gold)" }}>{negocio.nombre}</strong>?
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "16px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: negocio.activo ? "#17AA4A" : "#E6A800" }}></span>
                      <span style={{ fontSize: "12px", fontWeight: "750", color: negocio.activo ? "#17AA4A" : "#E6A800" }}>
                        {negocio.activo ? (lang === "en" ? "VERIFIED BUSINESS" : "NEGOCIO VERIFICADO") : (lang === "en" ? "PENDING VERIFICATION" : "PENDIENTE DE VERIFICACIÓN")}
                      </span>
                    </div>
                  </div>
                  {misNegocios.length > 1 && (
                    <button 
                      onClick={() => setNegocio(null)} 
                      style={{ background: "rgba(20, 109, 158, 0.05)", border: "1px solid rgba(20, 109, 158, 0.12)", color: "#1A1A2E", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(20, 109, 158, 0.12)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(20, 109, 158, 0.05)"}
                    >
                      🔁 {lang === "en" ? "Switch Business" : "Cambiar de Negocio"}
                    </button>
                  )}
                </div>
              </div>

              {/* Alertas de verificación */}
              {puntoAsociado && puntoAsociado.estado === 'rechazado' && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1.5px solid rgba(239, 68, 68, 0.25)',
                  boxShadow: '0 10px 30px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(20, 109, 158, 0.05)',
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  animation: 'fadeInUp 0.5s ease forwards'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>⚠️</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '850', color: '#fca5a5' }}>
                        {lang === 'en' ? 'Claim Rejected / Pending Corrections' : 'Reclamo Rechazado / Pendiente de Correcciones'}
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#1A1A2E' }}>
                        {lang === 'en' 
                          ? 'The administrator reviewed your application and rejected it with the following observations:' 
                          : 'El administrador revisó tu solicitud y la rechazó con las siguientes observaciones:'}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(10, 15, 28, 0.4)',
                    borderLeft: '4px solid #ef4444',
                    padding: '16px',
                    borderRadius: '0 12px 12px 0',
                    fontSize: '13.5px',
                    color: '#1A1A2E',
                    lineHeight: 1.5,
                    fontStyle: 'italic'
                  }}>
                    {negocio.motivo_rechazo || (lang === 'en' ? 'No detailed observations provided.' : 'No se proporcionaron observaciones detalladas.')}
                  </div>

                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <button
                      onClick={handleResubmitClaim}
                      disabled={isResubmitting}
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(23, 170, 74,0.25)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      {isResubmitting 
                        ? (lang === 'en' ? 'Processing...' : 'Procesando...') 
                        : (lang === 'en' ? 'Save & Resubmit for Review' : 'Guardar y Reenviar para Revisión')}
                    </button>
                    <button
                      onClick={handleCancelClaim}
                      disabled={isResubmitting}
                      style={{
                        padding: '10px 20px',
                        background: 'rgba(20, 109, 158, 0.05)',
                        border: '1px solid rgba(20, 109, 158, 0.12)',
                        borderRadius: '12px',
                        color: '#fca5a5',
                        fontWeight: '800',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(20, 109, 158, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(20, 109, 158, 0.05)'}
                    >
                      {lang === 'en' ? 'Cancel Claim' : 'Cancelar Reclamo'}
                    </button>
                  </div>
                </div>
              )}

              {puntoAsociado && puntoAsociado.estado === 'en_verificacion' && (
                <div style={{
                  background: 'rgba(230, 194, 0, 0.06)',
                  border: '1.5px solid rgba(230, 194, 0, 0.2)',
                  boxShadow: '0 10px 30px rgba(230, 194, 0, 0.05), inset 0 1px 0 rgba(20, 109, 158, 0.05)',
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  animation: 'fadeInUp 0.5s ease forwards'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="pulse-container" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(230, 194, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <span style={{ fontSize: '20px' }}>⏳</span>
                      <div style={{
                        position: 'absolute',
                        inset: '-2px',
                        borderRadius: '50%',
                        border: '2px solid #E6A800',
                        animation: 'spin 4s linear infinite',
                        borderTopColor: 'transparent',
                        borderBottomColor: 'transparent'
                      }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: '850', color: '#fcd34d' }}>
                        {lang === 'en' ? 'Verification Pending' : 'Verificación en Proceso'}
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4A5568', lineHeight: 1.5 }}>
                        {lang === 'en' 
                          ? 'An administrator will carry out a physical/onsite verification to validate the claim of your business.' 
                          : 'Un administrador realizará una verificación física / presencial para validar la pertenencia de tu negocio.'}
                      </p>
                    </div>
                  </div>
                  <p style={{ margin: '4px 0 0 54px', fontSize: '12px', color: '#4A5568', lineHeight: 1.4 }}>
                    💡 {lang === 'en' 
                      ? 'While verification is pending, you can keep updating your profile information so it is ready for activation.'
                      : 'Mientras se realiza la verificación, puedes seguir editando la información de tu perfil para tenerlo listo.'}
                  </p>
                </div>
              )}

              <div style={styles.overviewGrid}>
                {/* General Info Card */}
                <button
                  onClick={() => setActiveTab("general")}
                  className="hover-card clay-card animate-fade-in-up"
                  style={{
                    ...styles.dashboardCard,
                    background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
                    border: "2px solid #C7D2FE",
                    boxShadow: "0 12px 28px -4px rgba(79, 70, 229, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)"
                  }}
                >
                  <div style={{ ...styles.cardIcon, background: "#4F46E5", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(79, 70, 229, 0.35)" }}>ℹ️</div>
                  <h3 style={{ ...styles.cardTitle, color: "#3730A3" }}>{lang === "en" ? "Business Profile" : "Perfil del Negocio"}</h3>
                  <p style={{ ...styles.cardDesc, color: "#4338CA" }}>{lang === "en" ? "Update photos, description, logo and contact info" : "Actualiza fotos, descripción, logo y datos de contacto"}</p>
                </button>

                {/* Checklist Card */}
                <button
                  onClick={() => setActiveTab("excentricidades")}
                  className="hover-card clay-card animate-fade-in-up"
                  style={{
                    ...styles.dashboardCard,
                    background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
                    border: "2px solid #86EFAC",
                    boxShadow: "0 12px 28px -4px rgba(22, 163, 74, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)"
                  }}
                >
                  <div style={{ ...styles.cardIcon, background: "#16A34A", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(22, 163, 74, 0.35)" }}>⚙️</div>
                  <h3 style={{ ...styles.cardTitle, color: "#166534" }}>{lang === "en" ? "Services Checklist" : "Checklist de Servicios"}</h3>
                  <p style={{ ...styles.cardDesc, color: "#15803D" }}>{lang === "en" ? "Enable menu, lodging, or transport modules" : "Activa módulos de menú, hospedaje o transporte"}</p>
                </button>

                {/* Hours Card */}
                {hasHours && (
                  <button
                    onClick={() => setActiveTab("horarios")}
                    className="hover-card clay-card animate-fade-in-up"
                    style={{
                      ...styles.dashboardCard,
                      background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                      border: "2px solid #FDE68A",
                      boxShadow: "0 12px 28px -4px rgba(217, 119, 6, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)"
                    }}
                  >
                    <div style={{ ...styles.cardIcon, background: "#D97706", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(217, 119, 6, 0.35)" }}>⏰</div>
                    <h3 style={{ ...styles.cardTitle, color: "#92400E" }}>{lang === "en" ? "Opening Hours" : "Horarios de Atención"}</h3>
                    <p style={{ ...styles.cardDesc, color: "#B45309" }}>{lang === "en" ? "Manage your daily opening and closing times" : "Configura tus horarios de apertura y cierre"}</p>
                  </button>
                )}

                {/* Menu Card */}
                {hasMenu && (
                  <button
                    onClick={() => setActiveTab("menu")}
                    className="hover-card clay-card animate-fade-in-up"
                    style={{
                      ...styles.dashboardCard,
                      background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                      border: "2px solid #93C5FD",
                      boxShadow: "0 12px 28px -4px rgba(37, 99, 235, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)"
                    }}
                  >
                    <div style={{ ...styles.cardIcon, background: "#2563EB", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(37, 99, 235, 0.35)" }}>🍲</div>
                    <h3 style={{ ...styles.cardTitle, color: "#1E40AF" }}>{lang === "en" ? "Gastronomic Menu" : "Menú Gastronómico"}</h3>
                    <p style={{ ...styles.cardDesc, color: "#1D4ED8" }}>{lang === "en" ? "Add or remove dishes, photos, and set prices" : "Agrega o elimina platillos, fotos y precios"}</p>
                  </button>
                )}

                {/* Reservations Card */}
                {hasLodging && (
                  <button
                    onClick={() => setActiveTab("reservas")}
                    className="hover-card clay-card animate-fade-in-up"
                    style={{
                      ...styles.dashboardCard,
                      background: "linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)",
                      border: "2px solid #D8B4FE",
                      boxShadow: "0 12px 28px -4px rgba(147, 51, 234, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)"
                    }}
                  >
                    <div style={{ ...styles.cardIcon, background: "#9333EA", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(147, 51, 234, 0.35)" }}>📅</div>
                    <h3 style={{ ...styles.cardTitle, color: "#6B21A8" }}>{lang === "en" ? "Reservations Manager" : "Gestor de Reservas"}</h3>
                    <p style={{ ...styles.cardDesc, color: "#7E22CE" }}>{lang === "en" ? "Approve or cancel incoming booking requests" : "Aprueba o cancela solicitudes de reserva"}</p>
                    {reservas.filter(r => r.estado_reserva === "pendiente").length > 0 && (
                      <div style={styles.cardBadge}>
                        {reservas.filter(r => r.estado_reserva === "pendiente").length} {lang === "en" ? "Pending" : "Pendientes"}
                      </div>
                    )}
                  </button>
                )}

                {/* Reviews Card */}
                <button
                  onClick={() => setActiveTab("resenas")}
                  className="hover-card clay-card animate-fade-in-up"
                  style={{
                    ...styles.dashboardCard,
                    background: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
                    border: "2px solid #FECDD3",
                    boxShadow: "0 12px 28px -4px rgba(225, 29, 72, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)"
                  }}
                >
                  <div style={{ ...styles.cardIcon, background: "#E11D48", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(225, 29, 72, 0.35)" }}>⭐</div>
                  <h3 style={{ ...styles.cardTitle, color: "#9F1239" }}>{lang === "en" ? "Customer Reviews" : "Reseñas de Clientes"}</h3>
                  <p style={{ ...styles.cardDesc, color: "#BE123C" }}>{lang === "en" ? "Read what tourists think about your business" : "Lee lo que opinan los turistas sobre tu negocio"}</p>
                </button>
              </div>
            </div>
          ) : (
            <main style={{ ...styles.mainContent, maxWidth: "800px", margin: "0 auto", width: "100%" }} className="dashboard-main glass-card animate-fade-in">
              <button 
                onClick={() => setActiveTab("overview")} 
                style={{ background: "transparent", border: "none", color: "var(--atlan-gold)", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", padding: 0 }}
              >
                ← {lang === "en" ? "Back to Dashboard" : "Volver al Panel Principal"}
              </button>

              {saveSuccess && (
                <div style={styles.successBanner}>
                  ✅ {lang === "en" ? "Settings saved successfully!" : "¡Configuraciones guardadas exitosamente!"}
                </div>
              )}

            {/* PESTAÑA 1: DATOS GENERALES */}
            {activeTab === "general" && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Business Profile" : "Perfil del Negocio"}</h3>
                <form onSubmit={handleSaveGeneral} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{lang === "en" ? "Business Name" : "Nombre del Negocio"}</label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{lang === "en" ? "Description" : "Descripción"}</label>
                    <textarea
                      rows="4"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      style={{ ...styles.input, resize: "none" }}
                    />
                  </div>

                  <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>{lang === "en" ? "Phone" : "Teléfono"}</label>
                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>WhatsApp</label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{lang === "en" ? "Price Range (e.g., $, $$, $$$)" : "Rango de Precios (ej. $, $$, $$$)"}</label>
                    <input
                      type="text"
                      value={rangoPrecios}
                      onChange={(e) => setRangoPrecios(e.target.value)}
                      placeholder="$, $$, $$$"
                      style={styles.input}
                    />
                  </div>

                  {/* Carga de Logo y Galería de Fotos */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", margin: "20px 0", borderTop: "1px dashed rgba(20, 109, 158, 0.10)", paddingTop: "20px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", color: "var(--atlan-gold)", margin: 0 }}>
                      📸 {lang === "en" ? "Business Media" : "Medios del Negocio"}
                    </h4>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "20px", alignItems: "center" }} className="form-grid-2">
                      {/* Logo Upload */}
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          border: "2px solid rgba(20, 109, 158, 0.12)",
                          background: logoUrl ? `url(${logoUrl}) center/cover no-repeat` : "rgba(255,255,255,0.02)",
                          margin: "0 auto 10px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: logoUrl ? "0px" : "24px",
                          color: "#9CA3AF"
                        }}>
                          {!logoUrl && "🏢"}
                        </div>
                        <label style={{
                          padding: "9px 16px",
                          background: "rgba(20, 109, 158, 0.08)",
                          border: "1.5px solid rgba(20, 109, 158, 0.18)",
                          borderRadius: "10px",
                          fontSize: "12.5px",
                          fontWeight: "800",
                          cursor: "pointer",
                          color: "#146D9E",
                          transition: "all 0.2s"
                        }}>
                          {uploadingLogo ? "..." : (lang === "en" ? "📷 Upload Logo" : "📷 Subir Logo")}
                          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                        </label>
                      </div>

                      {/* Photo Gallery Upload */}
                      <div>
                        <label style={styles.label}>{lang === "en" ? "Photo Gallery" : "Galería de Fotos"}</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
                          {fotos.map((url, index) => (
                            <div key={index} style={{
                              width: "70px",
                              height: "70px",
                              borderRadius: "10px",
                              border: "1px solid rgba(20, 109, 158, 0.12)",
                              background: `url(${url}) center/cover no-repeat`,
                              position: "relative"
                            }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveFoto(url)}
                                style={{
                                  position: "absolute",
                                  top: "-6px",
                                  right: "-6px",
                                  background: "#ef4444",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "18px",
                                  height: "18px",
                                  fontSize: "9px",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center"
                                }}
                              >
                                ✗
                              </button>
                            </div>
                          ))}
                          
                          <label style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "10px",
                            border: "1.5px dashed rgba(20, 109, 158, 0.15)",
                            background: "rgba(255,255,255,0.01)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: "18px",
                            cursor: "pointer",
                            color: "var(--atlan-gold)"
                          }}>
                            {uploadingFoto ? "..." : "+"}
                            <input type="file" accept="image/*" onChange={handleFotoUpload} style={{ display: "none" }} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="submit" disabled={isSaving} style={styles.saveBtn}>
                      {isSaving ? "..." : (lang === "en" ? "Save Profile" : "Guardar Perfil")}
                    </button>
                    {puntoAsociado && puntoAsociado.estado === 'rechazado' && (
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            // 1. Guardar cambios
                            const payload = {
                              nombre: nombre || null,
                              descripcion: descripcion || null,
                              telefono: telefono || null,
                              whatsapp: whatsapp || null,
                              rango_precios: rangoPrecios || null,
                              logo_url: logoUrl || null,
                              fotos: fotos || [],
                              motivo_rechazo: null // limpiar motivo
                            };
                            const { error: errNeg } = await supabase
                              .from("negocios")
                              .update(payload)
                              .eq("id", negocio.id);
                            if (errNeg) throw errNeg;

                            // 2. Cambiar a en_verificacion
                            const { error: errPto } = await supabase
                              .from("puntos")
                              .update({ estado: "en_verificacion" })
                              .eq("id", puntoAsociado.id);
                            if (errPto) throw errPto;

                            alert(lang === "en" 
                              ? "Saved and resubmitted successfully!" 
                              : "¡Guardado y reenviado exitosamente!");
                            
                            // Recargar y volver a overview
                            await loadNegocioData(user.id);
                            const { data: updatedNeg } = await supabase
                              .from("negocios")
                              .select("*")
                              .eq("id", negocio.id)
                              .single();
                            if (updatedNeg) selectNegocio(updatedNeg);
                          } catch (e) {
                            console.error(e);
                            alert("Error al guardar y reenviar.");
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                        style={{
                          ...styles.saveBtn,
                          background: 'linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(23, 170, 74,0.2)'
                        }}
                      >
                        {isSaving ? "..." : (lang === 'en' ? 'Save & Resubmit' : 'Guardar y Reenviar')}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* PESTAÑA 2: CHECKLIST DE EXCENTRICIDADES */}
            {activeTab === "excentricidades" && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Services & Features Checklist" : "Checklist de Servicios y Excentricidades"}</h3>
                <p style={{ color: "#4A5568", fontSize: "13px", marginBottom: "20px" }}>
                  {lang === "en" 
                    ? "Select the options that apply to your business. This will enable custom sections in your dashboard." 
                    : "Selecciona las opciones que aplican a tu negocio. Esto habilitará secciones personalizadas en tu panel."}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                  {/* Menú Gastronómico */}
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasMenu}
                      onChange={(e) => setHasMenu(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E" }}>🍲 {lang === "en" ? "Gastronomic Menu" : "Menú Gastronómico"}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Display list of dishes and prices to tourists" : "Muestra lista de platillos y precios a los turistas"}</div>
                    </div>
                  </label>

                  {/* Horarios */}
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasHours}
                      onChange={(e) => setHasHours(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E" }}>⏰ {lang === "en" ? "Opening Hours" : "Horarios de Atención"}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Specify opening and closing schedules" : "Especifica horarios de apertura y cierre"}</div>
                    </div>
                  </label>

                  {/* Hospedaje */}
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasLodging}
                      onChange={(e) => setHasLodging(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E" }}>🏨 {lang === "en" ? "Lodging Services" : "Servicios de Hospedaje"}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Accept room/bed reservations directly" : "Acepta reservas de habitaciones directamente"}</div>
                    </div>
                  </label>

                  {/* Transporte */}
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasTransport}
                      onChange={(e) => setHasTransport(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E" }}>🚌 {lang === "en" ? "Transport / Tours" : "Transporte o Tours"}</div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Provide tourist routing and itineraries" : "Provee itinerarios y rutas de viaje"}</div>
                    </div>
                  </label>
                </div>

                <button onClick={handleSaveExcentricidades} disabled={isSaving} style={styles.saveBtn}>
                  {isSaving ? "..." : (lang === "en" ? "Save Services" : "Guardar Servicios")}
                </button>
              </div>
            )}
            {/* PESTAÑA DE HORARIOS DE ATENCIÓN */}
            {activeTab === "horarios" && hasHours && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Configure Opening Hours" : "Configurar Horarios de Atención"}</h3>
                <form onSubmit={handleSaveHorarios} style={styles.form}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    {Object.keys(horarios).map((day) => {
                      const dayLabels = {
                        lunes: lang === "en" ? "Monday" : "Lunes",
                        martes: lang === "en" ? "Tuesday" : "Martes",
                        miercoles: lang === "en" ? "Wednesday" : "Miércoles",
                        jueves: lang === "en" ? "Thursday" : "Jueves",
                        viernes: lang === "en" ? "Friday" : "Viernes",
                        sabado: lang === "en" ? "Saturday" : "Sábado",
                        domingo: lang === "en" ? "Sunday" : "Domingo",
                      };
                      return (
                        <div key={day} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(20, 109, 158, 0.05)", gap: "10px" }}>
                          <span style={{ fontWeight: "750", width: "120px" }}>{dayLabels[day]}</span>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                              <input
                                type="checkbox"
                                checked={horarios[day].abierto}
                                onChange={(e) => setHorarios({
                                  ...horarios,
                                  [day]: { ...horarios[day], abierto: e.target.checked }
                                })}
                                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                              />
                              {lang === "en" ? "Open" : "Abierto"}
                            </label>

                            {horarios[day].abierto && (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                  type="time"
                                  value={horarios[day].apertura}
                                  onChange={(e) => setHorarios({
                                    ...horarios,
                                    [day]: { ...horarios[day], apertura: e.target.value }
                                  })}
                                  style={{
                                    background: "rgba(20, 109, 158, 0.05)",
                                    border: "1px solid rgba(20, 109, 158, 0.15)",
                                    borderRadius: "8px",
                                    color: "#1A1A2E",
                                    fontSize: "13px",
                                    padding: "6px 10px",
                                    outline: "none"
                                  }}
                                />
                                <span>-</span>
                                <input
                                  type="time"
                                  value={horarios[day].cierre}
                                  onChange={(e) => setHorarios({
                                    ...horarios,
                                    [day]: { ...horarios[day], cierre: e.target.value }
                                  })}
                                  style={{
                                    background: "rgba(20, 109, 158, 0.05)",
                                    border: "1px solid rgba(20, 109, 158, 0.15)",
                                    borderRadius: "8px",
                                    color: "#1A1A2E",
                                    fontSize: "13px",
                                    padding: "6px 10px",
                                    outline: "none"
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button type="submit" disabled={isSaving} style={styles.saveBtn}>
                    {isSaving ? "..." : (lang === "en" ? "Save Hours" : "Guardar Horarios")}
                  </button>
                </form>
              </div>
            )}

            {/* PESTAÑA 3: MENÚ GASTRONÓMICO */}
            {activeTab === "menu" && hasMenu && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Manage Gastronomic Menu" : "Gestionar Menú Gastronómico"}</h3>
                
                {/* Formulario Agregar */}
                <form onSubmit={handleAddPlato} style={{ ...styles.form, background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(20, 109, 158, 0.05)", marginBottom: "24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                    <input
                      type="text"
                      required
                      placeholder={lang === "en" ? "Dish Name" : "Nombre del Plato"}
                      value={newPlatoNombre}
                      onChange={(e) => setNewPlatoNombre(e.target.value)}
                      style={styles.input}
                    />
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder={lang === "en" ? "Price ($)" : "Precio ($)"}
                      value={newPlatoPrecio}
                      onChange={(e) => setNewPlatoPrecio(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder={lang === "en" ? "Description (optional)" : "Descripción corta (opcional)"}
                    value={newPlatoDesc}
                    onChange={(e) => setNewPlatoDesc(e.target.value)}
                    style={styles.input}
                  />

                  {/* Selector de Foto para Plato */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "10px 0 16px 0" }}>
                    {newPlatoFotoUrl ? (
                      <div style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "8px",
                        border: "1px solid rgba(20, 109, 158, 0.12)",
                        background: `url(${newPlatoFotoUrl}) center/cover no-repeat`
                      }} />
                    ) : (
                      <div style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "8px",
                        border: "1.5px dashed rgba(20, 109, 158, 0.15)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: "16px",
                        color: "#9CA3AF"
                      }}>
                        🍲
                      </div>
                    )}
                    <label style={{
                      padding: "9px 16px",
                      background: "rgba(20, 109, 158, 0.08)",
                      border: "1.5px solid rgba(20, 109, 158, 0.18)",
                      borderRadius: "10px",
                      fontSize: "12.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      color: "#146D9E",
                      transition: "all 0.2s"
                    }}>
                      {uploadingPlatoFoto ? "..." : (lang === "en" ? "📸 Add Dish Photo" : "📸 Agregar Foto del Plato")}
                      <input type="file" accept="image/*" onChange={handlePlatoFotoUpload} style={{ display: "none" }} />
                    </label>
                  </div>

                  <button type="submit" disabled={isAddingPlato || uploadingPlatoFoto} style={{ ...styles.saveBtn, margin: 0, padding: "10px" }}>
                    {isAddingPlato ? "..." : `➕ ${lang === "en" ? "Add Item" : "Agregar Platillo"}`}
                  </button>
                </form>

                {/* Lista Platos */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {menuItems.length === 0 ? (
                    <p style={{ color: "#9CA3AF", fontSize: "13px" }}>{lang === "en" ? "No dishes added yet." : "Aún no has agregado platillos a tu menú."}</p>
                  ) : (
                    menuItems.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(20, 109, 158, 0.03)", border: "1px solid rgba(20, 109, 158, 0.08)", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          {item.foto_url ? (
                            <div style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "8px",
                              background: `url(${item.foto_url}) center/cover no-repeat`,
                              border: "1px solid rgba(20, 109, 158, 0.10)"
                            }} />
                          ) : (
                            <div style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "8px",
                              background: "rgba(20, 109, 158, 0.03)",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              fontSize: "20px",
                              border: "1px solid rgba(20, 109, 158, 0.05)"
                            }}>
                              🍲
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "750", fontSize: "14px" }}>{item.nombre}</div>
                            {item.descripcion && <div style={{ fontSize: "11px", color: "#4A5568", marginTop: "2px" }}>{item.descripcion}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <span style={{ fontWeight: "800", color: "var(--atlan-gold)" }}>${item.precio}</span>
                          <button onClick={() => handleDeletePlato(item.id)} style={styles.deleteBtn}>🗑️</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 4: RESERVAS */}
            {activeTab === "reservas" && hasLodging && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Booking & Reservations Log" : "Bitácora de Reservas"}</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {reservas.length === 0 ? (
                    <p style={{ color: "#9CA3AF", fontSize: "13px" }}>{lang === "en" ? "No bookings received." : "No se han recibido reservas."}</p>
                  ) : (
                    reservas.map((res) => (
                      <div key={res.id} style={{ padding: "16px", background: "rgba(20, 109, 158, 0.03)", border: "1px solid rgba(20, 109, 158, 0.08)", borderRadius: "16px", display: "flex", justifycontent: "space-between", alignitems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "800", fontSize: "14px", color: "#1A1A2E" }}>
                            👤 {res.perfiles?.nombre_completo || (lang === "en" ? "Anonymous Traveler" : "Turista Anónimo")}
                          </div>
                          <div style={{ fontSize: "12.5px", color: "#4A5568", marginTop: "4px" }}>
                            📅 {new Date(res.fecha_hora).toLocaleString()}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--atlan-gold)", marginTop: "4px" }}>
                            👥 {lang === "en" ? "Guests:" : "Personas:"} {res.num_personas || 1}
                          </div>
                          {res.notas && (
                            <div style={{ fontSize: "12px", color: "#4A5568", marginTop: "6px", fontStyle: "italic" }}>
                              💬 "{res.notas}"
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignitems: "flex-end", gap: "8px", marginLeft: "16px" }}>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: "800",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: res.estado_reserva === "aprobada" ? "rgba(23, 170, 74,0.15)" : res.estado_reserva === "pendiente" ? "rgba(230, 194, 0,0.15)" : "rgba(239,68,68,0.15)",
                            color: res.estado_reserva === "aprobada" ? "#17AA4A" : res.estado_reserva === "pendiente" ? "#E6A800" : "#ef4444"
                          }}>
                            {(res.estado_reserva || "pendiente").toUpperCase()}
                          </span>
                          
                          {res.estado_reserva === "pendiente" && (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleUpdateReservaStatus(res.id, "aprobada")} style={styles.actionApproveBtn}>✓</button>
                              <button onClick={() => handleUpdateReservaStatus(res.id, "cancelada")} style={styles.actionCancelBtn}>✗</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 5: RESEÑAS */}
            {activeTab === "resenas" && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Customer Feedback" : "Opiniones de Clientes"}</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {resenas.length === 0 ? (
                    <p style={{ color: "#9CA3AF", fontSize: "13px" }}>{lang === "en" ? "No reviews left yet." : "Aún no hay reseñas registradas."}</p>
                  ) : (
                    resenas.map((rev) => (
                      <div key={rev.id} style={{ padding: "14px", background: "rgba(20, 109, 158, 0.03)", border: "1px solid rgba(20, 109, 158, 0.08)", borderRadius: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontWeight: "750", fontSize: "13px" }}>{rev.nombre_usuario}</span>
                          <span style={{ color: "var(--atlan-gold)", fontWeight: "700" }}>⭐ {rev.estrellas}</span>
                        </div>
                        <p style={{ fontSize: "12.5px", color: "#4A5568", margin: 0 }}>"{rev.comentario}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>
        )}
      </div>
      )}
    </div>
  );
}

// ── ESTILOS PREMIUM DASHBOARD ───────────────────────────────────────────────
const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background: "var(--atlan-bg-primary)",
    color: "#1A1A2E",
    fontFamily: "var(--font-outfit), sans-serif",
    padding: "110px 24px 40px 24px",
    position: "relative",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "var(--atlan-bg-primary)",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    padding: "20px 32px",
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(20, 109, 158, 0.12)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
  },
  logoIcon: {
    fontSize: "22px",
  },
  logoText: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#FFD700",
  },
  badgeRol: {
    background: "rgba(255, 215, 0,0.1)",
    border: "1px solid rgba(255, 215, 0,0.2)",
    color: "#FFD700",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.05em",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    padding: "8px 16px",
    borderRadius: "10px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  noNegocioContainer: {
    maxWidth: "600px",
    margin: "40px auto",
    padding: "32px",
    borderRadius: "28px",
    background: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.08), 0 20px 48px -6px rgba(20, 109, 158, 0.14)",
  },
  claimSection: {
    background: "rgba(255,255,255,0.02)",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid rgba(20, 109, 158, 0.05)",
  },
  pointsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "220px",
    overflowY: "auto",
    marginTop: "8px",
  },
  pointRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "rgba(20, 109, 158, 0.03)",
    border: "1px solid rgba(20, 109, 158, 0.08)",
    borderRadius: "10px",
  },
  claimBtn: {
    background: "#FFD700",
    color: "#FFFFFF",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    fontWeight: "750",
    fontSize: "12px",
    cursor: "pointer",
  },
  createBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "13.5px",
    cursor: "pointer",
  },
  dashboardOverviewLayout: {
    maxWidth: "1100px",
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: "0px",
    marginBottom: "0px",
    width: "100%",
  },
  dashboardDetailLayout: {
    maxWidth: "1100px",
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: "0px",
    marginBottom: "0px",
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  overviewContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  overviewHeader: {
    background: "#FFFFFF",
    padding: "36px",
    borderRadius: "24px",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "inset 3px 3px 8px rgba(255, 255, 255, 1), inset -4px -4px 10px rgba(20, 109, 158, 0.05), 0 12px 28px -6px rgba(20, 109, 158, 0.10)",
  },
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
  },
  dashboardCard: {
    background: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    borderRadius: "24px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    boxShadow: "inset 3px 3px 8px rgba(255, 255, 255, 1), inset -4px -4px 10px rgba(20, 109, 158, 0.05), 0 12px 28px -6px rgba(20, 109, 158, 0.10)",
  },
  cardIcon: {
    fontSize: "32px",
    marginBottom: "20px",
    background: "rgba(20, 109, 158, 0.03)",
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16px",
    border: "1px solid rgba(20, 109, 158, 0.05)",
  },
  cardTitle: {
    fontSize: "19px",
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: "8px",
    letterSpacing: "-0.01em",
  },
  cardDesc: {
    fontSize: "13.5px",
    color: "#4A5568",
    lineHeight: "1.5",
  },
  cardBadge: {
    position: "absolute",
    top: "24px",
    right: "24px",
    background: "#ef4444",
    color: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    boxShadow: "0 2px 10px rgba(239, 68, 68, 0.4)",
  },

  mainContent: {
    padding: "32px",
    borderRadius: "24px",
    background: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.08), 0 16px 36px -6px rgba(20, 109, 158, 0.10)",
    minHeight: "450px",
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  tabTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "var(--atlan-gold-dark, #B8960E)",
    marginBottom: "16px",
    letterSpacing: "-0.01em",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12.5px",
    fontWeight: "750",
    color: "#4A5568",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    background: "#F4F6F9",
    border: "1.5px solid rgba(20, 109, 158, 0.12)",
    borderRadius: "12px",
    color: "#1A1A2E",
    fontSize: "13.5px",
    outline: "none",
  },
  saveBtn: {
    alignSelf: "flex-start",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #FFD700 0%, #E6C200 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontWeight: "800",
    fontSize: "13.5px",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(255, 215, 0, 0.2)",
    marginTop: "8px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px",
    background: "#F4F6F9",
    border: "1px solid rgba(20, 109, 158, 0.10)",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  checkbox: {
    marginTop: "4px",
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
  successBanner: {
    background: "rgba(23, 170, 74, 0.15)",
    border: "1px solid rgba(23, 170, 74, 0.25)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#1FCC5C",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px",
  },
  actionApproveBtn: {
    background: "rgba(23, 170, 74, 0.2)",
    border: "none",
    color: "#17AA4A",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "14px",
  },
  actionCancelBtn: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "none",
    color: "#ef4444",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "14px",
  },
};
