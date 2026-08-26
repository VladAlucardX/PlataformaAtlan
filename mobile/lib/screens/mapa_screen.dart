import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Pantalla del Mapa Turístico Interactivo — equivalente a /mapa de la web
/// NOTA: La integración completa de Mapbox Maps Flutter SDK se habilitará
/// una vez que se configure el Mapbox Secret Token en gradle.properties.
/// Por ahora, muestra un placeholder premium con la funcionalidad lista para conectar.
class MapaScreen extends StatefulWidget {
  const MapaScreen({super.key});

  @override
  State<MapaScreen> createState() => _MapaScreenState();
}

class _MapaScreenState extends State<MapaScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AtlanTheme.background,
      appBar: AppBar(
        title: const Text('Mapa Turístico'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: () {
              // TODO: Implementar búsqueda de puntos
            },
          ),
          IconButton(
            icon: const Icon(Icons.filter_list_rounded),
            onPressed: () {
              // TODO: Implementar filtros de categoría
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // Placeholder del mapa — será reemplazado por MapboxMap widget
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF0A1628), Color(0xFF0D1F3C)],
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Ícono de mapa animado
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AtlanTheme.primary.withValues(alpha: 0.5), width: 2),
                    boxShadow: AtlanTheme.glowShadow(AtlanTheme.primary, blur: 24),
                  ),
                  child: const Icon(
                    Icons.map_rounded,
                    size: 48,
                    color: AtlanTheme.primary,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Mapa de Nicaragua',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AtlanTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 48),
                  child: Text(
                    'Configura tu Mapbox Secret Token para activar el mapa interactivo con todos los puntos turísticos y negocios.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: AtlanTheme.textSecondary.withValues(alpha: 0.8),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Indicadores de funcionalidades del mapa
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _MapFeatureChip(icon: Icons.verified, label: 'Verificados', color: AtlanTheme.verified),
                      _MapFeatureChip(icon: Icons.hourglass_bottom, label: 'Pendientes', color: AtlanTheme.pending),
                      _MapFeatureChip(icon: Icons.help_outline, label: 'Turísticos', color: AtlanTheme.unclaimed),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Botón de ubicación actual
          Positioned(
            bottom: 24,
            right: 16,
            child: FloatingActionButton(
              heroTag: 'location',
              mini: true,
              backgroundColor: AtlanTheme.surface,
              onPressed: () {
                // TODO: Centrar mapa en ubicación del usuario
              },
              child: const Icon(Icons.my_location, color: AtlanTheme.primary),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapFeatureChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _MapFeatureChip({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: color.withValues(alpha: 0.12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
