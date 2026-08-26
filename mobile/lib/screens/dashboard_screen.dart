import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/theme.dart';
import '../models/negocio.dart';
import '../providers/auth_provider.dart';
import '../services/negocio_service.dart';

/// Pantalla de dashboard para propietarios — equivalente a /dashboard de la web
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  List<Negocio> _negocios = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadNegocios();
  }

  Future<void> _loadNegocios() async {
    final userId = ref.read(authProvider).perfil?.id;
    if (userId == null) return;

    setState(() => _loading = true);
    final data = await NegocioService.obtenerMisNegocios(userId);
    if (mounted) setState(() { _negocios = data; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AtlanTheme.background,
      appBar: AppBar(
        title: const Text('Mis Negocios'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AtlanTheme.primary))
          : _negocios.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.store_rounded, size: 64, color: AtlanTheme.textMuted),
                      const SizedBox(height: 16),
                      const Text('No tienes negocios registrados', style: TextStyle(color: AtlanTheme.textSecondary)),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () { /* TODO: Flujo de reclamar negocio */ },
                        icon: const Icon(Icons.add_business),
                        label: const Text('Registrar Negocio'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadNegocios,
                  color: AtlanTheme.primary,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _negocios.length,
                    itemBuilder: (context, index) {
                      final negocio = _negocios[index];
                      return _NegocioCard(negocio: negocio);
                    },
                  ),
                ),
      floatingActionButton: _negocios.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: () { /* TODO: Registrar otro negocio */ },
              icon: const Icon(Icons.add_business),
              label: const Text('Nuevo'),
            )
          : null,
    );
  }
}

class _NegocioCard extends StatelessWidget {
  final Negocio negocio;

  const _NegocioCard({required this.negocio});

  @override
  Widget build(BuildContext context) {
    final statusColor = negocio.isVerificado
        ? AtlanTheme.verified
        : negocio.isPendiente
            ? AtlanTheme.pending
            : negocio.isRechazado
                ? Colors.redAccent
                : AtlanTheme.unclaimed;
    final statusText = negocio.isVerificado
        ? 'Verificado ✓'
        : negocio.isPendiente
            ? 'Pendiente ⏳'
            : negocio.isRechazado
                ? 'Rechazado'
                : 'Borrador';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: AtlanTheme.card,
        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
        boxShadow: [BoxShadow(color: statusColor.withValues(alpha: 0.08), blurRadius: 12)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status banner
          if (negocio.isPendiente || negocio.isRechazado)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.12),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Icon(
                    negocio.isPendiente ? Icons.hourglass_bottom : Icons.info_outline,
                    size: 18,
                    color: statusColor,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      negocio.isPendiente
                          ? 'Tu negocio está pendiente de verificación presencial.'
                          : 'Reclamo rechazado: ${negocio.motivoRechazo ?? "Sin detalles"}',
                      style: TextStyle(fontSize: 12, color: statusColor, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Logo
                Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: AtlanTheme.surfaceVariant,
                    border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                  ),
                  child: negocio.logoUrl != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(negocio.logoUrl!, fit: BoxFit.cover),
                        )
                      : Icon(Icons.store, color: statusColor, size: 28),
                ),
                const SizedBox(width: 14),

                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        negocio.nombre ?? 'Sin nombre',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AtlanTheme.textPrimary),
                      ),
                      const SizedBox(height: 4),
                      Text(negocio.categoria ?? '', style: const TextStyle(fontSize: 12, color: AtlanTheme.textMuted)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          color: statusColor.withValues(alpha: 0.12),
                        ),
                        child: Text(statusText, style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                ),

                // Edit button
                IconButton(
                  icon: const Icon(Icons.edit_rounded, color: AtlanTheme.primary),
                  onPressed: () { /* TODO: Editar negocio */ },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
