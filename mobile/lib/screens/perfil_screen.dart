import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';

/// Pantalla de perfil de usuario — equivalente a /perfil de la web
class PerfilScreen extends ConsumerWidget {
  const PerfilScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final perfil = auth.perfil;

    if (!auth.isAuthenticated || perfil == null) {
      return Scaffold(
        backgroundColor: AtlanTheme.background,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.person_off_rounded, size: 64, color: AtlanTheme.textMuted),
              const SizedBox(height: 16),
              const Text('Inicia sesión para ver tu perfil', style: TextStyle(color: AtlanTheme.textSecondary)),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.push('/login'),
                child: const Text('Iniciar Sesión'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AtlanTheme.background,
      body: CustomScrollView(
        slivers: [
          // Header con banner y avatar
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AtlanTheme.navbar,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFF0A192F), AtlanTheme.background],
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      // Avatar
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AtlanTheme.accent, width: 3),
                          boxShadow: AtlanTheme.glowShadow(AtlanTheme.accent, blur: 16),
                        ),
                        child: CircleAvatar(
                          radius: 42,
                          backgroundColor: AtlanTheme.surfaceVariant,
                          backgroundImage: perfil.avatarUrl != null ? NetworkImage(perfil.avatarUrl!) : null,
                          child: perfil.avatarUrl == null
                              ? const Icon(Icons.person, size: 42, color: AtlanTheme.textMuted)
                              : null,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        perfil.nombre ?? 'Viajero',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AtlanTheme.textPrimary),
                      ),
                      if (perfil.bio != null) ...[
                        const SizedBox(height: 4),
                        Text(perfil.bio!, style: const TextStyle(fontSize: 13, color: AtlanTheme.textSecondary)),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, color: Colors.white),
                color: AtlanTheme.surface,
                onSelected: (value) async {
                  if (value == 'logout') {
                    await ref.read(authProvider.notifier).signOut();
                    if (context.mounted) context.go('/login');
                  } else if (value == 'dashboard') {
                    context.push('/dashboard');
                  } else if (value == 'admin') {
                    context.push('/admin');
                  }
                },
                itemBuilder: (context) => [
                  if (perfil.isPropietario || perfil.isAdmin)
                    const PopupMenuItem(value: 'dashboard', child: Text('Mis Negocios', style: TextStyle(color: AtlanTheme.textPrimary))),
                  if (perfil.isAdmin)
                    const PopupMenuItem(value: 'admin', child: Text('Administración', style: TextStyle(color: AtlanTheme.textPrimary))),
                  const PopupMenuItem(value: 'logout', child: Text('Cerrar Sesión', style: TextStyle(color: Colors.redAccent))),
                ],
              ),
            ],
          ),

          // Stats row
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.symmetric(vertical: 20),
              decoration: AtlanTheme.glassDecoration,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _StatItem(label: 'Rango', value: perfil.rango ?? 'Turista', icon: Icons.emoji_events_rounded),
                  Container(width: 1, height: 40, color: AtlanTheme.divider),
                  _StatItem(label: 'Visitas', value: '${perfil.totalVisitas ?? 0}', icon: Icons.visibility_rounded),
                  Container(width: 1, height: 40, color: AtlanTheme.divider),
                  _StatItem(label: 'Rol', value: perfil.rol ?? 'Turista', icon: Icons.badge_rounded),
                ],
              ),
            ),
          ),

          // Menu items
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  _MenuItem(icon: Icons.favorite_rounded, title: 'Favoritos', color: Colors.redAccent, onTap: () {}),
                  _MenuItem(icon: Icons.star_rounded, title: 'Reseñas', color: AtlanTheme.accent, onTap: () {}),
                  _MenuItem(icon: Icons.emoji_events_rounded, title: 'Insignias', color: AtlanTheme.verified, onTap: () {}),
                  _MenuItem(icon: Icons.map_rounded, title: 'Departamentos Visitados', color: AtlanTheme.primary, onTap: () => context.push('/departamentos')),
                  _MenuItem(icon: Icons.menu_book_rounded, title: 'Más de Nicaragua', color: const Color(0xFF9C27B0), onTap: () => context.push('/mas-de-nicaragua')),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatItem({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AtlanTheme.accent, size: 22),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AtlanTheme.textPrimary)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: AtlanTheme.textMuted)),
      ],
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _MenuItem({required this.icon, required this.title, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: AtlanTheme.card,
              border: Border.all(color: AtlanTheme.border.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: color.withValues(alpha: 0.12),
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(child: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AtlanTheme.textPrimary))),
                const Icon(Icons.chevron_right_rounded, color: AtlanTheme.textMuted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
