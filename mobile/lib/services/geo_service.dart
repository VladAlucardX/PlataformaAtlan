import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import '../config/constants.dart';

/// Servicio de geolocalización y utilidades geográficas
/// Equivalente a src/lib/geoUtils.js de la web
class GeoService {
  GeoService._();

  // ─── Centroides de departamentos (fallback) ────────────────────
  static const List<Map<String, dynamic>> _centroids = [
    {'nombre': 'Managua', 'lng': -86.3, 'lat': 12.1},
    {'nombre': 'Granada', 'lng': -85.95, 'lat': 11.85},
    {'nombre': 'Masaya', 'lng': -86.09, 'lat': 11.97},
    {'nombre': 'León', 'lng': -86.62, 'lat': 12.50},
    {'nombre': 'Chinandega', 'lng': -87.14, 'lat': 12.91},
    {'nombre': 'Rivas', 'lng': -85.75, 'lat': 11.36},
    {'nombre': 'Carazo', 'lng': -86.25, 'lat': 11.74},
    {'nombre': 'Matagalpa', 'lng': -85.60, 'lat': 12.90},
    {'nombre': 'Jinotega', 'lng': -85.60, 'lat': 13.80},
    {'nombre': 'Estelí', 'lng': -86.39, 'lat': 13.15},
    {'nombre': 'Madriz', 'lng': -86.50, 'lat': 13.47},
    {'nombre': 'Nueva Segovia', 'lng': -86.23, 'lat': 13.72},
    {'nombre': 'Boaco', 'lng': -85.42, 'lat': 12.54},
    {'nombre': 'Chontales', 'lng': -85.04, 'lat': 12.12},
    {'nombre': 'Río San Juan', 'lng': -84.70, 'lat': 11.20},
    {'nombre': 'RACCN (Caribe Norte)', 'lng': -84.20, 'lat': 14.00},
    {'nombre': 'RACCS (Caribe Sur)', 'lng': -84.30, 'lat': 12.20},
  ];

  static const Map<String, String> _nameMap = {
    'Rio San Juan': 'Río San Juan',
    'Atlántico Norte': 'RACCN (Caribe Norte)',
    'Atlántico Sur': 'RACCS (Caribe Sur)',
    'Costa Caribe Norte': 'RACCN (Caribe Norte)',
    'Costa Caribe Sur': 'RACCS (Caribe Sur)',
  };

  static Map<String, dynamic>? _cachedGeoJson;

  /// Obtener la ubicación GPS actual del dispositivo
  static Future<Position?> obtenerUbicacionActual() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return null;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return null;
    }
    if (permission == LocationPermission.deniedForever) return null;

    return await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
      ),
    );
  }

  /// Calcular distancia en metros entre dos coordenadas (Haversine)
  static double calcularDistancia(
    double lat1, double lng1,
    double lat2, double lng2,
  ) {
    return Geolocator.distanceBetween(lat1, lng1, lat2, lng2);
  }

  /// Verificar si el usuario está a menos de la distancia de verificación (1 km)
  static bool estaCercaDePunto(Position ubicacion, double puntoLat, double puntoLng) {
    final distancia = calcularDistancia(
      ubicacion.latitude, ubicacion.longitude,
      puntoLat, puntoLng,
    );
    return distancia <= AppConstants.distanciaVerificacionMetros;
  }

  /// Determinar departamento por coordenadas usando point-in-polygon
  static Future<String> obtenerDepartamentoPorCoordenadas(double lng, double lat) async {
    try {
      // Cargar GeoJSON si no está cacheado
      if (_cachedGeoJson == null) {
        final jsonString = await rootBundle.loadString('assets/geojson/nicaragua-departments.json');
        _cachedGeoJson = json.decode(jsonString) as Map<String, dynamic>;
      }

      final features = _cachedGeoJson!['features'] as List<dynamic>?;
      if (features != null) {
        for (final feature in features) {
          final geometry = feature['geometry'] as Map<String, dynamic>?;
          if (geometry != null && _pointInGeometry([lng, lat], geometry)) {
            final rawName = (feature['properties']?['name'] ?? feature['properties']?['nombre'] ?? '') as String;
            return _nameMap[rawName] ?? rawName;
          }
        }
      }
    } catch (e) {
      // Fallback a centroide más cercano
    }

    // Fallback: centroide más cercano
    double minDist = double.infinity;
    String nearest = 'Managua';
    for (final c in _centroids) {
      final dx = lng - (c['lng'] as double);
      final dy = lat - (c['lat'] as double);
      final dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        nearest = c['nombre'] as String;
      }
    }
    return nearest;
  }

  // ─── Point-in-polygon helpers ──────────────────────────────────

  static bool _pointInRing(List<double> pt, List<dynamic> ring) {
    final x = pt[0], y = pt[1];
    bool inside = false;
    for (int i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      final xi = (ring[i][0] as num).toDouble();
      final yi = (ring[i][1] as num).toDouble();
      final xj = (ring[j][0] as num).toDouble();
      final yj = (ring[j][1] as num).toDouble();
      final intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  static bool _pointInGeometry(List<double> pt, Map<String, dynamic> geometry) {
    final type = geometry['type'] as String;
    final coordinates = geometry['coordinates'];

    if (type == 'Polygon') {
      return _pointInRing(pt, coordinates[0] as List<dynamic>);
    } else if (type == 'MultiPolygon') {
      for (final poly in coordinates as List<dynamic>) {
        if (_pointInRing(pt, poly[0] as List<dynamic>)) return true;
      }
    }
    return false;
  }
}
