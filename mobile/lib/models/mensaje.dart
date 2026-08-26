/// Modelo de mensaje de chat en tiempo real
class Mensaje {
  final int? id;
  final int? conversacionId;
  final String? remitenteId;
  final String? remitenteNombre;
  final String? remitenteAvatar;
  final String? contenido;
  final bool leido;
  final DateTime? createdAt;

  const Mensaje({
    this.id,
    this.conversacionId,
    this.remitenteId,
    this.remitenteNombre,
    this.remitenteAvatar,
    this.contenido,
    this.leido = false,
    this.createdAt,
  });

  factory Mensaje.fromJson(Map<String, dynamic> json) {
    return Mensaje(
      id: json['id'] as int?,
      conversacionId: json['conversacion_id'] as int?,
      remitenteId: json['remitente_id'] as String?,
      remitenteNombre: json['remitente_nombre'] as String? ??
          (json['perfiles'] as Map<String, dynamic>?)?['nombre'] as String?,
      remitenteAvatar: json['remitente_avatar'] as String? ??
          (json['perfiles'] as Map<String, dynamic>?)?['avatar_url'] as String?,
      contenido: json['contenido'] as String?,
      leido: json['leido'] as bool? ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'conversacion_id': conversacionId,
    'remitente_id': remitenteId,
    'contenido': contenido,
  };
}

/// Modelo de conversación
class Conversacion {
  final int? id;
  final String? participante1Id;
  final String? participante2Id;
  final String? otroUsuarioNombre;
  final String? otroUsuarioAvatar;
  final String? ultimoMensaje;
  final DateTime? ultimoMensajeAt;
  final int mensajesNoLeidos;

  const Conversacion({
    this.id,
    this.participante1Id,
    this.participante2Id,
    this.otroUsuarioNombre,
    this.otroUsuarioAvatar,
    this.ultimoMensaje,
    this.ultimoMensajeAt,
    this.mensajesNoLeidos = 0,
  });

  factory Conversacion.fromJson(Map<String, dynamic> json, {String? currentUserId}) {
    return Conversacion(
      id: json['id'] as int?,
      participante1Id: json['participante1_id'] as String?,
      participante2Id: json['participante2_id'] as String?,
      otroUsuarioNombre: json['otro_usuario_nombre'] as String?,
      otroUsuarioAvatar: json['otro_usuario_avatar'] as String?,
      ultimoMensaje: json['ultimo_mensaje'] as String?,
      ultimoMensajeAt: json['ultimo_mensaje_at'] != null
          ? DateTime.tryParse(json['ultimo_mensaje_at'] as String)
          : null,
      mensajesNoLeidos: json['mensajes_no_leidos'] as int? ?? 0,
    );
  }
}
