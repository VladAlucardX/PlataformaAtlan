"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";
import { supabase } from "@/lib/supabase";
import { STORY_EMOJIS, storyTimeAgo } from "@/lib/historias";

export default function StoryViewer({
  isOpen,
  onClose,
  groups = [],
  initialGroupIndex = 0,
  session,
  lang = "es",
  onStoryDeleted,
  markSeen,
}) {
  const [mounted, setMounted] = useState(false);
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 a 100
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const overlayRef = useRef(null);
  const videoRef = useRef(null);
  const touchStartRef = useRef(0);
  const holdTimeoutRef = useRef(null);

  // Sincronizar índice inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setGroupIndex(Math.min(initialGroupIndex, Math.max(0, groups.length - 1)));
      setStoryIndex(0);
      setProgress(0);
      setIsPaused(false);
      setReplyText("");
      setTimeout(() => overlayRef.current?.focus(), 50);
    }
  }, [isOpen, initialGroupIndex, groups.length]);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.historias?.[storyIndex];
  const isMine = currentStory?.usuario_id === session?.user?.id;

  // Marcar como vista al cambiar de historia
  useEffect(() => {
    if (isOpen && currentStory && markSeen) {
      markSeen(currentStory.id);
    }
    setProgress(0);
  }, [isOpen, currentStory?.id, markSeen]);

  // Si el visor está abierto pero ya no queda ninguna historia (p. ej. se borró la última
  // o venció), ciérralo para que no reaparezca solo al publicar otra.
  useEffect(() => {
    if (isOpen && (groups.length === 0 || !currentGroup || !currentStory)) {
      onClose();
    }
  }, [isOpen, groups.length, currentGroup, currentStory, onClose]);

  // Avanzar a la siguiente historia o siguiente usuario
  const handleNext = useCallback(() => {
    if (!currentGroup) return;
    if (storyIndex < currentGroup.historias.length - 1) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentGroup, storyIndex, groupIndex, groups.length, onClose]);

  // Retroceder a la historia anterior o usuario anterior
  const handlePrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(Math.max(0, (prevGroup?.historias?.length || 1) - 1));
      setProgress(0);
    }
  }, [storyIndex, groupIndex, groups]);

  // Manejador del progreso de reproducción del video
  const handleTimeUpdate = () => {
    if (!videoRef.current || isPaused) return;
    const dur = videoRef.current.duration;
    const cur = videoRef.current.currentTime;
    if (dur && isFinite(dur)) {
      setProgress(Math.min(100, (cur / dur) * 100));
    }
  };

  // Pausar / reanudar con toque mantenido
  const handlePointerDown = (e) => {
    // Si toca en los inputs o botones de interacción no pausar
    if (e.target.closest("button, input, textarea")) return;
    touchStartRef.current = Date.now();
    holdTimeoutRef.current = setTimeout(() => {
      setIsPaused(true);
      if (videoRef.current) videoRef.current.pause();
    }, 180);
  };

  const handlePointerUp = (e) => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    const duration = Date.now() - touchStartRef.current;

    if (isPaused) {
      setIsPaused(false);
      if (videoRef.current) videoRef.current.play();
      return;
    }

    // Si fue un tap rápido (menos de 180ms), determinar si fue izquierda o derecha
    if (duration < 180) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;

      if (clickX < width * 0.32) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  // Reacción con emojis
  const handleReact = async (emoji) => {
    if (!session || !currentStory) return;

    // Animación de emoji flotante
    const id = Math.random().toString(36).substring(7);
    setFloatingEmojis((prev) => [...prev, { id, emoji, left: 20 + Math.random() * 60 }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1500);

    try {
      const { error } = await supabase.from("historias_reacciones").upsert(
        {
          historia_id: currentStory.id,
          usuario_id: session.user.id,
          emoji,
        },
        { onConflict: "historia_id,usuario_id" }
      );
      if (error) throw error;
    } catch (err) {
      console.warn("[StoryViewer] Error registrando reacción:", err);
    }
  };

  // Enviar respuesta por mensaje directo (chat privado)
  const handleSendReply = async () => {
    if (!session || !currentStory || !replyText.trim() || sendingReply) return;
    setSendingReply(true);

    try {
      // 1. Obtener o crear conversación con el autor de la historia
      const { data: convId, error: convError } = await supabase.rpc(
        "obtener_o_crear_conversacion",
        { otro_usuario_id: currentStory.usuario_id }
      );

      if (convError || !convId) {
        throw convError || new Error("No se pudo iniciar la conversación");
      }

      // 2. Insertar mensaje en la tabla mensajes
      const { error: msgError } = await supabase.from("mensajes").insert({
        conversacion_id: convId,
        autor_id: session.user.id,
        contenido: replyText.trim(),
        es_respuesta_historia: true,
        historia_id: currentStory.id,
        historia_miniatura_url: currentStory.miniatura_url || null,
      });

      if (msgError) throw msgError;

      // 3. Actualizar fecha de último mensaje en la conversación
      await supabase
        .from("conversaciones")
        .update({ ultimo_mensaje_at: new Date().toISOString() })
        .eq("id", convId);

      setReplyText("");
      showToast(
        lang === "en"
          ? "Message sent to private chat ✓"
          : lang === "zh"
          ? "已发送私信 ✓"
          : "Mensaje enviado al privado ✓"
      );
    } catch (err) {
      console.error("[StoryViewer] Error enviando mensaje privado:", err);
      showToast(
        lang === "en"
          ? "Could not send message"
          : lang === "zh"
          ? "发送失败"
          : "No se pudo enviar el mensaje"
      );
    } finally {
      setSendingReply(false);
    }
  };

  // Eliminar historia propia
  const handleDeleteStory = async () => {
    if (!currentStory || !isMine || deleting) return;
    const confirmDelete = window.confirm(
      lang === "en"
        ? "Do you want to delete this story?"
        : lang === "zh"
        ? "您确定要删除此故事吗？"
        : "¿Deseas eliminar esta historia?"
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const { error: delError } = await supabase.rpc("eliminar_historia", { p_historia_id: currentStory.id });
      if (delError) throw delError;
      showToast(
        lang === "en"
          ? "Story deleted"
          : lang === "zh"
          ? "故事已删除"
          : "Historia eliminada"
      );
      if (onStoryDeleted) onStoryDeleted(currentStory.id);
      handleNext();
    } catch (err) {
      console.error("[StoryViewer] Error borrando historia:", err);
    } finally {
      setDeleting(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2800);
  };

  if (!isOpen || !currentGroup || !currentStory || !mounted) return null;

  const historias = currentGroup.historias || [];
  const autor = currentGroup.usuario || {};

  return createPortal(
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(0, 0, 0, 0.94)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      onClick={() => {
        if (onClose) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "ArrowLeft") handlePrev();
      }}
      tabIndex={0}
    >
      {/* Contenedor tipo pantalla móvil de historia */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "440px",
          height: "100%",
          maxHeight: "920px",
          background: "#05070D",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          userSelect: "none",
          cursor: "default",
          borderRadius: "20px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9)",
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation();
          handlePointerDown(e);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          handlePointerUp(e);
        }}
      >
        {/* Barras de progreso segmentadas en la parte superior */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "12px",
            right: "12px",
            zIndex: 30,
            display: "flex",
            gap: "5px",
          }}
        >
          {historias.map((h, idx) => {
            let widthPercent = 0;
            if (idx < storyIndex) widthPercent = 100;
            else if (idx === storyIndex) widthPercent = progress;

            return (
              <div
                key={h.id || idx}
                style={{
                  flex: 1,
                  height: "3px",
                  background: "rgba(255, 255, 255, 0.28)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${widthPercent}%`,
                    background: "var(--atlan-gold, #FFD700)",
                    boxShadow: idx === storyIndex ? "0 0 6px rgba(255, 215, 0, 0.8)" : "none",
                    transition: idx === storyIndex ? "width 0.08s linear" : "none",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Cabecera con datos del autor y botón de cerrar */}
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "14px",
            right: "14px",
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Avatar */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "2px solid var(--atlan-gold, #FFD700)",
                overflow: "hidden",
                background: "rgba(20, 109, 158, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontWeight: "800",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              {autor.avatar_url ? (
                <img
                  src={autor.avatar_url}
                  alt={autor.nombre_completo}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                (autor.nombre_completo?.[0] || "U").toUpperCase()
              )}
            </div>

            {/* Nombre y tiempo */}
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                {autor.nombre_completo || (lang === "en" ? "User" : "Usuario")}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.75)", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                {storyTimeAgo(currentStory.created_at, lang)}
              </div>
            </div>
          </div>

          {/* Botones de acción (Eliminar si es mía, Cerrar) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isMine && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStory();
                }}
                disabled={deleting}
                title={lang === "en" ? "Delete story" : "Eliminar historia"}
                style={{
                  background: "rgba(0, 0, 0, 0.45)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ef4444",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                🗑️
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                background: "rgba(0, 0, 0, 0.45)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video principal */}
        <div
          style={{
            flex: 1,
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#000000",
          }}
        >
          <video
            ref={videoRef}
            key={currentStory.id}
            src={currentStory.video_url}
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleNext}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Indicador de pausa visual */}
          {isPaused && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(0, 0, 0, 0.6)",
                padding: "16px",
                borderRadius: "50%",
                color: "#FFFFFF",
                pointerEvents: "none",
                fontSize: "24px",
              }}
            >
              ⏸
            </div>
          )}

          {/* Texto / Caption sobre el video */}
          {currentStory.texto && (
            <div
              style={{
                position: "absolute",
                bottom: !isMine ? "90px" : "30px",
                left: "16px",
                right: "16px",
                padding: "10px 16px",
                background: "rgba(10, 15, 29, 0.75)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 215, 0, 0.3)",
                borderRadius: "14px",
                color: "#FFFFFF",
                fontSize: "14px",
                lineHeight: "1.4",
                textAlign: "center",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                pointerEvents: "none",
              }}
            >
              {currentStory.texto}
            </div>
          )}

          {/* Animación de emojis flotantes */}
          {floatingEmojis.map((item) => (
            <div
              key={item.id}
              style={{
                position: "absolute",
                bottom: "90px",
                left: `${item.left}%`,
                fontSize: "36px",
                pointerEvents: "none",
                animation: "floatUp 1.5s ease-out forwards",
                zIndex: 40,
              }}
            >
              {item.emoji}
            </div>
          ))}
        </div>

        {/* Footer: Reacciones y respuesta privada (solo si NO es historia propia) */}
        {!isMine && (
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "14px",
              right: "14px",
              zIndex: 35,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {/* Barra de Reacciones con Emojis */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 12px",
                background: "rgba(10, 15, 29, 0.8)",
                backdropFilter: "blur(12px)",
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              {STORY_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReact(emoji);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "22px",
                    cursor: "pointer",
                    transition: "transform 0.15s ease",
                    padding: "2px 6px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input para responder por chat privado */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(10, 15, 29, 0.9)",
                backdropFilter: "blur(12px)",
                borderRadius: "24px",
                border: "1px solid rgba(255, 215, 0, 0.35)",
                padding: "6px 8px 6px 16px",
              }}
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => {
                  setIsPaused(true);
                  if (videoRef.current) videoRef.current.pause();
                }}
                onBlur={() => {
                  setIsPaused(false);
                  if (videoRef.current) videoRef.current.play();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder={
                  lang === "en"
                    ? `Reply to ${autor.nombre_completo || "story"}...`
                    : lang === "zh"
                    ? `回复 ${autor.nombre_completo || "快拍"}...`
                    : `Responder a ${autor.nombre_completo || "historia"}...`
                }
                disabled={sendingReply}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#FFFFFF",
                  fontSize: "13px",
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendReply();
                }}
                disabled={!replyText.trim() || sendingReply}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "none",
                  background: replyText.trim()
                    ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
                    : "rgba(255, 255, 255, 0.1)",
                  color: replyText.trim() ? "#0A192F" : "#94a3b8",
                  cursor: replyText.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                {sendingReply ? "…" : "➤"}
              </button>
            </div>
          </div>
        )}

        {/* Notificación Toast flotante */}
        {toastMsg && (
          <div
            style={{
              position: "absolute",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 60,
              padding: "8px 16px",
              background: "rgba(10, 25, 47, 0.95)",
              border: "1px solid var(--atlan-gold, #FFD700)",
              borderRadius: "20px",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: "700",
              boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap",
            }}
          >
            {toastMsg}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translateY(-160px) scale(1.4);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
