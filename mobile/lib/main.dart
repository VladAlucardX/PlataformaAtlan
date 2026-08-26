import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'services/supabase_service.dart';

/// Punto de entrada de la app Plataforma Atlan Mobile
void main() async {
  // Asegurar que los bindings de Flutter estén inicializados
  WidgetsFlutterBinding.ensureInitialized();

  // Forzar orientación vertical (portrait)
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Estilo de la barra de estado (transparente, iconos claros)
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0A192F),
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Activar Modo Inmersivo Pegajoso (Immersive Sticky Mode):
  // Oculta la barra de botones de navegación nativos del sistema en móvil.
  // Solo se muestra temporalmente al deslizar hacia arriba desde el borde inferior
  // y vuelve a desaparecer automáticamente tras unos segundos.
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

  // Cargar variables de entorno
  await dotenv.load(fileName: '.env');

  // Inicializar Supabase
  await SupabaseService.initialize();

  // Ejecutar la app con Riverpod
  runApp(
    const ProviderScope(
      child: AtlanApp(),
    ),
  );
}
