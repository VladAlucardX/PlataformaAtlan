import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'services/supabase_service.dart';

/// Punto de entrada de la app Plataforma Atlan Mobile
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  } catch (e) {
    debugPrint("SystemChrome orientations error: $e");
  }

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0A192F),
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  try {
    await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  } catch (e) {
    debugPrint("SystemChrome immersive error: $e");
  }

  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    debugPrint("dotenv load warning: $e");
  }

  try {
    await SupabaseService.initialize();
  } catch (e) {
    debugPrint("SupabaseService initialize warning: $e");
  }

  runApp(
    const ProviderScope(
      child: AtlanApp(),
    ),
  );
}
