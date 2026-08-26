import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import '../models/perfil.dart';
import '../services/auth_service.dart';
import '../services/supabase_service.dart';

/// Estado de autenticación global
class AuthState {
  final Session? session;
  final Perfil? perfil;
  final bool loading;

  const AuthState({this.session, this.perfil, this.loading = true});

  bool get isAuthenticated => session != null;
  bool get isAdmin => perfil?.isAdmin ?? false;
  bool get isPropietario => perfil?.isPropietario ?? false;

  AuthState copyWith({Session? session, Perfil? perfil, bool? loading}) {
    return AuthState(
      session: session ?? this.session,
      perfil: perfil ?? this.perfil,
      loading: loading ?? this.loading,
    );
  }
}

/// Notifier de autenticación — equivalente al AuthContext.js de la web
class AuthNotifier extends StateNotifier<AuthState> {
  StreamSubscription? _authSubscription;

  AuthNotifier() : super(const AuthState()) {
    _init();
  }

  Future<void> _init() async {
    // 1. Obtener sesión actual
    final currentSession = SupabaseService.auth.currentSession;
    if (currentSession?.user != null) {
      final perfil = await AuthService.fetchUserProfile(currentSession!.user.id);
      state = AuthState(session: currentSession, perfil: perfil, loading: false);
    } else {
      state = const AuthState(loading: false);
    }

    // 2. Suscribirse a cambios de autenticación en tiempo real
    _authSubscription = SupabaseService.auth.onAuthStateChange.listen((data) async {
      final session = data.session;
      if (session?.user != null) {
        final perfil = await AuthService.fetchUserProfile(session!.user.id);
        state = AuthState(session: session, perfil: perfil, loading: false);
      } else {
        state = const AuthState(loading: false);
      }
    });
  }

  /// Login
  Future<String?> signIn(String email, String password) async {
    try {
      state = state.copyWith(loading: true);
      await AuthService.signIn(email: email, password: password);
      return null; // sin error
    } on AuthException catch (e) {
      state = state.copyWith(loading: false);
      return e.message;
    } catch (e) {
      state = state.copyWith(loading: false);
      return e.toString();
    }
  }

  /// Registro
  Future<String?> signUp(String email, String password, String nombre) async {
    try {
      state = state.copyWith(loading: true);
      await AuthService.signUp(email: email, password: password, nombre: nombre);
      return null;
    } on AuthException catch (e) {
      state = state.copyWith(loading: false);
      return e.message;
    } catch (e) {
      state = state.copyWith(loading: false);
      return e.toString();
    }
  }

  /// Logout
  Future<void> signOut() async {
    await AuthService.signOut();
    state = const AuthState(loading: false);
  }

  /// Refrescar perfil
  Future<void> refreshProfile() async {
    final user = SupabaseService.auth.currentUser;
    if (user != null) {
      final perfil = await AuthService.fetchUserProfile(user.id);
      state = state.copyWith(perfil: perfil);
    }
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
}


/// Provider global de autenticación
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
