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

export default function PerfilPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  // Autenticación centralizada desde AuthContext
  const { session: authSession, perfil: authPerfil, loading: authLoading, logout, updatePerfil } = useAuth();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [reservas, setReservas] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [favoritos, setFavoritos] = useState([]);

  // Pestaña activa ("destinos" | "reservas" | "resenas") - Cero Scroll Single View
  const [activeTab, setActiveTab] = useState("destinos");

  // Paginación por sección (4 por página)
  const ITEMS_PER_PAGE = 4;
  const [pageReservas, setPageReservas] = useState(1);
  const [pageFavoritos, setPageFavoritos] = useState(1);
  const [pageResenas, setPageResenas] = useState(1);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  // Editar Perfil de Guía Turístico State
  const [isEditingGuia, setIsEditingGuia] = useState(false);
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
  const [showAddDestForm, setShowAddDestForm] = useState(false);
  const [newDestNombre, setNewDestNombre] = useState("");
  const [newDestCategoria, setNewDestCategoria] = useState("Senderismo");
  const [newDestIcono, setNewDestIcono] = useState("🌋");
  const [newDestDept, setNewDestDept] = useState("León");
  const [newDestDesc, setNewDestDesc] = useState("");
  const [uploadingTravesiaFoto, setUploadingTravesiaFoto] = useState(false);
  const [savingGuia, setSavingGuia] = useState(false);
  const avatarInputRef = useRef(null);
  const travesiaFotoInputRef = useRef(null);

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

  const handleSaveGuiaProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingGuia(true);
    try {
      const { error } = await supabase.from("guias_turisticos").upsert({
        id: user.id,
        nombre_completo: perfil?.nombre_completo,
        avatar_url: perfil?.avatar_url,
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

      alert(lang === "en" ? "Guide profile updated successfully!" : "¡Perfil de Guía Turístico actualizado con éxito!");
      setIsEditingGuia(false);
    } catch (err) {
      console.error("Error saving guide profile:", err);
      alert(lang === "en" ? "Error updating guide profile" : "Error al guardar el perfil de guía: " + (err.message || ""));
    } finally {
      setSavingGuia(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert(lang === "en" ? "Password must be at least 6 characters" : "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert(lang === "en" ? "Passwords do not match" : "Las contraseñas no coinciden");
      return;
    }
    setSavingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert(lang === "en" ? "Password updated successfully!" : "¡Contraseña actualizada con éxito!");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsChangingPass(false);
    } catch (err) {
      console.error("Error changing password:", err);
      alert(lang === "en" ? "Failed to update password" : "Error al actualizar la contraseña: " + (err.message || ""));
    } finally {
      setSavingPass(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const publicUrl = await uploadMedia(file, "avatars");
      const { error } = await supabase
        .from("perfiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (error) throw error;

      setPerfil((p) => ({ ...p, avatar_url: publicUrl }));
      if (updatePerfil) updatePerfil({ avatar_url: publicUrl });
    } catch (err) {
      console.error("Error updating avatar:", err);
      alert(lang === "en" ? "Failed to upload profile picture" : "Error al subir la foto de perfil");
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("editGuia") === "true") {
        setIsEditingGuia(true);
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!authSession) {
      router.push("/login");
      return;
    }

    const fetchProfileData = async () => {
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

        // Cargar Reservas
        const { data: resData } = await supabase
          .from("reservas")
          .select("*, negocios(id, nombre), lugares(id, nombre)")
          .eq("usuario_id", currentUser.id)
          .order("fecha_hora", { ascending: false });
        setReservas(resData || []);

        // Cargar Reseñas
        const { data: revData } = await supabase
          .from("resenas")
          .select("*, negocios(id, nombre), puntos(id, nombre)")
          .eq("usuario_id", currentUser.id)
          .order("created_at", { ascending: false });
        setResenas(revData || []);

        // Cargar Favoritos
        const { data: favData } = await supabase
          .from("favoritos")
          .select("*, puntos(*)")
          .eq("usuario_id", currentUser.id)
          .order("created_at", { ascending: false });
        setFavoritos(favData || []);

        // Cargar Perfil de Guía si aplica
        if (perfilData?.rol === "guia_turistico") {
          try {
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
            }
          } catch (gErr) {
            console.warn("Notice: could not fetch guide profile from DB:", gErr);
          }
        }

      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [authSession, authPerfil, authLoading, router]);

  // Cancelar Reserva con Modal Personalizado
  const handleCancelarReserva = (reservaId) => {
    setConfirmModal({
      isOpen: true,
      title: lang === "en" ? "Cancel Reservation" : "Cancelar Reserva",
      message: lang === "en" ? "Are you sure you want to cancel this reservation?" : "¿Estás seguro de que deseas cancelar esta reserva?",
      confirmText: lang === "en" ? "Yes, Cancel" : "Sí, Cancelar",
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          const { error } = await supabase
            .from("reservas")
            .update({ estado_reserva: "cancelada" })
            .eq("id", reservaId);

          if (error) throw error;

          setReservas((prev) =>
            prev.map((r) => (r.id === reservaId ? { ...r, estado_reserva: "cancelada" } : r))
          );
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal({ isOpen: false, title: "", message: "", confirmText: "", onConfirm: null, loading: false });
        }
      }
    });
  };

  // Quitar Favorito con Modal Personalizado
  const handleRemoveFavorite = (favoritoId) => {
    setConfirmModal({
      isOpen: true,
      title: lang === "en" ? "Remove Favorite" : "Quitar de Favoritos",
      message: lang === "en" ? "Are you sure you want to remove this place from your favorites?" : "¿Estás seguro de que deseas quitar este lugar de tus favoritos?",
      confirmText: lang === "en" ? "Yes, Remove" : "Sí, Quitar",
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          const { error } = await supabase
            .from("favoritos")
            .delete()
            .eq("id", favoritoId);

          if (error) throw error;
          setFavoritos((prev) => prev.filter((f) => f.id !== favoritoId));
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal({ isOpen: false, title: "", message: "", confirmText: "", onConfirm: null, loading: false });
        }
      }
    });
  };

  const handleCerrarSesion = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "var(--atlan-bg-primary)",
        color: "var(--atlan-text-primary)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(20, 109, 158, 0.12)",
            borderTopColor: "var(--atlan-gold, #FFD700)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p style={{ fontSize: "14px", color: "var(--atlan-text-muted)" }}>
            {lang === "en" ? "Loading profile..." : "Cargando perfil..."}
          </p>
        </div>
      </div>
    );
  }

  const rolText = perfil?.rol === "guia_turistico"
    ? (lang === "en" ? "Tour Guide" : "Guía Turístico Certificado")
    : perfil?.rol === "dueno"
    ? (lang === "en" ? "Business Owner" : "Propietario de Negocio")
    : perfil?.rol === "admin"
    ? (lang === "en" ? "Admin" : "Administrador")
    : (perfil?.es_premium || perfil?.suscripcion_activa || perfil?.rol === "turista_deacachimba")
    ? (lang === "en" ? "Deacachimba Tourist" : "Turista Deacachimba")
    : (lang === "en" ? "Tuani Tourist" : "Turista Tuani");

  // Paginación helpers (4 por página)
  const getPaginatedItems = (items, currentPage) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (items) => {
    return Math.max(Math.ceil(items.length / ITEMS_PER_PAGE), 1);
  };

  // Render para los slots "Por descubrir" con SVG nativo dinámico según la sección
  const renderPorDescubrirSlot = (index) => {
    const iconSrc = activeTab === "reservas"
      ? "/images/edificio.svg"
      : activeTab === "resenas"
      ? "/images/comentarios.svg"
      : "/images/tortuga.svg";

    return (
      <div key={`por-descubrir-${index}`} style={{
        background: "#FFFFFF",
        borderRadius: "20px",
        border: "2px dashed rgba(20, 109, 158, 0.20)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "150px"
      }}>
        <img
          src={iconSrc}
          alt=""
          style={{
            width: "36px",
            height: "36px",
            objectFit: "contain",
            marginBottom: "10px",
            opacity: 0.8,
            filter: activeTab === "resenas" ? "brightness(0)" : "none"
          }}
        />
        <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#146D9E" }}>Por descubrir</h4>
        <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--atlan-text-muted)" }}>Explora el mapa para añadir nuevos destinos</p>
        <Link href="/mapa" style={{ fontSize: "12px", color: "#17AA4A", fontWeight: "800", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
          <img src="/images/ubic.svg" alt="" style={{ width: "14px", height: "14px", objectFit: "contain" }} />
          <span>Explorar Mapa →</span>
        </Link>
      </div>
    );
  };

  // Componente de controles de paginación numerada indexada (1 2 3 4 5...)
  const renderPaginationControls = (totalPages, currentPage, setPage) => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "22px" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--atlan-text-muted)", marginRight: "4px" }}>
          {lang === "en" ? "Page:" : "Página:"}
        </span>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => setPage(num)}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              border: "none",
              background: currentPage === num ? "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)" : "#FFFFFF",
              color: currentPage === num ? "#FFFFFF" : "#0A192F",
              fontWeight: "850",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: currentPage === num ? "0 4px 12px rgba(23, 170, 74, 0.35)" : "0 2px 6px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {num}
          </button>
        ))}
      </div>
    );
  };

  const paginatedReservas = getPaginatedItems(reservas, pageReservas);
  const paginatedFavoritos = getPaginatedItems(favoritos, pageFavoritos);
  const paginatedResenas = getPaginatedItems(resenas, pageResenas);

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--atlan-bg-primary)",
      color: "var(--atlan-text-primary)",
      paddingBottom: "40px",
      fontFamily: "var(--font-outfit), sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Keyframe animación de fundido suave para cambio de pestañas */}
      <style jsx global>{`
        @keyframes fadeInTab {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-content-anim {
          animation: fadeInTab 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>



      <Navbar activePage="perfil" session={session} perfil={perfil} onLogout={handleCerrarSesion} />

      {/* CONTENEDOR PRINCIPAL WIDESCREEN (CERO SCROLL SINGLE VIEW) */}
      <div style={{
        maxWidth: "1380px",
        margin: "85px auto 0",
        padding: "0 24px",
        position: "relative",
        zIndex: 1
      }}>
        
        {/* BANNER DASHBOARD SUPERIOR DE 4 ESTADÍSTICAS DEL USUARIO */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}>
          {/* Card 1: Reservas */}
          <div 
            onClick={() => setActiveTab("reservas")}
            style={{
              background: "#FFFFFF",
              border: activeTab === "reservas" ? "2px solid #17AA4A" : "2px solid rgba(255, 255, 255, 0.95)",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
              borderRadius: "20px",
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              cursor: "pointer"
            }}
          >
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(20,109,158,0.12) 0%, rgba(20,109,158,0.04) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <img src="/images/edificio.svg" alt="" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#0A192F" }}>{reservas.length}</div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Direct Reservations" : "Reservas Activas"}</div>
            </div>
          </div>

          {/* Card 2: Destinos Guardados */}
          <div 
            onClick={() => setActiveTab("destinos")}
            style={{
              background: "#FFFFFF",
              border: activeTab === "destinos" ? "2px solid #17AA4A" : "2px solid rgba(255, 255, 255, 0.95)",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
              borderRadius: "20px",
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              cursor: "pointer"
            }}
          >
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(23,170,74,0.12) 0%, rgba(23,170,74,0.04) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <img src="/images/tortuga.svg" alt="" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#17AA4A" }}>{favoritos.length}</div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Saved Places" : "Destinos Guardados"}</div>
            </div>
          </div>

          {/* Card 3: Reseñas Publicadas */}
          <div 
            onClick={() => setActiveTab("resenas")}
            style={{
              background: "#FFFFFF",
              border: activeTab === "resenas" ? "2px solid #17AA4A" : "2px solid rgba(255, 255, 255, 0.95)",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
              borderRadius: "20px",
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              cursor: "pointer"
            }}
          >
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(255,215,0,0.20) 0%, rgba(255,215,0,0.05) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <img src="/images/comentarios.svg" alt="" style={{ width: "24px", height: "24px", objectFit: "contain", filter: "brightness(0)" }} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#E6C200" }}>{resenas.length}</div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Published Reviews" : "Reseñas Publicadas"}</div>
            </div>
          </div>

          {/* Card 4: Nivel de Turista (Azul Navbar #0A192F) */}
          <div style={{
            background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)",
            borderRadius: "20px",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "#FFFFFF",
            boxShadow: "0 10px 25px rgba(10, 25, 47, 0.25)"
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.12)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <img src="/images/perfil.svg" alt="" style={{ width: "24px", height: "24px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "900", color: "#FFD700" }}>{rolText}</div>
              <div style={{ fontSize: "11px", opacity: 0.85, color: "#FFFFFF" }}>{lang === "en" ? "Active Status" : "Estado Turístico en Atlan"}</div>
            </div>
          </div>
        </div>

        {/* LAYOUT PRINCIPAL DE 2 COLUMNAS (SIDEBAR 310px + CONTENEDOR CON SELECTOR INTERACTIVO EN CABECERA) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "310px 1fr",
          gap: "32px",
          alignItems: "start"
        }} className="profile-grid">
          
          {/* SIDEBAR IZQUIERDO CON CABECERA AZUL MENÚ (#0A192F) */}
          <div>
            <div style={{
              background: "#FFFFFF",
              border: "2px solid rgba(255, 255, 255, 0.95)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
              borderRadius: "24px",
              overflow: "hidden"
            }}>
              {/* Cabecera Azul Menú (#0A192F) */}
              <div style={{
                background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)",
                padding: "36px 20px 44px",
                textAlign: "center"
              }}>
              </div>

              {/* Contenido con avatar traslapado */}
              <div style={{ padding: "0 24px 24px", textAlign: "center", marginTop: "-44px" }}>
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  style={{ display: "none" }} 
                />
                <div 
                  onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                  onMouseEnter={() => setAvatarHover(true)}
                  onMouseLeave={() => setAvatarHover(false)}
                  style={{
                    width: "88px",
                    height: "88px",
                    background: perfil?.avatar_url 
                      ? `url(${perfil.avatar_url}) center/cover` 
                      : "linear-gradient(135deg, #FFD700 0%, #E6C200 100%)",
                    borderRadius: "50%",
                    margin: "0 auto 14px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "36px",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.16)",
                    border: "3.5px solid #FFFFFF",
                    position: "relative",
                    cursor: "pointer",
                    overflow: "hidden"
                  }}
                  title={lang === "en" ? "Change profile picture" : "Cambiar foto de perfil"}
                >
                  {avatarUploading ? (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", color: "#FFFFFF", fontSize: "11px", fontWeight: "bold" }}>
                      ⏳
                    </div>
                  ) : (
                    <>
                      {!perfil?.avatar_url && (perfil?.nombre_completo ? perfil.nombre_completo.charAt(0).toUpperCase() : "U")}
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: avatarHover ? 1 : 0,
                        transition: "opacity 0.2s",
                        color: "#FFFFFF",
                        fontSize: "20px"
                      }}>
                        📷
                      </div>
                    </>
                  )}
                </div>

                <h3 style={{ margin: "0 0 4px", fontSize: "19px", fontWeight: "900", color: "#1A1A2E" }}>
                  {perfil?.nombre_completo || "Usuario Atlan"}
                </h3>

                <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "var(--atlan-text-muted)", fontWeight: "600" }}>
                  {user?.email}
                </p>

                {/* Botón 1: Rol (Verde Esmeralda) */}
                <div
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    marginBottom: "10px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    color: "#FFFFFF",
                    fontWeight: "800",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"
                  }}
                >
                  <img
                    src="/images/perfil.svg"
                    alt="Perfil"
                    style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                  />
                  <span>{rolText}</span>
                </div>

                {/* Botón 2: Editar Perfil (Azul) */}
                <button
                  type="button"
                  onClick={() => {
                    setEditNombre(perfil?.nombre_completo || "");
                    setEditBio(perfil?.bio || "");
                    setIsEditing(true);
                  }}
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    marginBottom: "10px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                    color: "#FFFFFF",
                    fontWeight: "800",
                    fontSize: "13px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)"
                  }}
                >
                  <img src="/images/flor.svg" alt="" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                  <span>{lang === "en" ? "Edit Profile" : "Editar Perfil"}</span>
                </button>

                {/* Botón 3: Cambiar Contraseña (Amarillo / Dorado) */}
                <button
                  type="button"
                  onClick={() => {
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setIsChangingPass(true);
                  }}
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    marginBottom: "10px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #FFF085 0%, #EAB308 100%)",
                    color: "#1E1B4B",
                    fontWeight: "800",
                    fontSize: "13px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(234, 179, 8, 0.25)"
                  }}
                >
                  <img src="/images/tortuga.svg" alt="" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0)" }} />
                  <span>{lang === "en" ? "Change Password" : "Cambiar Contraseña"}</span>
                </button>

                {/* Botón Guía: Mi Perfil de Guía, Fotos y Destinos */}
                {(perfil?.rol === "guia_turistico" || perfil?.rol === "guia" || user?.user_metadata?.rol === "guia_turistico" || user?.user_metadata?.rol === "guia" || true) && (
                  <button
                    type="button"
                    onClick={() => setIsEditingGuia(true)}
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      marginBottom: "10px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                      color: "#FFFFFF",
                      fontWeight: "800",
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(14, 165, 233, 0.3)"
                    }}
                  >
                    <Icon name="compass" size={18} color="#FFFFFF" />
                    <span>{lang === "en" ? "My Guide Profile & Map Places" : "Mi Perfil de Guía y Destinos"}</span>
                  </button>
                )}

                {/* Botón 4: Reclamar o Registrar Negocio (Azul Menú #0A192F) */}
                <Link
                  href="/dashboard"
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)",
                    color: "#FFFFFF",
                    fontWeight: "800",
                    fontSize: "13px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 6px 16px rgba(10, 25, 47, 0.35)"
                  }}
                >
                  <img src="/images/edificio.svg" alt="" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                  <span>
                    {(perfil?.rol === "dueno" || perfil?.rol === "admin")
                      ? (lang === "en" ? "Manage Business" : "Gestionar mi Negocio")
                      : (lang === "en" ? "Register Business" : "Reclamar o Registrar Negocio")}
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: SECTOR DYNAMIC TAB CON CABECERA MULTI-SVG INTERACTIVA */}
          <div>
            
            {/* CABECERA PRINCIPAL CON LOS 3 SVGs ALINEADOS INTERACTIVOS */}
            <div style={{
              background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)",
              borderRadius: "20px",
              padding: "14px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              boxShadow: "0 8px 24px rgba(10, 25, 47, 0.25)",
              color: "#FFFFFF"
            }}>
              {/* Bloque con los 3 SVGs interactivos ordenados + Título */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                
                {/* Selector de los 3 SVGs alineados */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255, 255, 255, 0.10)",
                  padding: "5px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.15)"
                }}>
                  {/* SVG 1: Destinos (tortuga.svg) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("destinos")}
                    style={{
                      background: activeTab === "destinos" ? "#FFD700" : "transparent",
                      border: "none",
                      borderRadius: "10px",
                      padding: "6px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    }}
                    title="Mis Destinos Guardados"
                  >
                    <img
                      src="/images/tortuga.svg"
                      alt=""
                      style={{
                        width: "20px",
                        height: "20px",
                        objectFit: "contain",
                        filter: activeTab === "destinos" ? "brightness(0)" : "brightness(0) invert(1)"
                      }}
                    />
                    {activeTab === "destinos" && (
                      <span style={{ color: "#0A192F", fontWeight: "900", fontSize: "12.5px" }}>
                        Destinos
                      </span>
                    )}
                  </button>

                  {/* SVG 2: Reservas (edificio.svg) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("reservas")}
                    style={{
                      background: activeTab === "reservas" ? "#FFD700" : "transparent",
                      border: "none",
                      borderRadius: "10px",
                      padding: "6px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    }}
                    title="Mis Reservas Directas"
                  >
                    <img
                      src="/images/edificio.svg"
                      alt=""
                      style={{
                        width: "20px",
                        height: "20px",
                        objectFit: "contain",
                        filter: activeTab === "reservas" ? "brightness(0)" : "brightness(0) invert(1)"
                      }}
                    />
                    {activeTab === "reservas" && (
                      <span style={{ color: "#0A192F", fontWeight: "900", fontSize: "12.5px" }}>
                        Reservas
                      </span>
                    )}
                  </button>

                  {/* SVG 3: Reseñas (comentarios.svg) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("resenas")}
                    style={{
                      background: activeTab === "resenas" ? "#FFD700" : "transparent",
                      border: "none",
                      borderRadius: "10px",
                      padding: "6px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    }}
                    title="Reseñas Publicadas"
                  >
                    <img
                      src="/images/comentarios.svg"
                      alt=""
                      style={{
                        width: "20px",
                        height: "20px",
                        objectFit: "contain",
                        filter: activeTab === "resenas" ? "brightness(0)" : "brightness(0) invert(1)"
                      }}
                    />
                    {activeTab === "resenas" && (
                      <span style={{ color: "#0A192F", fontWeight: "900", fontSize: "12.5px" }}>
                        Reseñas
                      </span>
                    )}
                  </button>
                </div>

                {/* Título de la Sección Activa */}
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#FFFFFF" }}>
                  {activeTab === "destinos" && (lang === "en" ? "My Saved Places" : "Mis Destinos Guardados")}
                  {activeTab === "reservas" && (lang === "en" ? "My Direct Reservations" : "Mis Reservas Directas")}
                  {activeTab === "resenas" && (lang === "en" ? "My Published Reviews" : "Reseñas Publicadas")}
                </h2>
              </div>

              {/* Insignia de conteo de la sección activa */}
              <span style={{ fontSize: "12px", fontWeight: "800", background: "rgba(255, 215, 0, 0.2)", padding: "5px 14px", borderRadius: "12px", color: "#FFD700" }}>
                {activeTab === "destinos" && `${favoritos.length} ${favoritos.length === 1 ? "destino" : "destinos"}`}
                {activeTab === "reservas" && `${reservas.length} ${reservas.length === 1 ? "reserva" : "reservas"}`}
                {activeTab === "resenas" && `${resenas.length} ${resenas.length === 1 ? "reseña" : "reseñas"}`}
              </span>
            </div>

            {/* VISTA 1: MIS RESERVAS DIRECTAS */}
            {activeTab === "reservas" && (
              <div className="tab-content-anim">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                  {paginatedReservas.map((res) => {
                    const lugarNombre = res.negocios?.nombre || res.lugares?.nombre || (lang === "en" ? "Local Place" : "Lugar Turístico");
                    const fechaFormatted = new Date(res.fecha_hora).toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
                      weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    });

                    const estadoStyles = {
                      pendiente: { bg: "rgba(230, 194, 0, 0.15)", text: "#E6C200", border: "rgba(230, 194, 0, 0.3)" },
                      confirmada: { bg: "rgba(23, 170, 74, 0.15)", text: "#1FCC5C", border: "rgba(23, 170, 74, 0.3)" },
                      cancelada: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" },
                      completada: { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" }
                    }[res.estado_reserva] || { bg: "rgba(20, 109, 158, 0.05)", text: "white", border: "rgba(20, 109, 158, 0.12)" };

                    return (
                      <div key={res.id} style={{ background: "#FFFFFF", borderRadius: "20px", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "150px" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <img src="/images/edificio.svg" alt="" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1A1A2E" }}>{lugarNombre}</h4>
                            </div>
                            <span style={{ fontSize: "10px", fontWeight: "900", padding: "3px 8px", borderRadius: "6px", background: estadoStyles.bg, color: estadoStyles.text, border: `1px solid ${estadoStyles.border}`, textTransform: "uppercase" }}>
                              {t(`reservations.status.${res.estado_reserva}`) || res.estado_reserva}
                            </span>
                          </div>
                          <p style={{ margin: "0 0 8px", fontSize: "12.5px", color: "var(--atlan-text-muted)" }}>📅 {fechaFormatted}</p>
                          <div style={{ fontSize: "12px", color: "#64748B" }}>👥 {res.num_personas} {lang === "en" ? "people" : "personas"}</div>
                        </div>
                        {res.estado_reserva !== "cancelada" && res.estado_reserva !== "completada" && (
                          <button onClick={() => handleCancelarReserva(res.id)} style={{ marginTop: "14px", width: "100%", padding: "8px", background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: "10px", fontWeight: "800", fontSize: "12px", cursor: "pointer" }}>
                            {lang === "en" ? "Cancel Reservation" : "Cancelar Reserva"}
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Slots "Por descubrir" */}
                  {Array.from({ length: ITEMS_PER_PAGE - paginatedReservas.length }).map((_, i) =>
                    renderPorDescubrirSlot(i)
                  )}
                </div>

                {renderPaginationControls(getTotalPages(reservas), pageReservas, setPageReservas)}
              </div>
            )}

            {/* VISTA 2: MIS DESTINOS GUARDADOS (con ubic.svg en el botón Ver en mapa) */}
            {activeTab === "destinos" && (
              <div className="tab-content-anim">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                  {paginatedFavoritos.map((fav) => {
                    const punto = fav.puntos;
                    if (!punto) return null;

                    return (
                      <div key={fav.id} style={{ background: "#FFFFFF", borderRadius: "20px", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "150px" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1A1A2E" }}>{punto.nombre}</h4>
                            <button onClick={() => handleRemoveFavorite(fav.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "14px" }} title="Quitar de favoritos">🗑️</button>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#146D9E", background: "rgba(20, 109, 158, 0.08)", padding: "3px 8px", borderRadius: "6px" }}>
                            {t(`addPoint.categories.${punto.categoria || 'otro'}`)}
                          </span>
                        </div>
                        <Link 
                          href={`/mapa?id=${punto.id}`} 
                          style={{ 
                            marginTop: "16px", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            gap: "8px", 
                            padding: "9px", 
                            background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", 
                            color: "white", 
                            borderRadius: "10px", 
                            fontWeight: "800", 
                            fontSize: "12px", 
                            textDecoration: "none" 
                          }}
                        >
                          <img src="/images/ubic.svg" alt="" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                          <span>{lang === "en" ? "View on Map" : "Ver en Mapa"}</span>
                        </Link>
                      </div>
                    );
                  })}

                  {/* Slots "Por descubrir" */}
                  {Array.from({ length: ITEMS_PER_PAGE - paginatedFavoritos.length }).map((_, i) =>
                    renderPorDescubrirSlot(i)
                  )}
                </div>

                {renderPaginationControls(getTotalPages(favoritos), pageFavoritos, setPageFavoritos)}
              </div>
            )}

            {/* VISTA 3: RESEÑAS PUBLICADAS (con comentarios.svg en la tarjeta) */}
            {activeTab === "resenas" && (
              <div className="tab-content-anim">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                  {paginatedResenas.map((rev) => {
                    const destinoNombre = rev.negocios?.nombre || rev.puntos?.nombre || (lang === "en" ? "Local Destination" : "Destino");
                    return (
                      <div key={rev.id} style={{ background: "#FFFFFF", borderRadius: "20px", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", padding: "20px", minHeight: "150px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <img src="/images/comentarios.svg" alt="" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0)" }} />
                            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#1A1A2E" }}>{destinoNombre}</h4>
                          </div>
                          <div style={{ color: "#FFD700", fontSize: "13px", fontWeight: "800" }}>{"★".repeat(rev.calificacion || 5)}</div>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#4A5568", lineHeight: "1.5" }}>"{rev.comentario}"</p>
                      </div>
                    );
                  })}

                  {/* Slots "Por descubrir" */}
                  {Array.from({ length: ITEMS_PER_PAGE - paginatedResenas.length }).map((_, i) =>
                    renderPorDescubrirSlot(i)
                  )}
                </div>

                {renderPaginationControls(getTotalPages(resenas), pageResenas, setPageResenas)}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MODAL 1: EDITAR PERFIL */}
      {isEditing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setIsEditing(false)}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: "450px", borderRadius: "24px", padding: "28px", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: "900", color: "#1A1A2E" }}>
              {lang === "en" ? "Edit Profile" : "Editar Perfil"}
            </h3>
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#4A5568", marginBottom: "6px" }}>
                  {lang === "en" ? "Full Name" : "Nombre Completo"}
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "14px", outline: "none" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#4A5568", marginBottom: "6px" }}>
                  {lang === "en" ? "Bio / Description" : "Biografía / Descripción"}
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13px", outline: "none", resize: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "rgba(0,0,0,0.06)", color: "#64748B", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                  {lang === "en" ? "Cancel" : "Cancelar"}
                </button>
                <button type="submit" disabled={savingProfile} style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", color: "white", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>
                  {savingProfile ? "..." : (lang === "en" ? "Save Changes" : "Guardar Cambios")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CAMBIAR CONTRASEÑA */}
      {isChangingPass && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setIsChangingPass(false)}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: "450px", borderRadius: "24px", padding: "28px", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: "900", color: "#1A1A2E" }}>
              {lang === "en" ? "Change Password" : "Cambiar Contraseña"}
            </h3>
            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#4A5568", marginBottom: "6px" }}>
                  {lang === "en" ? "New Password" : "Nueva Contraseña"}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "14px", outline: "none" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#4A5568", marginBottom: "6px" }}>
                  {lang === "en" ? "Confirm New Password" : "Confirmar Nueva Contraseña"}
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "14px", outline: "none" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setIsChangingPass(false)} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "rgba(0,0,0,0.06)", color: "#64748B", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                  {lang === "en" ? "Cancel" : "Cancelar"}
                </button>
                <button type="submit" disabled={savingPass} style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", color: "white", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>
                  {savingPass ? "..." : (lang === "en" ? "Update Password" : "Actualizar Contraseña")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2.5: EDITAR PERFIL DE GUÍA TURÍSTICO Y GALERÍA DE TRAVESÍAS */}
      {isEditingGuia && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", borderRadius: "24px", padding: "28px", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "900", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon name="compass" size={22} color="#0EA5E9" />
              {lang === "en" ? "Manage Guide Profile & Tour Photos" : "Configurar mi Perfil de Guía y Fotos"}
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--atlan-text-muted)" }}>
              {lang === "en" ? "Update your guide bio, specialty, rates and tour photo gallery visible to tourists." : "Actualiza tu presentación de guía, especialidades, tarifas y galería de travesías visible a turistas."}
            </p>

            <form onSubmit={handleSaveGuiaProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                    {lang === "en" ? "Primary Department" : "Departamento Principal"}
                  </label>
                  <select
                    value={guiaDeptPrincipal}
                    onChange={(e) => setGuiaDeptPrincipal(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                  >
                    {["Managua", "León", "Chinandega", "Granada", "Masaya", "Carazo", "Rivas", "Matagalpa", "Jinotega", "Estelí", "Madriz", "Nueva Segovia", "Boaco", "Chontales", "Río San Juan", "RACCN", "RACCS"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                    {lang === "en" ? "Specialty" : "Especialidad"}
                  </label>
                  <select
                    value={guiaEspecialidad}
                    onChange={(e) => setGuiaEspecialidad(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                  >
                    <option value="Senderismo y Volcanes">Senderismo y Volcanes</option>
                    <option value="Cultura e Historia">Cultura e Historia</option>
                    <option value="Avistamiento de Aves">Avistamiento de Aves</option>
                    <option value="Playa y Surf">Playa y Surf</option>
                    <option value="Gastronomía Tradicional">Gastronomía Tradicional</option>
                    <option value="Ecoturismo Integral">Ecoturismo Integral</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                    {lang === "en" ? "Languages" : "Idiomas"}
                  </label>
                  <input
                    type="text"
                    value={guiaIdiomas}
                    onChange={(e) => setGuiaIdiomas(e.target.value)}
                    placeholder="Ej. Español, Inglés, Francés"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                    {lang === "en" ? "Experience (Years)" : "Años de Experiencia"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={guiaExperiencia}
                    onChange={(e) => setGuiaExperiencia(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                    {lang === "en" ? "Approx Rate" : "Tarifa Aprox. por día"}
                  </label>
                  <input
                    type="text"
                    value={guiaTarifa}
                    onChange={(e) => setGuiaTarifa(e.target.value)}
                    placeholder="Ej. $25 - $40 / día"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                    {lang === "en" ? "WhatsApp Number" : "Número de WhatsApp"}
                  </label>
                  <input
                    type="text"
                    value={guiaWhatsapp}
                    onChange={(e) => setGuiaWhatsapp(e.target.value)}
                    placeholder="+505 8888 8888"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                  {lang === "en" ? "INTUR License Number" : "Número de Licencia INTUR (Opcional)"}
                </label>
                <input
                  type="text"
                  value={guiaLicencia}
                  onChange={(e) => setGuiaLicencia(e.target.value)}
                  placeholder="Ej. INTUR-LE-2024-99"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13.5px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "4px" }}>
                  {lang === "en" ? "Guide Biography & Route Experience" : "Biografía y Rutas de Trabajo"}
                </label>
                <textarea
                  rows={3}
                  value={guiaBiografia}
                  onChange={(e) => setGuiaBiografia(e.target.value)}
                  placeholder="Describe tus especialidades, volcanes que recorres, equipamiento de seguridad y lo que incluye tu guía..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(20,109,158,0.2)", fontSize: "13px", resize: "none" }}
                />
              </div>

              {/* SECCIÓN GALERÍA DE FOTOS DE TRAVESÍAS */}
              <div style={{ background: "rgba(14, 165, 233, 0.05)", border: "1.5px dashed rgba(14, 165, 233, 0.3)", borderRadius: "16px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#0284C7", display: "block" }}>
                      {lang === "en" ? "Tour Photo Gallery" : "Galería de Fotos de Travesías"}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                      {lang === "en" ? "Upload photos of your guided tours and expeditions." : "Sube fotos de tus excursiones y travesías guiadas."}
                    </span>
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
                    style={{ background: "#0284C7", color: "#FFF", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "750", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Icon name="plus" size={14} />
                    <span>{uploadingTravesiaFoto ? "Subiendo..." : "Agregar Foto"}</span>
                  </button>
                </div>

                {guiaGaleria.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic", textAlign: "center", margin: "8px 0" }}>
                    {lang === "en" ? "No tour photos uploaded yet." : "Aún no has agregado fotos de tus travesías."}
                  </p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px" }}>
                    {guiaGaleria.map((url, idx) => (
                      <div key={idx} style={{ position: "relative", width: "100%", height: "70px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
                        <img src={url} alt={`Travesía ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveTravesiaFoto(idx)}
                          style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(239, 68, 68, 0.85)", color: "#FFF", border: "none", width: "20px", height: "20px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Eliminar foto"
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECCIÓN GESTIÓN DE LUGARES Y DESTINOS DE TOURS EN EL MAPA */}
              <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1.5px dashed rgba(16, 185, 129, 0.3)", borderRadius: "16px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#10B981", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🗺️</span>
                      {lang === "en" ? "Map Tour Destinations" : "Lugares y Destinos de Tours en el Mapa"}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "#64748B", display: "block" }}>
                      {lang === "en" ? "Specify points of interest you cover so tourists can view them on Atlan map." : "Agrega los puntos de interés que cubres para que los turistas los vean en tu tarjeta y perfil de Atlan."}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddDestForm(!showAddDestForm)}
                    style={{ background: "#10B981", color: "#FFF", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "750", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Icon name={showAddDestForm ? "x" : "plus"} size={14} />
                    <span>{showAddDestForm ? (lang === "en" ? "Cancel" : "Cancelar") : (lang === "en" ? "Add Place" : "Agregar Lugar")}</span>
                  </button>
                </div>

                {/* Formulario Inline para Agregar Nuevo Destino */}
                {showAddDestForm && (
                  <div style={{ background: "#FFFFFF", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "12px", padding: "12px", marginBottom: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "3px" }}>
                          {lang === "en" ? "Place/Attraction Name:" : "Nombre del Sitio o Destino:"}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Volcán Cerro Negro"
                          value={newDestNombre}
                          onChange={(e) => setNewDestNombre(e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12.5px" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "3px" }}>
                          {lang === "en" ? "Department:" : "Departamento:"}
                        </label>
                        <select
                          value={newDestDept}
                          onChange={(e) => setNewDestDept(e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12.5px" }}
                        >
                          {["León", "Granada", "Rivas", "Masaya", "Matagalpa", "Jinotega", "Estelí", "Managua", "Chinandega", "Carazo", "Madriz", "Nueva Segovia", "Boaco", "Chontales", "Río San Juan", "RACCN", "RACCS"].map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "3px" }}>
                          {lang === "en" ? "Category:" : "Categoría del Tour:"}
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Sandboarding / Senderismo"
                          value={newDestCategoria}
                          onChange={(e) => setNewDestCategoria(e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12.5px" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "3px" }}>
                          {lang === "en" ? "Icon / Emoji:" : "Ícono o Emoji:"}
                        </label>
                        <select
                          value={newDestIcono}
                          onChange={(e) => setNewDestIcono(e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12.5px" }}
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

                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "750", color: "#1A1A2E", display: "block", marginBottom: "3px" }}>
                        {lang === "en" ? "Tour Activity Description:" : "Descripción Corta del Tour:"}
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Ascenso y vertiginoso descenso en tabla de sandboard sobre arena volcánica..."
                        value={newDestDesc}
                        onChange={(e) => setNewDestDesc(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12.5px" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={handleAddDestinoMapa}
                        disabled={!newDestNombre.trim()}
                        style={{ background: "#10B981", color: "#FFF", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}
                      >
                        {lang === "en" ? "Save Destination" : "Guardar Destino"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Destinos Actualmente Agregados */}
                {guiaDestinosMapa.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic", textAlign: "center", margin: "8px 0" }}>
                    {lang === "en" ? "No map destinations added yet." : "Aún no has agregado destinos de mapa."}
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {guiaDestinosMapa.map((dest) => (
                      <div
                        key={dest.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                          borderRadius: "10px",
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "16px" }}>{dest.icono}</span>
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: "800", color: "#0A192F", display: "block" }}>
                              {dest.nombre} <span style={{ fontSize: "11px", fontWeight: "600", color: "#0EA5E9" }}>({dest.departamento})</span>
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>
                              {dest.categoria} • {dest.desc?.length > 45 ? dest.desc.substring(0, 45) + "..." : dest.desc}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDestinoMapa(dest.id)}
                          style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", border: "none", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                          title="Eliminar lugar"
                        >
                          <Icon name="trash" size={12} />
                          <span>{lang === "en" ? "Delete" : "Quitar"}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => setIsEditingGuia(false)} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "rgba(0,0,0,0.06)", color: "#64748B", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                  {lang === "en" ? "Cancel" : "Cancelar"}
                </button>
                <button type="submit" disabled={savingGuia} style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)", color: "white", fontWeight: "800", fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 14px rgba(14, 165, 233, 0.3)" }}>
                  {savingGuia ? "..." : (lang === "en" ? "Save Guide Profile" : "Guardar Perfil de Guía")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMACIÓN PERSONALIZADA DE ELIMINACIÓN/CANCELACIÓN ATLAN */}
      {confirmModal.isOpen && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            zIndex: 2000, 
            background: "rgba(0, 0, 0, 0.65)", 
            backdropFilter: "blur(4px)",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: "20px" 
          }} 
          onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div 
            style={{ 
              background: "#FFFFFF", 
              width: "100%", 
              maxWidth: "420px", 
              borderRadius: "24px", 
              padding: "28px 24px", 
              border: "2px solid rgba(255,255,255,0.95)", 
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
              textAlign: "center"
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.10)",
              color: "#EF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              margin: "0 auto 16px"
            }}>
              🗑️
            </div>
            
            <h3 style={{ margin: "0 0 8px", fontSize: "19px", fontWeight: "900", color: "#1A1A2E" }}>
              {confirmModal.title}
            </h3>

            <p style={{ margin: "0 0 24px", fontSize: "13.5px", color: "var(--atlan-text-muted)", lineHeight: "1.5" }}>
              {confirmModal.message}
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                type="button" 
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} 
                style={{ 
                  flex: 1,
                  padding: "11px 18px", 
                  borderRadius: "12px", 
                  border: "none", 
                  background: "rgba(0,0,0,0.06)", 
                  color: "#64748B", 
                  fontWeight: "800", 
                  fontSize: "13px", 
                  cursor: "pointer" 
                }}
              >
                {lang === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button 
                type="button" 
                onClick={confirmModal.onConfirm} 
                disabled={confirmModal.loading}
                style={{ 
                  flex: 1,
                  padding: "11px 18px", 
                  borderRadius: "12px", 
                  border: "none", 
                  background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)", 
                  color: "#FFFFFF", 
                  fontWeight: "800", 
                  fontSize: "13px", 
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)"
                }}
              >
                {confirmModal.loading ? "..." : confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
