"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import Icon from "@/components/ui/Icon";

function timeAgo(dateStr, lang) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return lang === "en" ? "Now" : lang === "zh" ? "刚刚" : "Ahora";
  if (diffMin < 60) return lang === "en" ? `${diffMin}m ago` : lang === "zh" ? `${diffMin}分钟前` : `hace ${diffMin}m`;
  if (diffHr < 24) return lang === "en" ? `${diffHr}h ago` : lang === "zh" ? `${diffHr}小时前` : `hace ${diffHr}h`;
  return lang === "en" ? `${diffDay}d ago` : lang === "zh" ? `${diffDay}天前` : `hace ${diffDay}d`;
}

function avatarStyle(url, size) {
  return {
    width: `${size}px`, height: `${size}px`, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: `${Math.floor(size * 0.42)}px`, fontWeight: "600", color: "#FFFFFF",
    background: url ? `url("${url}") center/cover no-repeat` : "linear-gradient(135deg, #334155 0%, #1E293B 100%)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    border: "1.5px solid #FFFFFF",
    overflow: "hidden"
  };
}

export default function NotificationDropdown({ session }) {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Pedir permisos de notificaciones push del navegador al montar
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Cargar notificaciones iniciales
  useEffect(() => {
    if (!session?.user) return;

    const fetchNotifications = async () => {
      try {
        // Cargar las últimas 15 notificaciones
        const { data } = await supabase
          .from("notificaciones")
          .select("*, creador:perfiles!notificaciones_creador_id_fkey(id, nombre_completo, avatar_url, rol)")
          .eq("usuario_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(15);
        setNotifications(data || []);

        // Cargar contador de no leídas
        const { count } = await supabase
          .from("notificaciones")
          .select("id", { count: "exact", head: true })
          .eq("usuario_id", session.user.id)
          .eq("leido", false);
        setUnreadCount(count || 0);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, [session]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!session?.user) return;

    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`realtime-notif-${session.user.id}-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `usuario_id=eq.${session.user.id}`,
        },
        async (payload) => {
          const newNotif = payload.new;

          // Obtener datos del creador para enriquecer la UI
          const { data: creator } = await supabase
            .from("perfiles")
            .select("id, nombre_completo, avatar_url, rol")
            .eq("id", newNotif.creador_id)
            .single();

          const enriched = { ...newNotif, creador: creator };

          setNotifications((prev) => [enriched, ...prev].slice(0, 15));
          setUnreadCount((prev) => prev + 1);

          // Mostrar notificación Push del navegador
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            let bodyText = "";
            const creatorName = creator?.nombre_completo || (lang === "en" ? "Someone" : lang === "zh" ? "有人" : "Alguien");
            if (newNotif.tipo === "follow") {
              bodyText = `${creatorName} ${lang === "en" ? "started following you" : lang === "zh" ? "关注了您" : "comenzó a seguirte"}`;
            } else if (newNotif.tipo === "comment") {
              bodyText = `${creatorName} ${lang === "en" ? "commented on your post" : lang === "zh" ? "评论了您的动态" : "comentó tu publicación"}`;
            } else if (newNotif.tipo === "like") {
              bodyText = `${creatorName} ${lang === "en" ? "liked your post" : lang === "zh" ? "赞了您的动态" : "le dio me gusta a tu publicación"}`;
            }

            try {
              // Intentar mostrar por Service Worker si está registrado
              const reg = await navigator.serviceWorker.getRegistration();
              if (reg) {
                reg.showNotification("Atlan Comunidad", {
                  body: bodyText,
                  icon: creator?.avatar_url || "/mapaicono.png",
                  badge: "/mapaicono.png",
                  vibrate: [100, 50, 100],
                  data: { url: "/comunidad" }
                });
              } else {
                new Notification("Atlan Comunidad", {
                  body: bodyText,
                  icon: creator?.avatar_url || "/mapaicono.png"
                });
              }
            } catch (e) {
              // Fallback
              new Notification("Atlan Comunidad", {
                body: bodyText,
                icon: creator?.avatar_url || "/mapaicono.png"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, lang]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await supabase
        .from("notificaciones")
        .update({ leido: true })
        .eq("usuario_id", session.user.id)
        .eq("leido", false);

      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, leido: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.leido) {
      try {
        await supabase
          .from("notificaciones")
          .update({ leido: true })
          .eq("id", notif.id);

        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, leido: true } : n))
        );
      } catch (err) {
        console.error("Error marking read:", err);
      }
    }

    setIsOpen(false);

    // Redirigir según el tipo
    if (notif.tipo === "follow") {
      router.push(`/comunidad/perfil/${notif.creador_id}`);
    } else {
      // Para comments y likes, llevamos a la comunidad general
      router.push(`/comunidad`);
    }
  };

  const renderTypeBadge = (tipo) => {
    if (tipo === "like") {
      return (
        <div style={{
          position: "absolute", bottom: "-2px", right: "-2px",
          width: "16px", height: "16px", borderRadius: "50%",
          background: "#EF4444", color: "#FFFFFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1.5px solid #0B192C", boxShadow: "0 1px 3px rgba(0,0,0,0.4)"
        }}>
          <Icon name="heartFilled" size={9} color="#FFFFFF" fill="#FFFFFF" />
        </div>
      );
    }
    if (tipo === "comment") {
      return (
        <div style={{
          position: "absolute", bottom: "-2px", right: "-2px",
          width: "16px", height: "16px", borderRadius: "50%",
          background: "#0284C7", color: "#FFFFFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1.5px solid #0B192C", boxShadow: "0 1px 3px rgba(0,0,0,0.4)"
        }}>
          <Icon name="messageCircle" size={9} color="#FFFFFF" />
        </div>
      );
    }
    if (tipo === "follow") {
      return (
        <div style={{
          position: "absolute", bottom: "-2px", right: "-2px",
          width: "16px", height: "16px", borderRadius: "50%",
          background: "#10B981", color: "#FFFFFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1.5px solid #0B192C", boxShadow: "0 1px 3px rgba(0,0,0,0.4)"
        }}>
          <Icon name="user" size={9} color="#FFFFFF" />
        </div>
      );
    }
    return null;
  };

  const renderNotifContent = (notif) => {
    const name = notif.creador?.nombre_completo || (lang === "en" ? "User" : lang === "zh" ? "用户" : "Usuario");
    let actionText = "";
    if (notif.tipo === "follow") {
      actionText = t("notifications.followedYou");
    } else if (notif.tipo === "comment") {
      actionText = t("notifications.commentedPost");
    } else if (notif.tipo === "like") {
      actionText = t("notifications.likedPost");
    }

    return (
      <p style={{
        margin: 0,
        fontSize: "13.5px",
        lineHeight: "1.45",
        fontFamily: "var(--font-outfit), var(--font-inter), 'Inter', sans-serif !important",
        wordBreak: "break-word"
      }}>
        <span style={{ color: "#FFFFFF", fontWeight: "750" }}>{name}</span>{" "}
        <span style={{ color: "#CBD5E1", fontWeight: "400" }}>{actionText}</span>
      </p>
    );
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Botón Campana Blanco */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? "rgba(255, 255, 255, 0.15)" : "none",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          color: "#FFFFFF",
          padding: "7px",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s, opacity 0.2s",
          opacity: isOpen ? 1 : 0.95
        }}
        title={t("notifications.title")}
        aria-label={t("notifications.title")}
      >
        <Icon name="bell" size={20} color="#FFFFFF" />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            background: "#EF4444",
            color: "#FFFFFF",
            borderRadius: "9999px",
            minWidth: "16px",
            height: "16px",
            padding: "0 4px",
            fontSize: "10px",
            fontWeight: "750",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 5px rgba(239, 68, 68, 0.5)",
            border: "1.5px solid #0B192C",
            lineHeight: 1
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel en Grises y Azul Pizarra (estilo Ranking) */}
      {isOpen && (
        <div className="notif-dropdown-panel animate-fade-in-down">
          
          {/* Header del Dropdown */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "13px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
            background: "rgba(15, 29, 49, 0.85)"
          }}>
            <span style={{
              fontSize: "14.5px",
              fontWeight: "800",
              color: "#FFFFFF",
              letterSpacing: "0.2px"
            }}>
              {t("notifications.title")}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  color: "#38BDF8",
                  fontSize: "11.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(56, 189, 248, 0.22)";
                  e.currentTarget.style.color = "#7DD3FC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(56, 189, 248, 0.12)";
                  e.currentTarget.style.color = "#38BDF8";
                }}
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {/* Listado */}
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: "36px 16px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Icon name="bell" size={22} color="#94A3B8" />
                </div>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#94A3B8" }}>
                  {t("notifications.empty")}
                </span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotifClick(notif)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNotifClick(notif);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                    borderLeft: notif.leido ? "3px solid transparent" : "3px solid #38BDF8",
                    background: notif.leido ? "transparent" : "rgba(30, 58, 95, 0.50)",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    cursor: "pointer",
                    boxSizing: "border-box"
                  }}
                  className="notif-item"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = notif.leido
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(30, 58, 95, 0.75)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.leido
                      ? "transparent"
                      : "rgba(30, 58, 95, 0.50)";
                  }}
                >
                  {/* Creador Avatar con Badge de tipo */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={avatarStyle(notif.creador?.avatar_url, 38)}>
                      {!notif.creador?.avatar_url && (notif.creador?.nombre_completo?.[0]?.toUpperCase() || "U")}
                    </div>
                    {renderTypeBadge(notif.tipo)}
                  </div>

                  {/* Detalle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {renderNotifContent(notif)}
                    <span style={{
                      fontSize: "11px",
                      color: "#94A3B8",
                      marginTop: "3px",
                      display: "block",
                      fontWeight: "500"
                    }}>
                      {timeAgo(notif.created_at, lang)}
                    </span>
                  </div>

                  {/* Indicador de No Leído */}
                  {!notif.leido && (
                    <div
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "#38BDF8",
                        boxShadow: "0 0 8px rgba(56, 189, 248, 0.85)",
                        flexShrink: 0
                      }}
                      title="No leído"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
