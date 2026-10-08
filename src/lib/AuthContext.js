"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

export const isUser2FAVerified = (userId) => {
  if (typeof window === "undefined" || !userId) return false;
  try {
    return localStorage.getItem("atlan_2fa_verified_" + userId) === "true";
  } catch (_) {
    return false;
  }
};

export const markUser2FAVerified = (userId) => {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem("atlan_2fa_verified_" + userId, "true");
  } catch (_) {}
};

export const clearUser2FAVerified = (userId) => {
  if (typeof window === "undefined") return;
  try {
    if (userId) {
      localStorage.removeItem("atlan_2fa_verified_" + userId);
      sessionStorage.removeItem("atlan_otp_sent_" + userId);
    }
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("atlan_2fa_verified_")) {
        localStorage.removeItem(k);
      }
    });
  } catch (_) {}
};

const AuthContext = createContext({
  session: null,
  perfil: null,
  loading: true,
  is2FAVerified: false,
  logout: async () => {},
  markVerified: () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  // Derivar verificación 2FA directamente sin provocar cascadas de estado
  const is2FAVerified = isUser2FAVerified(session?.user?.id);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (!error && data) {
        setPerfil(data);
      }
    } catch (err) {
      console.error("[Atlan Auth] Error fetching user profile:", err);
    }
  };

  const logout = useCallback(async () => {
    try {
      if (session?.user?.id) {
        clearUser2FAVerified(session.user.id);
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Atlan Auth] Logout error:", err);
    }
    setSession(null);
    setPerfil(null);
  }, [session]);

  // Cierre de sesión automático por inactividad (15 minutos)
  const handleInactivityLogout = useCallback(() => {
    if (session?.user?.id) {
      clearUser2FAVerified(session.user.id);
    }
    setSession(null);
    setPerfil(null);
  }, [session]);

  useInactivityLogout(!!session, handleInactivityLogout);

  useEffect(() => {
    // 1. Obtener sesión actual al montar
    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        if (currentSession?.user) {
          fetchUserProfile(currentSession.user.id);
        }
        setLoading(false);
      })
      .catch(async (err) => {
        console.warn(
          "[Atlan Auth] Fallo al recuperar sesión (token inválido). Limpiando almacenamiento:",
          err
        );
        try {
          await supabase.auth.signOut();
        } catch (_) {}
        if (typeof window !== "undefined") {
          localStorage.clear();
        }
        setSession(null);
        setPerfil(null);
        setLoading(false);
      });

    // 2. Suscribirse a cambios de autenticación en tiempo real
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession((prevSession) => {
        if (
          prevSession?.access_token === currentSession?.access_token &&
          prevSession?.user?.id === currentSession?.user?.id
        ) {
          return prevSession; // Conservar la misma referencia de objeto
        }
        return currentSession;
      });

      if (currentSession?.user) {
        setPerfil((prevPerfil) => {
          if (!prevPerfil || prevPerfil.id !== currentSession.user.id) {
            fetchUserProfile(currentSession.user.id);
          }
          return prevPerfil;
        });
      } else {
        setPerfil(null);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // 3. Enforcing 2FA global: si hay sesión pero no está verificado en 2FA, redirigir a /login
  useEffect(() => {
    if (loading) return;
    if (session?.user?.id) {
      if (typeof window !== "undefined") {
        const hash = window.location.hash || "";
        const search = window.location.search || "";
        if (hash.includes("type=magiclink") || hash.includes("access_token") || search.includes("code=")) {
          markUser2FAVerified(session.user.id);
          return;
        }
      }
      const verified = isUser2FAVerified(session.user.id);
      if (!verified && typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/registro" && path !== "/reset-password") {
          window.location.href = "/login?step=otp&google_auth=true";
        }
      }
    }
  }, [session, loading]);

  const markVerified = useCallback((userId) => {
    markUser2FAVerified(userId);
    setSession((prev) => (prev ? { ...prev } : prev));
  }, []);

  const updatePerfil = useCallback((newFields) => {
    setPerfil((prev) => (prev ? { ...prev, ...newFields } : prev));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        perfil,
        loading,
        is2FAVerified,
        markVerified,
        logout,
        updatePerfil,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para consumir el contexto de autenticación.
 * Uso: const { session, perfil, loading, logout, is2FAVerified } = useAuth();
 */
export function useAuth() {
  return useContext(AuthContext);
}
