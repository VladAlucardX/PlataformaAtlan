/**
 * Configuración compartida de categorías (color + íconos).
 * Usada por el mapa (MapaTuristico) y por la sección Lugares de Nicaragua.
 */

// SVG icon helper for map markers (returns HTML string for innerHTML)
const svgIcon = (path, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle">${path}</svg>`;

// Configuración de categorías (colores e íconos)
export const CATEGORIAS_CONFIG = {
  comideria: { color: '#ff6b6b', icon: 'utensils', svgFile: '/images/comideria.svg', svg: svgIcon('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>') },
  restaurante: { color: '#ff9233', icon: 'soup', svgFile: '/images/restaurante.svg', svg: svgIcon('<path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z"/><path d="M7 21h10"/>') },
  artesanal: { color: '#8a2be2', icon: 'palette', svgFile: '/images/arte.svg', svg: svgIcon('<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>') },
  playa: { color: '#00bfff', icon: 'umbrella', svgFile: '/images/playa.svg', svg: svgIcon('<path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"/>') },
  familiar: { color: '#4caf50', icon: 'family', svgFile: '/images/comunidad.svg', svg: svgIcon('<circle cx="8" cy="5" r="3"/><circle cx="16" cy="5" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/><path d="M13 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/>') },
  hotel: { color: '#e040fb', icon: 'hotel', svgFile: '/images/hotel.svg', svg: svgIcon('<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="M9 22v-4h6v4"/><rect x="8" y="6" width="3" height="3" rx=".5"/><rect x="13" y="6" width="3" height="3" rx=".5"/>') },
  hostal: { color: '#9c27b0', icon: 'homeAlt', svgFile: '/images/hostal.svg', svg: svgIcon('<path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z"/><path d="M10 21v-6h4v6"/>') },
  transporte: { color: '#607d8b', icon: 'car', svgFile: '/images/transporte.svg', svg: svgIcon('<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a1 1 0 0 0-.8.4L1.74 11l-1.58.86a1 1 0 0 0-.16.99V16h3"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>') },
  tour: { color: '#009688', icon: 'mountain', svgFile: '/images/tour.svg', svg: svgIcon('<path d="M8 3l4 8 5-5 5 15H2L8 3z"/>') },
  tienda: { color: '#795548', icon: 'shoppingBag', svgFile: '/images/tienda.svg', svg: svgIcon('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>') },
  otro: { color: '#ffc107', icon: 'mapPin', svgFile: '/images/Ubicacion.svg', svg: svgIcon('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>') }
};
