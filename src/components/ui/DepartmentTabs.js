"use client";

import React from "react";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/hooks/useTranslation";

export default function DepartmentTabs({ activeTab, onSelectTab, isModal = false }) {
  const { t, lang } = useTranslation();

  const TABS = [
    { id: "galeria", label: lang === "en" ? "Gallery" : "Galería", svgs: ["/images/masaaya.svg"] },
    { id: "historia", label: lang === "en" ? "History" : "Historia", svgs: ["/images/managua catedral.svg"] },
    { id: "economia", label: lang === "en" ? "Economy" : "Economía", svgs: ["/images/cacao.svg"] },
    { id: "turismo", label: lang === "en" ? "Tourism" : "Turismo", svgs: ["/images/playa.svg"] },
    { id: "pasatiempos", label: lang === "en" ? "Hobbies & Culture" : "Pasatiempos", svgs: ["/images/Volcan.svg"] },
    { id: "lugares", label: lang === "en" ? "Landmarks & Activities" : "Lugares y Actividades", svgs: ["/images/San Juan del sur.svg", "/images/caña.svg"] },
  ];

  return (
    <div style={{
      position: isModal ? "relative" : "sticky",
      top: isModal ? "0" : "64px",
      zIndex: 90,
      background: isModal ? "rgba(15, 23, 42, 0.98)" : "rgba(10, 25, 47, 0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
      padding: isModal ? "8px 0" : "10px 0",
      boxShadow: isModal ? "none" : "0 8px 20px rgba(0,0,0,0.3)"
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: isModal ? "0 16px" : "0 20px",
        display: "flex",
        alignItems: "center",
        gap: isModal ? "6px" : "10px",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch"
      }} className="dept-tabs-scroll">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === "lugares" && activeTab === "actividades");
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: isModal ? "6px" : "8px",
                padding: isModal ? "7px 14px" : "10px 18px",
                borderRadius: isModal ? "10px" : "14px",
                border: isActive ? "1.5px solid #FFD700" : "1px solid rgba(255,255,255,0.12)",
                background: isActive
                  ? "linear-gradient(135deg, rgba(255, 215, 0, 0.22) 0%, rgba(20, 109, 158, 0.4) 100%)"
                  : "rgba(255, 255, 255, 0.05)",
                color: isActive ? "#FFD700" : "rgba(255, 255, 255, 0.75)",
                fontWeight: isActive ? "800" : "600",
                fontSize: isModal ? "12.5px" : "14px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isActive ? "0 4px 14px rgba(255, 215, 0, 0.25)" : "none",
                outline: "none"
              }}
              className="dept-tab-btn"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {tab.svgs.map((svgPath, sIdx) => (
                  <img
                    key={sIdx}
                    src={svgPath}
                    alt={tab.label}
                    style={{
                      width: isModal ? "16px" : "18px",
                      height: isModal ? "16px" : "18px",
                      objectFit: "contain",
                      filter: isActive
                        ? "brightness(0) saturate(100%) invert(84%) sepia(54%) saturate(988%) hue-rotate(359deg) brightness(104%) contrast(104%)"
                        : "brightness(0) invert(0.85)"
                    }}
                  />
                ))}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
