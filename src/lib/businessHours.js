/**
 * Indica si un negocio está abierto en este momento según su objeto `horarios`.
 * Devuelve `null` si no hay horarios definidos (estado desconocido),
 * `true` si está abierto y `false` si está cerrado.
 */
export const isBusinessOpenNow = (horarios) => {
  if (!horarios || Object.keys(horarios).length === 0) return null;
  const daysEnToEs = { 0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado' };
  const now = new Date();
  const currentDay = daysEnToEs[now.getDay()];
  const diaInfo = horarios[currentDay];
  if (!diaInfo || !diaInfo.abierto) return false;
  if (!diaInfo.apertura || !diaInfo.cierre) return null;
  const [apHour, apMin] = diaInfo.apertura.split(':').map(Number);
  const [ciHour, ciMin] = diaInfo.cierre.split(':').map(Number);
  const apTime = apHour * 60 + apMin;
  const ciTime = ciHour * 60 + ciMin;
  const currTime = now.getHours() * 60 + now.getMinutes();
  if (ciTime < apTime) return currTime >= apTime || currTime <= ciTime;
  return currTime >= apTime && currTime <= ciTime;
};
