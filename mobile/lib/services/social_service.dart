import '../models/publicacion.dart';
import 'supabase_service.dart';

/// Servicio de red social / comunidad
class SocialService {
  SocialService._();

  static final _client = SupabaseService.client;

  /// Obtener feed de publicaciones con datos del autor
  static Future<List<Publicacion>> obtenerFeed({int offset = 0, int limit = 20}) async {
    try {
      final data = await _client
          .from('publicaciones')
          .select('*, perfiles!autor_id(nombre, avatar_url)')
          .order('created_at', ascending: false)
          .range(offset, offset + limit - 1);

      final userId = SupabaseService.auth.currentUser?.id;
      List<int> likedIds = [];

      if (userId != null) {
        final likes = await _client
            .from('likes_social')
            .select('publicacion_id')
            .eq('usuario_id', userId);
        likedIds = (likes as List).map((l) => l['publicacion_id'] as int).toList();
      }

      return (data as List).map((json) {
        final id = json['id'] as int?;
        return Publicacion.fromJson(json, likedByMe: likedIds.contains(id));
      }).toList();
    } catch (e) {
      return [];
    }
  }

  /// Crear nueva publicación
  static Future<bool> crearPublicacion({
    required String contenido,
    String? imagenUrl,
  }) async {
    try {
      final userId = SupabaseService.auth.currentUser?.id;
      if (userId == null) return false;

      await _client.from('publicaciones').insert({
        'autor_id': userId,
        'contenido': contenido,
        'imagen_url': imagenUrl,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Dar / quitar like a una publicación
  static Future<bool> toggleLike(int publicacionId) async {
    try {
      final userId = SupabaseService.auth.currentUser?.id;
      if (userId == null) return false;

      final existing = await _client
          .from('likes_social')
          .select('id')
          .eq('publicacion_id', publicacionId)
          .eq('usuario_id', userId)
          .maybeSingle();

      if (existing != null) {
        await _client.from('likes_social').delete().eq('id', existing['id']);
        return false; // unliked
      } else {
        await _client.from('likes_social').insert({
          'publicacion_id': publicacionId,
          'usuario_id': userId,
        });
        return true; // liked
      }
    } catch (e) {
      return false;
    }
  }

  /// Obtener comentarios de una publicación
  static Future<List<Comentario>> obtenerComentarios(int publicacionId) async {
    try {
      final data = await _client
          .from('comentarios_social')
          .select('*, perfiles!autor_id(nombre, avatar_url)')
          .eq('publicacion_id', publicacionId)
          .order('created_at');
      return (data as List).map((json) => Comentario.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Agregar comentario
  static Future<bool> agregarComentario({
    required int publicacionId,
    required String contenido,
  }) async {
    try {
      final userId = SupabaseService.auth.currentUser?.id;
      if (userId == null) return false;

      await _client.from('comentarios_social').insert({
        'publicacion_id': publicacionId,
        'autor_id': userId,
        'contenido': contenido,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Seguir / dejar de seguir a un usuario
  static Future<bool> toggleSeguir(String targetUserId) async {
    try {
      final userId = SupabaseService.auth.currentUser?.id;
      if (userId == null) return false;

      final existing = await _client
          .from('seguimientos')
          .select('id')
          .eq('seguidor_id', userId)
          .eq('seguido_id', targetUserId)
          .maybeSingle();

      if (existing != null) {
        await _client.from('seguimientos').delete().eq('id', existing['id']);
        return false; // unfollowed
      } else {
        await _client.from('seguimientos').insert({
          'seguidor_id': userId,
          'seguido_id': targetUserId,
        });
        return true; // followed
      }
    } catch (e) {
      return false;
    }
  }

  /// Obtener conteo de seguidores y seguidos
  static Future<Map<String, int>> obtenerConteoSocial(String userId) async {
    try {
      final seguidores = await _client
          .from('seguimientos')
          .select('id')
          .eq('seguido_id', userId);
      final seguidos = await _client
          .from('seguimientos')
          .select('id')
          .eq('seguidor_id', userId);

      return {
        'seguidores': (seguidores as List).length,
        'seguidos': (seguidos as List).length,
      };
    } catch (e) {
      return {'seguidores': 0, 'seguidos': 0};
    }
  }
}
