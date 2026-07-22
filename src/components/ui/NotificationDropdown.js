"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";

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
            if (newNotif.tipo === "follow") {
              bodyText = `${creator?.nombre_completo || "Alguien"} ${lang === "en" ? "started following you" : "comenzó a seguirte"}`;
            } else if (newNotif.tipo === "comment") {
              bodyText = `${creator?.nombre_completo || "Alguien"} ${lang === "en" ? "commented on your post" : "comentó tu publicación"}`;
            } else if (newNotif.tipo === "like") {
              bodyText = `${creator?.nombre_completo || "Alguien"} ${lang === "en" ? "liked your post" : "le dio me gusta a tu publicación"}`;
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

  const getNotifText = (notif) => {
    const name = notif.creador?.nombre_completo || "Usuario";
    if (notif.tipo === "follow") {
      return `${name} ${t("notifications.followedYou")}`;
    }
    if (notif.tipo === "comment") {
      return `${name} ${t("notifications.commentedPost")}`;
    }
    if (notif.tipo === "like") {
      return `${name} ${t("notifications.likedPost")}`;
    }
    return "";
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Botón Campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "18px", color: isOpen ? "var(--atlan-gold)" : "var(--atlan-text-secondary)",
          padding: "6px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "color 0.2s"
        }}
        title={t("notifications.title")}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "1px", right: "1px",
            background: "#ef4444", color: "white", borderRadius: "50%",
            width: "16px", height: "16px", fontSize: "10px", fontWeight: "900",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 6px rgba(239, 68, 68, 0.6)"
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="clay-dropdown animate-fade-in-up" style={{
          position: "absolute", right: 0, top: "40px", zIndex: 150,
          width: "320px",
          fontFamily: "'Delight', 'Delight Static', var(--font-outfit), sans-serif"
        }}>
          
          {/* Header del Dropdown */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 16px", borderBottom: "1px solid rgba(20, 109, 158, 0.10)",
            background: "rgba(255,255,255,0.02)"
          }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--atlan-text-primary)" }}>
              {t("notifications.title")}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none", border: "none", color: "#146D9E",
                  fontSize: "11.5px", fontWeight: "500", cursor: "pointer", padding: 0
                }}
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {/* Listado */}
          <div style={{ maxHeight: "280px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--atlan-text-muted)", fontSize: "13px" }}>
                <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>📭</span>
                {t("notifications.empty")}
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    width: "100%", padding: "12px 16px", border: "none",
                    borderBottom: "1px solid rgba(20, 109, 158, 0.04)",
                    background: notif.leido ? "transparent" : "rgba(255, 215, 0, 0.04)",
                    display: "flex", gap: "10px", alignItems: "center",
                    cursor: "pointer", transition: "background 0.2s",
                    textAlign: "left"
                  }}
                  className="notif-item"
                >
                  {/* Creador Avatar */}
                  <div style={avatarStyle(notif.creador?.avatar_url, 36)}>
                    {!notif.creador?.avatar_url && (notif.creador?.nombre_completo?.[0]?.toUpperCase() || "U")}
                  </div>

                  {/* Detalle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: "12.5px", lineHeight: "1.4",
                      color: notif.leido ? "var(--atlan-text-secondary)" : "var(--atlan-text-primary)",
                      fontWeight: notif.leido ? "400" : "500",
                      wordBreak: "break-word"
                    }}>
                      {getNotifText(notif)}
                    </p>
                    <span style={{ fontSize: "10px", color: "var(--atlan-text-muted)", marginTop: "4px", display: "block" }}>
                      {timeAgo(notif.created_at, lang)}
                    </span>
                  </div>

                  {/* Indicador de No Leído */}
                  {!notif.leido && (
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: "var(--atlan-gold)", flexShrink: 0
                    }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
