"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";
import { uploadMedia } from "@/lib/storage";

// Helper para obtener imagen por defecto según la categoría del negocio
const getCategoryFallbackImage = (categoria) => {
  const cat = (categoria || "").toLowerCase();
  if (cat.includes("comideria") || cat.includes("restaurante") || cat.includes("comida")) {
    return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80";
  }
  if (cat.includes("hotel") || cat.includes("hostal") || cat.includes("hospedaje")) {
    return "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";
  }
  if (cat.includes("playa") || cat.includes("mar")) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80";
  }
  if (cat.includes("tour") || cat.includes("artesanal") || cat.includes("tienda")) {
    return "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80";
  }
  return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";
};

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

  // Modo de vista: 'hub' (galería multi-negocio) | 'manage' (gestión del negocio seleccionado)
  const [viewMode, setViewMode] = useState("hub");

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
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
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
  const [hasWifi, setHasWifi] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [hasCardPayment, setHasCardPayment] = useState(false);
  const [hasAccessibility, setHasAccessibility] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);
  const [hasOnlineBooking, setHasOnlineBooking] = useState(false);
  const [hasAc, setHasAc] = useState(false);
  const [hasKidsArea, setHasKidsArea] = useState(false);
  const [hasLiveMusic, setHasLiveMusic] = useState(false);

  // Menú (menu_items)
  const [menuItems, setMenuItems] = useState([]);
  const [newPlatoNombre, setNewPlatoNombre] = useState("");
  const [newPlatoPrecio, setNewPlatoPrecio] = useState("");
  const [newPlatoDesc, setNewPlatoDesc] = useState("");
  const [newPlatoFotoUrl, setNewPlatoFotoUrl] = useState("");
  const [uploadingPlatoFoto, setUploadingPlatoFoto] = useState(false);
  const [isAddingPlato, setIsAddingPlato] = useState(false);

  // Edición de Platillo (Modal)
  const [editingPlato, setEditingPlato] = useState(null); // Objeto plato a editar o null
  const [editPlatoNombre, setEditPlatoNombre] = useState("");
  const [editPlatoPrecio, setEditPlatoPrecio] = useState("");
  const [editPlatoDesc, setEditPlatoDesc] = useState("");
  const [editPlatoFotoUrl, setEditPlatoFotoUrl] = useState("");
  const [editPlatoDisponible, setEditPlatoDisponible] = useState(true);
  const [uploadingEditPlatoFoto, setUploadingEditPlatoFoto] = useState(false);
  const [isSavingEditPlato, setIsSavingEditPlato] = useState(false);

  // Reservas
  const [reservas, setReservas] = useState([]);

  // Reseñas
  const [resenas, setResenas] = useState([]);

  // Toast Notification 3D
  const [toastBanner, setToastBanner] = useState(null); // { message, type }
  const showToast = (message, type = "success") => {
    setToastBanner({ message, type });
    setTimeout(() => setToastBanner(null), 4000);
  };

  // Reclamar punto
  const [puntosDisponibles, setPuntosDisponibles] = useState([]);
  const [isClaiming, setIsClaiming] = useState(false);

  // Modal de Verificación de Reclamo
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showSearchClaimModal, setShowSearchClaimModal] = useState(false);
  const [claimSearchTerm, setClaimSearchTerm] = useState("");
  const [claimSearchPage, setClaimSearchPage] = useState(1);
  const [claimTargetPunto, setClaimTargetPunto] = useState(null); // punto objeto o 'gps'
  const [solicitanteNombre, setSolicitanteNombre] = useState("");
  const [solicitanteCedula, setSolicitanteCedula] = useState("");
  const [solicitanteTelefono, setSolicitanteTelefono] = useState("");
  const [documentoCedulaUrl, setDocumentoCedulaUrl] = useState("");
  const [documentoPropiedadUrl, setDocumentoPropiedadUrl] = useState("");
  const [solicitudNotas, setSolicitudNotas] = useState("");
  const [uploadingCedulaDoc, setUploadingCedulaDoc] = useState(false);
  const [uploadingPropiedadDoc, setUploadingPropiedadDoc] = useState(false);

  // Estado del punto geográfico asociado
  const [puntoAsociado, setPuntoAsociado] = useState(null);
  const [loadingPunto, setLoadingPunto] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const negocioRef = React.useRef(negocio);
  useEffect(() => {
    negocioRef.current = negocio;
  }, [negocio]);

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
        await loadNegocioData(currentUser.id, true);
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Supabase Realtime WebSockets + Polling automático de estado de solicitud
  useEffect(() => {
    if (!user) return;

    // 1. Escuchar actualizaciones de negocios y puntos en tiempo real
    const channel = supabase
      .channel(`realtime_dashboard_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'negocios', filter: `dueno_id=eq.${user.id}` },
        async () => {
          console.log('[Realtime] Cambio de negocio detectado');
          await loadNegocioData(user.id, false);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'puntos' },
        async () => {
          console.log('[Realtime] Cambio en puntos detectado');
          await loadNegocioData(user.id, false);
        }
      )
      .subscribe();

    // 2. Intervalo de refresco secundario (sondeo de seguridad cada 5s)
    const interval = setInterval(() => {
      loadNegocioData(user.id, false);
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const loadNegocioData = async (userId, isInitialLoad = false) => {
    const { data: negociosData } = await supabase
      .from("negocios")
      .select("*")
      .eq("dueno_id", userId);

    // Cargar siempre puntos comunitarios libres disponibles para reclamos adicionales
    const { data: puntosLibres } = await supabase
      .from("puntos")
      .select("*")
      .eq("estado", "sin_reclamar")
      .is("negocio_id", null);
    setPuntosDisponibles(puntosLibres || []);

    if (negociosData && negociosData.length > 0) {
      setMisNegocios(negociosData);

      const currentNegocio = negocioRef.current;
      if (!currentNegocio) {
        selectNegocio(negociosData[0], { resetTab: isInitialLoad, updateForm: true });
      } else {
        const updated = negociosData.find((n) => n.id === currentNegocio.id) || negociosData[0];
        selectNegocio(updated, { resetTab: false, updateForm: isInitialLoad });
      }
    } else {
      setMisNegocios([]);
      setNegocio(null);
      setViewMode("hub");
    }
  };

  const selectNegocio = (negocioData, options = {}) => {
    const { resetTab = false, updateForm = true } = options;

    setNegocio(negocioData);
    if (updateForm) {
      setNombre(negocioData.nombre || "");
      setDescripcion(negocioData.descripcion || "");
      setTelefono(negocioData.telefono || "");
      setWhatsapp(negocioData.whatsapp || "");
      setWebsite(negocioData.website || "");
      setFacebook(negocioData.facebook || "");
      setInstagram(negocioData.instagram || "");
      setTiktok(negocioData.tiktok || "");
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
      setHasWifi(!!serv.has_wifi);
      setHasParking(!!serv.has_parking);
      setHasPets(!!serv.has_pets);
      setHasCardPayment(!!serv.has_card_payment);
      setHasAccessibility(!!serv.has_accessibility);
      setHasDelivery(!!serv.has_delivery);
      setHasOnlineBooking(!!serv.has_online_booking);
      setHasAc(!!serv.has_ac);
      setHasKidsArea(!!serv.has_kids_area);
      setHasLiveMusic(!!serv.has_live_music);
    }

    // Cargar detalles asociados
    const serv = negocioData.servicios || {};
    if (serv.has_menu) loadMenuItems(negocioData.id);
    if (serv.has_lodging) loadReservas(negocioData.id);
    loadResenas(negocioData.id);
    loadPuntoAsociado(negocioData.id);

    if (resetTab) {
      setActiveTab("overview");
    }
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
    if (!negocio) return;

    setIsResubmitting(true);
    try {
      const targetNegocioId = negocio.id;

      // 1. Liberar cualquier punto en la base de datos asociado a este negocio
      await supabase
        .from("puntos")
        .update({ 
          negocio_id: null,
          estado: "sin_reclamar" 
        })
        .eq("negocio_id", targetNegocioId);

      // 2. Limpiar tablas asociadas para evitar conflictos de claves foráneas
      await supabase.from("menu_items").delete().eq("negocio_id", targetNegocioId);
      await supabase.from("reservas").delete().eq("negocio_id", targetNegocioId);

      // 3. Eliminar el negocio
      const { error: errorNegocio } = await supabase
        .from("negocios")
        .delete()
        .eq("id", targetNegocioId);

      if (errorNegocio) {
        console.warn("Desvinculando dueno_id de negocio:", errorNegocio);
        await supabase
          .from("negocios")
          .update({ dueno_id: null, activo: false })
          .eq("id", targetNegocioId);
      }

      // 4. Limpiar estado local de inmediato para cambiar la vista inmediatamente a CASO A
      setNegocio(null);
      setPuntoAsociado(null);
      setMisNegocios((prev) => prev.filter((n) => n.id !== targetNegocioId));

      showToast(lang === "en" ? "Claim canceled successfully." : "¡Solicitud de reclamo cancelada con éxito!", "success");

      // 5. Cargar puntos libres de nuevo para la lista de reclamos
      const { data: puntosLibres } = await supabase
        .from("puntos")
        .select("*")
        .eq("estado", "sin_reclamar")
        .is("negocio_id", null);
      setPuntosDisponibles(puntosLibres || []);

    } catch (err) {
      console.error("Error canceling claim:", err);
      showToast(lang === "en" ? "Error canceling claim." : "Error al cancelar el reclamo.", "error");
    } finally {
      setIsResubmitting(false);
    }
  };

  // Reclamar un punto geográfico
  const handleInitiateClaim = (punto) => {
    if (punto && punto !== "gps" && (punto.estado === "en_verificacion" || punto.negocio_id)) {
      showToast(lang === "en" 
        ? "⏳ This location already has a pending claim request under admin review." 
        : "⏳ Este local ya cuenta con una solicitud de reclamo en proceso de verificación por la administración.", "info");
      return;
    }
    setClaimTargetPunto(punto);
    setSolicitanteNombre(perfil?.nombre_completo || "");
    setSolicitanteCedula("");
    setSolicitanteTelefono(perfil?.telefono || "");
    setDocumentoCedulaUrl("");
    setDocumentoPropiedadUrl("");
    setSolicitudNotas("");
    setShowClaimModal(true);
  };

  const handleDocUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "cedula") setUploadingCedulaDoc(true);
    else setUploadingPropiedadDoc(true);

    try {
      const url = await uploadMedia(file, "negocios/documentos");
      if (type === "cedula") setDocumentoCedulaUrl(url);
      else setDocumentoPropiedadUrl(url);
    } catch (err) {
      console.error("Error al subir documento:", err);
      alert(lang === "en" ? "Error uploading document" : "Error al subir el documento.");
    } finally {
      if (type === "cedula") setUploadingCedulaDoc(false);
      else setUploadingPropiedadDoc(false);
    }
  };

  const handleConfirmSubmitClaim = async (e) => {
    if (e) e.preventDefault();
    if (!solicitanteNombre.trim() || !solicitanteCedula.trim() || !solicitanteTelefono.trim()) {
      showToast(lang === "en" ? "Please fill in all required fields (Name, ID, Phone)." : "Por favor completa todos los campos requeridos (Nombre, Cédula y Teléfono).", "error");
      return;
    }
    if (!documentoCedulaUrl) {
      showToast(lang === "en" ? "Please attach your ID document." : "Por favor adjunta la foto o PDF de tu Cédula de Identidad.", "error");
      return;
    }

    setIsClaiming(true);
    try {
      const datosVerificacion = {
        solicitante_nombre: solicitanteNombre,
        solicitante_cedula: solicitanteCedula,
        solicitante_telefono: solicitanteTelefono,
        documento_cedula_url: documentoCedulaUrl,
        documento_propiedad_url: documentoPropiedadUrl,
        solicitud_notas: solicitudNotas,
        fecha_solicitud: new Date().toISOString()
      };

      if (claimTargetPunto === "gps") {
        if (!navigator.geolocation) {
          showToast(lang === "en" ? "GPS not supported" : "GPS no soportado en este navegador.", "error");
          setIsClaiming(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { longitude, latitude } = position.coords;
              const { data: nuevoNegocio, error: negocioError } = await supabase
                .from("negocios")
                .insert([{
                  dueno_id: user.id,
                  nombre: solicitanteNombre ? `Negocio de ${solicitanteNombre}` : "Nuevo Negocio",
                  tipo: "otro",
                  telefono: solicitanteTelefono,
                  whatsapp: solicitanteTelefono,
                  servicios: { has_menu: false, has_hours: false, has_lodging: false, has_transport: false },
                  activo: false,
                  datos_verificacion: datosVerificacion
                }])
                .select()
                .single();

              if (negocioError) throw negocioError;

              const { error: puntoError } = await supabase
                .from("puntos")
                .insert([{
                  negocio_id: nuevoNegocio.id,
                  nombre: nuevoNegocio.nombre,
                  categoria: "otro",
                  ubicacion: `POINT(${longitude} ${latitude})`,
                  estado: "en_verificacion",
                  nombre_creador: perfil?.nombre_completo || "Propietario"
                }]);

              if (puntoError) throw puntoError;

              setShowClaimModal(false);
              showToast(lang === "en" 
                ? "Verification request submitted! It is now pending admin approval." 
                : "¡Solicitud de verificación enviada! Tu reclamo está pendiente de aprobación por la administración.", "success");
              await loadNegocioData(user.id);
            } catch (err) {
              console.error("Error creating GPS claim:", err);
              showToast(lang === "en" ? "Error submitting claim." : "Error al enviar la solicitud.", "error");
            } finally {
              setIsClaiming(false);
            }
          },
          (geoErr) => {
            console.error("GPS error:", geoErr);
            showToast(lang === "en" ? "Failed to get GPS location." : "No se pudo obtener la ubicación GPS.", "error");
            setIsClaiming(false);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
        return;
      } else if (claimTargetPunto) {
        const isObj = claimTargetPunto && typeof claimTargetPunto === "object";
        const nombreNegocio = isObj && claimTargetPunto.nombre 
          ? claimTargetPunto.nombre 
          : (solicitanteNombre ? `Negocio de ${solicitanteNombre}` : "Nuevo Negocio");
        const tipoNegocio = isObj && claimTargetPunto.categoria ? claimTargetPunto.categoria : "otro";
        const descNegocio = isObj && claimTargetPunto.descripcion ? claimTargetPunto.descripcion : "";

        const { data: nuevoNegocio, error: negocioError } = await supabase
          .from("negocios")
          .insert([{
            dueno_id: user.id,
            nombre: nombreNegocio,
            descripcion: descNegocio,
            tipo: tipoNegocio,
            telefono: solicitanteTelefono,
            whatsapp: solicitanteTelefono,
            servicios: { has_menu: false, has_hours: false, has_lodging: false, has_transport: false },
            activo: false,
            datos_verificacion: datosVerificacion
          }])
          .select()
          .single();

        if (negocioError) {
          console.error("Error al insertar negocio:", negocioError?.message || JSON.stringify(negocioError));
          throw negocioError;
        }

        if (isObj && claimTargetPunto.id) {
          const { error: puntoError } = await supabase
            .from("puntos")
            .update({
              negocio_id: nuevoNegocio.id,
              estado: "en_verificacion"
            })
            .eq("id", claimTargetPunto.id);

          if (puntoError) console.warn("Error al actualizar punto:", puntoError);
        } else {
          const { error: puntoError } = await supabase
            .from("puntos")
            .insert([{
              negocio_id: nuevoNegocio.id,
              nombre: nuevoNegocio.nombre,
              categoria: nuevoNegocio.tipo || "otro",
              estado: "en_verificacion",
              nombre_creador: perfil?.nombre_completo || solicitanteNombre || "Propietario"
            }]);

          if (puntoError) console.warn("Error al crear punto:", puntoError);
        }

        setShowClaimModal(false);
        showToast(lang === "en" 
          ? "Verification request submitted! It is now pending admin approval." 
          : "¡Solicitud de verificación enviada! Tu reclamo está pendiente de aprobación por la administración.", "success");
        await loadNegocioData(user.id);
      }
    } catch (err) {
      console.error("Error submitting claim:", err?.message || err);
      showToast(lang === "en" ? "Error submitting claim." : `Error al enviar la solicitud: ${err?.message || "Inténtelo de nuevo"}`, "error");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCardClick = (e, tabName) => {
    if (e && e.preventDefault) e.preventDefault();
    setActiveTab(tabName);
  };

  const handleIrAlMapaParaMarcar = () => {
    router.push("/mapa");
  };

  // Guardar datos generales del negocio
  const handleSaveGeneral = async (e) => {
    if (e) e.preventDefault();
    if (!negocio || !negocio.id) {
      showToast(lang === "en" ? "No active business selected." : "No hay un negocio activo seleccionado.", "error");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Limpiar datos nulos u opcionales
      const payload = {
        nombre: nombre || null,
        descripcion: descripcion || null,
        telefono: telefono || null,
        whatsapp: whatsapp || null,
        website: website || null,
        facebook: facebook || null,
        instagram: instagram || null,
        tiktok: tiktok || null,
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
      
      setNegocio(prev => (prev ? { ...prev, ...payload } : prev));
      setSaveSuccess(true);
      showToast(lang === "en" ? "Profile saved successfully!" : "¡Perfil guardado exitosamente!", "success");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const errMsg = err?.message || err?.details || err?.hint || err?.code || (typeof err === "object" && err !== null ? (Object.keys(err).length > 0 ? JSON.stringify(err) : String(err)) : String(err));
      console.error("Error guardando negocio:", errMsg, err);
      showToast(`${lang === "en" ? "Error saving profile:" : "Error al guardar perfil:"} ${errMsg}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar excentricidades (checklist)
  const handleSaveExcentricidades = async () => {
    if (!negocio || !negocio.id) return;
    setIsSaving(true);
    try {
      const servicios = {
        has_menu: hasMenu,
        has_hours: hasHours,
        has_lodging: hasLodging,
        has_transport: hasTransport,
        has_wifi: hasWifi,
        has_parking: hasParking,
        has_pets: hasPets,
        has_card_payment: hasCardPayment,
        has_accessibility: hasAccessibility,
        has_delivery: hasDelivery,
        has_online_booking: hasOnlineBooking,
        has_ac: hasAc,
        has_kids_area: hasKidsArea,
        has_live_music: hasLiveMusic
      };

      const { error } = await supabase
        .from("negocios")
        .update({ servicios })
        .eq("id", negocio.id);

      if (error) throw error;

      // Actualizar estado local del negocio
      setNegocio(prev => (prev ? { ...prev, servicios } : prev));
      setSaveSuccess(true);
      showToast(lang === "en" ? "Services saved successfully!" : "¡Servicios guardados exitosamente!", "success");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando excentricidades:", err);
      const errMsg = err?.message || err?.details || err?.hint || String(err);
      showToast(`${lang === "en" ? "Error saving services:" : "Error al guardar servicios:"} ${errMsg}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar horarios
  const handleSaveHorarios = async (e) => {
    if (e) e.preventDefault();
    if (!negocio || !negocio.id) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const { error } = await supabase
        .from("negocios")
        .update({ horarios })
        .eq("id", negocio.id);

      if (error) throw error;
      setNegocio(prev => (prev ? { ...prev, horarios } : prev));
      setSaveSuccess(true);
      showToast(lang === "en" ? "Hours saved successfully!" : "¡Horarios guardados exitosamente!", "success");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando horarios:", err);
      const errMsg = err?.message || err?.details || err?.hint || String(err);
      showToast(`${lang === "en" ? "Error saving hours:" : "Error al guardar horarios:"} ${errMsg}`, "error");
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

  // Menú: Iniciar edición de plato
  const handleStartEditPlato = (item) => {
    setEditingPlato(item);
    setEditPlatoNombre(item.nombre || "");
    setEditPlatoPrecio(item.precio != null ? item.precio.toString() : "");
    setEditPlatoDesc(item.descripcion || "");
    setEditPlatoFotoUrl(item.foto_url || "");
    setEditPlatoDisponible(item.disponible !== false);
  };

  // Menú: Subir foto en edición
  const handleEditPlatoFotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditPlatoFoto(true);
    try {
      const url = await uploadMedia(file, "negocios/menu");
      setEditPlatoFotoUrl(url);
    } catch (err) {
      console.error("Error al subir foto de edición del platillo:", err);
      alert(lang === "en" ? "Error uploading menu photo" : "Error al subir la foto del platillo");
    } finally {
      setUploadingEditPlatoFoto(false);
    }
  };

  // Menú: Guardar cambios de edición
  const handleSaveEditPlato = async (e) => {
    if (e) e.preventDefault();
    if (!editingPlato || !editPlatoNombre || !editPlatoPrecio) return;
    setIsSavingEditPlato(true);
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({
          nombre: editPlatoNombre,
          precio: parseFloat(editPlatoPrecio),
          descripcion: editPlatoDesc,
          foto_url: editPlatoFotoUrl,
          disponible: editPlatoDisponible
        })
        .eq("id", editingPlato.id);

      if (error) throw error;

      showToast(lang === "en" ? "Dish updated successfully!" : "¡Platillo actualizado exitosamente!", "success");
      setEditingPlato(null);
      loadMenuItems(negocio.id);
    } catch (err) {
      console.error("Error al editar platillo:", err);
      showToast(lang === "en" ? "Error updating dish" : "Error al actualizar platillo", "error");
    } finally {
      setIsSavingEditPlato(false);
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

      {/* TOAST NOTIFICATION BANNER 3D CLAYMORFISMO */}
      {toastBanner && (
        <div style={{
          position: "fixed",
          top: "84px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1100,
          background: toastBanner.type === "success" 
            ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" 
            : toastBanner.type === "error"
            ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
            : "linear-gradient(135deg, #146D9E 0%, #0D4E72 100%)",
          color: "#FFFFFF",
          padding: "14px 28px",
          borderRadius: "20px",
          fontWeight: "800",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 14px 35px rgba(0, 0, 0, 0.25), inset 2px 2px 4px rgba(255, 255, 255, 0.4)",
          border: "2px solid rgba(255, 255, 255, 0.8)",
          pointerEvents: "none"
        }} className="animate-fade-in-down">
          <span>{toastBanner.type === "success" ? "✅" : toastBanner.type === "error" ? "❌" : "ℹ️"}</span>
          <span>{toastBanner.message}</span>
        </div>
      )}

      {/* HUB MULTI-NEGOCIO: SE MUESTRA SIEMPRE QUE VIEWMODE ES 'hub' O NO HAY NEGOCIO SELECCIONADO */}
      {viewMode === "hub" || !negocio ? (
        <div style={{ ...styles.dashboardOverviewLayout, marginTop: "20px" }} className="animate-fade-in-up">
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px"
          }}>
            <div>
              <div style={{
                fontSize: "12px",
                fontWeight: "800",
                color: "var(--atlan-gold)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "6px"
              }}>
                🏬 {lang === "en" ? "Business Management Hub" : "Panel de Gestión de Negocios"}
              </div>
              <h2 style={{ fontSize: "32px", fontWeight: "900", color: "#1A1A2E", margin: 0 }}>
                {lang === "en" ? "My Businesses" : "Mis Negocios"}
              </h2>
              <p style={{ color: "var(--atlan-text-secondary)", margin: "4px 0 0", fontSize: "14.5px" }}>
                {lang === "en"
                  ? "Manage your registered properties or claim/register new locations on the map."
                  : "Administra las fotos, menús y horarios de tus locales o reclama/registra nuevos puntos en el mapa."}
              </p>
            </div>

            {negocio && (
              <button
                onClick={() => setViewMode("manage")}
                className="clay-btn-gold"
                style={{ padding: "10px 20px", fontSize: "13px" }}
              >
                ⚡ {lang === "en" ? "Manage Selected Business" : "Administrar Negocio Actual"}
              </button>
            )}
          </div>

          {/* Grid de tarjetas por negocio (Compacto) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "16px"
          }}>
            {(misNegocios || []).map((n) => {
              const bgImg = n.logo_url || (n.fotos && n.fotos.length > 0 ? n.fotos[0] : getCategoryFallbackImage(n.tipo));
              const isSelected = negocio?.id === n.id;

              return (
                <div
                  key={n.id}
                  className="clay-card"
                  style={{
                    borderRadius: "18px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "#FFFFFF",
                    border: isSelected ? "2px solid #FFD700" : "1.5px solid rgba(20, 109, 158, 0.12)",
                    boxShadow: isSelected
                      ? "0 8px 20px rgba(255, 215, 0, 0.25), inset 2px 2px 4px rgba(255, 255, 255, 0.9)"
                      : "0 6px 16px rgba(0, 0, 0, 0.05), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
                    transition: "all 0.3s ease"
                  }}
                >
                  {/* Encabezado con imagen del negocio */}
                  <div style={{ position: "relative", height: "110px", width: "100%", background: "#F1F5F9" }}>
                    <img
                      src={bgImg}
                      alt={n.nombre}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)"
                    }} />

                    {/* Insignia de Estado */}
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: n.activo
                        ? "#17AA4A"
                        : n.motivo_rechazo
                        ? "#ef4444"
                        : "#E6A800",
                      color: "#FFFFFF",
                      padding: "3px 9px",
                      borderRadius: "16px",
                      fontSize: "10px",
                      fontWeight: "850",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      textTransform: "uppercase"
                    }}>
                      {n.activo
                        ? (lang === "en" ? "✅ Active" : "✅ Activo")
                        : n.motivo_rechazo
                        ? (lang === "en" ? "❌ Rejected" : "❌ Rechazado")
                        : (lang === "en" ? "⌛ In Verification" : "⌛ En Verificación")}
                    </div>

                    {/* Categoría Badge */}
                    <div style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      background: "rgba(255, 255, 255, 0.95)",
                      color: "#1A1A2E",
                      padding: "3px 8px",
                      borderRadius: "10px",
                      fontSize: "10px",
                      fontWeight: "800",
                      textTransform: "uppercase"
                    }}>
                      🏷️ {n.tipo || "Comercial"}
                    </div>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "850", color: "#1A1A2E" }}>
                        {n.nombre}
                      </h3>
                      {n.descripcion && (
                        <p style={{
                          margin: "4px 0 0",
                          fontSize: "12px",
                          color: "#4A5568",
                          lineHeight: "1.35",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          {n.descripcion}
                        </p>
                      )}
                    </div>

                    <div style={{ fontSize: "11px", color: "#64748B", display: "flex", flexDirection: "column", gap: "2px" }}>
                      {n.telefono && <span>📞 Tel: {n.telefono}</span>}
                      {n.rango_precios && <span>💵 Precios: {n.rango_precios}</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        selectNegocio(n);
                        setViewMode("manage");
                      }}
                      className="clay-btn-blue"
                      style={{
                        width: "100%",
                        padding: "7px 12px",
                        fontSize: "12px",
                        justifyContent: "center",
                        borderRadius: "10px",
                        marginTop: "4px"
                      }}
                    >
                      ⚙️ {lang === "en" ? "Manage This Business" : "Administrar este Negocio"}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Tarjeta Especial: Reclamar o Registrar Nuevo Negocio (Compacta) */}
            <div
              className="clay-card"
              style={{
                borderRadius: "18px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.9)",
                border: "2px dashed rgba(20, 109, 158, 0.3)",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.04)",
                minHeight: "220px",
                gap: "10px"
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(23, 170, 74, 0.12)",
                color: "#17AA4A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: "900"
              }}>
                ➕
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "850", color: "#1A1A2E" }}>
                  {lang === "en" ? "Claim or Register New Business" : "Reclama o Registra Otro Negocio"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: "#4A5568", lineHeight: "1.3" }}>
                  {lang === "en"
                    ? "Claim an existing point or register a new location."
                    : "¿Posees otro local? Reclama un punto libre o registra uno nuevo."}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setClaimSearchTerm("");
                    setShowSearchClaimModal(true);
                  }}
                  className="clay-btn-gold"
                  style={{ width: "100%", height: "38px", padding: "0 12px", fontSize: "11.5px", justifyContent: "center", borderRadius: "10px", display: "inline-flex", alignItems: "center", boxSizing: "border-box" }}
                >
                  🔍 {lang === "en" ? "Search Unclaimed Point" : "Buscar Punto Existente a Reclamar"}
                </button>

                <button
                  type="button"
                  onClick={() => handleInitiateClaim("gps")}
                  disabled={isClaiming}
                  className="clay-btn-green"
                  style={{ width: "100%", height: "38px", padding: "0 12px", fontSize: "11.5px", justifyContent: "center", borderRadius: "10px", display: "inline-flex", alignItems: "center", boxSizing: "border-box" }}
                >
                  📍 {lang === "en" ? "Register with GPS" : "Registrar con mi ubicación GPS"}
                </button>

                <button
                  type="button"
                  onClick={handleIrAlMapaParaMarcar}
                  disabled={isClaiming}
                  className="clay-btn-blue"
                  style={{ width: "100%", height: "38px", padding: "0 12px", fontSize: "11.5px", justifyContent: "center", borderRadius: "10px", display: "inline-flex", alignItems: "center", boxSizing: "border-box" }}
                >
                  🗺️ {lang === "en" ? "Mark on Map Manually" : "Marcar punto en el mapa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : !negocio.activo ? (
        /* CASO PENDIENTE: VISTA DE ESPERA DE SOLICITUD DE RECLAMO */
        <div style={{ ...styles.dashboardOverviewLayout, marginTop: "20px" }} className="animate-fade-in-up">
          <div className="clay-card" style={{
            padding: "36px 32px",
            background: "#FFFFFF",
            border: "2px solid rgba(255, 255, 255, 0.95)",
            boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.08), 0 20px 48px -6px rgba(20, 109, 158, 0.14)",
            borderRadius: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>
            {/* Encabezado de Estado */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid rgba(20, 109, 158, 0.08)", paddingBottom: "24px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "rgba(230, 194, 0, 0.12)", border: "2px solid #E6C200",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "26px", flexShrink: 0
              }}>
                ⏳
              </div>
              <div>
                <span className="clay-badge clay-badge-gold" style={{ marginBottom: "6px", display: "inline-block" }}>
                  {lang === "en" ? "VERIFICATION IN PROGRESS" : "VERIFICACIÓN EN PROCESO"}
                </span>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "850", color: "#1A1A2E" }}>
                  {lang === "en" ? "Business Claim Request Submitted" : "Solicitud de Reclamo Enviada"}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "#4A5568" }}>
                  {lang === "en" ? "Requested Business:" : "Negocio Solicitado:"} <strong style={{ color: "#146D9E" }}>{negocio.nombre}</strong>
                </p>
              </div>
            </div>

            {/* Step Progress Bar */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px",
              background: "#F8FAFC", padding: "20px", borderRadius: "18px", border: "1.5px solid rgba(20, 109, 158, 0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#17AA4A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "12px" }}>✓</span>
                <div>
                  <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#17AA4A" }}>Paso 1</div>
                  <div style={{ fontSize: "13px", fontWeight: "750", color: "#1A1A2E" }}>Solicitud Recibida</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#E6A800", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "12px" }}>2</span>
                <div>
                  <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#E6A800" }}>Paso 2 (En Curso)</div>
                  <div style={{ fontSize: "13px", fontWeight: "750", color: "#1A1A2E" }}>Revisión de Cédula/Docs</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#9CA3AF", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "12px" }}>3</span>
                <div>
                  <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#9CA3AF" }}>Paso 3</div>
                  <div style={{ fontSize: "13px", fontWeight: "750", color: "#6B7280" }}>Aprobación y Activación</div>
                </div>
              </div>
            </div>

            {/* Resumen de Documentación Enviada */}
            {negocio.datos_verificacion && (
              <div style={{ background: "#F4F6F9", padding: "18px 22px", borderRadius: "16px", border: "1px solid rgba(20, 109, 158, 0.1)" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "800", color: "#1A1A2E" }}>
                  📄 Resumen de Documentación de Propiedad Enviada
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", fontSize: "13px", color: "#4A5568" }}>
                  <div><strong>Solicitante:</strong> {negocio.datos_verificacion.solicitante_nombre}</div>
                  <div><strong>N° Cédula:</strong> {negocio.datos_verificacion.solicitante_cedula}</div>
                  <div><strong>Teléfono Contacto:</strong> {negocio.datos_verificacion.solicitante_telefono}</div>
                  <div>
                    <strong>Cédula de Identidad:</strong>{" "}
                    {negocio.datos_verificacion.documento_cedula_url ? (
                      <a href={negocio.datos_verificacion.documento_cedula_url} target="_blank" rel="noopener noreferrer" style={{ color: "#146D9E", fontWeight: "700" }}>
                        ✓ Adjuntada (Ver)
                      </a>
                    ) : "Sin adjuntar"}
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de Observaciones del Administrador si fue rechazado */}
            {negocio.motivo_rechazo && (
              <div style={{ background: "rgba(239, 68, 68, 0.08)", borderLeft: "4px solid #ef4444", padding: "16px 20px", borderRadius: "0 12px 12px 0", fontSize: "13.5px", color: "#1A1A2E", lineHeight: "1.5" }}>
                ⚠️ <strong>Observaciones del Administrador:</strong> {negocio.motivo_rechazo}
              </div>
            )}

            {/* Mensaje Informativo */}
            <div style={{ background: "rgba(20, 109, 158, 0.04)", borderLeft: "4px solid #146D9E", padding: "16px 20px", borderRadius: "0 12px 12px 0", fontSize: "13.5px", color: "#4A5568", lineHeight: "1.5" }}>
              🔒 <strong>Acceso a Administración Bloqueado:</strong> Tu solicitud está en revisión por el equipo de administración de Atlan. Para proteger a los verdaderos comerciantes, el acceso a la gestión del menú, reservas, horarios y edición estará bloqueado hasta que un Administrador apruebe tus documentos.
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
              <button onClick={() => router.push("/mapa")} className="clay-btn-blue" style={{ padding: "12px 24px", fontSize: "13.5px" }}>
                🗺️ {lang === "en" ? "Explore Map" : "Volver a Explorar el Mapa"}
              </button>
              <button onClick={() => setShowCancelConfirmModal(true)} disabled={isResubmitting} style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "12px 24px", borderRadius: "12px", fontSize: "13.5px", fontWeight: "700", cursor: "pointer" }}>
                ❌ {lang === "en" ? "Cancel Request" : "Cancelar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CASO C: EL DUEÑO YA FUE APROBADO Y SELECCIONÓ UN NEGOCIO VERIFICADO */
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
                  <button 
                    onClick={() => setViewMode("hub")} 
                    className="clay-btn-blue"
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    🏢 {lang === "en" ? "My Businesses Hub" : "Mis Negocios (Galería)"}
                  </button>
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
                  type="button"
                  onClick={(e) => handleCardClick(e, "general")}
                  className="hover-card clay-card animate-fade-in-up"
                  style={{
                    ...styles.dashboardCard,
                    background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
                    border: "2px solid #C7D2FE",
                    boxShadow: "0 12px 28px -4px rgba(79, 70, 229, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
                    opacity: negocio && !negocio.activo ? 0.75 : 1
                  }}
                >
                  <div style={{ ...styles.cardIcon, background: "#4F46E5", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(79, 70, 229, 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="info" size={22} color="#FFFFFF" />
                  </div>
                  <h3 style={{ ...styles.cardTitle, color: "#3730A3", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{lang === "en" ? "Business Profile" : "Perfil del Negocio"}</span>
                    {negocio && !negocio.activo && <Icon name="lock" size={14} color="#3730A3" />}
                  </h3>
                  <p style={{ ...styles.cardDesc, color: "#4338CA" }}>{lang === "en" ? "Update photos, description, logo and contact info" : "Actualiza fotos, descripción, logo y datos de contacto"}</p>
                </button>

                {/* Checklist Card */}
                <button
                  type="button"
                  onClick={(e) => handleCardClick(e, "excentricidades")}
                  className="hover-card clay-card animate-fade-in-up"
                  style={{
                    ...styles.dashboardCard,
                    background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
                    border: "2px solid #86EFAC",
                    boxShadow: "0 12px 28px -4px rgba(22, 163, 74, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
                    opacity: negocio && !negocio.activo ? 0.75 : 1
                  }}
                >
                  <div style={{ ...styles.cardIcon, background: "#16A34A", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(22, 163, 74, 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="settings" size={22} color="#FFFFFF" />
                  </div>
                  <h3 style={{ ...styles.cardTitle, color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{lang === "en" ? "Services Checklist" : "Checklist de Servicios"}</span>
                    {negocio && !negocio.activo && <Icon name="lock" size={14} color="#166534" />}
                  </h3>
                  <p style={{ ...styles.cardDesc, color: "#15803D" }}>{lang === "en" ? "Enable menu, wifi, parking or lodging modules" : "Activa wifi, parqueo, menú, hospedaje o amenidades"}</p>
                </button>

                {/* Hours Card */}
                {hasHours && (
                  <button
                    type="button"
                    onClick={(e) => handleCardClick(e, "horarios")}
                    className="hover-card clay-card animate-fade-in-up"
                    style={{
                      ...styles.dashboardCard,
                      background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                      border: "2px solid #FDE68A",
                      boxShadow: "0 12px 28px -4px rgba(217, 119, 6, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
                      opacity: negocio && !negocio.activo ? 0.75 : 1
                    }}
                  >
                    <div style={{ ...styles.cardIcon, background: "#D97706", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(217, 119, 6, 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="clock" size={22} color="#FFFFFF" />
                    </div>
                    <h3 style={{ ...styles.cardTitle, color: "#92400E", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{lang === "en" ? "Opening Hours" : "Horarios de Atención"}</span>
                      {negocio && !negocio.activo && <Icon name="lock" size={14} color="#92400E" />}
                    </h3>
                    <p style={{ ...styles.cardDesc, color: "#B45309" }}>{lang === "en" ? "Manage your daily opening and closing times" : "Configura tus horarios de apertura y cierre"}</p>
                  </button>
                )}

                {/* Menu Card */}
                {hasMenu && (
                  <button
                    type="button"
                    onClick={(e) => handleCardClick(e, "menu")}
                    className="hover-card clay-card animate-fade-in-up"
                    style={{
                      ...styles.dashboardCard,
                      background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                      border: "2px solid #93C5FD",
                      boxShadow: "0 12px 28px -4px rgba(37, 99, 235, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
                      opacity: negocio && !negocio.activo ? 0.75 : 1
                    }}
                  >
                    <div style={{ ...styles.cardIcon, background: "#2563EB", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(37, 99, 235, 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="utensils" size={22} color="#FFFFFF" />
                    </div>
                    <h3 style={{ ...styles.cardTitle, color: "#1E40AF", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{lang === "en" ? "Gastronomic Menu" : "Menú Gastronómico"}</span>
                      {negocio && !negocio.activo && <Icon name="lock" size={14} color="#1E40AF" />}
                    </h3>
                    <p style={{ ...styles.cardDesc, color: "#1D4ED8" }}>{lang === "en" ? "Add or remove dishes, photos, and set prices" : "Agrega, edita o elimina platillos, fotos y precios"}</p>
                  </button>
                )}

                {/* Reservations Card */}
                {hasLodging && (
                  <button
                    type="button"
                    onClick={(e) => handleCardClick(e, "reservas")}
                    className="hover-card clay-card animate-fade-in-up"
                    style={{
                      ...styles.dashboardCard,
                      background: "linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)",
                      border: "2px solid #D8B4FE",
                      boxShadow: "0 12px 28px -4px rgba(147, 51, 234, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
                      opacity: negocio && !negocio.activo ? 0.75 : 1
                    }}
                  >
                    <div style={{ ...styles.cardIcon, background: "#9333EA", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(147, 51, 234, 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="calendar" size={22} color="#FFFFFF" />
                    </div>
                    <h3 style={{ ...styles.cardTitle, color: "#6B21A8", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{lang === "en" ? "Reservations Manager" : "Gestor de Reservas"}</span>
                      {negocio && !negocio.activo && <Icon name="lock" size={14} color="#6B21A8" />}
                    </h3>
                    <p style={{ ...styles.cardDesc, color: "#7E22CE" }}>{lang === "en" ? "Approve or cancel incoming booking requests" : "Aprueba o cancela solicitudes de reserva"}</p>
                    {(reservas || []).filter(r => r.estado_reserva === "pendiente").length > 0 && (
                      <div style={styles.cardBadge}>
                        {(reservas || []).filter(r => r.estado_reserva === "pendiente").length} {lang === "en" ? "Pending" : "Pendientes"}
                      </div>
                    )}
                  </button>
                )}

                {/* Reviews Card */}
                <button
                  type="button"
                  onClick={(e) => handleCardClick(e, "resenas")}
                  className="hover-card clay-card animate-fade-in-up"
                  style={{
                    ...styles.dashboardCard,
                    background: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
                    border: "2px solid #FECDD3",
                    boxShadow: "0 12px 28px -4px rgba(225, 29, 72, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
                    opacity: negocio && !negocio.activo ? 0.75 : 1
                  }}
                >
                  <div style={{ ...styles.cardIcon, background: "#E11D48", color: "#FFFFFF", boxShadow: "0 6px 14px rgba(225, 29, 72, 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="star" size={22} color="#FFFFFF" />
                  </div>
                  <h3 style={{ ...styles.cardTitle, color: "#9F1239", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{lang === "en" ? "Customer Reviews" : "Reseñas de Clientes"}</span>
                    {negocio && !negocio.activo && <Icon name="lock" size={14} color="#9F1239" />}
                  </h3>
                  <p style={{ ...styles.cardDesc, color: "#BE123C" }}>{lang === "en" ? "Read what tourists think about your business" : "Lee lo que opinan los turistas sobre tu negocio"}</p>
                </button>
              </div>
            </div>
          ) : (
            <main style={{ ...styles.mainContent, maxWidth: "800px", margin: "0 auto", width: "100%" }} className="dashboard-main glass-card animate-fade-in">
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); setActiveTab("overview"); }} 
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
                        placeholder="Ej: +505 8888 8888"
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>WhatsApp</label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Ej: +505 8888 8888"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {/* Redes Sociales y Sitio Web */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "16px 0 8px", borderTop: "1px dashed rgba(20, 109, 158, 0.10)", paddingTop: "16px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#146D9E", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icon name="share2" size={16} color="#146D9E" />
                      <span>{lang === "en" ? "Social Media & Contact Links" : "Redes Sociales y Enlaces de Contacto"}</span>
                    </h4>

                    <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div style={styles.inputGroup}>
                        <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon name="facebook" size={14} color="#1877F2" />
                          <span>Facebook</span>
                        </label>
                        <input
                          type="text"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          placeholder="https://facebook.com/tunegocio"
                          style={styles.input}
                        />
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon name="instagram" size={14} color="#E4405F" />
                          <span>Instagram</span>
                        </label>
                        <input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="https://instagram.com/tunegocio"
                          style={styles.input}
                        />
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon name="tiktok" size={14} color="#000000" />
                          <span>TikTok</span>
                        </label>
                        <input
                          type="text"
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          placeholder="https://tiktok.com/@tunegocio"
                          style={styles.input}
                        />
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon name="globe" size={14} color="#146D9E" />
                          <span>{lang === "en" ? "Website URL" : "Sitio Web"}</span>
                        </label>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://tunegocio.com"
                          style={styles.input}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{lang === "en" ? "Price Range" : "Rango de Precios"}</label>
                    <select
                      value={rangoPrecios || ""}
                      onChange={(e) => setRangoPrecios(e.target.value)}
                      style={styles.input}
                    >
                      <option value="">{lang === "en" ? "-- Select Price Range --" : "-- Seleccionar Rango de Precios --"}</option>
                      <option value="$">$ ({lang === "en" ? "Economic / Inexpensive" : "Económico"})</option>
                      <option value="$$">$$ ({lang === "en" ? "Moderate" : "Moderado"})</option>
                      <option value="$$$">$$$ ({lang === "en" ? "Expensive / High-end" : "Costoso / Exclusivo"})</option>
                      <option value="$$$$">$$$$ ({lang === "en" ? "Luxury" : "Lujo / Premium"})</option>
                    </select>
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
                        <label style={styles.label}>
                          {lang === "en" ? "Photo Gallery (Tourist View - Up to 6 Photos)" : "Galería de Fotos del Local (Vista del Turista - Hasta 6 fotos)"}
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
                          {(fotos || []).map((url, index) => (
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

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                  {/* Módulos de Plataforma */}
                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasMenu} onChange={(e) => setHasMenu(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="utensils" size={16} color="#146D9E" />
                        <span>{lang === "en" ? "Gastronomic Menu" : "Menú Gastronómico"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Display list of dishes and prices to tourists" : "Muestra lista de platillos y precios a los turistas"}</div>
                    </div>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasHours} onChange={(e) => setHasHours(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="clock" size={16} color="#D97706" />
                        <span>{lang === "en" ? "Opening Hours" : "Horarios de Atención"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Specify opening and closing schedules" : "Especifica horarios de apertura y cierre"}</div>
                    </div>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasLodging} onChange={(e) => setHasLodging(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="hotel" size={16} color="#9333EA" />
                        <span>{lang === "en" ? "Lodging Services" : "Servicios de Hospedaje"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Accept room/bed reservations directly" : "Acepta reservas de habitaciones directamente"}</div>
                    </div>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasTransport} onChange={(e) => setHasTransport(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="car" size={16} color="#2563EB" />
                        <span>{lang === "en" ? "Transport / Tours" : "Transporte o Tours"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Provide tourist routing and itineraries" : "Provee itinerarios y rutas de viaje"}</div>
                    </div>
                  </label>

                  {/* Amenidades y Servicios del Local */}
                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasWifi} onChange={(e) => setHasWifi(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="wifi" size={16} color="#0284C7" />
                        <span>{lang === "en" ? "Free Wi-Fi" : "WiFi Gratis"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "High speed internet for customers" : "Internet para clientes"}</div>
                    </div>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasParking} onChange={(e) => setHasParking(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="parking" size={16} color="#4F46E5" />
                        <span>{lang === "en" ? "Customer Parking" : "Estacionamiento"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "On-site or reserved parking space" : "Parqueo propio o reservado"}</div>
                    </div>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasPets} onChange={(e) => setHasPets(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="pet" size={16} color="#D97706" />
                        <span>{lang === "en" ? "Pet Friendly" : "Mascotas Bienvenidas"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Pets allowed on premises" : "Acepta mascotas en las instalaciones"}</div>
                    </div>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasCardPayment} onChange={(e) => setHasCardPayment(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="creditCard" size={16} color="#16A34A" />
                        <span>{lang === "en" ? "Card Payment" : "Pagos con Tarjeta"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Accept credit and debit cards" : "Acepta tarjetas de crédito/débito"}</div>
                    </div>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasAccessibility} onChange={(e) => setHasAccessibility(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="accessibility" size={16} color="#0D9488" />
                        <span>{lang === "en" ? "Wheelchair Accessible" : "Accesibilidad"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Ramps and accessible entry" : "Rampas y acceso para sillas de ruedas"}</div>
                    </div>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasDelivery} onChange={(e) => setHasDelivery(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="delivery" size={16} color="#E11D48" />
                        <span>{lang === "en" ? "Delivery Service" : "Servicio de Delivery"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Home delivery service available" : "Envío a domicilio disponible"}</div>
                    </div>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasAc} onChange={(e) => setHasAc(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="ac" size={16} color="#0284C7" />
                        <span>{lang === "en" ? "Air Conditioning" : "Aire Acondicionado"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Climatized environment" : "Ambiente climatizado"}</div>
                    </div>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" checked={hasLiveMusic} onChange={(e) => setHasLiveMusic(e.target.checked)} style={styles.checkbox} />
                    <div>
                      <div style={{ fontWeight: "750", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="music" size={16} color="#8B5CF6" />
                        <span>{lang === "en" ? "Live Music / Events" : "Música en Vivo / Eventos"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lang === "en" ? "Live entertainment and shows" : "Shows y presentaciones de música"}</div>
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
                  {(!menuItems || menuItems.length === 0) ? (
                    <p style={{ color: "#9CA3AF", fontSize: "13px" }}>{lang === "en" ? "No dishes added yet." : "Aún no has agregado platillos a tu menú."}</p>
                  ) : (
                    (menuItems || []).map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(20, 109, 158, 0.03)", border: "1px solid rgba(20, 109, 158, 0.08)", borderRadius: "12px", opacity: item.disponible === false ? 0.65 : 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          {item.foto_url ? (
                            <div style={{
                              width: "52px",
                              height: "52px",
                              borderRadius: "10px",
                              background: `url(${item.foto_url}) center/cover no-repeat`,
                              border: "1px solid rgba(20, 109, 158, 0.10)",
                              flexShrink: 0
                            }} />
                          ) : (
                            <div style={{
                              width: "52px",
                              height: "52px",
                              borderRadius: "10px",
                              background: "rgba(20, 109, 158, 0.05)",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              border: "1px solid rgba(20, 109, 158, 0.08)",
                              flexShrink: 0
                            }}>
                              <Icon name="utensils" size={22} color="#146D9E" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "750", fontSize: "14px", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "8px" }}>
                              <span>{item.nombre}</span>
                              {item.disponible === false && (
                                <span style={{ fontSize: "10px", fontWeight: "800", color: "#EF4444", background: "rgba(239,68,68,0.12)", padding: "2px 6px", borderRadius: "4px" }}>
                                  {lang === "en" ? "Unavailable" : "Agotado / No disponible"}
                                </span>
                              )}
                            </div>
                            {item.descripcion && <div style={{ fontSize: "12px", color: "#4A5568", marginTop: "2px" }}>{item.descripcion}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontWeight: "800", color: "var(--atlan-gold)", fontSize: "15px" }}>C$ {item.precio}</span>
                          
                          <button
                            type="button"
                            onClick={() => handleStartEditPlato(item)}
                            title={lang === "en" ? "Edit dish" : "Editar platillo"}
                            style={{
                              background: "rgba(20, 109, 158, 0.08)",
                              border: "1px solid rgba(20, 109, 158, 0.18)",
                              color: "#146D9E",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "12.5px",
                              fontWeight: "700",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Icon name="edit" size={13} color="#146D9E" />
                            <span>{lang === "en" ? "Edit" : "Editar"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePlato(item.id)}
                            title={lang === "en" ? "Delete dish" : "Eliminar platillo"}
                            style={{
                              ...styles.deleteBtn,
                              background: "rgba(239, 68, 68, 0.08)",
                              border: "1px solid rgba(239, 68, 68, 0.18)",
                              color: "#EF4444",
                              padding: "6px 10px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <Icon name="trash" size={14} color="#EF4444" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* MODAL DE EDICIÓN DE PLATILLO */}
                {editingPlato && (
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 10000,
                      backgroundColor: "rgba(10, 15, 28, 0.75)",
                      backdropFilter: "blur(8px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "16px",
                      animation: "fadeIn 0.2s ease-out"
                    }}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setEditingPlato(null);
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "520px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "20px",
                        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "18px",
                        position: "relative",
                        animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(20, 109, 158, 0.1)", paddingBottom: "12px" }}>
                        <h4 style={{ margin: 0, fontSize: "17px", fontWeight: "850", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Icon name="edit" size={18} color="#146D9E" />
                          <span>{lang === "en" ? "Edit Dish / Service" : "Editar Platillo o Servicio"}</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingPlato(null)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                        >
                          <Icon name="x" size={18} color="#64748B" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveEditPlato} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                          <div>
                            <label style={{ fontSize: "12px", fontWeight: "800", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                              {lang === "en" ? "Dish Name" : "Nombre del Platillo"}
                            </label>
                            <input
                              type="text"
                              required
                              value={editPlatoNombre}
                              onChange={(e) => setEditPlatoNombre(e.target.value)}
                              style={styles.input}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: "12px", fontWeight: "800", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                              {lang === "en" ? "Price (C$)" : "Precio (C$)"}
                            </label>
                            <input
                              type="number"
                              required
                              step="0.01"
                              value={editPlatoPrecio}
                              onChange={(e) => setEditPlatoPrecio(e.target.value)}
                              style={styles.input}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: "12px", fontWeight: "800", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                            {lang === "en" ? "Description" : "Descripción"}
                          </label>
                          <textarea
                            rows="3"
                            value={editPlatoDesc}
                            onChange={(e) => setEditPlatoDesc(e.target.value)}
                            placeholder={lang === "en" ? "Short description..." : "Descripción corta..."}
                            style={{ ...styles.input, resize: "none" }}
                          />
                        </div>

                        {/* Foto del Platillo */}
                        <div>
                          <label style={{ fontSize: "12px", fontWeight: "800", color: "#1A1A2E", display: "block", marginBottom: "6px" }}>
                            {lang === "en" ? "Dish Photo" : "Foto del Platillo"}
                          </label>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            {editPlatoFotoUrl ? (
                              <img
                                src={editPlatoFotoUrl}
                                alt="Dish preview"
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  borderRadius: "10px",
                                  objectFit: "cover",
                                  border: "1px solid rgba(20, 109, 158, 0.15)"
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  borderRadius: "10px",
                                  background: "#F1F5F9",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: "1.5px dashed rgba(20, 109, 158, 0.2)"
                                }}
                              >
                                <Icon name="utensils" size={24} color="#94A3B8" />
                              </div>
                            )}

                            <label
                              style={{
                                padding: "8px 14px",
                                background: "rgba(20, 109, 158, 0.08)",
                                border: "1.5px solid rgba(20, 109, 158, 0.18)",
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: "800",
                                cursor: "pointer",
                                color: "#146D9E"
                              }}
                            >
                              {uploadingEditPlatoFoto ? "..." : (lang === "en" ? "📷 Change Photo" : "📷 Cambiar Foto")}
                              <input type="file" accept="image/*" onChange={handleEditPlatoFotoUpload} style={{ display: "none" }} />
                            </label>
                          </div>
                        </div>

                        {/* Toggle Disponibilidad */}
                        <div style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "800", color: "#1A1A2E" }}>
                              {lang === "en" ? "Item Availability" : "Disponibilidad del Platillo"}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                              {editPlatoDisponible
                                ? (lang === "en" ? "Visible and available for order" : "Disponible para los clientes")
                                : (lang === "en" ? "Marked as sold out / unavailable" : "Marcado como agotado / no disponible")}
                            </div>
                          </div>
                          <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "8px" }}>
                            <input
                              type="checkbox"
                              checked={editPlatoDisponible}
                              onChange={(e) => setEditPlatoDisponible(e.target.checked)}
                              style={{ width: "18px", height: "18px", cursor: "pointer" }}
                            />
                            <span style={{ fontSize: "12.5px", fontWeight: "750", color: editPlatoDisponible ? "#16A34A" : "#EF4444" }}>
                              {editPlatoDisponible ? (lang === "en" ? "Available" : "Disponible") : (lang === "en" ? "Sold Out" : "Agotado")}
                            </span>
                          </label>
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                          <button
                            type="submit"
                            disabled={isSavingEditPlato || uploadingEditPlatoFoto}
                            className="clay-btn-blue"
                            style={{ flex: 1, padding: "11px", fontSize: "13.5px", fontWeight: "800" }}
                          >
                            {isSavingEditPlato ? "..." : (lang === "en" ? "Save Changes" : "Guardar Cambios")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPlato(null)}
                            style={{
                              padding: "11px 18px",
                              background: "#F1F5F9",
                              border: "1px solid #CBD5E1",
                              borderRadius: "12px",
                              color: "#475569",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontSize: "13.5px"
                            }}
                          >
                            {lang === "en" ? "Cancel" : "Cancelar"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 4: RESERVAS */}
            {activeTab === "reservas" && hasLodging && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Booking & Reservations Log" : "Bitácora de Reservas"}</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(!reservas || reservas.length === 0) ? (
                    <p style={{ color: "#9CA3AF", fontSize: "13px" }}>{lang === "en" ? "No bookings received." : "No se han recibido reservas."}</p>
                  ) : (
                    (reservas || []).map((res) => (
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
                  {(!resenas || resenas.length === 0) ? (
                    <p style={{ color: "#9CA3AF", fontSize: "13px" }}>{lang === "en" ? "No reviews left yet." : "Aún no hay reseñas registradas."}</p>
                  ) : (
                    (resenas || []).map((rev) => (
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

      {/* MODAL DE SOLICITUD DE VERIFICACIÓN DE RECLAMO */}
      {showClaimModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100vh",
          background: "rgba(10, 15, 28, 0.65)", backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", padding: "20px"
        }} className="animate-fade-in">
          <div style={{
            maxWidth: "540px", width: "100%", background: "#FFFFFF",
            border: "2px solid rgba(255, 255, 255, 0.95)",
            boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.08), 0 24px 60px -10px rgba(20, 109, 158, 0.20)",
            borderRadius: "28px", padding: "24px 28px", maxHeight: "85vh", display: "flex", flexDirection: "column"
          }} className="clay-modal animate-scale-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "850", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "8px" }}>
                📋 {lang === "en" ? "Claim Verification Request" : "Solicitud de Verificación de Propiedad"}
              </h3>
              <button onClick={() => setShowClaimModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#9CA3AF" }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#4A5568", lineHeight: "1.5", marginBottom: "20px" }}>
              {lang === "en" 
                ? "Please provide your identification and owner proof details so that the Atlan Admin team can verify and approve your claim." 
                : "Para proteger la autenticidad de los negocios, la administración de Atlan verificará tus documentos de propiedad antes de darte el control total."}
            </p>

            <form noValidate onSubmit={handleConfirmSubmitClaim} style={{ display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto", paddingRight: "4px", paddingBottom: "16px" }}>
              <div>
                <label style={styles.label}>{lang === "en" ? "Owner / Applicant Full Name *" : "Nombre Completo del Propietario / Representante *"}</label>
                <input
                  type="text"
                  required
                  placeholder={lang === "en" ? "Full Legal Name" : "Ej. Juan Carlos Pérez"}
                  value={solicitanteNombre}
                  onChange={(e) => setSolicitanteNombre(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={styles.label}>{lang === "en" ? "ID / RUC Number *" : "N° Cédula / Identificación *"}</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 0801-1990-12345"
                    value={solicitanteCedula}
                    onChange={(e) => setSolicitanteCedula(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>{lang === "en" ? "Contact Phone / WhatsApp *" : "Teléfono de Contacto *"}</label>
                  <input
                    type="text"
                    required
                    placeholder="+504 9999-9999"
                    value={solicitanteTelefono}
                    onChange={(e) => setSolicitanteTelefono(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Adjuntar Cédula */}
              <div>
                <label style={styles.label}>{lang === "en" ? "ID Document (Photo / PDF) *" : "Foto o PDF de Cédula de Identidad *"}</label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                  <label className="clay-btn-blue" style={{ padding: "8px 14px", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {uploadingCedulaDoc ? "..." : (documentoCedulaUrl ? "✅ Cédula Adjuntada" : "📄 Adjuntar Cédula")}
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleDocUpload(e, "cedula")} style={{ display: "none" }} />
                  </label>
                  {documentoCedulaUrl && (
                    <a href={documentoCedulaUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#146D9E", fontWeight: "700" }}>
                      🔗 Ver Documento
                    </a>
                  )}
                </div>
              </div>

              {/* Adjuntar Comprobante de Propiedad */}
              <div>
                <label style={styles.label}>{lang === "en" ? "Business Permit / Property Proof (Optional)" : "Comprobante de Propiedad / Licencia Comercial (Opcional)"}</label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                  <label className="clay-btn-gold" style={{ padding: "8px 14px", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {uploadingPropiedadDoc ? "..." : (documentoPropiedadUrl ? "✅ Comprobante Adjuntado" : "📄 Adjuntar Comprobante")}
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleDocUpload(e, "propiedad")} style={{ display: "none" }} />
                  </label>
                  {documentoPropiedadUrl && (
                    <a href={documentoPropiedadUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#B8960E", fontWeight: "700" }}>
                      🔗 Ver Documento
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label style={styles.label}>{lang === "en" ? "Additional Notes / Observations" : "Notas Adicionales u Observaciones"}</label>
                <textarea
                  rows="2"
                  placeholder={lang === "en" ? "Details that help verify ownership..." : "Detalles o referencias que ayuden a verificar la propiedad..."}
                  value={solicitudNotas}
                  onChange={(e) => setSolicitudNotas(e.target.value)}
                  style={{ ...styles.input, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  style={{ padding: "10px 18px", background: "none", border: "1px solid rgba(20, 109, 158, 0.15)", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", color: "#4A5568" }}
                >
                  {lang === "en" ? "Cancel" : "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={isClaiming || uploadingCedulaDoc || uploadingPropiedadDoc}
                  className="clay-btn-green"
                  style={{ padding: "10px 22px", fontSize: "13px" }}
                >
                  {isClaiming ? "..." : `🚀 ${lang === "en" ? "Submit Verification Claim" : "Enviar Solicitud de Verificación"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN EN 3D CLAYMORFISMO */}
      {showCancelConfirmModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100vh",
          background: "rgba(10, 15, 28, 0.65)", backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)", zIndex: 1050, display: "flex",
          alignItems: "center", justifyContent: "center", padding: "20px"
        }} className="animate-fade-in">
          <div style={{
            maxWidth: "460px", width: "100%", background: "#FFFFFF",
            border: "2px solid rgba(255, 255, 255, 0.95)",
            boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(239, 68, 68, 0.10), 0 24px 60px -10px rgba(239, 68, 68, 0.25)",
            borderRadius: "28px", padding: "32px", textAlign: "center"
          }} className="clay-modal animate-scale-up">
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.12)", border: "2px solid #ef4444",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "28px", margin: "0 auto 16px"
            }}>
              ⚠️
            </div>

            <h3 style={{ margin: "0 0 10px", fontSize: "20px", fontWeight: "850", color: "#1A1A2E" }}>
              {lang === "en" ? "Cancel Claim Request?" : "¿Cancelar Solicitud de Reclamo?"}
            </h3>

            <p style={{ fontSize: "13.5px", color: "#4A5568", lineHeight: "1.5", margin: "0 0 24px" }}>
              {lang === "en" 
                ? "This will release the location on the map for other users and permanently remove your pending verification submission." 
                : "Esta acción liberará el local en el mapa para la comunidad y eliminará la documentación enviada a la administración."}
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setShowCancelConfirmModal(false)}
                style={{
                  flex: 1, padding: "12px 18px", background: "#F4F6F9",
                  border: "1.5px solid rgba(20, 109, 158, 0.15)", borderRadius: "14px",
                  fontSize: "13.5px", fontWeight: "750", cursor: "pointer", color: "#4A5568"
                }}
              >
                {lang === "en" ? "Go Back" : "Regresar / No Cancelar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelConfirmModal(false);
                  handleCancelClaim();
                }}
                disabled={isResubmitting}
                style={{
                  flex: 1, padding: "12px 18px",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#FFFFFF", border: "none", borderRadius: "14px",
                  fontSize: "13.5px", fontWeight: "850", cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(239, 68, 68, 0.35)"
                }}
              >
                {isResubmitting ? "..." : `🗑️ ${lang === "en" ? "Yes, Cancel Request" : "Sí, Cancelar Solicitud"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BÚSQUEDA DE PUNTOS LIBRES PARA RECLAMAR */}
      {showSearchClaimModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100vh",
          background: "rgba(10, 15, 28, 0.65)", backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)", zIndex: 1050, display: "flex",
          alignItems: "center", justifyContent: "center", padding: "20px"
        }} className="animate-fade-in">
          <div style={{
            maxWidth: "520px", width: "100%", background: "#FFFFFF",
            border: "2px solid rgba(255, 255, 255, 0.95)",
            boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.10), 0 24px 60px -10px rgba(20, 109, 158, 0.25)",
            borderRadius: "28px", padding: "28px", display: "flex", flexDirection: "column", gap: "16px"
          }} className="clay-modal animate-scale-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "850", color: "#1A1A2E" }}>
                🔍 {lang === "en" ? "Search Unclaimed Business Point" : "Buscar Punto Turístico Libre"}
              </h3>
              <button
                type="button"
                onClick={() => setShowSearchClaimModal(false)}
                style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#94A3B8" }}
              >
                ✖
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "13px", color: "#4A5568" }}>
              {lang === "en"
                ? "Enter the business name or category to find points added by tourists."
                : "Ingresa el nombre o categoría del negocio para encontrar puntos agregados por turistas en el mapa:"}
            </p>

            <input
              type="text"
              placeholder={lang === "en" ? "🔍 Type business name or category..." : "🔍 Buscar por nombre o categoría..."}
              value={claimSearchTerm}
              onChange={(e) => {
                setClaimSearchTerm(e.target.value);
                setClaimSearchPage(1);
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1.5px solid rgba(20, 109, 158, 0.2)",
                background: "#F8FAFC",
                fontSize: "13.5px",
                fontWeight: "600",
                color: "#1A1A2E",
                outline: "none"
              }}
              autoFocus
            />

            {/* Contador de resultados */}
            {(() => {
              const filtered = puntosDisponibles.filter((p) => {
                if (!claimSearchTerm.trim()) return true;
                const term = claimSearchTerm.toLowerCase();
                return (
                  p.nombre?.toLowerCase().includes(term) ||
                  p.categoria?.toLowerCase().includes(term)
                );
              });
              const perPage = 5;
              const totalPages = Math.ceil(filtered.length / perPage) || 1;
              const currentItems = filtered.slice(
                (claimSearchPage - 1) * perPage,
                claimSearchPage * perPage
              );

              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#4A5568", fontWeight: "700", padding: "0 4px" }}>
                    <span>🏷️ {filtered.length} {lang === "en" ? "unclaimed points found" : "puntos libres encontrados"}</span>
                    {totalPages > 1 && (
                      <span>{lang === "en" ? "Page" : "Pág"} {claimSearchPage} {lang === "en" ? "of" : "de"} {totalPages}</span>
                    )}
                  </div>

                  <div style={{
                    maxHeight: "260px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "2px"
                  }}>
                    {currentItems.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          background: "rgba(20, 109, 158, 0.03)",
                          border: "1.5px solid rgba(20, 109, 158, 0.08)",
                          borderRadius: "14px"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "800", fontSize: "14px", color: "#1A1A2E" }}>{p.nombre}</div>
                          <div style={{ fontSize: "11.5px", color: "#4A5568", textTransform: "capitalize" }}>🏷️ {p.categoria}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSearchClaimModal(false);
                            handleInitiateClaim(p);
                          }}
                          className="clay-btn-green"
                          style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "10px" }}
                        >
                          Reclamar
                        </button>
                      </div>
                    ))}

                    {filtered.length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: "13px" }}>
                        {lang === "en" ? "No unclaimed points match your search." : "No se encontraron puntos sin reclamar con ese nombre."}
                      </div>
                    )}
                  </div>

                  {/* Paginación interna del Modal */}
                  {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid rgba(20,109,158,0.1)", marginTop: "4px" }}>
                      <button
                        disabled={claimSearchPage === 1}
                        onClick={() => setClaimSearchPage(p => Math.max(p - 1, 1))}
                        className="clay-btn-blue"
                        style={{ padding: "5px 12px", fontSize: "11.5px", borderRadius: "8px", opacity: claimSearchPage === 1 ? 0.5 : 1 }}
                      >
                        ◀ {lang === "en" ? "Prev" : "Ant"}
                      </button>
                      <span style={{ fontSize: "12px", fontWeight: "800", color: "#1A1A2E" }}>
                        {claimSearchPage} / {totalPages}
                      </span>
                      <button
                        disabled={claimSearchPage === totalPages}
                        onClick={() => setClaimSearchPage(p => Math.min(p + 1, totalPages))}
                        className="clay-btn-blue"
                        style={{ padding: "5px 12px", fontSize: "11.5px", borderRadius: "8px", opacity: claimSearchPage === totalPages ? 0.5 : 1 }}
                      >
                        {lang === "en" ? "Next" : "Sig"} ▶
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos dashboard
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
