/// Modelo de negocio de Plataforma Atlan
class Negocio {
  final int? id;
  final String? nombre;
  final String? descripcion;
  final String? categoria;
  final String? direccion;
  final String? telefono;
  final String? whatsapp;
  final String? sitioWeb;
  final String? horario;
  final String? logoUrl;
  final List<String>? fotos;
  final double? latitud;
  final double? longitud;
  final String? departamento;
  final String? propietarioId;
  final bool activo;
  final String? estado; // 'pendiente', 'aprobado', 'rechazado'
  final String? motivoRechazo;
  final DateTime? createdAt;

  const Negocio({
    this.id,
    this.nombre,
    this.descripcion,
    this.categoria,
    this.direccion,
    this.telefono,
    this.whatsapp,
    this.sitioWeb,
    this.horario,
    this.logoUrl,
    this.fotos,
    this.latitud,
    this.longitud,
    this.departamento,
    this.propietarioId,
    this.activo = false,
    this.estado,
    this.motivoRechazo,
    this.createdAt,
  });

  factory Negocio.fromJson(Map<String, dynamic> json) {
    return Negocio(
      id: json['id'] as int?,
      nombre: json['nombre'] as String?,
      descripcion: json['descripcion'] as String?,
      categoria: json['categoria'] as String?,
      direccion: json['direccion'] as String?,
      telefono: json['telefono'] as String?,
      whatsapp: json['whatsapp'] as String?,
      sitioWeb: json['sitio_web'] as String?,
      horario: json['horario'] as String?,
      logoUrl: json['logo_url'] as String?,
      fotos: (json['fotos'] as List<dynamic>?)?.cast<String>(),
      latitud: (json['latitud'] as num?)?.toDouble(),
      longitud: (json['longitud'] as num?)?.toDouble(),
      departamento: json['departamento'] as String?,
      propietarioId: json['propietario_id'] as String?,
      activo: json['activo'] as bool? ?? false,
      estado: json['estado'] as String?,
      motivoRechazo: json['motivo_rechazo'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'nombre': nombre,
    'descripcion': descripcion,
    'categoria': categoria,
    'direccion': direccion,
    'telefono': telefono,
    'whatsapp': whatsapp,
    'sitio_web': sitioWeb,
    'horario': horario,
    'logo_url': logoUrl,
    'fotos': fotos,
    'latitud': latitud,
    'longitud': longitud,
    'departamento': departamento,
    'propietario_id': propietarioId,
    'activo': activo,
    'estado': estado,
    'motivo_rechazo': motivoRechazo,
  };

  bool get isVerificado => activo == true && estado == 'aprobado';
  bool get isPendiente => estado == 'pendiente';
  bool get isRechazado => estado == 'rechazado';
}
