import '../models/negocio.dart';
import '../models/punto.dart';
import 'supabase_service.dart';

/// Servicio de negocios y puntos turísticos
class NegocioService {
  NegocioService._();

  static final _client = SupabaseService.client;

  /// Buscar puntos cercanos usando la función RPC de Supabase
  /// Equivalente a la llamada RPC 'buscar_puntos_cercanos' de la web
  static Future<List<Punto>> buscarPuntosCercanos({
    required double lat,
    required double lng,
    double radioKm = 50,
  }) async {
    try {
      final data = await _client.rpc('buscar_puntos_cercanos', params: {
        'lat_usuario': lat,
        'lng_usuario': lng,
        'radio_km': radioKm,
      });

      if (data is List) {
        return data.map((json) => Punto.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Obtener todos los puntos turísticos
  static Future<List<Punto>> obtenerTodosLosPuntos() async {
    try {
      final data = await _client
          .from('puntos')
          .select('*')
          .order('nombre');
      return (data as List).map((json) => Punto.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Obtener detalle de un negocio por ID
  static Future<Negocio?> obtenerNegocio(int id) async {
    try {
      final data = await _client
          .from('negocios')
          .select('*')
          .eq('id', id)
          .single();
      return Negocio.fromJson(data);
    } catch (e) {
      return null;
    }
  }

  /// Obtener negocios del usuario actual (para dashboard multi-negocio)
  static Future<List<Negocio>> obtenerMisNegocios(String userId) async {
    try {
      final data = await _client
          .from('negocios')
          .select('*')
          .eq('propietario_id', userId)
          .order('created_at', ascending: false);
      return (data as List).map((json) => Negocio.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Crear o actualizar negocio
  static Future<Negocio?> guardarNegocio(Map<String, dynamic> negocioData) async {
    try {
      final data = await _client
          .from('negocios')
          .upsert(negocioData)
          .select()
          .single();
      return Negocio.fromJson(data);
    } catch (e) {
      return null;
    }
  }

  /// Obtener negocios pendientes de aprobación (para admin)
  static Future<List<Negocio>> obtenerPendientes() async {
    try {
      final data = await _client
          .from('negocios')
          .select('*')
          .eq('estado', 'pendiente')
          .order('created_at', ascending: false);
      return (data as List).map((json) => Negocio.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Aprobar un negocio (admin)
  static Future<void> aprobarNegocio(int id) async {
    await _client.from('negocios').update({
      'estado': 'aprobado',
      'activo': true,
      'motivo_rechazo': null,
    }).eq('id', id);
  }

  /// Rechazar un negocio (admin)
  static Future<void> rechazarNegocio(int id, {String? motivo, bool liberar = false}) async {
    final updates = <String, dynamic>{
      'estado': liberar ? 'liberado' : 'rechazado',
      'activo': false,
      'motivo_rechazo': motivo,
    };
    if (liberar) {
      updates['propietario_id'] = null;
    }
    await _client.from('negocios').update(updates).eq('id', id);
  }

  /// Registrar una visita turística verificada por GPS
  static Future<void> registrarVisita({
    required int puntoId,
    required String usuarioId,
  }) async {
    await _client.rpc('registrar_visita_turista', params: {
      'p_punto_id': puntoId,
      'p_usuario_id': usuarioId,
    });
  }

  /// Obtener ranking de puntos más visitados
  static Future<List<Punto>> obtenerRanking({String? departamento, int limit = 10}) async {
    try {
      var query = _client
          .from('puntos')
          .select('*');

      if (departamento != null && departamento != 'Todos') {
        query = query.eq('departamento', departamento);
      }

      final data = await query
          .order('total_visitas', ascending: false)
          .limit(limit);

      return (data as List).map((json) => Punto.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }
}
