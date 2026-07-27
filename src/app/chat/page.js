"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadMedia } from "@/lib/storage";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import Navbar from "@/components/ui/Navbar";

// Chat entre seguidores mutuos

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

function ChatContent() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("user");

  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  // Conversaciones
  const [conversaciones, setConversaciones] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [activeOtherUser, setActiveOtherUser] = useState(null);

  // Mensajes
  const [mensajes, setMensajes] = useState([]);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const mensajesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Nuevo chat modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const [loadingMutuals, setLoadingMutuals] = useState(false);
  const [searchMutual, setSearchMutual] = useState("");

  // Mobile: show chat view
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Image attachment in chat
  const [chatImageFile, setChatImageFile] = useState(null);
  const [chatImagePreview, setChatImagePreview] = useState(null);
  const chatImageRef = useRef(null);

  // Unread counts
  const [unreadCounts, setUnreadCounts] = useState({});

  // ── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!s) { router.push("/login"); return; }
        setSession(s);
        const { data: p } = await supabase.from("perfiles").select("*").eq("id", s.user.id).single();
        setPerfil(p);
      } catch (err) {
        console.error("Auth error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  // ── Load conversations ─────────────────────────────────────────────────
  const loadConversaciones = useCallback(async () => {
    if (!session) return;
    const myId = session.user.id;

    const { data, error } = await supabase
      .from("conversaciones")
      .select(`
        id, usuario_a, usuario_b, ultimo_mensaje_at,
        perfil_a:perfiles!conversaciones_usuario_a_fkey(id, nombre_completo, avatar_url, rol),
        perfil_b:perfiles!conversaciones_usuario_b_fkey(id, nombre_completo, avatar_url, rol)
      `)
      .or(`usuario_a.eq.${myId},usuario_b.eq.${myId}`)
      .order("ultimo_mensaje_at", { ascending: false });

    if (error) { console.error("Error loading conversations:", error); return; }

    // Enrich with last message preview
    const enriched = await Promise.all((data || []).map(async (conv) => {
      const otherUser = conv.usuario_a === myId ? conv.perfil_b : conv.perfil_a;
      const { data: lastMsg } = await supabase
        .from("mensajes")
        .select("contenido, autor_id, created_at, imagen_url")
        .eq("conversacion_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Unread count
      const { count } = await supabase
        .from("mensajes")
        .select("id", { count: "exact", head: true })
        .eq("conversacion_id", conv.id)
        .eq("leido", false)
        .neq("autor_id", myId);

      return { ...conv, otherUser, lastMessage: lastMsg, unreadCount: count || 0 };
    }));

    setConversaciones(enriched);

    // Build unread map
    const uc = {};
    enriched.forEach(c => { uc[c.id] = c.unreadCount; });
    setUnreadCounts(uc);
  }, [session]);

  useEffect(() => { if (session) loadConversaciones(); }, [session, loadConversaciones]);

  // ── Handle deep link: ?user=UUID ───────────────────────────────────────
  useEffect(() => {
    if (!targetUserId || !session) return;
    const openChatWithUser = async () => {
      try {
        const { data: convId, error } = await supabase.rpc("obtener_o_crear_conversacion", { otro_usuario_id: targetUserId });
        if (error) {
          alert(lang === "en" ? "Both users must follow each other to chat" : "Ambos deben seguirse para chatear");
          return;
        }
        await loadConversaciones();
        // Find the conversation and open it
        const { data: conv } = await supabase
          .from("conversaciones")
          .select(`
            id, usuario_a, usuario_b,
            perfil_a:perfiles!conversaciones_usuario_a_fkey(id, nombre_completo, avatar_url, rol),
            perfil_b:perfiles!conversaciones_usuario_b_fkey(id, nombre_completo, avatar_url, rol)
          `)
          .eq("id", convId)
          .single();

        if (conv) {
          const otherUser = conv.usuario_a === session.user.id ? conv.perfil_b : conv.perfil_a;
          setActiveConv(conv);
          setActiveOtherUser(otherUser);
          setMobileShowChat(true);
        }
      } catch (err) {
        console.error("Deep link chat error:", err);
      }
    };
    openChatWithUser();
  }, [targetUserId, session, lang, loadConversaciones]);

  // ── Load messages for active conversation ──────────────────────────────
  useEffect(() => {
    if (!activeConv) return;
    const loadMensajes = async () => {
      setLoadingMensajes(true);
      const { data } = await supabase
        .from("mensajes")
        .select("*")
        .eq("conversacion_id", activeConv.id)
        .order("created_at", { ascending: true });
      setMensajes(data || []);
      setLoadingMensajes(false);

      // Mark unread messages as read
      if (session) {
        await supabase
          .from("mensajes")
          .update({ leido: true })
          .eq("conversacion_id", activeConv.id)
          .eq("leido", false)
          .neq("autor_id", session.user.id);
        
        setUnreadCounts(prev => ({ ...prev, [activeConv.id]: 0 }));
      }
    };
    loadMensajes();
  }, [activeConv, session]);

  // ── Realtime subscription ──────────────────────────────────────────────
  useEffect(() => {
    if (!activeConv) return;
    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`chat-${activeConv.id}-${channelId}`)
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
        // Mark as read if from the other user
        if (session && newMsg.autor_id !== session.user.id) {
          supabase.from("mensajes").update({ leido: true }).eq("id", newMsg.id).then();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConv, session]);

  // ── Auto-scroll to bottom ──────────────────────────────────────────────
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes]);

  // ── Send message ───────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!activeConv || !session) return;
    if (!nuevoMensaje.trim() && !chatImageFile) return;
    setEnviando(true);
    try {
      let imgUrl = null;
      if (chatImageFile) {
        imgUrl = await uploadMedia(chatImageFile, "chat");
      }
      const { error } = await supabase.from("mensajes").insert({
        conversacion_id: activeConv.id,
        autor_id: session.user.id,
        contenido: nuevoMensaje.trim(),
        imagen_url: imgUrl,
      });
      if (error) throw error;

      // Update ultimo_mensaje_at
      await supabase.from("conversaciones").update({ ultimo_mensaje_at: new Date().toISOString() }).eq("id", activeConv.id);

      setNuevoMensaje("");
      setChatImageFile(null);
      setChatImagePreview(null);
    } catch (err) {
      console.error("Send message error:", err);
      alert(lang === "en" ? "Error sending message" : "Error al enviar mensaje");
    } finally {
      setEnviando(false);
    }
  };

  // ── Load mutual followers for new chat ─────────────────────────────────
  const loadMutualFollowers = async () => {
    if (!session) return;
    setLoadingMutuals(true);
    try {
      // Get users I follow
      const { data: iFollow } = await supabase
        .from("seguimientos")
        .select("seguido_id")
        .eq("seguidor_id", session.user.id);
      const iFollowIds = (iFollow || []).map(f => f.seguido_id);

      if (iFollowIds.length === 0) {
        setMutualFollowers([]);
        setLoadingMutuals(false);
        return;
      }

      // Get users that follow me back (mutual)
      const { data: followMeBack } = await supabase
        .from("seguimientos")
        .select("seguidor_id")
        .eq("seguido_id", session.user.id)
        .in("seguidor_id", iFollowIds);
      const mutualIds = (followMeBack || []).map(f => f.seguidor_id);

      if (mutualIds.length === 0) {
        setMutualFollowers([]);
        setLoadingMutuals(false);
        return;
      }

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("perfiles")
        .select("id, nombre_completo, avatar_url, rol")
        .in("id", mutualIds);
      setMutualFollowers(profiles || []);
    } catch (err) {
      console.error("Error loading mutual followers:", err);
    } finally {
      setLoadingMutuals(false);
    }
  };

  const handleStartChat = async (otherUserId) => {
    try {
      const { data: convId, error } = await supabase.rpc("obtener_o_crear_conversacion", { otro_usuario_id: otherUserId });
      if (error) throw error;
      setShowNewChatModal(false);
      await loadConversaciones();

      const { data: conv } = await supabase
        .from("conversaciones")
        .select(`
          id, usuario_a, usuario_b,
          perfil_a:perfiles!conversaciones_usuario_a_fkey(id, nombre_completo, avatar_url, rol),
          perfil_b:perfiles!conversaciones_usuario_b_fkey(id, nombre_completo, avatar_url, rol)
        `)
        .eq("id", convId)
        .single();
      if (conv) {
        const otherUser = conv.usuario_a === session.user.id ? conv.perfil_b : conv.perfil_a;
        setActiveConv(conv);
        setActiveOtherUser(otherUser);
        setMobileShowChat(true);
      }
    } catch (err) {
      console.error("Start chat error:", err);
      alert(lang === "en" ? "Error starting chat" : "Error al iniciar chat");
    }
  };

  const handleChatImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setChatImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setChatImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const selectConversation = (conv) => {
    const myId = session.user.id;
    const otherUser = conv.usuario_a === myId ? conv.perfil_b : conv.perfil_a;
    if (!otherUser) {
      const ou = conv.otherUser;
      setActiveOtherUser(ou);
    } else {
      setActiveOtherUser(otherUser);
    }
    setActiveConv(conv);
    setMobileShowChat(true);
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // ── Loading & Auth guard ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--atlan-bg-primary)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid rgba(20, 109, 158, 0.12)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "14px", color: "var(--atlan-text-muted)" }}>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const filteredMutuals = mutualFollowers.filter(u =>
    !searchMutual || u.nombre_completo?.toLowerCase().includes(searchMutual.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--atlan-bg-primary)",
      fontFamily: "var(--font-outfit), system-ui, sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Fondo en 3 columnas con difuminado únicamente en las líneas de conexión */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(to right, #146D9E 0%, #146D9E 28%, #17AA4A 38%, #17AA4A 62%, #FFD700 72%, #FFD700 100%)",
        zIndex: 0,
        pointerEvents: "none"
      }} />

      {/* Navbar */}
      <Navbar activePage="chat" session={session} perfil={perfil} onLogout={handleLogout} />

      {/* Chat Layout */}
      <div style={{ ...chatLayoutStyles.container, position: "relative", zIndex: 1 }} className="chat-container">

        {/* ── LEFT: Conversation List ── */}
        <div style={chatLayoutStyles.sidebar} className={`chat-sidebar ${mobileShowChat ? "hide-mobile" : ""}`}>
          {/* Header */}
          <div style={chatLayoutStyles.sidebarHeader}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
              💬 {t("chat.title")}
            </h2>
            <button
              onClick={() => { setShowNewChatModal(true); loadMutualFollowers(); }}
              style={chatLayoutStyles.newChatBtn}
            >
              + {t("chat.newChat")}
            </button>
          </div>

          {/* Conversation list */}
          <div style={chatLayoutStyles.convList}>
            {conversaciones.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>💬</span>
                <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "var(--atlan-text-primary)" }}>
                  {t("chat.noConversations")}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--atlan-text-muted)", lineHeight: "1.5" }}>
                  {t("chat.noConversationsDesc")}
                </p>
              </div>
            ) : (
              conversaciones.map(conv => {
                const isActive = activeConv?.id === conv.id;
                const ou = conv.otherUser;
                const unread = unreadCounts[conv.id] || 0;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    style={{
                      ...chatLayoutStyles.convItem,
                      background: isActive ? "rgba(255, 215, 0,0.08)" : "transparent",
                      borderLeft: isActive ? "3px solid var(--atlan-gold)" : "3px solid transparent",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <div style={avatarStyle(ou?.avatar_url, 44)}>
                        {!ou?.avatar_url && (ou?.nombre_completo?.[0]?.toUpperCase() || "U")}
                      </div>
                      {unread > 0 && (
                        <div style={{
                          position: "absolute", top: "-2px", right: "-2px", width: "12px", height: "12px",
                          borderRadius: "50%", background: "#3b82f6", border: "2px solid var(--atlan-bg-primary)",
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: unread > 0 ? "800" : "600", fontSize: "14px", color: "var(--atlan-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ou?.nombre_completo || "Usuario"}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--atlan-text-muted)", flexShrink: 0, marginLeft: "8px" }}>
                          {conv.lastMessage ? timeAgo(conv.lastMessage.created_at, lang) : ""}
                        </span>
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: unread > 0 ? "var(--atlan-text-primary)" : "var(--atlan-text-muted)", fontWeight: unread > 0 ? "600" : "400", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {conv.lastMessage
                          ? (conv.lastMessage.imagen_url ? "📷 " : "") + (conv.lastMessage.contenido || (lang === "en" ? "Image" : "Imagen"))
                          : (lang === "en" ? "Send the first message!" : "¡Envía el primer mensaje!")
                        }
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: Active Chat ── */}
        <div style={chatLayoutStyles.chatArea} className={`chat-area ${!mobileShowChat ? "hide-mobile" : ""}`}>
          {activeConv && activeOtherUser ? (
            <>
              {/* Chat header */}
              <div style={chatLayoutStyles.chatHeader}>
                <button
                  onClick={() => { setMobileShowChat(false); setActiveConv(null); }}
                  style={{ background: "none", border: "none", color: "var(--atlan-text-secondary)", fontSize: "16px", cursor: "pointer", padding: "4px 8px", marginRight: "8px" }}
                  className="hide-desktop"
                >
                  ←
                </button>
                <Link href={`/comunidad/perfil/${activeOtherUser.id}`} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", flex: 1 }}>
                  <div style={avatarStyle(activeOtherUser.avatar_url, 40)}>
                    {!activeOtherUser.avatar_url && (activeOtherUser.nombre_completo?.[0]?.toUpperCase() || "U")}
                  </div>
                  <div>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "var(--atlan-text-primary)" }}>
                      {activeOtherUser.nombre_completo || "Usuario"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>
                      {activeOtherUser.rol === "dueno" ? "🏢 Propietario" : "🧳 Turista"}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} style={chatLayoutStyles.messagesContainer}>
                {loadingMensajes ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ width: "30px", height: "30px", border: "2px solid rgba(20, 109, 158, 0.12)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                  </div>
                ) : mensajes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 24px" }}>
                    <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>👋</span>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--atlan-text-muted)" }}>
                      {t("chat.startChatting")}
                    </p>
                  </div>
                ) : (
                  mensajes.map(msg => {
                    const isMine = msg.autor_id === session.user.id;
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: "8px", padding: "0 16px" }}>
                        <div style={{
                          maxWidth: "75%",
                          padding: msg.imagen_url ? "4px" : "10px 16px",
                          borderRadius: isMine ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                          background: isMine
                            ? "linear-gradient(145deg, #1C92D2 0%, #146D9E 100%)"
                            : "#F4F6F9",
                          color: isMine ? "white" : "var(--atlan-text-primary)",
                          boxShadow: isMine
                            ? "inset 2px 2px 5px rgba(255, 255, 255, 0.25), inset -3px -3px 6px rgba(10, 50, 80, 0.25), 0 6px 14px -3px rgba(20, 109, 158, 0.30)"
                            : "inset 2px 2px 5px rgba(255, 255, 255, 1), inset -3px -3px 6px rgba(20, 109, 158, 0.05), 0 4px 10px -3px rgba(20, 109, 158, 0.08)",
                          border: isMine ? "1.5px solid rgba(255, 255, 255, 0.2)" : "1.5px solid rgba(255, 255, 255, 0.9)",
                        }}>
                          {msg.imagen_url && (
                            <img
                              src={msg.imagen_url}
                              alt="Attachment"
                              style={{ width: "100%", maxWidth: "280px", borderRadius: msg.contenido ? "12px 12px 4px 4px" : "12px", display: "block", marginBottom: msg.contenido ? "6px" : 0 }}
                              loading="lazy"
                            />
                          )}
                          {msg.contenido && (
                            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5", wordBreak: "break-word", padding: msg.imagen_url ? "4px 10px 6px" : 0 }}>
                              {msg.contenido}
                            </p>
                          )}
                          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "4px", marginTop: "4px", padding: msg.imagen_url && !msg.contenido ? "0 8px 4px" : 0 }}>
                            <span style={{ fontSize: "10px", opacity: 0.7 }}>
                              {timeAgo(msg.created_at, lang)}
                            </span>
                            {isMine && (
                              <span style={{ fontSize: "10px", opacity: 0.7 }}>
                                {msg.leido ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={mensajesEndRef} />
              </div>

              {/* Chat image preview */}
              {chatImagePreview && (
                <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(20, 109, 158, 0.08)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ position: "relative" }}>
                    <img src={chatImagePreview} alt="Preview" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />
                    <button
                      onClick={() => { setChatImageFile(null); setChatImagePreview(null); }}
                      style={{ position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", borderRadius: "50%", background: "rgba(239,68,68,0.9)", border: "none", color: "#1A1A2E", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >✕</button>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--atlan-text-muted)" }}>{lang === "en" ? "Image attached" : "Imagen adjuntada"}</span>
                </div>
              )}

              {/* Input bar */}
              <div style={chatLayoutStyles.inputBar}>
                <input type="file" ref={chatImageRef} accept="image/*" onChange={handleChatImageChange} style={{ display: "none" }} />
                <button
                  onClick={() => chatImageRef.current?.click()}
                  style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", padding: "6px", color: "var(--atlan-text-secondary)" }}
                >
                  📷
                </button>
                <input
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder={t("chat.typeMessage")}
                  disabled={enviando}
                  style={{ ...chatLayoutStyles.messageInput, background: "#e0e5ec", boxShadow: "inset 5px 5px 10px #bebebe, inset -5px -5px 10px #ffffff", border: "none" }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={enviando || (!nuevoMensaje.trim() && !chatImageFile)}
                  style={{
                    ...chatLayoutStyles.sendBtn,
                    opacity: enviando || (!nuevoMensaje.trim() && !chatImageFile) ? 0.4 : 1,
                    boxShadow: "5px 5px 10px #bebebe, -5px -5px 10px #ffffff"
                  }}
                >
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px" }}>
              <span style={{ fontSize: "64px", marginBottom: "16px" }}>💬</span>
              <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
                {t("chat.selectConversation")}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--atlan-text-muted)", textAlign: "center", maxWidth: "300px" }}>
                {t("chat.selectConversationDesc")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0, 0, 0, 0.40)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={() => setShowNewChatModal(false)}>
          <div style={{ maxWidth: "420px", width: "100%", maxHeight: "70vh", background: "var(--atlan-bg-card)", border: "1px solid rgba(20, 109, 158, 0.12)", borderRadius: "20px", padding: "24px", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()} className="animate-fade-in-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
                ✨ {t("chat.newChat")}
              </h3>
              <button onClick={() => setShowNewChatModal(false)} style={{ background: "rgba(20, 109, 158, 0.08)", border: "none", color: "var(--atlan-text-muted)", width: "32px", height: "32px", borderRadius: "50%", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            <input
              value={searchMutual}
              onChange={(e) => setSearchMutual(e.target.value)}
              placeholder={lang === "en" ? "Search..." : "Buscar..."}
              style={{ width: "100%", padding: "10px 14px", background: "rgba(20, 109, 158, 0.04)", border: "1px solid rgba(20, 109, 158, 0.10)", borderRadius: "12px", color: "var(--atlan-text-primary)", fontSize: "13px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
            />

            <div style={{ flex: 1, overflowY: "auto" }}>
              {loadingMutuals ? (
                <div style={{ textAlign: "center", padding: "30px" }}>
                  <div style={{ width: "30px", height: "30px", border: "2px solid rgba(20, 109, 158, 0.12)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                </div>
              ) : filteredMutuals.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px" }}>
                  <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>🤝</span>
                  <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: "var(--atlan-text-primary)" }}>
                    {t("chat.noMutualFollows")}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--atlan-text-muted)", lineHeight: "1.5" }}>
                    {t("chat.noMutualFollowsDesc")}
                  </p>
                </div>
              ) : (
                filteredMutuals.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleStartChat(u.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px", width: "100%",
                      padding: "12px", background: "none", border: "none", borderBottom: "1px solid rgba(20, 109, 158, 0.04)",
                      cursor: "pointer", transition: "background 0.15s", textAlign: "left",
                    }}
                  >
                    <div style={avatarStyle(u.avatar_url, 40)}>
                      {!u.avatar_url && (u.nombre_completo?.[0]?.toUpperCase() || "U")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--atlan-text-primary)" }}>{u.nombre_completo}</div>
                      <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>
                        {u.rol === "dueno" ? "🏢 Propietario" : "🧳 Turista"}
                      </div>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--atlan-gold)", fontWeight: "800" }}>💬</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos
const chatLayoutStyles = {
  container: {
    maxWidth: "1100px",
    margin: "84px auto 24px",
    height: "calc(100vh - 110px)",
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    borderRadius: "24px",
    background: "#FFFFFF",
    boxShadow: "inset 4px 4px 10px rgba(255, 255, 255, 1), inset -6px -6px 14px rgba(20, 109, 158, 0.08), 0 20px 48px -6px rgba(20, 109, 158, 0.16), 0 4px 12px rgba(0, 0, 0, 0.04)",
    overflow: "hidden",
  },
  sidebar: {
    borderRight: "1px solid rgba(20, 109, 158, 0.10)",
    display: "flex",
    flexDirection: "column",
    background: "#F8FAFC",
    overflow: "hidden",
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 20px 16px",
    borderBottom: "1px solid rgba(20, 109, 158, 0.10)",
  },
  newChatBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #FFD700 0%, #E6C200 100%)",
    border: "none",
    borderRadius: "10px",
    color: "#1A1A2E",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(255, 215, 0, 0.3)",
  },
  convList: {
    flex: 1,
    overflowY: "auto",
  },
  convItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "14px 16px",
    border: "none",
    cursor: "pointer",
    transition: "background 0.15s",
    borderBottom: "1px solid rgba(20, 109, 158, 0.03)",
  },
  chatArea: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "var(--atlan-bg-primary)",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: "1px solid rgba(20, 109, 158, 0.08)",
    background: "rgba(255,255,255,0.02)",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 0",
  },
  inputBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    borderTop: "1px solid rgba(20, 109, 158, 0.08)",
    background: "rgba(255,255,255,0.02)",
  },
  messageInput: {
    flex: 1,
    padding: "12px 18px",
    background: "#F4F6F9",
    border: "1.5px solid rgba(20, 109, 158, 0.12)",
    borderRadius: "24px",
    color: "var(--atlan-text-primary)",
    fontSize: "14px",
    outline: "none",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
    boxShadow: "inset 2px 2px 4px rgba(20, 109, 158, 0.04), inset -1px -1px 3px rgba(255, 255, 255, 0.8)",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)",
    border: "none",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(23, 170, 74,0.25)",
    flexShrink: 0,
  },
};

export default function ChatPage() {
  return (
    <React.Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--atlan-bg-primary)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(20, 109, 158, 0.12)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <ChatContent />
    </React.Suspense>
  );
}
