import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;
const DAYS_PER_MONTH = 30;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Verifica que quien llama sea un admin real (token Bearer + rol en perfiles)
async function requireAdmin(request, supabaseAdmin) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: perfil } = await supabaseAdmin
    .from("perfiles")
    .select("id, rol")
    .eq("id", data.user.id)
    .maybeSingle();

  return perfil?.rol === "admin" ? perfil : null;
}

// Suma días al vencimiento vigente (renovar acumula; si ya venció, cuenta desde hoy)
async function extendMembership(supabaseAdmin, usuarioId, days) {
  const { data: perfil } = await supabaseAdmin
    .from("perfiles")
    .select("membresia_vence_en")
    .eq("id", usuarioId)
    .maybeSingle();

  const now = new Date();
  const current = perfil?.membresia_vence_en ? new Date(perfil.membresia_vence_en) : null;
  const inicio = current && current > now ? current : now;
  const vence = new Date(inicio.getTime() + days * DAY_MS);

  const { error } = await supabaseAdmin
    .from("perfiles")
    .update({ membresia_vence_en: vence.toISOString() })
    .eq("id", usuarioId);
  if (error) throw error;

  return { inicio, vence };
}

export async function POST(request) {
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }

  const admin = await requireAdmin(request, supabaseAdmin);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const { action } = body;

  try {
    // Aprobar un comprobante pendiente
    if (action === "aprobar") {
      const { data: m } = await supabaseAdmin
        .from("membresias")
        .select("*")
        .eq("id", body.id)
        .maybeSingle();
      if (!m) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
      if (m.estado !== "pendiente") {
        return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 409 });
      }

      const days = Math.max(1, m.meses || 1) * DAYS_PER_MONTH;
      const { inicio, vence } = await extendMembership(supabaseAdmin, m.usuario_id, days);

      const { error } = await supabaseAdmin
        .from("membresias")
        .update({
          estado: "aprobada",
          dias_otorgados: days,
          inicia_en: inicio.toISOString(),
          vence_en: vence.toISOString(),
          revisado_por: admin.id,
          revisado_en: new Date().toISOString(),
        })
        .eq("id", m.id);
      if (error) throw error;

      return NextResponse.json({ success: true, vence_en: vence.toISOString() });
    }

    // Rechazar un comprobante pendiente
    if (action === "rechazar") {
      const motivo = (body.motivo || "").toString().trim();
      if (!motivo) return NextResponse.json({ error: "Falta el motivo" }, { status: 400 });

      const { error } = await supabaseAdmin
        .from("membresias")
        .update({
          estado: "rechazada",
          motivo_rechazo: motivo,
          revisado_por: admin.id,
          revisado_en: new Date().toISOString(),
        })
        .eq("id", body.id)
        .eq("estado", "pendiente");
      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    // Registrar un pago recibido directamente (sin comprobante) o regalar días
    if (action === "registrar" || action === "cortesia") {
      const usuarioId = body.usuario_id;
      const days =
        action === "cortesia"
          ? Math.min(Math.max(parseInt(body.dias, 10) || 0, 1), 365)
          : Math.max(parseInt(body.meses, 10) || 1, 1) * DAYS_PER_MONTH;
      if (!usuarioId) return NextResponse.json({ error: "Falta el usuario" }, { status: 400 });

      const { data: destino } = await supabaseAdmin
        .from("perfiles")
        .select("id")
        .eq("id", usuarioId)
        .maybeSingle();
      if (!destino) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

      const { inicio, vence } = await extendMembership(supabaseAdmin, usuarioId, days);

      const { error } = await supabaseAdmin.from("membresias").insert({
        usuario_id: usuarioId,
        origen: action === "cortesia" ? "cortesia" : "pago",
        estado: "aprobada",
        monto: action === "cortesia" ? 0 : 6 * Math.round(days / DAYS_PER_MONTH),
        meses: Math.max(1, Math.round(days / DAYS_PER_MONTH)),
        dias_otorgados: days,
        metodo_pago: action === "cortesia" ? "cortesia" : body.metodo_pago || "transferencia",
        referencia: body.referencia || null,
        notas: body.notas || null,
        revisado_por: admin.id,
        revisado_en: new Date().toISOString(),
        inicia_en: inicio.toISOString(),
        vence_en: vence.toISOString(),
      });
      if (error) throw error;

      return NextResponse.json({ success: true, vence_en: vence.toISOString() });
    }

    // Cargar datos administrativos consolidados (pendientes y activos con emails reales de auth.users)
    if (action === "datos_admin") {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const authUsers = authData?.users || [];
      const emailMap = Object.fromEntries(authUsers.map((u) => [u.id, u.email]));

      const { data: pend, error: pendErr } = await supabaseAdmin
        .from("membresias")
        .select("*")
        .eq("estado", "pendiente")
        .order("created_at", { ascending: true });
      if (pendErr) throw pendErr;

      const ids = [...new Set((pend || []).map((p) => p.usuario_id))];
      let perfilesMap = {};
      if (ids.length) {
        const { data: ps } = await supabaseAdmin
          .from("perfiles")
          .select("id, nombre_completo, rol, avatar_url")
          .in("id", ids);
        perfilesMap = Object.fromEntries(
          (ps || []).map((p) => [p.id, { ...p, email: emailMap[p.id] || "" }])
        );
      }

      const { data: act, error: actErr } = await supabaseAdmin
        .from("perfiles")
        .select("id, nombre_completo, rol, avatar_url, membresia_vence_en")
        .gt("membresia_vence_en", new Date().toISOString())
        .order("membresia_vence_en", { ascending: true });
      if (actErr) throw actErr;

      const activosConEmail = (act || []).map((a) => ({
        ...a,
        email: emailMap[a.id] || "",
      }));

      return NextResponse.json({
        pendientes: pend || [],
        perfilesMap,
        activos: activosConEmail,
      });
    }

    // Búsqueda inteligente de usuarios para modal selector
    if (action === "buscar_usuarios") {
      const q = (body.q || "").toString().trim().toLowerCase();
      const rolFiltro = (body.rol || "todos").toString().trim();

      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const authUsers = authData?.users || [];
      const emailMap = Object.fromEntries(authUsers.map((u) => [u.id, u.email]));

      const { data: perfiles, error: perfErr } = await supabaseAdmin
        .from("perfiles")
        .select("id, nombre_completo, rol, avatar_url, membresia_vence_en, created_at")
        .order("created_at", { ascending: false });
      if (perfErr) throw perfErr;

      let merged = (perfiles || []).map((p) => ({
        ...p,
        email: emailMap[p.id] || "",
      }));

      if (rolFiltro && rolFiltro !== "todos") {
        merged = merged.filter((u) => u.rol === rolFiltro);
      }

      if (q) {
        merged = merged.filter(
          (u) =>
            (u.nombre_completo && u.nombre_completo.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q))
        );
      }

      return NextResponse.json({ usuarios: merged.slice(0, 50) });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (err) {
    console.error("[Membresia API]", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
