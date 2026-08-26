/// Modelo de perfil de usuario de Plataforma Atlan
class Perfil {
  final String id;
  final String? nombre;
  final String? email;
  final String? avatarUrl;
  final String? bio;
  final String? rol; // 'turista', 'propietario', 'admin'
  final String? rango; // 'Turista', 'Mochilero', 'Leyenda'
  final int? totalVisitas;
  final DateTime? createdAt;

  const Perfil({
    required this.id,
    this.nombre,
    this.email,
    this.avatarUrl,
    this.bio,
    this.rol,
    this.rango,
    this.totalVisitas,
    this.createdAt,
  });

  factory Perfil.fromJson(Map<String, dynamic> json) {
    return Perfil(
      id: json['id'] as String,
      nombre: json['nombre'] as String?,
      email: json['email'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      bio: json['bio'] as String?,
      rol: json['rol'] as String?,
      rango: json['rango'] as String?,
      totalVisitas: json['total_visitas'] as int?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'nombre': nombre,
    'email': email,
    'avatar_url': avatarUrl,
    'bio': bio,
    'rol': rol,
    'rango': rango,
    'total_visitas': totalVisitas,
  };

  Perfil copyWith({
    String? nombre,
    String? email,
    String? avatarUrl,
    String? bio,
    String? rol,
    String? rango,
    int? totalVisitas,
  }) {
    return Perfil(
      id: id,
      nombre: nombre ?? this.nombre,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      rol: rol ?? this.rol,
      rango: rango ?? this.rango,
      totalVisitas: totalVisitas ?? this.totalVisitas,
      createdAt: createdAt,
    );
  }

  bool get isAdmin => rol == 'admin';
  bool get isPropietario => rol == 'propietario';
}
