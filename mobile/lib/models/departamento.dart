/// Modelo de departamento para la enciclopedia "Más de Nicaragua"
/// Equivalente a la estructura de departamentos-data.js de la web
class Departamento {
  final String nombre;
  final String slug;
  final String region; // 'Pacífico', 'Central', 'Caribe'
  final String cabecera;
  final String extension_;
  final String poblacion;
  final String? apodo;
  final String color; // Color hex del departamento
  final DepartamentoInfo? historia;
  final DepartamentoInfo? economia;
  final DepartamentoInfo? turismo;
  final DepartamentoInfo? pasatiempos;
  final List<LugarDestacado>? lugares;
  final List<String>? actividades;

  const Departamento({
    required this.nombre,
    required this.slug,
    required this.region,
    required this.cabecera,
    required this.extension_,
    required this.poblacion,
    this.apodo,
    required this.color,
    this.historia,
    this.economia,
    this.turismo,
    this.pasatiempos,
    this.lugares,
    this.actividades,
  });

  factory Departamento.fromJson(Map<String, dynamic> json) {
    return Departamento(
      nombre: json['nombre'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      region: json['region'] as String? ?? '',
      cabecera: json['cabecera'] as String? ?? '',
      extension_: json['extension'] as String? ?? '',
      poblacion: json['poblacion'] as String? ?? '',
      apodo: json['apodo'] as String?,
      color: json['color'] as String? ?? '#146D9E',
      historia: json['historia'] != null
          ? DepartamentoInfo.fromJson(json['historia'] as Map<String, dynamic>)
          : null,
      economia: json['economia'] != null
          ? DepartamentoInfo.fromJson(json['economia'] as Map<String, dynamic>)
          : null,
      turismo: json['turismo'] != null
          ? DepartamentoInfo.fromJson(json['turismo'] as Map<String, dynamic>)
          : null,
      pasatiempos: json['pasatiempos'] != null
          ? DepartamentoInfo.fromJson(json['pasatiempos'] as Map<String, dynamic>)
          : null,
      lugares: (json['lugares'] as List<dynamic>?)
          ?.map((e) => LugarDestacado.fromJson(e as Map<String, dynamic>))
          .toList(),
      actividades: (json['actividades'] as List<dynamic>?)?.cast<String>(),
    );
  }
}

class DepartamentoInfo {
  final String? titulo;
  final String? contenido;
  final List<String>? puntos;

  const DepartamentoInfo({this.titulo, this.contenido, this.puntos});

  factory DepartamentoInfo.fromJson(Map<String, dynamic> json) {
    return DepartamentoInfo(
      titulo: json['titulo'] as String?,
      contenido: json['contenido'] as String?,
      puntos: (json['puntos'] as List<dynamic>?)?.cast<String>(),
    );
  }
}

class LugarDestacado {
  final String? nombre;
  final String? descripcion;
  final String? imagenUrl;

  const LugarDestacado({this.nombre, this.descripcion, this.imagenUrl});

  factory LugarDestacado.fromJson(Map<String, dynamic> json) {
    return LugarDestacado(
      nombre: json['nombre'] as String?,
      descripcion: json['descripcion'] as String?,
      imagenUrl: json['imagen_url'] as String?,
    );
  }
}
