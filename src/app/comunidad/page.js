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

  if (diffMin < 1) return lang === "en" ? "Now" : lang === "zh" ? "刚刚" : "Ahora";
  if (diffMin < 60) return lang === "en" ? `${diffMin}m ago` : lang === "zh" ? `${diffMin}分钟前` : `hace ${diffMin}m`;
  if (diffHr < 24) return lang === "en" ? `${diffHr}h ago` : lang === "zh" ? `${diffHr}小时前` : `hace ${diffHr}h`;
  return lang === "en" ? `${diffDay}d ago` : lang === "zh" ? `${diffDay}天前` : `hace ${diffDay}d`;
}

// ── MODAL: LOGIN REQUERIDO ────────────────────────────────────────────────
function LoginRequiredModal({ onClose, lang }) {
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()} className="animate-fade-in-up">
        <button onClick={onClose} style={modalStyles.closeBtn} type="button">
          <Icon name="x" size={15} color="#94A3B8" />
        </button>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)",
            border: "1px solid rgba(255, 215, 0, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            boxShadow: "0 4px 20px rgba(255, 215, 0, 0.25)"
          }}>
            <Icon name="lock" size={30} color="#FFD700" />
          </div>
          <h3 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 8px", color: "#FFD700", fontFamily: "var(--font-outfit)" }}>
            {lang === "en" ? "Sign in to interact" : lang === "zh" ? "请先登录" : "Inicia sesión para interactuar"}
          </h3>
          <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 24px", lineHeight: "1.6" }}>
            {lang === "en" ? "Sign up or log in to like, comment, and follow other users." : lang === "zh" ? "注册或登录即可点赞、评论和关注其他用户。" : "Regístrate o inicia sesión para dar likes, comentar y seguir a otros usuarios."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/login" style={{ padding: "12px 28px", fontSize: "14px", fontWeight: "800", borderRadius: "12px", background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", color: "#0A192F", textDecoration: "none", boxShadow: "0 4px 16px rgba(255, 215, 0, 0.3)" }}>
              {lang === "en" ? "Sign In" : lang === "zh" ? "登录" : "Iniciar Sesión"}
            </Link>
            <Link href="/registro" style={{ padding: "12px 28px", fontSize: "14px", fontWeight: "800", borderRadius: "12px", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#FFFFFF", textDecoration: "none" }}>
              {lang === "en" ? "Create Account" : lang === "zh" ? "创建账户" : "Crear Cuenta"}
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
      alert(lang === "en" ? "You can only attach an image or a video, not both" : lang === "zh" ? "只能添加图片或视频，不能同时添加" : "Solo puedes adjuntar una imagen o un video, no ambos");
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
      alert(lang === "en" ? "You can only attach an image or a video, not both" : lang === "zh" ? "只能添加图片或视频，不能同时添加" : "Solo puedes adjuntar una imagen o un video, no ambos");
      return;
    }
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      alert(lang === "en" ? "Only MP4, WebM, or MOV video formats are allowed" : lang === "zh" ? "仅支持 MP4、WebM 或 MOV 格式的视频" : "Solo se permiten videos en formato MP4, WebM o MOV");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      alert(lang === "en" ? "Video must not exceed 60MB" : lang === "zh" ? "视频大小不能超过 60MB" : "El video no debe exceder 60MB");
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
        setUploadProgress(lang === "en" ? "Uploading image..." : lang === "zh" ? "正在上传图片..." : "Subiendo imagen...");
        imagenUrl = await uploadMedia(imageFile, "social");
        tipoMedia = "imagen";
      } else if (videoFile) {
        setUploadProgress(lang === "en" ? "Uploading video..." : lang === "zh" ? "正在上传视频..." : "Subiendo video...");
        videoUrl = await uploadMedia(videoFile, "social/videos");
        tipoMedia = "video";
      }

      setUploadProgress(lang === "en" ? "Publishing..." : lang === "zh" ? "正在发布..." : "Publicando...");
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
      alert(lang === "en" ? "Failed to create post" : lang === "zh" ? "创建动态失败" : "Error al crear publicación");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{ ...modalStyles.modal, maxWidth: "560px" }} onClick={(e) => e.stopPropagation()} className="animate-fade-in-up">
        {/* Header del modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)",
              border: "1px solid rgba(255, 215, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(255, 215, 0, 0.2)",
              color: "#FFD700"
            }}>
              <Icon name="edit" size={20} color="#FFD700" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: "#FFD700", letterSpacing: "-0.3px", fontFamily: "var(--font-outfit)" }}>
                {lang === "en" ? "Create Post" : lang === "zh" ? "发布动态" : "Crear Publicación"}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94A3B8" }}>
                {lang === "en" ? "Share experiences, photos or videos with the community" : lang === "zh" ? "与社区分享体验、照片或视频" : "Comparte experiencias, fotos o videos con la comunidad"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn} type="button">
            <Icon name="x" size={15} color="#94A3B8" />
          </button>
        </div>

        {/* Author info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", background: "rgba(255, 255, 255, 0.04)", padding: "10px 14px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ ...avatarStyle(perfil?.avatar_url, 42), border: "2px solid rgba(255, 215, 0, 0.4)", boxShadow: "0 0 12px rgba(255, 215, 0, 0.15)" }}>
            {!perfil?.avatar_url && (perfil?.nombre_completo?.[0]?.toUpperCase() || "U")}
          </div>
          <div>
            <span style={{ fontWeight: "700", fontSize: "14.5px", color: "#FFFFFF", display: "block" }}>{perfil?.nombre_completo || "Usuario"}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "700", color: "#38BDF8", background: "rgba(56, 189, 248, 0.12)", padding: "2px 8px", borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.25)", marginTop: "2px" }}>
              {perfil?.rol === "dueno"
                ? <><Icon name="building" size={11} color="#38BDF8" /> {lang === "en" ? "Business Owner" : lang === "zh" ? "店主 / 企业主" : "Propietario"}</>
                : perfil?.rol === "admin"
                ? <><Icon name="zap" size={11} color="#FFD700" /> {lang === "en" ? "Administrator" : lang === "zh" ? "管理员" : "Administrador"}</>
                : (perfil?.es_premium || perfil?.suscripcion_activa || perfil?.rol === "turista_deacachimba")
                ? <><Icon name="star" size={11} color="#FFD700" /> {lang === "en" ? "VIP Tourist" : lang === "zh" ? "资深游客" : "Turista Deacachimba"}</>
                : <><Icon name="luggage" size={11} color="#38BDF8" /> {lang === "en" ? "Tourist" : lang === "zh" ? "尊贵游客" : "Turista Tuani"}</>}
            </span>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value.slice(0, 2000))}
          placeholder={lang === "en" ? "What's on your mind?" : lang === "zh" ? "分享您的新鲜事..." : "¿Qué estás pensando?"}
          style={postFormStyles.textarea}
          rows={4}
          autoFocus
        />
        <div style={{ textAlign: "right", fontSize: "11.5px", fontWeight: "600", color: contenido.length > 1800 ? "#EF4444" : "#64748B", marginTop: "6px", marginBottom: "14px" }}>
          {contenido.length}/2000
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div style={{ position: "relative", marginBottom: "16px", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255, 215, 0, 0.3)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
            <img src={imagePreview} alt="Preview" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "16px" }} />
            <button onClick={clearImage} style={postFormStyles.removeImgBtn} type="button">
              <Icon name="x" size={14} color="#FFFFFF" />
            </button>
          </div>
        )}

        {/* Video preview */}
        {videoPreview && (
          <div style={{ position: "relative", marginBottom: "16px", borderRadius: "16px", overflow: "hidden", background: "#000", border: "1px solid rgba(56, 189, 248, 0.3)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
            <video
              src={videoPreview}
              controls
              playsInline
              preload="metadata"
              style={{ width: "100%", maxHeight: "300px", borderRadius: "16px", display: "block" }}
            />
            <button onClick={clearVideo} style={postFormStyles.removeImgBtn} type="button">
              <Icon name="x" size={14} color="#FFFFFF" />
            </button>
            <div style={{
              position: "absolute", bottom: "12px", left: "12px",
              background: "rgba(10, 15, 28, 0.75)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: "8px",
              fontSize: "11px", fontWeight: "800", color: "#34D399", border: "1px solid rgba(52, 211, 153, 0.3)",
              display: "flex", alignItems: "center", gap: "5px"
            }}>
              <Icon name="video" size={12} color="#34D399" />
              <span>{(videoFile.size / (1024 * 1024)).toFixed(1)}MB</span>
            </div>
          </div>
        )}

        {/* Post Type Selector (for Owner or Admin) */}
        {(perfil?.rol === "dueno" || perfil?.rol === "admin") && (
          <div style={postFormStyles.promoSection}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#FFD700", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", letterSpacing: "0.5px" }}>
              <Icon name="megaphone" size={14} color="#FFD700" /> {lang === "en" ? "Publication type" : lang === "zh" ? "发布类型" : "Tipo de publicación"}
            </span>
            <div style={{ display: "flex", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "13px",
                color: (!esPromocion && !esPublicidad) ? "#FFFFFF" : "#94A3B8",
                fontWeight: (!esPromocion && !esPublicidad) ? "700" : "500",
                background: (!esPromocion && !esPublicidad) ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
                padding: "6px 12px",
                borderRadius: "10px",
                border: (!esPromocion && !esPublicidad) ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                transition: "all 0.2s ease"
              }}>
                <input 
                  type="radio" 
                  name="postType" 
                  checked={!esPromocion && !esPublicidad} 
                  onChange={() => { setEsPromocion(false); setEsPublicidad(false); }} 
                  style={{ accentColor: "#FFD700" }} 
                />
                {lang === "en" ? "Standard" : lang === "zh" ? "普通" : "Normal"}
              </label>

              {perfil?.rol === "dueno" && (
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: esPromocion ? "#FFD700" : "#94A3B8",
                  fontWeight: esPromocion ? "700" : "500",
                  background: esPromocion ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  padding: "6px 12px",
                  borderRadius: "10px",
                  border: esPromocion ? "1px solid rgba(255, 215, 0, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                  transition: "all 0.2s ease"
                }}>
                  <input 
                    type="radio" 
                    name="postType" 
                    checked={esPromocion} 
                    onChange={() => { setEsPromocion(true); setEsPublicidad(false); }} 
                    style={{ accentColor: "#FFD700" }} 
                  />
                  <Icon name="megaphone" size={13} color={esPromocion ? "#FFD700" : "#94A3B8"} /> {lang === "en" ? "Promotion" : lang === "zh" ? "优惠推广" : "Promoción"}
                </label>
              )}

              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "13px",
                color: esPublicidad ? "#F59E0B" : "#94A3B8",
                fontWeight: esPublicidad ? "700" : "500",
                background: esPublicidad ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.03)",
                padding: "6px 12px",
                borderRadius: "10px",
                border: esPublicidad ? "1px solid rgba(245, 158, 11, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                transition: "all 0.2s ease"
              }}>
                <input 
                  type="radio" 
                  name="postType" 
                  checked={esPublicidad} 
                  onChange={() => { setEsPromocion(false); setEsPublicidad(true); }} 
                  style={{ accentColor: "#F59E0B" }} 
                />
                <Icon name="sparkles" size={13} color={esPublicidad ? "#F59E0B" : "#94A3B8"} /> {lang === "en" ? "Sponsored Ad" : lang === "zh" ? "赞助广告" : "Publicidad"}
              </label>
            </div>

            {(esPromocion || esPublicidad) && perfil?.rol === "dueno" && negocios.length > 0 && (
              <select value={negocioId} onChange={(e) => setNegocioId(e.target.value)} style={postFormStyles.select}>
                <option value="">{lang === "en" ? "Link to business (optional)" : lang === "zh" ? "关联店铺（可选）" : "Vincular a negocio (opcional)"}</option>
                {negocios.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            <input type="file" ref={videoInputRef} accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoChange} style={{ display: "none" }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!videoFile}
              style={{
                ...postFormStyles.attachBtn,
                opacity: videoFile ? 0.4 : 1,
                background: imageFile ? "rgba(16, 185, 129, 0.16)" : "linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(2, 132, 199, 0.06) 100%)",
                color: imageFile ? "#34D399" : "#7DD3FC",
                borderColor: imageFile ? "rgba(16, 185, 129, 0.4)" : "rgba(56, 189, 248, 0.35)",
              }}
            >
              <Icon name="image" size={16} color={imageFile ? "#34D399" : "#38BDF8"} />
              <span>{lang === "en" ? "Photo" : lang === "zh" ? "照片" : "Foto"}</span>
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={!!imageFile}
              style={{
                ...postFormStyles.attachBtn,
                opacity: imageFile ? 0.4 : 1,
                background: videoFile ? "rgba(16, 185, 129, 0.16)" : "linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(147, 51, 234, 0.06) 100%)",
                color: videoFile ? "#34D399" : "#C084FC",
                borderColor: videoFile ? "rgba(16, 185, 129, 0.4)" : "rgba(168, 85, 247, 0.35)",
              }}
            >
              <Icon name="video" size={16} color={videoFile ? "#34D399" : "#C084FC"} />
              <span>{lang === "en" ? "Video" : lang === "zh" ? "视频" : "Video"}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (!contenido.trim() && !imageFile && !videoFile)}
            style={{
              ...postFormStyles.publishBtn,
              opacity: loading || (!contenido.trim() && !imageFile && !videoFile) ? 0.5 : 1,
              cursor: loading || (!contenido.trim() && !imageFile && !videoFile) ? "not-allowed" : "pointer"
            }}
          >
            {loading ? (uploadProgress || (lang === "en" ? "Publishing..." : lang === "zh" ? "正在发布..." : "Publicando...")) : (lang === "en" ? "Publish" : lang === "zh" ? "立即发布" : "Publicar")}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderFormattedContent(contenido) {
  if (!contenido) return null;
  if (typeof contenido === "string" && contenido.includes("🔁")) {
    const parts = contenido.split("🔁");
    return (
      <span>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <img
                src="/images/repst.svg"
                alt="Repost"
                style={{
                  width: "18px",
                  height: "18px",
                  objectFit: "contain",
                  display: "inline-block",
                  verticalAlign: "-3px",
                  marginRight: "6px",
                  filter: "brightness(0) saturate(100%) invert(34%) sepia(85%) saturate(1045%) hue-rotate(170deg)"
                }}
              />
            )}
            {part}
          </React.Fragment>
        ))}
      </span>
    );
  }
  return contenido;
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
    if (!confirm(lang === "en" ? "Delete this comment?" : lang === "zh" ? "删除此评论？" : "¿Eliminar este comentario?")) return;
    try {
      await supabase.from("comentarios_social").delete().eq("id", commentId);
      setComments((c) => c.filter((cm) => cm.id !== commentId));
      setCommentsCount((c) => Math.max(c - 1, 0));
    } catch (err) { console.error("Delete comment error:", err); }
  };

  const handleDeletePost = () => {
    if (!confirm(lang === "en" ? "Are you sure you want to delete this post?" : lang === "zh" ? "确定要删除这条动态吗？" : "¿Estás seguro de que deseas eliminar esta publicación?")) return;
    onDelete(post.id);
    setShowMenu(false);
  };

  return (
    <div style={post.es_publicidad ? cardStyles.publicidadCard : cardStyles.card}>
      {/* Badges */}
      {post.es_publicidad && (
        <div style={cardStyles.publicidadBadge}>
          <Icon name="sparkles" size={12} /> {lang === "en" ? "Sponsored Ad" : lang === "zh" ? "赞助广告" : "Publicidad"}
        </div>
      )}
      {post.es_promocion && !post.es_publicidad && (
        <div style={cardStyles.promoBadge}>
          <Icon name="megaphone" size={12} /> {lang === "en" ? "Promo" : lang === "zh" ? "特别推广" : "Promoción"}
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
                  <Icon name="trash" size={12} /> {lang === "en" ? "Delete" : lang === "zh" ? "删除" : "Eliminar"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p style={cardStyles.content}>{renderFormattedContent(post.contenido)}</p>

      {/* Image */}
      {post.imagen_url && (
        <div
          style={{
            ...cardStyles.imageContainer,
            background: "linear-gradient(135deg, #0A192F 0%, #050B14 100%)",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: "8px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            marginBottom: "16px"
          }}
          onClick={() => onImageClick && onImageClick(post)}
        >
          <img
            src={post.imagen_url}
            alt="Post"
            style={{
              ...cardStyles.image,
              objectFit: "contain",
              maxHeight: "520px",
              borderRadius: "12px",
              background: "transparent"
            }}
            loading="lazy"
          />
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
        {likesCount > 0 && (
          <span style={{ ...cardStyles.statText, display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <img src="/images/Like.svg" alt="" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0)" }} /> {likesCount}
          </span>
        )}
        {commentsCount > 0 && (
          <button onClick={handleToggleComments} style={{ ...cardStyles.statText, background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <img src="/images/comentarios.svg" alt="" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0)" }} /> {commentsCount} {commentsCount === 1 ? (lang === "en" ? "comment" : lang === "zh" ? "条评论" : "comentario") : (lang === "en" ? "comments" : lang === "zh" ? "条评论" : "comentarios")}
          </button>
        )}
      </div>

      {/* Action bar */}
      <div style={cardStyles.actionBar}>
        <button
          onClick={handleLike}
          style={{
            ...cardStyles.actionBtn,
            background: liked ? "rgba(239, 68, 68, 0.14)" : "rgba(255, 255, 255, 0.65)",
            borderColor: liked ? "rgba(239, 68, 68, 0.4)" : "#CBD5E1",
            color: liked ? "#EF4444" : "#334155"
          }}
          onMouseOver={(e) => {
            if (!liked) {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
              e.currentTarget.style.color = "#EF4444";
            }
          }}
          onMouseOut={(e) => {
            if (!liked) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.65)";
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.color = "#334155";
            }
          }}
        >
          <img
            src="/images/Like.svg"
            alt=""
            style={{
              width: "20px",
              height: "20px",
              objectFit: "contain",
              transform: liked ? "scale(1.1)" : "scale(1)",
              filter: liked ? "drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))" : "brightness(0) opacity(0.75)",
              transition: "all 0.2s"
            }}
          />
          <span>{lang === "en" ? (liked ? "Liked" : "Like") : lang === "zh" ? (liked ? "已赞" : "点赞") : (liked ? "Te gusta" : "Me gusta")}</span>
        </button>

        <button
          onClick={handleToggleComments}
          style={{
            ...cardStyles.actionBtn,
            background: showComments ? "rgba(20, 109, 158, 0.14)" : "rgba(255, 255, 255, 0.65)",
            borderColor: showComments ? "rgba(20, 109, 158, 0.4)" : "#CBD5E1",
            color: showComments ? "#146D9E" : "#334155"
          }}
          onMouseOver={(e) => {
            if (!showComments) {
              e.currentTarget.style.background = "rgba(20, 109, 158, 0.1)";
              e.currentTarget.style.borderColor = "rgba(20, 109, 158, 0.35)";
              e.currentTarget.style.color = "#146D9E";
            }
          }}
          onMouseOut={(e) => {
            if (!showComments) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.65)";
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.color = "#334155";
            }
          }}
        >
          <img
            src="/images/comentarios.svg"
            alt=""
            style={{
              width: "20px",
              height: "20px",
              objectFit: "contain",
              filter: showComments ? "brightness(0) saturate(100%) invert(34%) sepia(85%) saturate(1045%) hue-rotate(170deg)" : "brightness(0) opacity(0.75)",
              transition: "all 0.2s"
            }}
          />
          <span>{lang === "en" ? "Comment" : lang === "zh" ? "评论" : "Comentar"}</span>
        </button>

        <div style={{ flex: 1, display: "flex" }}>
          <ShareDropdown post={post} session={session} perfil={perfil} lang={lang} onRequireLogin={onRequireLogin} onRepost={onRepost} />
        </div>
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
                            {lang === "en" ? "Delete" : lang === "zh" ? "删除" : "Eliminar"}
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
                    placeholder={lang === "en" ? "Write a comment..." : lang === "zh" ? "写下您的评论..." : "Escribe un comentario..."}
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
                  <Icon name="lock" size={14} /> {lang === "en" ? "Sign in to comment" : lang === "zh" ? "登录后发表评论" : "Inicia sesión para comentar"}
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
              ? <><Icon name="building" size={11} /> {lang === "en" ? "Business Owner" : lang === "zh" ? "店主 / 企业主" : "Propietario"}</>
              : (user.es_premium || user.suscripcion_activa || user.rol === "turista_deacachimba")
              ? <><Icon name="star" size={11} /> {lang === "en" ? "VIP Tourist" : lang === "zh" ? "资深游客" : "Turista Deacachimba"}</>
              : <><Icon name="luggage" size={11} /> {lang === "en" ? "Tourist" : lang === "zh" ? "尊贵游客" : "Turista Tuani"}</>}
          </div>
        </div>
      </Link>
      <button
        onClick={handleFollow}
        disabled={loading}
        style={{
          ...sidebarStyles.followBtn,
          background: isFollowing ? "rgba(100, 116, 139, 0.08)" : "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)",
          color: isFollowing ? "#64748B" : "#FFFFFF",
          border: isFollowing ? "1px solid rgba(148, 163, 184, 0.25)" : "1px solid rgba(20, 109, 158, 0.25)",
          boxShadow: isFollowing ? "none" : "0 2px 8px rgba(20, 109, 158, 0.2)",
        }}
      >
        {isFollowing ? (lang === "en" ? "Following" : lang === "zh" ? "已关注" : "Siguiendo") : (lang === "en" ? "Follow" : lang === "zh" ? "关注" : "Seguir")}
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

  const PAGE_SIZE = 50;

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum = 0, append = false) => {
    if (pageNum === 0) setLoadingPosts(true);
    else setLoadingMore(true);
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("publicaciones")
        .select("*, perfiles(id, nombre_completo, avatar_url, rol)")
        .order("created_at", { ascending: false });

      if (session?.user) {
        const { data: following } = await supabase
          .from("seguimientos")
          .select("seguido_id")
          .eq("seguidor_id", session.user.id);

        const followingIds = (following || []).map((f) => f.seguido_id);
        const allowedAuthors = [session.user.id, ...followingIds];

        if (followingIds.length > 0) {
          query = query.or(`autor_id.in.(${allowedAuthors.join(",")}),es_publicidad.eq.true,es_promocion.eq.true`);
        }
      }

      const { data, error } = await query.range(from, to);

      if (error) throw error;
      if (append) { setPosts((prev) => [...prev, ...(data || [])]); }
      else { setPosts(data || []); }
      setHasMore((data || []).length === PAGE_SIZE);
    } catch (err) { console.error("Fetch posts error:", err); }
    finally { setLoadingPosts(false); setLoadingMore(false); }
  }, [session?.user?.id]);

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
  }, [session?.user?.id]);

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
        src="/images/masaaya.svg"
        alt=""
        style={{
          position: "fixed",
          top: "80px",
          left: "10px",
          width: "340px",
          height: "calc(100vh - 90px)",
          objectFit: "contain",
          opacity: 0.16,
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
                    ? <><Icon name="building" size={11} /> {lang === "en" ? "Business Owner" : lang === "zh" ? "店主 / 企业主" : "Propietario"}</>
                    : (perfil.es_premium || perfil.suscripcion_activa || perfil.rol === "turista_deacachimba")
                    ? <><Icon name="star" size={11} /> {lang === "en" ? "VIP Tourist" : lang === "zh" ? "资深游客" : "Turista Deacachimba"}</>
                    : <><Icon name="luggage" size={11} /> {lang === "en" ? "Tourist" : lang === "zh" ? "尊贵游客" : "Turista Tuani"}</>}
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
                  <button onClick={() => { setFollowersModalTab("followers"); setShowFollowersModal(true); }} style={{ textAlign: "center", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "8px", transition: "background 0.15s" }}>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{perfil.seguidores_count || 0}</div>
                    <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Followers" : lang === "zh" ? "粉丝" : "Seguidores"}</div>
                  </button>
                  <button onClick={() => { setFollowersModalTab("following"); setShowFollowersModal(true); }} style={{ textAlign: "center", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "8px", transition: "background 0.15s" }}>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>{perfil.siguiendo_count || 0}</div>
                    <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Following" : lang === "zh" ? "已关注" : "Siguiendo"}</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={sidebarStyles.loginCard}>
              <span style={{ display: "block", marginBottom: "12px" }}>
                <img src="/images/comunidad.svg" alt="Comunidad" style={{ width: "42px", height: "42px", objectFit: "contain", margin: "0 auto" }} />
              </span>
              <h4 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
                {lang === "en" ? "Join the Community" : lang === "zh" ? "加入社区" : "Únete a la Comunidad"}
              </h4>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--atlan-text-secondary)", lineHeight: "1.5" }}>
                {lang === "en" ? "Sign up to create posts, comment, and connect with others." : lang === "zh" ? "注册即可发布动态、参与评论并与其他用户互动。" : "Regístrate para publicar, comentar y conectar con otros."}
              </p>
              <Link href="/registro" className="btn-primary" style={{ display: "block", textAlign: "center", padding: "10px", fontSize: "13px" }}>
                {lang === "en" ? "Create Account" : lang === "zh" ? "创建账户" : "Crear Cuenta"}
              </Link>
            </div>
          )}

          {/* Sección Explorar debajo del Perfil */}
          <div style={{ ...sidebarStyles.sectionCard, marginTop: "16px" }}>
            <div style={sidebarStyles.cardHeaderBanner}>
              <img src="/images/Ubicacion.svg" alt="" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> {lang === "en" ? "Explore" : lang === "zh" ? "探索发现" : "Explorar"}
            </div>
            <div style={{ padding: "0 16px" }}>
              <Link href="/comunidad" style={sidebarStyles.exploreLink}>
                <img src="/images/comunidad.svg" alt="" style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0)" }} /> {lang === "en" ? "Feed" : lang === "zh" ? "公共动态" : "Muro General"}
              </Link>
              <Link href="/mapa" style={sidebarStyles.exploreLink}>
                <img src="/images/croquisnicaragua.svg" alt="Mapa" style={{ width: "20px", height: "20px", objectFit: "contain", filter: "brightness(0)" }} /> {lang === "en" ? "Tourist Map" : lang === "zh" ? "旅游地图" : "Mapa Turístico"}
              </Link>
              {session && (perfil?.rol === "dueno" || perfil?.rol === "admin") && (
                <Link href="/dashboard" style={sidebarStyles.exploreLink}>
                  <Icon name="briefcase" size={14} /> {lang === "en" ? "My Business" : lang === "zh" ? "我的店铺" : "Mi Negocio"}
                </Link>
              )}
            </div>
          </div>
        </aside>

        {/* ── FEED CENTRAL ── */}
        <main style={pageStyles.feed}>
          {/* Mobile Search Bar & Results */}
          <div className="hide-desktop" style={{ marginBottom: "16px", background: "var(--atlan-bg-card)", border: "1px solid rgba(20, 109, 158, 0.08)", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "800", color: "var(--atlan-text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <img src="/images/lupa.svg" alt="" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> {lang === "en" ? "Find Friends" : lang === "zh" ? "查找用户" : "Buscar Personas"}
            </h4>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("social.searchPlaceholder")}
                style={{
                  width: "100%",
                  padding: "10px 36px 10px 14px",
                  background: "rgba(20, 109, 158, 0.04)",
                  border: "1px solid rgba(20, 109, 158, 0.10)",
                  borderRadius: "12px",
                  color: "var(--atlan-text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--atlan-text-muted)",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            {/* Resultados de búsqueda en móvil */}
            {searchQuery.trim() && (
              <div style={{ marginTop: "12px", borderTop: "1px solid rgba(20,109,158,0.08)", paddingTop: "10px" }}>
                <div style={{ fontSize: "12px", fontWeight: "800", color: "var(--atlan-text-muted)", marginBottom: "8px" }}>
                  {lang === "en" ? "Search Results:" : lang === "zh" ? "搜索结果：" : "Resultados de la Búsqueda:"}
                </div>
                {searching ? (
                  <p style={{ fontSize: "12px", color: "var(--atlan-text-muted)", margin: 0 }}>{lang === "en" ? "Searching..." : lang === "zh" ? "正在搜索..." : "Buscando..."}</p>
                ) : searchResults.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--atlan-text-muted)", margin: 0 }}>{lang === "en" ? "No people found" : lang === "zh" ? "未找到相关用户" : "No se encontraron personas"}</p>
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
                {lang === "en" ? "What's on your mind?" : lang === "zh" ? "分享您的新鲜事..." : "¿Qué estás pensando?"}
              </div>
              <button style={pageStyles.createPostBtn}>
                <Icon name="edit" size={16} />
              </button>
            </div>
          )}

          {/* Muro de Publicaciones Principal (SIEMPRE VISIBLE) */}
          {loadingPosts ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ width: "40px", height: "40px", border: "3px solid rgba(20, 109, 158, 0.12)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ fontSize: "14px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Loading posts..." : lang === "zh" ? "正在加载动态..." : "Cargando publicaciones..."}</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={pageStyles.emptyState}>
              <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}><Icon name="search" size={48} /></span>
              <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
                {lang === "en" ? "No posts yet" : lang === "zh" ? "暂无动态" : "No hay publicaciones todavía"}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--atlan-text-secondary)" }}>
                {lang === "en" ? "Be the first to share something with the community!" : lang === "zh" ? "快来成为第一个分享动态的人吧！" : "¡Sé el primero en compartir algo con la comunidad!"}
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
            <div style={sidebarStyles.cardHeaderBanner}>
              <img src="/images/lupa.svg" alt="" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> {lang === "en" ? "Search People" : lang === "zh" ? "搜索用户" : "Buscar Personas"}
            </div>
            <div style={{ padding: "0 16px", position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("social.searchPlaceholder")}
                style={{
                  width: "100%",
                  padding: "10px 36px 10px 14px",
                  background: "rgba(20, 109, 158, 0.04)",
                  border: "1px solid rgba(20, 109, 158, 0.10)",
                  borderRadius: "12px",
                  color: "var(--atlan-text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "26px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--atlan-text-muted)",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Tarjeta dinámica: "Resultados de la Búsqueda" o "Personas sugeridas" */}
          <div style={{ ...sidebarStyles.sectionCard, marginTop: "16px" }}>
            <div style={sidebarStyles.cardHeaderBanner}>
              {searchQuery.trim() ? (
                <>
                  <img src="/images/lupa.svg" alt="" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> {lang === "en" ? "Search Results" : lang === "zh" ? "搜索结果" : "Resultados de la Búsqueda"}
                </>
              ) : (
                <>
                  <img src="/images/tortuga.svg" alt="" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "brightness(0) invert(1)" }} /> {lang === "en" ? "Suggested People" : lang === "zh" ? "推荐关注" : "Personas sugeridas"}
                </>
              )}
            </div>
            <div style={{ padding: "0 16px" }}>
              {searchQuery.trim() ? (
                searching ? (
                  <p style={{ margin: 0, padding: "10px 0", fontSize: "12px", color: "var(--atlan-text-muted)", textAlign: "center" }}>
                    {lang === "en" ? "Searching..." : lang === "zh" ? "正在搜索..." : "Buscando..."}
                  </p>
                ) : searchResults.length === 0 ? (
                  <p style={{ margin: 0, padding: "10px 0", fontSize: "12px", color: "var(--atlan-text-muted)", textAlign: "center" }}>
                    {lang === "en" ? "No people found" : lang === "zh" ? "未找到相关用户" : "No se encontraron personas"}
                  </p>
                ) : (
                  searchResults.map((u) => (
                    <UserSuggestionCard key={u.id} user={u} session={session} lang={lang} onRequireLogin={() => setShowLoginModal(true)} onFollowChange={fetchSuggestedUsers} />
                  ))
                )
              ) : (
                suggestedUsers.length === 0 ? (
                  <p style={{ margin: 0, padding: "10px 0", fontSize: "12px", color: "var(--atlan-text-muted)", textAlign: "center" }}>
                    {lang === "en" ? "No suggestions" : lang === "zh" ? "暂无推荐" : "Sin sugerencias"}
                  </p>
                ) : (
                  suggestedUsers.map((u) => (
                    <UserSuggestionCard key={u.id} user={u} session={session} lang={lang} onRequireLogin={() => setShowLoginModal(true)} onFollowChange={fetchSuggestedUsers} />
                  ))
                )
              )}
            </div>
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
    color: "#FFFFFF",
    background: url ? `url(${url}) center/cover` : "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
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
    padding: "16px 22px",
    background: "#E2E8F0",
    border: "1.5px solid #94A3B8",
    boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.10), 0 2px 6px -1px rgba(15, 23, 42, 0.05)",
    borderRadius: "22px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginBottom: "24px"
  },
  createPostInput: {
    flex: 1,
    fontSize: "14.5px",
    color: "var(--atlan-text-muted)",
    fontWeight: "500",
    padding: "11px 18px",
    background: "#FFFFFF",
    borderRadius: "20px",
    border: "1px solid #94A3B8"
  },
  createPostBtn: {
    background: "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)",
    border: "none",
    color: "#FFFFFF",
    width: "40px", height: "40px", borderRadius: "14px", fontSize: "15px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px rgba(20, 109, 158, 0.25)",
    transition: "all 0.2s ease",
  },
  emptyState: {
    textAlign: "center", padding: "80px 24px",
    background: "#E2E8F0", border: "1.5px dashed #94A3B8",
    borderRadius: "24px", boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.10)",
  },
  fab: {
    position: "fixed", bottom: "24px", right: "24px", width: "56px", height: "56px",
    borderRadius: "50%", background: "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)",
    border: "2px solid rgba(255, 255, 255, 0.8)", fontSize: "22px", color: "#FFFFFF", cursor: "pointer", zIndex: 90,
    boxShadow: "0 8px 24px rgba(20, 109, 158, 0.35)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s ease",
  },
};

