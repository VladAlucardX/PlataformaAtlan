"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Icon from "@/components/ui/Icon";

// Messenger flotante para escritorio

function timeAgo(dateStr, lang) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return lang === "en" ? "Now" : "Ahora";
  if (diffMin < 60) return lang === "en" ? `${diffMin}m` : `${diffMin}m`;
  if (diffHr < 24) return lang === "en" ? `${diffHr}h` : `${diffHr}h`;
  return lang === "en" ? `${diffDay}d` : `${diffDay}d`;
}

function avatarStyle(url, size) {
  return {
    width: `${size}px`, height: `${size}px`, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: `${Math.floor(size * 0.42)}px`, fontWeight: "800", color: "#FFFFFF",
    background: url ? `url(${url}) center/cover` : "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  };
}

export default function ChatWidget({ session, perfil, lang }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("list"); // "list" | "chat"
  const [conversaciones, setConversaciones] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  // Active chat state
  const [activeConv, setActiveConv] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const mensajesEndRef = useRef(null);
  const widgetRef = useRef(null);

  // Cargar conversaciones
  const loadConversaciones = useCallback(async () => {
    if (!session) return;
    setLoadingConvs(true);
    const myId = session.user.id;
    try {
      const { data } = await supabase
        .from("conversaciones")
        .select(`
          id, usuario_a, usuario_b, ultimo_mensaje_at,
          perfil_a:perfiles!conversaciones_usuario_a_fkey(id, nombre_completo, avatar_url, rol),
          perfil_b:perfiles!conversaciones_usuario_b_fkey(id, nombre_completo, avatar_url, rol)
        `)
        .or(`usuario_a.eq.${myId},usuario_b.eq.${myId}`)
        .order("ultimo_mensaje_at", { ascending: false });

      const enriched = await Promise.all((data || []).map(async (conv) => {
        const otherUser = conv.usuario_a === myId ? conv.perfil_b : conv.perfil_a;
        const { data: lastMsg } = await supabase
          .from("mensajes")
          .select("contenido, autor_id, created_at, imagen_url")
          .eq("conversacion_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count } = await supabase
          .from("mensajes")
          .select("id", { count: "exact", head: true })
          .eq("conversacion_id", conv.id)
          .eq("leido", false)
          .neq("autor_id", myId);

        return { ...conv, otherUser, lastMessage: lastMsg, unreadCount: count || 0 };
      }));

      setConversaciones(enriched);
      setTotalUnread(enriched.reduce((sum, c) => sum + c.unreadCount, 0));
    } catch (err) {
      console.error("ChatWidget: Error loading conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  }, [session]);

  useEffect(() => {
    if (isOpen && view === "list") loadConversaciones();
  }, [isOpen, view, loadConversaciones]);

  // Cargar mensajes del chat activo
  const loadMensajes = useCallback(async (convId) => {
    setLoadingMsgs(true);
    try {
      const { data } = await supabase
        .from("mensajes")
        .select("*")
        .eq("conversacion_id", convId)
        .order("created_at", { ascending: true })
        .limit(50);
      setMensajes(data || []);

      // Mark as read
      await supabase
        .from("mensajes")
        .update({ leido: true })
        .eq("conversacion_id", convId)
        .eq("leido", false)
        .neq("autor_id", session.user.id);
    } catch (err) {
      console.error("ChatWidget: Error loading messages:", err);
    } finally {
      setLoadingMsgs(false);
    }
  }, [session]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (view === "chat") {
      mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes, view]);

  // Suscripción en tiempo real
  useEffect(() => {
    if (!activeConv || view !== "chat") return;

    const channel = supabase
      .channel(`widget-chat-${activeConv.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "mensajes",
        filter: `conversacion_id=eq.${activeConv.id}`,
      }, (payload) => {
        const newMsg = payload.new;
        setMensajes(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        // Mark as read if from other user
        if (newMsg.autor_id !== session.user.id) {
          supabase.from("mensajes").update({ leido: true }).eq("id", newMsg.id).then();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConv, view, session]);

  // Enviar mensaje
  const handleSend = async () => {
    if (!nuevoMensaje.trim() || !activeConv || enviando) return;
    setEnviando(true);
    try {
      const { error } = await supabase.from("mensajes").insert({
        conversacion_id: activeConv.id,
        autor_id: session.user.id,
        contenido: nuevoMensaje.trim(),
      });
      if (error) throw error;

      await supabase.from("conversaciones")
        .update({ ultimo_mensaje_at: new Date().toISOString() })
        .eq("id", activeConv.id);

      setNuevoMensaje("");
    } catch (err) {
      console.error("ChatWidget: Send error:", err);
    } finally {
      setEnviando(false);
    }
  };

  // Abrir chat
  const openChat = (conv) => {
    setActiveConv(conv);
    setActiveUser(conv.otherUser);
    setView("chat");
    loadMensajes(conv.id);
  };

  const goBackToList = () => {
    setView("list");
    setActiveConv(null);
    setActiveUser(null);
    setMensajes([]);
    loadConversaciones();
  };

  // Guard: don't render if not logged in
  if (!session || !perfil) return null;

  // Render

  return (
    <div ref={widgetRef} className="hide-mobile" style={styles.wrapper}>
      {/* Floating button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={styles.fab}>
          <Icon name="messageCircle" size={24} color="#FFFFFF" />
          {totalUnread > 0 && (
            <span style={styles.badge}>{totalUnread > 9 ? "9+" : totalUnread}</span>
          )}
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div style={styles.panel}>
          {view === "list" ? (
            <>
              {/* List Header */}
              <div style={styles.panelHeader}>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
                  <Icon name="messageCircle" size={18} /> {lang === "en" ? "Messages" : "Mensajes"}
                </h4>
                <div style={{ display: "flex", gap: "6px" }}>
                  <Link href="/chat" style={styles.expandBtn} title={lang === "en" ? "Open full chat" : "Abrir chat completo"}>
                    ↗
                  </Link>
                  <button onClick={() => setIsOpen(false)} style={styles.minimizeBtn}>─</button>
                </div>
              </div>

              {/* Conversations list */}
              <div style={styles.listContainer}>
                {loadingConvs ? (
                  <div style={{ padding: "32px", textAlign: "center" }}>
                    <div style={{ width: "24px", height: "24px", border: "2px solid rgba(20, 109, 158, 0.10)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                  </div>
                ) : conversaciones.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}><Icon name="messageCircle" size={32} /></span>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--atlan-text-muted)" }}>
                      {lang === "en" ? "No conversations yet" : "Sin conversaciones aún"}
                    </p>
                  </div>
                ) : (
                  conversaciones.map(conv => {
                    const other = conv.otherUser || {};
                    const lastMsg = conv.lastMessage;
                    const hasUnread = conv.unreadCount > 0;
                    return (
                      <button key={conv.id} onClick={() => openChat(conv)} style={styles.convItem}>
                        <div style={{ position: "relative" }}>
                          <div style={avatarStyle(other.avatar_url, 42)}>
                            {!other.avatar_url && (other.nombre_completo?.[0]?.toUpperCase() || "U")}
                          </div>
                          {hasUnread && <span style={styles.onlineDot} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: hasUnread ? "800" : "600", fontSize: "13px", color: "var(--atlan-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {other.nombre_completo || "Usuario"}
                            </span>
                            {lastMsg && (
                              <span style={{ fontSize: "10px", color: "var(--atlan-text-muted)", flexShrink: 0, marginLeft: "8px" }}>
                                {timeAgo(lastMsg.created_at, lang)}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{
                              fontSize: "12px", color: hasUnread ? "var(--atlan-text-primary)" : "var(--atlan-text-muted)",
                              fontWeight: hasUnread ? "700" : "400",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                            }}>
                              {lastMsg
                                ? (lastMsg.imagen_url ? "📷 Imagen" : (lastMsg.contenido?.slice(0, 40) + (lastMsg.contenido?.length > 40 ? "..." : "")))
                                : (lang === "en" ? "Start chatting" : "Inicia la conversación")}
                            </span>
                            {hasUnread && (
                              <span style={styles.unreadBadge}>{conv.unreadCount}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <>
              {/* Chat Header */}
              <div style={styles.chatHeader}>
                <button onClick={goBackToList} style={styles.backBtn}>←</button>
                <div style={avatarStyle(activeUser?.avatar_url, 32)}>
                  {!activeUser?.avatar_url && (activeUser?.nombre_completo?.[0]?.toUpperCase() || "U")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: "800", fontSize: "13px", color: "var(--atlan-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {activeUser?.nombre_completo || "Usuario"}
                  </span>
                </div>
                <button onClick={() => setIsOpen(false)} style={styles.minimizeBtn}>─</button>
              </div>

              {/* Messages */}
              <div style={styles.messagesContainer}>
                {loadingMsgs ? (
                  <div style={{ padding: "32px", textAlign: "center" }}>
                    <div style={{ width: "24px", height: "24px", border: "2px solid rgba(20, 109, 158, 0.10)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                  </div>
                ) : mensajes.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}><Icon name="hand" size={28} /></span>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--atlan-text-muted)" }}>
                      {lang === "en" ? "Say hi!" : "¡Saluda!"}
                    </p>
                  </div>
                ) : (
                  mensajes.map(msg => {
                    const isMe = msg.autor_id === session.user.id;
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "6px" }}>
                        <div style={{
                          maxWidth: "80%", padding: "8px 14px", borderRadius: isMe ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
                          background: isMe ? "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)" : "#F8FAFC",
                          color: isMe ? "#FFFFFF" : "var(--atlan-text-primary)",
                          fontSize: "13px", lineHeight: "1.4", wordBreak: "break-word",
                          boxShadow: isMe
                            ? "0 2px 8px rgba(20, 109, 158, 0.2)"
                            : "0 2px 6px -2px rgba(15, 23, 42, 0.05)",
                          border: isMe ? "none" : "1px solid rgba(226, 232, 240, 0.8)",
                        }}>
                          {msg.imagen_url && (
                            <img src={msg.imagen_url} alt="" style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: msg.contenido ? "6px" : 0, display: "block" }} />
                          )}
                          {msg.contenido && <span style={{ whiteSpace: "pre-wrap" }}>{msg.contenido}</span>}
                          <div style={{ fontSize: "9px", marginTop: "4px", opacity: 0.6, textAlign: "right" }}>
                            {timeAgo(msg.created_at, lang)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={mensajesEndRef} />
              </div>

              {/* Input */}
              <div style={styles.inputArea}>
                <input
                  value={nuevoMensaje}
                  onChange={e => setNuevoMensaje(e.target.value.slice(0, 1000))}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={lang === "en" ? "Type a message..." : "Escribe un mensaje..."}
                  style={styles.textInput}
                  disabled={enviando}
                />
                <button
                  onClick={handleSend}
                  disabled={!nuevoMensaje.trim() || enviando}
                  style={{ ...styles.sendBtn, opacity: !nuevoMensaje.trim() ? 0.4 : 1 }}
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Estilos
const styles = {
  wrapper: {
    position: "fixed", bottom: "24px", right: "24px", zIndex: 150,
  },
  fab: {
    width: "56px", height: "56px", borderRadius: "50%",
    background: "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)",
    border: "2px solid #FFFFFF",
    color: "#FFFFFF",
    fontSize: "24px", cursor: "pointer",
    boxShadow: "0 8px 24px rgba(20, 109, 158, 0.35)",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", transition: "all 0.2s ease",
  },
  badge: {
    position: "absolute", top: "-4px", right: "-4px",
    minWidth: "22px", height: "22px", borderRadius: "11px",
    background: "#ef4444", color: "white", fontSize: "11px", fontWeight: "800",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 5px", border: "2px solid #FFFFFF",
    boxShadow: "0 4px 8px rgba(239, 68, 68, 0.3)",
  },
  panel: {
    width: "360px", height: "480px",
    background: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    borderRadius: "24px", overflow: "hidden",
    boxShadow: `
      inset 4px 4px 10px rgba(255, 255, 255, 1),
      inset -6px -6px 14px rgba(20, 109, 158, 0.08),
      0 20px 48px -6px rgba(20, 109, 158, 0.16),
      0 4px 12px rgba(0, 0, 0, 0.04)
    `,
    display: "flex", flexDirection: "column",
  },
  panelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 18px", borderBottom: "1px solid rgba(20, 109, 158, 0.08)",
    flexShrink: 0,
  },
  expandBtn: {
    background: "rgba(20, 109, 158, 0.08)", border: "none",
    width: "28px", height: "28px", borderRadius: "8px",
    color: "var(--atlan-text-secondary)", fontSize: "14px", fontWeight: "800",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    textDecoration: "none",
  },
  minimizeBtn: {
    background: "rgba(20, 109, 158, 0.08)", border: "none",
    width: "28px", height: "28px", borderRadius: "8px",
    color: "var(--atlan-text-secondary)", fontSize: "14px", fontWeight: "800",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },
  listContainer: {
    flex: 1, overflowY: "auto",
  },
  convItem: {
    display: "flex", alignItems: "center", gap: "12px", width: "100%",
    padding: "12px 16px", background: "none", border: "none",
    borderBottom: "1px solid rgba(20, 109, 158, 0.04)",
    cursor: "pointer", transition: "background 0.15s", textAlign: "left",
  },
  onlineDot: {
    position: "absolute", bottom: "0", right: "0",
    width: "12px", height: "12px", borderRadius: "50%",
    background: "#17AA4A", border: "2px solid var(--atlan-bg-card)",
  },
  unreadBadge: {
    minWidth: "18px", height: "18px", borderRadius: "9px",
    background: "var(--atlan-gold)", color: "#FFFFFF", fontSize: "10px", fontWeight: "800",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 4px", flexShrink: 0,
  },
  chatHeader: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "12px 14px", borderBottom: "1px solid rgba(20, 109, 158, 0.08)",
    flexShrink: 0,
  },
  backBtn: {
    background: "rgba(20, 109, 158, 0.08)", border: "none",
    width: "28px", height: "28px", borderRadius: "8px",
    color: "var(--atlan-text-secondary)", fontSize: "14px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },
  messagesContainer: {
    flex: 1, overflowY: "auto", padding: "12px 14px",
  },
  inputArea: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "10px 14px", borderTop: "1px solid rgba(20, 109, 158, 0.08)",
    flexShrink: 0,
  },
  textInput: {
    flex: 1, padding: "9px 14px", background: "#F4F6F9",
    border: "1.5px solid rgba(20, 109, 158, 0.12)", borderRadius: "20px",
    color: "var(--atlan-text-primary, #1A1A2E)", fontSize: "13px", outline: "none",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
    transition: "all 0.2s",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)", border: "none",
    width: "34px", height: "34px", borderRadius: "50%", color: "white", fontSize: "13px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(23, 170, 74,0.25)", flexShrink: 0,
  },
};
