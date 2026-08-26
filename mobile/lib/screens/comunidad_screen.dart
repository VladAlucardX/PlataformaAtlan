import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/theme.dart';
import '../models/publicacion.dart';
import '../services/social_service.dart';
import '../providers/auth_provider.dart';

/// Pantalla de comunidad / red social — equivalente a /comunidad de la web
class ComunidadScreen extends ConsumerStatefulWidget {
  const ComunidadScreen({super.key});

  @override
  ConsumerState<ComunidadScreen> createState() => _ComunidadScreenState();
}

class _ComunidadScreenState extends ConsumerState<ComunidadScreen> {
  List<Publicacion> _publicaciones = [];
  bool _loading = true;
  final _postController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadFeed();
  }

  @override
  void dispose() {
    _postController.dispose();
    super.dispose();
  }

  Future<void> _loadFeed() async {
    setState(() => _loading = true);
    final data = await SocialService.obtenerFeed();
    if (mounted) setState(() { _publicaciones = data; _loading = false; });
  }

  Future<void> _handlePost() async {
    final contenido = _postController.text.trim();
    if (contenido.isEmpty) return;

    final success = await SocialService.crearPublicacion(contenido: contenido);
    if (success) {
      _postController.clear();
      _loadFeed();
    }
  }

  Future<void> _handleLike(int index) async {
    final pub = _publicaciones[index];
    if (pub.id == null) return;

    final liked = await SocialService.toggleLike(pub.id!);
    setState(() {
      _publicaciones[index] = pub.copyWith(
        likedByMe: liked,
        likes: liked ? pub.likes + 1 : pub.likes - 1,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AtlanTheme.background,
      appBar: AppBar(title: const Text('Comunidad')),
      body: Column(
        children: [
          // Crear publicación
          if (auth.isAuthenticated)
            Container(
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(14),
              decoration: AtlanTheme.glassDecoration,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AtlanTheme.surfaceVariant,
                    backgroundImage: auth.perfil?.avatarUrl != null
                        ? NetworkImage(auth.perfil!.avatarUrl!)
                        : null,
                    child: auth.perfil?.avatarUrl == null
                        ? const Icon(Icons.person, size: 18, color: AtlanTheme.textMuted)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _postController,
                      style: const TextStyle(color: AtlanTheme.textPrimary, fontSize: 14),
                      decoration: const InputDecoration(
                        hintText: '¿Qué estás explorando?',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        filled: false,
                        contentPadding: EdgeInsets.zero,
                      ),
                      maxLines: 3,
                      minLines: 1,
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.send_rounded, color: AtlanTheme.primary),
                    onPressed: _handlePost,
                  ),
                ],
              ),
            ),

          // Feed
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AtlanTheme.primary))
                : _publicaciones.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.forum_rounded, size: 64, color: AtlanTheme.textMuted),
                            SizedBox(height: 16),
                            Text('Aún no hay publicaciones', style: TextStyle(color: AtlanTheme.textSecondary)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadFeed,
                        color: AtlanTheme.primary,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          itemCount: _publicaciones.length,
                          itemBuilder: (context, index) {
                            final pub = _publicaciones[index];
                            return _PostCard(
                              publicacion: pub,
                              onLike: () => _handleLike(index),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  final Publicacion publicacion;
  final VoidCallback onLike;

  const _PostCard({required this.publicacion, required this.onLike});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: AtlanTheme.card,
        border: Border.all(color: AtlanTheme.border.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Author
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AtlanTheme.surfaceVariant,
                backgroundImage: publicacion.autorAvatar != null
                    ? NetworkImage(publicacion.autorAvatar!)
                    : null,
                child: publicacion.autorAvatar == null
                    ? const Icon(Icons.person, size: 18, color: AtlanTheme.textMuted)
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      publicacion.autorNombre ?? 'Usuario',
                      style: const TextStyle(fontWeight: FontWeight.w700, color: AtlanTheme.textPrimary, fontSize: 14),
                    ),
                    if (publicacion.createdAt != null)
                      Text(
                        _timeAgo(publicacion.createdAt!),
                        style: const TextStyle(fontSize: 11, color: AtlanTheme.textMuted),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Contenido
          if (publicacion.contenido != null)
            Text(
              publicacion.contenido!,
              style: const TextStyle(color: AtlanTheme.textPrimary, fontSize: 14, height: 1.5),
            ),

          // Imagen
          if (publicacion.imagenUrl != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                publicacion.imagenUrl!,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ],

          const SizedBox(height: 12),
          const Divider(color: AtlanTheme.divider, height: 1),
          const SizedBox(height: 8),

          // Actions
          Row(
            children: [
              InkWell(
                onTap: onLike,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    children: [
                      Icon(
                        publicacion.likedByMe ? Icons.favorite : Icons.favorite_border,
                        size: 20,
                        color: publicacion.likedByMe ? Colors.redAccent : AtlanTheme.textMuted,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${publicacion.likes}',
                        style: TextStyle(
                          color: publicacion.likedByMe ? Colors.redAccent : AtlanTheme.textMuted,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 16),
              InkWell(
                onTap: () {},
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.chat_bubble_outline, size: 18, color: AtlanTheme.textMuted),
                      const SizedBox(width: 6),
                      Text('${publicacion.comentarios}', style: const TextStyle(color: AtlanTheme.textMuted, fontSize: 13)),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.share_outlined, size: 18, color: AtlanTheme.textMuted),
                onPressed: () {},
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Ahora';
    if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes}m';
    if (diff.inHours < 24) return 'Hace ${diff.inHours}h';
    if (diff.inDays < 7) return 'Hace ${diff.inDays}d';
    return '${date.day}/${date.month}/${date.year}';
  }
}
