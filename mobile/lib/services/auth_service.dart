import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/perfil.dart';
import 'supabase_service.dart';

/// Servicio de autenticación de Plataforma Atlan
/// Equivalente a src/lib/AuthContext.js de la web
class AuthService {
  AuthService._();

  static GoTrueClient get _auth => SupabaseService.auth;
  static SupabaseClient get _client => SupabaseService.client;

  /// Usuario actual de Supabase Auth
  static User? get currentUser => _auth.currentUser;

  /// Sesión actual
  static Session? get currentSession => _auth.currentSession;

  /// Stream de cambios de autenticación
  static Stream<AuthState> get onAuthStateChange => _auth.onAuthStateChange;

  /// Iniciar sesión con email y contraseña
  static Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    return await _auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  /// Registrar nuevo usuario
  static Future<AuthResponse> signUp({
    required String email,
    required String password,
    String? nombre,
  }) async {
    final response = await _auth.signUp(
      email: email,
      password: password,
      data: nombre != null ? {'nombre': nombre} : null,
    );

    // Crear perfil en tabla 'perfiles' si el registro fue exitoso
    if (response.user != null) {
      await _client.from('perfiles').upsert({
        'id': response.user!.id,
        'email': email,
        'nombre': nombre ?? email.split('@').first,
        'rol': 'turista',
        'rango': 'Turista',
      });
    }

    return response;
  }

  /// Cerrar sesión
  static Future<void> signOut() async {
    await _auth.signOut();
  }

  /// Obtener perfil del usuario desde tabla 'perfiles'
  static Future<Perfil?> fetchUserProfile(String userId) async {
    try {
      final data = await _client
          .from('perfiles')
          .select('*')
          .eq('id', userId)
          .single();
      return Perfil.fromJson(data);
    } catch (e) {
      return null;
    }
  }

  /// Actualizar perfil del usuario
  static Future<void> updateProfile(String userId, Map<String, dynamic> updates) async {
    await _client.from('perfiles').update(updates).eq('id', userId);
  }

  /// Verificar si el usuario actual es admin
  static Future<bool> isAdmin() async {
    final user = currentUser;
    if (user == null) return false;
    final perfil = await fetchUserProfile(user.id);
    return perfil?.isAdmin ?? false;
  }
}
