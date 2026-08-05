import "./globals.css";
import { LanguageProvider } from "../lib/i18n/LanguageContext";
import PWARegister from "../components/PWARegister";

export const metadata = {
  title: "Atlan — Tu GPS Turístico de Nicaragua",
  description:
    "Descubre Nicaragua con Atlan: navegación GPS con voz, destinos verificados por la comunidad y reservas directas con negocios locales. Tu guía turístico digital.",
  keywords: [
    "Nicaragua",
    "turismo",
    "GPS",
    "navegación",
    "mapa turístico",
    "restaurantes Nicaragua",
    "hoteles Nicaragua",
    "playas Nicaragua",
    "artesanías",
    "reservas",
    "Atlan",
  ],
  authors: [{ name: "Atlan" }],
  creator: "Atlan",
  metadataBase: new URL("https://atlan.com.ni"),
  openGraph: {
    title: "Atlan — Tu GPS Turístico de Nicaragua",
    description:
      "Navega sin límites. Destinos verificados, navegación con voz y reservas directas.",
    siteName: "Atlan",
    locale: "es_NI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlan — Tu GPS Turístico de Nicaragua",
    description:
      "Descubre Nicaragua con navegación GPS, destinos verificados y reservas directas.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFD700" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Atlan" />
      </head>
      <body>
        <LanguageProvider>
          <PWARegister />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

