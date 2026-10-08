"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Capturar el evento de instalación nativo para usarlo a demanda desde el menú
      const handleBeforeInstall = (e) => {
        e.preventDefault();
        window.__pwaInstallPrompt = e;
        window.dispatchEvent(new Event("pwa-prompt-available"));
      };

      const handleAppInstalled = () => {
        window.__pwaInstallPrompt = null;
        window.__pwaIsInstalled = true;
        window.dispatchEvent(new Event("pwa-installed"));
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      window.addEventListener("appinstalled", handleAppInstalled);

      // Registrar el service worker en el evento load
      if ("serviceWorker" in navigator) {
        const registerSW = async () => {
          try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            console.log("[Atlan PWA] Service Worker registrado exitosamente:", registration.scope);
          } catch (error) {
            console.error("[Atlan PWA] Error al registrar el Service Worker:", error);
          }
        };

        if (document.readyState === "complete") {
          registerSW();
        } else {
          window.addEventListener("load", registerSW);
        }
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  return null;
}
