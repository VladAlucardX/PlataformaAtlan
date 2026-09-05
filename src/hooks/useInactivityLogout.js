"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * useInactivityLogout — Cierra la sesión del usuario tras inactividad prolongada (30 minutos).
 *
 * Mantiene la sesión activa si:
 * 1. El usuario interactúa con la app (mouse, teclado, touch, scroll, click, zoom/pan en mapa).
 * 2. Hay una ruta/navegación activa en el mapa o el mapa se está moviendo.
 * 3. La ventana o pestaña está activa.
 *
 * @param {boolean} isAuthenticated - Si hay sesión activa
 * @param {Function} onLogout - Callback para limpiar estado de auth
 * @param {number} timeoutMs - Tiempo de inactividad en ms (default: 1800000 = 30 min)
 */
export function useInactivityLogout(isAuthenticated, onLogout, timeoutMs = 1800000) {
  const lastActivityRef = useRef(Date.now());
  const router = useRouter();

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const performLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Atlan] Error al cerrar sesión por inactividad:", err);
    }
    if (onLogout) onLogout();
    router.push("/login");
  }, [onLogout, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    lastActivityRef.current = Date.now();
    if (typeof window !== "undefined") {
      window.resetAtlanInactivityTimer = resetActivity;
    }

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
      "atlan-user-activity",
      "focus",
      "visibilitychange",
    ];

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Verificar inactividad cada 10 segundos
    const interval = setInterval(() => {
      // Si la navegación está activa o el mapa está en movimiento activo, mantener fresca la actividad
      if (typeof window !== "undefined" && (window.__atlanActiveNavigation || window.__atlanMapMoving)) {
        lastActivityRef.current = Date.now();
        return;
      }

      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= timeoutMs) {
        performLogout();
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        delete window.resetAtlanInactivityTimer;
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, performLogout, resetActivity, timeoutMs]);
}
