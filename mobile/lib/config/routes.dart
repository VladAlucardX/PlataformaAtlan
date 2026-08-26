import 'package:go_router/go_router.dart';
import '../screens/web_view_screen.dart';
import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/registro_screen.dart';
import '../screens/home_screen.dart';
import '../screens/mapa_screen.dart';
import '../screens/perfil_screen.dart';
import '../screens/comunidad_screen.dart';
import '../screens/chat_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/admin_screen.dart';
import '../screens/departamentos_screen.dart';
import '../screens/mas_de_nicaragua_screen.dart';

/// Configuración de rutas con GoRouter
final goRouter = GoRouter(
  initialLocation: '/app',
  routes: [
    // Experiencia Móvil 100% Idéntica (WebView Nativo con GPS)
    GoRoute(
      path: '/app',
      builder: (context, state) => const WebViewScreen(),
    ),

    // Splash / Carga inicial
    GoRoute(
      path: '/',
      builder: (context, state) => const SplashScreen(),
    ),

    // Rutas de componentes Dart nativos (preservados intactos)
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/registro',
      builder: (context, state) => const RegistroScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/mapa',
      builder: (context, state) => const MapaScreen(),
    ),
    GoRoute(
      path: '/comunidad',
      builder: (context, state) => const ComunidadScreen(),
    ),
    GoRoute(
      path: '/chat',
      builder: (context, state) => const ChatScreen(),
    ),
    GoRoute(
      path: '/perfil',
      builder: (context, state) => const PerfilScreen(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/admin',
      builder: (context, state) => const AdminScreen(),
    ),
    GoRoute(
      path: '/departamentos',
      builder: (context, state) => const DepartamentosScreen(),
    ),
    GoRoute(
      path: '/mas-de-nicaragua',
      builder: (context, state) => const MasDeNicaraguaScreen(),
    ),
  ],
);
