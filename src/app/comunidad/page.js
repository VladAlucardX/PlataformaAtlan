"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { uploadMedia } from "@/lib/storage";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import ShareDropdown from "@/components/ui/ShareDropdown";
import ImageViewerModal from "@/components/ui/ImageViewerModal";
import ChatWidget from "@/components/ui/ChatWidget";
import FollowersModal from "@/components/ui/FollowersModal";
import Navbar from "@/components/ui/Navbar";
import { getProfileSlug } from "@/lib/profileUtils";
import Icon from "@/components/ui/Icon";

// Comunidad Atlan

// Tiempo relativo
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

// ── MODAL: LOGIN REQUERIDO ────────────────────────────────────────────────
function LoginRequiredModal({ onClose, lang }) {
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()} className="animate-fade-in-up">
        <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}><Icon name="lock" size={48} /></span>
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
              {perfil?.rol === "dueno"
                ? <><Icon name="building" size={12} /> Propietario</>
                : perfil?.rol === "admin"
                ? <><Icon name="zap" size={12} /> Administrador</>
                : (perfil?.es_premium || perfil?.suscripcion_activa || perfil?.rol === "turista_deacachimba")
                ? <><Icon name="star" size={12} /> Turista Deacachimba</>
                : <><Icon name="luggage" size={12} /> Turista Tuani</>}
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
              background: "rgba(0, 0, 0, 0.40)", padding: "4px 10px", borderRadius: "8px",
              fontSize: "11px", fontWeight: "800", color: "#17AA4A"
            }}>
              🎬 {(videoFile.size / (1024 * 1024)).toFixed(1)}MB
            </div>
          </div>
        )}

        {/* Post Type Selector (for Owner or Admin) */}
        {(perfil?.rol === "dueno" || perfil?.rol === "admin") && (
          <div style={postFormStyles.promoSection}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--atlan-gold)", textTransform: "uppercase", display: "block", marginBottom: "8px", letterSpacing: "0.5px" }}>
              <Icon name="megaphone" size={14} /> {lang === "en" ? "Publication type" : "Tipo de publicación"}
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
                  <Icon name="megaphone" size={12} /> {lang === "en" ? "Promotion" : "Promoción"}
                </label>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "#E6C200", fontWeight: "700" }}>
                <input 
                  type="radio" 
                  name="postType" 
                  checked={esPublicidad} 
                  onChange={() => { setEsPromocion(false); setEsPublicidad(true); }} 
                  style={{ accentColor: "#E6C200" }} 
                />
                <Icon name="sparkles" size={12} /> {lang === "en" ? "Sponsored Ad" : "Publicidad"}
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
              style={{ ...postFormStyles.attachBtn, opacity: imageFile ? 0.4 : 1, background: videoFile ? "rgba(23, 170, 74,0.15)" : "rgba(20, 109, 158, 0.04)", color: videoFile ? "#17AA4A" : "var(--atlan-text-secondary)", borderColor: videoFile ? "rgba(23, 170, 74,0.3)" : "rgba(20, 109, 158, 0.10)" }}
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
function PostCard({ post, session, perfil, lang, onDelete, onRequireLogin, onImageClick, onRepost }) {
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
          <Icon name="sparkles" size={12} /> {lang === "en" ? "Sponsored Ad" : "Publicidad"}
        </div>
      )}
      {post.es_promocion && !post.es_publicidad && (
        <div style={cardStyles.promoBadge}>
          <Icon name="megaphone" size={12} /> {lang === "en" ? "Promo" : "Promoción"}
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
              {autor.rol === "dueno" && <span style={cardStyles.roleBadge}><Icon name="building" size={12} /></span>}
              {autor.rol === "admin" && <span style={{ ...cardStyles.roleBadge, background: "rgba(239,68,68,0.15)", color: "#ef4444" }}><Icon name="zap" size={12} /></span>}
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
                  <Icon name="trash" size={12} /> {lang === "en" ? "Delete" : "Eliminar"}
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
        <div style={{ ...cardStyles.imageContainer, cursor: "pointer" }} onClick={() => onImageClick && onImageClick(post)}>
          <img src={post.imagen_url} alt="Post" style={cardStyles.image} loading="lazy" />
        </div>
      )}

      {/* Video */}
      {post.video_url && (
        <div style={{ ...cardStyles.imageContainer, background: "#000", position: "relative", cursor: "pointer" }} onClick={() => onImageClick && onImageClick(post)}>
          <video
            src={post.video_url}
            controls
            playsInline
            preload="metadata"
            style={{ width: "100%", maxHeight: "480px", display: "block" }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: "6px",
            fontSize: "10px", fontWeight: "800", color: "#17AA4A"
          }}>
            🎬 Video
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div style={cardStyles.statsBar}>
        {likesCount > 0 && <span style={cardStyles.statText}><Icon name="heartFilled" size={12} color="#ef4444" /> {likesCount}</span>}
        {commentsCount > 0 && (
          <button onClick={handleToggleComments} style={{ ...cardStyles.statText, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Icon name="messageCircle" size={12} /> {commentsCount} {commentsCount === 1 ? (lang === "en" ? "comment" : "comentario") : (lang === "en" ? "comments" : "comentarios")}
          </button>
        )}
      </div>

      {/* Action bar */}
      <div style={cardStyles.actionBar}>
        <button onClick={handleLike} style={{ ...cardStyles.actionBtn, color: liked ? "#ef4444" : "var(--atlan-text-secondary)" }}>
          <span style={{ fontSize: "16px", transition: "transform 0.2s", transform: liked ? "scale(1.2)" : "scale(1)" }}>{liked ? <Icon name="heartFilled" size={16} color="#ef4444" /> : <Icon name="heart" size={16} />}</span>
          {lang === "en" ? (liked ? "Liked" : "Like") : (liked ? "Te gusta" : "Me gusta")}
        </button>
        <button onClick={handleToggleComments} style={cardStyles.actionBtn}>
          <Icon name="messageCircle" size={14} /> {lang === "en" ? "Comment" : "Comentar"}
        </button>
        <ShareDropdown post={post} session={session} perfil={perfil} lang={lang} onRequireLogin={onRequireLogin} onRepost={onRepost} />
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
                  <Icon name="lock" size={14} /> {lang === "en" ? "Sign in to comment" : "Inicia sesión para comentar"}
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

// Componente Principal
export default function ComunidadPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  // Sesión centralizada desde AuthContext
  const { session, perfil, logout } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewerPost, setViewerPost] = useState(null); // Image viewer modal
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState("followers");
  const loaderRef = useRef(null);

  const PAGE_SIZE = 10;

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

  // Fetch suggested users (inteligente: excluye a mi mismo y a los que ya sigo)
  const fetchSuggestedUsers = useCallback(async () => {
    try {
      let query = supabase.from("perfiles").select("id, nombre_completo, avatar_url, rol, seguidores_count");
      
      if (session?.user) {
        query = query.neq("id", session.user.id);
        
        // Consultar a quienes sigo
        const { data: following } = await supabase
          .from("seguimientos")
          .select("seguido_id")
          .eq("seguidor_id", session.user.id);
        
        const followingIds = (following || []).map((f) => f.seguido_id);
        if (followingIds.length > 0) {
          query = query.not("id", "in", `(${followingIds.join(",")})`);
        }
      }
      
      const { data } = await query.limit(20);
      
      if (data && data.length > 0) {
        // Algoritmo aleatorio dinámico (Random shuffle de 6 usuarios)
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setSuggestedUsers(shuffled.slice(0, 6));
      } else {
        setSuggestedUsers([]);
      }
    } catch (err) {
      console.error("Error fetching suggested users:", err);
    }
  }, [session]);

  useEffect(() => {
    fetchSuggestedUsers();
  }, [fetchSuggestedUsers]);

  // Buscador con debounce (400ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        let query = supabase
          .from("perfiles")
          .select("id, nombre_completo, avatar_url, rol, seguidores_count")
          .ilike("nombre_completo", `%${searchQuery.trim()}%`);

        if (session?.user) {
          query = query.neq("id", session.user.id);
        }

        const { data } = await query.limit(10);
        setSearchResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, session]);

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
    await logout();
    window.location.reload();
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleRepost = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleDeletePost = async (postId) => {
    try {
      await supabase.from("publicaciones").delete().eq("id", postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) { console.error("Delete post error:", err); }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--atlan-bg-primary)",
      fontFamily: "var(--font-outfit), system-ui, sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Fondos decorativos SVG */}
      <img
        src="/images/tortuga.svg"
        alt=""
        style={{
          position: "fixed",
          bottom: "-10px",
          left: "-10px",
          width: "360px",
          maxHeight: "360px",
          objectFit: "contain",
          opacity: 0.18,
          pointerEvents: "none",
          zIndex: 0
        }}
      />
      <img
        src="/images/machoraton.svg"
        alt=""
        style={{
          position: "fixed",
          top: "80px",
          right: "10px",
          width: "340px",
          height: "calc(100vh - 90px)",
          objectFit: "contain",
          opacity: 0.16,
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      <Navbar activePage="comunidad" session={session} perfil={perfil} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="community-main-layout" style={{ ...pageStyles.container, position: "relative", zIndex: 1 }}>

        {/* ── SIDEBAR LEFT (Desktop) ── */}
        <aside style={pageStyles.sidebarLeft} className="hide-mobile community-sidebar">
          {session && perfil ? (
            <div style={sidebarStyles.profileCard}>
              <div style={sidebarStyles.profileBanner} />
              <div style={{ padding: "0 20px 20px", marginTop: "-32px", textAlign: "center" }}>
                <Link href={`/comunidad/perfil/${getProfileSlug(perfil) || session.user.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ ...avatarStyle(perfil.avatar_url, 64), margin: "0 auto 8px", border: "3px solid var(--atlan-bg-primary)" }}>
                    {!perfil.avatar_url && (perfil.nombre_completo?.[0]?.toUpperCase() || "U")}
                  </div>
                </Link>
                <h4 style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{perfil.nombre_completo}</h4>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--atlan-text-muted)" }}>
                  {perfil.rol === "dueno"
                    ? <><Icon name="building" size={11} /> Propietario</>
                    : (perfil.es_premium || perfil.suscripcion_activa || perfil.rol === "turista_deacachimba")
                    ? <><Icon name="star" size={11} /> Turista Deacachimba</>
                    : <><Icon name="luggage" size={11} /> Turista Tuani</>}
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
                  <button onClick={() => { setFollowersModalTab("followers"); setShowFollowersModal(true); }} style={{ textAlign: "center", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "8px", transition: "background 0.15s" }}>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{perfil.seguidores_count || 0}</div>
                    <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Followers" : "Seguidores"}</div>
                  </button>
                  <button onClick={() => { setFollowersModalTab("following"); setShowFollowersModal(true); }} style={{ textAlign: "center", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "8px", transition: "background 0.15s" }}>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{perfil.siguiendo_count || 0}</div>
                    <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Following" : "Siguiendo"}</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={sidebarStyles.loginCard}>
              <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}><Icon name="users" size={36} /></span>
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

          {/* Sección Explorar debajo del Perfil */}
          <div style={{ ...sidebarStyles.sectionCard, marginTop: "16px" }}>
            <h4 style={sidebarStyles.sectionTitle}>
              <Icon name="map" size={14} /> {lang === "en" ? "Explore" : "Explorar"}
            </h4>
            <Link href="/mapa" style={sidebarStyles.exploreLink}>
              <img src="/images/mapa.svg" alt="Mapa" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> {lang === "en" ? "Tourist Map" : "Mapa Turístico"}
            </Link>
            {session && (perfil?.rol === "dueno" || perfil?.rol === "admin") && (
              <Link href="/dashboard" style={sidebarStyles.exploreLink}>
                <Icon name="briefcase" size={14} /> {lang === "en" ? "My Business" : "Mi Negocio"}
              </Link>
            )}
          </div>
        </aside>

        {/* ── FEED CENTRAL ── */}
        <main style={pageStyles.feed}>
          {/* Mobile Search Bar */}
          <div className="hide-desktop" style={{ marginBottom: "16px", background: "var(--atlan-bg-card)", border: "1px solid rgba(20, 109, 158, 0.08)", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "800", color: "var(--atlan-text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon name="search" size={14} /> {lang === "en" ? "Find Friends" : "Buscar Personas"}
            </h4>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("social.searchPlaceholder")}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(20, 109, 158, 0.04)",
                border: "1px solid rgba(20, 109, 158, 0.10)",
                borderRadius: "12px",
                color: "var(--atlan-text-primary)",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            {searchQuery.trim() && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(20, 109, 158, 0.05)" }}>
                {searching ? (
                  <div style={{ padding: "8px", textAlign: "center" }}>
                    <div style={{ width: "20px", height: "20px", border: "2px solid rgba(20, 109, 158, 0.10)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--atlan-text-muted)", textAlign: "center" }}>
                    {t("social.noResults")}
                  </p>
                ) : (
                  searchResults.map((u) => (
                    <UserSuggestionCard key={u.id} user={u} session={session} lang={lang} onRequireLogin={() => setShowLoginModal(true)} onFollowChange={fetchSuggestedUsers} />
                  ))
                )}
              </div>
            )}
          </div>

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
                <Icon name="edit" size={16} />
              </button>
            </div>
          )}

          {/* Posts */}
          {loadingPosts ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ width: "40px", height: "40px", border: "3px solid rgba(20, 109, 158, 0.12)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ fontSize: "14px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Loading posts..." : "Cargando publicaciones..."}</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={pageStyles.emptyState}>
              <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}><Icon name="edit" size={48} /></span>
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
                  onImageClick={(p) => setViewerPost(p)}
                  onRepost={handleRepost}
                />
              ))}
              <div ref={loaderRef} style={{ padding: "20px", textAlign: "center" }}>
                {loadingMore && (
                  <div style={{ width: "28px", height: "28px", border: "2px solid rgba(20, 109, 158, 0.10)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                )}
              </div>
            </>
          )}
        </main>

        {/* ── SIDEBAR RIGHT (Desktop) ── */}
        <aside style={pageStyles.sidebarRight} className="hide-mobile community-sidebar">
          {/* Buscador */}
          <div style={sidebarStyles.sectionCard}>
            <h4 style={sidebarStyles.sectionTitle}>
              <Icon name="search" size={14} /> {lang === "en" ? "Search" : "Buscar"}
            </h4>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("social.searchPlaceholder")}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(20, 109, 158, 0.04)",
                border: "1px solid rgba(20, 109, 158, 0.10)",
                borderRadius: "12px",
                color: "var(--atlan-text-primary)",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ ...sidebarStyles.sectionCard, marginTop: "16px" }}>
            {searchQuery.trim() ? (
              <>
                <h4 style={sidebarStyles.sectionTitle}>
                  <Icon name="users" size={14} /> {lang === "en" ? "Search Results" : "Resultados"}
                </h4>
                {searching ? (
                  <div style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{ width: "20px", height: "20px", border: "2px solid rgba(20, 109, 158, 0.10)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p style={{ margin: 0, padding: "10px 0", fontSize: "12px", color: "var(--atlan-text-muted)", textAlign: "center" }}>
                    {t("social.noResults")}
                  </p>
                ) : (
                  searchResults.map((u) => (
                    <UserSuggestionCard key={u.id} user={u} session={session} lang={lang} onRequireLogin={() => setShowLoginModal(true)} onFollowChange={fetchSuggestedUsers} />
                  ))
                )}
              </>
            ) : (
              <>
                <h4 style={sidebarStyles.sectionTitle}>
                  <Icon name="sparkles" size={14} /> {lang === "en" ? "Suggested People" : "Personas sugeridas"}
                </h4>
                {suggestedUsers.length === 0 ? (
                  <p style={{ margin: 0, padding: "10px 0", fontSize: "12px", color: "var(--atlan-text-muted)", textAlign: "center" }}>
                    {lang === "en" ? "No suggestions" : "Sin sugerencias"}
                  </p>
                ) : (
                  suggestedUsers.map((u) => (
                    <UserSuggestionCard key={u.id} user={u} session={session} lang={lang} onRequireLogin={() => setShowLoginModal(true)} onFollowChange={fetchSuggestedUsers} />
                  ))
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* FAB: Create Post (Mobile) */}
      {session && (
        <button onClick={() => setShowCreateModal(true)} style={pageStyles.fab} className="hide-desktop">
          <Icon name="edit" size={16} />
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

      {/* Image Viewer Modal */}
      {viewerPost && (
        <ImageViewerModal
          post={viewerPost}
          session={session}
          perfil={perfil}
          lang={lang}
          onClose={() => setViewerPost(null)}
        />
      )}

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

      {/* Floating Chat Widget */}
      {session && <ChatWidget session={session} perfil={perfil} lang={lang} />}
    </div>
  );
}

// Estilo de Avatar
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
    color: "#1A1A2E",
    background: url ? `url(${url}) center/cover` : "linear-gradient(135deg, #FFD700 0%, #FFDF33 100%)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  };
}

// Estilos

const navStyles = {
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(20,109,158,0.10)",
  },
  navInner: {
    width: "100%", padding: "0 32px",
    height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "relative",
  },
  logo: { display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" },
  logoText: {
    fontSize: "24px", fontWeight: "900", fontFamily: "var(--font-outfit), system-ui, sans-serif",
    color: "#FFD700", letterSpacing: "-0.02em",
  },
  navCenter: {
    position: "absolute", left: "50%", transform: "translateX(-50%)",
    display: "flex", alignItems: "center", gap: "10px",
  },
  navRight: { display: "flex", alignItems: "center", gap: "12px" },
  navLink: { color: "var(--atlan-text-secondary)", fontSize: "13px", fontWeight: "600", textDecoration: "none", transition: "color 0.2s" },
  logoutBtn: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "8px 16px", background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444",
    borderRadius: "var(--atlan-radius-full)", fontSize: "13px", fontWeight: "750",
    cursor: "pointer", transition: "all 0.2s ease",
  },
  hamburger: { background: "none", border: "none", color: "var(--atlan-text-primary)", cursor: "pointer", padding: "8px" },
  mobileMenu: { padding: "12px 24px 20px", display: "flex", flexDirection: "column", gap: "10px",    borderTop: "1px solid rgba(20,109,158,0.08)" },
  mobileLink: { color: "var(--atlan-text-secondary)", fontSize: "15px", fontWeight: "600", textDecoration: "none", padding: "10px 0" },
  mobileLogoutBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "10px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", width: "100%", textAlign: "left" },
};

const pageStyles = {
  container: {
    width: "100%",
    maxWidth: "1320px",
    margin: "0 auto",
    padding: "95px 24px 40px 24px",
    position: "relative"
  },
  sidebarLeft: {
    position: "sticky",
    top: "95px",
    width: "100%",
    maxHeight: "calc(100vh - 115px)",
    overflowY: "auto",
    scrollbarWidth: "none",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  feed: {
    minWidth: 0,
    maxWidth: "700px",
    width: "100%",
    margin: "0 auto"
  },
  sidebarRight: {
    position: "sticky",
    top: "95px",
    width: "100%",
    maxHeight: "calc(100vh - 115px)",
    overflowY: "auto",
    scrollbarWidth: "none",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  createPostBar: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px 24px",
    background: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.08), 0 16px 36px -6px rgba(20, 109, 158, 0.10)",
    borderRadius: "24px",
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: "24px"
  },
  createPostInput: {
    flex: 1,
    fontSize: "15px",
    color: "var(--atlan-text-muted)",
    fontWeight: "500",
    padding: "12px 20px",
    background: "#F4F6F9",
    borderRadius: "24px",
    border: "1.5px solid rgba(20, 109, 158, 0.12)"
  },
  createPostBtn: {
    background: "linear-gradient(145deg, #FFE033 0%, #FFD700 60%, #E6C200 100%)",
    border: "2px solid rgba(255, 255, 255, 0.6)",
    width: "42px", height: "42px", borderRadius: "12px", fontSize: "16px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "inset 2px 2px 4px rgba(255, 255, 255, 0.7), inset -3px -3px 6px rgba(180, 140, 0, 0.35), 0 6px 14px rgba(255, 215, 0, 0.35)",
    transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  emptyState: {
    textAlign: "center", padding: "80px 24px",
    background: "#FFFFFF", border: "2px dashed rgba(20,109,158,0.2)",
    borderRadius: "24px", boxShadow: "0 8px 24px -4px rgba(20, 109, 158, 0.06)",
  },
  fab: {
    position: "fixed", bottom: "24px", right: "24px", width: "58px", height: "58px",
    borderRadius: "50%", background: "linear-gradient(145deg, #FFE033 0%, #FFD700 60%, #E6C200 100%)",
    border: "2px solid rgba(255, 255, 255, 0.7)", fontSize: "24px", cursor: "pointer", zIndex: 90,
    boxShadow: "inset 3px 3px 6px rgba(255, 255, 255, 0.8), inset -4px -4px 8px rgba(180, 140, 0, 0.35), 0 12px 24px -4px rgba(255, 215, 0, 0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
};

const cardStyles = {
  card: {
    background: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.08), 0 18px 40px -6px rgba(20, 109, 158, 0.12), 0 4px 12px rgba(0, 0, 0, 0.03)",
    borderRadius: "28px",
    padding: "28px",
    marginBottom: "24px",
    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
  },
  publicidadCard: {
    background: "radial-gradient(circle at top right, rgba(23, 170, 74, 0.08) 0%, #FFFFFF 70%)",
    border: "2px solid #17AA4A",
    boxShadow: "0 10px 30px -4px rgba(23, 170, 74, 0.25), 0 2px 6px rgba(0, 0, 0, 0.04)",
    borderRadius: "20px", padding: "24px", marginBottom: "20px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  promoBadge: {
    display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px",
    padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "800",
    background: "linear-gradient(135deg, rgba(255,215,0,0.10) 0%, rgba(230,194,0,0.10) 100%)",
    border: "1px solid rgba(255,215,0,0.25)", color: "#E6C200",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  publicidadBadge: {
    display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px",
    padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "900",
    background: "linear-gradient(135deg, #FFD700 0%, #E6A800 100%)",
    border: "1px solid rgba(20, 109, 158, 0.18)", color: "#1A1A2E",
    textTransform: "uppercase", letterSpacing: "0.8px",
    boxShadow: "0 2px 8px rgba(255, 215, 0, 0.3)",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px",
  },
  roleBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "20px", height: "20px", borderRadius: "6px", fontSize: "10px",
    background: "rgba(255,215,0,0.10)", color: "var(--atlan-gold-dark)",
  },
  content: {
    margin: "0 0 16px", fontSize: "15.5px", lineHeight: "1.65",
    color: "var(--atlan-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word",
  },
  imageContainer: {
    borderRadius: "18px", overflow: "hidden", marginBottom: "16px",
    border: "1px solid rgba(20,109,158,0.08)",
  },
  image: { width: "100%", maxHeight: "540px", objectFit: "cover", display: "block" },
  statsBar: {
    display: "flex", justifyContent: "space-between", padding: "8px 4px",
    borderBottom: "1px solid rgba(20,109,158,0.06)", marginBottom: "4px",
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
    background: "var(--atlan-bg-elevated)", border: "1px solid rgba(20, 109, 158, 0.12)",
    borderRadius: "12px", padding: "4px", minWidth: "140px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.10)",
  },
  menuItem: {
    display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px",
    background: "none", border: "none", color: "#ef4444", fontSize: "13px", fontWeight: "700",
    cursor: "pointer", borderRadius: "8px", transition: "background 0.15s",
  },
  commentsSection: {
    borderTop: "1px solid rgba(20,109,158,0.06)", paddingTop: "14px", marginTop: "4px",
  },
  commentItem: {
    display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start",
  },
  commentBubble: {
    background: "#F4F6F9", padding: "8px 14px", borderRadius: "0 14px 14px 14px",
    boxShadow: "inset 1px 1px 3px rgba(255, 255, 255, 0.8), inset -1px -1px 3px rgba(20, 109, 158, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
  },
  commentInput: {
    display: "flex", alignItems: "center", gap: "10px", marginTop: "12px",
  },
  commentTextField: {
    flex: 1, padding: "10px 16px", background: "#F4F6F9",
    border: "1.5px solid rgba(20,109,158,0.12)", borderRadius: "20px",
    color: "#1A1A2E", fontSize: "13px", outline: "none",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", border: "none",
    width: "36px", height: "36px", borderRadius: "50%", color: "white", fontSize: "14px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(23,170,74,0.25)",
  },
};

const sidebarStyles = {
  profileCard: {
    background: "#FFFFFF", border: "2px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "inset 3px 3px 8px rgba(255, 255, 255, 1), inset -4px -4px 10px rgba(20, 109, 158, 0.05), 0 12px 28px -6px rgba(20, 109, 158, 0.10)",
    borderRadius: "24px", overflow: "hidden",
  },
  profileBanner: {
    height: "60px", background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)",
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
    color: "var(--atlan-text-primary)",
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

const modalStyles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(5, 10, 20, 0.55)", backdropFilter: "blur(12px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
  },
  modal: {
    width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto",
    background: "#FFFFFF", border: "2px solid rgba(255, 255, 255, 0.95)",
    borderRadius: "28px", padding: "32px", position: "relative",
    boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.08), 0 24px 56px -8px rgba(20, 109, 158, 0.16)",
  },
  closeBtn: {
    position: "absolute", top: "16px", right: "16px", background: "rgba(20,109,158,0.06)",
    border: "none", color: "var(--atlan-text-muted)", width: "32px", height: "32px",
    borderRadius: "50%", fontSize: "14px", cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
};

const postFormStyles = {
  textarea: {
    width: "100%", padding: "14px 18px", background: "#F4F6F9",
    border: "1.5px solid rgba(20,109,158,0.12)", borderRadius: "18px",
    color: "var(--atlan-text-primary)", fontSize: "15px", lineHeight: "1.5",
    outline: "none", resize: "vertical", minHeight: "100px",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
    boxShadow: "inset 2px 2px 4px rgba(20, 109, 158, 0.04), inset -1px -1px 3px rgba(255, 255, 255, 0.8)",
  },
  removeImgBtn: {
    position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)",
    border: "none", color: "white", width: "28px", height: "28px", borderRadius: "50%",
    fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },
  promoSection: {
    padding: "12px 16px", background: "rgba(255,215,0,0.06)",
    border: "1px solid rgba(255,215,0,0.15)", borderRadius: "12px",
    display: "flex", flexDirection: "column", gap: "10px",
  },
  select: {
    width: "100%", padding: "8px 12px", background: "rgba(20, 109, 158, 0.04)",
    border: "1px solid rgba(20,109,158,0.12)", borderRadius: "8px",
    color: "var(--atlan-text-primary)", fontSize: "13px", outline: "none",
  },
  attachBtn: {
    padding: "8px 14px", background: "rgba(20,109,158,0.04)",
    border: "1px solid rgba(20,109,158,0.10)", borderRadius: "10px",
    color: "var(--atlan-text-secondary)", fontSize: "13px", fontWeight: "700",
    cursor: "pointer", transition: "all 0.2s",
  },
  publishBtn: {
    padding: "10px 28px", background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)",
    border: "none", borderRadius: "12px", color: "white", fontSize: "14px",
    fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(23,170,74,0.25)",
    transition: "all 0.2s",
  },
};
