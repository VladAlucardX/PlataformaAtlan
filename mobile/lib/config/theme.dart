import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Tema premium de Plataforma Atlan
/// Paleta oscura con acentos dorados, azul Atlan y efectos glassmorphism
class AtlanTheme {
  AtlanTheme._();

  // ─── Colores Principales ────────────────────────────────────────
  static const Color background = Color(0xFF070B14);
  static const Color surface = Color(0xFF0D1321);
  static const Color surfaceVariant = Color(0xFF131B2E);
  static const Color card = Color(0xFF0F1729);

  static const Color primary = Color(0xFF146D9E);       // Azul Atlan
  static const Color primaryLight = Color(0xFF1A8FCC);
  static const Color accent = Color(0xFFD4AF37);         // Dorado premium
  static const Color accentLight = Color(0xFFE8C84A);

  static const Color navbar = Color(0xFF0A192F);

  // ─── Estados de verificación ────────────────────────────────────
  static const Color verified = Color(0xFF10B981);       // Verde
  static const Color pending = Color(0xFFF97316);        // Naranja
  static const Color unclaimed = Color(0xFF64748B);      // Gris

  // ─── Texto ──────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB0BEC5);
  static const Color textMuted = Color(0xFF6B7B8D);

  // ─── Neón / Glow ───────────────────────────────────────────────
  static const Color neonBlue = Color(0xFF00D4FF);
  static const Color neonGold = Color(0xFFFFD700);
  static const Color neonGreen = Color(0xFF00FF88);

  // ─── Bordes y Divisores ─────────────────────────────────────────
  static const Color border = Color(0xFF1E2A3A);
  static const Color divider = Color(0xFF1A2332);

  // ─── Gradientes ─────────────────────────────────────────────────
  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0A192F), Color(0xFF070B14)],
  );

  static const LinearGradient goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFD4AF37), Color(0xFFF5D060), Color(0xFFD4AF37)],
  );

  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0F1729), Color(0xFF131B2E)],
  );

  // ─── Sombras ────────────────────────────────────────────────────
  static List<BoxShadow> glowShadow(Color color, {double blur = 20}) => [
    BoxShadow(color: color.withValues(alpha: 0.3), blurRadius: blur, spreadRadius: 2),
  ];

  static List<BoxShadow> get cardShadow => [
    const BoxShadow(
      color: Color(0x40000000),
      blurRadius: 16,
      offset: Offset(0, 4),
    ),
  ];

  // ─── Decoraciones Glassmorphism ─────────────────────────────────
  static BoxDecoration get glassDecoration => BoxDecoration(
    color: surface.withValues(alpha: 0.7),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: border.withValues(alpha: 0.3)),
    boxShadow: cardShadow,
  );

  static BoxDecoration get glassDecorationGold => BoxDecoration(
    color: surface.withValues(alpha: 0.7),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: accent.withValues(alpha: 0.4)),
    boxShadow: glowShadow(accent, blur: 12),
  );

  // ─── Tema Material ──────────────────────────────────────────────
  static ThemeData get darkTheme {
    final textTheme = GoogleFonts.interTextTheme(ThemeData.dark().textTheme);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: accent,
        surface: surface,
        error: Color(0xFFEF4444),
        onPrimary: Colors.white,
        onSecondary: Colors.black,
        onSurface: textPrimary,
        outline: border,
      ),
      textTheme: textTheme.copyWith(
        headlineLarge: textTheme.headlineLarge?.copyWith(
          color: textPrimary,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
        headlineMedium: textTheme.headlineMedium?.copyWith(
          color: textPrimary,
          fontWeight: FontWeight.w700,
        ),
        titleLarge: textTheme.titleLarge?.copyWith(
          color: textPrimary,
          fontWeight: FontWeight.w600,
        ),
        titleMedium: textTheme.titleMedium?.copyWith(
          color: textSecondary,
        ),
        bodyLarge: textTheme.bodyLarge?.copyWith(
          color: textPrimary,
        ),
        bodyMedium: textTheme.bodyMedium?.copyWith(
          color: textSecondary,
        ),
        bodySmall: textTheme.bodySmall?.copyWith(
          color: textMuted,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: navbar,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: textPrimary,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: navbar,
        selectedItemColor: accent,
        unselectedItemColor: textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        labelStyle: const TextStyle(color: textSecondary),
        hintStyle: const TextStyle(color: textMuted),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
          elevation: 4,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: accent,
          side: const BorderSide(color: accent),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: accent,
        foregroundColor: Colors.black,
        elevation: 8,
      ),
      dividerTheme: const DividerThemeData(
        color: divider,
        thickness: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: surfaceVariant,
        contentTextStyle: const TextStyle(color: textPrimary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
    );
  }
}
