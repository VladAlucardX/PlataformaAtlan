import 'dart:io';
import '../config/constants.dart';
import 'supabase_service.dart';

/// Servicio de almacenamiento de medios en Supabase Storage
/// Equivalente a src/lib/storage.js de la web
class StorageService {
  StorageService._();

  /// Sube un archivo al bucket 'atlan-media' en Supabase Storage
  /// [file] - Archivo local seleccionado
  /// [folder] - Carpeta destino (ej: 'logos', 'fotos', 'menu')
  /// Retorna la URL pública del archivo subido
  static Future<String> uploadMedia(File file, {String folder = 'misc'}) async {
    final fileName = file.path.split(RegExp(r'[/\\]')).last;
    final ext = fileName.contains('.') ? fileName.split('.').last : 'jpg';
    final uniqueName = '${DateTime.now().millisecondsSinceEpoch}_${file.path.hashCode}.$ext';
    final filePath = '$folder/$uniqueName';

    await SupabaseService.client.storage
        .from(AppConstants.storageBucket)
        .upload(filePath, file);

    final publicUrl = SupabaseService.client.storage
        .from(AppConstants.storageBucket)
        .getPublicUrl(filePath);

    return publicUrl;
  }

  /// Elimina un archivo del bucket por su ruta
  static Future<void> deleteMedia(String filePath) async {
    await SupabaseService.client.storage
        .from(AppConstants.storageBucket)
        .remove([filePath]);
  }
}
