"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * useInactivityLogout — Cierra la sesión del usuario tras 15 minutos sin interacción.
 *
 * Escucha eventos DOM de interacción real (mouse, teclado, touch, scroll).
 * Cualquier uso del mapa (pan, zoom, click en marcadores) genera estos mismos
 * eventos nativos, por lo que el timer se reinicia automáticamente al usar el mapa.
 *
 * @param {boolean} isAuthenticated - Si hay sesión activa
 * @param {Function} onLogout - Callback para limpiar estado de auth
 * @param {number} timeoutMs - Tiempo de inactividad en ms (default: 900000 = 15 min)
 */
export function useInactivityLogout(isAuthenticated, onLogout, timeoutMs = 900000) {
  const timerRef = useRef(null);
  const router = useRouter();

  const performLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Atlan] Error al cerrar sesión por inactividad:", err);
    }
    if (onLogout) onLogout();
    router.push("/login");
  }, [onLogout, router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(performLogout, timeoutMs);
  }, [performLogout, timeoutMs]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Sin sesión activa, no activar el timer
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Eventos que consideramos como "actividad del usuario"
    // Incluye todos los que Mapbox GL genera al interactuar con el mapa
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "touchmove",
      "scroll",
      "click",
      "wheel",
      "pointerdown",
      "pointermove",
    ];

    // Iniciar el timer al montar
    resetTimer();

    // Registrar listeners
    const handleActivity = () => resetTimer();

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, resetTimer]);
}
