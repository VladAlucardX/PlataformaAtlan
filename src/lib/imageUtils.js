/**
 * Utilidades para manejo, optimización, verificación y precarga de imágenes
 */

/**
 * Verifica si una URL corresponde a una foto personalizada real subida por un negocio/usuario.
 * Filtra y descarta URLs de stock genéricas (Unsplash, rutas locales por defecto).
 */
export const isRealCustomUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '') return false;
  if (trimmed.includes('images.unsplash.com')) return false;
  if (trimmed.includes('/images/departamentos/')) return false;
  return true;
};

/**
 * Resuelve ÚNICAMENTE imágenes reales subidas por un negocio o creador del punto.
 * Si el punto no posee una foto personalizada real, devuelve null (para renderizar tarjeta SVG "Próximamente").
 */
export const getCustomPointImage = (punto, selectedPointDetails = null) => {
  if (selectedPointDetails?.fotos && Array.isArray(selectedPointDetails.fotos) && selectedPointDetails.fotos.length > 0) {
    const first = selectedPointDetails.fotos[0];
    if (isRealCustomUrl(first)) return first;
  }
  if (isRealCustomUrl(selectedPointDetails?.logo_url)) {
    return selectedPointDetails.logo_url;
  }
  if (isRealCustomUrl(punto?.imagen_url)) {
    return punto.imagen_url;
  }
  if (isRealCustomUrl(punto?.imagen)) {
    return punto.imagen;
  }
  if (isRealCustomUrl(punto?.foto_url)) {
    return punto.foto_url;
  }
  if (punto?.fotos && Array.isArray(punto.fotos) && punto.fotos.length > 0) {
    const first = punto.fotos[0];
    if (isRealCustomUrl(first)) return first;
  }

  return null;
};

/**
 * Alias de compatibilidad para getCustomPointImage
 */
export const getPointImage = (punto, selectedPointDetails = null) => {
  return getCustomPointImage(punto, selectedPointDetails);
};

/**
 * Precarga una imagen individual en la memoria/caché del navegador.
 */
const prefetchedUrls = new Set();

export const prefetchImage = (url) => {
  if (!url || typeof window === 'undefined' || prefetchedUrls.has(url)) return;
  prefetchedUrls.add(url);

  const img = new Image();
  img.src = url;
};

/**
 * Precarga en segundo plano las imágenes principales de una lista de puntos
 * sin bloquear el hilo principal de renderizado.
 */
export const prefetchPointImages = (puntos = []) => {
  if (!Array.isArray(puntos) || puntos.length === 0 || typeof window === 'undefined') return;

  const runPrefetch = () => {
    puntos.slice(0, 15).forEach((p) => {
      const imgUrl = getCustomPointImage(p);
      if (imgUrl) prefetchImage(imgUrl);
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(runPrefetch, { timeout: 2000 });
  } else {
    setTimeout(runPrefetch, 200);
  }
};