const cardStyles = {
  card: {
    background: "#E2E8F0",
    border: "1.5px solid #94A3B8",
    boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.10), 0 2px 6px -1px rgba(15, 23, 42, 0.05)",
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "20px",
    transition: "all 0.2s ease"
  },
  publicidadCard: {
    background: "#E2E8F0",
    border: "1.5px solid #146D9E",
    boxShadow: "0 8px 24px -4px rgba(20, 109, 158, 0.18)",
    borderRadius: "24px", padding: "24px", marginBottom: "20px",
    transition: "all 0.2s ease",
  },
  promoBadge: {
    display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px",
    padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "800",
    background: "rgba(245, 158, 11, 0.1)",
    border: "1px solid rgba(245, 158, 11, 0.25)", color: "#D97706",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  publicidadBadge: {
    display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px",
    padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "800",
    background: "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)",
    border: "none", color: "#FFFFFF",
    textTransform: "uppercase", letterSpacing: "0.8px",
    boxShadow: "0 2px 8px rgba(20, 109, 158, 0.25)",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px",
  },
  roleBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "20px", height: "20px", borderRadius: "6px", fontSize: "10px",
    background: "rgba(245, 158, 11, 0.12)", color: "#D97706",
  },
  content: {
    margin: "0 0 16px", fontSize: "15px", lineHeight: "1.65",
    color: "var(--atlan-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word",
  },
  imageContainer: {
    borderRadius: "18px", overflow: "hidden", marginBottom: "16px",
    border: "1px solid #94A3B8",
  },
  image: { width: "100%", maxHeight: "540px", objectFit: "cover", display: "block" },
  statsBar: {
    display: "flex", justifyContent: "space-between", padding: "8px 4px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.6)", marginBottom: "4px",
  },
  statText: { fontSize: "12px", color: "var(--atlan-text-muted)", fontWeight: "600" },
  actionBar: {
    display: "flex", gap: "8px", padding: "6px 0 0 0",
  },
  actionBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    padding: "9px 12px", background: "rgba(255, 255, 255, 0.65)", border: "1px solid #CBD5E1",
    color: "#334155", fontSize: "13px", fontWeight: "700",
    cursor: "pointer", borderRadius: "12px", transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(15, 23, 42, 0.03)"
  },
  menuBtn: {
    background: "none", border: "none", color: "var(--atlan-text-muted)", fontSize: "20px",
    cursor: "pointer", padding: "4px 8px", borderRadius: "8px", lineHeight: 1,
  },
  menuDropdown: {
    position: "absolute", top: "100%", right: 0, zIndex: 50,
    background: "var(--atlan-bg-elevated)", border: "1px solid #94A3B8",
    borderRadius: "12px", padding: "4px", minWidth: "140px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
  },
  menuItem: {
    display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px",
    background: "none", border: "none", color: "#EF4444", fontSize: "13px", fontWeight: "700",
    cursor: "pointer", borderRadius: "8px", transition: "background 0.15s",
  },
  commentsSection: {
    borderTop: "1px solid #94A3B8", paddingTop: "14px", marginTop: "8px",
  },
  commentItem: {
    display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start",
  },
  commentBubble: {
    background: "#FFFFFF", padding: "10px 14px", borderRadius: "0 14px 14px 14px",
    border: "1px solid #94A3B8",
  },
  commentInput: {
    display: "flex", alignItems: "center", gap: "10px", marginTop: "12px",
  },
  commentTextField: {
    flex: 1, padding: "10px 16px", background: "#FFFFFF",
    border: "1px solid #94A3B8", borderRadius: "20px",
    color: "#1A1A2E", fontSize: "13px", outline: "none",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)", border: "none",
    width: "36px", height: "36px", borderRadius: "50%", color: "white", fontSize: "14px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(20, 109, 158, 0.25)",
  },
};

