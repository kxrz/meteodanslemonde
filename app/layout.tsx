import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comme Ailleurs — Comparez la chaleur de votre ville",
  description: "Quand il fait 38°C à Lille, où dans le monde est-ce la normale ? Découvrez les jumeaux climatiques de vos villes françaises.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="antialiased">
      <body className="bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
