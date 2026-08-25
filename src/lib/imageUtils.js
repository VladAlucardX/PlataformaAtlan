/**
 * Utilidades para manejo, optimización, verificación y precarga de imágenes
 */

/**
 * Resuelve ÚNICAMENTE imágenes reales subidas por un negocio o creador del punto.
 * Si el punto no posee una foto personalizada, devuelve null (para renderizar tarjeta SVG "Próximamente").
 */
export const getCustomPointImage = (punto, selectedPointDetails = null) => {
  if (selectedPointDetails?.fotos && Array.isArray(selectedPointDetails.fotos) && selectedPointDetails.fotos.length > 0) {
    return selectedPointDetails.fotos[0];
  }
  if (selectedPointDetails?.logo_url) {
    return selectedPointDetails.logo_url;
  }
  if (punto?.imagen_url && typeof punto.imagen_url === 'string' && punto.imagen_url.trim() !== '') {
    return punto.imagen_url;
  }
  if (punto?.imagen && typeof punto.imagen === 'string' && punto.imagen.trim() !== '' && !punto.imagen.includes('/images/departamentos/')) {
    return punto.imagen;
  }
  if (punto?.foto_url && typeof punto.foto_url === 'string' && punto.foto_url.trim() !== '') {
    return punto.foto_url;
  }
  if (punto?.fotos && Array.isArray(punto.fotos) && punto.fotos.length > 0) {
    return punto.fotos[0];
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
