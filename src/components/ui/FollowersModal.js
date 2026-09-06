"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Icon from "@/components/ui/Icon";

// Modal de lista de seguidores y siguiendo (Conexiones)

function avatarStyle(url, size) {
  return {
    width: `${size}px`, height: `${size}px`, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: `${Math.floor(size * 0.42)}px`, fontWeight: "800", color: "#FFFFFF",
    background: url ? `url(${url}) center/cover` : "linear-gradient(135deg, #0A192F 0%, #1E3A5F 100%)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    border: "2px solid #FFFFFF"
  };
}

export default function FollowersModal({ userId, session, lang, initialTab = "followers", onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [followingMap, setFollowingMap] = useState({});
  const [followLoadingId, setFollowLoadingId] = useState(null);

  // Fetch followers
  const fetchFollowers = useCallback(async () => {
    setLoadingFollowers(true);
    try {
      const { data } = await supabase
        .from("seguimientos")
        .select("seguidor_id, perfiles!seguimientos_seguidor_id_fkey(id, nombre_completo, avatar_url, rol)")
        .eq("seguido_id", userId);

      const list = (data || []).map(d => d.perfiles).filter(Boolean);
      setFollowers(list);
    } catch (err) {
      console.error("Error fetching followers:", err);
    } finally {
      setLoadingFollowers(false);
    }
  }, [userId]);

  // Fetch following
  const fetchFollowing = useCallback(async () => {
    setLoadingFollowing(true);
    try {
      const { data } = await supabase
        .from("seguimientos")
        .select("seguido_id, perfiles!seguimientos_seguido_id_fkey(id, nombre_completo, avatar_url, rol)")
        .eq("seguidor_id", userId);

      const list = (data || []).map(d => d.perfiles).filter(Boolean);
      setFollowing(list);
    } catch (err) {
      console.error("Error fetching following:", err);
    } finally {
      setLoadingFollowing(false);
    }
  }, [userId]);

  // Check which users I (current session) am following
  const checkMyFollowing = useCallback(async () => {
    if (!session?.user) return;
    try {
      const { data } = await supabase
        .from("seguimientos")
        .select("seguido_id")
        .eq("seguidor_id", session.user.id);
      const map = {};
      (data || []).forEach(d => { map[d.seguido_id] = true; });
      setFollowingMap(map);
    } catch (err) {
      console.error("Error checking following:", err);
    }
  }, [session]);

  useEffect(() => {
    fetchFollowers();
    fetchFollowing();
    checkMyFollowing();
  }, [fetchFollowers, fetchFollowing, checkMyFollowing]);

  const handleFollow = async (targetId) => {
    if (!session?.user) return;
    setFollowLoadingId(targetId);
    try {
      if (followingMap[targetId]) {
        await supabase.from("seguimientos").delete()
          .eq("seguidor_id", session.user.id)
          .eq("seguido_id", targetId);
        setFollowingMap(prev => { const n = { ...prev }; delete n[targetId]; return n; });
      } else {
        await supabase.from("seguimientos").insert({
          seguidor_id: session.user.id,
          seguido_id: targetId,
        });
        setFollowingMap(prev => ({ ...prev, [targetId]: true }));
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoadingId(null);
    }
  };

  const renderUserList = (users, isLoading) => {
    if (isLoading) {
      return (
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid rgba(20, 109, 158, 0.12)", borderTopColor: "#146D9E", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          <p style={{ margin: "12px 0 0", fontSize: "13px", color: "var(--atlan-text-muted)", fontWeight: "600" }}>
            {lang === "en" ? "Loading connections..." : "Cargando conexiones..."}
          </p>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(20, 109, 158, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
            <img src={activeTab === "followers" ? "/images/comunidad.svg" : "/images/tortuga.svg"} alt="" style={{ width: "28px", height: "28px", objectFit: "contain", filter: "brightness(0) saturate(100%) invert(34%) sepia(85%) saturate(1045%) hue-rotate(170deg)" }} />
          </div>
          <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
            {activeTab === "followers"
              ? (lang === "en" ? "No followers yet" : "Sin seguidores aún")
              : (lang === "en" ? "Not following anyone yet" : "No sigue a nadie aún")}
          </h4>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--atlan-text-muted)", maxWidth: "260px" }}>
            {activeTab === "followers"
              ? (lang === "en" ? "When someone follows this profile, they will show up here." : "Cuando alguien siga a este perfil, aparecerá aquí.")
              : (lang === "en" ? "Profiles followed by this user will appear here." : "Los perfiles que siga este usuario aparecerán aquí.")}
          </p>
        </div>
      );
    }

    return (
      <div style={styles.userList}>
        {users.map(user => {
          const isMe = session?.user?.id === user.id;
          const amFollowing = followingMap[user.id];
          return (
            <div key={user.id} style={styles.userCard}>
              <Link
                href={`/comunidad/perfil/${user.id}`}
                onClick={onClose}
                style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", flex: 1, minWidth: 0 }}
              >
                <div style={avatarStyle(user.avatar_url, 44)}>
                  {!user.avatar_url && (user.nombre_completo?.[0]?.toUpperCase() || "U")}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: "800", fontSize: "14px", color: "var(--atlan-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.nombre_completo || "Usuario"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                    {user.rol === "dueno"
                      ? <span style={styles.badgeDueno}><Icon name="building" size={10} /> Propietario</span>
                      : user.rol === "admin"
                      ? <span style={styles.badgeAdmin}><Icon name="zap" size={10} /> Admin</span>
                      : (user.es_premium || user.suscripcion_activa || user.rol === "turista_deacachimba")
                      ? <span style={styles.badgePremium}><Icon name="star" size={10} /> Turista Deacachimba</span>
                      : <span style={styles.badgeTurista}><Icon name="luggage" size={10} /> Turista Tuani</span>}
                  </div>
                </div>
              </Link>
              {!isMe && session?.user && (
                <button
                  onClick={() => handleFollow(user.id)}
                  disabled={followLoadingId === user.id}
                  style={{
                    padding: "8px 18px",
                    border: amFollowing ? "1px solid #CBD5E1" : "1px solid rgba(20, 109, 158, 0.3)",
                    borderRadius: "14px",
                    fontSize: "12.5px",
                    fontWeight: "800",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                    background: amFollowing
                      ? "rgba(241, 245, 249, 0.9)"
                      : "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)",
                    color: amFollowing ? "#475569" : "#FFFFFF",
                    boxShadow: amFollowing ? "none" : "0 3px 10px rgba(20, 109, 158, 0.25)",
                    opacity: followLoadingId === user.id ? 0.6 : 1
                  }}
                >
                  {amFollowing
                    ? (lang === "en" ? "Following" : "✓ Siguiendo")
                    : (lang === "en" ? "Follow" : "+ Seguir")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()} className="animate-fade-in-up">
        {/* Header Banner */}
        <div style={styles.headerBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/images/comunidad.svg" alt="" style={{ width: "22px", height: "22px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "-0.2px" }}>
              {lang === "en" ? "Connections" : "Conexiones"}
            </h3>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Tab Controls (Segmented Bar) */}
        <div style={styles.tabContainer}>
          <div style={styles.segmentedBar}>
            <button
              onClick={() => setActiveTab("followers")}
              style={{
                ...styles.tabBtn,
                background: activeTab === "followers" ? "#FFFFFF" : "transparent",
                color: activeTab === "followers" ? "#146D9E" : "#64748B",
                boxShadow: activeTab === "followers" ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
              }}
            >
              <img
                src="/images/comunidad.svg"
                alt=""
                style={{
                  width: "16px",
                  height: "16px",
                  objectFit: "contain",
                  filter: activeTab === "followers"
                    ? "brightness(0) saturate(100%) invert(34%) sepia(85%) saturate(1045%) hue-rotate(170deg)"
                    : "brightness(0) opacity(0.5)",
                  transition: "all 0.2s"
                }}
              />
              <span>{lang === "en" ? "Followers" : "Seguidores"}</span>
              <span style={{
                ...styles.tabCount,
                background: activeTab === "followers" ? "rgba(20, 109, 158, 0.12)" : "rgba(100, 116, 139, 0.12)",
                color: activeTab === "followers" ? "#146D9E" : "#64748B"
              }}>
                {followers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("following")}
              style={{
                ...styles.tabBtn,
                background: activeTab === "following" ? "#FFFFFF" : "transparent",
                color: activeTab === "following" ? "#146D9E" : "#64748B",
                boxShadow: activeTab === "following" ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
              }}
            >
              <img
                src="/images/tortuga.svg"
                alt=""
                style={{
                  width: "16px",
                  height: "16px",
                  objectFit: "contain",
                  filter: activeTab === "following"
                    ? "brightness(0) saturate(100%) invert(34%) sepia(85%) saturate(1045%) hue-rotate(170deg)"
                    : "brightness(0) opacity(0.5)",
                  transition: "all 0.2s"
                }}
              />
              <span>{lang === "en" ? "Following" : "Siguiendo"}</span>
              <span style={{
                ...styles.tabCount,
                background: activeTab === "following" ? "rgba(20, 109, 158, 0.12)" : "rgba(100, 116, 139, 0.12)",
                color: activeTab === "following" ? "#146D9E" : "#64748B"
              }}>
                {following.length}
              </span>
            </button>
          </div>
        </div>

        {/* List Content */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {activeTab === "followers"
            ? renderUserList(followers, loadingFollowers)
            : renderUserList(following, loadingFollowing)}
        </div>
      </div>
    </div>
  );
}

// Estilos
const styles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 999999,
    background: "rgba(10, 25, 47, 0.65)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    boxSizing: "border-box"
  },
  container: {
    width: "100%", maxWidth: "480px", height: "auto", maxHeight: "80vh",
    background: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.95)",
    borderRadius: "28px", overflow: "hidden",
    boxShadow: "0 24px 60px rgba(10, 25, 47, 0.3)",
    display: "flex", flexDirection: "column", boxSizing: "border-box"
  },
  headerBanner: {
    background: "linear-gradient(135deg, #0A192F 0%, #102A45 100%)",
    padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
  },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.15)", border: "none", color: "#FFFFFF",
    width: "32px", height: "32px", borderRadius: "50%", fontSize: "14px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.2s", backdropFilter: "blur(4px)"
  },
  tabContainer: {
    padding: "14px 20px 10px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0"
  },
  segmentedBar: {
    display: "flex", background: "#E2E8F0", padding: "4px", borderRadius: "16px"
  },
  tabBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    padding: "9px 12px", border: "none", borderRadius: "12px",
    fontSize: "13.5px", fontWeight: "800", cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
  },
  tabCount: {
    fontSize: "11.5px", fontWeight: "800", padding: "2px 8px", borderRadius: "10px",
    transition: "all 0.2s"
  },
  userList: {
    overflowY: "auto", flex: 1, padding: "14px 20px", display: "flex", flexDirection: "column", gap: "10px"
  },
  userCard: {
    display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px",
    background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "18px",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)", transition: "all 0.2s ease"
  },
  badgeDueno: {
    background: "rgba(255, 215, 0, 0.15)", color: "var(--atlan-gold, #B8860B)",
    padding: "2px 6px", borderRadius: "6px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px"
  },
  badgeAdmin: {
    background: "rgba(239, 68, 68, 0.12)", color: "#EF4444",
    padding: "2px 6px", borderRadius: "6px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px"
  },
  badgePremium: {
    background: "rgba(56, 189, 248, 0.12)", color: "#0EA5E9",
    padding: "2px 6px", borderRadius: "6px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px"
  },
  badgeTurista: {
    background: "rgba(100, 116, 139, 0.1)", color: "#64748B",
    padding: "2px 6px", borderRadius: "6px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px"
  }
};
