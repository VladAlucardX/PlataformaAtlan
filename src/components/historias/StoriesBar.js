"use client";

import React, { useRef, useState } from "react";
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
  const [showComposer, setShowComposer] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);

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
          position: "relative",
          width: "100%",
          marginBottom: "18px",
          userSelect: "none",
        }}
      >
        {/* Flecha izquierda (Desktop) */}
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="stories-scroll-arrow stories-scroll-left"
          style={{
            position: "absolute",
            left: "-12px",
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
            padding: "4px 2px 8px",
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
              <div
                style={{
                  fontSize: "9.5px",
                  color: myStories.length > 0 ? "#FFD700" : "rgba(255, 255, 255, 0.65)",
                  fontWeight: "700",
                  marginTop: "2px",
                }}
              >
                {myStories.length > 0 ? `(${myStories.length})` : "24h"}
              </div>
            </div>
          </div>

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
              right: "-12px",
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
