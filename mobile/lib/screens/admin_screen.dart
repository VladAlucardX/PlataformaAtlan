import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/negocio.dart';
import '../services/negocio_service.dart';

/// Pantalla de administración — equivalente a /admin de la web
class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  List<Negocio> _pendientes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPendientes();
  }

  Future<void> _loadPendientes() async {
    setState(() => _loading = true);
    final data = await NegocioService.obtenerPendientes();
    if (mounted) setState(() { _pendientes = data; _loading = false; });
  }

  Future<void> _aprobar(int id) async {
    await NegocioService.aprobarNegocio(id);
    _loadPendientes();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Negocio aprobado ✓'), backgroundColor: AtlanTheme.verified),
      );
    }
  }

  Future<void> _rechazar(int id) async {
    final motivo = await showDialog<String>(
      context: context,
      builder: (context) {
        final controller = TextEditingController();
        return AlertDialog(
          backgroundColor: AtlanTheme.surface,
          title: const Text('Rechazar Negocio', style: TextStyle(color: AtlanTheme.textPrimary)),
          content: TextField(
            controller: controller,
            style: const TextStyle(color: AtlanTheme.textPrimary),
            decoration: const InputDecoration(hintText: 'Motivo del rechazo (opcional)'),
            maxLines: 3,
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, controller.text),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
              child: const Text('Rechazar'),
            ),
          ],
        );
      },
    );

    if (motivo != null) {
      await NegocioService.rechazarNegocio(id, motivo: motivo.isNotEmpty ? motivo : null);
      _loadPendientes();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AtlanTheme.background,
      appBar: AppBar(
        title: const Text('Panel Admin'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AtlanTheme.primary))
          : _pendientes.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle_outline, size: 64, color: AtlanTheme.verified),
                      SizedBox(height: 16),
                      Text('No hay solicitudes pendientes', style: TextStyle(color: AtlanTheme.textSecondary, fontSize: 16)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadPendientes,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _pendientes.length,
                    itemBuilder: (context, index) {
                      final neg = _pendientes[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          color: AtlanTheme.card,
                          border: Border.all(color: AtlanTheme.pending.withValues(alpha: 0.3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 48, height: 48,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    color: AtlanTheme.pending.withValues(alpha: 0.12),
                                  ),
                                  child: const Icon(Icons.store, color: AtlanTheme.pending),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(neg.nombre ?? 'Sin nombre', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AtlanTheme.textPrimary)),
                                      Text(neg.categoria ?? '', style: const TextStyle(fontSize: 12, color: AtlanTheme.textMuted)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (neg.descripcion != null) ...[
                              const SizedBox(height: 12),
                              Text(neg.descripcion!, style: const TextStyle(fontSize: 13, color: AtlanTheme.textSecondary), maxLines: 3, overflow: TextOverflow.ellipsis),
                            ],
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () => _rechazar(neg.id!),
                                    icon: const Icon(Icons.close, size: 18),
                                    label: const Text('Rechazar'),
                                    style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent, side: const BorderSide(color: Colors.redAccent)),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () => _aprobar(neg.id!),
                                    icon: const Icon(Icons.check, size: 18),
                                    label: const Text('Aprobar'),
                                    style: ElevatedButton.styleFrom(backgroundColor: AtlanTheme.verified),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
