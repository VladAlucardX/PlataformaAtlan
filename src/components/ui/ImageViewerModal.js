"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Icon from "@/components/ui/Icon";

/* ═══════════════════════════════════════════════════════════════════════════
   IMAGE VIEWER MODAL — Visor de imagen ampliada + hilo de comentarios
   ═══════════════════════════════════════════════════════════════════════════ */

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
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  };
}

export default function ImageViewerModal({ post, session, perfil, lang, onClose }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const commentsEndRef = useRef(null);

  const autor = post.perfiles || {};

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const { data } = await supabase
          .from("comentarios_social")
          .select("*, perfiles(id, nombre_completo, avatar_url, rol)")
          .eq("publicacion_id", post.id)
          .order("created_at", { ascending: true });
        setComments(data || []);
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [post.id]);

  // Check if liked
  useEffect(() => {
    if (!session) return;
    supabase.from("likes_social")
      .select("id")
      .eq("publicacion_id", post.id)
      .eq("usuario_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setLiked(true); });
  }, [session, post.id]);

  // Scroll to bottom when comments change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleLike = async () => {
    if (!session) return;
    try {
      if (liked) {
        await supabase.from("likes_social").delete().eq("publicacion_id", post.id).eq("usuario_id", session.user.id);
        setLiked(false);
        setLikesCount(c => Math.max(c - 1, 0));
      } else {
        await supabase.from("likes_social").insert({ publicacion_id: post.id, usuario_id: session.user.id });
        setLiked(true);
        setLikesCount(c => c + 1);
      }
    } catch (err) { console.error("Like error:", err); }
  };

  const handleSubmitComment = async () => {
    if (!session || !newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("comentarios_social")
        .insert({ publicacion_id: post.id, autor_id: session.user.id, contenido: newComment.trim() })
        .select("*, perfiles(id, nombre_completo, avatar_url, rol)")
        .single();
      if (error) throw error;
      setComments(prev => [...prev, data]);
      setNewComment("");
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm(lang === "en" ? "Delete this comment?" : "¿Eliminar este comentario?")) return;
    try {
      await supabase.from("comentarios_social").delete().eq("id", commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) { console.error("Delete comment error:", err); }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={e => e.stopPropagation()} className="animate-fade-in-up">
        {/* Close button */}
        <button onClick={onClose} style={styles.closeBtn}>✕</button>

        {/* Split layout */}
        <div style={styles.splitLayout}>
          {/* LEFT: Image */}
          <div style={styles.imageSection}>
            {post.video_url ? (
              <video
                src={post.video_url}
                controls
                playsInline
                autoPlay
                style={styles.media}
              />
            ) : (
              <img
                src={post.imagen_url}
                alt="Post"
                style={styles.media}
              />
            )}
          </div>

          {/* RIGHT: Post info + Comments */}
          <div style={styles.commentSection}>
            {/* Post author header */}
            <div style={styles.postHeader}>
              <Link href={`/comunidad/perfil/${post.autor_id}`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                <div style={avatarStyle(autor.avatar_url, 38)}>
                  {!autor.avatar_url && (autor.nombre_completo?.[0]?.toUpperCase() || "U")}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--atlan-text-primary)" }}>
                      {autor.nombre_completo || "Usuario"}
                    </span>
                    {autor.rol === "dueno" && <span style={styles.roleBadge}><Icon name="building" size={12} /></span>}
                    {autor.rol === "admin" && <span style={{ ...styles.roleBadge, background: "rgba(239,68,68,0.15)", color: "#ef4444" }}><Icon name="zap" size={12} /></span>}
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>
                    {timeAgo(post.created_at, lang)}
                  </span>
                </div>
              </Link>
            </div>

            {/* Post content */}
            {post.contenido && (
              <div style={styles.postContent}>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "var(--atlan-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {post.contenido}
                </p>
              </div>
            )}

            {/* Like bar */}
            <div style={styles.likeBar}>
              <button onClick={handleLike} style={{ ...styles.likeBtn, color: liked ? "#ef4444" : "var(--atlan-text-secondary)" }}>
                <span style={{ transition: "transform 0.2s", transform: liked ? "scale(1.2)" : "scale(1)" }}>
                  {liked ? <Icon name="heartFilled" size={18} color="#ef4444" /> : <Icon name="heart" size={18} />}
                </span>
                {likesCount > 0 && <span>{likesCount}</span>}
                <span>{lang === "en" ? (liked ? "Liked" : "Like") : (liked ? "Te gusta" : "Me gusta")}</span>
              </button>
              <span style={{ fontSize: "12px", color: "var(--atlan-text-muted)", fontWeight: "600" }}>
                <Icon name="messageCircle" size={14} /> {comments.length} {comments.length === 1 ? (lang === "en" ? "comment" : "comentario") : (lang === "en" ? "comments" : "comentarios")}
              </span>
            </div>

            {/* Comments list */}
            <div style={styles.commentsList}>
              {loadingComments ? (
                <div style={{ padding: "24px", textAlign: "center" }}>
                  <div style={{ width: "24px", height: "24px", border: "2px solid rgba(20, 109, 158, 0.10)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                </div>
              ) : comments.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center" }}>
                  <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}><Icon name="messageCircle" size={28} /></span>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--atlan-text-muted)" }}>
                    {lang === "en" ? "No comments yet. Be the first!" : "Sin comentarios aún. ¡Sé el primero!"}
                  </p>
                </div>
              ) : (
                comments.map(comment => {
                  const cAutor = comment.perfiles || {};
                  const canDelete = session?.user?.id === comment.autor_id || session?.user?.id === post.autor_id || perfil?.rol === "admin";
                  return (
                    <div key={comment.id} style={styles.commentItem}>
                      <Link href={`/comunidad/perfil/${comment.autor_id}`} style={{ textDecoration: "none" }}>
                        <div style={avatarStyle(cAutor.avatar_url, 30)}>
                          {!cAutor.avatar_url && (cAutor.nombre_completo?.[0]?.toUpperCase() || "U")}
                        </div>
                      </Link>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.commentBubble}>
                          <span style={{ fontWeight: "700", fontSize: "12px", color: "var(--atlan-text-primary)" }}>
                            {cAutor.nombre_completo || "Usuario"}
                          </span>
                          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--atlan-text-secondary)", lineHeight: "1.4", wordBreak: "break-word" }}>
                            {comment.contenido}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "3px" }}>
                          <span style={{ fontSize: "10px", color: "var(--atlan-text-muted)" }}>{timeAgo(comment.created_at, lang)}</span>
                          {canDelete && (
                            <button onClick={() => handleDeleteComment(comment.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "10px", cursor: "pointer", fontWeight: "700", padding: 0 }}>
                              {lang === "en" ? "Delete" : "Eliminar"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment input */}
            {session ? (
              <div style={styles.commentInputArea}>
                <div style={avatarStyle(perfil?.avatar_url, 30)}>
                  {!perfil?.avatar_url && (perfil?.nombre_completo?.[0]?.toUpperCase() || "U")}
                </div>
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value.slice(0, 500))}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                  placeholder={lang === "en" ? "Write a comment..." : "Escribe un comentario..."}
                  style={styles.commentInput}
                  disabled={submitting}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  style={{ ...styles.sendBtn, opacity: !newComment.trim() ? 0.4 : 1 }}
                >
                  <Icon name="send" size={16} />
                </button>
              </div>
            ) : (
              <div style={{ padding: "12px 16px", textAlign: "center", borderTop: "1px solid rgba(20, 109, 158, 0.08)" }}>
                <Link href="/login" style={{ color: "var(--atlan-gold)", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}>
                  <Icon name="lock" size={14} /> {lang === "en" ? "Sign in to comment" : "Inicia sesión para comentar"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 300,
    background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
  },
  container: {
    width: "100%", maxWidth: "1100px", maxHeight: "90vh",
    background: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    borderRadius: "28px", overflow: "hidden", position: "relative",
    boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.08), 0 32px 64px rgba(0,0,0,0.4)",
  },
  closeBtn: {
    position: "absolute", top: "12px", right: "12px", zIndex: 10,
    background: "rgba(0,0,0,0.6)", border: "none", color: "white",
    width: "36px", height: "36px", borderRadius: "50%", fontSize: "16px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(8px)",
    transition: "background 0.2s",
  },
  splitLayout: {
    display: "flex", height: "85vh", maxHeight: "85vh",
  },
  imageSection: {
    flex: "1 1 60%", background: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    minWidth: 0, overflow: "hidden",
  },
  media: {
    maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
    display: "block",
  },
  commentSection: {
    flex: "0 0 380px", display: "flex", flexDirection: "column",
    borderLeft: "1px solid rgba(20, 109, 158, 0.08)",
    background: "#FFFFFF",
    overflow: "hidden",
  },
  postHeader: {
    padding: "16px", borderBottom: "1px solid rgba(20, 109, 158, 0.08)",
    flexShrink: 0,
  },
  roleBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "18px", height: "18px", borderRadius: "5px", fontSize: "9px",
    background: "rgba(255, 215, 0,0.15)", color: "var(--atlan-gold)",
  },
  postContent: {
    padding: "12px 16px", borderBottom: "1px solid rgba(20, 109, 158, 0.08)",
    flexShrink: 0, maxHeight: "120px", overflowY: "auto",
  },
  likeBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 16px", borderBottom: "1px solid rgba(20, 109, 158, 0.08)",
    flexShrink: 0,
  },
  likeBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    background: "none", border: "none", fontSize: "13px", fontWeight: "700",
    cursor: "pointer", padding: 0,
  },
  commentsList: {
    flex: 1, overflowY: "auto", padding: "8px 12px",
  },
  commentItem: {
    display: "flex", gap: "8px", marginBottom: "10px", alignItems: "flex-start",
  },
  commentBubble: {
    background: "#F4F6F9", padding: "8px 14px", borderRadius: "0 14px 14px 14px",
    boxShadow: "inset 1px 1px 3px rgba(255, 255, 255, 0.8), inset -1px -1px 3px rgba(20, 109, 158, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
  },
  commentInputArea: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "12px 14px", borderTop: "1px solid rgba(20, 109, 158, 0.08)",
    flexShrink: 0,
  },
  commentInput: {
    flex: 1, padding: "9px 14px", background: "#F4F6F9",
    border: "1.5px solid rgba(20, 109, 158, 0.12)", borderRadius: "20px",
    color: "var(--atlan-text-primary, #1A1A2E)", fontSize: "13px", outline: "none",
    transition: "all 0.2s",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", border: "none",
    width: "34px", height: "34px", borderRadius: "50%", color: "white", fontSize: "13px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(23, 170, 74,0.25)", flexShrink: 0,
  },
};

// Add responsive override via CSS-in-JS media query
if (typeof window !== "undefined") {
  const mq = window.matchMedia("(max-width: 768px)");
  if (mq.matches) {
    styles.splitLayout.flexDirection = "column";
    styles.imageSection.flex = "0 0 auto";
    styles.imageSection.maxHeight = "45vh";
    styles.commentSection.flex = "1 1 auto";
    styles.commentSection.borderLeft = "none";
    styles.commentSection.borderTop = "1px solid rgba(20, 109, 158, 0.08)";
  }
}
