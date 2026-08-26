import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/constants.dart';

/// Servicio central de Supabase para la app Atlan
/// Equivalente a src/lib/supabase.js de la web
class SupabaseService {
  SupabaseService._();

  static SupabaseClient get client => Supabase.instance.client;

  /// Inicializa Supabase con las credenciales del .env
  /// Debe llamarse en main.dart antes de runApp()
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      publishableKey: AppConstants.supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
  }

  // ─── Accesos rápidos ──────────────────────────────────────────
  static GoTrueClient get auth => client.auth;
  static SupabaseStorageClient get storage => client.storage;
  static RealtimeClient get realtime => client.realtime;
}
