import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration"
import PWAInstallBanner from "@/components/PWAInstallBanner"
import MotionEngine from "@/components/motion/MotionEngine"
import "./globals.css"

export const viewport: Viewport = {
  themeColor: "#f5f4f0",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "En vrai, c'est chaud · cestchaud.fr",
  description: "L'écart à la normale du jour dans 62 villes françaises, les idées reçues démontées, et ce que le GIEC prévoit pour 2050. En toute saison.",
  metadataBase: new URL("https://www.cestchaud.fr"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "cestchaud",
  },
  icons: {
    // Déclarées explicitement : un objet `icons` désactive la détection automatique des fichiers app/icon.*
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "En vrai, c'est chaud · cestchaud.fr",
    description: "L'écart à la normale du jour, les idées reçues démontées, et votre ville en 2050.",
    url: "https://cestchaud.fr",
    siteName: "cestchaud.fr",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og/home.png", width: 1200, height: 630, alt: "En vrai, c'est chaud · cestchaud.fr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "En vrai, c'est chaud · cestchaud.fr",
    description: "L'écart à la normale du jour, les idées reçues démontées, et votre ville en 2050.",
    images: ["/og/home.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="dns-prefetch" href="https://api.open-meteo.com" />
        <link rel="dns-prefetch" href="https://basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://api.resend.com" />
        <meta name="geo.region" content="FR" />
        <meta name="geo.placename" content="France" />
        <meta name="geo.position" content="46.5;2.5" />
        <meta name="ICBM" content="46.5, 2.5" />
      </head>
      <body className="min-h-full">
        {children}
        <MotionEngine />
        <Analytics />
        <ServiceWorkerRegistration />
        <PWAInstallBanner />
      </body>
    </html>
  )
}
