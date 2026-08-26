import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/mensaje.dart';
import 'supabase_service.dart';

/// Servicio de mensajería en tiempo real
class ChatService {
  ChatService._();

  static final _client = SupabaseService.client;

  /// Obtener lista de conversaciones del usuario actual
  static Future<List<Conversacion>> obtenerConversaciones() async {
    try {
      final userId = SupabaseService.auth.currentUser?.id;
      if (userId == null) return [];

      final data = await _client
          .from('conversaciones')
          .select('*')
          .or('participante1_id.eq.$userId,participante2_id.eq.$userId')
          .order('ultimo_mensaje_at', ascending: false);

      return (data as List)
          .map((json) => Conversacion.fromJson(json, currentUserId: userId))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Obtener mensajes de una conversación
  static Future<List<Mensaje>> obtenerMensajes(int conversacionId) async {
    try {
      final data = await _client
          .from('mensajes')
          .select('*, perfiles!remitente_id(nombre, avatar_url)')
          .eq('conversacion_id', conversacionId)
          .order('created_at');
      return (data as List).map((json) => Mensaje.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Enviar un mensaje
  static Future<Mensaje?> enviarMensaje({
    required int conversacionId,
    required String contenido,
  }) async {
    try {
      final userId = SupabaseService.auth.currentUser?.id;
      if (userId == null) return null;

      final data = await _client.from('mensajes').insert({
        'conversacion_id': conversacionId,
        'remitente_id': userId,
        'contenido': contenido,
      }).select().single();

      // Actualizar timestamp del último mensaje
      await _client.from('conversaciones').update({
        'ultimo_mensaje': contenido,
        'ultimo_mensaje_at': DateTime.now().toIso8601String(),
      }).eq('id', conversacionId);

      return Mensaje.fromJson(data);
    } catch (e) {
      return null;
    }
  }

  /// Marcar mensajes como leídos
  static Future<void> marcarComoLeidos(int conversacionId) async {
    final userId = SupabaseService.auth.currentUser?.id;
    if (userId == null) return;

    await _client
        .from('mensajes')
        .update({'leido': true})
        .eq('conversacion_id', conversacionId)
        .neq('remitente_id', userId)
        .eq('leido', false);
  }

  /// Suscribirse a mensajes nuevos en tiempo real (Supabase Realtime)
  static RealtimeChannel suscribirMensajes(
    int conversacionId,
    void Function(Mensaje mensaje) onMensaje,
  ) {
    final channel = _client
        .channel('mensajes:$conversacionId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'mensajes',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversacion_id',
            value: conversacionId,
          ),
          callback: (payload) {
            final newRecord = payload.newRecord;
            onMensaje(Mensaje.fromJson(newRecord));
          },
        )
        .subscribe();

    return channel;
  }

  /// Crear o encontrar conversación existente con un usuario
  static Future<int?> crearOEncontrarConversacion(String otroUsuarioId) async {
    try {
      final userId = SupabaseService.auth.currentUser?.id;
      if (userId == null) return null;

      // Buscar conversación existente
      final existing = await _client
          .from('conversaciones')
          .select('id')
          .or('and(participante1_id.eq.$userId,participante2_id.eq.$otroUsuarioId),and(participante1_id.eq.$otroUsuarioId,participante2_id.eq.$userId)')
          .maybeSingle();

      if (existing != null) return existing['id'] as int;

      // Crear nueva conversación
      final data = await _client.from('conversaciones').insert({
        'participante1_id': userId,
        'participante2_id': otroUsuarioId,
      }).select('id').single();

      return data['id'] as int;
    } catch (e) {
      return null;
    }
  }
}
