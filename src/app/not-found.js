import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#070b14",
        backgroundImage: "radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.08) 0%, transparent 60%)",
        padding: "24px",
        color: "#f8fafc",
        fontFamily: "var(--font-outfit), sans-serif",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "40px 28px",
          borderRadius: "24px",
          background: "rgba(13, 20, 36, 0.7)",
          border: "1px solid rgba(212, 175, 55, 0.25)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
        }}
      >
        {/* Logo / Isotipo */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(7, 11, 20, 0.8))",
            border: "2px solid #D4AF37",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 25px rgba(212, 175, 55, 0.3)",
          }}
        >
          <img
            src="/mapaicono.png"
            alt="Atlan"
            style={{ width: "48px", height: "48px", objectFit: "contain" }}
          />
        </div>

        {/* Indicador de código amigable */}
        <span
          style={{
            fontSize: "14px",
            fontWeight: "700",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#D4AF37",
            padding: "4px 14px",
            borderRadius: "20px",
            background: "rgba(212, 175, 55, 0.12)",
            border: "1px solid rgba(212, 175, 55, 0.3)",
          }}
        >
          Error 404 • Destino No Encontrado
        </span>

        {/* Título principal */}
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "800",
            color: "#ffffff",
            margin: "0",
            lineHeight: "1.2",
          }}
        >
          ¡Ups! Este rincón aún no está en el mapa
        </h1>

        {/* Descripción amigable */}
        <p
          style={{
            fontSize: "15px",
            color: "#94a3b8",
            margin: "0",
            lineHeight: "1.6",
            maxWidth: "400px",
          }}
        >
          La ruta o destino que buscas no existe o ha cambiado de coordenadas en nuestra guía turística de Nicaragua.
        </p>

        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "12px",
            width: "100%",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/"
            style={{
              flex: "1 1 160px",
              padding: "14px 20px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
              color: "#070b14",
              fontWeight: "700",
              fontSize: "15px",
              textDecoration: "none",
              textAlign: "center",
              boxShadow: "0 6px 20px rgba(212, 175, 55, 0.3)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            Volver al Inicio
          </Link>

          <Link
            href="/mapa"
            style={{
              flex: "1 1 160px",
              padding: "14px 20px",
              borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "15px",
              textDecoration: "none",
              textAlign: "center",
              transition: "background 0.2s",
            }}
          >
            Explorar Mapa
          </Link>
        </div>
      </div>
    </main>
  );
}
