// Utilidades para manejo y verificación de imágenes
// Equivalente a src/lib/imageUtils.js de la web

/// Verifica si una URL corresponde a una foto o logo personalizado real
/// Filtra y descarta URLs de stock genéricas (Unsplash, rutas locales por defecto)
bool isRealCustomUrl(String? url) {
  if (url == null || url.trim().isEmpty) return false;
  if (url.contains('images.unsplash.com')) return false;
  if (url.contains('/images/departamentos/')) return false;
  return true;
}

/// Resuelve ÚNICAMENTE imágenes o logos reales subidos por un negocio o creador del punto.
/// Si no posee una foto ni logo personalizado real, devuelve null.
String? getCustomPointImage(Map<String, dynamic>? punto, {Map<String, dynamic>? details}) {
  // 1. Fotos del negocio asociadas en el detalle
  if (details != null) {
    final fotos = details['fotos'];
    if (fotos is List && fotos.isNotEmpty) {
      final first = fotos[0] as String?;
      if (isRealCustomUrl(first)) return first;
    }
    // 2. Logo del negocio en el detalle
    if (isRealCustomUrl(details['logo_url'] as String?)) {
      return details['logo_url'] as String;
    }
  }

  if (punto == null) return null;

  // 3. Logo del negocio adjunto en el objeto del punto
  if (isRealCustomUrl(punto['negocio_logo_url'] as String?)) {
    return punto['negocio_logo_url'] as String;
  }
  if (isRealCustomUrl(punto['logo_url'] as String?)) {
    return punto['logo_url'] as String;
  }

  // 4. Fotos del negocio adjuntas en el objeto del punto
  final negFotos = punto['negocio_fotos'];
  if (negFotos is List && negFotos.isNotEmpty) {
    final first = negFotos[0] as String?;
    if (isRealCustomUrl(first)) return first;
  }

  // 5. Imagen/foto del punto subida por usuario
  if (isRealCustomUrl(punto['imagen_url'] as String?)) return punto['imagen_url'] as String;
  if (isRealCustomUrl(punto['imagen'] as String?)) return punto['imagen'] as String;
  if (isRealCustomUrl(punto['foto_url'] as String?)) return punto['foto_url'] as String;

  final fotos = punto['fotos'];
  if (fotos is List && fotos.isNotEmpty) {
    final first = fotos[0] as String?;
    if (isRealCustomUrl(first)) return first;
  }

  return null;
}
