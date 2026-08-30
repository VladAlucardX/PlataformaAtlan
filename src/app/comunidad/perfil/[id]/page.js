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
import { getProfileSlug } from "@/lib/profileUtils";

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
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  };
}

const sidebarStyles = {
  profileCard: {
    background: "#FFFFFF", border: "2px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "inset 3px 3px 8px rgba(255, 255, 255, 1), inset -4px -4px 10px rgba(20, 109, 158, 0.05), 0 12px 28px -6px rgba(20, 109, 158, 0.10)",
    borderRadius: "24px", overflow: "hidden",
  },
  profileBanner: {
    height: "60px", background: "linear-gradient(135deg, rgba(20, 109, 158, 0.08) 0%, rgba(23, 170, 74, 0.12) 100%)",
  },
  loginCard: {
    background: "#FFFFFF", border: "2px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "inset 3px 3px 8px rgba(255, 255, 255, 1), inset -4px -4px 10px rgba(20, 109, 158, 0.05), 0 12px 28px -6px rgba(20, 109, 158, 0.10)",
    borderRadius: "24px", padding: "24px", textAlign: "center",
  },
  sectionCard: {
    background: "#FFFFFF", border: "2px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "inset 3px 3px 8px rgba(255, 255, 255, 1), inset -4px -4px 10px rgba(20, 109, 158, 0.05), 0 12px 28px -6px rgba(20, 109, 158, 0.10)",
    borderRadius: "24px", padding: "20px",
  },
  sectionTitle: {
    margin: "0 0 14px", fontSize: "15px", fontWeight: "800",
    color: "var(--atlan-text-primary)", display: "flex", alignItems: "center", gap: "6px"
  },
  userCard: {
    display: "flex", alignItems: "center", gap: "10px", padding: "8px 0",
    borderBottom: "1px solid rgba(20,109,158,0.06)",
  },
  followBtn: {
    padding: "6px 14px", border: "none", borderRadius: "20px",
    fontSize: "12px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap",
    transition: "all 0.2s",
  },
  exploreLink: {
    display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px",
    color: "var(--atlan-text-secondary)", textDecoration: "none", fontSize: "13px",
    fontWeight: "600", borderRadius: "10px", transition: "all 0.2s",
    marginBottom: "4px",
  },
};

function UserSuggestionCard({ user, session, lang, onRequireLogin, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase.from("seguimientos")
      .select("id")
      .eq("seguidor_id", session.user.id)
      .eq("seguido_id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setIsFollowing(true); });
  }, [session, user.id]);

  const handleFollow = async () => {
    if (!session) { onRequireLogin(); return; }
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("seguimientos").delete().eq("seguidor_id", session.user.id).eq("seguido_id", user.id);
        setIsFollowing(false);
      } else {
        await supabase.from("seguimientos").insert({ seguidor_id: session.user.id, seguido_id: user.id });
        setIsFollowing(true);
      }
      if (onFollowChange) onFollowChange();
    } catch (err) { console.error("Follow error:", err); }
    finally { setLoading(false); }
  };

  if (session?.user?.id === user.id) return null;

  return (
    <div style={sidebarStyles.userCard}>
      <Link href={`/comunidad/perfil/${user.id}`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flex: 1, minWidth: 0 }}>
        <div style={avatarStyle(user.avatar_url, 38)}>
          {!user.avatar_url && (user.nombre_completo?.[0]?.toUpperCase() || "U")}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--atlan-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.nombre_completo || "Usuario"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>
            {user.rol === "dueno"
              ? <><Icon name="building" size={11} /> Propietario</>
              : (user.es_premium || user.suscripcion_activa || user.rol === "turista_deacachimba")
              ? <><Icon name="star" size={11} /> Turista Deacachimba</>
              : <><Icon name="luggage" size={11} /> Turista Tuani</>}
          </div>
        </div>
      </Link>
      <button
        onClick={handleFollow}
        disabled={loading}
        style={{
          ...sidebarStyles.followBtn,
          background: isFollowing ? "rgba(20,109,158,0.06)" : "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)",
          color: isFollowing ? "var(--atlan-text-secondary)" : "white",
        }}
      >
        {isFollowing ? (lang === "en" ? "Following" : "Siguiendo") : (lang === "en" ? "Follow" : "Seguir")}
      </button>
    </div>
  );
}

