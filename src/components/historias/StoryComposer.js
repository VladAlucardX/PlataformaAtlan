"use client";

import React, { useState, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { STORY_MAX_SECONDS, STORY_MAX_MB, readVideoDuration, publishStory } from "@/lib/historias";

export default function StoryComposer({ isOpen, onClose, session, lang, onStoryPublished }) {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [duration, setDuration] = useState(null);
  const [texto, setTexto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  if (!isOpen) return null;

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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
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
              📹
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#FFD700" }}>
                {lang === "en" ? "Create Story (24h)" : lang === "zh" ? "发布快拍 (24小时)" : "Crear Historia (24h)"}
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
              fontSize: "14px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Contenido / Vista previa */}
        <div style={{ padding: "20px" }}>
          {!videoPreview ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleSelectFile}
                style={{ display: "none" }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed rgba(212, 175, 55, 0.4)",
                  borderRadius: "20px",
                  padding: "48px 20px",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.02)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--atlan-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.4)")}
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
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                  {lang === "en"
                    ? "Max 30s · MP4, WebM, MOV · Max 45MB"
                    : lang === "zh"
                    ? "最长 30 秒 · MP4, WebM, MOV · 最大 45MB"
                    : "Máx 30s · MP4, WebM, MOV · Máx 45MB"}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 18px",
                    borderRadius: "12px",
                    background: "rgba(212, 175, 55, 0.15)",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    color: "var(--atlan-gold)",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {lang === "en" ? "Browse Files" : lang === "zh" ? "选择文件" : "Examinar Archivo"}
                </span>
              </div>
            </div>
          ) : (
            <div>
              {/* Reproductor de vista previa */}
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

                {/* Badge de duración */}
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
                      color: "var(--atlan-gold)",
                    }}
                  >
                    ⏱ {Math.round(duration)}s / {STORY_MAX_SECONDS}s
                  </div>
                )}

                {/* Botón cambiar video */}
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
                  }}
                >
                  ↺ {lang === "en" ? "Change" : lang === "zh" ? "更换" : "Cambiar"}
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

          {/* Mensajes de progreso / error */}
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
              }}
            >
              ⚠️ {errorMsg}
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
                <span>🚀</span>
                <span>{lang === "en" ? "Share Story" : lang === "zh" ? "发布故事" : "Compartir Historia"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
