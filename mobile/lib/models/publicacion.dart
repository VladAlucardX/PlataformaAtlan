/// Modelo de publicación social de Plataforma Atlan
class Publicacion {
  final int? id;
  final String? autorId;
  final String? autorNombre;
  final String? autorAvatar;
  final String? contenido;
  final String? imagenUrl;
  final int likes;
  final int comentarios;
  final bool likedByMe;
  final DateTime? createdAt;

  const Publicacion({
    this.id,
    this.autorId,
    this.autorNombre,
    this.autorAvatar,
    this.contenido,
    this.imagenUrl,
    this.likes = 0,
    this.comentarios = 0,
    this.likedByMe = false,
    this.createdAt,
  });

  factory Publicacion.fromJson(Map<String, dynamic> json, {bool likedByMe = false}) {
    return Publicacion(
      id: json['id'] as int?,
      autorId: json['autor_id'] as String?,
      autorNombre: json['autor_nombre'] as String? ??
          (json['perfiles'] as Map<String, dynamic>?)?['nombre'] as String?,
      autorAvatar: json['autor_avatar'] as String? ??
          (json['perfiles'] as Map<String, dynamic>?)?['avatar_url'] as String?,
      contenido: json['contenido'] as String?,
      imagenUrl: json['imagen_url'] as String?,
      likes: json['likes_count'] as int? ?? json['likes'] as int? ?? 0,
      comentarios: json['comentarios_count'] as int? ?? json['comentarios'] as int? ?? 0,
      likedByMe: likedByMe,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Publicacion copyWith({
    int? likes,
    int? comentarios,
    bool? likedByMe,
  }) {
    return Publicacion(
      id: id,
      autorId: autorId,
      autorNombre: autorNombre,
      autorAvatar: autorAvatar,
      contenido: contenido,
      imagenUrl: imagenUrl,
      likes: likes ?? this.likes,
      comentarios: comentarios ?? this.comentarios,
      likedByMe: likedByMe ?? this.likedByMe,
      createdAt: createdAt,
    );
  }
}

/// Modelo de comentario en publicación
class Comentario {
  final int? id;
  final int? publicacionId;
  final String? autorId;
  final String? autorNombre;
  final String? autorAvatar;
  final String? contenido;
  final DateTime? createdAt;

  const Comentario({
    this.id,
    this.publicacionId,
    this.autorId,
    this.autorNombre,
    this.autorAvatar,
    this.contenido,
    this.createdAt,
  });

  factory Comentario.fromJson(Map<String, dynamic> json) {
    return Comentario(
      id: json['id'] as int?,
      publicacionId: json['publicacion_id'] as int?,
      autorId: json['autor_id'] as String?,
      autorNombre: json['autor_nombre'] as String? ??
          (json['perfiles'] as Map<String, dynamic>?)?['nombre'] as String?,
      autorAvatar: json['autor_avatar'] as String? ??
          (json['perfiles'] as Map<String, dynamic>?)?['avatar_url'] as String?,
      contenido: json['contenido'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }
}