export default function PerfilPublico() {
  const { t, lang } = useTranslation();
  const params = useParams();
  const rawUserId = params.id;

  const { session, perfil: myPerfil, updatePerfil } = useAuth();

  const [targetPerfil, setTargetPerfil] = useState(null);
  const userId = targetPerfil?.id || rawUserId;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutualFollow, setIsMutualFollow] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());

  // Edit bio & profile modal
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar upload
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  // Modals & Search
  const [viewerPost, setViewerPost] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState("followers");
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchSuggestedUsers = useCallback(async () => {
    try {
      let query = supabase.from("perfiles").select("id, nombre_completo, avatar_url, rol, seguidores_count").limit(6);
      if (session?.user) {
        query = query.neq("id", session.user.id);
      }
      const { data } = await query;
      setSuggestedUsers(data || []);
    } catch (err) { console.error("Error fetching suggested users:", err); }
  }, [session]);

  useEffect(() => {
    fetchSuggestedUsers();
  }, [fetchSuggestedUsers]);

  // Load target profile & posts
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        let pData = null;
        let isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);

        if (isUuid) {
          const { data } = await supabase.from("perfiles").select("*").eq("id", rawUserId).maybeSingle();
          pData = data;
        } else {
          const slugLower = rawUserId.toLowerCase().replace(/[^a-z0-9]/g, "");
          const { data: allP } = await supabase.from("perfiles").select("*");
          if (allP) {
            pData = allP.find(p => {
              const nameSlug = (p.nombre_completo || "").toLowerCase().replace(/[^a-z0-9]/g, "");
              const emailSlug = (p.email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
              return nameSlug === slugLower || emailSlug === slugLower;
            }) || null;
          }
        }

        if (!pData) {
          if (isMounted) setLoading(false);
          return;
        }

        if (isMounted) setTargetPerfil(pData);

        // Fetch posts
        const { data: postsData } = await supabase
          .from("publicaciones")
          .select("*, perfiles(id, nombre_completo, avatar_url, rol)")
          .eq("autor_id", pData.id)
          .order("created_at", { ascending: false });

        if (isMounted) setPosts(postsData || []);

        // Follow status
        if (session && session.user.id !== pData.id) {
          const { data: followData } = await supabase
            .from("seguimientos")
            .select("id")
            .eq("seguidor_id", session.user.id)
            .eq("seguido_id", pData.id)
            .maybeSingle();

          if (isMounted) setIsFollowing(!!followData);

          const { data: reverseFollow } = await supabase
            .from("seguimientos")
            .select("id")
            .eq("seguidor_id", pData.id)
            .eq("seguido_id", session.user.id)
            .maybeSingle();

          if (isMounted) setIsMutualFollow(!!followData && !!reverseFollow);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [rawUserId, session]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session || !targetPerfil) return;
    setAvatarUploading(true);
    try {
      const url = await uploadMedia(file, "avatars");
      const { error } = await supabase.from("perfiles").update({ avatar_url: url }).eq("id", targetPerfil.id);
      if (error) throw error;
      setTargetPerfil(prev => ({ ...prev, avatar_url: url }));
      if (updatePerfil) updatePerfil({ avatar_url: url });
    } catch (err) {
      console.error(err);
      alert(lang === "en" ? "Failed to upload avatar" : "Error al subir la imagen");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleFollow = async () => {
    if (!session) { setShowLoginModal(true); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("seguimientos").delete().eq("seguidor_id", session.user.id).eq("seguido_id", targetPerfil.id);
        setIsFollowing(false);
        setIsMutualFollow(false);
        setTargetPerfil(prev => ({ ...prev, seguidores_count: Math.max((prev.seguidores_count || 1) - 1, 0) }));
      } else {
        await supabase.from("seguimientos").insert({ seguidor_id: session.user.id, seguido_id: targetPerfil.id });
        setIsFollowing(true);
        setTargetPerfil(prev => ({ ...prev, seguidores_count: (prev.seguidores_count || 0) + 1 }));
      }
    } catch (err) { console.error(err); }
    finally { setFollowLoading(false); }
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

  const handleSaveProfileModal = async (e) => {
    e.preventDefault();
    if (!session || !userId) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("perfiles").update({ nombre_completo: editNombre.trim(), bio: editBio.trim() }).eq("id", userId);
      if (error) throw error;
      setTargetPerfil(prev => ({ ...prev, nombre_completo: editNombre.trim(), bio: editBio.trim() }));
      if (updatePerfil) updatePerfil({ nombre_completo: editNombre.trim(), bio: editBio.trim() });
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      alert(lang === "en" ? "Failed to update profile" : "Error al actualizar perfil");
    } finally { setSavingProfile(false); }
  };

  const isOwnProfile = session?.user?.id === userId;
  const isAdmin = myPerfil?.rol === "admin";

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--atlan-bg-primary)" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(20, 109, 158, 0.12)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!targetPerfil) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--atlan-bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}><Icon name="search" size={48} /></span>
          <h3 style={{ margin: "0 0 8px", color: "var(--atlan-text-primary)" }}>{lang === "en" ? "User not found" : "Usuario no encontrado"}</h3>
          <Link href="/comunidad" style={{ color: "var(--atlan-gold)", fontWeight: "700" }}>← {lang === "en" ? "Back to Community" : "Volver a Comunidad"}</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--atlan-bg-primary)", fontFamily: "var(--font-outfit), system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
      {/* SVGs */}
      <img src="/images/tortuga.svg" alt="" style={{ position: "fixed", bottom: "-10px", left: "-10px", width: "360px", maxHeight: "360px", objectFit: "contain", opacity: 0.18, pointerEvents: "none", zIndex: 0 }} />
      <img src="/images/machoraton.svg" alt="" style={{ position: "fixed", top: "80px", right: "10px", width: "340px", height: "calc(100vh - 90px)", objectFit: "contain", opacity: 0.16, pointerEvents: "none", zIndex: 0 }} />

      <Navbar activePage="comunidad" session={session} perfil={myPerfil} />

      {/* Main 3-Column Layout */}
      <div className="community-main-layout" style={{ maxWidth: "1320px", margin: "0 auto", padding: "95px 24px 40px 24px", position: "relative", zIndex: 1 }}>

        {/* ── SIDEBAR LEFT ── */}
        <aside className="hide-mobile community-sidebar">
          {session && myPerfil ? (
            <div style={sidebarStyles.profileCard}>
              <div style={sidebarStyles.profileBanner} />
              <div style={{ padding: "0 20px 20px", marginTop: "-32px", textAlign: "center" }}>
                <Link href={`/comunidad/perfil/${getProfileSlug(myPerfil) || session.user.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ ...avatarStyle(myPerfil.avatar_url, 64), margin: "0 auto 8px", border: "3px solid var(--atlan-bg-primary)" }}>
                    {!myPerfil.avatar_url && (myPerfil.nombre_completo?.[0]?.toUpperCase() || "U")}
                  </div>
                </Link>
                <h4 style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{myPerfil.nombre_completo}</h4>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--atlan-text-muted)" }}>
                  {myPerfil.rol === "dueno" ? <><Icon name="building" size={11} /> Propietario</> : <><Icon name="luggage" size={11} /> Turista Tuani</>}
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
                  <button onClick={() => { setFollowersModalTab("followers"); setShowFollowersModal(true); }} style={{ textAlign: "center", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{myPerfil.seguidores_count || 0}</div>
                    <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>Seguidores</div>
                  </button>
                  <button onClick={() => { setFollowersModalTab("following"); setShowFollowersModal(true); }} style={{ textAlign: "center", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{myPerfil.siguiendo_count || 0}</div>
                    <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>Siguiendo</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={sidebarStyles.loginCard}>
              <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}><Icon name="users" size={36} /></span>
              <h4 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>Únete a la Comunidad</h4>
              <Link href="/registro" className="btn-primary" style={{ display: "block", textAlign: "center", padding: "10px", fontSize: "13px" }}>Crear Cuenta</Link>
            </div>
          )}

          <div style={{ ...sidebarStyles.sectionCard, marginTop: "16px" }}>
            <h4 style={sidebarStyles.sectionTitle}>
              <Icon name="map" size={14} /> Explorar
            </h4>
            <Link href="/mapa" style={sidebarStyles.exploreLink}>
              <img src="/images/mapa.svg" alt="Mapa" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> Mapa Turístico
            </Link>
          </div>
        </aside>

        {/* ── CENTER COLUMN ── */}
        <main style={{ minWidth: 0, width: "100%" }}>
          {/* Target Profile Card (Solo se muestra si estás visitando el perfil de OTRA persona) */}
          {!isOwnProfile && (
            <div style={{ background: "#FFFFFF", borderRadius: "24px", border: "2px solid rgba(255, 255, 255, 0.95)", boxShadow: "0 14px 35px rgba(0, 0, 0, 0.08)", overflow: "hidden", marginBottom: "24px" }}>
              <div style={{ height: "100px", background: "linear-gradient(135deg, rgba(20, 109, 158, 0.08) 0%, rgba(23, 170, 74, 0.10) 100%)" }} />
              <div style={{ padding: "0 24px 24px", marginTop: "-44px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <div style={avatarStyle(targetPerfil.avatar_url, 80)}>
                    {!targetPerfil.avatar_url && (targetPerfil.nombre_completo?.[0]?.toUpperCase() || "U")}
                  </div>
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "900", color: "#1A1A2E" }}>
                      {targetPerfil.nombre_completo || "Usuario"}
                    </h2>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#17AA4A" }}>
                      {targetPerfil.rol === "dueno" ? "Propietario" : "Turista Tuani"}
                    </span>
                  </div>
                  <button onClick={handleFollow} disabled={followLoading} style={{ padding: "8px 20px", borderRadius: "10px", border: "none", background: isFollowing ? "rgba(20,109,158,0.08)" : "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", color: isFollowing ? "#1A1A2E" : "white", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>
                    {isFollowing ? "✓ Siguiendo" : "Seguir"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: "24px", paddingTop: "12px", borderTop: "1px solid rgba(20,109,158,0.08)" }}>
                  <div><strong>{posts.length}</strong> <span style={{ fontSize: "12px", color: "#64748B" }}>Posts</span></div>
                  <div><strong>{targetPerfil.seguidores_count || 0}</strong> <span style={{ fontSize: "12px", color: "#64748B" }}>Seguidores</span></div>
                  <div><strong>{targetPerfil.siguiendo_count || 0}</strong> <span style={{ fontSize: "12px", color: "#64748B" }}>Siguiendo</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "#FFFFFF", borderRadius: "24px", border: "1px solid rgba(20,109,158,0.08)" }}>
              <p style={{ margin: 0, color: "#64748B" }}>No hay publicaciones todavía.</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} style={{ background: "#FFFFFF", borderRadius: "24px", border: "2px solid rgba(255, 255, 255, 0.95)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)", padding: "24px", marginBottom: "20px" }}>
                <p style={{ margin: "0 0 12px", fontSize: "15px", color: "#1A1A2E", whiteSpace: "pre-wrap" }}>{post.contenido}</p>
                {post.imagen_url && (
                  <img src={post.imagen_url} alt="Post" style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "16px", marginBottom: "12px" }} />
                )}
              </div>
            ))
          )}
        </main>

        {/* ── SIDEBAR RIGHT ── */}
        <aside className="hide-mobile community-sidebar">
          <div style={sidebarStyles.sectionCard}>
            <h4 style={sidebarStyles.sectionTitle}>
              <Icon name="search" size={14} /> Buscar
            </h4>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar personas..."
              style={{ width: "100%", padding: "10px 14px", background: "rgba(20, 109, 158, 0.04)", border: "1px solid rgba(20, 109, 158, 0.10)", borderRadius: "12px", fontSize: "13px", outline: "none" }}
            />
          </div>

          <div style={{ ...sidebarStyles.sectionCard, marginTop: "16px" }}>
            <h4 style={sidebarStyles.sectionTitle}>
              <Icon name="sparkles" size={14} /> Personas sugeridas
            </h4>
            {suggestedUsers.map((u) => (
              <UserSuggestionCard key={u.id} user={u} session={session} lang={lang} onRequireLogin={() => setShowLoginModal(true)} onFollowChange={fetchSuggestedUsers} />
            ))}
          </div>
        </aside>

      </div>

      {/* Followers Modal */}
      {showFollowersModal && session && (
        <FollowersModal
          userId={session.user.id}
          session={session}
          lang={lang}
          initialTab={followersModalTab}
          onClose={() => setShowFollowersModal(false)}
        />
      )}
    </div>
  );
}
