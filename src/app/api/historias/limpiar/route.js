import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ejecutarLimpieza() {
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    return { error: "Supabase client not configured", deletedCount: 0 };
  }

  const nowIso = new Date().toISOString();

  // 1. Obtener historias vencidas para conocer sus archivos en storage
  const { data: vencidas, error: queryError } = await supabaseAdmin
    .from("historias")
    .select("id, storage_path, miniatura_path")
    .lt("expires_at", nowIso);

  if (queryError) {
    console.error("[Limpiar Historias] Error consultando vencidas:", queryError);
    return { error: queryError.message, deletedCount: 0 };
  }

  if (!vencidas || vencidas.length === 0) {
    return { success: true, deletedCount: 0, filesRemoved: 0 };
  }

  // 2. Recolectar rutas de archivos en atlan-media
  const filesToRemove = [];
  vencidas.forEach((h) => {
    if (h.storage_path) filesToRemove.push(h.storage_path);
    if (h.miniatura_path) filesToRemove.push(h.miniatura_path);
  });

  // 3. Eliminar archivos del bucket atlan-media si hay alguno
  let filesRemovedCount = 0;
  if (filesToRemove.length > 0) {
    try {
      const { data: removeData, error: storageError } = await supabaseAdmin.storage
        .from("atlan-media")
        .remove(filesToRemove);

      if (!storageError && removeData) {
        filesRemovedCount = removeData.length;
      }
    } catch (sErr) {
      console.warn("[Limpiar Historias] Error eliminando archivos de storage:", sErr);
    }
  }

  // 4. Eliminar las filas de la base de datos
  const idsToDelete = vencidas.map((h) => h.id);
  const { error: deleteError } = await supabaseAdmin
    .from("historias")
    .delete()
    .in("id", idsToDelete);

  if (deleteError) {
    console.error("[Limpiar Historias] Error eliminando filas:", deleteError);
    return { error: deleteError.message, deletedCount: 0, filesRemoved: filesRemovedCount };
  }

  return {
    success: true,
    deletedCount: idsToDelete.length,
    filesRemoved: filesRemovedCount,
  };
}

export async function GET(request) {
  // Validación opcional por token CRON_SECRET en cabecera si está configurado
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ejecutarLimpieza();
  return NextResponse.json(result);
}

export async function POST(request) {
  return GET(request);
}
