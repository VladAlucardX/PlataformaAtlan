"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";
import StoryComposer from "./StoryComposer";
import StoryViewer from "./StoryViewer";

export default function StoriesBar({
  session,
  perfil,
  lang = "es",
  groups = [],
  loading = false,
  reload,
  markSeen,
  onRequireLogin,
}) {
  const [mounted, setMounted] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [showArtStoryModal, setShowArtStoryModal] = useState(false);
  const [artProgress, setArtProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Temporizador para la historia de exhibición (7 segundos estilo historia)
  useEffect(() => {
    if (!showArtStoryModal) {
      setArtProgress(0);
      return;
    }
    const interval = 50;
    const totalDuration = 7000;
    const step = (interval / totalDuration) * 100;

    const timer = setInterval(() => {
      setArtProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setShowArtStoryModal(false);
          return 0;
        }
        return Math.min(100, prev + step);
      });
    }, interval);

    return () => clearInterval(timer);
  }, [showArtStoryModal]);

  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -280 : 280;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleOpenMyStoryOrComposer = () => {
    if (!session) {
      if (onRequireLogin) onRequireLogin();
      return;
    }

    const myGroupIndex = groups.findIndex((g) => g.esMia);
    if (myGroupIndex !== -1 && groups[myGroupIndex]?.historias?.length > 0) {
      // Tiene historias activas: abrir visor en su historia
      setSelectedGroupIdx(myGroupIndex);
      setViewerOpen(true);
    } else {
      // No tiene historias activas: abrir creador
      setShowComposer(true);
    }
  };

  const handleOpenGroup = (index) => {
    if (!session) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setSelectedGroupIdx(index);
    setViewerOpen(true);
  };

  const myGroup = groups.find((g) => g.esMia);
  const myStories = myGroup?.historias || [];
  const otherGroups = groups.filter((g) => !g.esMia);

  return (
    <>
      <div
        style={{
          width: "100%",
          marginBottom: "18px",
          userSelect: "none",
          background: "#E2E8F0",
          border: "1.5px solid #94A3B8",
          boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.10), 0 2px 6px -1px rgba(15, 23, 42, 0.05)",
          borderRadius: "22px",
          overflow: "hidden",
          padding: "14px 0 10px 0",
        }}
      >
        <div style={{ position: "relative", padding: "0 14px" }}>
        {/* Flecha izquierda (Desktop) */}
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="stories-scroll-arrow stories-scroll-left"
          style={{
            position: "absolute",
            left: "4px",
            top: "55%",
            transform: "translateY(-50%)",
            zIndex: 10,
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(10, 25, 47, 0.95)",
            border: "1.5px solid var(--atlan-gold, #FFD700)",
            color: "#FFD700",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
          }}
        >
          ‹
        </button>

        {/* Carrusel horizontal de tarjetas estilo Facebook */}
        <div
          ref={scrollContainerRef}
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            padding: "0 2px 4px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* TARJETA 1: Tu Historia (Crear / Ver) */}
          <div
            onClick={handleOpenMyStoryOrComposer}
            style={{
              flexShrink: 0,
              width: "108px",
              height: "172px",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              background: "linear-gradient(180deg, #0F172A 0%, #0A192F 100%)",
              border: myStories.length > 0 ? "2px solid #FFD700" : "1.5px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {/* Foto de portada de la tarjeta */}
            {myStories.length > 0 && myStories[myStories.length - 1]?.miniatura_url ? (
              <img
                src={myStories[myStories.length - 1].miniatura_url}
                alt="Mi historia"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.7)",
                }}
              />
            ) : perfil?.avatar_url ? (
              <img
                src={perfil.avatar_url}
                alt="Avatar"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: myStories.length > 0 ? "brightness(0.7)" : "brightness(0.4) blur(1px)",
                }}
              />
            ) : null}

            {/* Gradiente oscuro inferior */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(0,0,0,0.1) 40%, rgba(10, 25, 47, 0.95) 100%)",
                zIndex: 1,
              }}
            />

            {/* Botón flotante (+) */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                padding: "10px 10px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: myStories.length > 0 ? "2.5px solid #FFD700" : "2px solid rgba(255, 255, 255, 0.4)",
                  overflow: "hidden",
                  background: "#1E293B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: "800",
                  fontSize: "13px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {perfil?.avatar_url ? (
                  <img src={perfil.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  (perfil?.nombre_completo?.[0] || "U").toUpperCase()
                )}
              </div>

              {/* Botón rápido + para agregar otra */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!session) {
                    if (onRequireLogin) onRequireLogin();
                    return;
                  }
                  setShowComposer(true);
                }}
                title={lang === "en" ? "Add story" : "Agregar historia"}
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                  border: "2px solid #0A192F",
                  color: "#0A192F",
                  fontWeight: "900",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
                }}
              >
                +
              </button>
            </div>

            {/* Texto inferior */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                padding: "8px 8px 10px",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#FFFFFF",
                  lineHeight: "1.25",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {myStories.length > 0
                  ? lang === "en"
                    ? "Your Story"
                    : lang === "zh"
                    ? "你的快拍"
                    : "Tu Historia"
                  : lang === "en"
                  ? "Create Story"
                  : lang === "zh"
                  ? "创建快拍"
                  : "Crear Historia"}
              </div>
              {myStories.length > 0 && (
                <div
                  style={{
                    fontSize: "9.5px",
                    color: "#FFD700",
                    fontWeight: "700",
                    marginTop: "2px",
                  }}
                >
                  {`(${myStories.length})`}
                </div>
              )}
            </div>
          </div>

          {/* TARJETA DECORATIVA / INVITACIÓN CUANDO NO HAY MÁS HISTORIAS */}
          {otherGroups.length === 0 && (
            <div
              onClick={() => setShowArtStoryModal(true)}
              style={{
                flexShrink: 0,
                width: "128px",
                height: "172px",
                borderRadius: "16px",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                background: "#0F172A",
                border: "1.5px solid rgba(212, 175, 55, 0.45)",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4), 0 0 16px rgba(212, 175, 55, 0.15)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 10px 28px rgba(0, 0, 0, 0.5), 0 0 22px rgba(212, 175, 55, 0.35)";
                const img = e.currentTarget.querySelector("img");
                if (img) img.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.4), 0 0 16px rgba(212, 175, 55, 0.15)";
                const img = e.currentTarget.querySelector("img");
                if (img) img.style.transform = "scale(1)";
              }}
            >
              {/* Imagen art3.jpeg con filtro estético y zoom al pasar el cursor */}
              <img
                src="/images/art3.jpeg"
                alt="Empieza ahora"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.72) contrast(1.1) saturate(1.15)",
                  transition: "transform 0.4s ease",
                }}
              />

              {/* Gradiente oscuro para contraste */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(15, 23, 42, 0.15) 0%, rgba(10, 15, 29, 0.88) 80%, rgba(10, 15, 29, 0.98) 100%)",
                  zIndex: 1,
                }}
              />

              {/* Badge superior */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  padding: "10px 10px 0",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(10, 25, 47, 0.75)",
                    backdropFilter: "blur(6px)",
                    border: "1.5px solid rgba(212, 175, 55, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <Icon name="sparkles" size={13} color="#FFD700" />
                </div>
              </div>

              {/* Contenido inferior: "Empieza ahora" */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  padding: "0 10px 12px",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "#FFFFFF",
                    lineHeight: "1.25",
                    textShadow: "0 2px 6px rgba(0, 0, 0, 0.9)",
                    letterSpacing: "0.2px",
                  }}
                >
                  {lang === "en" ? "Start Now" : lang === "zh" ? "立即开始" : "Empieza ahora"}
                </div>
                <div
                  style={{
                    fontSize: "9.5px",
                    color: "var(--atlan-gold, #FFD700)",
                    fontWeight: "700",
                    marginTop: "2px",
                    textShadow: "0 1px 4px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  {lang === "en" ? "Share first story" : lang === "zh" ? "发布第一条快拍" : "Comparte tu historia"}
                </div>
              </div>
            </div>
          )}

          {/* TARJETAS DE HISTORIAS DE OTROS USUARIOS */}
          {otherGroups.map((group, idx) => {
            const indexInFullList = groups.findIndex((g) => g.usuario.id === group.usuario.id);
            const latestStory = group.historias?.[group.historias.length - 1];
            const hasUnread = group.tieneNuevas;

            return (
              <div
                key={group.usuario.id}
                onClick={() => handleOpenGroup(indexInFullList !== -1 ? indexInFullList : idx)}
                style={{
                  flexShrink: 0,
                  width: "108px",
                  height: "172px",
                  borderRadius: "16px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  background: "#0F172A",
                  border: hasUnread ? "2px solid #FFD700" : "1.5px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: hasUnread
                    ? "0 4px 16px rgba(255, 215, 0, 0.25)"
                    : "0 4px 12px rgba(0, 0, 0, 0.35)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {/* Portada / Miniatura de la historia */}
                {latestStory?.miniatura_url ? (
                  <img
                    src={latestStory.miniatura_url}
                    alt={group.usuario.nombre_completo}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "brightness(0.75)",
                    }}
                  />
                ) : group.usuario.avatar_url ? (
                  <img
                    src={group.usuario.avatar_url}
                    alt={group.usuario.nombre_completo}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "brightness(0.55)",
                    }}
                  />
                ) : null}

                {/* Gradiente inferior */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0.15) 30%, rgba(10, 15, 29, 0.95) 100%)",
                    zIndex: 1,
                  }}
                />

                {/* Avatar superior con anillo de color */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      border: hasUnread ? "2.5px solid #FFD700" : "2px solid rgba(255, 255, 255, 0.4)",
                      boxShadow: hasUnread ? "0 0 8px rgba(255, 215, 0, 0.6)" : "none",
                      overflow: "hidden",
                      background: "#1E293B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                      fontWeight: "800",
                      fontSize: "13px",
                    }}
                  >
                    {group.usuario.avatar_url ? (
                      <img
                        src={group.usuario.avatar_url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      (group.usuario.nombre_completo?.[0] || "U").toUpperCase()
                    )}
                  </div>
                </div>

                {/* Nombre del autor abajo */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "8px 8px 10px",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "800",
                      color: "#FFFFFF",
                      lineHeight: "1.25",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    }}
                  >
                    {group.usuario.nombre_completo || "Usuario"}
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      color: hasUnread ? "#FFD700" : "rgba(255, 255, 255, 0.6)",
                      fontWeight: "700",
                      marginTop: "2px",
                    }}
                  >
                    {group.historias.length}{" "}
                    {group.historias.length === 1
                      ? lang === "en"
                        ? "story"
                        : "historia"
                      : lang === "en"
                      ? "stories"
                      : "historias"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Flecha derecha (Desktop) */}
        {groups.length > 4 && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="stories-scroll-arrow stories-scroll-right"
            style={{
              position: "absolute",
              right: "4px",
              top: "55%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(10, 25, 47, 0.95)",
              border: "1.5px solid var(--atlan-gold, #FFD700)",
              color: "#FFD700",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
            }}
          >
            ›
          </button>
        )}
        </div>
      </div>

      {/* Modal para crear historia */}
      <StoryComposer
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        session={session}
        lang={lang}
        onStoryPublished={() => {
          if (reload) reload();
        }}
      />

      {/* Visor de historias a pantalla completa */}
      <StoryViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        groups={groups}
        initialGroupIndex={selectedGroupIdx}
        session={session}
        lang={lang}
        onStoryDeleted={() => {
          if (reload) reload();
        }}
        markSeen={markSeen}
      />

      {/* Visor de historia de exhibición (Empieza ahora - solo visibilidad) */}
      {showArtStoryModal && mounted && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "rgba(0, 0, 0, 0.95)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
          }}
          onClick={() => setShowArtStoryModal(false)}
        >
          {/* Contenedor vertical móvil estilo historia */}
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
              borderRadius: "20px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra de progreso superior */}
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                right: "14px",
                zIndex: 30,
                height: "3px",
                background: "rgba(255, 255, 255, 0.28)",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${artProgress}%`,
                  background: "var(--atlan-gold, #FFD700)",
                  boxShadow: "0 0 6px rgba(255, 215, 0, 0.8)",
                  transition: "width 0.05s linear",
                }}
              />
            </div>

            {/* Cabecera con avatar y botón cerrar */}
            <div
              style={{
                position: "absolute",
                top: "26px",
                left: "14px",
                right: "14px",
                zIndex: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <img
                    src="/images/art3.jpeg"
                    alt="Atlan"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                    {lang === "en" ? "Atlan Community" : lang === "zh" ? "Atlan 社区" : "Comunidad Atlan"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--atlan-gold, #FFD700)", fontWeight: "600", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                    {lang === "en" ? "Start Now" : lang === "zh" ? "立即开始" : "Empieza ahora"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowArtStoryModal(false)}
                aria-label="Cerrar"
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
                  transition: "background 0.2s ease",
                }}
              >
                <Icon name="x" size={16} color="#FFFFFF" />
              </button>
            </div>

            {/* Imagen principal completa */}
            <div
              style={{
                flex: 1,
                position: "relative",
                width: "100%",
                height: "100%",
                background: "#000000",
              }}
            >
              <img
                src="/images/art3.jpeg"
                alt="Empieza ahora"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.9) contrast(1.05)",
                }}
              />

              {/* Gradiente inferior para texto */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 65%, rgba(10,15,29,0.92) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Texto inferior de la historia */}
              <div
                style={{
                  position: "absolute",
                  bottom: "32px",
                  left: "20px",
                  right: "20px",
                  textAlign: "center",
                  zIndex: 20,
                }}
              >
                <h3
                  style={{
                    margin: "0 0 6px",
                    fontSize: "20px",
                    fontWeight: "800",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-outfit)",
                    textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                  }}
                >
                  {lang === "en" ? "Start Now!" : lang === "zh" ? "立即开始！" : "¡Empieza ahora!"}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "rgba(255, 255, 255, 0.85)",
                    lineHeight: "1.4",
                    textShadow: "0 2px 6px rgba(0,0,0,0.9)",
                  }}
                >
                  {lang === "en"
                    ? "Share your favorite moments and discover Nicaragua with the community."
                    : lang === "zh"
                    ? "与社区分享您最喜欢的时刻，探索尼加拉瓜。"
                    : "Comparte tus momentos favoritos y descubre Nicaragua con la comunidad."}
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style jsx global>{`
        @media (min-width: 768px) {
          .stories-scroll-arrow {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
