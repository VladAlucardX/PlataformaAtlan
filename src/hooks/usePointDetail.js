"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook reutilizable para gestionar los detalles completos de un punto:
 * negocio asociado, reseñas, menú, favoritos, creación de reservas y nuevas reseñas.
 */
export function usePointDetail(point, userSession = null, lang = 'es') {
  const [details, setDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);

  // Favoritos
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);

  // Reservas
  const [reservaTipo, setReservaTipo] = useState('mesa');
  const [reservaFechaHora, setReservaFechaHora] = useState('');
  const [reservaPersonas, setReservaPersonas] = useState(1);
  const [reservaNotas, setReservaNotas] = useState('');
  const [isSubmittingReserva, setIsSubmittingReserva] = useState(false);
  const [reservaSuccess, setReservaSuccess] = useState(false);

  // Reseñas
  const [newReviewNombre, setNewReviewNombre] = useState('');
  const [newReviewEstrellas, setNewReviewEstrellas] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  // Prefill nombre de usuario en reseña si hay sesión
  useEffect(() => {
    if (userSession?.user?.user_metadata?.nombre_completo) {
      setNewReviewNombre(userSession.user.user_metadata.nombre_completo);
    }
  }, [userSession]);

  // Carga de datos de punto (negocio, reseñas, menú, favorito)
  useEffect(() => {
    if (!point || !point.id) {
      setDetails(null);
      setReviews([]);
      setMenu([]);
      setIsFavorite(false);
      setFavoriteId(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const cacheKey = `atlan_point_details_${point.id}`;

    const loadData = async () => {
      let loadedReviews = [];
      let loadedBiz = null;
      let loadedMenu = [];

      try {
        // 1. Cargar reseñas
        const { data: revData } = await supabase
          .from('resenas')
          .select('*')
          .eq('punto_id', point.id)
          .order('created_at', { ascending: false });

        if (revData) loadedReviews = revData;

        // 2. Cargar negocio asociado si existe
        if (point.negocio_id) {
          const { data: bizData } = await supabase
            .from('negocios')
            .select('*')
            .eq('id', point.negocio_id)
            .maybeSingle();

          if (bizData) {
            loadedBiz = bizData;
            if (bizData?.servicios?.has_menu) {
              const { data: menuData } = await supabase
                .from('menu_items')
                .select('*')
                .eq('negocio_id', point.negocio_id);
              if (menuData) loadedMenu = menuData;
            }
          }
        }

        if (isMounted) {
          setReviews(loadedReviews);
          setDetails(loadedBiz);
          setMenu(loadedMenu);

          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              reviews: loadedReviews,
              biz: loadedBiz,
              menu: loadedMenu,
            }));
          } catch (_) {}
        }
      } catch (err) {
        console.warn('[usePointDetail] Error cargando online, usando caché:', err);
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached && isMounted) {
            const parsed = JSON.parse(cached);
            setReviews(parsed.reviews || []);
            setDetails(parsed.biz || null);
            setMenu(parsed.menu || []);
          }
        } catch (_) {}
      } finally {
        if (isMounted) setLoading(false);
      }

      // 3. Verificar estado de favorito
      if (userSession?.user?.id) {
        try {
          const { data: favData } = await supabase
            .from('favoritos')
            .select('id')
            .eq('usuario_id', userSession.user.id)
            .eq('punto_id', point.id)
            .maybeSingle();

          if (isMounted) {
            if (favData) {
              setIsFavorite(true);
              setFavoriteId(favData.id);
            } else {
              setIsFavorite(false);
              setFavoriteId(null);
            }
          }
        } catch (_) {
          if (isMounted) {
            setIsFavorite(false);
            setFavoriteId(null);
          }
        }
      } else if (isMounted) {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [point, userSession]);

  // Toggle de favoritos
  const handleToggleFavorite = useCallback(async () => {
    if (!userSession?.user?.id || !point?.id) {
      alert(lang === 'en'
        ? 'Please log in to save favorites.'
        : lang === 'zh'
        ? '请先登录以收藏此地点。'
        : 'Inicia sesión para guardar tus lugares favoritos.');
      return;
    }

    try {
      if (isFavorite && favoriteId) {
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('id', favoriteId);
        if (error) throw error;
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const { data, error } = await supabase
          .from('favoritos')
          .insert({
            usuario_id: userSession.user.id,
            punto_id: point.id,
          })
          .select('id')
          .single();
        if (error) throw error;
        setIsFavorite(true);
        setFavoriteId(data.id);
      }
    } catch (err) {
      console.error('[usePointDetail] Error toggling favorite:', err);
    }
  }, [userSession, point, isFavorite, favoriteId, lang]);

  // Crear Reserva
  const handleCrearReserva = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!userSession?.user?.id) {
      alert(lang === 'en'
        ? 'Please log in to make a reservation.'
        : lang === 'zh'
        ? '请先登录以进行预订。'
        : 'Inicia sesión para realizar una reserva.');
      return;
    }

    setIsSubmittingReserva(true);

    try {
      let isoDate = reservaFechaHora;
      if (reservaFechaHora) {
        try {
          isoDate = new Date(reservaFechaHora).toISOString();
        } catch (_) {}
      }

      const payload = {
        punto_id: point?.id || null,
        negocio_id: point?.negocio_id || null,
        cliente_id: userSession.user.id,
        fecha_hora: isoDate,
        num_personas: parseInt(reservaPersonas, 10) || 1,
        notas: reservaNotas || '',
        tipo_reserva: reservaTipo || 'mesa',
        estado_reserva: 'pendiente',
      };

      const { error } = await supabase.from('reservas').insert([payload]);
      if (error) throw error;

      setReservaSuccess(true);
      setReservaFechaHora('');
      setReservaNotas('');
      setTimeout(() => setReservaSuccess(false), 4000);
    } catch (err) {
      console.error('[usePointDetail] Error al reservar:', err);
      alert((lang === 'en' ? 'Reservation error: ' : 'Error al procesar reserva: ') + (err.message || 'Intente de nuevo'));
    } finally {
      setIsSubmittingReserva(false);
    }
  }, [userSession, point, reservaFechaHora, reservaPersonas, reservaNotas, reservaTipo, lang]);

  // Crear Reseña
  const handleCrearResena = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!newReviewComment.trim() || !point?.id) return;

    setIsSubmittingReview(true);
    setReviewErrorMsg('');

    try {
      // Validación moderada de contenido
      const { data: verifResult, error: verifError } = await supabase
        .rpc('verificar_contenido', { texto: newReviewComment });

      if (verifError) throw verifError;

      if (!verifResult) {
        setReviewErrorMsg(lang === 'en'
          ? 'Inappropriate language detected. Please review your comment.'
          : lang === 'zh'
          ? '检测到不当用语，请修改您的评价。'
          : 'Contenido inapropiado detectado. Por favor modifica tu comentario.');
        setIsSubmittingReview(false);
        return;
      }

      const { error } = await supabase.from('resenas').insert([{
        punto_id: point.id,
        negocio_id: point.negocio_id || null,
        autor_nombre: newReviewNombre.trim() || (lang === 'en' ? 'Anonymous' : lang === 'zh' ? '匿名用户' : 'Anónimo'),
        autor_id: userSession?.user?.id || null,
        estrellas: newReviewEstrellas,
        comentario: newReviewComment.trim(),
        aprobada: true,
      }]);

      if (error) throw error;

      setNewReviewComment('');

      // Recargar reseñas
      const { data: updatedReviews } = await supabase
        .from('resenas')
        .select('*')
        .eq('punto_id', point.id)
        .order('created_at', { ascending: false });

      if (updatedReviews) setReviews(updatedReviews);
    } catch (err) {
      console.error('[usePointDetail] Error al enviar reseña:', err);
      setReviewErrorMsg(lang === 'en' ? 'Error submitting review.' : 'Error al enviar la reseña.');
    } finally {
      setIsSubmittingReview(false);
    }
  }, [newReviewComment, point, newReviewNombre, userSession, newReviewEstrellas, lang]);

  return {
    details,
    reviews,
    menu,
    loading,
    isFavorite,
    handleToggleFavorite,
    // Reserva
    reservaTipo,
    setReservaTipo,
    reservaFechaHora,
    setReservaFechaHora,
    reservaPersonas,
    setReservaPersonas,
    reservaNotas,
    setReservaNotas,
    isSubmittingReserva,
    reservaSuccess,
    handleCrearReserva,
    // Reseñas
    newReviewNombre,
    setNewReviewNombre,
    newReviewEstrellas,
    setNewReviewEstrellas,
    newReviewComment,
    setNewReviewComment,
    isSubmittingReview,
    reviewErrorMsg,
    handleCrearResena,
  };
}
