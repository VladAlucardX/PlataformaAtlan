import { supabase } from './supabase';
import { uploadMedia } from './storage';

export const STORY_MAX_SECONDS = 30;
export const STORY_MAX_MB = 45;
export const STORY_EMOJIS = ['❤️', '😂', '😮', '🔥', '👏'];

const BUCKET_MARK = '/atlan-media/';

/** Extrae la ruta interna del bucket a partir de la URL pública (para poder borrarla luego). */
export function storagePathFromUrl(url) {
  if (!url) return null;
  const i = url.indexOf(BUCKET_MARK);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + BUCKET_MARK.length).split('?')[0]);
}

/** Lee la duración real del video en segundos. */
export function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;

    const done = (value) => { URL.revokeObjectURL(url); resolve(value); };
    const fail = () => { URL.revokeObjectURL(url); reject(new Error('video_unreadable')); };

    v.onloadedmetadata = () => {
      // Algunas grabaciones (MediaRecorder/webm) reportan Infinity: forzamos el cálculo real.
      if (!isFinite(v.duration)) {
        v.ontimeupdate = () => { v.ontimeupdate = null; done(v.duration); };
        v.currentTime = 1e101;
      } else {
        done(v.duration);
      }
    };
    v.onerror = fail;
    v.src = url;
  });
}

/** Captura un fotograma del video como miniatura JPG. Devuelve null si el navegador no puede. */
export function captureThumbnail(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer = setTimeout(() => finish(null), 5000);

    v.onloadeddata = () => {
      v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
    };
    v.onseeked = () => {
      try {
        const w = 480;
        const h = Math.round((v.videoHeight / v.videoWidth) * w) || 854;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(v, 0, 0, w, h);
        canvas.toBlob((blob) => {
          clearTimeout(timer);
          finish(blob ? new File([blob], 'miniatura.jpg', { type: 'image/jpeg' }) : null);
        }, 'image/jpeg', 0.72);
      } catch {
        clearTimeout(timer);
        finish(null);
      }
    };
    v.onerror = () => { clearTimeout(timer); finish(null); };
    v.src = url;
  });
}

/** Sube el video (y su miniatura) y registra la historia. */
export async function publishStory({ userId, file, duration, texto }) {
  const videoUrl = await uploadMedia(file, 'historias');

  let thumbUrl = null;
  try {
    const thumb = await captureThumbnail(file);
    if (thumb) thumbUrl = await uploadMedia(thumb, 'historias/miniaturas');
  } catch (e) {
    console.warn('[Historias] No se pudo generar la miniatura:', e);
  }

  const { data, error } = await supabase
    .from('historias')
    .insert({
      usuario_id: userId,
      video_url: videoUrl,
      storage_path: storagePathFromUrl(videoUrl),
      miniatura_url: thumbUrl,
      miniatura_path: storagePathFromUrl(thumbUrl),
      duracion_seg: duration ? Math.round(duration * 10) / 10 : null,
      texto: texto?.trim() ? texto.trim().slice(0, 140) : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Tiempo relativo corto para historias. */
export function storyTimeAgo(dateStr, lang) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return lang === 'en' ? 'Now' : lang === 'zh' ? '刚刚' : 'Ahora';
  if (diffMin < 60) return lang === 'en' ? `${diffMin}m` : lang === 'zh' ? `${diffMin}分钟` : `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  return lang === 'en' ? `${h}h` : lang === 'zh' ? `${h}小时` : `${h} h`;
}
