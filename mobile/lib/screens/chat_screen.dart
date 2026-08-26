import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/mensaje.dart';
import '../services/chat_service.dart';

/// Pantalla de chat / mensajería — equivalente a /chat de la web
class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<Conversacion> _conversaciones = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadConversaciones();
  }

  Future<void> _loadConversaciones() async {
    setState(() => _loading = true);
    final data = await ChatService.obtenerConversaciones();
    if (mounted) setState(() { _conversaciones = data; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AtlanTheme.background,
      appBar: AppBar(title: const Text('Mensajes')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AtlanTheme.primary))
          : _conversaciones.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.chat_bubble_outline_rounded, size: 64, color: AtlanTheme.textMuted.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      const Text('No hay conversaciones', style: TextStyle(color: AtlanTheme.textSecondary, fontSize: 16)),
                      const SizedBox(height: 8),
                      Text('Inicia un chat desde el perfil de otro usuario', style: TextStyle(color: AtlanTheme.textMuted.withValues(alpha: 0.7), fontSize: 13)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadConversaciones,
                  color: AtlanTheme.primary,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _conversaciones.length,
                    separatorBuilder: (_, __) => const Divider(color: AtlanTheme.divider, height: 1, indent: 72),
                    itemBuilder: (context, index) {
                      final conv = _conversaciones[index];
                      return _ConversacionTile(
                        conversacion: conv,
                        onTap: () {
                          // TODO: Abrir chat individual
                        },
                      );
                    },
                  ),
                ),
    );
  }
}

class _ConversacionTile extends StatelessWidget {
  final Conversacion conversacion;
  final VoidCallback onTap;

  const _ConversacionTile({required this.conversacion, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final hasUnread = conversacion.mensajesNoLeidos > 0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: AtlanTheme.surfaceVariant,
                backgroundImage: conversacion.otroUsuarioAvatar != null
                    ? NetworkImage(conversacion.otroUsuarioAvatar!)
                    : null,
                child: conversacion.otroUsuarioAvatar == null
                    ? const Icon(Icons.person, color: AtlanTheme.textMuted)
                    : null,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      conversacion.otroUsuarioNombre ?? 'Usuario',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: hasUnread ? FontWeight.w800 : FontWeight.w600,
                        color: AtlanTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      conversacion.ultimoMensaje ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        color: hasUnread ? AtlanTheme.textSecondary : AtlanTheme.textMuted,
                        fontWeight: hasUnread ? FontWeight.w500 : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              if (hasUnread) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AtlanTheme.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${conversacion.mensajesNoLeidos}',
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
