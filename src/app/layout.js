import "./globals.css";
import ClientProviders from "../components/ClientProviders";
import PWARegister from "../components/PWARegister";
import PWAInstallBanner from "../components/PWAInstallBanner";
import { Inter, Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="es" className={`${outfit.variable} ${inter.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D4AF37" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {/* iOS / Safari PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Atlan" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body suppressHydrationWarning className={`${outfit.variable} ${inter.variable}`}>
        <ClientProviders>
          <PWARegister />
          <PWAInstallBanner />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}


