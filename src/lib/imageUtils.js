/**
 * Utilidades para manejo, optimización, fallback y precarga de imágenes
 */

/**
 * Obtiene una imagen fallback de alta resolución en formato WebP comprimido
 * según la categoría del punto o negocio.
 */
export const getCategoryFallbackImage = (categoria) => {
  const cat = (categoria || "").toLowerCase();

  if (cat.includes("comideria") || cat.includes("restaurante") || cat.includes("comida") || cat.includes("café") || cat.includes("bar")) {
    return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80";
  }
  if (cat.includes("hotel") || cat.includes("hostal") || cat.includes("hospedaje")) {
    return "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";
  }
  if (cat.includes("playa") || cat.includes("mar") || cat.includes("costa") || cat.includes("isla")) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80";
  }
  if (cat.includes("naturaleza") || cat.includes("parque") || cat.includes("volcan") || cat.includes("volcán") || cat.includes("aventura") || cat.includes("tour") || cat.includes("reserva")) {
    return "https://images.unsplash.com/photo-1511497584788-876761465586?auto=format&fit=crop&w=600&q=80";
  }
  if (cat.includes("cultura") || cat.includes("museo") || cat.includes("iglesia") || cat.includes("catedral") || cat.includes("historia") || cat.includes("arte")) {
    return "https://images.unsplash.com/photo-1548625361-18a7a8d56b4d?auto=format&fit=crop&w=600&q=80";
  }

  // Fallback por defecto (Turismo general)
  return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";
};

/**
 * Resuelve en cascada la mejor URL de imagen para un punto o negocio.
 */
export const getPointImage = (punto, selectedPointDetails = null) => {
  if (selectedPointDetails?.fotos && Array.isArray(selectedPointDetails.fotos) && selectedPointDetails.fotos.length > 0) {
    return selectedPointDetails.fotos[0];
  }
  if (selectedPointDetails?.logo_url) {
    return selectedPointDetails.logo_url;
  }
  if (punto?.imagen_url) {
    return punto.imagen_url;
  }
  if (punto?.imagen) {
    return punto.imagen;
  }
  if (punto?.foto_url) {
    return punto.foto_url;
  }
  if (punto?.fotos && Array.isArray(punto.fotos) && punto.fotos.length > 0) {
    return punto.fotos[0];
  }

  return getCategoryFallbackImage(punto?.categoria || punto?.category);
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
    // Precargar las primeras 15 imágenes de los puntos visibles
    puntos.slice(0, 15).forEach((p) => {
      const imgUrl = getPointImage(p);
      if (imgUrl) prefetchImage(imgUrl);
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(runPrefetch, { timeout: 2000 });
  } else {
    setTimeout(runPrefetch, 200);
  }
};
