"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/ui/Navbar";
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

  // Paginación por sección (4 por página)
  const ITEMS_PER_PAGE = 4;
  const [pageReservas, setPageReservas] = useState(1);
  const [pageFavoritos, setPageFavoritos] = useState(1);
  const [pageResenas, setPageResenas] = useState(1);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const avatarInputRef = useRef(null);

  // Editar Perfil Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Cambiar Contraseña Modal State (Independiente)
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({
          nombre_completo: editNombre.trim(),
          bio: editBio.trim(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setPerfil((prev) => ({
        ...prev,
        nombre_completo: editNombre.trim(),
        bio: editBio.trim(),
      }));
      if (updatePerfil) {
        updatePerfil({
          nombre_completo: editNombre.trim(),
          bio: editBio.trim(),
        });
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(lang === "en" ? "Failed to update profile" : "Error al actualizar el perfil: " + (err.message || ""));
    } finally {
      setSavingProfile(false);
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

      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [authSession, authPerfil, authLoading, router]);

  const handleCancelarReserva = async (reservaId) => {
    const confirmDel = confirm(
      lang === "en"
        ? "Are you sure you want to cancel this reservation?"
        : "¿Estás seguro de que deseas cancelar esta reserva?"
    );
    if (!confirmDel) return;

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
      alert(lang === "en" ? "Failed to cancel reservation" : "No se pudo cancelar la reserva");
      console.error(err);
    }
  };

  const handleRemoveFavorite = async (favoritoId) => {
    const confirmDel = confirm(
      lang === "en"
        ? "Are you sure you want to remove this place from your favorites?"
        : "¿Estás seguro de que deseas quitar este lugar de tus favoritos?"
    );
    if (!confirmDel) return;

    try {
      const { error } = await supabase
        .from("favoritos")
        .delete()
        .eq("id", favoritoId);

      if (error) throw error;
      setFavoritos((prev) => prev.filter((f) => f.id !== favoritoId));
    } catch (err) {
      alert(lang === "en" ? "Failed to remove favorite" : "No se pudo quitar el favorito");
      console.error(err);
    }
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

  const rolText = perfil?.rol === "dueno"
    ? (lang === "en" ? "Business Owner" : "Propietario de Negocio")
    : perfil?.rol === "admin"
    ? (lang === "en" ? "Admin" : "Administrador")
    : (perfil?.es_premium || perfil?.suscripcion_activa || perfil?.rol === "turista_deacachimba")
    ? (lang === "en" ? "Deacachimba Tourist" : "Turista Deacachimba")
    : (lang === "en" ? "Tuani Tourist" : "Turista Tuani");

  // Estilo uniforme verde para los 4 botones del sidebar
  const greenButtonStyle = {
    width: "100%",
    padding: "11px 16px",
    marginBottom: "10px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)",
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: "13px",
    border: "1.5px solid rgba(255, 255, 255, 0.3)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 6px 16px rgba(23, 170, 74, 0.30)",
    textDecoration: "none",
    transition: "all 0.2s"
  };

  // Paginación helpers
  const getPaginatedItems = (items, currentPage) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (items) => {
    return Math.max(Math.ceil(items.length / ITEMS_PER_PAGE), 1);
  };

  // Render para los slots "Por descubrir"
  const renderPorDescubrirSlot = (index) => (
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
      <span style={{ fontSize: "28px", display: "block", marginBottom: "6px", opacity: 0.7 }}>✨</span>
      <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#146D9E" }}>Por descubrir</h4>
      <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--atlan-text-muted)" }}>Explora el mapa para añadir nuevos destinos</p>
      <Link href="/mapa" style={{ fontSize: "12px", color: "#17AA4A", fontWeight: "800", textDecoration: "none" }}>
        Explorar Mapa →
      </Link>
    </div>
  );

  // Componente de controles de paginación (1, 2, 3...)
  const renderPaginationControls = (totalPages, currentPage, setPage) => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "20px" }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => setPage(num)}
            style={{
              padding: "6px 14px",
              borderRadius: "10px",
              border: "none",
              background: currentPage === num ? "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)" : "rgba(20, 109, 158, 0.08)",
              color: currentPage === num ? "#FFFFFF" : "#1A1A2E",
              fontWeight: "800",
              fontSize: "12.5px",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: currentPage === num ? "0 4px 10px rgba(23, 170, 74, 0.3)" : "none"
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
      paddingBottom: "80px",
      fontFamily: "var(--font-outfit), sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* SVGs de fondo nativos de Atlan */}
      <img src="/images/tortuga.svg" alt="" style={{ position: "fixed", bottom: "-10px", left: "-10px", width: "360px", maxHeight: "360px", objectFit: "contain", opacity: 0.14, pointerEvents: "none", zIndex: 0 }} />
      <img src="/images/machoraton.svg" alt="" style={{ position: "fixed", top: "80px", right: "10px", width: "340px", height: "calc(100vh - 90px)", objectFit: "contain", opacity: 0.12, pointerEvents: "none", zIndex: 0 }} />

      <Navbar activePage="perfil" session={session} perfil={perfil} onLogout={handleCerrarSesion} />

      {/* CONTENEDOR PRINCIPAL WIDESCREEN */}
      <div style={{
        maxWidth: "1380px",
        margin: "85px auto 0",
        padding: "0 24px",
        position: "relative",
        zIndex: 1
      }}>
        
        {/* BANNER DASHBOARD SUPERIOR CON SVGs NATIVOS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "28px"
        }}>
          {/* Card 1: Reservas */}
          <div style={{
            background: "#FFFFFF",
            border: "2px solid rgba(255, 255, 255, 0.95)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
            borderRadius: "20px",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
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
          <div style={{
            background: "#FFFFFF",
            border: "2px solid rgba(255, 255, 255, 0.95)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
            borderRadius: "20px",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
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
          <div style={{
            background: "#FFFFFF",
            border: "2px solid rgba(255, 255, 255, 0.95)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
            borderRadius: "20px",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(255,215,0,0.20) 0%, rgba(255,215,0,0.05) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <img src="/images/flor.svg" alt="" style={{ width: "24px", height: "24px", objectFit: "contain", filter: "brightness(0)" }} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#E6C200" }}>{resenas.length}</div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Published Reviews" : "Reseñas Publicadas"}</div>
            </div>
          </div>

          {/* Card 4: Nivel de Turista */}
          <div style={{
            background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)",
            borderRadius: "20px",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "#FFFFFF",
            boxShadow: "0 10px 25px rgba(23, 170, 74, 0.35)"
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <img src="/images/perfil.svg" alt="" style={{ width: "24px", height: "24px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "900", color: "#FFFFFF" }}>{rolText}</div>
              <div style={{ fontSize: "11px", opacity: 0.9 }}>{lang === "en" ? "Active Status" : "Estado Turístico en Atlan"}</div>
            </div>
          </div>
        </div>

        {/* LAYOUT PRINCIPAL DE 2 COLUMNAS (SIDEBAR 310px + CONTENIDO EXPANDIDO 1FR) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "310px 1fr",
          gap: "32px",
          alignItems: "start"
        }} className="profile-grid">
          
          {/* SIDEBAR IZQUIERDO CON LOS 4 BOTONES UNIFORMES EN VERDE (#17AA4A) */}
          <div style={{ position: "sticky", top: "100px" }}>
            <div style={{
              background: "#FFFFFF",
              border: "2px solid rgba(255, 255, 255, 0.95)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
              borderRadius: "24px",
              padding: "24px",
              textAlign: "center"
            }}>
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
                  margin: "0 auto 16px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "36px",
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
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

              {/* Botón 1: Rol (Verde #17AA4A) */}
              <div style={greenButtonStyle}>
                <img
                  src="/images/perfil.svg"
                  alt="Perfil"
                  style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                />
                <span>{rolText}</span>
              </div>

              {/* Botón 2: Editar Perfil (Verde #17AA4A) */}
              <button
                type="button"
                onClick={() => {
                  setEditNombre(perfil?.nombre_completo || "");
                  setEditBio(perfil?.bio || "");
                  setIsEditing(true);
                }}
                style={greenButtonStyle}
              >
                <img src="/images/flor.svg" alt="" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                <span>{lang === "en" ? "Edit Profile" : "Editar Perfil"}</span>
              </button>

              {/* Botón 3: Cambiar Contraseña (Verde #17AA4A) */}
              <button
                type="button"
                onClick={() => {
                  setNewPassword("");
                  setConfirmNewPassword("");
                  setIsChangingPass(true);
                }}
                style={greenButtonStyle}
              >
                <img src="/images/machoraton.svg" alt="" style={{ width: "16px", height: "20px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                <span>{lang === "en" ? "Change Password" : "Cambiar Contraseña"}</span>
              </button>

              {/* Botón 4: Reclamar o Registrar Negocio (Verde #17AA4A) */}
              <Link
                href="/dashboard"
                style={{ ...greenButtonStyle, marginBottom: 0 }}
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

          {/* COLUMNA DERECHA CONTENIDO */}
          <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
            
            {/* SECCIÓN 1: RESERVAS DIRECTAS con paginación de 4 y slot "Por descubrir" */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "10px" }}>
                  <img src="/images/edificio.svg" alt="" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
                  <span>{lang === "en" ? "My Reservations" : "Mis Reservas Directas"}</span>
                </h2>
                <span style={{ fontSize: "12px", fontWeight: "800", background: "rgba(23, 170, 74, 0.10)", padding: "4px 12px", borderRadius: "12px", color: "#17AA4A" }}>
                  {reservas.length} {reservas.length === 1 ? "reserva" : "reservas"}
                </span>
              </div>

              {/* Grid 2x2 de 4 espacios (tarjetas reales + slots por descubrir) */}
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
                          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1A1A2E" }}>{lugarNombre}</h4>
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

                {/* Rellenar slots faltantes hasta 4 con "Por descubrir" */}
                {Array.from({ length: ITEMS_PER_PAGE - paginatedReservas.length }).map((_, i) =>
                  renderPorDescubrirSlot(i)
                )}
              </div>

              {/* Botones de Paginación (1, 2, 3...) */}
              {renderPaginationControls(getTotalPages(reservas), pageReservas, setPageReservas)}
            </div>

            {/* SECCIÓN 2: DESTINOS GUARDADOS con paginación de 4 y slot "Por descubrir" */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "10px" }}>
                  <img src="/images/tortuga.svg" alt="" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
                  <span>{lang === "en" ? "My Saved Places" : "Mis Destinos Guardados"}</span>
                </h2>
                <span style={{ fontSize: "12px", fontWeight: "800", background: "rgba(23, 170, 74, 0.10)", padding: "4px 12px", borderRadius: "12px", color: "#17AA4A" }}>
                  {favoritos.length} {favoritos.length === 1 ? "destino" : "destinos"}
                </span>
              </div>

              {/* Grid 2x2 de 4 espacios */}
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
                      <Link href={`/mapa?id=${punto.id}`} style={{ marginTop: "16px", display: "block", textAlign: "center", padding: "9px", background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", color: "white", borderRadius: "10px", fontWeight: "800", fontSize: "12px", textDecoration: "none" }}>
                        🗺️ {lang === "en" ? "View on Map" : "Ver en Mapa"}
                      </Link>
                    </div>
                  );
                })}

                {/* Rellenar slots faltantes hasta 4 con "Por descubrir" */}
                {Array.from({ length: ITEMS_PER_PAGE - paginatedFavoritos.length }).map((_, i) =>
                  renderPorDescubrirSlot(i)
                )}
              </div>

              {/* Botones de Paginación (1, 2, 3...) */}
              {renderPaginationControls(getTotalPages(favoritos), pageFavoritos, setPageFavoritos)}
            </div>

            {/* SECCIÓN 3: RESEÑAS PUBLICADAS con paginación de 4 y slot "Por descubrir" */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "10px" }}>
                  <img src="/images/flor.svg" alt="" style={{ width: "24px", height: "24px", objectFit: "contain", filter: "brightness(0)" }} />
                  <span>{lang === "en" ? "My Reviews" : "Reseñas Publicadas"}</span>
                </h2>
                <span style={{ fontSize: "12px", fontWeight: "800", background: "rgba(230, 194, 0, 0.15)", padding: "4px 12px", borderRadius: "12px", color: "#E6C200" }}>
                  {resenas.length} {resenas.length === 1 ? "reseña" : "reseñas"}
                </span>
              </div>

              {/* Grid 2x2 de 4 espacios */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                {paginatedResenas.map((rev) => {
                  const destinoNombre = rev.negocios?.nombre || rev.puntos?.nombre || (lang === "en" ? "Local Destination" : "Destino");
                  return (
                    <div key={rev.id} style={{ background: "#FFFFFF", borderRadius: "20px", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", padding: "20px", minHeight: "150px" }}>
                      <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "800", color: "#1A1A2E" }}>{destinoNombre}</h4>
                      <div style={{ color: "#FFD700", fontSize: "14px", marginBottom: "8px" }}>{"★".repeat(rev.calificacion || 5)}</div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#4A5568", lineHeight: "1.5" }}>"{rev.comentario}"</p>
                    </div>
                  );
                })}

                {/* Rellenar slots faltantes hasta 4 con "Por descubrir" */}
                {Array.from({ length: ITEMS_PER_PAGE - paginatedResenas.length }).map((_, i) =>
                  renderPorDescubrirSlot(i)
                )}
              </div>

              {/* Botones de Paginación (1, 2, 3...) */}
              {renderPaginationControls(getTotalPages(resenas), pageResenas, setPageResenas)}
            </div>

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

    </div>
  );
}
