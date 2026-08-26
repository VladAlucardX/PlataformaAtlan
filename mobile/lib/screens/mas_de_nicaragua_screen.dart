import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Pantalla de enciclopedia "Más de Nicaragua" — equivalente a /mas-de-nicaragua de la web
class MasDeNicaraguaScreen extends StatelessWidget {
  const MasDeNicaraguaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AtlanTheme.background,
      appBar: AppBar(
        title: const Text('Más de Nicaragua'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.menu_book_rounded, size: 64, color: Color(0xFF9C27B0)),
            SizedBox(height: 16),
            Text(
              'Enciclopedia de Nicaragua',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AtlanTheme.textPrimary),
            ),
            SizedBox(height: 8),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'Historia, Economía, Turismo, Pasatiempos, Lugares y Actividades de cada departamento.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AtlanTheme.textSecondary, fontSize: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
