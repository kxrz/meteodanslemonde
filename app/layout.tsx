import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "En vrai, c'est chaud — cestchaud.fr",
  description: "Quand Bordeaux atteint 34°C, où dans le monde est-ce la normale ? Jumeaux climatiques et projections GIEC.",
  metadataBase: new URL("https://cestchaud.fr"),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full">{children}</body>
    </html>
  )
}
