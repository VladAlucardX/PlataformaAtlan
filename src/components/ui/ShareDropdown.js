"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Icon from "@/components/ui/Icon";

// Opciones de compartir publicación

function avatarStyle(url, size) {
  return {
    width: `${size}px`, height: `${size}px`, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: `${Math.floor(size * 0.42)}px`, fontWeight: "800", color: "#FFFFFF",
    background: url ? `url(${url}) center/cover` : "linear-gradient(135deg, #FFD700 0%, #FFDF33 100%)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  };
}

export default function ShareDropdown({ post, session, perfil, lang, onRequireLogin, onRepost }) {
  const [open, setOpen] = useState(false);
  const [showSendChat, setShowSendChat] = useState(false);
  const [mutuals, setMutuals] = useState([]);
  const [loadingMutuals, setLoadingMutuals] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setShowSendChat(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Show toast helper
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Copy link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/comunidad?post=${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast(lang === "en" ? "Link copied!" : "¡Enlace copiado!");
    }).catch(() => {
      showToast(lang === "en" ? "Could not copy" : "No se pudo copiar");
    });
    setOpen(false);
  };

  // Repost
  const handleRepost = async () => {
    if (!session) { onRequireLogin(); setOpen(false); return; }
    try {
      const contenido = post.contenido
        ? `🔁 ${post.perfiles?.nombre_completo || "Usuario"}:\n\n${post.contenido}`
        : `🔁 ${lang === "en" ? "Shared a post from" : "Compartió una publicación de"} ${post.perfiles?.nombre_completo || "Usuario"}`;

      const { data, error } = await supabase.from("publicaciones").insert({
        autor_id: session.user.id,
        contenido,
        imagen_url: post.imagen_url || null,
        video_url: post.video_url || null,
        tipo_media: post.tipo_media || "none",
        es_promocion: false,
        es_publicidad: false,
      }).select("*, perfiles(id, nombre_completo, avatar_url, rol)").single();

      if (error) throw error;
      if (onRepost) onRepost(data);
      showToast(lang === "en" ? "Shared to your feed!" : "¡Compartido en tu muro!");
    } catch (err) {
      console.error("Repost error:", err);
      showToast(lang === "en" ? "Failed to share" : "Error al compartir");
    }
    setOpen(false);
  };

  // Load mutual followers for sending via chat
  const loadMutuals = async () => {
    if (!session) return;
    setLoadingMutuals(true);
    try {
      // People I follow
      const { data: iFollow } = await supabase
        .from("seguimientos")
        .select("seguido_id")
        .eq("seguidor_id", session.user.id);
      const iFollowIds = (iFollow || []).map(f => f.seguido_id);

      if (iFollowIds.length === 0) { setMutuals([]); setLoadingMutuals(false); return; }

      // Of those, who follows me back (mutual)
      const { data: followMeBack } = await supabase
        .from("seguimientos")
        .select("seguidor_id")
        .eq("seguido_id", session.user.id)
        .in("seguidor_id", iFollowIds);

      const mutualIds = (followMeBack || []).map(f => f.seguidor_id);
      if (mutualIds.length === 0) { setMutuals([]); setLoadingMutuals(false); return; }

      const { data: profiles } = await supabase
        .from("perfiles")
        .select("id, nombre_completo, avatar_url, rol")
        .in("id", mutualIds);

      setMutuals(profiles || []);
    } catch (err) {
      console.error("Load mutuals error:", err);
    } finally {
      setLoadingMutuals(false);
    }
  };

  const handleOpenSendChat = () => {
    if (!session) { onRequireLogin(); setOpen(false); return; }
    setShowSendChat(true);
    loadMutuals();
  };

  // Send post link via chat
  const handleSendToUser = async (targetUser) => {
    if (!session) return;
    setSendingTo(targetUser.id);
    try {
      const myId = session.user.id;
      const otherId = targetUser.id;

      // Find or create conversation
      const { data: existing } = await supabase
        .from("conversaciones")
        .select("id")
        .or(`and(usuario_a.eq.${myId},usuario_b.eq.${otherId}),and(usuario_a.eq.${otherId},usuario_b.eq.${myId})`)
        .maybeSingle();

      let convId;
      if (existing) {
        convId = existing.id;
      } else {
        const { data: newConv, error: convError } = await supabase
          .from("conversaciones")
          .insert({ usuario_a: myId, usuario_b: otherId })
          .select("id")
          .single();
        if (convError) throw convError;
        convId = newConv.id;
      }

      // Send message with post link
      const postUrl = `${window.location.origin}/comunidad?post=${post.id}`;
      const msgContent = post.contenido
        ? `📤 ${lang === "en" ? "Shared a post" : "Te compartió una publicación"}:\n\n"${post.contenido.slice(0, 100)}${post.contenido.length > 100 ? "..." : ""}"\n\n${postUrl}`
        : `📤 ${lang === "en" ? "Shared a post" : "Te compartió una publicación"}: ${postUrl}`;

      const { error: msgError } = await supabase.from("mensajes").insert({
        conversacion_id: convId,
        autor_id: myId,
        contenido: msgContent,
      });
      if (msgError) throw msgError;

      // Update conversation timestamp
      await supabase.from("conversaciones").update({ ultimo_mensaje_at: new Date().toISOString() }).eq("id", convId);

      showToast(lang === "en" ? `Sent to ${targetUser.nombre_completo}!` : `¡Enviado a ${targetUser.nombre_completo}!`);
      setOpen(false);
      setShowSendChat(false);
    } catch (err) {
      console.error("Send chat error:", err);
      showToast(lang === "en" ? "Failed to send" : "Error al enviar");
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(!open); setShowSendChat(false); }}
        style={styles.actionBtn}
      >
        <Icon name="share2" size={14} /> {lang === "en" ? "Share" : "Compartir"}
      </button>

      {open && (
        <div style={styles.dropdown} className="animate-fade-in-up">
          {!showSendChat ? (
            <>
              <button onClick={handleCopyLink} style={styles.dropdownItem}>
                <span style={styles.dropdownIcon}><Icon name="link" size={16} /></span>
                {lang === "en" ? "Copy link" : "Copiar enlace"}
              </button>
              <button onClick={handleRepost} style={styles.dropdownItem}>
                <span style={styles.dropdownIcon}><Icon name="share2" size={16} /></span>
                {lang === "en" ? "Share to my feed" : "Compartir en mi muro"}
              </button>
              <div style={styles.dropdownDivider} />
              <button onClick={handleOpenSendChat} style={styles.dropdownItem}>
                <span style={styles.dropdownIcon}><Icon name="messageCircle" size={16} /></span>
                {lang === "en" ? "Send via chat" : "Enviar por chat"}
              </button>
            </>
          ) : (
            <>
              <div style={styles.sendChatHeader}>
                <button onClick={() => setShowSendChat(false)} style={styles.backBtn}>←</button>
                <span style={{ fontWeight: "800", fontSize: "13px", color: "var(--atlan-text-primary)" }}>
                  {lang === "en" ? "Send to..." : "Enviar a..."}
                </span>
              </div>
              <div style={styles.mutualsList}>
                {loadingMutuals ? (
                  <div style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ width: "20px", height: "20px", border: "2px solid rgba(20, 109, 158, 0.10)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                  </div>
                ) : mutuals.length === 0 ? (
                  <p style={{ margin: 0, padding: "16px", fontSize: "12px", color: "var(--atlan-text-muted)", textAlign: "center" }}>
                    {lang === "en" ? "No mutual followers to send to" : "No tienes seguidores mutuos"}
                  </p>
                ) : (
                  mutuals.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleSendToUser(u)}
                      disabled={sendingTo === u.id}
                      style={styles.mutualItem}
                    >
                      <div style={avatarStyle(u.avatar_url, 32)}>
                        {!u.avatar_url && (u.nombre_completo?.[0]?.toUpperCase() || "U")}
                      </div>
                      <span style={{ flex: 1, fontSize: "13px", fontWeight: "700", color: "var(--atlan-text-primary)", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.nombre_completo || "Usuario"}
                      </span>
                      <span style={{ fontSize: "12px", color: sendingTo === u.id ? "var(--atlan-gold)" : "var(--atlan-text-muted)" }}>
                        {sendingTo === u.id ? "⏳" : "➤"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={styles.toast} className="animate-fade-in-up">
          ✅ {toast}
        </div>
      )}
    </div>
  );
}

// Estilos
const styles = {
  actionBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    padding: "8px 0", background: "none", border: "none",
    color: "var(--atlan-text-secondary)", fontSize: "13px", fontWeight: "700",
    cursor: "pointer", borderRadius: "10px", transition: "all 0.2s",
  },
  dropdown: {
    position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
    marginBottom: "8px", zIndex: 60,
    background: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    borderRadius: "20px", padding: "6px", minWidth: "200px",
    boxShadow: "inset 3px 3px 8px rgba(255, 255, 255, 1), inset -4px -4px 10px rgba(20, 109, 158, 0.06), 0 20px 48px -8px rgba(20, 109, 158, 0.18), 0 6px 16px rgba(0, 0, 0, 0.04)",
  },
  dropdownItem: {
    display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 14px",
    background: "none", border: "none", color: "var(--atlan-text-secondary)", fontSize: "13px",
    fontWeight: "600", cursor: "pointer", borderRadius: "10px", transition: "background 0.15s",
    textAlign: "left",
  },
  dropdownIcon: {
    fontSize: "15px", width: "20px", textAlign: "center",
  },
  dropdownDivider: {
    height: "1px", background: "rgba(20, 109, 158, 0.08)", margin: "4px 8px",
  },
  sendChatHeader: {
    display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px",
    borderBottom: "1px solid rgba(20, 109, 158, 0.08)", marginBottom: "4px",
  },
  backBtn: {
    background: "none", border: "none", color: "var(--atlan-text-secondary)",
    fontSize: "16px", cursor: "pointer", padding: "2px 6px", borderRadius: "6px",
  },
  mutualsList: {
    maxHeight: "220px", overflowY: "auto",
  },
  mutualItem: {
    display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 12px",
    background: "none", border: "none", cursor: "pointer", borderRadius: "8px",
    transition: "background 0.15s",
  },
  toast: {
    position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
    zIndex: 999, padding: "12px 24px",
    background: "rgba(23, 170, 74, 0.95)", color: "white",
    borderRadius: "12px", fontSize: "14px", fontWeight: "800",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.10)",
    pointerEvents: "none",
  },
};
