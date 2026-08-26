import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';

/// Pantalla principal / Landing — equivalente a page.js (/) de la web
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: AtlanTheme.background,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // ─── Hero Section ──────────────────────────────────────
            Container(
              width: double.infinity,
              height: size.height * 0.55,
              decoration: const BoxDecoration(gradient: AtlanTheme.heroGradient),
              child: SafeArea(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: AtlanTheme.glowShadow(AtlanTheme.accent, blur: 24),
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/logo_atlan.png',
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AtlanTheme.goldGradient),
                            child: const Center(child: Text('A', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.black))),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Título principal
                    const Text(
                      'Descubre Nicaragua.',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: AtlanTheme.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Descubrí lo tuyo, viví lo nuestro.',
                      style: TextStyle(
                        fontSize: 15,
                        color: AtlanTheme.textSecondary.withValues(alpha: 0.8),
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Botones principales (carteles neón estilizados)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Column(
                        children: [
                          // Explorar Mapa
                          _NeonButton(
                            label: '🗺️  Explorar Mapa',
                            color: AtlanTheme.neonBlue,
                            onTap: () => context.go('/mapa'),
                          ),
                          const SizedBox(height: 16),
                          // ¿Tienes un Negocio?
                          _NeonButton(
                            label: '💼  ¿Tienes un Negocio?',
                            color: AtlanTheme.accent,
                            onTap: () {
                              if (auth.isAuthenticated) {
                                context.push('/dashboard');
                              } else {
                                context.push('/login');
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ─── Quick Access Cards ────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Explorar',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AtlanTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Grid de accesos rápidos
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.3,
                    children: [
                      _QuickCard(
                        icon: Icons.map_rounded,
                        title: 'Departamentos',
                        subtitle: '17 departamentos',
                        color: AtlanTheme.primary,
                        onTap: () => context.push('/departamentos'),
                      ),
                      _QuickCard(
                        icon: Icons.menu_book_rounded,
                        title: 'Más de Nicaragua',
                        subtitle: 'Enciclopedia',
                        color: const Color(0xFF9C27B0),
                        onTap: () => context.push('/mas-de-nicaragua'),
                      ),
                      _QuickCard(
                        icon: Icons.people_rounded,
                        title: 'Comunidad',
                        subtitle: 'Red social',
                        color: const Color(0xFFE91E63),
                        onTap: () => context.go('/comunidad'),
                      ),
                      _QuickCard(
                        icon: Icons.emoji_events_rounded,
                        title: 'Ranking',
                        subtitle: 'Top destinos',
                        color: AtlanTheme.accent,
                        onTap: () => context.push('/departamentos'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Bienvenida personalizada
                  if (auth.isAuthenticated && auth.perfil != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: AtlanTheme.glassDecorationGold,
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: AtlanTheme.surfaceVariant,
                            backgroundImage: auth.perfil!.avatarUrl != null
                                ? NetworkImage(auth.perfil!.avatarUrl!)
                                : null,
                            child: auth.perfil!.avatarUrl == null
                                ? const Icon(Icons.person, color: AtlanTheme.textMuted)
                                : null,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '¡Bienvenido, ${auth.perfil!.nombre ?? 'Viajero'}!',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AtlanTheme.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Rango: ${auth.perfil!.rango ?? 'Turista'} 🏅',
                                  style: const TextStyle(color: AtlanTheme.accent, fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Botón estilo neón
class _NeonButton extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _NeonButton({required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withValues(alpha: 0.6), width: 1.5),
            boxShadow: [
              BoxShadow(color: color.withValues(alpha: 0.2), blurRadius: 16, spreadRadius: 1),
            ],
            color: color.withValues(alpha: 0.08),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: color,
              letterSpacing: 1,
            ),
          ),
        ),
      ),
    );
  }
}

/// Tarjeta de acceso rápido
class _QuickCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _QuickCard({required this.icon, required this.title, required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: AtlanTheme.cardGradient,
            border: Border.all(color: AtlanTheme.border.withValues(alpha: 0.4)),
            boxShadow: [BoxShadow(color: color.withValues(alpha: 0.08), blurRadius: 12)],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 32),
              const SizedBox(height: 12),
              Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AtlanTheme.textPrimary)),
              const SizedBox(height: 4),
              Text(subtitle, style: const TextStyle(fontSize: 12, color: AtlanTheme.textMuted)),
            ],
          ),
        ),
      ),
    );
  }
}
