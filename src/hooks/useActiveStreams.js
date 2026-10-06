"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useActiveStreams() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveStreams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("transmisiones")
        .select(`
          id,
          usuario_id,
          titulo,
          canal,
          estado,
          espectadores_actuales,
          espectadores_max,
          iniciada_at,
          perfil:usuario_id (
            id,
            nombre_completo,
            avatar_url,
            nombre_usuario
          )
        `)
        .eq("estado", "en_vivo")
        .order("iniciada_at", { ascending: false });

      if (error) {
        // Si la tabla aún no existe en Supabase, simplemente no muestra streams
        if (error.code === "PGRST205") {
          setStreams([]);
          return;
        }
        throw error;
      }
      setStreams(data || []);
    } catch (err) {
      console.warn("[useActiveStreams] Error cargando transmisiones:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveStreams();

    // Suscripción Realtime a cambios en la tabla transmisiones
    const channel = supabase
      .channel("transmisiones-en-vivo")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transmisiones" },
        () => {
          fetchActiveStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveStreams]);

  return { streams, loading, reload: fetchActiveStreams };
}
