import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Pantalla de explorador departamental — equivalente a /departamentos de la web
class DepartamentosScreen extends StatelessWidget {
  const DepartamentosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AtlanTheme.background,
      appBar: AppBar(
        title: const Text('Departamentos'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.map_outlined, size: 64, color: AtlanTheme.primary),
            SizedBox(height: 16),
            Text(
              'Explorador de Departamentos',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AtlanTheme.textPrimary),
            ),
            SizedBox(height: 8),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'Mapa interactivo de los 17 departamentos, ranking de destinos y verificación GPS.',
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
