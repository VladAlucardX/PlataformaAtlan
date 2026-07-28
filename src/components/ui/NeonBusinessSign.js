"use client";

import React from "react";
import Link from "next/link";

export default function NeonBusinessSign({ session }) {
  const targetLink = session ? "/dashboard" : "/registro";

  return (
    <Link href={targetLink} style={{ textDecoration: "none", display: "inline-block" }}>
      <div className="neon-sign-box neon-yellow-bg-panel">
        {/* Nuevo SVG de casa.svg (local comercial de 2 pisos) en Blanco Neón (#FFFFFF) con divisiones en Negro (#1A1A2E) */}
        <div className="neon-map-wrapper">
          <svg
            width="170"
            height="170"
            viewBox="0 0 1024 1024"
            className="neon-house-svg-white"
          >
            <g>
              {/* Estructura del local */}
              <path
                d="M64 96h896v928H64z"
                fill="#FFFFFF"
                stroke="#1A1A2E"
                strokeWidth="18"
                strokeLinejoin="round"
              />
              {/* Puerta principal */}
              <path
                d="M224 704h192v320H224z"
                fill="#E2B800"
                stroke="#1A1A2E"
                strokeWidth="16"
                strokeLinejoin="round"
              />
              {/* Ventanas del local */}
              <path
                d="M608 640h192v224h-192zM608 160h192v224h-192zM224 160h192v224H224z"
                fill="#E2B800"
                stroke="#1A1A2E"
                strokeWidth="14"
                strokeLinejoin="round"
              />
              {/* Marquesinas / Cornisas de división */}
              <path
                d="M1024 64a32 32 0 0 1-32 32H32a32 32 0 0 1-32-32V32a32 32 0 0 1 32-32h960a32 32 0 0 1 32 32v32zM1024 544a32 32 0 0 1-32 32H32a32 32 0 0 1-32-32v-32a32 32 0 0 1 32-32h960a32 32 0 0 1 32 32v32z"
                fill="#FFFFFF"
                stroke="#1A1A2E"
                strokeWidth="16"
                strokeLinejoin="round"
              />
              {/* Arbustos / Base */}
              <path
                d="M238.24 1024A126.656 126.656 0 0 0 256 960a128 128 0 0 0-256 0c0 23.424 6.752 45.088 17.76 64h220.48zM896 832a127.744 127.744 0 0 0-116.224 75.04A94.848 94.848 0 0 0 736 896a96 96 0 0 0-96 96c0 11.296 2.304 21.952 5.888 32h360.384A126.944 126.944 0 0 0 1024 960a128 128 0 0 0-128-128z"
                fill="#FFFFFF"
                stroke="#1A1A2E"
                strokeWidth="14"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        {/* Texto Neón Blanco abajo sobre fondo Amarillo */}
        <div className="neon-sign-text-white-bg">
          <span>¿TIENES UN NEGOCIO?</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="neon-arrow-white-bg">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 1-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
