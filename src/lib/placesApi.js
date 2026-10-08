import { supabase } from '@/lib/supabase';

export const PAGE_SIZE = 18;

/**
 * Consulta paginada y filtrada de lugares/puntos turísticos de Nicaragua.
 * Trae además la información del negocio vinculado (fotos, logo, rating, horarios).
 */
export async function fetchPlaces({
  page = 0,
  pageSize = PAGE_SIZE,
  departamento = 'Todos',
  categoria = 'todas',
  search = '',
} = {}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('puntos')
    .select(`
      id,
      nombre,
      descripcion,
      categoria,
      estado,
      departamento,
      ubicacion,
      negocio_id,
      fotos_comunidad,
      total_visitas,
      created_at,
      negocios (
        id,
        nombre,
        logo_url,
        fotos,
        rating,
        num_reviews,
        horarios,
        rango_precios,
        servicios,
        activo
      )
    `, { count: 'exact' })
    .in('estado', ['aprobado', 'sin_reclamar', 'en_verificacion']);

  // Filtro por departamento
  if (departamento && departamento !== 'Todos') {
    if (departamento.includes('RACCN')) {
      query = query.or('departamento.ilike.%RACCN%,departamento.ilike.%Caribe Norte%');
    } else if (departamento.includes('RACCS')) {
      query = query.or('departamento.ilike.%RACCS%,departamento.ilike.%Caribe Sur%');
    } else if (departamento === 'León' || departamento === 'Leon') {
      query = query.or('departamento.ilike.%León%,departamento.ilike.%Leon%');
    } else if (departamento.toLowerCase().includes('rio') || departamento.toLowerCase().includes('río')) {
      query = query.or('departamento.ilike.%Río San Juan%,departamento.ilike.%Rio San Juan%');
    } else {
      query = query.ilike('departamento', `%${departamento}%`);
    }
  }

  // Filtro por categoría
  if (categoria && categoria !== 'todas') {
    query = query.eq('categoria', categoria);
  }

  // Búsqueda por texto (nombre)
  if (search && search.trim()) {
    query = query.ilike('nombre', `%${search.trim()}%`);
  }

  // Ordenar por más recientes
  query = query.order('created_at', { ascending: false });

  // Paginación por rango
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('[placesApi] Error fetching places:', error);
    throw error;
  }

  return {
    places: data || [],
    totalCount: typeof count === 'number' ? count : (data || []).length,
    hasMore: count ? to + 1 < count : (data || []).length === pageSize,
  };
}

/**
 * Obtiene un lugar individual por su ID (para abrir directo vía URL ?lugar=ID)
 */
export async function fetchPlaceById(id) {
  if (!id) return null;

  const { data, error } = await supabase
    .from('puntos')
    .select(`
      id,
      nombre,
      descripcion,
      categoria,
      estado,
      departamento,
      ubicacion,
      negocio_id,
      fotos_comunidad,
      total_visitas,
      created_at,
      negocios (
        id,
        nombre,
        logo_url,
        fotos,
        rating,
        num_reviews,
        horarios,
        rango_precios,
        servicios,
        activo
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[placesApi] Error fetching place by id:', error);
    return null;
  }

  return data;
}
