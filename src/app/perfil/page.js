"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import Navbar from "@/components/ui/Navbar";
import { uploadMedia } from "@/lib/storage";

export default function PerfilPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [reservas, setReservas] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [favoritos, setFavoritos] = useState([]);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const avatarInputRef = useRef(null);

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
    } catch (err) {
      console.error("Error updating avatar:", err);
      alert(lang === "en" ? "Failed to upload profile picture" : "Error al subir la foto de perfil");
    } finally {
      setAvatarUploading(false);
    }
  };

  // Cargar datos del usuario y sus registros
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { session: activeSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !activeSession) {
          router.push("/login");
          return;
        }

        setSession(activeSession);
        const currentUser = activeSession.user;
        setUser(currentUser);

        // Cargar perfil
        const { data: perfilData, error: perfilError } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (perfilError) throw perfilError;
        setPerfil(perfilData);

        // Cargar Reservas del Cliente
        const { data: reservasData } = await supabase
          .from("reservas")
          .select("*, negocios(nombre), lugares(nombre)")
          .eq("cliente_id", currentUser.id)
          .order("fecha_hora", { ascending: false });
        setReservas(reservasData || []);

        // Cargar Reseñas del Cliente
        const { data: resenasData } = await supabase
          .from("resenas")
          .select("*, puntos(nombre), negocios(nombre)")
          .eq("autor_id", currentUser.id)
          .order("created_at", { ascending: false });
        setResenas(resenasData || []);

        // Cargar Favoritos del Cliente
        const { data: favoritosData } = await supabase
          .from("favoritos")
          .select("*, puntos(id, nombre, categoria, ubicacion)")
          .eq("usuario_id", currentUser.id)
          .order("created_at", { ascending: false });
        setFavoritos(favoritosData || []);

      } catch (err) {
        console.error("Error loading profile details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  // Cancelar una Reserva
  const handleCancelarReserva = async (reservaId) => {
    const confirmCancel = window.confirm(
      lang === "en" 
        ? "Are you sure you want to cancel this reservation?" 
        : "¿Estás seguro de que deseas cancelar esta reserva?"
    );
    if (!confirmCancel) return;

    try {
      const { error } = await supabase
        .from("reservas")
        .update({ estado_reserva: "cancelada" })
        .eq("id", reservaId);

      if (error) throw error;

      // Actualizar estado local
      setReservas((prev) =>
        prev.map((res) =>
          res.id === reservaId ? { ...res, estado_reserva: "cancelada" } : res
        )
      );
    } catch (err) {
      alert(lang === "en" ? "Failed to cancel reservation" : "No se pudo cancelar la reserva");
      console.error(err);
    }
  };

  // Eliminar una Reseña
  const handleEliminarResena = async (resenaId) => {
    const confirmDel = window.confirm(
      lang === "en" 
        ? "Are you sure you want to delete this review?" 
        : "¿Estás seguro de que deseas eliminar esta reseña?"
    );
    if (!confirmDel) return;

    try {
      const { error } = await supabase
        .from("resenas")
        .delete()
        .eq("id", resenaId);

      if (error) throw error;

      // Actualizar estado local
      setResenas((prev) => prev.filter((r) => r.id !== resenaId));
    } catch (err) {
      alert(lang === "en" ? "Failed to delete review" : "No se pudo eliminar la reseña");
      console.error(err);
    }
  };

  // Eliminar un Favorito
  const handleRemoveFavorite = async (favoritoId) => {
    const confirmDel = window.confirm(
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

  // Cerrar Sesión
  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#050508",
        color: "white"
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
          <p style={{ fontSize: "14px", color: "#4A5568" }}>
            {lang === "en" ? "Loading profile..." : "Cargando perfil..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--atlan-bg-primary)",
      color: "var(--atlan-text-primary)",
      paddingBottom: "80px",
      fontFamily: "var(--font-outfit), sans-serif"
    }}>
      <Navbar activePage="perfil" session={session} perfil={perfil} onLogout={handleCerrarSesion} />

      {/* CUERPO DEL CONTENEDOR */}
      <div style={{
        maxWidth: "1100px",
        margin: "40px auto 0",
        padding: "0 24px",
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: "40px"
      }} className="profile-grid">
        
        {/* SIDEBAR DE USUARIO */}
        <div>
          <div style={{
            background: "#FFFFFF",
            border: "1px solid rgba(20, 109, 158, 0.12)",
            borderRadius: "24px",
            padding: "24px",
            textAlign: "center",
            boxShadow: "0 10px 30px -4px rgba(20, 109, 158, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03)",
            position: "sticky",
            top: "100px"
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
                width: "80px",
                height: "80px",
                background: perfil?.avatar_url 
                  ? `url(${perfil.avatar_url}) center/cover` 
                  : "linear-gradient(135deg, #FFD700 0%, #E6C200 100%)",
                borderRadius: "50%",
                margin: "0 auto 16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "32px",
                color: "#FFFFFF",
                fontWeight: "bold",
                boxShadow: "0 0 20px rgba(255, 215, 0, 0.2)",
                position: "relative",
                cursor: "pointer",
                overflow: "hidden"
              }}
              title={lang === "en" ? "Change profile picture" : "Cambiar foto de perfil"}
            >
              {avatarUploading ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", color: "#1A1A2E", fontSize: "11px", fontWeight: "bold" }}>
                  ⏳
                </div>
              ) : (
                <>
                  {!perfil?.avatar_url && (perfil?.nombre_completo ? perfil.nombre_completo.charAt(0).toUpperCase() : "U")}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: avatarHover ? 1 : 0,
                    transition: "opacity 0.2s",
                    color: "#1A1A2E",
                    fontSize: "18px"
                  }}>
                    📷
                  </div>
                </>
              )}
            </div>

            <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "800" }}>
              {perfil?.nombre_completo || "Usuario Atlan"}
            </h3>

            <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "#9CA3AF", fontWeight: "600" }}>
              {user?.email}
            </p>

            <div style={{
              display: "inline-block",
              background: "rgba(255, 215, 0, 0.1)",
              border: "1px solid rgba(255, 215, 0, 0.2)",
              color: "#FFD700",
              fontSize: "11px",
              fontWeight: "800",
              padding: "4px 12px",
              borderRadius: "20px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "24px"
            }}>
              ✨ {perfil?.rol === "dueno" ? (lang === "en" ? "Business Owner" : "Dueño de Negocio") : (lang === "en" ? "Registered Tourist" : "Turista Registrado")}
            </div>

            {(perfil?.rol === "dueno" || perfil?.rol === "admin") && (
              <Link href="/dashboard" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #FFD700 0%, #E6C200 100%)",
                color: "#1A1A2E",
                borderRadius: "12px",
                fontWeight: "800",
                fontSize: "13.5px",
                textDecoration: "none",
                marginBottom: "16px",
                boxShadow: "0 4px 12px rgba(255, 215, 0, 0.2)",
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                🛠️ {lang === "en" ? "Manage Business" : "Gestionar mi Negocio"}
              </Link>
            )}
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: RESERVAS Y RESEÑAS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          
          {/* SECCIÓN RESERVAS */}
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "800", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>📅</span> {lang === "en" ? "My Reservations" : "Mis Reservas Directas"}
              <span style={{ fontSize: "12px", background: "rgba(20, 109, 158, 0.10)", padding: "2px 8px", borderRadius: "8px", color: "#4A5568" }}>
                {reservas.length}
              </span>
            </h2>

            {reservas.length === 0 ? (
              <div style={{
                background: "#FFFFFF",
                border: "1px dashed rgba(20, 109, 158, 0.2)",
                boxShadow: "0 4px 16px -2px rgba(20, 109, 158, 0.06)",
                borderRadius: "16px",
                padding: "40px 20px",
                textAlign: "center",
                color: "#9CA3AF"
              }}>
                <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>🏨</span>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  {lang === "en" ? "You haven't made any lodging/table reservations yet." : "Aún no has realizado reservas de hospedaje o mesas."}
                </p>
                <Link href="/mapa" style={{ display: "inline-block", marginTop: "16px", fontSize: "13px", color: "#FFD700", fontWeight: "700" }}>
                  {lang === "en" ? "Book a place now →" : "Reservar un lugar ahora →"}
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {reservas.map((res) => {
                  const lugarNombre = res.negocios?.nombre || res.lugares?.nombre || (lang === "en" ? "Local Place" : "Lugar Turístico");
                  const fechaFormatted = new Date(res.fecha_hora).toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  // Estilos por estado
                  const estadoStyles = {
                    pendiente: { bg: "rgba(230, 194, 0, 0.15)", text: "#E6C200", border: "rgba(230, 194, 0, 0.3)" },
                    confirmada: { bg: "rgba(23, 170, 74, 0.15)", text: "#1FCC5C", border: "rgba(23, 170, 74, 0.3)" },
                    cancelada: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" },
                    completada: { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" }
                  }[res.estado_reserva] || { bg: "rgba(20, 109, 158, 0.05)", text: "white", border: "rgba(20, 109, 158, 0.12)" };

                  return (
                    <div key={res.id} style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(20, 109, 158, 0.12)",
                      boxShadow: "0 4px 16px -2px rgba(20, 109, 158, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)",
                      borderRadius: "16px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>{lugarNombre}</h4>
                          <span style={{
                            fontSize: "10.5px",
                            fontWeight: "850",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: estadoStyles.bg,
                            color: estadoStyles.text,
                            border: `1px solid ${estadoStyles.border}`,
                            textTransform: "uppercase"
                          }}>
                            {t(`reservations.status.${res.estado_reserva}`) || res.estado_reserva}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: "12.5px", color: "#4A5568" }}>
                          📅 {fechaFormatted}
                        </p>
                        <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#9CA3AF" }}>
                          <span>👥 {res.num_personas} {lang === "en" ? "people" : "personas"}</span>
                          {res.tipo_reserva && (
                            <span style={{ textTransform: "capitalize" }}>🏷️ {res.tipo_reserva}</span>
                          )}
                        </div>
                        {res.notas && (
                          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#4A5568", fontStyle: "italic", background: "rgba(255,255,255,0.02)", padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(20, 109, 158, 0.04)" }}>
                            " {res.notas} "
                          </p>
                        )}
                      </div>

                      {res.estado_reserva !== "cancelada" && res.estado_reserva !== "completada" && (
                        <button
                          onClick={() => handleCancelarReserva(res.id)}
                          style={{
                            padding: "8px 14px",
                            background: "transparent",
                            border: "1px solid rgba(239,68,68,0.3)",
                            color: "#f87171",
                            borderRadius: "10px",
                            fontWeight: "700",
                            fontSize: "12px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {lang === "en" ? "Cancel" : "Cancelar"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN FAVORITOS / DESTINOS GUARDADOS */}
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "800", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>❤️</span> {lang === "en" ? "My Saved Places" : "Mis Destinos Guardados"}
              <span style={{ fontSize: "12px", background: "rgba(20, 109, 158, 0.10)", padding: "2px 8px", borderRadius: "8px", color: "#4A5568" }}>
                {favoritos.length}
              </span>
            </h2>

            {favoritos.length === 0 ? (
              <div style={{
                background: "#FFFFFF",
                border: "1px dashed rgba(20, 109, 158, 0.2)",
                boxShadow: "0 4px 16px -2px rgba(20, 109, 158, 0.06)",
                borderRadius: "16px",
                padding: "40px 20px",
                textAlign: "center",
                color: "#9CA3AF"
              }}>
                <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>⭐</span>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  {lang === "en" ? "You haven't saved any places yet." : "Aún no tienes destinos o negocios guardados."}
                </p>
                <Link href="/mapa" style={{ display: "inline-block", marginTop: "16px", fontSize: "13px", color: "#FFD700", fontWeight: "700" }}>
                  {lang === "en" ? "Explore the map →" : "Explorar el mapa →"}
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
                {favoritos.map((fav) => {
                  const punto = fav.puntos;
                  if (!punto) return null;
                  
                  return (
                    <div key={fav.id} style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(20, 109, 158, 0.12)",
                      boxShadow: "0 4px 16px -2px rgba(20, 109, 158, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)",
                      borderRadius: "16px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px"
                    }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#1A1A2E" }}>
                          {punto.nombre}
                        </h4>
                        <span style={{
                          fontSize: "10.5px",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          color: "#4A5568",
                          background: "rgba(20, 109, 158, 0.08)",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>
                          {t(`addPoint.categories.${punto.categoria || 'otro'}`)}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <Link
                          href={`/mapa?id=${punto.id}`}
                          style={{
                            padding: "8px 14px",
                            background: "linear-gradient(135deg, #146D9E 0%, #17AA4A 100%)",
                            border: "none",
                            color: "white",
                            borderRadius: "10px",
                            fontWeight: "750",
                            fontSize: "12px",
                            textDecoration: "none",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          🗺️ {lang === "en" ? "View on Map" : "Ver en Mapa"}
                        </Link>

                        <button
                          onClick={() => handleRemoveFavorite(fav.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#f87171",
                            cursor: "pointer",
                            fontSize: "15px",
                            padding: "4px"
                          }}
                          title={lang === "en" ? "Remove from Favorites" : "Quitar de Favoritos"}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN RESEÑAS ESCRITAS */}
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "800", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>⭐</span> {lang === "en" ? "My Reviews" : "Reseñas Publicadas"}
              <span style={{ fontSize: "12px", background: "rgba(20, 109, 158, 0.10)", padding: "2px 8px", borderRadius: "8px", color: "#4A5568" }}>
                {resenas.length}
              </span>
            </h2>

            {resenas.length === 0 ? (
              <div style={{
                background: "#FFFFFF",
                border: "1px dashed rgba(20, 109, 158, 0.2)",
                boxShadow: "0 4px 16px -2px rgba(20, 109, 158, 0.06)",
                borderRadius: "16px",
                padding: "40px 20px",
                textAlign: "center",
                color: "#4A5568"
              }}>
                <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>💬</span>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>
                  {lang === "en" ? "You haven't posted any reviews yet." : "Aún no has publicado reseñas en los destinos."}
                </p>
                <Link href="/mapa" style={{ display: "inline-block", marginTop: "16px", fontSize: "13px", color: "#FFD700", fontWeight: "700" }}>
                  {lang === "en" ? "Explore destinations and leave a review →" : "Explorar el mapa para calificar →"}
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {resenas.map((rev) => {
                  const destinoNombre = rev.negocios?.nombre || rev.puntos?.nombre || (lang === "en" ? "Local Destination" : "Destino");
                  return (
                    <div key={rev.id} style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(20, 109, 158, 0.12)",
                      boxShadow: "0 4px 16px -2px rgba(20, 109, 158, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)",
                      borderRadius: "16px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px"
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#1A1A2E" }}>{destinoNombre}</h4>
                          <span style={{ fontSize: "13px", color: "#E6C200" }}>
                            {"★".repeat(rev.estrellas)}{"☆".repeat(5 - rev.estrellas)}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#4A5568", lineHeight: "1.5" }}>
                          {rev.comentario}
                        </p>
                        <span style={{ display: "block", marginTop: "8px", fontSize: "11px", color: "#718096" }}>
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={() => handleEliminarResena(rev.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#f87171",
                          cursor: "pointer",
                          fontSize: "15px",
                          padding: "4px"
                        }}
                        title={lang === "en" ? "Delete Review" : "Eliminar Reseña"}
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
