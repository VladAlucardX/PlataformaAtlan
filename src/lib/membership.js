// Membresía "Tuani Pro" — fuente única de verdad.
// El `rol` del perfil NO cambia nunca: la membresía se calcula por fecha de vencimiento.

export const MEMBERSHIP_PRICE_USD = 6;
export const MEMBERSHIP_DAYS_PER_MONTH = 30;

// Límites por plan (Infinity = sin límite)
export const PLAN_LIMITS = {
  free: {
    negocios: 1,
    fotosGaleria: 3,
    platosMenu: 10,
    video: false,
    menuQR: false,
    verificado: false,
    destacado: false,
  },
  pro: {
    negocios: 5,
    fotosGaleria: 15,
    platosMenu: Infinity,
    video: true,
    menuQR: true,
    verificado: true,
    destacado: true,
  },
};

/**
 * ¿Tiene membresía real vigente? (fecha de vencimiento en el futuro o rol admin)
 */
export function hasActiveMembership(perfil, now = new Date()) {
  if (perfil?.rol === "admin") return true;
  const vence = perfil?.membresia_vence_en;
  if (!vence) return false;
  const venceDate = new Date(vence);
  return !Number.isNaN(venceDate.getTime()) && venceDate > now;
}

/**
 * ¿Es "Turista Deacachimba" / Miembro Pro?
 * El admin siempre cuenta con membresía permanente activa.
 */
export function isMember(perfil) {
  if (!perfil) return false;
  return Boolean(
    perfil.rol === "admin" ||
      perfil.es_premium ||
      perfil.suscripcion_activa ||
      perfil.es_pago ||
      perfil.rol === "turista_deacachimba" ||
      hasActiveMembership(perfil)
  );
}

/** Límites vigentes según la membresía del perfil (Admin siempre Pro). */
export function getPlanLimits(perfil) {
  return perfil?.rol === "admin" || isMember(perfil) ? PLAN_LIMITS.pro : PLAN_LIMITS.free;
}

/** Días restantes de la membresía vigente (Infinity si es admin, 0 si no hay). */
export function membershipDaysLeft(perfil, now = new Date()) {
  if (perfil?.rol === "admin") return Infinity;
  if (!hasActiveMembership(perfil, now)) return 0;
  return Math.ceil((new Date(perfil.membresia_vence_en) - now) / 86400000);
}

/** Datos de transferencia mostrados en /membresia (editables por variables de entorno). */
export function getPaymentInfo() {
  return {
    banco: process.env.NEXT_PUBLIC_PAGO_BANCO || "Banco Atlan (demo)",
    cuenta: process.env.NEXT_PUBLIC_PAGO_CUENTA || "1000-2345-6789-01",
    titular: process.env.NEXT_PUBLIC_PAGO_TITULAR || "Juan Horacio Lopez",
    moneda: process.env.NEXT_PUBLIC_PAGO_MONEDA || "USD",
  };
}
