"use client";

import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/AuthContext";

/**
 * ClientProviders — Envuelve la app con todos los providers client-side.
 * Necesario porque layout.js es un Server Component y no puede usar "use client".
 */
export default function ClientProviders({ children }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LanguageProvider>
  );
}
