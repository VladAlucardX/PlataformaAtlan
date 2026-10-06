"use client";

import React, { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { supabase } from "@/lib/supabase";
import { getAgoraRTC, fetchLiveToken } from "@/lib/agora";

export default function LiveViewerModal({
  isOpen,
  onClose,
  stream,
  session,
  lang = "es",
}) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [viewerCount, setViewerCount] = useState(stream?.espectadores_actuales || 0);
  const [streamEnded, setStreamEnded] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const videoContainerRef = useRef(null);
  const agoraClientRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Inicializar conexión con Agora como audiencia
  useEffect(() => {
    if (!isOpen || !stream?.canal) {
      cleanupAgora();
      return;
    }

    setStreamEnded(false);
    setIsLoading(true);
    setErrorMsg("");
    setMessages([]);
    setViewerCount(stream.espectadores_actuales || 0);

    let client = null;

    async function initViewer() {
      try {
        const AgoraRTC = await getAgoraRTC();
        if (!AgoraRTC) {
          throw new Error("No se pudo cargar el motor Agora");
        }

        const account = session?.user?.id || "viewer_" + Math.random().toString(36).slice(2, 8);

        // 1. Obtener token de Agora para rol 'subscriber'
        const tokenData = await fetchLiveToken({
          channelName: stream.canal,
          role: "subscriber",
          account,
        });

        // 2. Crear cliente Agora en modo audiencia
        client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        agoraClientRef.current = client;

        await client.setClientRole("audience");

        // 3. Manejar cuando el host publica video o audio
        client.on("user-published", async (remoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType);
          setIsLoading(false);

          if (mediaType === "video" && videoContainerRef.current) {
            remoteUser.videoTrack.play(videoContainerRef.current);
          }
          if (mediaType === "audio") {
            remoteUser.audioTrack.play();
          }
        });

        // Si el anfitrión sale
        client.on("user-left", () => {
          setStreamEnded(true);
        });

        // 4. Unirse al canal
        await client.join(
          tokenData.appId,
          stream.canal,
          tokenData.token || null,
          account
        );

        // 5. Incrementar espectadores en la base de datos
        try {
          await supabase.rpc("incrementar_espectadores", { p_transmision_id: stream.id });
        } catch {
          // Si el RPC no existe aún, se maneja suavemente
        }
      } catch (err) {
        console.error("[Live Viewer Error]", err);
        setErrorMsg(
          err.message ||
            (lang === "en"
              ? "Could not connect to live stream"
              : lang === "zh"
              ? "无法连接到直播"
              : "No se pudo conectar a la transmisión en vivo")
        );
        setIsLoading(false);
      }
    }

    initViewer();

    return () => {
      cleanupAgora();
    };
  }, [isOpen, stream?.id, stream?.canal]);

  // Cargar mensajes existentes y escuchar nuevos en Realtime
  useEffect(() => {
    if (!isOpen || !stream?.id) return;

    // Cargar últimos mensajes
    supabase
      .from("transmisiones_mensajes")
      .select(`
        id,
        texto,
        created_at,
        perfil:usuario_id (
          id,
          nombre_completo,
          avatar_url,
          nombre_usuario
        )
      `)
      .eq("transmision_id", stream.id)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data);
      });

    // Suscripción Realtime
    const channel = supabase
      .channel(`viewer-chat-${stream.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transmisiones_mensajes",
          filter: `transmision_id=eq.${stream.id}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          const { data: userProfile } = await supabase
            .from("perfiles")
            .select("nombre_completo, avatar_url, nombre_usuario")
            .eq("id", newMsg.usuario_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, perfil: userProfile || {} },
          ]);
          setTimeout(() => {
            if (chatBottomRef.current) {
              chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transmisiones",
          filter: `id=eq.${stream.id}`,
        },
        (payload) => {
          if (payload.new) {
            setViewerCount(payload.new.espectadores_actuales || 0);
            if (payload.new.estado === "finalizada") {
              setStreamEnded(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, stream?.id]);

  const cleanupAgora = () => {
    try {
      if (agoraClientRef.current) {
        agoraClientRef.current.leave();
        agoraClientRef.current = null;
      }
    } catch (e) {
      console.warn("Cleanup error:", e);
    }
  };

  // Enviar mensaje al chat
  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !session?.user?.id || !stream?.id) return;
    const text = chatInput.trim();
    setChatInput("");

    try {
      await supabase.from("transmisiones_mensajes").insert({
        transmision_id: stream.id,
        usuario_id: session.user.id,
        texto: text,
      });
    } catch (err) {
      console.error("Error sending viewer chat:", err);
    }
  };

  // Reacción con emojis flotantes
  const handleReact = (emoji) => {
    const id = Math.random().toString(36).slice(2);
    setFloatingEmojis((prev) => [...prev, { id, emoji, left: 15 + Math.random() * 70 }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1500);
  };

  if (!isOpen || !stream) return null;

  const autor = stream.perfil || {};

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.94)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          maxHeight: "920px",
          background: "#000",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Contenedor del video remoto Agora */}
        <div
          ref={videoContainerRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            background: "#111",
          }}
        />

        {/* Emojis flotantes animados */}
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            style={{
              position: "absolute",
              bottom: "120px",
              left: `${item.left}%`,
              fontSize: "36px",
              pointerEvents: "none",
              zIndex: 30,
              animation: "floatUpStory 1.5s ease-out forwards",
            }}
          >
            {item.emoji}
          </div>
        ))}

        {/* Estado de carga / conectando */}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                border: "3px solid rgba(255,255,255,0.2)",
                borderTopColor: "#FF1744",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                marginBottom: "14px",
              }}
            />
            <div style={{ fontSize: "14px", fontWeight: "600" }}>
              {lang === "en" ? "Connecting to live stream..." : lang === "zh" ? "连接直播中..." : "Conectando con la transmisión en vivo..."}
            </div>
          </div>
        )}

        {/* Error al conectar */}
        {errorMsg && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 15,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.85)",
              color: "#fff",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
            <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "8px" }}>{errorMsg}</div>
            <button
              onClick={onClose}
              style={{
                marginTop: "16px",
                padding: "10px 24px",
                background: "#FF1744",
                border: "none",
                borderRadius: "20px",
                color: "#fff",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {lang === "en" ? "Close" : lang === "zh" ? "关闭" : "Cerrar"}
            </button>
          </div>
        )}

        {/* Notificación si la transmisión ha finalizado */}
        {streamEnded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.88)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(255, 23, 68, 0.2)",
                border: "2px solid #FF1744",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <Icon name="video-off" style={{ width: "28px", height: "28px", color: "#FF1744" }} />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "800" }}>
              {lang === "en" ? "Broadcast has ended" : lang === "zh" ? "直播已结束" : "La transmisión ha finalizado"}
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: "rgba(255, 255, 255, 0.65)" }}>
              {lang === "en"
                ? "The host has finished this live stream. Replays are not stored."
                : lang === "zh"
                ? "主播已结束此次直播。不保留重播。"
                : "El anfitrión ha finalizado la transmisión en vivo."}
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg, #FF1744 0%, #D50000 100%)",
                border: "none",
                borderRadius: "22px",
                color: "#fff",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {lang === "en" ? "Leave" : lang === "zh" ? "退出" : "Salir"}
            </button>
          </div>
        )}

        {/* Barra superior de anfitrión y espectadores */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 16px 8px",
            background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={autor.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80"}
              alt={autor.nombre_completo || "Host"}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #FF1744",
              }}
            />
            <div>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#fff" }}>
                {autor.nombre_completo || "Usuario"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    background: "#FF1744",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: "800",
                    padding: "1px 6px",
                    borderRadius: "8px",
                  }}
                >
                  EN VIVO
                </span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
                  👥 {viewerCount}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon name="x" style={{ width: "18px", height: "18px" }} />
          </button>
        </div>

        {/* Título de la transmisión */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "0 16px",
            color: "#fff",
            fontSize: "13px",
            fontWeight: "600",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          {stream.titulo}
        </div>

        <div style={{ flex: 1 }} />

        {/* Barra inferior: Chat y reacciones rápidas */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "16px",
            background: "linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Mensajes del chat */}
          <div
            style={{
              maxHeight: "180px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(0, 0, 0, 0.45)",
                  backdropFilter: "blur(6px)",
                  padding: "4px 10px",
                  borderRadius: "14px",
                  width: "fit-content",
                  maxWidth: "85%",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#FFD700" }}>
                  {m.perfil?.nombre_completo || m.perfil?.nombre_usuario || "Espectador"}:
                </span>
                <span style={{ fontSize: "12px", color: "#fff" }}>{m.texto}</span>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Fila de emojis rápidos para reaccionar */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            {["❤️", "🔥", "👏", "😮", "😂"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Formulario de comentario en vivo */}
          <form onSubmit={handleSendChat} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={lang === "en" ? "Comment live..." : lang === "zh" ? "发表评论..." : "Comenta en vivo..."}
              maxLength={140}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "22px",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#FFD700",
                border: "none",
                color: "#000",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="send" style={{ width: "16px", height: "16px" }} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
