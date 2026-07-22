"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════════════════
   FOLLOWERS MODAL — Lista de Seguidores y Siguiendo
   ═══════════════════════════════════════════════════════════════════════════ */

function avatarStyle(url, size) {
  return {
    width: `${size}px`, height: `${size}px`, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: `${Math.floor(size * 0.42)}px`, fontWeight: "800", color: "#FFFFFF",
    background: url ? `url(${url}) center/cover` : "linear-gradient(135deg, #FFD700 0%, #FFDF33 100%)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  };
}

export default function FollowersModal({ userId, session, lang, initialTab = "followers", onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [followingMap, setFollowingMap] = useState({}); // track which users I follow
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
        <div style={{ padding: "32px", textAlign: "center" }}>
          <div style={{ width: "28px", height: "28px", border: "2px solid rgba(20, 109, 158, 0.10)", borderTopColor: "var(--atlan-gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>
            {activeTab === "followers" ? "👥" : "🔍"}
          </span>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--atlan-text-muted)" }}>
            {activeTab === "followers"
              ? (lang === "en" ? "No followers yet" : "Sin seguidores aún")
              : (lang === "en" ? "Not following anyone yet" : "No sigue a nadie aún")}
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
            <div key={user.id} style={styles.userRow}>
              <Link
                href={`/comunidad/perfil/${user.id}`}
                onClick={onClose}
                style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", flex: 1, minWidth: 0 }}
              >
                <div style={avatarStyle(user.avatar_url, 42)}>
                  {!user.avatar_url && (user.nombre_completo?.[0]?.toUpperCase() || "U")}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--atlan-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.nombre_completo || "Usuario"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--atlan-text-muted)" }}>
                    {user.rol === "dueno" ? "🏢 Propietario" : user.rol === "admin" ? "⚡ Admin" : "🧳 Turista"}
                  </div>
                </div>
              </Link>
              {!isMe && session?.user && (
                <button
                  onClick={() => handleFollow(user.id)}
                  disabled={followLoadingId === user.id}
                  style={{
                    padding: "7px 16px", border: "none", borderRadius: "20px",
                    fontSize: "12px", fontWeight: "800", cursor: "pointer",
                    transition: "all 0.2s", whiteSpace: "nowrap",
                    background: amFollowing
                      ? "rgba(20, 109, 158, 0.08)"
                      : "linear-gradient(135deg, #17AA4A 0%, #128A3C 100%)",
                    color: amFollowing ? "var(--atlan-text-secondary)" : "white",
                    boxShadow: amFollowing ? "none" : "0 2px 8px rgba(23, 170, 74,0.2)",
                  }}
                >
                  {amFollowing
                    ? (lang === "en" ? "Following" : "Siguiendo")
                    : (lang === "en" ? "Follow" : "Seguir")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="clay-modal-overlay" onClick={onClose}>
      <div className="clay-modal animate-fade-in-up" style={{ maxWidth: '460px', maxHeight: '80vh', padding: 0, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--atlan-text-primary)" }}>
            {lang === "en" ? "Connections" : "Conexiones"}
          </h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("followers")}
            style={{
              ...styles.tab,
              color: activeTab === "followers" ? "var(--atlan-gold)" : "var(--atlan-text-muted)",
              borderBottom: activeTab === "followers" ? "2px solid var(--atlan-gold)" : "2px solid transparent",
            }}
          >
            👥 {lang === "en" ? "Followers" : "Seguidores"}
            <span style={styles.tabCount}>{followers.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("following")}
            style={{
              ...styles.tab,
              color: activeTab === "following" ? "var(--atlan-gold)" : "var(--atlan-text-muted)",
              borderBottom: activeTab === "following" ? "2px solid var(--atlan-gold)" : "2px solid transparent",
            }}
          >
            ✨ {lang === "en" ? "Following" : "Siguiendo"}
            <span style={styles.tabCount}>{following.length}</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === "followers"
          ? renderUserList(followers, loadingFollowers)
          : renderUserList(following, loadingFollowing)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0, 0, 0, 0.40)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
  },
  modal: {
    /* styles now applied via className clay-modal */
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 24px 0",
  },
  closeBtn: {
    background: "rgba(20, 109, 158, 0.08)", border: "none", color: "var(--atlan-text-muted)",
    width: "32px", height: "32px", borderRadius: "50%", fontSize: "14px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },
  tabs: {
    display: "flex", gap: "0", padding: "16px 24px 0",
    borderBottom: "1px solid rgba(20, 109, 158, 0.08)",
  },
  tab: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    padding: "12px 0", background: "none", border: "none",
    fontSize: "14px", fontWeight: "700", cursor: "pointer",
    transition: "all 0.2s",
  },
  tabCount: {
    fontSize: "12px", fontWeight: "800", padding: "2px 8px", borderRadius: "10px",
    background: "rgba(20, 109, 158, 0.08)",
  },
  userList: {
    overflowY: "auto", flex: 1, padding: "8px 16px",
  },
  userRow: {
    display: "flex", alignItems: "center", gap: "10px", padding: "10px 8px",
    borderBottom: "1px solid rgba(20, 109, 158, 0.04)",
    transition: "background 0.15s",
  },
};
