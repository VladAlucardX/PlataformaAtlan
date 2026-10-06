"use client";

import React, { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { supabase } from "@/lib/supabase";
import { getAgoraRTC, fetchLiveToken, getAvailableCameras } from "@/lib/agora";

export default function LiveBroadcastModal({
  isOpen,
  onClose,
  session,
  perfil,
  lang = "es",
  onStreamStarted,
}) {
  const [step, setStep] = useState("setup"); // 'setup' | 'live' | 'summary'
  const [titulo, setTitulo] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Transmisión activa
  const [streamId, setStreamId] = useState(null);
  const [channelName, setChannelName] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);

  // Estados de hardware
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamIndex, setSelectedCamIndex] = useState(0);

  // Chat en vivo
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Refs de Agora
  const videoContainerRef = useRef(null);
  const agoraClientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const timerRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Cargar lista de cámaras disponibles al abrir
  useEffect(() => {
    if (isOpen) {
      setStep("setup");
      setTitulo("");
      setErrorMsg("");
      setViewerCount(0);
      setPeakViewers(0);
      setStreamDuration(0);
      setMessages([]);
      getAvailableCameras().then((cams) => setCameras(cams));
    } else {
      cleanupAgora();
    }
  }, [isOpen]);

  // Cronómetro del en vivo
  useEffect(() => {
    if (step === "live") {
      timerRef.current = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  // Suscripción Realtime a mensajes del chat y contador de espectadores
  useEffect(() => {
    if (step !== "live" || !streamId) return;

    const channel = supabase
      .channel(`live-chat-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transmisiones_mensajes",
          filter: `transmision_id=eq.${streamId}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          // Obtener datos del perfil del remitente
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
          filter: `id=eq.${streamId}`,
        },
        (payload) => {
          if (payload.new) {
            const count = payload.new.espectadores_actuales || 0;
            setViewerCount(count);
            setPeakViewers((p) => Math.max(p, count));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [step, streamId]);

  // Limpieza completa de Agora
  const cleanupAgora = () => {
    try {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      if (agoraClientRef.current) {
        agoraClientRef.current.leave();
        agoraClientRef.current = null;
      }
    } catch (e) {
      console.warn("[Agora Cleanup Error]", e);
    }
  };

  // Iniciar la transmisión
  const handleStartStream = async () => {
    if (!session?.user?.id) return;
    if (!titulo.trim()) {
      setErrorMsg(
        lang === "en"
          ? "Please enter a stream title"
          : lang === "zh"
          ? "请输入直播标题"
          : "Ingresa un título para tu transmisión"
      );
      return;
    }

    setIsStarting(true);
    setErrorMsg("");

    try {
      const AgoraRTC = await getAgoraRTC();
      if (!AgoraRTC) {
        throw new Error("No se pudo cargar el motor de video Agora");
      }

      const generatedChannel = `atlan_live_${session.user.id.slice(0, 8)}_${Date.now()}`;
      setChannelName(generatedChannel);

      // 1. Obtener token de Agora
      const tokenData = await fetchLiveToken({
        channelName: generatedChannel,
        role: "publisher",
        account: session.user.id,
      });

      // 2. Registrar la transmisión en Supabase
      const { data: streamData, error: dbErr } = await supabase
        .from("transmisiones")
        .insert({
          usuario_id: session.user.id,
          titulo: titulo.trim(),
          canal: generatedChannel,
          estado: "en_vivo",
          espectadores_actuales: 0,
          espectadores_max: 0,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;
      setStreamId(streamData.id);

      // 3. Crear cliente Agora
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      agoraClientRef.current = client;

      await client.setClientRole("host");

      // 4. Unirse al canal de Agora
      await client.join(
        tokenData.appId,
        generatedChannel,
        tokenData.token || null,
        session.user.id
      );

      // 5. Crear pistas de audio y video
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        {},
        {
          encoderConfig: {
            width: 720,
            height: 1280,
            frameRate: 30,
            bitrateMin: 600,
            bitrateMax: 1500,
          },
        }
      );

      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;

      // 6. Publicar las pistas
      await client.publish([audioTrack, videoTrack]);

      setStep("live");
      if (onStreamStarted) onStreamStarted(streamData);

      // Reproducir video local en el contenedor
      setTimeout(() => {
        if (videoContainerRef.current && videoTrack) {
          videoTrack.play(videoContainerRef.current);
        }
      }, 200);
    } catch (err) {
      console.error("[Live Broadcast Error]", err);
      cleanupAgora();
      setErrorMsg(
        err.message ||
          (lang === "en"
            ? "Could not start live stream. Please check camera and mic permissions."
            : lang === "zh"
            ? "无法开始直播。请检查摄像头和麦克风权限。"
            : "No se pudo iniciar la transmisión. Verifica los permisos de cámara y micrófono.")
      );
    } finally {
      setIsStarting(false);
    }
  };

  // Alternar micrófono
  const toggleMic = async () => {
    if (!localAudioTrackRef.current) return;
    try {
      const nextMuted = !micMuted;
      await localAudioTrackRef.current.setEnabled(!nextMuted);
      setMicMuted(nextMuted);
    } catch (e) {
      console.warn("Error muting mic:", e);
    }
  };

  // Alternar cámara
  const toggleCam = async () => {
    if (!localVideoTrackRef.current) return;
    try {
      const nextOff = !camOff;
      await localVideoTrackRef.current.setEnabled(!nextOff);
      setCamOff(nextOff);
    } catch (e) {
      console.warn("Error toggling cam:", e);
    }
  };

  // Cambiar entre cámaras (móvil)
  const switchCamera = async () => {
    if (cameras.length < 2 || !localVideoTrackRef.current) return;
    try {
      const nextIndex = (selectedCamIndex + 1) % cameras.length;
      const targetCam = cameras[nextIndex];
      await localVideoTrackRef.current.setDevice(targetCam.deviceId);
      setSelectedCamIndex(nextIndex);
    } catch (e) {
      console.warn("Error switching camera:", e);
    }
  };

  // Finalizar transmisión
  const handleEndStream = async () => {
    if (isEnding) return;
    const confirmEnd = window.confirm(
      lang === "en"
        ? "Do you want to end this live broadcast?"
        : lang === "zh"
        ? "确定要结束这场直播吗？"
        : "¿Seguro que deseas finalizar la transmisión?"
    );
    if (!confirmEnd) return;

    setIsEnding(true);
    try {
      if (streamId) {
        await supabase.rpc("finalizar_transmision", { p_transmision_id: streamId });
      }
      cleanupAgora();
      setStep("summary");
    } catch (err) {
      console.error("[End Stream Error]", err);
      cleanupAgora();
      setStep("summary");
    } finally {
      setIsEnding(false);
    }
  };

  // Enviar mensaje en el chat del anfitrión
  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !streamId || !session?.user?.id) return;
    const text = chatInput.trim();
    setChatInput("");

    try {
      await supabase.from("transmisiones_mensajes").insert({
        transmision_id: streamId,
        usuario_id: session.user.id,
        texto: text,
      });
    } catch (err) {
      console.error("Error sending live chat:", err);
    }
  };

  // Formato mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

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
      {/* 1. SETUP / PREVIO AL EN VIVO */}
      {step === "setup" && (
        <div
          style={{
            width: "92%",
            maxWidth: "460px",
            background: "#18191c",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "28px",
            color: "#fff",
            boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF1744 0%, #D50000 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              boxShadow: "0 0 25px rgba(255, 23, 68, 0.5)",
            }}
          >
            <Icon name="video" style={{ width: "34px", height: "34px", color: "#fff" }} />
          </div>

          <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: "800" }}>
            {lang === "en" ? "Go Live on Atlan" : lang === "zh" ? "在 Atlan 开启直播" : "Transmitir en Vivo"}
          </h2>
          <p style={{ margin: "0 0 22px", fontSize: "14px", color: "rgba(255, 255, 255, 0.65)" }}>
            {lang === "en"
              ? "Share what is happening right now in Nicaragua with the community."
              : lang === "zh"
              ? "与社区实时分享尼加拉瓜此刻的精彩瞬间。"
              : "Comparte lo que está sucediendo en vivo en Nicaragua con toda la comunidad."}
          </p>

          <div style={{ marginBottom: "20px", textAlign: "left" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#FFD700", marginBottom: "6px" }}>
              {lang === "en" ? "STREAM TITLE" : lang === "zh" ? "直播标题" : "TÍTULO DE LA TRANSMISIÓN"}
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={lang === "en" ? "e.g. Walking around Granada central park..." : lang === "zh" ? "例如：漫步格拉纳达中央公园..." : "Ej: Caminando por el parque de Granada..."}
              maxLength={90}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {errorMsg && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(255, 23, 68, 0.15)",
                border: "1px solid rgba(255, 23, 68, 0.4)",
                borderRadius: "10px",
                color: "#ff6b81",
                fontSize: "12px",
                marginBottom: "18px",
                textAlign: "left",
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isStarting}
              style={{
                flex: 1,
                padding: "14px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "14px",
                color: "#fff",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {lang === "en" ? "Cancel" : lang === "zh" ? "取消" : "Cancelar"}
            </button>
            <button
              type="button"
              onClick={handleStartStream}
              disabled={isStarting}
              style={{
                flex: 2,
                padding: "14px",
                background: "linear-gradient(135deg, #FF1744 0%, #D50000 100%)",
                border: "none",
                borderRadius: "14px",
                color: "#fff",
                fontWeight: "800",
                fontSize: "15px",
                cursor: isStarting ? "not-allowed" : "pointer",
                boxShadow: "0 6px 20px rgba(255, 23, 68, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isStarting ? (
                <span>{lang === "en" ? "Connecting..." : lang === "zh" ? "连接中..." : "Iniciando..."}</span>
              ) : (
                <>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#fff" }} />
                  <span>{lang === "en" ? "Start Live" : lang === "zh" ? "开始直播" : "Iniciar en Vivo"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. TRANSMISIÓN EN DIRECTO */}
      {step === "live" && (
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
          {/* Contenedor del video local Agora */}
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

          {/* Overlay superior: Estado en vivo, espectadores, duración y botón finalizar */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#FF1744",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontWeight: "800",
                  fontSize: "12px",
                  color: "#fff",
                  boxShadow: "0 0 12px rgba(255, 23, 68, 0.7)",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#fff",
                    animation: "pulse 1.2s infinite",
                  }}
                />
                EN VIVO
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(0, 0, 0, 0.5)",
                  backdropFilter: "blur(8px)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                <Icon name="users" style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.7)" }} />
                <span>{viewerCount}</span>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.5)",
                  backdropFilter: "blur(8px)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  color: "#FFD700",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {formatTime(streamDuration)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleEndStream}
              disabled={isEnding}
              style={{
                background: "rgba(255, 23, 68, 0.85)",
                border: "none",
                borderRadius: "20px",
                color: "#fff",
                fontWeight: "700",
                fontSize: "12px",
                padding: "6px 14px",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              {lang === "en" ? "End Stream" : lang === "zh" ? "结束直播" : "Finalizar"}
            </button>
          </div>

          {/* Título flotante */}
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
            {titulo}
          </div>

          <div style={{ flex: 1 }} />

          {/* Overlay inferior: Chat en tiempo real y controles */}
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
            {/* Lista de mensajes en vivo */}
            <div
              style={{
                maxHeight: "180px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maskImage: "linear-gradient(to top, black 80%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to top, black 80%, transparent 100%)",
              }}
            >
              {messages.length === 0 ? (
                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", fontStyle: "italic" }}>
                  {lang === "en" ? "Waiting for viewers to join..." : lang === "zh" ? "等待观众加入..." : "Esperando que se unan espectadores..."}
                </div>
              ) : (
                messages.map((m) => (
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
                      {m.perfil?.nombre_completo || m.perfil?.nombre_usuario || "Usuario"}:
                    </span>
                    <span style={{ fontSize: "12px", color: "#fff" }}>{m.texto}</span>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input para responder en el chat */}
            <form onSubmit={handleSendChat} style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={lang === "en" ? "Say something..." : lang === "zh" ? "说点什么..." : "Di algo a tu audiencia..."}
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

            {/* Barra de herramientas del anfitrión (Mute, Cam, Flip Cam) */}
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", paddingTop: "4px" }}>
              <button
                type="button"
                onClick={toggleMic}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: micMuted ? "rgba(255, 23, 68, 0.85)" : "rgba(255, 255, 255, 0.18)",
                  border: "none",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title={micMuted ? "Activar micrófono" : "Silenciar micrófono"}
              >
                <Icon name={micMuted ? "mic-off" : "mic"} style={{ width: "20px", height: "20px" }} />
              </button>

              <button
                type="button"
                onClick={toggleCam}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: camOff ? "rgba(255, 23, 68, 0.85)" : "rgba(255, 255, 255, 0.18)",
                  border: "none",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title={camOff ? "Encender cámara" : "Apagar cámara"}
              >
                <Icon name={camOff ? "video-off" : "video"} style={{ width: "20px", height: "20px" }} />
              </button>

              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={switchCamera}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.18)",
                    border: "none",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title="Cambiar de cámara"
                >
                  <Icon name="refresh-cw" style={{ width: "18px", height: "18px" }} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. RESUMEN AL FINALIZAR */}
      {step === "summary" && (
        <div
          style={{
            width: "92%",
            maxWidth: "420px",
            background: "#18191c",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "28px",
            color: "#fff",
            boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(34, 197, 94, 0.2)",
              border: "1px solid #22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon name="check" style={{ width: "30px", height: "30px", color: "#22c55e" }} />
          </div>

          <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "800" }}>
            {lang === "en" ? "Stream Ended" : lang === "zh" ? "直播已结束" : "Transmisión Finalizada"}
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: "14px", color: "rgba(255, 255, 255, 0.65)" }}>
            {lang === "en" ? "Here is how your stream went:" : lang === "zh" ? "以下是本次直播数据：" : "Resumen de tu transmisión:"}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                padding: "16px",
                borderRadius: "14px",
              }}
            >
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                {lang === "en" ? "Duration" : lang === "zh" ? "时长" : "Duración"}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#FFD700" }}>
                {formatTime(streamDuration)}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                padding: "16px",
                borderRadius: "14px",
              }}
            >
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                {lang === "en" ? "Peak Viewers" : lang === "zh" ? "最高观看人数" : "Pico de espectadores"}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#FF1744" }}>
                {peakViewers}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "none",
              borderRadius: "14px",
              color: "#fff",
              fontWeight: "800",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            {lang === "en" ? "Done" : lang === "zh" ? "完成" : "Volver a la Comunidad"}
          </button>
        </div>
      )}
    </div>
  );
}
