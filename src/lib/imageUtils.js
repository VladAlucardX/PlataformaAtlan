/**
 * Utilidades para manejo, optimización, verificación y precarga de imágenes
 */

/**
 * Verifica si una URL corresponde a una foto o logo personalizado real subido por un negocio/usuario.
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
 * Resuelve ÚNICAMENTE imágenes o logos reales subidos por un negocio o creador del punto.
 * Si el punto no posee una foto ni logo personalizado real, devuelve null (para renderizar tarjeta SVG "PRÓXIMAMENTE").
 */
export const getCustomPointImage = (punto, selectedPointDetails = null) => {
  // 1. Fotos del negocio asociadas en el detalle
  if (selectedPointDetails?.fotos && Array.isArray(selectedPointDetails.fotos) && selectedPointDetails.fotos.length > 0) {
    const first = selectedPointDetails.fotos[0];
    if (isRealCustomUrl(first)) return first;
  }
  // 2. Logo del negocio en el detalle
  if (isRealCustomUrl(selectedPointDetails?.logo_url)) {
    return selectedPointDetails.logo_url;
  }
  // 3. Logo del negocio adjunto en el objeto del punto (RPC / Supabase query)
  if (isRealCustomUrl(punto?.negocio_logo_url)) {
    return punto.negocio_logo_url;
  }
  if (isRealCustomUrl(punto?.logo_url)) {
    return punto.logo_url;
  }
  // 4. Fotos del negocio adjuntas en el objeto del punto
  if (punto?.negocio_fotos && Array.isArray(punto.negocio_fotos) && punto.negocio_fotos.length > 0) {
    const first = punto.negocio_fotos[0];
    if (isRealCustomUrl(first)) return first;
  }
  // 5. Imagen/foto del punto subida por usuario o creador
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

/**
 * Devuelve la ruta del SVG de categoría correspondiente para cualquier punto, lugar o destino.
 */
export const getCategorySvg = (dest) => {
  if (!dest) return "/images/ubic.svg";
  if (dest.svgFile) return dest.svgFile;

  const cat = (dest.categoria || "").toLowerCase();
  const name = (dest.nombre || "").toLowerCase();
  const icono = (dest.icono || "");

  if (cat.includes("volcán") || cat.includes("volcan") || cat.includes("sandboarding") || icono === "🌋" || name.includes("volcán") || name.includes("volcan")) {
    return "/images/Volcan.svg";
  }
  if (cat.includes("playa") || cat.includes("surf") || cat.includes("caribe") || cat.includes("buceo") || icono === "🏖️" || name.includes("playa") || name.includes("island")) {
    return "/images/playa.svg";
  }
  if (cat.includes("isla") || cat.includes("náutica") || cat.includes("nautica") || cat.includes("lago") || icono === "🏝️" || name.includes("isla") || name.includes("isletas")) {
    return "/images/San Juan del sur.svg";
  }
  if (cat.includes("historia") || cat.includes("patrimonio") || cat.includes("cultura") || cat.includes("unesco") || icono === "🏛️" || name.includes("catedral") || name.includes("convento") || name.includes("ruinas") || name.includes("fortaleza") || name.includes("teatro") || name.includes("iglesia")) {
    return "/images/edificio.svg";
  }
  if (cat.includes("ecoturismo") || cat.includes("reserva") || cat.includes("montaña") || cat.includes("bosque") || cat.includes("cascada") || cat.includes("manantial") || cat.includes("cañón") || cat.includes("canon") || icono === "🌿" || icono === "⛰️" || icono === "💧") {
    return "/images/parque.svg";
  }
  if (cat.includes("lava") || cat.includes("senderismo") || cat.includes("tour") || icono === "🔥") {
    return "/images/tour.svg";
  }
  if (cat.includes("comideria") || cat.includes("comidería") || cat.includes("fritanga") || name.includes("fritanga") || name.includes("elotes") || name.includes("asados") || name.includes("comida")) {
    return "/images/comideria.svg";
  }
  if (cat.includes("restaurante") || cat.includes("gastronomía") || cat.includes("gastronomia") || cat.includes("bar") || cat.includes("cafe") || cat.includes("café")) {
    return "/images/restaurante.svg";
  }
  if (cat.includes("artesanal") || cat.includes("artesanía") || cat.includes("artesania") || cat.includes("arte") || icono === "🎭" || name.includes("mercado de artesanías")) {
    return "/images/arte.svg";
  }
  if (cat.includes("hotel") || icono === "🏨") {
    return "/images/hotel.svg";
  }
  if (cat.includes("hostal")) {
    return "/images/hostal.svg";
  }
  if (cat.includes("tienda") || cat.includes("comercio") || name.includes("taller") || name.includes("computer") || name.includes("tienda")) {
    return "/images/tienda.svg";
  }
  if (cat.includes("transporte") || cat.includes("car")) {
    return "/images/transporte.svg";
  }
  if (cat.includes("familiar") || cat.includes("comunidad")) {
    return "/images/comunidad.svg";
  }

  return "/images/ubic.svg";
};
