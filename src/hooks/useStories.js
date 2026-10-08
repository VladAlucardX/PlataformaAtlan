import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Carga las historias vigentes (menos de 24 h) agrupadas por usuario.
 * Misma regla que el muro: si sigues a alguien ves a quienes sigues + las tuyas;
 * si no sigues a nadie, ves a todos.
 */
export function useStories(session) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!userId) {
      setGroups([]);
      setLoading(false);
      return;
    }
    try {
      const [{ data: stories, error: storiesError }, { data: follows }] = await Promise.all([
        supabase
          .from('historias')
          .select('*, perfiles!historias_usuario_id_fkey(id, nombre_completo, avatar_url)')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: true }),
        supabase.from('seguimientos').select('seguido_id').eq('seguidor_id', userId),
      ]);
      if (storiesError) throw storiesError;

      const followingIds = new Set((follows || []).map((f) => f.seguido_id));
      const visible = (stories || []).filter(
        (s) => followingIds.size === 0 || s.usuario_id === userId || followingIds.has(s.usuario_id)
      );

      let seen = new Set();
      if (visible.length > 0) {
        const { data: vistas } = await supabase
          .from('historias_vistas')
          .select('historia_id')
          .eq('usuario_id', userId)
          .in('historia_id', visible.map((s) => s.id));
        seen = new Set((vistas || []).map((v) => v.historia_id));
      }

      const map = new Map();
      visible.forEach((s) => {
        const group = map.get(s.usuario_id) || {
          usuario: s.perfiles || { id: s.usuario_id, nombre_completo: '' },
          historias: [],
        };
        group.historias.push({ ...s, visto: s.usuario_id === userId || seen.has(s.id) });
        map.set(s.usuario_id, group);
      });

      const list = [...map.values()].map((g) => ({
        ...g,
        esMia: g.usuario.id === userId,
        tieneNuevas: g.historias.some((h) => !h.visto),
        ultima: g.historias[g.historias.length - 1].created_at,
      }));

      list.sort(
        (a, b) =>
          Number(b.esMia) - Number(a.esMia) ||
          Number(b.tieneNuevas) - Number(a.tieneNuevas) ||
          new Date(b.ultima) - new Date(a.ultima)
      );

      setGroups(list);
      setError(null);
    } catch (e) {
      console.error('[Historias] Error cargando historias:', e);
      setError(e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    // Las historias vencen: refrescamos cada minuto para que desaparezcan solas.
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  /** Marca una historia como vista (optimista) y la registra en la base de datos. */
  const markSeen = useCallback(
    async (historiaId) => {
      if (!userId) return;
      setGroups((prev) =>
        prev.map((g) => {
          const historias = g.historias.map((h) => (h.id === historiaId ? { ...h, visto: true } : h));
          return { ...g, historias, tieneNuevas: historias.some((h) => !h.visto) };
        })
      );
      await supabase
        .from('historias_vistas')
        .upsert({ historia_id: historiaId, usuario_id: userId }, { onConflict: 'historia_id,usuario_id', ignoreDuplicates: true });
    },
    [userId]
  );

  return { groups, loading, error, reload: load, markSeen };
}
