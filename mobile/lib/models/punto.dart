/// Modelo de punto turístico de Plataforma Atlan
class Punto {
  final int? id;
  final String? nombre;
  final String? descripcion;
  final String? categoria;
  final double? latitud;
  final double? longitud;
  final String? imagenUrl;
  final String? departamento;
  final int? totalVisitas;
  final bool activo;

  // Datos del negocio vinculado (si existe) - vienen del RPC buscar_puntos_cercanos
  final int? negocioId;
  final String? negocioNombre;
  final String? negocioLogoUrl;
  final List<String>? negocioFotos;
  final String? negocioEstado; // 'pendiente', 'aprobado', 'rechazado'
  final bool? negocioActivo;

  const Punto({
    this.id,
    this.nombre,
    this.descripcion,
    this.categoria,
    this.latitud,
    this.longitud,
    this.imagenUrl,
    this.departamento,
    this.totalVisitas,
    this.activo = true,
    this.negocioId,
    this.negocioNombre,
    this.negocioLogoUrl,
    this.negocioFotos,
    this.negocioEstado,
    this.negocioActivo,
  });

  factory Punto.fromJson(Map<String, dynamic> json) {
    return Punto(
      id: json['id'] as int?,
      nombre: json['nombre'] as String? ?? json['punto_nombre'] as String?,
      descripcion: json['descripcion'] as String?,
      categoria: json['categoria'] as String?,
      latitud: (json['latitud'] as num?)?.toDouble() ?? (json['lat'] as num?)?.toDouble(),
      longitud: (json['longitud'] as num?)?.toDouble() ?? (json['lng'] as num?)?.toDouble(),
      imagenUrl: json['imagen_url'] as String? ?? json['imagen'] as String?,
      departamento: json['departamento'] as String?,
      totalVisitas: json['total_visitas'] as int? ?? json['visitas'] as int?,
      activo: json['activo'] as bool? ?? true,
      negocioId: json['negocio_id'] as int?,
      negocioNombre: json['negocio_nombre'] as String?,
      negocioLogoUrl: json['negocio_logo_url'] as String? ?? json['logo_url'] as String?,
      negocioFotos: (json['negocio_fotos'] as List<dynamic>?)?.cast<String>(),
      negocioEstado: json['negocio_estado'] as String? ?? json['estado'] as String?,
      negocioActivo: json['negocio_activo'] as bool?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'nombre': nombre,
    'descripcion': descripcion,
    'categoria': categoria,
    'latitud': latitud,
    'longitud': longitud,
    'imagen_url': imagenUrl,
    'departamento': departamento,
    'total_visitas': totalVisitas,
    'activo': activo,
  };

  /// Estado de verificación del punto / negocio vinculado
  String get estadoVerificacion {
    if (negocioActivo == true && negocioEstado == 'aprobado') return 'verificado';
    if (negocioEstado == 'pendiente') return 'pendiente';
    if (negocioId != null) return 'reclamado';
    return 'sin_reclamar';
  }

  bool get isVerificado => estadoVerificacion == 'verificado';
  bool get isPendiente => estadoVerificacion == 'pendiente';
  bool get isSinReclamar => estadoVerificacion == 'sin_reclamar';
}
