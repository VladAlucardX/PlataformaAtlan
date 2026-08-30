"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function ComunidadPerfilRedirect() {
  const router = useRouter();
  const { session, perfil, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (perfil?.id) {
      router.replace(`/comunidad/perfil/${perfil.id}`);
    } else {
      router.replace("/perfil");
    }
  }, [session, perfil, loading, router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white"
    }}>
      <div style={{ textAlign: "center" }}>
        <div className="spinner" style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(20, 109, 158, 0.12)",
          borderTopColor: "var(--atlan-gold, #FFD700)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px"
        }} />
        <p style={{ fontSize: "14px", color: "#9CA3AF" }}>Redirigiendo a tu perfil...</p>
      </div>
    </div>
  );
}
