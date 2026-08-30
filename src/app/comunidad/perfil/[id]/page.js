"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { uploadMedia } from "@/lib/storage";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import FollowersModal from "@/components/ui/FollowersModal";
import ImageViewerModal from "@/components/ui/ImageViewerModal";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";

// Perfil público de comunidad

function timeAgo(dateStr, lang) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return lang === "en" ? "Now" : "Ahora";
  if (diffMin < 60) return lang === "en" ? `${diffMin}m ago` : `hace ${diffMin}m`;
  if (diffHr < 24) return lang === "en" ? `${diffHr}h ago` : `hace ${diffHr}h`;
  return lang === "en" ? `${diffDay}d ago` : `hace ${diffDay}d`;
}

function avatarStyle(url, size) {
  return {
    width: `${size}px`, height: `${size}px`, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: `${Math.floor(size * 0.42)}px`, fontWeight: "800", color: "#FFFFFF",
    background: url ? `url(${url}) center/cover` : "linear-gradient(135deg, #FFD700 0%, #FFDF33 100%)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  };
}

import { getProfileSlug } from "@/lib/profileUtils";

export default function PerfilPublico() {
  const { t, lang } = useTranslation();
  const params = useParams();
  const rawUserId = params.id;

  // Sesión centralizada desde AuthContext
  const { session, perfil: myPerfil, updatePerfil } = useAuth();

  const [targetPerfil, setTargetPerfil] = useState(null);

  const userId = targetPerfil?.id || rawUserId;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutualFollow, setIsMutualFollow] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [negocio, setNegocio] = useState(null);

  // Edit bio & profile modal
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfileModal = async (e) => {
    e.preventDefault();
    if (!session || !userId) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({
          nombre_completo: editNombre.trim(),
          bio: editBio.trim(),
        })
        .eq("id", userId);

      if (error) throw error;

      setTargetPerfil((prev) => ({
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
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(lang === "en" ? "Failed to update profile" : "Error al actualizar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  // Post interactions
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const avatarInputRef = useRef(null);

  // Followers/Following modal
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState("followers");

  // Image viewer modal
  const [viewerPost, setViewerPost] = useState(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const publicUrl = await uploadMedia(file, "avatars");
      const { error } = await supabase
        .from("perfiles")
        .update({ avatar_url: publicUrl })
        .eq("id", session.user.id);
      if (error) throw error;

      setTargetPerfil((p) => ({ ...p, avatar_url: publicUrl }));
      if (updatePerfil) updatePerfil({ avatar_url: publicUrl });
    } catch (err) {
      console.error("Error updating avatar:", err);
      alert(lang === "en" ? "Failed to upload profile picture" : "Error al subir la foto de perfil");
    } finally {
      setAvatarUploading(false);
    }
  };



  // Fetch target profile
  useEffect(() => {
    if (!rawUserId) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        let profile = null;

        // 1. Intentar por UUID directo
        if (rawUserId.length === 36 && rawUserId.includes("-")) {
          const { data } = await supabase.from("perfiles").select("*").eq("id", rawUserId).maybeSingle();
          profile = data;
        }

        // 2. Si no se halló por UUID o se pasó un slug de nombre de usuario
        if (!profile) {
          const { data: allProfiles } = await supabase.from("perfiles").select("*");
          if (allProfiles) {
            profile = allProfiles.find(p => getProfileSlug(p) === rawUserId.toLowerCase()) || allProfiles.find(p => p.id === rawUserId);
          }
        }

        setTargetPerfil(profile);
        setBioText(profile?.bio || "");

        const targetId = profile ? profile.id : rawUserId;

        // Posts
        const { data: userPosts } = await supabase.from("publicaciones")
          .select("*, perfiles(id, nombre_completo, avatar_url, rol)")
          .eq("autor_id", targetId)
          .order("created_at", { ascending: false });
        setPosts(userPosts || []);

        // Business (if owner)
        if (profile?.rol === "dueno") {
          const { data: biz } = await supabase.from("negocios").select("id, nombre").eq("propietario_id", targetId).eq("activo", true).maybeSingle();
          setNegocio(biz);
        }

        // Check follow status
        if (session?.user) {
          const { data: follow } = await supabase.from("seguimientos")
            .select("id").eq("seguidor_id", session.user.id).eq("seguido_id", targetId).maybeSingle();
          if (follow) setIsFollowing(true);

          // Check mutual follow for chat
          const { data: isMutual } = await supabase.rpc("verificar_seguimiento_mutuo", { uid_a: session.user.id, uid_b: targetId });
          setIsMutualFollow(!!isMutual);
        }

        // Check liked posts
        if (session?.user && userPosts?.length) {
          const { data: likes } = await supabase.from("likes_social")
            .select("publicacion_id")
            .eq("usuario_id", session.user.id)
            .in("publicacion_id", userPosts.map(p => p.id));
          if (likes) setLikedPosts(new Set(likes.map(l => l.publicacion_id)));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [rawUserId, session]);

  const handleFollow = async () => {
    if (!session) { setShowLoginModal(true); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("seguimientos").delete().eq("seguidor_id", session.user.id).eq("seguido_id", userId);
        setIsFollowing(false);
        setTargetPerfil(p => ({ ...p, seguidores_count: Math.max((p.seguidores_count || 1) - 1, 0) }));
      } else {
        await supabase.from("seguimientos").insert({ seguidor_id: session.user.id, seguido_id: userId });
        setIsFollowing(true);
        setTargetPerfil(p => ({ ...p, seguidores_count: (p.seguidores_count || 0) + 1 }));
      }
    } catch (err) { console.error(err); }
    finally { setFollowLoading(false); }
  };

  const handleSaveBio = async () => {
    if (!session || session.user.id !== userId) return;
    try {
      await supabase.from("perfiles").update({ bio: bioText.trim() }).eq("id", userId);
      setTargetPerfil(p => ({ ...p, bio: bioText.trim() }));
      setEditingBio(false);
    } catch (err) { console.error(err); }
  };

  const handleLikePost = async (postId) => {
    if (!session) { setShowLoginModal(true); return; }
    try {
      const newLiked = new Set(likedPosts);
      if (newLiked.has(postId)) {
        await supabase.from("likes_social").delete().eq("publicacion_id", postId).eq("usuario_id", session.user.id);
        newLiked.delete(postId);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max((p.likes_count || 1) - 1, 0) } : p));
      } else {
        await supabase.from("likes_social").insert({ publicacion_id: postId, usuario_id: session.user.id });
        newLiked.add(postId);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
      }
      setLikedPosts(newLiked);
    } catch (err) { console.error(err); }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm(lang === "en" ? "Delete this post?" : "¿Eliminar esta publicación?")) return;
    try {
      await supabase.from("publicaciones").delete().eq("id", postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) { console.error(err); }
  };

  const isOwnProfile = session?.user?.id === userId;
  const isAdmin = myPerfil?.rol === "admin";

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--atlan-bg-primary)", color: "#1A1A2E" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid rgba(20, 109, 158, 0.12)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "14px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Loading profile..." : "Cargando perfil..."}</p>
        </div>
      </div>
    );
  }

  if (!targetPerfil) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--atlan-bg-primary)", color: "#1A1A2E" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}><Icon name="search" size={48} /></span>
          <h3 style={{ margin: "0 0 8px", color: "var(--atlan-text-primary)" }}>{lang === "en" ? "User not found" : "Usuario no encontrado"}</h3>
          <Link href="/comunidad" style={{ color: "var(--atlan-gold)", fontWeight: "700" }}>← {lang === "en" ? "Back to Community" : "Volver a Comunidad"}</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--atlan-bg-primary)", fontFamily: "var(--font-outfit), system-ui, sans-serif" }}>
      {/* Nav */}
      <Navbar activePage="comunidad" session={session} perfil={myPerfil} />

      {/* Profile Header Container */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "90px 16px 40px 16px" }}>
        {/* Banner suave redondeado */}
        <div style={{ height: "100px", background: "linear-gradient(135deg, rgba(20, 109, 158, 0.08) 0%, rgba(23, 170, 74, 0.10) 100%)", borderRadius: "24px", border: "1px solid rgba(20, 109, 158, 0.12)", position: "relative" }} />

        {/* Profile Info */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", marginTop: "-44px", padding: "0 16px", flexWrap: "wrap" }}>
          {isOwnProfile && (
            <input 
              type="file" 
              ref={avatarInputRef} 
              accept="image/*" 
              onChange={handleAvatarChange} 
              style={{ display: "none" }} 
            />
          )}
          <div 
            onClick={() => isOwnProfile && !avatarUploading && avatarInputRef.current?.click()}
            onMouseEnter={() => isOwnProfile && setAvatarHover(true)}
            onMouseLeave={() => isOwnProfile && setAvatarHover(false)}
            style={{ 
              ...avatarStyle(targetPerfil.avatar_url, 88), 
              border: "4px solid var(--atlan-bg-primary)",
              position: "relative",
              cursor: isOwnProfile ? "pointer" : "default",
              overflow: "hidden"
            }}
            title={isOwnProfile ? (lang === "en" ? "Change profile picture" : "Cambiar foto de perfil") : undefined}
          >
            {avatarUploading ? (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", color: "#1A1A2E", fontSize: "11px", fontWeight: "bold" }}>
                ⏳
              </div>
            ) : (
              <>
                {!targetPerfil.avatar_url && (targetPerfil.nombre_completo?.[0]?.toUpperCase() || "U")}
                {isOwnProfile && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: avatarHover ? 1 : 0,
                    transition: "opacity 0.2s",
                    color: "#1A1A2E",
                    fontSize: "20px"
                  }}>
                    📷
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ flex: 1, minWidth: "200px", paddingBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "900", color: "var(--atlan-text-primary)" }}>
                {targetPerfil.nombre_completo || "Usuario"}
              </h1>
              <span style={{
                fontSize: "11px", fontWeight: "800", padding: "3px 10px", borderRadius: "20px",
                background: targetPerfil.rol === "dueno" ? "rgba(255, 215, 0,0.12)" : "rgba(23, 170, 74,0.12)",
                color: targetPerfil.rol === "dueno" ? "#FFD700" : "#17AA4A",
                border: `1px solid ${targetPerfil.rol === "dueno" ? "rgba(255, 215, 0,0.25)" : "rgba(23, 170, 74,0.25)"}`,
                textTransform: "uppercase",
              }}>
                {targetPerfil.rol === "dueno" ? (
                  <><Icon name="building" size={12} /> Propietario</>
                ) : targetPerfil.rol === "admin" ? (
                  <><Icon name="zap" size={12} /> Admin</>
                ) : (targetPerfil.es_premium || targetPerfil.suscripcion_activa || targetPerfil.rol === "turista_deacachimba") ? (
                  <><Icon name="star" size={12} /> Turista Deacachimba</>
                ) : (
                  <><Icon name="luggage" size={12} /> Turista Tuani</>
                )}
              </span>
            </div>
          </div>

          {/* Follow / Chat / Edit buttons */}
          {isOwnProfile ? (
            <button
              onClick={() => {
                setEditNombre(targetPerfil.nombre_completo || "");
                setEditBio(targetPerfil.bio || "");
                setIsEditingProfile(true);
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "13.5px",
                fontWeight: "800",
                cursor: "pointer",
                border: "1px solid rgba(20, 109, 158, 0.2)",
                background: "rgba(20, 109, 158, 0.08)",
                color: "#146D9E",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
            >
              ✏️ {lang === "en" ? "Edit Profile" : "Editar Perfil"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button onClick={handleFollow} disabled={followLoading} style={{
                padding: "10px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "800",
                cursor: "pointer", transition: "all 0.2s", border: "none",
                background: isFollowing ? "rgba(20, 109, 158, 0.08)" : "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)",
                color: isFollowing ? "var(--atlan-text-secondary)" : "white",
                boxShadow: isFollowing ? "none" : "0 4px 12px rgba(23, 170, 74,0.25)",
              }}>
                {isFollowing ? (lang === "en" ? "✓ Following" : "✓ Siguiendo") : (lang === "en" ? "Follow" : "Seguir")}
              </button>
              {isMutualFollow ? (
                <Link href={`/chat?user=${userId}`} style={{
                  padding: "10px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: "800",
                  textDecoration: "none", border: "none", display: "inline-flex", alignItems: "center", gap: "6px",
                  background: "linear-gradient(135deg, #FFD700 0%, #E6C200 100%)",
                  color: "#1A1A2E", boxShadow: "0 4px 12px rgba(255, 215, 0, 0.3)",
                }}>
                  <Icon name="messageCircle" size={14} /> {lang === "en" ? "Message" : "Mensaje"}
                </Link>
              ) : isFollowing ? (
                <span style={{
                  padding: "10px 16px", borderRadius: "12px", fontSize: "12px", fontWeight: "700",
                  background: "rgba(20, 109, 158, 0.04)", color: "var(--atlan-text-muted)",
                  border: "1px solid rgba(20, 109, 158, 0.08)",
                }} title={lang === "en" ? "Both users must follow each other to chat" : "Ambos deben seguirse para chatear"}>
                  <Icon name="lock" size={14} /> {lang === "en" ? "Follow back to chat" : "Deben seguirse mutuamente"}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "32px", padding: "20px 16px 0", borderBottom: "1px solid rgba(20, 109, 158, 0.08)", paddingBottom: "20px" }}>
          <div>
            <span style={{ fontWeight: "800", fontSize: "18px", color: "var(--atlan-text-primary)" }}>{posts.length}</span>
            <span style={{ fontSize: "13px", color: "var(--atlan-text-muted)", marginLeft: "6px" }}>{lang === "en" ? "Posts" : "Posts"}</span>
          </div>
          <button onClick={() => { setFollowersModalTab("followers"); setShowFollowersModal(true); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: "8px", transition: "background 0.15s" }}>
            <span style={{ fontWeight: "800", fontSize: "18px", color: "var(--atlan-text-primary)" }}>{targetPerfil.seguidores_count || 0}</span>
            <span style={{ fontSize: "13px", color: "var(--atlan-text-muted)", marginLeft: "6px" }}>{lang === "en" ? "Followers" : "Seguidores"}</span>
          </button>
          <button onClick={() => { setFollowersModalTab("following"); setShowFollowersModal(true); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: "8px", transition: "background 0.15s" }}>
            <span style={{ fontWeight: "800", fontSize: "18px", color: "var(--atlan-text-primary)" }}>{targetPerfil.siguiendo_count || 0}</span>
            <span style={{ fontSize: "13px", color: "var(--atlan-text-muted)", marginLeft: "6px" }}>{lang === "en" ? "Following" : "Siguiendo"}</span>
          </button>
        </div>

        {/* Bio */}
        <div style={{ padding: "16px 16px 0" }}>
          {editingBio && isOwnProfile ? (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <textarea value={bioText} onChange={(e) => setBioText(e.target.value.slice(0, 200))} style={{
                flex: 1, padding: "10px 14px", background: "rgba(20, 109, 158, 0.04)", border: "1px solid rgba(20, 109, 158, 0.12)",
                borderRadius: "12px", color: "var(--atlan-text-primary)", fontSize: "14px", outline: "none", resize: "none", minHeight: "60px",
                fontFamily: "var(--font-outfit), system-ui, sans-serif",
              }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button onClick={handleSaveBio} style={{ padding: "8px 14px", background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", border: "none", borderRadius: "8px", color: "white", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>✓</button>
                <button onClick={() => { setEditingBio(false); setBioText(targetPerfil.bio || ""); }} style={{ padding: "8px 14px", background: "rgba(20, 109, 158, 0.08)", border: "none", borderRadius: "8px", color: "var(--atlan-text-muted)", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>✕</button>
              </div>
            </div>
          ) : (
            <div>
              {targetPerfil.bio ? (
                <p style={{ margin: 0, fontSize: "14px", color: "var(--atlan-text-secondary)", lineHeight: "1.6" }}>{targetPerfil.bio}</p>
              ) : isOwnProfile ? (
                <p style={{ margin: 0, fontSize: "13px", color: "var(--atlan-text-muted)", fontStyle: "italic" }}>
                  {lang === "en" ? "No bio yet. Click to add one." : "Sin biografía. Haz clic para agregar una."}
                </p>
              ) : null}
              {isOwnProfile && (
                <button onClick={() => setEditingBio(true)} style={{ marginTop: "8px", background: "none", border: "none", color: "var(--atlan-gold)", fontSize: "12px", fontWeight: "700", cursor: "pointer", padding: 0 }}>
                  <Icon name="edit" size={14} /> {lang === "en" ? "Edit bio" : "Editar bio"}
                </button>
              )}
            </div>
          )}

          {/* Business link */}
          {negocio && (
            <Link href="/mapa" style={{
              display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "12px",
              padding: "8px 16px", background: "rgba(255, 215, 0,0.08)", border: "1px solid rgba(255, 215, 0,0.15)",
              borderRadius: "10px", color: "var(--atlan-gold)", fontSize: "13px", fontWeight: "700", textDecoration: "none",
            }}>
              <Icon name="mapPin" size={14} /> {negocio.nombre}
            </Link>
          )}
        </div>

        {/* Posts */}
        <div style={{ padding: "24px 0" }}>
          <h3 style={{ margin: "0 0 16px 16px", fontSize: "18px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
            <Icon name="clipboard" size={14} /> {lang === "en" ? "Posts" : "Publicaciones"}
          </h3>

          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(20, 109, 158, 0.10)", borderRadius: "16px", margin: "0 16px" }}>
              <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>📭</span>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--atlan-text-muted)" }}>
                {lang === "en" ? "No posts yet" : "Sin publicaciones aún"}
              </p>
            </div>
          ) : (
            posts.map((post) => {
              const isLiked = likedPosts.has(post.id);
              const canDelete = isOwnProfile || isAdmin;
              const hasPublicidad = post.es_publicidad;
              const hasPromocion = post.es_promocion;

              const cardStyle = hasPublicidad ? {
                background: "radial-gradient(circle at top right, rgba(23, 170, 74, 0.08) 0%, #FFFFFF 70%)",
                border: "2px solid #17AA4A",
                boxShadow: "0 10px 30px -4px rgba(23, 170, 74, 0.25), 0 2px 6px rgba(0, 0, 0, 0.04)",
                borderRadius: "16px", padding: "20px", margin: "0 16px 14px"
              } : {
                background: "rgba(20, 109, 158, 0.03)",
                border: "1px solid rgba(20, 109, 158, 0.08)",
                borderRadius: "16px", padding: "20px", margin: "0 16px 14px"
              };

              return (
                <div key={post.id} style={cardStyle}>
                  {hasPublicidad && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "10px", padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "900", background: "linear-gradient(135deg, #FFD700 0%, #E6A800 100%)", border: "1px solid rgba(255,255,255,0.25)", color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.8px", boxShadow: "0 2px 8px rgba(255, 215, 0, 0.3)" }}>
                      <Icon name="sparkles" size={12} /> {lang === "en" ? "Sponsored Ad" : "Publicidad"}
                    </div>
                  )}
                  {hasPromocion && !hasPublicidad && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "10px", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "800", background: "linear-gradient(135deg, rgba(255, 215, 0,0.15), rgba(245,158,11,0.15))", border: "1px solid rgba(255, 215, 0,0.25)", color: "#FFD700", textTransform: "uppercase" }}>
                      <Icon name="megaphone" size={12} /> {lang === "en" ? "Promo" : "Promoción"}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "var(--atlan-text-muted)" }}>{timeAgo(post.created_at, lang)}</span>
                    {canDelete && (
                      <button onClick={() => handleDeletePost(post.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                        <Icon name="trash" size={12} /> {lang === "en" ? "Delete" : "Eliminar"}
                      </button>
                    )}
                  </div>

                  <p style={{ margin: "0 0 12px", fontSize: "14.5px", lineHeight: "1.6", color: "var(--atlan-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {post.contenido}
                  </p>

                  {post.imagen_url && (
                    <div style={{ borderRadius: "14px", overflow: "hidden", marginBottom: "12px", border: "1px solid rgba(20, 109, 158, 0.08)", cursor: "pointer" }} onClick={() => setViewerPost(post)}>
                      <img src={post.imagen_url} alt="Post" style={{ width: "100%", maxHeight: "400px", objectFit: "cover", display: "block" }} loading="lazy" />
                    </div>
                  )}

                  {post.video_url && (
                    <div style={{ borderRadius: "14px", overflow: "hidden", marginBottom: "12px", border: "1px solid rgba(20, 109, 158, 0.08)", background: "#000", position: "relative", cursor: "pointer" }} onClick={() => setViewerPost(post)}>
                      <video src={post.video_url} controls playsInline preload="metadata" style={{ width: "100%", maxHeight: "400px", display: "block" }} onClick={e => e.stopPropagation()} />
                      <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", color: "#17AA4A" }}>🎬 Video</div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "16px", paddingTop: "8px", borderTop: "1px solid rgba(20, 109, 158, 0.05)" }}>
                    <button onClick={() => handleLikePost(post.id)} style={{ background: "none", border: "none", color: isLiked ? "#ef4444" : "var(--atlan-text-secondary)", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      {isLiked ? <Icon name="heartFilled" size={14} color="#ef4444" /> : <Icon name="heart" size={14} />} {post.likes_count || 0}
                    </button>
                    <Link href={`/comunidad`} style={{ color: "var(--atlan-text-secondary)", fontSize: "13px", fontWeight: "700", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Icon name="messageCircle" size={14} /> {post.comentarios_count || 0}
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Login modal */}
      {showLoginModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={() => setShowLoginModal(false)}>
          <div style={{ maxWidth: "420px", width: "100%", background: "var(--atlan-bg-card)", border: "1px solid rgba(20, 109, 158, 0.12)", borderRadius: "20px", padding: "32px", textAlign: "center" }} onClick={(e) => e.stopPropagation()} className="animate-fade-in-up">
            <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}><Icon name="lock" size={48} /></span>
            <h3 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 8px", color: "var(--atlan-text-primary)" }}>
              {lang === "en" ? "Sign in to interact" : "Inicia sesión para interactuar"}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--atlan-text-secondary)", margin: "0 0 24px" }}>
              {lang === "en" ? "Sign up or log in to like, comment, and follow." : "Regístrate o inicia sesión para dar likes, comentar y seguir."}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link href="/login" className="btn-primary" style={{ padding: "12px 28px", fontSize: "14px" }}>{lang === "en" ? "Sign In" : "Iniciar Sesión"}</Link>
              <Link href="/registro" className="btn-secondary" style={{ padding: "12px 28px", fontSize: "14px" }}>{lang === "en" ? "Sign Up" : "Registrarse"}</Link>
            </div>
          </div>
        </div>
      )}
      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <FollowersModal
          userId={userId}
          session={session}
          lang={lang}
          initialTab={followersModalTab}
          onClose={() => setShowFollowersModal(false)}
        />
      )}

      {/* Image Viewer Modal */}
      {viewerPost && (
        <ImageViewerModal
          post={viewerPost}
          session={session}
          perfil={myPerfil}
          lang={lang}
          onClose={() => setViewerPost(null)}
        />
      )}

      {/* Modal Editar Perfil */}
      {isEditingProfile && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#FFFFFF",
            width: "100%",
            maxWidth: "460px",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(20, 109, 158, 0.15)"
          }} className="animate-fade-in-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#1A1A2E" }}>
                ✏️ {lang === "en" ? "Edit Profile" : "Editar Perfil"}
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748B" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfileModal} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "750", color: "#1A1A2E" }}>
                  {lang === "en" ? "Full Name" : "Nombre Completo"}
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="clay-input"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "750", color: "#1A1A2E" }}>
                  {lang === "en" ? "Biography / Description" : "Biografía / Descripción"}
                </label>
                <textarea
                  rows={3}
                  placeholder={lang === "en" ? "Tell the community about yourself..." : "Cuéntale a la comunidad sobre ti..."}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="clay-input"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "14px", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #CBD5E1",
                    background: "#F8FAFC",
                    color: "#475569",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  {lang === "en" ? "Cancel" : "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="clay-btn-green no-sheen"
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(145deg, #1FCC5C 0%, #17AA4A 70%, #128A3C 100%)",
                    color: "white",
                    fontWeight: "800",
                    cursor: "pointer"
                  }}
                >
                  {savingProfile ? (lang === "en" ? "Saving..." : "Guardando...") : (lang === "en" ? "Save Changes" : "Guardar Cambios")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