const sidebarStyles = {
  profileCard: {
    background: "#E2E8F0", border: "1.5px solid #94A3B8",
    boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.10), 0 2px 6px -1px rgba(15, 23, 42, 0.05)",
    borderRadius: "22px", overflow: "hidden",
  },
  profileBanner: {
    height: "60px", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
  },
  loginCard: {
    background: "#E2E8F0", border: "1.5px solid #94A3B8",
    boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.10), 0 2px 6px -1px rgba(15, 23, 42, 0.05)",
    borderRadius: "22px", padding: "24px", textAlign: "center",
  },
  sectionCard: {
    background: "#E2E8F0", border: "1.5px solid #94A3B8",
    boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.10), 0 2px 6px -1px rgba(15, 23, 42, 0.05)",
    borderRadius: "22px", overflow: "hidden", padding: "0 0 16px 0",
  },
  cardHeaderBanner: {
    padding: "12px 18px", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
    color: "#FFFFFF", fontSize: "13.5px", fontWeight: "750", display: "flex",
    alignItems: "center", gap: "8px", marginBottom: "14px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  sectionTitle: {
    margin: "0 0 14px", fontSize: "15px", fontWeight: "800",
    color: "var(--atlan-text-primary)",
  },
  userCard: {
    display: "flex", alignItems: "center", gap: "10px", padding: "8px 0",
    borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
  },
  followBtn: {
    padding: "6px 14px", border: "none", borderRadius: "20px",
    fontSize: "12px", fontWeight: "750", cursor: "pointer", whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  },
  exploreLink: {
    display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px",
    color: "var(--atlan-text-secondary)", textDecoration: "none", fontSize: "13px",
    fontWeight: "600", borderRadius: "10px", transition: "all 0.2s ease",
    marginBottom: "4px",
  },
};

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    backgroundColor: "rgba(10, 15, 28, 0.82)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    animation: "fadeIn 0.25s ease-out"
  },
  modal: {
    width: "100%",
    maxWidth: "540px",
    maxHeight: "90vh",
    overflowY: "auto",
    backgroundColor: "#0F172A",
    backgroundImage: "linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 28, 0.99) 100%)",
    border: "1px solid rgba(255, 215, 0, 0.35)",
    borderRadius: "24px",
    padding: "24px 28px",
    position: "relative",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(255, 215, 0, 0.15)",
    color: "#F8FAFC",
    fontFamily: "var(--font-outfit), sans-serif",
    animation: "scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
  },
  closeBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#94A3B8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }
};

