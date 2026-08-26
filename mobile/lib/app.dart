import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'config/theme.dart';
import 'config/routes.dart';

/// Widget raíz de la aplicación Plataforma Atlan Mobile
class AtlanApp extends StatelessWidget {
  const AtlanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Atlan Nicaragua',
      debugShowCheckedModeBanner: false,
      theme: AtlanTheme.darkTheme,
      routerConfig: goRouter,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('es'), // Español
        Locale('en'), // English
      ],
      locale: const Locale('es'),
    );
  }
}
