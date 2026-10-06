// Helper para Agora RTC Web SDK (ejecutado solo en el cliente)

let AgoraRTCInstance = null;

export async function getAgoraRTC() {
  if (typeof window === "undefined") return null;
  if (!AgoraRTCInstance) {
    const module = await import("agora-rtc-sdk-ng");
    AgoraRTCInstance = module.default || module;
    // Reducir nivel de logs de Agora en producción
    if (AgoraRTCInstance.setLogLevel) {
      AgoraRTCInstance.setLogLevel(2); // 2 = WARNING
    }
  }
  return AgoraRTCInstance;
}

/**
 * Solicita el token seguro al endpoint de Next.js
 */
export async function fetchLiveToken({ channelName, role = "subscriber", account }) {
  const res = await fetch("/api/live/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelName, role, account }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Error al obtener el token de Agora");
  }
  return data;
}

/**
 * Obtiene la lista de cámaras disponibles (para alternar frontal/trasera en celular)
 */
export async function getAvailableCameras() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput");
  } catch {
    return [];
  }
}
