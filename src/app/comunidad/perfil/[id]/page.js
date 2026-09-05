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
import ShareDropdown from "@/components/ui/ShareDropdown";
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

const cardStyles = {
  card: {
    background: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.08), 0 18px 40px -6px rgba(20, 109, 158, 0.12)",
    borderRadius: "28px", padding: "24px", marginBottom: "20px"
  },
  publicidadCard: {
    background: "radial-gradient(circle at top right, rgba(23, 170, 74, 0.08) 0%, #FFFFFF 70%)",
    border: "2px solid #17AA4A",
    boxShadow: "0 10px 30px -4px rgba(23, 170, 74, 0.25)",
    borderRadius: "20px", padding: "24px", marginBottom: "20px",
  },
  promoBadge: {
    display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px",
    padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "800",
    background: "linear-gradient(135deg, rgba(255,215,0,0.10) 0%, rgba(230,194,0,0.10) 100%)",
    border: "1px solid rgba(255,215,0,0.25)", color: "#E6C200", textTransform: "uppercase",
  },
  publicidadBadge: {
    display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px",
    padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "900",
    background: "linear-gradient(135deg, #FFD700 0%, #E6A800 100%)",
    color: "#1A1A2E", textTransform: "uppercase", boxShadow: "0 2px 8px rgba(255, 215, 0, 0.3)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  roleBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "20px", height: "20px", borderRadius: "6px", fontSize: "10px",
    background: "rgba(255,215,0,0.10)", color: "#FFD700",
  },
  content: { margin: "0 0 16px", fontSize: "15.5px", lineHeight: "1.65", color: "var(--atlan-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  imageContainer: { borderRadius: "18px", overflow: "hidden", marginBottom: "16px", border: "1px solid rgba(20,109,158,0.08)" },
  image: { width: "100%", maxHeight: "540px", objectFit: "cover", display: "block" },
  statsBar: { display: "flex", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px solid rgba(20,109,158,0.06)", marginBottom: "4px" },
  statText: { fontSize: "12px", color: "var(--atlan-text-muted)", fontWeight: "600" },
  actionBar: { display: "flex", gap: "4px", padding: "4px 0" },
  actionBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    padding: "8px 0", background: "none", border: "none", color: "var(--atlan-text-secondary)",
    fontSize: "13px", fontWeight: "700", cursor: "pointer", borderRadius: "10px", transition: "all 0.2s"
  },
  menuBtn: { background: "none", border: "none", color: "var(--atlan-text-muted)", fontSize: "20px", cursor: "pointer", padding: "4px 8px" },
  menuDropdown: { position: "absolute", top: "100%", right: 0, zIndex: 50, background: "#FFFFFF", border: "1px solid rgba(20, 109, 158, 0.12)", borderRadius: "12px", padding: "4px", minWidth: "140px", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.10)" },
  menuItem: { display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px", background: "none", border: "none", color: "#ef4444", fontSize: "13px", fontWeight: "700", cursor: "pointer" },
  commentsSection: { borderTop: "1px solid rgba(20,109,158,0.06)", paddingTop: "14px", marginTop: "4px" },
  commentItem: { display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" },
  commentBubble: { background: "#F4F6F9", padding: "8px 14px", borderRadius: "0 14px 14px 14px", border: "1px solid rgba(255, 255, 255, 0.9)" },
  commentInput: { display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" },
  commentTextField: { flex: 1, padding: "10px 16px", background: "#F4F6F9", border: "1.5px solid rgba(20,109,158,0.12)", borderRadius: "20px", color: "#1A1A2E", fontSize: "13px", outline: "none" },
  sendBtn: { background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", border: "none", width: "36px", height: "36px", borderRadius: "50%", color: "white", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
};

function PostCard({ post, session, perfil, lang, onDelete, onRequireLogin, onImageClick }) {
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

  useEffect(() => {
    if (!session) return;
    supabase.from("likes_social").select("id").eq("publicacion_id", post.id).eq("usuario_id", session.user.id).maybeSingle()
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
    } catch (err) { console.error(err); }
  };

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      const { data } = await supabase.from("comentarios_social").select("*, perfiles(id, nombre_completo, avatar_url, rol)").eq("publicacion_id", post.id).order("created_at", { ascending: true });
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
      const { data, error } = await supabase.from("comentarios_social").insert({ publicacion_id: post.id, autor_id: session.user.id, contenido: newComment.trim() }).select("*, perfiles(id, nombre_completo, avatar_url, rol)").single();
      if (error) throw error;
      setComments((c) => [...c, data]);
      setCommentsCount((c) => c + 1);
      setNewComment("");
    } catch (err) { console.error(err); }
    finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm(lang === "en" ? "Delete this comment?" : "¿Eliminar este comentario?")) return;
    try {
      await supabase.from("comentarios_social").delete().eq("id", commentId);
      setComments((c) => c.filter((cm) => cm.id !== commentId));
      setCommentsCount((c) => Math.max(c - 1, 0));
    } catch (err) { console.error(err); }
  };

  const handleDeletePost = () => {
    if (!confirm(lang === "en" ? "Delete this post?" : "¿Eliminar esta publicación?")) return;
    onDelete(post.id);
    setShowMenu(false);
  };

  return (
    <div style={post.es_publicidad ? cardStyles.publicidadCard : cardStyles.card}>
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

      <p style={cardStyles.content}>{post.contenido}</p>

      {/* Imagen */}
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
          <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", color: "#17AA4A" }}>
            🎬 Video
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div style={cardStyles.statsBar}>
        {likesCount > 0 && (
          <span style={{ ...cardStyles.statText, display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <img src="/images/Like.svg" alt="" style={{ width: "14px", height: "14px", objectFit: "contain" }} /> {likesCount}
          </span>
        )}
        {commentsCount > 0 && (
          <button onClick={handleToggleComments} style={{ ...cardStyles.statText, background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <img src="/images/comentarios.svg" alt="" style={{ width: "14px", height: "14px", objectFit: "contain" }} /> {commentsCount} {commentsCount === 1 ? "comentario" : "comentarios"}
          </button>
        )}
      </div>

      {/* Action bar */}
      <div style={cardStyles.actionBar}>
        <button onClick={handleLike} style={{ ...cardStyles.actionBtn, color: liked ? "#ef4444" : "var(--atlan-text-secondary)" }}>
          <img
            src="/images/Like.svg"
            alt=""
            style={{
              width: "18px",
              height: "18px",
              objectFit: "contain",
              transform: liked ? "scale(1.15)" : "scale(1)",
              filter: liked ? "drop-shadow(0 0 5px rgba(239, 68, 68, 0.6))" : "none",
              transition: "transform 0.2s"
            }}
          />
          {liked ? "Te gusta" : "Me gusta"}
        </button>
        <button onClick={handleToggleComments} style={cardStyles.actionBtn}>
          <img src="/images/comentarios.svg" alt="" style={{ width: "18px", height: "18px", objectFit: "contain" }} /> Comentar
        </button>
        <ShareDropdown post={post} session={session} perfil={perfil} lang={lang} onRequireLogin={onRequireLogin} />
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
                        <span style={{ fontWeight: "700", fontSize: "12px", color: "var(--atlan-text-primary)" }}>{cAutor.nombre_completo || "Usuario"}</span>
                        <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--atlan-text-secondary)", lineHeight: "1.4", wordBreak: "break-word" }}>{comment.contenido}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                        <span style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>{timeAgo(comment.created_at, lang)}</span>
                        {canDeleteComment && (
                          <button onClick={() => handleDeleteComment(comment.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer", fontWeight: "700", padding: 0 }}>Eliminar</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {session && (
                <div style={cardStyles.commentInput}>
                  <div style={avatarStyle(perfil?.avatar_url, 32)}>
                    {!perfil?.avatar_url && (perfil?.nombre_completo?.[0]?.toUpperCase() || "U")}
                  </div>
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                    placeholder="Escribe un comentario..."
                    style={cardStyles.commentTextField}
                    disabled={submittingComment}
                  />
                  <button onClick={handleSubmitComment} disabled={!newComment.trim() || submittingComment} style={{ ...cardStyles.sendBtn, opacity: !newComment.trim() ? 0.4 : 1 }}>➤</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const sidebarStyles = {
  profileCard: { background: "#FFFFFF", border: "2px solid rgba(255, 255, 255, 0.95)", boxShadow: "inset 3px 3px 8px rgba(255, 255, 255, 1), inset -4px -4px 10px rgba(20, 109, 158, 0.05), 0 12px 28px -6px rgba(20, 109, 158, 0.10)", borderRadius: "24px", overflow: "hidden" },
  profileBanner: { height: "60px", background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)" },
  loginCard: { background: "#FFFFFF", border: "2px solid rgba(255, 255, 255, 0.95)", boxShadow: "inset 3px 3px 8px rgba(255, 255, 255, 1), inset -4px -4px 10px rgba(20, 109, 158, 0.05), 0 12px 28px -6px rgba(20, 109, 158, 0.10)", borderRadius: "24px", padding: "24px", textAlign: "center" },
  sectionCard: { background: "#FFFFFF", border: "2px solid rgba(255, 255, 255, 0.95)", boxShadow: "inset 3px 3px 8px rgba(255, 255, 255, 1), inset -4px -4px 10px rgba(20, 109, 158, 0.05), 0 12px 28px -6px rgba(20, 109, 158, 0.10)", borderRadius: "24px", overflow: "hidden", padding: "0 0 16px 0" },
  cardHeaderBanner: { padding: "12px 18px", background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)", color: "#FFFFFF", fontSize: "14px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" },
  sectionTitle: { margin: "0 0 14px", fontSize: "15px", fontWeight: "800", color: "var(--atlan-text-primary)", display: "flex", alignItems: "center", gap: "6px" },
  userCard: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(20,109,158,0.06)" },
  followBtn: { padding: "6px 14px", border: "none", borderRadius: "20px", fontSize: "12px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" },
  exploreLink: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", color: "var(--atlan-text-secondary)", textDecoration: "none", fontSize: "13px", fontWeight: "600", borderRadius: "10px", transition: "all 0.2s", marginBottom: "4px" },
};

function UserSuggestionCard({ user, session, lang, onRequireLogin, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase.from("seguimientos").select("id").eq("seguidor_id", session.user.id).eq("seguido_id", user.id).maybeSingle()
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
            {user.rol === "dueno" ? <><Icon name="building" size={11} /> Propietario</> : <><Icon name="luggage" size={11} /> Turista Tuani</>}
          </div>
        </div>
      </Link>
      <button onClick={handleFollow} disabled={loading} style={{ ...sidebarStyles.followBtn, background: isFollowing ? "rgba(20,109,158,0.06)" : "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", color: isFollowing ? "var(--atlan-text-secondary)" : "white" }}>
        {isFollowing ? "Siguiendo" : "Seguir"}
      </button>
    </div>
  );
}

export default function PerfilPublico() {
  const { t, lang } = useTranslation();
  const params = useParams();
  const rawUserId = params.id;

  const { session, perfil: myPerfil } = useAuth();

  const [targetPerfil, setTargetPerfil] = useState(null);
  const userId = targetPerfil?.id || rawUserId;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Modals & Search
  const [viewerPost, setViewerPost] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState("followers");
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSuggestedUsers = useCallback(async () => {
    try {
      let query = supabase.from("perfiles").select("id, nombre_completo, avatar_url, rol, seguidores_count");
      if (session?.user) {
        query = query.neq("id", session.user.id);
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
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setSuggestedUsers(shuffled.slice(0, 6));
      } else {
        setSuggestedUsers([]);
      }
    } catch (err) { console.error("Error fetching suggested users:", err); }
  }, [session?.user?.id]);

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
        const slugLower = (rawUserId || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        // 1. Comprobar si el slug coincide con el usuario de sesión activo (myPerfil)
        if (myPerfil) {
          const mySlug = getProfileSlug(myPerfil).toLowerCase().replace(/[^a-z0-9]/g, "");
          const myNameSlug = (myPerfil.nombre_completo || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          if (myPerfil.id === rawUserId || mySlug === slugLower || myNameSlug === slugLower) {
            pData = myPerfil;
          }
        }

        // 2. Si no es el usuario activo, consultar la tabla perfiles de Supabase
        if (!pData) {
          let isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);

          if (isUuid) {
            const { data } = await supabase.from("perfiles").select("*").eq("id", rawUserId).maybeSingle();
            pData = data;
          } else {
            const { data: allP } = await supabase.from("perfiles").select("*");
            if (allP) {
              pData = allP.find(p => {
                const pSlug = getProfileSlug(p).toLowerCase().replace(/[^a-z0-9]/g, "");
                const nameSlug = (p.nombre_completo || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const emailSlug = (p.email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
                return p.id === rawUserId || pSlug === slugLower || nameSlug === slugLower || emailSlug === slugLower;
              }) || null;
            }
          }
        }

        // 3. Si no se encuentra en perfiles, buscar en guias_turisticos de Supabase
        if (!pData) {
          try {
            const { data: gData } = await supabase.from("guias_turisticos").select("*");
            if (gData && gData.length > 0) {
              const foundGuia = gData.find(g => {
                const gSlug = (g.nombre_completo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                const gSlugLower = gSlug.replace(/[^a-z0-9]/g, "");
                const gNameLower = (g.nombre_completo || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                return g.id === rawUserId || gSlug === rawUserId || gSlugLower === slugLower || gNameLower === slugLower;
              });
              if (foundGuia) {
                pData = {
                  id: foundGuia.id,
                  nombre_completo: foundGuia.nombre_completo,
                  avatar_url: foundGuia.avatar_url,
                  rol: "guia_turistico",
                  bio: foundGuia.biografia,
                  departamento_principal: foundGuia.departamento_principal,
                  especialidad: foundGuia.especialidad
                };
              }
            }
          } catch (err) {
            console.warn("Notice: guias_turisticos fallback search:", err);
          }
        }

        // 4. Fallback con guías de demostración (MOCK_GUIAS)
        if (!pData) {
          const MOCK_GUIAS_FALLBACK = [
            { id: "guia-1", nombre_completo: "Carlos Mendoza Silva", avatar_url: "/images/art1.jpeg", departamento_principal: "León", especialidad: "Senderismo y Volcanes", biografia: "Guía nativo de León con más de 8 años guiando excursiones al Cerro Negro..." },
            { id: "guia-2", nombre_completo: "María José López", avatar_url: "/images/art2.jpeg", departamento_principal: "Granada", especialidad: "Cultura e Historia", biografia: "Historiadora y guía certificada..." },
            { id: "guia-3", nombre_completo: "Alejandro Jarquín", avatar_url: "/images/art3.jpeg", departamento_principal: "Rivas", especialidad: "Ecoturismo Integral", biografia: "Especialista en la mística Isla de Ometepe..." },
            { id: "guia-4", nombre_completo: "Brenda Castillo", avatar_url: "/images/art5.png", departamento_principal: "Matagalpa", especialidad: "Avistamiento de Aves", biografia: "Ornitóloga y guía de ecoturismo..." },
            { id: "guia-5", nombre_completo: "Nestor Moncada", avatar_url: "/images/art4.png", departamento_principal: "Masaya", especialidad: "Gastronomía Tradicional", biografia: "Apasionado por el folclore de Masaya..." }
          ];

          const foundMock = MOCK_GUIAS_FALLBACK.find(g => {
            const gSlug = (g.nombre_completo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const gSlugLower = gSlug.replace(/[^a-z0-9]/g, "");
            const gNameLower = (g.nombre_completo || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            return g.id === rawUserId || gSlug === rawUserId || gSlugLower === slugLower || gNameLower === slugLower;
          });
          if (foundMock) {
            pData = {
              id: foundMock.id,
              nombre_completo: foundMock.nombre_completo,
              avatar_url: foundMock.avatar_url,
              rol: "guia_turistico",
              bio: foundMock.biografia,
              departamento_principal: foundMock.departamento_principal,
              especialidad: foundMock.especialidad
            };
          }
        }

        // 5. Último fallback para el usuario en sesión activa
        if (!pData && session?.user) {
          pData = myPerfil || {
            id: session.user.id,
            nombre_completo: session.user.user_metadata?.nombre_completo || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Usuario Atlan",
            avatar_url: session.user.user_metadata?.avatar_url || null,
            rol: session.user.user_metadata?.rol || "guia_turistico"
          };
        }

        if (!pData) {
          if (isMounted) setLoading(false);
          return;
        }

        if (isMounted) setTargetPerfil(pData);

        // Cargar publicaciones del usuario destino
        const { data: postsData } = await supabase
          .from("publicaciones")
          .select("*, perfiles(id, nombre_completo, avatar_url, rol)")
          .eq("autor_id", pData.id)
          .order("created_at", { ascending: false });

        if (isMounted) setPosts(postsData || []);

        if (session && session.user.id !== pData.id) {
          const { data: followData } = await supabase
            .from("seguimientos")
            .select("id")
            .eq("seguidor_id", session.user.id)
            .eq("seguido_id", pData.id)
            .maybeSingle();

          if (isMounted) setIsFollowing(!!followData);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [rawUserId, session, myPerfil]);

  const handleFollow = async () => {
    if (!session) { setShowLoginModal(true); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("seguimientos").delete().eq("seguidor_id", session.user.id).eq("seguido_id", targetPerfil.id);
        setIsFollowing(false);
        setTargetPerfil(prev => ({ ...prev, seguidores_count: Math.max((prev.seguidores_count || 1) - 1, 0) }));
      } else {
        await supabase.from("seguimientos").insert({ seguidor_id: session.user.id, seguido_id: targetPerfil.id });
        setIsFollowing(true);
        setTargetPerfil(prev => ({ ...prev, seguidores_count: (prev.seguidores_count || 0) + 1 }));
      }
    } catch (err) { console.error(err); }
    finally { setFollowLoading(false); }
  };

  const handleDeletePost = async (postId) => {
    try {
      await supabase.from("publicaciones").delete().eq("id", postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) { console.error(err); }
  };

  const isOwnProfile = session?.user?.id === userId;

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
          <h3 style={{ margin: "0 0 8px", color: "var(--atlan-text-primary)" }}>Usuario no encontrado</h3>
          <Link href="/comunidad" style={{ color: "var(--atlan-gold)", fontWeight: "700" }}>← Volver a Comunidad</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--atlan-bg-primary)", fontFamily: "var(--font-outfit), system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
      {/* SVGs */}
      <img src="/images/masaaya.svg" alt="" style={{ position: "fixed", top: "80px", left: "10px", width: "340px", height: "calc(100vh - 90px)", objectFit: "contain", opacity: 0.16, pointerEvents: "none", zIndex: 0 }} />
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
            <div style={sidebarStyles.cardHeaderBanner}>
              <Icon name="map" size={16} /> Explorar
            </div>
            <div style={{ padding: "0 16px" }}>
              <Link href="/comunidad" style={sidebarStyles.exploreLink}>
                <Icon name="users" size={14} /> Muro General
              </Link>
              <Link href="/mapa" style={sidebarStyles.exploreLink}>
                <img src="/images/mapa.svg" alt="Mapa" style={{ width: "16px", height: "16px", objectFit: "contain" }} /> Mapa Turístico
              </Link>
            </div>
          </div>
        </aside>

        {/* ── CENTER COLUMN ── */}
        <main style={{ minWidth: 0, width: "100%" }}>
          {/* Target Profile Card (Solo si ves el perfil de OTRA persona) */}
          {!isOwnProfile && (
            <div style={{ background: "#FFFFFF", borderRadius: "24px", border: "2px solid rgba(255, 255, 255, 0.95)", boxShadow: "0 14px 35px rgba(0, 0, 0, 0.08)", overflow: "hidden", marginBottom: "24px" }}>
              <div style={{ height: "100px", background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)" }} />
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

          {/* Posts Feed (Con soporte completo para Videos, Fotos, Likes y Comentarios) */}
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "#FFFFFF", borderRadius: "24px", border: "1px solid rgba(20,109,158,0.08)" }}>
              <p style={{ margin: 0, color: "#64748B" }}>No hay publicaciones todavía.</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                session={session}
                perfil={myPerfil}
                lang={lang}
                onDelete={handleDeletePost}
                onRequireLogin={() => setShowLoginModal(true)}
                onImageClick={(p) => setViewerPost(p)}
              />
            ))
          )}
        </main>

        {/* ── SIDEBAR RIGHT ── */}
        <aside className="hide-mobile community-sidebar">
          <div style={sidebarStyles.sectionCard}>
            <div style={sidebarStyles.cardHeaderBanner}>
              <Icon name="search" size={16} /> Buscar
            </div>
            <div style={{ padding: "0 16px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar personas..."
                style={{ width: "100%", padding: "10px 14px", background: "rgba(20, 109, 158, 0.04)", border: "1px solid rgba(20, 109, 158, 0.10)", borderRadius: "12px", fontSize: "13px", outline: "none" }}
              />
            </div>
          </div>

          <div style={{ ...sidebarStyles.sectionCard, marginTop: "16px" }}>
            <div style={sidebarStyles.cardHeaderBanner}>
              <Icon name="sparkles" size={16} /> Personas sugeridas
            </div>
            <div style={{ padding: "0 16px" }}>
              {suggestedUsers.map((u) => (
                <UserSuggestionCard key={u.id} user={u} session={session} lang={lang} onRequireLogin={() => setShowLoginModal(true)} onFollowChange={fetchSuggestedUsers} />
              ))}
            </div>
          </div>
        </aside>

      </div>

      {/* ImageViewer Modal */}
      {viewerPost && (
        <ImageViewerModal
          post={viewerPost}
          session={session}
          perfil={myPerfil}
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
    </div>
  );
}
