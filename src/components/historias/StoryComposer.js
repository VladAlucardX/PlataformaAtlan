"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";
import { STORY_MAX_SECONDS, STORY_MAX_MB, readVideoDuration, publishStory } from "@/lib/historias";

export default function StoryComposer({ isOpen, onClose, session, lang, onStoryPublished }) {
  const [mounted, setMounted] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [duration, setDuration] = useState(null);
  const [texto, setTexto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Estados de grabación con cámara
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const liveVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordSecondsRef = useRef(0);

  // Detener cámara al desmontar o cerrar
  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsCameraActive(false);
    setIsRecording(false);
    setRecordSeconds(0);
    recordSecondsRef.current = 0;
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen || !mounted) return null;

  // Iniciar cámara en vivo
  const handleStartCamera = async () => {
    setErrorMsg("");
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia_not_supported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      cameraStreamRef.current = stream;
      setIsCameraActive(true);
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("[StoryComposer] Error abriendo cámara:", err);
      setErrorMsg(
        lang === "en"
          ? "Could not access camera/microphone. Please check browser permissions."
          : lang === "zh"
          ? "无法访问摄像头或麦克风。请检查浏览器权限。"
          : "No se pudo acceder a la cámara o micrófono. Revisa los permisos de tu navegador."
      );
    }
  };

  // Iniciar grabación de video
  const handleStartRecording = () => {
    if (!cameraStreamRef.current) return;
    recordedChunksRef.current = [];
    setErrorMsg("");

    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : MediaRecorder.isTypeSupported("video/mp4")
        ? "video/mp4"
        : "";

      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(cameraStreamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || "video/webm";
        const blob = new Blob(recordedChunksRef.current, { type: finalMime });
        const ext = finalMime.includes("mp4") ? "mp4" : "webm";
        const recordedFile = new File([blob], `historia_${Date.now()}.${ext}`, { type: finalMime });

        stopCamera();

        const recordedUrl = URL.createObjectURL(blob);
        setVideoFile(recordedFile);
        setVideoPreview(recordedUrl);
        setDuration(recordSecondsRef.current || null);
      };

      recorder.start(500);
      setIsRecording(true);
      setRecordSeconds(0);
      recordSecondsRef.current = 0;

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          const next = prev + 1;
          recordSecondsRef.current = next;
          if (next >= STORY_MAX_SECONDS) {
            handleStopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (e) {
      console.error("[StoryComposer] Error en MediaRecorder:", e);
      setErrorMsg("Error al iniciar la grabación");
    }
  };

  // Detener grabación de video
  const handleStopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSelectFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");

    // Validación de tipo
    if (!file.type.startsWith("video/")) {
      setErrorMsg(
        lang === "en"
          ? "Please select a valid video file"
          : lang === "zh"
          ? "请选择有效的视频文件"
          : "Por favor selecciona un archivo de video válido"
      );
      return;
    }

    // Validación de tamaño (máx 45MB)
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > STORY_MAX_MB) {
      setErrorMsg(
        lang === "en"
          ? `Video exceeds the ${STORY_MAX_MB}MB limit (your file: ${sizeMb.toFixed(1)}MB)`
          : lang === "zh"
          ? `视频超过 ${STORY_MAX_MB}MB 限制 (您的文件: ${sizeMb.toFixed(1)}MB)`
          : `El video supera el límite de ${STORY_MAX_MB}MB (tu archivo: ${sizeMb.toFixed(1)}MB)`
      );
      return;
    }

    setProgressMsg(lang === "en" ? "Verifying video..." : lang === "zh" ? "正在验证视频..." : "Verificando video...");

    try {
      const dur = await readVideoDuration(file);
      if (dur > STORY_MAX_SECONDS + 0.9) {
        setErrorMsg(
          lang === "en"
            ? `Video is ${Math.round(dur)}s long. Stories must be up to ${STORY_MAX_SECONDS} seconds.`
            : lang === "zh"
            ? `视频时长为 ${Math.round(dur)} 秒。故事最长为 ${STORY_MAX_SECONDS} 秒。`
            : `El video dura ${Math.round(dur)}s. Las historias deben durar máximo ${STORY_MAX_SECONDS} segundos.`
        );
        setProgressMsg("");
        return;
      }

      setDuration(dur);
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setProgressMsg("");
    } catch (err) {
      console.error("[StoryComposer] Error leyendo duración:", err);
      // Si el navegador no puede leer la metadata, permitimos continuar
      setDuration(null);
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setProgressMsg("");
    }
  };

  const handleReset = () => {
    stopCamera();
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    setDuration(null);
    setTexto("");
    setErrorMsg("");
    setProgressMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePublish = async () => {
    if (!videoFile || !session?.user?.id) return;
    setUploading(true);
    setErrorMsg("");
    setProgressMsg(lang === "en" ? "Uploading video..." : lang === "zh" ? "正在上传视频..." : "Subiendo video...");

    try {
      const created = await publishStory({
        userId: session.user.id,
        file: videoFile,
        duration: duration,
        texto: texto.trim(),
      });

      if (onStoryPublished) {
        onStoryPublished(created);
      }

      handleReset();
      onClose();
    } catch (err) {
      console.error("[StoryComposer] Error publicando historia:", err);
      setErrorMsg(
        lang === "en"
          ? "Failed to publish story. Please check your connection and try again."
          : lang === "zh"
          ? "发布故事失败，请检查网络后重试。"
          : "Error al publicar la historia. Revisa tu conexión e intenta de nuevo."
      );
    } finally {
      setUploading(false);
      setProgressMsg("");
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(3, 7, 18, 0.88)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={() => {
        if (!uploading) {
          handleReset();
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.98) 100%)",
          border: "1.5px solid rgba(212, 175, 55, 0.35)",
          borderRadius: "24px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 25px rgba(212, 175, 55, 0.15)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: "#FFFFFF",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(20, 109, 158, 0.25) 100%)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(212, 175, 55, 0.4)",
              }}
            >
              <Icon name="video" size={20} color="#FFD700" />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#FFD700" }}>
                {lang === "en" ? "Create Story" : lang === "zh" ? "发布快拍" : "Crear Historia"}
              </h3>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255, 255, 255, 0.6)" }}>
                {lang === "en" ? "Short video up to 30 seconds" : lang === "zh" ? "最长 30 秒的短视频" : "Video corto de hasta 30 segundos"}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              handleReset();
              onClose();
            }}
            aria-label="Cerrar"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#FFFFFF",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: uploading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s ease",
            }}
          >
            <Icon name="x" size={16} color="#FFFFFF" />
          </button>
        </div>

        {/* Contenido / Vista previa / Cámara */}
        <div style={{ padding: "20px" }}>
          {isCameraActive ? (
            /* Modo grabación con cámara web / móvil */
            <div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "360px",
                  borderRadius: "18px",
                  overflow: "hidden",
                  background: "#000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: isRecording ? "2px solid #EF4444" : "1px solid rgba(212, 175, 55, 0.4)",
                  boxShadow: isRecording ? "0 0 20px rgba(239, 68, 68, 0.35)" : "none",
                }}
              >
                <video
                  ref={(el) => {
                    liveVideoRef.current = el;
                    if (el && cameraStreamRef.current) {
                      el.srcObject = cameraStreamRef.current;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                />

                {/* Badge superior de estado y tiempo */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    right: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      background: isRecording ? "rgba(239, 68, 68, 0.85)" : "rgba(0, 0, 0, 0.7)",
                      backdropFilter: "blur(6px)",
                      borderRadius: "10px",
                      padding: "4px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#FFFFFF",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: isRecording ? "#FFFFFF" : "#10B981",
                        animation: isRecording ? "pulse 1s infinite" : "none",
                      }}
                    />
                    <span>{isRecording ? "REC" : "Cámara activa"}</span>
                  </div>

                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.7)",
                      backdropFilter: "blur(6px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "10px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: "800",
                      color: isRecording ? "#FFD700" : "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Icon name="clock" size={12} color="#FFD700" />
                    <span>{recordSeconds}s / {STORY_MAX_SECONDS}s</span>
                  </div>
                </div>

                {/* Barra de progreso de grabación */}
                {isRecording && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background: "rgba(255, 255, 255, 0.2)",
                      zIndex: 3,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(recordSeconds / STORY_MAX_SECONDS) * 100}%`,
                        background: "#EF4444",
                        transition: "width 1s linear",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Botones de control de cámara */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "16px",
                  padding: "0 8px",
                }}
              >
                <button
                  type="button"
                  onClick={stopCamera}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "8px 14px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {lang === "en" ? "Back" : lang === "zh" ? "返回" : "Volver"}
                </button>

                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                      border: "none",
                      borderRadius: "24px",
                      padding: "10px 22px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                    }}
                  >
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#FFFFFF",
                      }}
                    />
                    <span>{lang === "en" ? "Record" : lang === "zh" ? "开始录制" : "Grabar"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      border: "none",
                      borderRadius: "24px",
                      padding: "10px 22px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "2px",
                        background: "#FFFFFF",
                      }}
                    />
                    <span>{lang === "en" ? "Finish" : lang === "zh" ? "完成" : "Finalizar"}</span>
                  </button>
                )}

                <div style={{ width: "60px" }} />
              </div>
            </div>
          ) : !videoPreview ? (
            /* Selector inicial con Examinar Archivo y Grabar Video */
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleSelectFile}
                style={{ display: "none" }}
              />

              <div
                style={{
                  border: "2px dashed rgba(212, 175, 55, 0.4)",
                  borderRadius: "20px",
                  padding: "36px 20px",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.02)",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #146D9E 0%, #D4AF37 100%)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                    boxShadow: "0 8px 24px rgba(212, 175, 55, 0.3)",
                  }}
                >
                  <Icon name="video" size={28} color="#FFFFFF" />
                </div>
                <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }}>
                  {lang === "en" ? "Select or record a video" : lang === "zh" ? "选择或录制视频" : "Selecciona o graba un video"}
                </h4>
                <p style={{ margin: "0 0 16px", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                  {lang === "en"
                    ? "Max 30s · MP4, WebM, MOV · Max 45MB"
                    : lang === "zh"
                    ? "最长 30 秒 · MP4, WebM, MOV · 最大 45MB"
                    : "Máx 30s · MP4, WebM, MOV · Máx 45MB"}
                </p>

                {/* Dos opciones claras: Examinar Archivo y Grabar Video */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 18px",
                      borderRadius: "12px",
                      background: "rgba(212, 175, 55, 0.15)",
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                      color: "var(--atlan-gold, #FFD700)",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Icon name="film" size={14} color="#FFD700" />
                    <span>{lang === "en" ? "Browse Files" : lang === "zh" ? "选择文件" : "Examinar Archivo"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartCamera}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 18px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, rgba(20, 109, 158, 0.35) 0%, rgba(20, 109, 158, 0.6) 100%)",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Icon name="camera" size={14} color="#38BDF8" />
                    <span>{lang === "en" ? "Record Video" : lang === "zh" ? "录制视频" : "Grabar Video"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Vista previa del video seleccionado o grabado */
            <div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "360px",
                  borderRadius: "18px",
                  overflow: "hidden",
                  background: "#000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <video
                  ref={videoRef}
                  src={videoPreview}
                  controls
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />

                {/* Badge de duración con icono SVG */}
                {duration && (
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "rgba(0, 0, 0, 0.75)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(212, 175, 55, 0.5)",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "var(--atlan-gold, #FFD700)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Icon name="clock" size={12} color="#FFD700" />
                    <span>{Math.round(duration)}s / {STORY_MAX_SECONDS}s</span>
                  </div>
                )}

                {/* Botón cambiar video con icono SVG */}
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={uploading}
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    background: "rgba(0, 0, 0, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Icon name="rotateCcw" size={12} color="#FFFFFF" />
                  <span>{lang === "en" ? "Change" : lang === "zh" ? "更换" : "Cambiar"}</span>
                </button>
              </div>

              {/* Texto opcional */}
              <div style={{ marginTop: "14px" }}>
                <input
                  type="text"
                  maxLength={140}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={
                    lang === "en"
                      ? "Add a caption... (optional)"
                      : lang === "zh"
                      ? "添加描述... (可选)"
                      : "Agrega un mensaje... (opcional)"
                  }
                  disabled={uploading}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "14px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>
                    {texto.length}/140
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mensajes de progreso / error con icono SVG */}
          {progressMsg && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                background: "rgba(20, 109, 158, 0.15)",
                border: "1px solid rgba(20, 109, 158, 0.4)",
                borderRadius: "12px",
                color: "#38bdf8",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid #38bdf8",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span>{progressMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "12px",
                color: "#fca5a5",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Icon name="alertTriangle" size={14} color="#fca5a5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              handleReset();
              onClose();
            }}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: "600",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {lang === "en" ? "Cancel" : lang === "zh" ? "取消" : "Cancelar"}
          </button>

          <button
            type="button"
            disabled={!videoFile || uploading}
            onClick={handlePublish}
            style={{
              padding: "10px 22px",
              borderRadius: "12px",
              border: "none",
              background: !videoFile || uploading
                ? "rgba(212, 175, 55, 0.3)"
                : "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
              color: "#0A192F",
              fontSize: "13px",
              fontWeight: "800",
              cursor: !videoFile || uploading ? "not-allowed" : "pointer",
              boxShadow: !videoFile || uploading ? "none" : "0 4px 16px rgba(255, 215, 0, 0.35)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {uploading ? (
              <>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid #0A192F",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span>{lang === "en" ? "Publishing..." : lang === "zh" ? "发布中..." : "Publicando..."}</span>
              </>
            ) : (
              <>
                <Icon name="send" size={14} color="#0A192F" />
                <span>{lang === "en" ? "Share Story" : lang === "zh" ? "发布故事" : "Compartir Historia"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
