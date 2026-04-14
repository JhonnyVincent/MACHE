import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mache",
  description: "Marketplace internationale centrée sur Haïti, la Caraïbe et la diaspora."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
