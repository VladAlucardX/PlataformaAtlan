"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadMedia } from "@/lib/storage";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";

/* ═══════════════════════════════════════════════════════════════════════════
   COMUNIDAD ATLAN — Red Social
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Utilidad: Tiempo relativo ────────────────────────────────────────────
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

// ── NAVBAR ────────────────────────────────────────────────────────────────
function ComunidadNavbar({ session, perfil, onLogout }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={navStyles.nav}>
      <div style={navStyles.navInner}>
        <Link href="/" style={navStyles.logo}>
          <img src="/mapaicono.png" alt="Logo" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
          <span style={navStyles.logoText}>atlan</span>
        </Link>

        <div style={navStyles.navCenter}>
          <Link href="/mapa" style={navStyles.navLink}>🗺️ {t("nav.map")}</Link>
          <Link href="/comunidad" style={{ ...navStyles.navLink, color: "var(--atlan-gold)", borderBottom: "2px solid var(--atlan-gold)", paddingBottom: "4px" }}>
            👥 {t("social.community")}
          </Link>
          {session && <Link href="/chat" style={navStyles.navLink}>💬 {t("chat.title")}</Link>}
        </div>

        <div style={navStyles.navRight} className="hide-mobile">
          <LanguageToggle variant="pill" />
          {session ? (
            <>
              <Link href={perfil?.rol === "dueno" || perfil?.rol === "admin" ? "/dashboard" : "/perfil"} style={{ ...navStyles.navLink, display: "flex", alignItems: "center", gap: "6px" }}>
                {perfil?.avatar_url ? (
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: `url(${perfil.avatar_url}) center/cover`, border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
                ) : (
                  perfil?.rol === "dueno" || perfil?.rol === "admin" ? "💼" : "👤"
                )}
                <span>{perfil?.nombre_completo?.split(" ")[0] || "Mi perfil"}</span>
              </Link>
              <button onClick={onLogout} style={navStyles.logoutBtn}>🚪</button>
            </>
          ) : (
            <>
              <Link href="/login" style={navStyles.navLink}>{t("nav.login")}</Link>
              <Link href="/registro" className="btn-primary" style={{ padding: "8px 20px", fontSize: "13px" }}>{t("nav.register")}</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="hide-desktop" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <LanguageToggle variant="icon" />
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" style={navStyles.hamburger}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={navStyles.mobileMenu} className="animate-fade-in-down">
          <Link href="/mapa" style={navStyles.mobileLink} onClick={() => setMenuOpen(false)}>🗺️ {t("nav.map")}</Link>
          <Link href="/comunidad" style={{ ...navStyles.mobileLink, color: "var(--atlan-gold)" }} onClick={() => setMenuOpen(false)}>👥 {t("social.community")}</Link>
          {session && <Link href="/chat" style={navStyles.mobileLink} onClick={() => setMenuOpen(false)}>💬 {t("chat.title")}</Link>}
          {session ? (
            <>
              <Link href={perfil?.rol === "dueno" || perfil?.rol === "admin" ? "/dashboard" : "/perfil"} style={{ ...navStyles.mobileLink, display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setMenuOpen(false)}>
                {perfil?.avatar_url ? (
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `url(${perfil.avatar_url}) center/cover`, border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
                ) : (
                  perfil?.rol === "dueno" || perfil?.rol === "admin" ? "💼" : "👤"
                )}
                <span>{perfil?.nombre_completo || "Mi perfil"}</span>
              </Link>
              <button onClick={() => { setMenuOpen(false); onLogout(); }} style={navStyles.mobileLogoutBtn}>🚪 {t("nav.logout")}</button>
            </>
          ) : (
            <>
              <Link href="/login" style={navStyles.mobileLink} onClick={() => setMenuOpen(false)}>🔑 {t("nav.login")}</Link>
              <Link href="/registro" className="btn-primary" style={{ width: "100%", textAlign: "center", padding: "14px" }} onClick={() => setMenuOpen(false)}>✨ {t("nav.register")}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ── MODAL: LOGIN REQUERIDO ────────────────────────────────────────────────
function LoginRequiredModal({ onClose, lang }) {
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()} className="animate-fade-in-up">
        <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>🔐</span>
          <h3 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 8px", color: "var(--atlan-text-primary)" }}>
            {lang === "en" ? "Sign in to interact" : "Inicia sesión para interactuar"}
          </h3>
          <p style={{ fontSize: "14px", color: "var(--atlan-text-secondary)", margin: "0 0 28px", lineHeight: "1.6" }}>
            {lang === "en" ? "Sign up or log in to like, comment, and follow other users." : "Regístrate o inicia sesión para dar likes, comentar y seguir a otros usuarios."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/login" className="btn-primary" style={{ padding: "12px 28px", fontSize: "14px" }}>
              {lang === "en" ? "Sign In" : "Iniciar Sesión"}
            </Link>
            <Link href="/registro" className="btn-secondary" style={{ padding: "12px 28px", fontSize: "14px" }}>
              {lang === "en" ? "Create Account" : "Crear Cuenta"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODAL: CREAR PUBLICACIÓN ──────────────────────────────────────────────
function CreatePostModal({ onClose, session, perfil, lang, onPostCreated }) {
  const [contenido, setContenido] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [esPromocion, setEsPromocion] = useState(false);
  const [esPublicidad, setEsPublicidad] = useState(false);
  const [negocioId, setNegocioId] = useState("");
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const MAX_VIDEO_SIZE = 60 * 1024 * 1024; // 60MB
  const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

  useEffect(() => {
    if (perfil?.rol === "dueno") {
      supabase.from("negocios").select("id, nombre").eq("propietario_id", session.user.id).eq("activo", true)
        .then(({ data }) => { if (data) setNegocios(data); });
    }
  }, [perfil, session]);

  // Limpiar object URLs al desmontar
  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (videoFile) {
      alert(lang === "en" ? "You can only attach an image or a video, not both" : "Solo puedes adjuntar una imagen o un video, no ambos");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (imageFile) {
      alert(lang === "en" ? "You can only attach an image or a video, not both" : "Solo puedes adjuntar una imagen o un video, no ambos");
      return;
    }
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      alert(lang === "en" ? "Only MP4, WebM, or MOV video formats are allowed" : "Solo se permiten videos en formato MP4, WebM o MOV");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      alert(lang === "en" ? "Video must not exceed 60MB" : "El video no debe exceder 60MB");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const clearImage = () => { setImageFile(null); setImagePreview(null); };
  const clearVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null); setVideoPreview(null);
  };

  const handleSubmit = async () => {
    if (!contenido.trim() && !imageFile && !videoFile) return;
    setLoading(true);
    try {
      let imagenUrl = null;
      let videoUrl = null;
      let tipoMedia = "none";

      if (imageFile) {
        setUploadProgress(lang === "en" ? "Uploading image..." : "Subiendo imagen...");
        imagenUrl = await uploadMedia(imageFile, "social");
        tipoMedia = "imagen";
      } else if (videoFile) {
        setUploadProgress(lang === "en" ? "Uploading video..." : "Subiendo video...");
        videoUrl = await uploadMedia(videoFile, "social/videos");
        tipoMedia = "video";
      }

      setUploadProgress(lang === "en" ? "Publishing..." : "Publicando...");
      const { data, error } = await supabase.from("publicaciones").insert({
        autor_id: session.user.id,
        contenido: contenido.trim(),
        imagen_url: imagenUrl,
        video_url: videoUrl,
        tipo_media: tipoMedia,
        es_promocion: esPromocion,
        es_publicidad: esPublicidad,
        negocio_id: (esPromocion || esPublicidad) && negocioId ? negocioId : null,
      }).select("*, perfiles(id, nombre_completo, avatar_url, rol)").single();

      if (error) throw error;
      onPostCreated(data);
      onClose();
    } catch (err) {
      console.error("Error creating post:", err);
      alert(lang === "en" ? "Failed to create post" : "Error al crear publicación");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{ ...modalStyles.modal, maxWidth: "560px" }} onClick={(e) => e.stopPropagation()} className="animate-fade-in-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
            {lang === "en" ? "Create Post" : "Crear Publicación"}
          </h3>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>

        {/* Author info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={avatarStyle(perfil?.avatar_url, 40)}>
            {!perfil?.avatar_url && (perfil?.nombre_completo?.[0]?.toUpperCase() || "U")}
          </div>
          <div>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--atlan-text-primary)" }}>{perfil?.nombre_completo || "Usuario"}</span>
            <span style={{ display: "block", fontSize: "11px", color: "var(--atlan-text-muted)" }}>
              {perfil?.rol === "dueno" ? "🏢 Propietario" : perfil?.rol === "admin" ? "⚡ Administrador" : "🧳 Turista"}
            </span>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value.slice(0, 2000))}
          placeholder={lang === "en" ? "What's on your mind?" : "¿Qué estás pensando?"}
          style={postFormStyles.textarea}
          rows={4}
          autoFocus
        />
        <div style={{ textAlign: "right", fontSize: "11px", color: contenido.length > 1800 ? "#ef4444" : "var(--atlan-text-muted)", marginBottom: "12px" }}>
          {contenido.length}/2000
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div style={{ position: "relative", marginBottom: "16px", borderRadius: "16px", overflow: "hidden" }}>
            <img src={imagePreview} alt="Preview" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "16px" }} />
            <button onClick={clearImage} style={postFormStyles.removeImgBtn}>✕</button>
          </div>
        )}

        {/* Video preview */}
        {videoPreview && (
          <div style={{ position: "relative", marginBottom: "16px", borderRadius: "16px", overflow: "hidden", background: "#000" }}>
            <video
              src={videoPreview}
              controls
              playsInline
              preload="metadata"
              style={{ width: "100%", maxHeight: "300px", borderRadius: "16px", display: "block" }}
            />
            <button onClick={clearVideo} style={postFormStyles.removeImgBtn}>✕</button>
            <div style={{
              position: "absolute", bottom: "12px", left: "12px",
              background: "rgba(0,0,0,0.7)", padding: "4px 10px", borderRadius: "8px",
              fontSize: "11px", fontWeight: "800", color: "#10b981"
            }}>
              🎬 {(videoFile.size / (1024 * 1024)).toFixed(1)}MB
            </div>
          </div>
        )}

        {/* Post Type Selector (for Owner or Admin) */}
        {(perfil?.rol === "dueno" || perfil?.rol === "admin") && (
          <div style={postFormStyles.promoSection}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--atlan-gold)", textTransform: "uppercase", display: "block", marginBottom: "8px", letterSpacing: "0.5px" }}>
              📢 {lang === "en" ? "Publication type" : "Tipo de publicación"}
            </span>
            <div style={{ display: "flex", gap: "16px", marginBottom: "8px", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "var(--atlan-text-secondary)" }}>
                <input 
                  type="radio" 
                  name="postType" 
                  checked={!esPromocion && !esPublicidad} 
                  onChange={() => { setEsPromocion(false); setEsPublicidad(false); }} 
                  style={{ accentColor: "var(--atlan-gold)" }} 
                />
                {lang === "en" ? "Standard" : "Normal"}
              </label>

              {perfil?.rol === "dueno" && (
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "var(--atlan-gold)", fontWeight: "600" }}>
                  <input 
                    type="radio" 
                    name="postType" 
                    checked={esPromocion} 
                    onChange={() => { setEsPromocion(true); setEsPublicidad(false); }} 
                    style={{ accentColor: "var(--atlan-gold)" }} 
                  />
                  📢 {lang === "en" ? "Promotion" : "Promoción"}
                </label>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "#fbbf24", fontWeight: "700" }}>
                <input 
                  type="radio" 
                  name="postType" 
                  checked={esPublicidad} 
                  onChange={() => { setEsPromocion(false); setEsPublicidad(true); }} 
                  style={{ accentColor: "#fbbf24" }} 
                />
                ✨ {lang === "en" ? "Sponsored Ad" : "Publicidad"}
              </label>
            </div>

            {(esPromocion || esPublicidad) && perfil?.rol === "dueno" && negocios.length > 0 && (
              <select value={negocioId} onChange={(e) => setNegocioId(e.target.value)} style={postFormStyles.select}>
                <option value="">{lang === "en" ? "Link to business (optional)" : "Vincular a negocio (opcional)"}</option>
                {negocios.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            <input type="file" ref={videoInputRef} accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoChange} style={{ display: "none" }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!!videoFile}
              style={{ ...postFormStyles.attachBtn, opacity: videoFile ? 0.4 : 1 }}
            >
              📷 {lang === "en" ? "Photo" : "Foto"}
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={!!imageFile}
              style={{ ...postFormStyles.attachBtn, opacity: imageFile ? 0.4 : 1, background: videoFile ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", color: videoFile ? "#10b981" : "var(--atlan-text-secondary)", borderColor: videoFile ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)" }}
            >
              🎬 {lang === "en" ? "Video" : "Video"}
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || (!contenido.trim() && !imageFile && !videoFile)}
            style={{
              ...postFormStyles.publishBtn,
              opacity: loading || (!contenido.trim() && !imageFile && !videoFile) ? 0.5 : 1,
            }}
          >
            {loading ? (uploadProgress || (lang === "en" ? "Publishing..." : "Publicando...")) : (lang === "en" ? "Publish" : "Publicar")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── POST CARD ─────────────────────────────────────────────────────────────
function PostCard({ post, session, perfil, lang, onDelete, onRequireLogin }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comentarios_count || 0);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const autor = post.perfiles || {};
  const isOwner = session?.user?.id === post.autor_id;
  const isAdmin = perfil?.rol === "admin";

  // Check if user liked this post
  useEffect(() => {
    if (!session) return;
    supabase.from("likes_social")
      .select("id")
      .eq("publicacion_id", post.id)
      .eq("usuario_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setLiked(true); });
  }, [session, post.id]);

  const handleLike = async () => {
    if (!session) { onRequireLogin(); return; }
    try {
      if (liked) {
        await supabase.from("likes_social").delete().eq("publicacion_id", post.id).eq("usuario_id", session.user.id);
        setLiked(false);
        setLikesCount((c) => Math.max(c - 1, 0));
      } else {
        await supabase.from("likes_social").insert({ publicacion_id: post.id, usuario_id: session.user.id });
        setLiked(true);
        setLikesCount((c) => c + 1);
      }
    } catch (err) { console.error("Like error:", err); }
  };

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      const { data } = await supabase.from("comentarios_social")
        .select("*, perfiles(id, nombre_completo, avatar_url, rol)")
        .eq("publicacion_id", post.id)
        .order("created_at", { ascending: true });
      setComments(data || []);
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async () => {
    if (!session) { onRequireLogin(); return; }
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const { data, error } = await supabase.from("comentarios_social")
        .insert({ publicacion_id: post.id, autor_id: session.user.id, contenido: newComment.trim() })
        .select("*, perfiles(id, nombre_completo, avatar_url, rol)")
        .single();
      if (error) throw error;
      setComments((c) => [...c, data]);
      setCommentsCount((c) => c + 1);
      setNewComment("");
    } catch (err) { console.error("Comment error:", err); }
    finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm(lang === "en" ? "Delete this comment?" : "¿Eliminar este comentario?")) return;
    try {
      await supabase.from("comentarios_social").delete().eq("id", commentId);
      setComments((c) => c.filter((cm) => cm.id !== commentId));
      setCommentsCount((c) => Math.max(c - 1, 0));
    } catch (err) { console.error("Delete comment error:", err); }
  };

  const handleDeletePost = () => {
    if (!confirm(lang === "en" ? "Are you sure you want to delete this post?" : "¿Estás seguro de que deseas eliminar esta publicación?")) return;
    onDelete(post.id);
    setShowMenu(false);
  };

  return (
    <div style={post.es_publicidad ? cardStyles.publicidadCard : cardStyles.card}>
      {/* Badges */}
      {post.es_publicidad && (
        <div style={cardStyles.publicidadBadge}>
          ✨ {lang === "en" ? "Sponsored Ad" : "Publicidad"}
        </div>
      )}
      {post.es_promocion && !post.es_publicidad && (
        <div style={cardStyles.promoBadge}>
          📢 {lang === "en" ? "Promo" : "Promoción"}
        </div>
      )}

      {/* Header */}
      <div style={cardStyles.header}>
        <Link href={`/comunidad/perfil/${post.autor_id}`} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <div style={avatarStyle(autor.avatar_url, 44)}>
            {!autor.avatar_url && (autor.nombre_completo?.[0]?.toUpperCase() || "U")}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--atlan-text-primary)" }}>{autor.nombre_completo || "Usuario"}</span>
              {autor.rol === "dueno" && <span style={cardStyles.roleBadge}>🏢</span>}
              {autor.rol === "admin" && <span style={{ ...cardStyles.roleBadge, background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>⚡</span>}
            </div>
            <span style={{ fontSize: "12px", color: "var(--atlan-text-muted)" }}>{timeAgo(post.created_at, lang)}</span>
          </div>
        </Link>

        {/* Menu */}
        {(isOwner || isAdmin) && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowMenu(!showMenu)} style={cardStyles.menuBtn}>⋯</button>
            {showMenu && (
              <div style={cardStyles.menuDropdown}>
                <button onClick={handleDeletePost} style={cardStyles.menuItem}>
                  🗑️ {lang === "en" ? "Delete" : "Eliminar"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p style={cardStyles.content}>{post.contenido}</p>

      {/* Image */}
      {post.imagen_url && (
        <div style={cardStyles.imageContainer}>
          <img src={post.imagen_url} alt="Post" style={cardStyles.image} loading="lazy" />
        </div>
      )}

      {/* Video */}
      {post.video_url && (
        <div style={{ ...cardStyles.imageContainer, background: "#000", position: "relative" }}>
          <video
            src={post.video_url}
            controls
            playsInline
            preload="metadata"
            style={{ width: "100%", maxHeight: "480px", display: "block" }}
          />
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: "6px",
            fontSize: "10px", fontWeight: "800", color: "#10b981"
          }}>
            🎬 Video
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div style={cardStyles.statsBar}>
        {likesCount > 0 && <span style={cardStyles.statText}>❤️ {likesCount}</span>}
        {commentsCount > 0 && (
          <button onClick={handleToggleComments} style={{ ...cardStyles.statText, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            💬 {commentsCount} {commentsCount === 1 ? (lang === "en" ? "comment" : "comentario") : (lang === "en" ? "comments" : "comentarios")}
          </button>
        )}
      </div>

      {/* Action bar */}
      <div style={cardStyles.actionBar}>
        <button onClick={handleLike} style={{ ...cardStyles.actionBtn, color: liked ? "#ef4444" : "var(--atlan-text-secondary)" }}>
          <span style={{ fontSize: "16px", transition: "transform 0.2s", transform: liked ? "scale(1.2)" : "scale(1)" }}>{liked ? "❤️" : "🤍"}</span>
          {lang === "en" ? (liked ? "Liked" : "Like") : (liked ? "Te gusta" : "Me gusta")}
        </button>
        <button onClick={handleToggleComments} style={cardStyles.actionBtn}>
          💬 {lang === "en" ? "Comment" : "Comentar"}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={cardStyles.commentsSection}>
          {loadingComments ? (
            <p style={{ textAlign: "center", color: "var(--atlan-text-muted)", fontSize: "13px", padding: "12px" }}>...</p>
          ) : (
            <>
              {comments.map((comment) => {
                const cAutor = comment.perfiles || {};
                const canDeleteComment = session?.user?.id === comment.autor_id || isOwner || isAdmin;
                return (
                  <div key={comment.id} style={cardStyles.commentItem}>
                    <Link href={`/comunidad/perfil/${comment.autor_id}`} style={{ textDecoration: "none" }}>
                      <div style={avatarStyle(cAutor.avatar_url, 32)}>
                        {!cAutor.avatar_url && (cAutor.nombre_completo?.[0]?.toUpperCase() || "U")}
                      </div>
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={cardStyles.commentBubble}>
                        <span style={{ fontWeight: "700", fontSize: "12px", color: "var(--atlan-text-primary)" }}>
                          {cAutor.nombre_completo || "Usuario"}
                        </span>
                        <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--atlan-text-secondary)", lineHeight: "1.4", wordBreak: "break-word" }}>
                          {comment.contenido}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                        <span style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>{timeAgo(comment.created_at, lang)}</span>
                        {canDeleteComment && (
                          <button onClick={() => handleDeleteComment(comment.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer", fontWeight: "700", padding: 0 }}>
                            {lang === "en" ? "Delete" : "Eliminar"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* New comment input */}
              {session ? (
                <div style={cardStyles.commentInput}>
                  <div style={avatarStyle(perfil?.avatar_url, 32)}>
                    {!perfil?.avatar_url && (perfil?.nombre_completo?.[0]?.toUpperCase() || "U")}
                  </div>
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                    placeholder={lang === "en" ? "Write a comment..." : "Escribe un comentario..."}
                    style={cardStyles.commentTextField}
                    disabled={submittingComment}
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submittingComment}
                    style={{ ...cardStyles.sendBtn, opacity: !newComment.trim() ? 0.4 : 1 }}
                  >
                    ➤
                  </button>
                </div>
              ) : (
                <button onClick={onRequireLogin} style={{ ...cardStyles.actionBtn, width: "100%", justifyContent: "center", marginTop: "8px", color: "var(--atlan-gold)" }}>
                  🔐 {lang === "en" ? "Sign in to comment" : "Inicia sesión para comentar"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── USER SUGGESTION CARD ──────────────────────────────────────────────────
function UserSuggestionCard({ user, session, lang, onRequireLogin }) {
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
            {user.rol === "dueno" ? "🏢 Propietario" : "🧳 Turista"}
          </div>
        </div>
      </Link>
      <button
        onClick={handleFollow}
        disabled={loading}
        style={{
          ...sidebarStyles.followBtn,
          background: isFollowing ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: isFollowing ? "var(--atlan-text-secondary)" : "white",
        }}
      >
        {isFollowing ? (lang === "en" ? "Following" : "Siguiendo") : (lang === "en" ? "Follow" : "Seguir")}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function ComunidadPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const PAGE_SIZE = 10;

  // Fetch session + profile
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (s?.user) {
          const { data: p } = await supabase.from("perfiles").select("*").eq("id", s.user.id).single();
          setPerfil(p);
        }
      } catch (err) {
        console.warn("Session error:", err);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        supabase.from("perfiles").select("*").eq("id", s.user.id).single().then(({ data }) => setPerfil(data));
      } else { setPerfil(null); }
    });
    return () => subscription?.unsubscribe();
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum = 0, append = false) => {
    if (pageNum === 0) setLoadingPosts(true);
    else setLoadingMore(true);
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("publicaciones")
        .select("*, perfiles(id, nombre_completo, avatar_url, rol)")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (append) { setPosts((prev) => [...prev, ...(data || [])]); }
      else { setPosts(data || []); }
      setHasMore((data || []).length === PAGE_SIZE);
    } catch (err) { console.error("Fetch posts error:", err); }
    finally { setLoadingPosts(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

  // Fetch suggested users
  useEffect(() => {
    supabase.from("perfiles").select("id, nombre_completo, avatar_url, rol, seguidores_count")
      .order("seguidores_count", { ascending: false })
      .limit(5)
      .then(({ data }) => setSuggestedUsers(data || []));
  }, []);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, true);
      }
    }, { threshold: 0.1 });

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);
    return () => { if (currentLoader) observer.unobserve(currentLoader); };
  }, [hasMore, loadingMore, page, fetchPosts]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPerfil(null);
    window.location.reload();
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleDeletePost = async (postId) => {
    try {
      await supabase.from("publicaciones").delete().eq("id", postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) { console.error("Delete post error:", err); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--atlan-bg-primary)", fontFamily: "var(--font-outfit), system-ui, sans-serif" }}>
      <ComunidadNavbar session={session} perfil={perfil} onLogout={handleLogout} />

      {/* Main Content */}
      <div style={pageStyles.container}>

        {/* ── SIDEBAR LEFT (Desktop) ── */}
        <aside style={pageStyles.sidebarLeft} className="hide-mobile">
          {session && perfil ? (
            <div style={sidebarStyles.profileCard}>
              <div style={sidebarStyles.profileBanner} />
              <div style={{ padding: "0 20px 20px", marginTop: "-32px", textAlign: "center" }}>
                <Link href={`/comunidad/perfil/${session.user.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ ...avatarStyle(perfil.avatar_url, 64), margin: "0 auto 8px", border: "3px solid var(--atlan-bg-primary)" }}>
                    {!perfil.avatar_url && (perfil.nombre_completo?.[0]?.toUpperCase() || "U")}
                  </div>
                </Link>
                <h4 style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{perfil.nombre_completo}</h4>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--atlan-text-muted)" }}>
                  {perfil.rol === "dueno" ? "🏢 Propietario" : "🧳 Turista"}
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{perfil.seguidores_count || 0}</div>
                    <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Followers" : "Seguidores"}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{perfil.siguiendo_count || 0}</div>
                    <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Following" : "Siguiendo"}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={sidebarStyles.loginCard}>
              <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>👥</span>
              <h4 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
                {lang === "en" ? "Join the Community" : "Únete a la Comunidad"}
              </h4>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--atlan-text-secondary)", lineHeight: "1.5" }}>
                {lang === "en" ? "Sign up to create posts, comment, and connect with others." : "Regístrate para publicar, comentar y conectar con otros."}
              </p>
              <Link href="/registro" className="btn-primary" style={{ display: "block", textAlign: "center", padding: "10px", fontSize: "13px" }}>
                {lang === "en" ? "Create Account" : "Crear Cuenta"}
              </Link>
            </div>
          )}
        </aside>

        {/* ── FEED CENTRAL ── */}
        <main style={pageStyles.feed}>
          {/* Create Post Bar */}
          {session && (
            <div style={pageStyles.createPostBar} onClick={() => setShowCreateModal(true)}>
              <div style={avatarStyle(perfil?.avatar_url, 40)}>
                {!perfil?.avatar_url && (perfil?.nombre_completo?.[0]?.toUpperCase() || "U")}
              </div>
              <div style={pageStyles.createPostInput}>
                {lang === "en" ? "What's on your mind?" : "¿Qué estás pensando?"}
              </div>
              <button style={pageStyles.createPostBtn}>
                📝
              </button>
            </div>
          )}

          {/* Posts */}
          {loadingPosts ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ fontSize: "14px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Loading posts..." : "Cargando publicaciones..."}</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={pageStyles.emptyState}>
              <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>📝</span>
              <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
                {lang === "en" ? "No posts yet" : "No hay publicaciones todavía"}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--atlan-text-secondary)" }}>
                {lang === "en" ? "Be the first to share something with the community!" : "¡Sé el primero en compartir algo con la comunidad!"}
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  session={session}
                  perfil={perfil}
                  lang={lang}
                  onDelete={handleDeletePost}
                  onRequireLogin={() => setShowLoginModal(true)}
                />
              ))}
              <div ref={loaderRef} style={{ padding: "20px", textAlign: "center" }}>
                {loadingMore && (
                  <div style={{ width: "28px", height: "28px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                )}
              </div>
            </>
          )}
        </main>

        {/* ── SIDEBAR RIGHT (Desktop) ── */}
        <aside style={pageStyles.sidebarRight} className="hide-mobile">
          <div style={sidebarStyles.sectionCard}>
            <h4 style={sidebarStyles.sectionTitle}>
              ✨ {lang === "en" ? "Suggested People" : "Personas sugeridas"}
            </h4>
            {suggestedUsers.map((u) => (
              <UserSuggestionCard key={u.id} user={u} session={session} lang={lang} onRequireLogin={() => setShowLoginModal(true)} />
            ))}
          </div>

          <div style={{ ...sidebarStyles.sectionCard, marginTop: "16px" }}>
            <h4 style={sidebarStyles.sectionTitle}>
              🗺️ {lang === "en" ? "Explore" : "Explorar"}
            </h4>
            <Link href="/mapa" style={sidebarStyles.exploreLink}>
              📍 {lang === "en" ? "Tourist Map" : "Mapa Turístico"}
            </Link>
            {session && (perfil?.rol === "dueno" || perfil?.rol === "admin") && (
              <Link href="/dashboard" style={sidebarStyles.exploreLink}>
                💼 {lang === "en" ? "My Business" : "Mi Negocio"}
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* FAB: Create Post (Mobile) */}
      {session && (
        <button onClick={() => setShowCreateModal(true)} style={pageStyles.fab} className="hide-desktop">
          ✏️
        </button>
      )}

      {/* Modals */}
      {showCreateModal && session && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          session={session}
          perfil={perfil}
          lang={lang}
          onPostCreated={handlePostCreated}
        />
      )}
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} lang={lang} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Avatar style
// ═══════════════════════════════════════════════════════════════════════════
function avatarStyle(url, size) {
  return {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: `${Math.floor(size * 0.42)}px`,
    fontWeight: "800",
    color: "#0a0f1c",
    background: url ? `url(${url}) center/cover` : "linear-gradient(135deg, #D4AF37 0%, #E8CC6A 100%)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const navStyles = {
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(10, 15, 28, 0.85)",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  navInner: {
    maxWidth: "1200px", margin: "0 auto", padding: "0 24px",
    height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" },
  logoText: {
    fontSize: "22px", fontWeight: "800", fontFamily: "var(--font-outfit), system-ui, sans-serif",
    background: "linear-gradient(135deg, #D4AF37, #E8CC6A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.02em",
  },
  navCenter: { display: "flex", alignItems: "center", gap: "20px" },
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  navLink: { color: "var(--atlan-text-secondary)", fontSize: "13px", fontWeight: "600", textDecoration: "none", transition: "color 0.2s" },
  logoutBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "6px 10px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" },
  hamburger: { background: "none", border: "none", color: "var(--atlan-text-primary)", cursor: "pointer", padding: "8px" },
  mobileMenu: { padding: "12px 24px 20px", display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" },
  mobileLink: { color: "var(--atlan-text-secondary)", fontSize: "15px", fontWeight: "600", textDecoration: "none", padding: "10px 0" },
  mobileLogoutBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "10px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", width: "100%", textAlign: "left" },
};

const pageStyles = {
  container: {
    maxWidth: "1100px", margin: "0 auto", padding: "20px 16px",
    display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: "20px",
  },
  sidebarLeft: { position: "sticky", top: "80px", alignSelf: "start" },
  feed: { minWidth: 0 },
  sidebarRight: { position: "sticky", top: "80px", alignSelf: "start" },
  createPostBar: {
    display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px", cursor: "pointer", transition: "all 0.2s", marginBottom: "16px",
  },
  createPostInput: {
    flex: 1, fontSize: "14px", color: "var(--atlan-text-muted)", fontWeight: "500",
    padding: "10px 16px", background: "rgba(255,255,255,0.04)", borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  createPostBtn: {
    background: "linear-gradient(135deg, #D4AF37 0%, #b89324 100%)", border: "none",
    width: "40px", height: "40px", borderRadius: "12px", fontSize: "16px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(212,175,55,0.2)",
  },
  emptyState: {
    textAlign: "center", padding: "80px 24px",
    background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)",
    borderRadius: "20px",
  },
  fab: {
    position: "fixed", bottom: "24px", right: "24px", width: "56px", height: "56px",
    borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37 0%, #b89324 100%)",
    border: "none", fontSize: "22px", cursor: "pointer", zIndex: 90,
    boxShadow: "0 6px 20px rgba(212,175,55,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};

const cardStyles = {
  card: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px", padding: "20px", marginBottom: "16px",
    transition: "border-color 0.2s",
  },
  publicidadCard: {
    background: "radial-gradient(circle at top right, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.03) 70%)",
    border: "1px solid rgba(212, 175, 55, 0.4)",
    boxShadow: "0 4px 25px rgba(212, 175, 55, 0.12)",
    borderRadius: "16px", padding: "20px", marginBottom: "16px",
    transition: "border-color 0.2s",
  },
  promoBadge: {
    display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px",
    padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "800",
    background: "linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(245,158,11,0.15) 100%)",
    border: "1px solid rgba(212,175,55,0.25)", color: "#D4AF37",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  publicidadBadge: {
    display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px",
    padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "900",
    background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
    border: "1px solid rgba(255,255,255,0.25)", color: "#0a0f1c",
    textTransform: "uppercase", letterSpacing: "0.8px",
    boxShadow: "0 2px 8px rgba(212, 175, 55, 0.3)",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px",
  },
  roleBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "20px", height: "20px", borderRadius: "6px", fontSize: "10px",
    background: "rgba(212,175,55,0.15)", color: "var(--atlan-gold)",
  },
  content: {
    margin: "0 0 14px", fontSize: "14.5px", lineHeight: "1.6",
    color: "var(--atlan-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word",
  },
  imageContainer: {
    borderRadius: "14px", overflow: "hidden", marginBottom: "14px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  image: { width: "100%", maxHeight: "420px", objectFit: "cover", display: "block" },
  statsBar: {
    display: "flex", justifyContent: "space-between", padding: "8px 4px",
    borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "4px",
  },
  statText: { fontSize: "12px", color: "var(--atlan-text-muted)", fontWeight: "600" },
  actionBar: {
    display: "flex", gap: "4px", padding: "4px 0",
  },
  actionBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    padding: "8px 0", background: "none", border: "none",
    color: "var(--atlan-text-secondary)", fontSize: "13px", fontWeight: "700",
    cursor: "pointer", borderRadius: "10px", transition: "all 0.2s",
  },
  menuBtn: {
    background: "none", border: "none", color: "var(--atlan-text-muted)", fontSize: "20px",
    cursor: "pointer", padding: "4px 8px", borderRadius: "8px", lineHeight: 1,
  },
  menuDropdown: {
    position: "absolute", top: "100%", right: 0, zIndex: 50,
    background: "var(--atlan-bg-elevated)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", padding: "4px", minWidth: "140px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  menuItem: {
    display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px",
    background: "none", border: "none", color: "#ef4444", fontSize: "13px", fontWeight: "700",
    cursor: "pointer", borderRadius: "8px", transition: "background 0.15s",
  },
  commentsSection: {
    borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "14px", marginTop: "4px",
  },
  commentItem: {
    display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start",
  },
  commentBubble: {
    background: "rgba(255,255,255,0.04)", padding: "8px 14px", borderRadius: "0 14px 14px 14px",
  },
  commentInput: {
    display: "flex", alignItems: "center", gap: "10px", marginTop: "12px",
  },
  commentTextField: {
    flex: 1, padding: "10px 16px", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px",
    color: "white", fontSize: "13px", outline: "none",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none",
    width: "36px", height: "36px", borderRadius: "50%", color: "white", fontSize: "14px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(16,185,129,0.25)",
  },
};

const sidebarStyles = {
  profileCard: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px", overflow: "hidden",
  },
  profileBanner: {
    height: "60px", background: "linear-gradient(135deg, #1a3a6e 0%, #0e2242 100%)",
  },
  loginCard: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px", padding: "24px", textAlign: "center",
  },
  sectionCard: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px", padding: "16px",
  },
  sectionTitle: {
    margin: "0 0 14px", fontSize: "15px", fontWeight: "800",
    color: "var(--atlan-text-primary)",
  },
  userCard: {
    display: "flex", alignItems: "center", gap: "10px", padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
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

const modalStyles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
  },
  modal: {
    width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto",
    background: "var(--atlan-bg-card)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px", padding: "28px", position: "relative",
    boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
  },
  closeBtn: {
    position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.06)",
    border: "none", color: "var(--atlan-text-muted)", width: "32px", height: "32px",
    borderRadius: "50%", fontSize: "14px", cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
};

const postFormStyles = {
  textarea: {
    width: "100%", padding: "14px", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px",
    color: "var(--atlan-text-primary)", fontSize: "15px", lineHeight: "1.5",
    outline: "none", resize: "vertical", minHeight: "100px",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
  },
  removeImgBtn: {
    position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)",
    border: "none", color: "white", width: "28px", height: "28px", borderRadius: "50%",
    fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },
  promoSection: {
    padding: "12px 16px", background: "rgba(212,175,55,0.06)",
    border: "1px solid rgba(212,175,55,0.15)", borderRadius: "12px",
    display: "flex", flexDirection: "column", gap: "10px",
  },
  select: {
    width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
    color: "var(--atlan-text-primary)", fontSize: "13px", outline: "none",
  },
  attachBtn: {
    padding: "8px 14px", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
    color: "var(--atlan-text-secondary)", fontSize: "13px", fontWeight: "700",
    cursor: "pointer", transition: "all 0.2s",
  },
  publishBtn: {
    padding: "10px 28px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none", borderRadius: "12px", color: "white", fontSize: "14px",
    fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
    transition: "all 0.2s",
  },
};
