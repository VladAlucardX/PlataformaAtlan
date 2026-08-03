"use client";

import React from "react";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/hooks/useTranslation";

export default function DepartmentTabs({ activeTab, onSelectTab }) {
  const { t, lang } = useTranslation();

  const TABS = [
    { id: "historia", label: t("nicaragua.history") || (lang === "en" ? "History" : "Historia"), icon: "book", emoji: "📜" },
    { id: "economia", label: t("nicaragua.economy") || (lang === "en" ? "Economy" : "Economía"), icon: "trendingUp", emoji: "💰" },
    { id: "turismo", label: t("nicaragua.tourism") || (lang === "en" ? "Tourism" : "Turismo"), icon: "compass", emoji: "🏖️" },
    { id: "pasatiempos", label: t("nicaragua.hobbies") || (lang === "en" ? "Hobbies & Culture" : "Pasatiempos"), icon: "music", emoji: "🎭" },
    { id: "lugares", label: t("nicaragua.landmarks") || (lang === "en" ? "Landmarks" : "Lugares Importantes"), icon: "landmark", emoji: "📍" },
    { id: "actividades", label: t("nicaragua.activities") || (lang === "en" ? "Activities & Events" : "Actividades"), icon: "calendar", emoji: "🎉" },
  ];

  return (
    <div style={{
      position: "sticky",
      top: "64px",
      zIndex: 90,
      background: "rgba(10, 25, 47, 0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
      padding: "10px 0",
      boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch"
      }} className="dept-tabs-scroll">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "14px",
                border: isActive ? "1.5px solid #FFD700" : "1px solid rgba(255,255,255,0.12)",
                background: isActive
                  ? "linear-gradient(135deg, rgba(255, 215, 0, 0.22) 0%, rgba(20, 109, 158, 0.4) 100%)"
                  : "rgba(255, 255, 255, 0.05)",
                color: isActive ? "#FFD700" : "rgba(255, 255, 255, 0.75)",
                fontWeight: isActive ? "800" : "600",
                fontSize: "14px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isActive ? "0 4px 16px rgba(255, 215, 0, 0.25)" : "none",
                outline: "none"
              }}
              className="dept-tab-btn"
            >
              <span style={{ fontSize: "16px" }}>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