const postFormStyles = {
  textarea: {
    width: "100%",
    padding: "16px",
    background: "rgba(15, 23, 42, 0.75)",
    border: "1.5px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "16px",
    color: "#FFFFFF",
    fontSize: "15px",
    lineHeight: "1.55",
    outline: "none",
    resize: "vertical",
    minHeight: "120px",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
    boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.3)",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease"
  },
  removeImgBtn: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "rgba(10, 15, 28, 0.8)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#F8FAFC",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  promoSection: {
    padding: "14px 16px",
    background: "linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 165, 0, 0.04) 100%)",
    border: "1.5px solid rgba(255, 215, 0, 0.35)",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    boxShadow: "0 4px 16px rgba(255, 215, 0, 0.08)"
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    background: "#0A192F",
    border: "1px solid rgba(255, 215, 0, 0.35)",
    borderRadius: "12px",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer"
  },
  attachBtn: {
    padding: "10px 16px",
    background: "linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(2, 132, 199, 0.06) 100%)",
    border: "1.5px solid rgba(56, 189, 248, 0.35)",
    borderRadius: "14px",
    color: "#7DD3FC",
    fontSize: "13.5px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 2px 10px rgba(56, 189, 248, 0.1)",
    transition: "all 0.2s ease"
  },
  publishBtn: {
    padding: "11px 28px",
    background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    border: "none",
    borderRadius: "14px",
    color: "#0A192F",
    fontSize: "14.5px",
    fontWeight: "900",
    fontFamily: "var(--font-outfit), sans-serif",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(255, 215, 0, 0.35)",
    transition: "all 0.2s ease"
  }
};
