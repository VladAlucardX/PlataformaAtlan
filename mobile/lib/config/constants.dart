import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Constantes globales de configuración de la app Atlan
class AppConstants {
  AppConstants._();

  // --- Supabase ---
  static String get supabaseUrl => dotenv.env['SUPABASE_URL'] ?? '';
  static String get supabaseAnonKey => dotenv.env['SUPABASE_ANON_KEY'] ?? '';

  // --- Mapbox ---
  static String get mapboxPublicToken => dotenv.env['MAPBOX_PUBLIC_TOKEN'] ?? '';

  // --- Web App URL ---
  static String get webAppUrl {
    final envUrl = dotenv.env['WEB_APP_URL'];
    if (envUrl != null && envUrl.trim().isNotEmpty) {
      return envUrl.trim();
    }
    return 'http://10.253.43.252:3000';
  }

  // --- Mapa de Nicaragua (centro y zoom por defecto) ---
  static const double nicaraguaCenterLng = -85.15;
  static const double nicaraguaCenterLat = 12.80;
  static const double nicaraguaDefaultZoom = 6.60;

  // --- GPS Verificación ---
  /// Distancia mínima en metros para verificar una visita turística
  static const double distanciaVerificacionMetros = 1000.0;

  // --- Supabase Storage ---
  static const String storageBucket = 'atlan-media';

  // --- Colores Hex (usados en marcadores y lógica, NO en tema) ---
  static const int colorVerificado = 0xFF10B981;
  static const int colorPendiente = 0xFFF97316;
  static const int colorSinReclamar = 0xFF64748B;

  // --- Categorías de puntos ---
  static const List<String> categorias = [
    'Restaurante',
    'Hotel',
    'Atracción',
    'Comercio',
    'Servicio',
    'Naturaleza',
    'Playa',
    'Museo',
    'Otro',
  ];

  // --- Regiones de filtro ---
  static const List<String> regiones = ['Todos', 'Pacífico', 'Central', 'Caribe'];
}
