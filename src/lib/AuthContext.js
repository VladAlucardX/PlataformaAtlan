"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

const AuthContext = createContext({
  session: null,
  perfil: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

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
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Atlan Auth] Logout error:", err);
    }
    setSession(null);
    setPerfil(null);
  }, []);

  // Cierre de sesión automático por inactividad (15 minutos)
  const handleInactivityLogout = useCallback(() => {
    setSession(null);
    setPerfil(null);
  }, []);

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

  const updatePerfil = useCallback((newFields) => {
    setPerfil((prev) => (prev ? { ...prev, ...newFields } : prev));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, perfil, loading, logout, updatePerfil, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para consumir el contexto de autenticación.
 * Uso: const { session, perfil, loading, logout } = useAuth();
 */
export function useAuth() {
  return useContext(AuthContext);
}
