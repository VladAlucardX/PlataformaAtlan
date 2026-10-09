import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveUserDisplayName, resolveUserAvatar } from '@/lib/profileUtils';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Historias vigentes (menos de 24 h) para la vista de perfil.
 * - Si es el perfil propio (ownerId === viewerId):
 *   1. Muestra primero las historias propias (esMia: true).
 *   2. Muestra de forma aleatoria historias de los seguidos que tengan historias activas.
 * - Si es el perfil de otro usuario:
 *   Devuelve únicamente el grupo de ese usuario (o vacío si no tiene historias).
 */
export function useUserStories(session, ownerId) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const viewerId = session?.user?.id;

  const load = useCallback(async () => {
    if (!ownerId || !viewerId || !UUID_RE.test(ownerId)) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const isOwn = ownerId === viewerId;

    try {
      if (isOwn) {
        // 1. Cargar historias propias del usuario
        const [{ data: myStoriesData, error: myErr }, { data: follows }] = await Promise.all([
          supabase
            .from('historias')
            .select('*, perfiles!historias_usuario_id_fkey(id, nombre_completo, avatar_url)')
            .eq('usuario_id', ownerId)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: true }),
          supabase
            .from('seguimientos')
            .select('seguido_id')
            .eq('seguidor_id', ownerId)
        ]);

        if (myErr) throw myErr;

        let myProfile = myStoriesData?.[0]?.perfiles;
        if (!myProfile) {
          const { data: prof } = await supabase
            .from('perfiles')
            .select('id, nombre_completo, avatar_url')
            .eq('id', ownerId)
            .maybeSingle();
          myProfile = prof || { id: ownerId, nombre_completo: resolveUserDisplayName(null, session?.user), avatar_url: resolveUserAvatar(null, session?.user) };
        }
        if (myProfile) {
          myProfile = {
            ...myProfile,
            nombre_completo: resolveUserDisplayName(myProfile, session?.user),
            avatar_url: resolveUserAvatar(myProfile, session?.user),
          };
        }

        const myHistorias = (myStoriesData || []).map((s) => ({ ...s, visto: true }));
        const myGroup = {
          usuario: myProfile,
          historias: myHistorias,
          esMia: true,
          tieneNuevas: false,
          ultima: myHistorias[myHistorias.length - 1]?.created_at || new Date().toISOString(),
        };

        // 2. Cargar historias de personas a las que sigue (seguidos)
        const followingIds = (follows || []).map((f) => f.seguido_id).filter((id) => id !== ownerId);
        let followedGroups = [];

        if (followingIds.length > 0) {
          const { data: followedStories, error: followedErr } = await supabase
            .from('historias')
            .select('*, perfiles!historias_usuario_id_fkey(id, nombre_completo, avatar_url)')
            .in('usuario_id', followingIds)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: true });

          if (!followedErr && followedStories && followedStories.length > 0) {
            const { data: vistas } = await supabase
              .from('historias_vistas')
              .select('historia_id')
              .eq('usuario_id', viewerId)
              .in('historia_id', followedStories.map((s) => s.id));
            const seen = new Set((vistas || []).map((v) => v.historia_id));

            const map = new Map();
            followedStories.forEach((s) => {
              const grp = map.get(s.usuario_id) || {
                usuario: s.perfiles || { id: s.usuario_id, nombre_completo: '' },
                historias: [],
                esMia: false,
              };
              grp.historias.push({ ...s, visto: seen.has(s.id) });
              map.set(s.usuario_id, grp);
            });

            followedGroups = [...map.values()].map((g) => ({
              ...g,
              tieneNuevas: g.historias.some((h) => !h.visto),
              ultima: g.historias[g.historias.length - 1]?.created_at,
            }));

            // Barajar aleatoriamente los seguidos para mostrar historias variadas y dinámicas
            followedGroups.sort(() => Math.random() - 0.5);
          }
        }

        // Primero las historias propias, luego los seguidos aleatorios
        setGroups([myGroup, ...followedGroups]);
      } else {
        // Perfil de otra persona
        const { data: stories, error } = await supabase
          .from('historias')
          .select('*, perfiles!historias_usuario_id_fkey(id, nombre_completo, avatar_url)')
          .eq('usuario_id', ownerId)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (!stories || stories.length === 0) {
          setGroups([]);
          return;
        }

        let seen = new Set();
        const { data: vistas } = await supabase
          .from('historias_vistas')
          .select('historia_id')
          .eq('usuario_id', viewerId)
          .in('historia_id', stories.map((s) => s.id));
        seen = new Set((vistas || []).map((v) => v.historia_id));

        const historias = stories.map((s) => ({ ...s, visto: seen.has(s.id) }));
        setGroups([
          {
            usuario: stories[0].perfiles || { id: ownerId, nombre_completo: '' },
            historias,
            esMia: false,
            tieneNuevas: historias.some((h) => !h.visto),
            ultima: historias[historias.length - 1].created_at,
          },
        ]);
      }
    } catch (e) {
      console.error('[Historias] Error cargando historias del perfil:', e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, viewerId, session]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const markSeen = useCallback(
    async (historiaId) => {
      if (!viewerId) return;
      setGroups((prev) =>
        prev.map((g) => {
          const historias = g.historias.map((h) => (h.id === historiaId ? { ...h, visto: true } : h));
          return { ...g, historias, tieneNuevas: historias.some((h) => !h.visto) };
        })
      );
      await supabase
        .from('historias_vistas')
        .upsert({ historia_id: historiaId, usuario_id: viewerId }, { onConflict: 'historia_id,usuario_id', ignoreDuplicates: true });
    },
    [viewerId]
  );

  return { groups, loading, reload: load, markSeen };
}
