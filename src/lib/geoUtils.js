// Map of GeoJSON department names to canonical names used across the UI
// Canonical names MUST match DEPARTAMENTOS_LISTA in departamentos/page.js
// and the GeoJSON 'nombre' property in nicaragua-departments.json
const NAME_MAP = {
  "Rio San Juan": "Río San Juan",
  "Atlántico Norte": "RACCN (Caribe Norte)",
  "Atlántico Sur": "RACCS (Caribe Sur)",
  "Río San Juan": "Río San Juan",
  "Costa Caribe Norte": "RACCN (Caribe Norte)",
  "Costa Caribe Sur": "RACCS (Caribe Sur)"
};

const CENTROIDS = [
  { nombre: "Managua", lng: -86.3, lat: 12.1 },
  { nombre: "Granada", lng: -85.95, lat: 11.85 },
  { nombre: "Masaya", lng: -86.09, lat: 11.97 },
  { nombre: "León", lng: -86.62, lat: 12.50 },
  { nombre: "Chinandega", lng: -87.14, lat: 12.91 },
  { nombre: "Rivas", lng: -85.75, lat: 11.36 },
  { nombre: "Carazo", lng: -86.25, lat: 11.74 },
  { nombre: "Matagalpa", lng: -85.60, lat: 12.90 },
  { nombre: "Jinotega", lng: -85.60, lat: 13.80 },
  { nombre: "Estelí", lng: -86.39, lat: 13.15 },
  { nombre: "Madriz", lng: -86.50, lat: 13.47 },
  { nombre: "Nueva Segovia", lng: -86.23, lat: 13.72 },
  { nombre: "Boaco", lng: -85.42, lat: 12.54 },
  { nombre: "Chontales", lng: -85.04, lat: 12.12 },
  { nombre: "Río San Juan", lng: -84.70, lat: 11.20 },
  { nombre: "RACCN (Caribe Norte)", lng: -84.20, lat: 14.00 },
  { nombre: "RACCS (Caribe Sur)", lng: -84.30, lat: 12.20 }
];

let cachedGeoJson = null;

function pointInRing(pt, ring) {
  const x = pt[0], y = pt[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygonGeometry(pt, geometry) {
  if (geometry.type === 'Polygon') {
    return pointInRing(pt, geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      if (pointInRing(pt, poly[0])) return true;
    }
  }
  return false;
}

/**
 * Determina automáticamente el departamento de Nicaragua según coordenadas (lng, lat).
 * Utiliza point-in-polygon contra los polígonos oficiales de Nicaragua y centroides de reserva.
 */
export async function obtenerDepartamentoPorCoordenadas(lng, lat) {
  if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
    return 'Managua';
  }

  const pt = [lng, lat];

  try {
    if (!cachedGeoJson && typeof window !== 'undefined') {
      const res = await fetch('/nicaragua-departments.json');
      if (res.ok) {
        cachedGeoJson = await res.json();
      }
    }

    if (cachedGeoJson && cachedGeoJson.features) {
      for (const feature of cachedGeoJson.features) {
        if (feature.geometry && pointInPolygonGeometry(pt, feature.geometry)) {
          const rawName = feature.properties?.name || feature.properties?.nombre || '';
          const normalized = NAME_MAP[rawName] || rawName;
          if (normalized) return normalized;
        }
      }
    }
  } catch (err) {
    console.warn('[geoUtils] Error calculando departamento por punto en polígono:', err);
  }

  // Fallback a centroide más cercano
  let minDistanceSq = Infinity;
  let nearestDept = 'Managua';

  for (const c of CENTROIDS) {
    const dx = lng - c.lng;
    const dy = lat - c.lat;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      nearestDept = c.nombre;
    }
  }

  return nearestDept;
}
