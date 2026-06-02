import { supabase } from './supabase';

/**
 * Sube un archivo al bucket 'atlan-media' en Supabase Storage
 * @param {File} file - Archivo seleccionado del input de tipo file
 * @param {string} folder - Carpeta destino dentro del bucket (ej: 'logos', 'fotos', 'menu')
 * @returns {Promise<string>} - Retorna la URL pública del archivo subido
 */
export async function uploadMedia(file, folder = 'misc') {
  if (!file) {
    throw new Error('No se proporcionó ningún archivo para subir.');
  }

  try {
    // Generar un nombre único para evitar colisiones
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    
    // Ruta del archivo dentro del bucket
    // Ejemplo: negocios/logos/a1b2c3d4-1622549500000.png
    const filePath = `${folder}/${cleanFileName}`;

    // Subir el archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('atlan-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Obtener la URL pública del archivo subido
    const { data: { publicUrl } } = supabase.storage
      .from('atlan-media')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error al subir medio a Supabase Storage:', error);
    throw error;
  }
}
